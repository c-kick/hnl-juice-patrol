"""Sidebar panel registration for Juice Patrol."""

from __future__ import annotations

from homeassistant.components.frontend import async_register_built_in_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN

PANEL_URL = f"/api/{DOMAIN}/panel"
PANEL_FILENAME = "frontend/juice_patrol_panel.js"


async def async_setup_panel(hass: HomeAssistant) -> None:
    """Register the Juice Patrol sidebar panel."""
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                PANEL_URL,
                hass.config.path(
                    f"custom_components/{DOMAIN}/{PANEL_FILENAME}"
                ),
                True,
            )
        ]
    )

    async_register_built_in_panel(
        hass=hass,
        component_name="custom",
        sidebar_title="Juice Patrol",
        sidebar_icon="mdi:battery-heart",
        frontend_url_path=DOMAIN.replace("_", "-"),
        require_admin=False,
        config={
            "_panel_custom": {
                "name": "juice-patrol-panel",
                "module_url": PANEL_URL,
            }
        },
    )
