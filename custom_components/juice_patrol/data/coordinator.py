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
    CONF_LOW_THRESHOLD,
    CONF_STALE_TIMEOUT,
    DEFAULT_LOW_THRESHOLD,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_STALE_TIMEOUT,
    DOMAIN,
    REPLACEMENT_LOW_MULTIPLIER,
    EVENT_BATTERY_LOW,
    EVENT_DEVICE_REPLACED,
    EVENT_DEVICE_STALE,
)
from homeassistant.helpers import device_registry as dr, entity_registry as er

from ..discovery import (
    BATTERY_ATTRIBUTES,
    DiscoveredBattery,
    SourceType,
    async_discover_batteries,
    parse_battery_level,
)
from .battery_types import BatteryTypeResolver
from .store import JuicePatrolStore

_LOGGER = logging.getLogger(__name__)

# Minimum interval between WS-triggered refreshes (seconds)
_WS_REFRESH_MIN_INTERVAL = 5.0


class JuicePatrolCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Coordinator that manages battery discovery, tracking, and state."""

    config_entry: ConfigEntry

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=DEFAULT_SCAN_INTERVAL),
        )
        self.config_entry = entry
        self.store = JuicePatrolStore(hass)
        self.type_resolver = BatteryTypeResolver(hass)
        self.discovered: dict[str, DiscoveredBattery] = {}
        self._tracked_entities: set[str] = set()
        self._unsub_state_listener: CALLBACK_TYPE | None = None
        self._last_known_levels: dict[str, float] = {}
        # Event dedup: track which entities have had events fired
        self._fired_low: set[str] = set()
        self._fired_stale: set[str] = set()
        self._first_full_build = True
        # Debounce: pending rebuild tasks per entity (cancel-on-supersede)
        self._pending_rebuilds: dict[str, asyncio.Task] = {}
        # WS refresh throttle (per-coordinator, not module-level)
        self._last_ws_refresh: float = 0.0
        # Callback for dynamic entity creation
        self._new_device_callbacks: list[
            Callable[[list[str]], None]
        ] = []
        # Entity registry listener for real-time new device discovery
        self._unsub_entity_listener: CALLBACK_TYPE | None = None
        self._discovery_debounce_task: asyncio.Task | None = None
        # Maps sibling battery_state entity IDs → source entity IDs
        self._sibling_to_source: dict[str, str] = {}
        # First refresh: skip recorder queries to avoid bootstrap timeout

        # Signals when the initial data build completes
        self._initial_build_done = asyncio.Event()

    def async_register_new_device_callback(
        self, cb: Callable[[list[str]], None]
    ) -> None:
        """Register a callback for when new devices are discovered."""
        self._new_device_callbacks.append(cb)

    @property
    def low_threshold(self) -> int:
        """Get the configured low battery threshold."""
        return self.config_entry.options.get(
            CONF_LOW_THRESHOLD, DEFAULT_LOW_THRESHOLD
        )

    @property
    def stale_timeout_hours(self) -> int:
        """Get the configured stale timeout in hours."""
        return self.config_entry.options.get(
            CONF_STALE_TIMEOUT, DEFAULT_STALE_TIMEOUT
        )

    async def async_setup(self) -> None:
        """Set up the coordinator: load store and run initial discovery."""
        await self.store.async_load()
        # Fetch Battery Notes library in background
        self.hass.async_create_task(self.type_resolver.async_load_library())
        # Listen for new entities to discover battery devices promptly
        self._unsub_entity_listener = self.hass.bus.async_listen(
            er.EVENT_ENTITY_REGISTRY_UPDATED,
            self._handle_entity_registry_update,
        )

    @callback
    def _handle_entity_registry_update(self, event: Event) -> None:
        """Handle entity registry changes — trigger re-discovery for new entities."""
        if event.data.get("action") not in ("create", "update"):
            return
        if self._discovery_debounce_task and not self._discovery_debounce_task.done():
            self._discovery_debounce_task.cancel()
        self._discovery_debounce_task = self.hass.async_create_task(
            self._async_debounced_rediscovery()
        )

    async def _async_debounced_rediscovery(self) -> None:
        """Wait briefly to batch rapid entity registrations, then re-discover."""
        await asyncio.sleep(5)
        try:
            await self.async_request_refresh()
        except Exception:
            _LOGGER.debug("Debounced rediscovery failed", exc_info=True)

    async def _async_update_data(self) -> dict[str, Any]:
        """Periodic update: re-discover devices and save store."""
        await self._async_discover_and_subscribe()
        await self.store.async_save()

        result = await self._async_build_full_data()
        self._initial_build_done.set()
        return result

    async def _async_discover_and_subscribe(self) -> None:
        """Run discovery and subscribe to state changes for new entities."""
        ignored = self.store.get_ignored_entities()
        batteries = await async_discover_batteries(self.hass, ignored)

        old_entity_ids = set(self.discovered.keys())
        self.discovered = {b.entity_id: b for b in batteries}
        new_entity_ids = set(self.discovered.keys())

        # Ensure device metadata exists for discovered devices
        for battery in batteries:
            self.store.ensure_device(
                battery.entity_id,
                device_id=battery.device_id,
            )

        # Discover sibling battery_state entities for charging state tracking
        self._sibling_to_source = {}
        ent_reg = er.async_get(self.hass)
        for battery in batteries:
            if not battery.device_id:
                continue
            for entry in er.async_entries_for_device(ent_reg, battery.device_id):
                if (
                    "battery_state" in entry.entity_id
                    and entry.entity_id != battery.entity_id
                ):
                    self._sibling_to_source[entry.entity_id] = battery.entity_id

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
            self._fired_low.discard(entity_id)
            self._fired_stale.discard(entity_id)

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

    def _pre_populate_event_dedup(self, data: dict[str, Any]) -> None:
        """Pre-populate dedup sets from current state to prevent restart storm."""
        for entity_id, info in data.items():
            if info.get("is_low"):
                self._fired_low.add(entity_id)
            if info.get("is_stale"):
                self._fired_stale.add(entity_id)

    @callback
    def _handle_state_change(self, event: Event) -> None:
        """Handle a state change event for a tracked battery entity."""
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

        # Determine rechargeable status to prevent replacement detection
        # on normal charge cycles.
        is_rechargeable = False
        if self.data:
            prev_data = self.data.get(entity_id, {})
            is_rechargeable = prev_data.get("is_rechargeable", False)
        if not is_rechargeable:
            dev = self.store.get_device(entity_id)
            if dev and dev.is_rechargeable is True:
                is_rechargeable = True

        # Replacement detection: compare against last known level
        old_level = self._last_known_levels.get(entity_id)
        replaced = False
        if old_level is not None and not is_rechargeable:
            if old_level <= self.low_threshold * REPLACEMENT_LOW_MULTIPLIER and level >= 80:
                _LOGGER.info(
                    "Battery replacement detected for %s: %s%% → %s%%",
                    entity_id,
                    old_level,
                    level,
                )
                dev = self.store.get_device(entity_id)
                if dev:
                    dev.replacement_history.append(time.time())
                    dev.replacement_confirmed = False
                    self.store.mark_dirty()
                replaced = True

        self._last_known_levels[entity_id] = level
        battery.current_level = level

        # Fire replacement event if detected
        if replaced:
            self.hass.bus.async_fire(
                EVENT_DEVICE_REPLACED,
                {
                    "entity_id": entity_id,
                    "device_name": battery.device_name or entity_id,
                    "old_level": old_level,
                    "new_level": level,
                },
            )
            self._fired_low.discard(entity_id)

        # Only rebuild when the level actually changed (or replacement detected).
        if level == old_level and not replaced:
            return

        # Cancel any pending rebuild for this entity (debounce rapid updates)
        existing_task = self._pending_rebuilds.pop(entity_id, None)
        if existing_task and not existing_task.done():
            existing_task.cancel()

        # Schedule async rebuild for this entity
        task = self.hass.async_create_task(
            self._async_rebuild_entity(entity_id, battery)
        )
        self._pending_rebuilds[entity_id] = task

    async def _async_rebuild_entity(
        self, entity_id: str, battery: DiscoveredBattery
    ) -> None:
        """Rebuild data for a single entity and update coordinator data."""
        entity_data = await self._async_build_entity_data(entity_id, battery)
        prev = self.data.get(entity_id) if self.data else None

        if prev is not None and not self._is_significant_change(prev, entity_data):
            return

        data = dict(self.data) if self.data else {}
        data[entity_id] = entity_data
        self._fire_events_for_entity(entity_id, entity_data)
        self.async_set_updated_data(data)

    @staticmethod
    def _is_significant_change(
        old: dict[str, Any], new: dict[str, Any]
    ) -> bool:
        """Return True if new entity data differs meaningfully from old."""
        # Boolean / categorical flags — any change is significant
        for key in ("is_low", "is_stale", "charging_state", "replacement_pending"):
            if old.get(key) != new.get(key):
                return True

        # Level change > 1% absolute — significant
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
        """Build the data dict for a single entity."""
        dev = self.store.get_device(entity_id)

        threshold = (
            dev.custom_threshold if dev and dev.custom_threshold
            else self.low_threshold
        )

        # Determine if this device is rechargeable.
        is_rechargeable_hint = False
        if dev and dev.is_rechargeable is not None:
            is_rechargeable_hint = dev.is_rechargeable
        else:
            battery_state_init = self._get_battery_state(entity_id, battery.device_id)
            if battery_state_init:
                normalized = battery_state_init.lower().replace(" ", "_")
                if normalized in ("charging", "not_charging", "full", "discharging"):
                    is_rechargeable_hint = True
            if not is_rechargeable_hint and self.data is not None:
                prev_data = self.data.get(entity_id, {})
                is_rechargeable_hint = prev_data.get("is_rechargeable", False)

        # Resolve battery type
        manual_type = dev.battery_type if dev else None
        if manual_type:
            battery_type = manual_type
            battery_type_source = "manual"
        else:
            battery_type, battery_type_source = self.type_resolver.resolve_type(
                entity_id, battery.device_id
            )

        battery_state = self._get_battery_state(entity_id, battery.device_id)

        level = battery.current_level
        is_low = level is not None and level < threshold

        now = time.time()
        is_stale = False
        # Check staleness from last HA state
        source_state = self.hass.states.get(entity_id)
        if source_state and source_state.state in (
            STATE_UNAVAILABLE, STATE_UNKNOWN
        ):
            last_changed = source_state.last_changed.timestamp()
            hours_unavailable = (now - last_changed) / 3600
            is_stale = hours_unavailable > self.stale_timeout_hours

        return {
            "level": level,
            "device_name": battery.device_name,
            "device_id": battery.device_id,
            "source_type": battery.source_type,
            "platform": battery.platform,
            "manufacturer": battery.manufacturer,
            "model": battery.model,
            "last_replaced": dev.last_replaced if dev else None,
            "custom_threshold": dev.custom_threshold if dev else None,
            "threshold": threshold,
            "battery_type": battery_type,
            "battery_type_source": battery_type_source,
            "is_rechargeable": is_rechargeable_hint,
            "charging_state": battery_state,
            "replacement_pending": (
                dev is not None and not dev.replacement_confirmed
            ),
            "is_low": is_low,
            "is_stale": is_stale,
            "last_calculated": now,
            "replacement_history": dev.replacement_history if dev else [],
        }

    def _get_battery_state(self, entity_id: str, device_id: str | None) -> str | None:
        """Find battery charging state from attributes or sibling entities."""
        state = self.hass.states.get(entity_id)
        if state:
            for attr in ("battery_state", "charging"):
                val = state.attributes.get(attr)
                if val:
                    return str(val)

        if device_id:
            ent_reg = er.async_get(self.hass)
            for entry in er.async_entries_for_device(ent_reg, device_id):
                if "battery_state" not in entry.entity_id:
                    continue
                sibling_state = self.hass.states.get(entry.entity_id)
                if sibling_state and sibling_state.state not in (
                    STATE_UNAVAILABLE, STATE_UNKNOWN, None
                ):
                    return sibling_state.state

        return None

    async def _async_build_full_data(self) -> dict[str, Any]:
        """Build the full data dict for all entities."""
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

        if self._first_full_build:
            self._first_full_build = False
            self._pre_populate_event_dedup(data)
        else:
            self._fire_events(data)
        return data

    def try_claim_refresh(self) -> bool:
        """Atomically check throttle and claim a refresh slot."""
        now = time.monotonic()
        if (now - self._last_ws_refresh) < _WS_REFRESH_MIN_INTERVAL:
            return False
        self._last_ws_refresh = now
        return True

    async def async_manual_refresh(self) -> None:
        """Force a full refresh."""
        await self.async_request_refresh()

    async def async_mark_replaced(self, entity_id: str) -> bool:
        """Mark a battery as replaced: update store, invalidate cache."""
        if not self.store.mark_replaced(entity_id):
            return False

        self.hass.async_create_task(self.async_request_refresh())
        return True

    async def async_mark_replaced_at(
        self, entity_id: str, timestamp: float
    ) -> bool:
        """Mark a battery as replaced at a specific timestamp."""
        if not self.store.mark_replaced_at(entity_id, timestamp):
            return False

        self.hass.async_create_task(self.async_request_refresh())
        return True

    async def async_deny_replacement(
        self, entity_id: str, timestamp: float
    ) -> bool:
        """Deny a suspected replacement timestamp."""
        if not self.store.deny_replacement(entity_id, timestamp):
            return False
        return True

    async def async_restore_denied_replacement(
        self, entity_id: str, timestamp: float
    ) -> bool:
        """Restore a previously denied replacement."""
        if not self.store.restore_denied_replacement(entity_id, timestamp):
            return False

        self.hass.async_create_task(self.async_request_refresh())
        return True

    async def async_undo_replacement(
        self, entity_id: str, *, timestamp: float | None = None
    ) -> bool:
        """Undo a replacement: update store, invalidate cache."""
        if timestamp is not None:
            if not self.store.remove_replacement(entity_id, timestamp):
                return False
        elif not self.store.undo_replacement(entity_id):
            return False

        self.hass.async_create_task(self.async_request_refresh())
        return True

    def detect_battery_type(
        self, entity_id: str
    ) -> tuple[str | None, str | None]:
        """Auto-detect battery type for a discovered device (bypasses cache)."""
        battery = self.discovered.get(entity_id)
        if battery is None:
            raise KeyError(entity_id)
        return self.type_resolver.resolve_uncached(entity_id, battery.device_id)

    @callback
    def _fire_events_for_entity(
        self, entity_id: str, info: dict[str, Any]
    ) -> None:
        """Fire events for a single entity."""
        device_name = info.get("device_name") or entity_id
        level = info.get("level")
        threshold = info.get("threshold", self.low_threshold)

        if info.get("is_low"):
            if entity_id not in self._fired_low:
                self._fired_low.add(entity_id)
                self.hass.bus.async_fire(
                    EVENT_BATTERY_LOW,
                    {
                        "entity_id": entity_id,
                        "device_name": device_name,
                        "level": level,
                        "threshold": threshold,
                    },
                )
        elif level is not None:
            self._fired_low.discard(entity_id)

        if info.get("is_stale"):
            if entity_id not in self._fired_stale:
                self._fired_stale.add(entity_id)
                last_reading = info.get("last_reading_time")
                hours_since = (
                    (time.time() - last_reading) / 3600
                    if last_reading
                    else 0
                )
                self.hass.bus.async_fire(
                    EVENT_DEVICE_STALE,
                    {
                        "entity_id": entity_id,
                        "device_name": device_name,
                        "last_seen": last_reading,
                        "stale_hours": round(hours_since, 1),
                    },
                )
        else:
            self._fired_stale.discard(entity_id)

    @callback
    def _fire_events(self, data: dict[str, Any]) -> None:
        """Fire events for all entities (used on full rebuild)."""
        for entity_id, info in data.items():
            self._fire_events_for_entity(entity_id, info)

    async def async_shutdown(self) -> None:
        """Shut down the coordinator, save store, remove listeners."""
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
        await self.store.async_save()
        await super().async_shutdown()
