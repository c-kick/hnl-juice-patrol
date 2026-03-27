"""Battery identification module.

Resolves battery type, rechargeable status, and charging state for each
discovered device.  Owns the BatteryTypeResolver and exposes WS handlers
for manual battery-type and rechargeable overrides.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

import voluptuous as vol

from homeassistant.helpers import config_validation as cv

from ...const import BATTERY_STATE_VALUES
from ...data.battery_types import BatteryTypeResolver
from ...discovery import DiscoveredBattery
from .. import JuicePatrolModule, WsCommandDefinition

if TYPE_CHECKING:
    from ...data.store import DeviceData

_LOGGER = logging.getLogger(__name__)


class BatteryIdModule(JuicePatrolModule):
    """Identifies battery type, rechargeable flag, and charging state."""

    MODULE_ID = "battery_id"
    DEPENDENCIES = ()

    def __init__(self, coordinator):
        super().__init__(coordinator)
        self.type_resolver = BatteryTypeResolver(self.hass)

    async def async_setup(self) -> None:
        await self.type_resolver.async_load_library()

    @classmethod
    def ws_command_definitions(cls) -> list[WsCommandDefinition]:
        return [
            WsCommandDefinition(
                command_type="juice_patrol/set_battery_type",
                schema={
                    vol.Required("entity_id"): cv.entity_id,
                    vol.Optional("battery_type"): vol.Any(str, None),
                },
                handler_method="handle_ws_set_battery_type",
            ),
            WsCommandDefinition(
                command_type="juice_patrol/set_rechargeable",
                schema={
                    vol.Required("entity_id"): cv.entity_id,
                    vol.Optional("is_rechargeable"): vol.Any(bool, None),
                },
                handler_method="handle_ws_set_rechargeable",
            ),
            WsCommandDefinition(
                command_type="juice_patrol/detect_battery_type",
                schema={
                    vol.Required("entity_id"): cv.entity_id,
                },
                handler_method="handle_ws_detect_battery_type",
            ),
        ]

    def get_entity_data(
        self,
        entity_id: str,
        battery: DiscoveredBattery,
        base_data: dict[str, Any],
        device_data: DeviceData | None,
    ) -> dict[str, Any]:
        # Resolve battery type
        manual_type = device_data.battery_type if device_data else None
        if manual_type:
            battery_type = manual_type
            battery_type_source = "manual"
        else:
            battery_type, battery_type_source = self.type_resolver.resolve_type(
                entity_id, battery.device_id
            )

        # Get charging state once (used for both rechargeable inference and output)
        # Normalise to lowercase+underscores so the panel can match known values.
        charging_state_raw = self._get_battery_state(entity_id)
        charging_state = (
            charging_state_raw.lower().replace(" ", "_")
            if charging_state_raw
            else None
        )

        # Determine rechargeable flag
        if device_data and device_data.is_rechargeable is not None:
            is_rechargeable = device_data.is_rechargeable
        elif charging_state:
            is_rechargeable = charging_state in BATTERY_STATE_VALUES
        elif self.coordinator.data is not None:
            is_rechargeable = (
                self.coordinator.data.get(entity_id, {}).get("is_rechargeable", False)
            )
        else:
            is_rechargeable = False

        return {
            "battery_type": battery_type,
            "battery_type_source": battery_type_source,
            "is_rechargeable": is_rechargeable,
            "charging_state": charging_state,
        }

    def _get_battery_state(self, entity_id: str) -> str | None:
        """Find battery charging state from attributes or coordinator's sibling map."""
        # Check entity attributes first
        state = self.hass.states.get(entity_id)
        if state:
            for attr in ("battery_state", "charging"):
                val = state.attributes.get(attr)
                if val:
                    return str(val)

        # Use coordinator's pre-computed sibling map (O(1) lookup)
        return self.coordinator.get_sibling_battery_state(entity_id)

    def detect_battery_type(
        self, entity_id: str
    ) -> tuple[str | None, str | None]:
        """Auto-detect battery type (bypasses cache)."""
        battery = self.coordinator.discovered.get(entity_id)
        if battery is None:
            raise KeyError(entity_id)
        return self.type_resolver.resolve_uncached(entity_id, battery.device_id)

    # -- WS handler methods (called via static registration wrappers) --

    async def handle_ws_set_battery_type(self, hass, connection, msg):
        entity_id = msg["entity_id"]
        battery_type = msg.get("battery_type")
        if self.coordinator.store.set_battery_type(entity_id, battery_type):
            self.type_resolver.invalidate_cache(entity_id)
            await self.coordinator.async_request_refresh()
            connection.send_result(msg["id"], {"ok": True})
        else:
            connection.send_error(
                msg["id"], "not_found", f"Entity {entity_id} not in store"
            )

    async def handle_ws_set_rechargeable(self, hass, connection, msg):
        entity_id = msg["entity_id"]
        value = msg.get("is_rechargeable")
        if self.coordinator.store.set_rechargeable(entity_id, value):
            await self.coordinator.async_request_refresh()
            connection.send_result(msg["id"], {"ok": True})
        else:
            connection.send_error(
                msg["id"], "not_found", f"Entity {entity_id} not in store"
            )

    async def handle_ws_detect_battery_type(self, hass, connection, msg):
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
