"""Shopping list module.

Provides a WebSocket endpoint that returns batteries grouped by type,
with counts of how many need replacement.
"""

from __future__ import annotations

import logging
import re

import voluptuous as vol

from homeassistant.components import websocket_api

from .. import JuicePatrolModule

_LOGGER = logging.getLogger(__name__)


class ShoppingModule(JuicePatrolModule):
    """Battery shopping list — read-only view over coordinator data."""

    MODULE_ID = "shopping"
    DEPENDENCIES = ("battery_id",)

    async def async_setup(self) -> None:
        pass

    def ws_handlers(self) -> list:
        coordinator = self.coordinator

        @websocket_api.websocket_command(
            {vol.Required("type"): "juice_patrol/get_shopping_list"}
        )
        @websocket_api.async_response
        async def ws_get_shopping_list(hass, connection, msg):
            data = coordinator.data or {}

            def _parse_battery_type(raw: str) -> tuple[str, int]:
                m = re.match(r"^(\d+)\s*[×x]\s*(.+)$", raw, re.IGNORECASE)
                if m:
                    return m.group(2).strip(), int(m.group(1))
                return raw.strip(), 1

            groups_map: dict[str, list[dict]] = {}
            for entity_id, info in data.items():
                if info.get("is_rechargeable"):
                    continue
                raw_type = info.get("battery_type") or "Unknown"
                base_type, battery_count = _parse_battery_type(raw_type)
                device_entry = {
                    "entity_id": entity_id,
                    "device_name": info.get("device_name") or entity_id,
                    "level": info.get("level"),
                    "is_low": info.get("is_low", False),
                    "battery_count": battery_count,
                }
                groups_map.setdefault(base_type, []).append(device_entry)

            groups = []
            total_needed = 0
            for battery_type, devices in sorted(
                groups_map.items(), key=lambda x: (x[0] == "Unknown", x[0])
            ):
                total_batteries = sum(d["battery_count"] for d in devices)
                needs_replacement = sum(
                    d["battery_count"] for d in devices if d["is_low"]
                )
                total_needed += needs_replacement
                groups.append({
                    "battery_type": battery_type,
                    "device_count": len(devices),
                    "battery_count": total_batteries,
                    "needs_replacement": needs_replacement,
                    "devices": sorted(
                        devices, key=lambda d: d.get("level") or 999
                    ),
                })

            connection.send_result(msg["id"], {
                "groups": groups,
                "total_needed": total_needed,
            })

        return [ws_get_shopping_list]
