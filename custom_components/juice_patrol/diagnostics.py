"""Diagnostics support for Juice Patrol."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant

from . import JuicePatrolConfigEntry
from .coordinator import JuicePatrolCoordinator


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: JuicePatrolConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    coordinator: JuicePatrolCoordinator = entry.runtime_data

    devices_diag: dict[str, Any] = {}
    for entity_id, info in (coordinator.data or {}).items():
        prediction = info.get("prediction")
        devices_diag[entity_id] = {
            "level": info.get("level"),
            "reading_count": info.get("reading_count", 0),
            "discharge_rate": info.get("discharge_rate"),
            "last_replaced": info.get("last_replaced"),
            "prediction_confidence": prediction.confidence if prediction else None,
            "prediction_days_remaining": (
                prediction.estimated_days_remaining if prediction else None
            ),
            "prediction_status": prediction.status if prediction else None,
        }

    return {
        "config_options": dict(entry.options),
        "discovered_devices": len(coordinator.discovered),
        "store_devices": len(coordinator.store.devices),
        "ignored_devices": len(coordinator.store.get_ignored_entities()),
        "devices": devices_diag,
    }
