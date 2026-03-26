"""Diagnostics support for Juice Patrol."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant

from . import JuicePatrolConfigEntry
from .data import JuicePatrolCoordinator


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: JuicePatrolConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    coordinator: JuicePatrolCoordinator = entry.runtime_data

    devices_diag: dict[str, Any] = {}
    for entity_id, info in (coordinator.data or {}).items():
        devices_diag[entity_id] = {
            "level": info.get("level"),
            "battery_type": info.get("battery_type"),
            "is_rechargeable": info.get("is_rechargeable"),
            "is_low": info.get("is_low"),
            "is_stale": info.get("is_stale"),
            "last_replaced": info.get("last_replaced"),
        }

    return {
        "config_options": dict(entry.options),
        "discovered_devices": len(coordinator.discovered),
        "store_devices": len(coordinator.store.devices),
        "ignored_devices": len(coordinator.store.get_ignored_entities()),
        "devices": devices_diag,
        "modules": coordinator.registry.get_all_diagnostics(),
    }
