"""Dashboard data module.

Provides a WebSocket endpoint that returns replacement history and
first-seen timestamps for all monitored devices.
"""

from __future__ import annotations

import logging

import voluptuous as vol

from homeassistant.components import websocket_api

from .. import JuicePatrolModule

_LOGGER = logging.getLogger(__name__)


class DashboardModule(JuicePatrolModule):
    """Dashboard data — read-only view over coordinator data."""

    MODULE_ID = "dashboard"
    DEPENDENCIES = ("replacement",)

    async def async_setup(self) -> None:
        pass

    def ws_handlers(self) -> list:
        coordinator = self.coordinator

        @websocket_api.websocket_command(
            {vol.Required("type"): "juice_patrol/get_dashboard_data"}
        )
        @websocket_api.async_response
        async def ws_get_dashboard_data(hass, connection, msg):
            data = coordinator.data or {}
            replacement_data = {}
            for entity_id, info in data.items():
                history = info.get("replacement_history", [])
                first_seen = min(history) if history else None
                replacement_data[entity_id] = {
                    "replacement_history": history,
                    "first_seen": first_seen,
                }
            connection.send_result(msg["id"], {
                "replacement_data": replacement_data,
            })

        return [ws_get_dashboard_data]
