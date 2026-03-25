"""Base entity classes for Juice Patrol."""

from __future__ import annotations

from typing import Any

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN

# Shared DeviceInfo for the virtual Juice Patrol device
JUICE_PATROL_DEVICE_INFO = DeviceInfo(
    identifiers={(DOMAIN, "juice_patrol")},
    name="Juice Patrol",
    manufacturer="HNL",
    model="Battery Monitor",
)


def slugify_entity(entity_id: str) -> str:
    """Strip the domain prefix from an entity_id.

    e.g. 'sensor.living_room_motion_battery' -> 'living_room_motion_battery'
    """
    return entity_id.split(".", 1)[-1] if "." in entity_id else entity_id


class JuicePatrolEntity(CoordinatorEntity):
    """Base class for per-device Juice Patrol entities."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator,
        source_entity_id: str,
        slug: str,
        info: dict[str, Any],
        *,
        id_suffix: str,
    ) -> None:
        """Initialize a per-device entity."""
        super().__init__(coordinator)
        self._source_entity_id = source_entity_id
        # Use full entity_id in unique_id to prevent cross-domain collisions
        self._attr_unique_id = f"{DOMAIN}_{source_entity_id}_{id_suffix}"
        # Fallback device info for initial creation
        self._fallback_device_id: str | None = info.get("device_id")
        self._fallback_device_name: str = info.get("device_name") or slug

    @property
    def _entity_data(self) -> dict[str, Any]:
        """Get this entity's data from the coordinator."""
        if self.coordinator.data:
            return self.coordinator.data.get(self._source_entity_id, {})
        return {}

    @property
    def device_info(self) -> DeviceInfo:
        """Return device info, reading live name from coordinator data."""
        data = self._entity_data
        device_name = data.get("device_name") or self._fallback_device_name
        device_id = data.get("device_id") or self._fallback_device_id
        identifier = device_id or self._source_entity_id
        return DeviceInfo(
            identifiers={(DOMAIN, identifier)},
            name=device_name,
        )
