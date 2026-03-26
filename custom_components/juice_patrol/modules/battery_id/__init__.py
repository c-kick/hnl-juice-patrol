"""Battery identification module.

Resolves battery type, rechargeable status, and charging state for each
discovered device.  Owns the BatteryTypeResolver and exposes WS handlers
for manual battery-type and rechargeable overrides.
"""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.helpers import config_validation as cv, entity_registry as er

from ...const import DOMAIN
from ...data.battery_types import BatteryTypeResolver
from ...discovery import DiscoveredBattery
from .. import JuicePatrolModule

_LOGGER = logging.getLogger(__name__)


class BatteryIdModule(JuicePatrolModule):
    """Identifies battery type, rechargeable flag, and charging state."""

    MODULE_ID = "battery_id"
    DEPENDENCIES = ()

    def __init__(self, coordinator):
        super().__init__(coordinator)
        self.type_resolver = BatteryTypeResolver(self.hass)

    async def async_setup(self) -> None:
        self.hass.async_create_task(self.type_resolver.async_load_library())

    def get_entity_data(
        self,
        entity_id: str,
        battery: DiscoveredBattery,
        base_data: dict[str, Any],
    ) -> dict[str, Any]:
        dev = self.coordinator.store.get_device(entity_id)

        # Resolve battery type
        manual_type = dev.battery_type if dev else None
        if manual_type:
            battery_type = manual_type
            battery_type_source = "manual"
        else:
            battery_type, battery_type_source = self.type_resolver.resolve_type(
                entity_id, battery.device_id
            )

        # Determine rechargeable flag
        is_rechargeable = False
        if dev and dev.is_rechargeable is not None:
            is_rechargeable = dev.is_rechargeable
        else:
            battery_state = self._get_battery_state(entity_id, battery.device_id)
            if battery_state:
                normalized = battery_state.lower().replace(" ", "_")
                if normalized in ("charging", "not_charging", "full", "discharging"):
                    is_rechargeable = True
            if not is_rechargeable and self.coordinator.data is not None:
                prev_data = self.coordinator.data.get(entity_id, {})
                is_rechargeable = prev_data.get("is_rechargeable", False)

        charging_state = self._get_battery_state(entity_id, battery.device_id)

        return {
            "battery_type": battery_type,
            "battery_type_source": battery_type_source,
            "is_rechargeable": is_rechargeable,
            "charging_state": charging_state,
        }

    def _get_battery_state(
        self, entity_id: str, device_id: str | None
    ) -> str | None:
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

    def detect_battery_type(
        self, entity_id: str
    ) -> tuple[str | None, str | None]:
        """Auto-detect battery type (bypasses cache)."""
        battery = self.coordinator.discovered.get(entity_id)
        if battery is None:
            raise KeyError(entity_id)
        return self.type_resolver.resolve_uncached(entity_id, battery.device_id)

    def ws_handlers(self) -> list:
        coordinator = self.coordinator

        @websocket_api.websocket_command(
            {
                vol.Required("type"): "juice_patrol/set_battery_type",
                vol.Required("entity_id"): cv.entity_id,
                vol.Optional("battery_type"): vol.Any(str, None),
            }
        )
        @websocket_api.async_response
        async def ws_set_battery_type(hass, connection, msg):
            entity_id = msg["entity_id"]
            battery_type = msg.get("battery_type")
            if coordinator.store.set_battery_type(entity_id, battery_type):
                self.type_resolver.invalidate_cache(entity_id)
                await coordinator.async_request_refresh()
                connection.send_result(msg["id"], {"ok": True})
            else:
                connection.send_error(
                    msg["id"], "not_found", f"Entity {entity_id} not in store"
                )

        @websocket_api.websocket_command(
            {
                vol.Required("type"): "juice_patrol/set_rechargeable",
                vol.Required("entity_id"): cv.entity_id,
                vol.Optional("is_rechargeable"): vol.Any(bool, None),
            }
        )
        @websocket_api.async_response
        async def ws_set_rechargeable(hass, connection, msg):
            entity_id = msg["entity_id"]
            value = msg.get("is_rechargeable")
            if coordinator.store.set_rechargeable(entity_id, value):
                await coordinator.async_request_refresh()
                connection.send_result(msg["id"], {"ok": True})
            else:
                connection.send_error(
                    msg["id"], "not_found", f"Entity {entity_id} not in store"
                )

        @websocket_api.websocket_command(
            {
                vol.Required("type"): "juice_patrol/detect_battery_type",
                vol.Required("entity_id"): cv.entity_id,
            }
        )
        @websocket_api.async_response
        async def ws_detect_battery_type(hass, connection, msg):
            entity_id = msg["entity_id"]
            try:
                battery_type, source = self.detect_battery_type(entity_id)
            except KeyError:
                connection.send_error(
                    msg["id"], "not_found",
                    f"Entity {entity_id} not discovered",
                )
                return
            connection.send_result(msg["id"], {
                "battery_type": battery_type,
                "source": source,
            })

        return [ws_set_battery_type, ws_set_rechargeable, ws_detect_battery_type]
