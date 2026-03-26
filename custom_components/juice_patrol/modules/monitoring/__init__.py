"""Battery monitoring module.

Computes low-battery and stale-device flags, fires HA events on state
transitions, and exposes settings WS handlers and threshold services.
"""

from __future__ import annotations

import logging
import time
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from ...const import (
    CONF_LOW_THRESHOLD,
    CONF_STALE_TIMEOUT,
    DEFAULT_LOW_THRESHOLD,
    DEFAULT_STALE_TIMEOUT,
    DOMAIN,
    EVENT_BATTERY_LOW,
    EVENT_DEVICE_STALE,
)
from ...discovery import DiscoveredBattery
from .. import JuicePatrolModule, ServiceDefinition

_LOGGER = logging.getLogger(__name__)


class MonitoringModule(JuicePatrolModule):
    """Low-battery alerts, stale-device detection, and event firing."""

    MODULE_ID = "monitoring"
    DEPENDENCIES = ()

    def __init__(self, coordinator):
        super().__init__(coordinator)
        self._fired_low: set[str] = set()
        self._fired_stale: set[str] = set()
        self._first_build = True

    async def async_setup(self) -> None:
        pass

    def get_entity_data(
        self,
        entity_id: str,
        battery: DiscoveredBattery,
        base_data: dict[str, Any],
    ) -> dict[str, Any]:
        dev = self.coordinator.store.get_device(entity_id)
        threshold = (
            dev.custom_threshold
            if dev and dev.custom_threshold
            else self.coordinator.low_threshold
        )

        level = base_data.get("level")
        is_low = level is not None and level < threshold

        is_stale = False
        source_state = self.hass.states.get(entity_id)
        if source_state and source_state.state in (
            STATE_UNAVAILABLE, STATE_UNKNOWN
        ):
            last_changed = source_state.last_changed.timestamp()
            hours_unavailable = (time.time() - last_changed) / 3600
            is_stale = hours_unavailable > self.coordinator.stale_timeout_hours

        return {
            "threshold": threshold,
            "custom_threshold": dev.custom_threshold if dev else None,
            "is_low": is_low,
            "is_stale": is_stale,
        }

    def pre_populate_event_dedup(self, data: dict[str, Any]) -> None:
        """Pre-populate dedup sets from current state to prevent restart storm."""
        for entity_id, info in data.items():
            if info.get("is_low"):
                self._fired_low.add(entity_id)
            if info.get("is_stale"):
                self._fired_stale.add(entity_id)

    @callback
    def fire_events_for_entity(
        self, entity_id: str, info: dict[str, Any]
    ) -> None:
        """Fire events for a single entity."""
        device_name = info.get("device_name") or entity_id
        level = info.get("level")
        threshold = info.get("threshold", self.coordinator.low_threshold)

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
    def fire_events(self, data: dict[str, Any]) -> None:
        """Fire events for all entities (used on full rebuild)."""
        if self._first_build:
            self._first_build = False
            self.pre_populate_event_dedup(data)
        else:
            for entity_id, info in data.items():
                self.fire_events_for_entity(entity_id, info)

    def on_entity_disappeared(self, entity_id: str) -> None:
        self._fired_low.discard(entity_id)
        self._fired_stale.discard(entity_id)

    def services(self) -> list[ServiceDefinition]:
        coordinator = self.coordinator

        async def handle_force_refresh(call):
            await coordinator.async_request_refresh()

        async def handle_set_device_threshold(call):
            entity_id = call.data["entity_id"]
            threshold = call.data["threshold"]
            if entity_id not in coordinator.discovered:
                raise HomeAssistantError(
                    translation_domain=DOMAIN,
                    translation_key="entity_not_monitored",
                    translation_placeholders={"entity_id": entity_id},
                )
            if not coordinator.store.set_device_threshold(entity_id, threshold):
                raise HomeAssistantError(
                    translation_domain=DOMAIN,
                    translation_key="entity_not_in_store",
                    translation_placeholders={"entity_id": entity_id},
                )
            await coordinator.async_request_refresh()

        async def handle_ignore_device(call):
            entity_id = call.data["entity_id"]
            coordinator.store.set_ignored(entity_id, True)
            await coordinator.async_request_refresh()

        async def handle_unignore_device(call):
            entity_id = call.data["entity_id"]
            coordinator.store.set_ignored(entity_id, False)
            await coordinator.async_request_refresh()

        entity_schema = vol.Schema({vol.Required("entity_id"): cv.entity_id})

        return [
            ServiceDefinition("force_refresh", handle_force_refresh),
            ServiceDefinition(
                "set_device_threshold",
                handle_set_device_threshold,
                vol.Schema({
                    vol.Required("entity_id"): cv.entity_id,
                    vol.Required("threshold"): vol.All(
                        int, vol.Range(min=1, max=99)
                    ),
                }),
            ),
            ServiceDefinition("ignore_device", handle_ignore_device, entity_schema),
            ServiceDefinition("unignore_device", handle_unignore_device, entity_schema),
        ]

    def ws_handlers(self) -> list:
        coordinator = self.coordinator

        @websocket_api.websocket_command(
            {vol.Required("type"): "juice_patrol/get_settings"}
        )
        @websocket_api.async_response
        async def ws_get_settings(hass, connection, msg):
            entry = coordinator.config_entry
            connection.send_result(msg["id"], {
                "entry_id": entry.entry_id,
                CONF_LOW_THRESHOLD: entry.options.get(
                    CONF_LOW_THRESHOLD, DEFAULT_LOW_THRESHOLD
                ),
                CONF_STALE_TIMEOUT: entry.options.get(
                    CONF_STALE_TIMEOUT, DEFAULT_STALE_TIMEOUT
                ),
            })

        @websocket_api.websocket_command(
            {
                vol.Required("type"): "juice_patrol/update_settings",
                vol.Optional(CONF_LOW_THRESHOLD): vol.All(
                    int, vol.Range(min=1, max=99)
                ),
                vol.Optional(CONF_STALE_TIMEOUT): vol.All(
                    int, vol.Range(min=1, max=720)
                ),
            }
        )
        @websocket_api.async_response
        async def ws_update_settings(hass, connection, msg):
            entry = coordinator.config_entry
            new_options = dict(entry.options)
            for key in (CONF_LOW_THRESHOLD, CONF_STALE_TIMEOUT):
                if key in msg:
                    new_options[key] = msg[key]
            hass.config_entries.async_update_entry(entry, options=new_options)
            connection.send_result(msg["id"], new_options)

        return [ws_get_settings, ws_update_settings]
