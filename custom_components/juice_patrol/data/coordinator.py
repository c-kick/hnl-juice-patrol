"""DataUpdateCoordinator for Juice Patrol."""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Callable
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from ..const import (
    BATTERY_STATE_VALUES,
    CONF_LOW_THRESHOLD,
    CONF_STALE_TIMEOUT,
    DEFAULT_LOW_THRESHOLD,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_STALE_TIMEOUT,
    DOMAIN,
)
from homeassistant.helpers import device_registry as dr, entity_registry as er

from ..discovery import (
    BATTERY_ATTRIBUTES,
    DiscoveredBattery,
    SourceType,
    async_discover_batteries,
    parse_battery_level,
)
from ..modules import ModuleRegistry
from .store import JuicePatrolStore

_LOGGER = logging.getLogger(__name__)

# Minimum interval between WS-triggered refreshes (seconds)
_WS_REFRESH_MIN_INTERVAL = 5.0

class JuicePatrolCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Coordinator that manages battery discovery, tracking, and state."""

    config_entry: ConfigEntry

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=DEFAULT_SCAN_INTERVAL),
        )
        self.config_entry = entry
        self.store = JuicePatrolStore(hass)
        self.registry = ModuleRegistry(self)
        self.discovered: dict[str, DiscoveredBattery] = {}
        self._tracked_entities: set[str] = set()
        self._unsub_state_listener: CALLBACK_TYPE | None = None
        self._last_known_levels: dict[str, float] = {}
        self._pending_rebuilds: dict[str, asyncio.Task] = {}
        self._last_ws_refresh: float = 0.0
        self._new_device_callbacks: list[
            Callable[[list[str]], None]
        ] = []
        self._unsub_entity_listener: CALLBACK_TYPE | None = None
        self._discovery_debounce_task: asyncio.Task | None = None
        self._sibling_to_source: dict[str, str] = {}
        self._source_to_sibling: dict[str, str] = {}
        self._initial_build_done = asyncio.Event()

        # Generic data-update hooks (modules subscribe via these)
        self._on_entity_updated: list[Callable[[str, dict[str, Any]], None]] = []
        self._on_full_update: list[Callable[[dict[str, Any]], None]] = []

    def async_register_new_device_callback(
        self, cb: Callable[[list[str]], None]
    ) -> None:
        self._new_device_callbacks.append(cb)

    @callback
    def async_on_entity_updated(
        self, cb: Callable[[str, dict[str, Any]], None]
    ) -> Callable[[], None]:
        """Register a callback for single-entity rebuilds. Returns unsub."""
        self._on_entity_updated.append(cb)

        def _unsub() -> None:
            self._on_entity_updated.remove(cb)

        return _unsub

    @callback
    def async_on_full_update(
        self, cb: Callable[[dict[str, Any]], None]
    ) -> Callable[[], None]:
        """Register a callback for full data builds. Returns unsub."""
        self._on_full_update.append(cb)

        def _unsub() -> None:
            self._on_full_update.remove(cb)

        return _unsub

    def get_sibling_battery_state(self, entity_id: str) -> str | None:
        """Return the current state of the charging-state sibling, if any."""
        sibling_id = self._source_to_sibling.get(entity_id)
        if sibling_id is None:
            return None
        state = self.hass.states.get(sibling_id)
        if state and state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN, None):
            return state.state
        return None

    @property
    def low_threshold(self) -> int:
        return self.config_entry.options.get(
            CONF_LOW_THRESHOLD, DEFAULT_LOW_THRESHOLD
        )

    @property
    def stale_timeout_hours(self) -> int:
        return self.config_entry.options.get(
            CONF_STALE_TIMEOUT, DEFAULT_STALE_TIMEOUT
        )

    async def async_setup(self) -> None:
        """Set up the coordinator: load store, init modules, start discovery."""
        await self.store.async_load()
        await self.registry.async_setup_all()
        self._unsub_entity_listener = self.hass.bus.async_listen(
            er.EVENT_ENTITY_REGISTRY_UPDATED,
            self._handle_entity_registry_update,
        )

    @callback
    def _handle_entity_registry_update(self, event: Event) -> None:
        if event.data.get("action") not in ("create", "update"):
            return
        if self._discovery_debounce_task and not self._discovery_debounce_task.done():
            self._discovery_debounce_task.cancel()
        self._discovery_debounce_task = self.hass.async_create_task(
            self._async_debounced_rediscovery()
        )

    async def _async_debounced_rediscovery(self) -> None:
        await asyncio.sleep(5)
        try:
            await self.async_request_refresh()
        except Exception:
            _LOGGER.debug("Debounced rediscovery failed", exc_info=True)

    async def _async_update_data(self) -> dict[str, Any]:
        await self._async_discover_and_subscribe()
        await self.store.async_save()
        result = await self._async_build_full_data()
        self._initial_build_done.set()
        return result

    async def _async_discover_and_subscribe(self) -> None:
        ignored = self.store.get_ignored_entities()
        batteries = await async_discover_batteries(self.hass, ignored)

        old_entity_ids = set(self.discovered.keys())
        self.discovered = {b.entity_id: b for b in batteries}
        new_entity_ids = set(self.discovered.keys())

        for battery in batteries:
            self.store.ensure_device(
                battery.entity_id,
                device_id=battery.device_id,
            )

        # Discover sibling battery-state entities by checking current state
        # values — NOT by matching entity_id substrings (locale-dependent).
        self._sibling_to_source = {}
        self._source_to_sibling = {}
        ent_reg = er.async_get(self.hass)
        for battery in batteries:
            if not battery.device_id:
                continue
            for entry in er.async_entries_for_device(ent_reg, battery.device_id):
                if entry.entity_id == battery.entity_id:
                    continue
                sibling_state = self.hass.states.get(entry.entity_id)
                if (
                    sibling_state is not None
                    and sibling_state.state not in (
                        STATE_UNAVAILABLE, STATE_UNKNOWN, None
                    )
                    and sibling_state.state.lower().replace(" ", "_")
                    in BATTERY_STATE_VALUES
                ):
                    self._sibling_to_source[entry.entity_id] = battery.entity_id
                    self._source_to_sibling[battery.entity_id] = entry.entity_id

        # Replace state listener with one covering all entities
        if self._unsub_state_listener:
            self._unsub_state_listener()
            self._unsub_state_listener = None

        tracked = list(new_entity_ids | set(self._sibling_to_source))
        if tracked:
            self._unsub_state_listener = async_track_state_change_event(
                self.hass,
                tracked,
                self._handle_state_change,
            )
        self._tracked_entities = new_entity_ids

        # Notify platforms about newly discovered devices
        truly_new = new_entity_ids - old_entity_ids
        if truly_new and self._new_device_callbacks:
            for cb in self._new_device_callbacks:
                cb(list(truly_new))

        # Clean up in-memory tracking for disappeared entities
        disappeared = old_entity_ids - new_entity_ids
        for entity_id in disappeared:
            self._last_known_levels.pop(entity_id, None)
            self.registry.on_entity_disappeared(entity_id)

        # Clean up devices for entities that have disappeared
        if disappeared:
            identifiers_to_remove: dict[str, list[str]] = {}
            for entity_id in disappeared:
                dev_data = self.store.get_device(entity_id)
                identifier = (
                    dev_data.device_id
                    if dev_data and dev_data.device_id
                    else entity_id
                )
                identifiers_to_remove.setdefault(identifier, []).append(entity_id)

            dev_reg = dr.async_get(self.hass)
            for identifier, entity_ids in identifiers_to_remove.items():
                device = dev_reg.async_get_device(
                    identifiers={(DOMAIN, identifier)}
                )
                if device:
                    dev_reg.async_update_device(
                        device.id,
                        remove_config_entry_id=self.config_entry.entry_id,
                    )
                    _LOGGER.info(
                        "Removed stale device for disappeared entities %s",
                        entity_ids,
                    )

    @callback
    def _handle_state_change(self, event: Event) -> None:
        entity_id = event.data.get("entity_id", "")
        new_state = event.data.get("new_state")

        if new_state is None:
            return

        state_value = new_state.state
        if state_value in (STATE_UNAVAILABLE, STATE_UNKNOWN, None):
            return

        # Sibling battery_state entity changed → rebuild the source entity
        source_id = self._sibling_to_source.get(entity_id)
        if source_id is not None:
            old_state = event.data.get("old_state")
            old_value = old_state.state if old_state else None
            if state_value != old_value:
                battery = self.discovered.get(source_id)
                if battery is not None:
                    existing_task = self._pending_rebuilds.pop(source_id, None)
                    if existing_task and not existing_task.done():
                        existing_task.cancel()
                    task = self.hass.async_create_task(
                        self._async_rebuild_entity(source_id, battery)
                    )
                    self._pending_rebuilds[source_id] = task
            return

        battery = self.discovered.get(entity_id)
        if battery is None:
            return

        level: float | None = None
        if battery.source_type == SourceType.DEVICE_CLASS_SENSOR:
            try:
                level = float(state_value)
            except (ValueError, TypeError):
                return
        elif battery.source_type == SourceType.ATTRIBUTE_BATTERY_LEVEL:
            attrs = new_state.attributes
            for attr_name in BATTERY_ATTRIBUTES:
                if attr_name in attrs:
                    level = parse_battery_level(attrs[attr_name])
                    if level is not None:
                        break

        if level is None or not (0 <= level <= 100):
            return

        old_level = self._last_known_levels.get(entity_id)
        self._last_known_levels[entity_id] = level
        battery.current_level = level

        if level == old_level:
            return

        existing_task = self._pending_rebuilds.pop(entity_id, None)
        if existing_task and not existing_task.done():
            existing_task.cancel()

        task = self.hass.async_create_task(
            self._async_rebuild_entity(entity_id, battery)
        )
        self._pending_rebuilds[entity_id] = task

    async def _async_rebuild_entity(
        self, entity_id: str, battery: DiscoveredBattery
    ) -> None:
        entity_data = await self._async_build_entity_data(entity_id, battery)
        prev = self.data.get(entity_id) if self.data else None

        if prev is not None and not self._is_significant_change(prev, entity_data):
            return

        data = dict(self.data) if self.data else {}
        data[entity_id] = entity_data

        # Notify subscribers (e.g. monitoring module for event firing)
        for cb in self._on_entity_updated:
            cb(entity_id, entity_data)

        self.async_set_updated_data(data)

    @staticmethod
    def _is_significant_change(
        old: dict[str, Any], new: dict[str, Any]
    ) -> bool:
        for key in ("is_low", "is_stale", "charging_state"):
            if old.get(key) != new.get(key):
                return True
        old_level = old.get("level")
        new_level = new.get("level")
        if old_level is None or new_level is None:
            if old_level != new_level:
                return True
        elif abs(new_level - old_level) > 1:
            return True
        return False

    async def _async_build_entity_data(
        self, entity_id: str, battery: DiscoveredBattery
    ) -> dict[str, Any]:
        """Build the data dict for a single entity — core fields + module enrichment."""
        device_data = self.store.get_device(entity_id)
        base_data: dict[str, Any] = {
            "level": battery.current_level,
            "device_name": battery.device_name,
            "device_id": battery.device_id,
            "source_type": battery.source_type,
            "platform": battery.platform,
            "manufacturer": battery.manufacturer,
            "model": battery.model,
            "last_calculated": time.time(),
        }
        return self.registry.enrich_entity_data(
            entity_id, battery, base_data, device_data
        )

    async def _async_build_full_data(self) -> dict[str, Any]:
        data: dict[str, Any] = {}
        failed_count = 0
        for entity_id, battery in self.discovered.items():
            try:
                data[entity_id] = await self._async_build_entity_data(
                    entity_id, battery
                )
            except Exception:
                _LOGGER.warning(
                    "Failed to build data for %s", entity_id, exc_info=True
                )
                failed_count += 1
                continue

        if failed_count:
            _LOGGER.warning(
                "Partial data build: %d/%d entities failed",
                failed_count,
                len(self.discovered),
            )

        # Notify subscribers (e.g. monitoring module for event firing)
        for cb in self._on_full_update:
            cb(data)

        return data

    def try_claim_refresh(self) -> bool:
        now = time.monotonic()
        if (now - self._last_ws_refresh) < _WS_REFRESH_MIN_INTERVAL:
            return False
        self._last_ws_refresh = now
        return True

    async def async_manual_refresh(self) -> None:
        await self.async_request_refresh()

    async def async_shutdown(self) -> None:
        if self._unsub_state_listener:
            self._unsub_state_listener()
            self._unsub_state_listener = None
        if self._unsub_entity_listener:
            self._unsub_entity_listener()
            self._unsub_entity_listener = None
        if self._discovery_debounce_task and not self._discovery_debounce_task.done():
            self._discovery_debounce_task.cancel()
            self._discovery_debounce_task = None
        for task in self._pending_rebuilds.values():
            if not task.done():
                task.cancel()
        self._pending_rebuilds.clear()
        self._new_device_callbacks.clear()
        await self.registry.async_teardown_all()
        self._on_entity_updated.clear()
        self._on_full_update.clear()
        await self.store.async_save()
        await super().async_shutdown()
