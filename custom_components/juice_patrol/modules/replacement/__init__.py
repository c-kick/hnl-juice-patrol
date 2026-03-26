"""Battery replacement tracking module.

Manages replacement history: marking batteries as replaced, undoing
replacements, and exposing replacement data on each entity.
"""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from ...const import DOMAIN
from ...discovery import DiscoveredBattery
from .. import JuicePatrolModule, ServiceDefinition

_LOGGER = logging.getLogger(__name__)


class ReplacementModule(JuicePatrolModule):
    """Tracks battery replacement history."""

    MODULE_ID = "replacement"
    DEPENDENCIES = ()

    async def async_setup(self) -> None:
        pass

    def get_entity_data(
        self,
        entity_id: str,
        battery: DiscoveredBattery,
        base_data: dict[str, Any],
    ) -> dict[str, Any]:
        dev = self.coordinator.store.get_device(entity_id)
        return {
            "replacement_history": dev.replacement_history if dev else [],
            "last_replaced": dev.last_replaced if dev else None,
        }

    async def async_mark_replaced(self, entity_id: str) -> bool:
        if not self.coordinator.store.mark_replaced(entity_id):
            return False
        self.hass.async_create_task(self.coordinator.async_request_refresh())
        return True

    async def async_mark_replaced_at(
        self, entity_id: str, timestamp: float
    ) -> bool:
        if not self.coordinator.store.mark_replaced_at(entity_id, timestamp):
            return False
        self.hass.async_create_task(self.coordinator.async_request_refresh())
        return True

    async def async_undo_replacement(
        self, entity_id: str, *, timestamp: float | None = None
    ) -> bool:
        if timestamp is not None:
            if not self.coordinator.store.remove_replacement(entity_id, timestamp):
                return False
        elif not self.coordinator.store.undo_replacement(entity_id):
            return False
        self.hass.async_create_task(self.coordinator.async_request_refresh())
        return True

    def services(self) -> list[ServiceDefinition]:
        async def handle_mark_replaced(call):
            coordinator = self.coordinator
            entity_id = call.data["entity_id"]
            if entity_id not in coordinator.discovered:
                raise HomeAssistantError(
                    translation_domain=DOMAIN,
                    translation_key="entity_not_monitored",
                    translation_placeholders={"entity_id": entity_id},
                )
            if not await self.async_mark_replaced(entity_id):
                raise HomeAssistantError(
                    translation_domain=DOMAIN,
                    translation_key="entity_not_in_store",
                    translation_placeholders={"entity_id": entity_id},
                )

        return [
            ServiceDefinition(
                "mark_replaced",
                handle_mark_replaced,
                vol.Schema({vol.Required("entity_id"): cv.entity_id}),
            ),
        ]

    def ws_handlers(self) -> list:
        mod = self

        @websocket_api.websocket_command(
            {
                vol.Required("type"): "juice_patrol/mark_replaced",
                vol.Required("entity_id"): cv.entity_id,
                vol.Optional("timestamp"): vol.Coerce(float),
            }
        )
        @websocket_api.async_response
        async def ws_mark_replaced(hass, connection, msg):
            entity_id = msg["entity_id"]
            timestamp = msg.get("timestamp")
            try:
                if timestamp is not None:
                    ok = await mod.async_mark_replaced_at(entity_id, timestamp)
                else:
                    ok = await mod.async_mark_replaced(entity_id)
                if not ok:
                    connection.send_error(
                        msg["id"], "not_found",
                        f"Entity {entity_id} not in store",
                    )
                    return
                connection.send_result(msg["id"], {"ok": True})
            except HomeAssistantError:
                connection.send_error(
                    msg["id"], "not_found",
                    f"Entity {entity_id} not in store",
                )

        @websocket_api.websocket_command(
            {
                vol.Required("type"): "juice_patrol/undo_replacement",
                vol.Required("entity_id"): cv.entity_id,
                vol.Optional("timestamp"): vol.Coerce(float),
            }
        )
        @websocket_api.async_response
        async def ws_undo_replacement(hass, connection, msg):
            entity_id = msg["entity_id"]
            timestamp = msg.get("timestamp")
            if await mod.async_undo_replacement(entity_id, timestamp=timestamp):
                connection.send_result(msg["id"], {"ok": True})
            else:
                connection.send_error(
                    msg["id"], "not_found",
                    f"Entity {entity_id} not in store",
                )

        return [ws_mark_replaced, ws_undo_replacement]
