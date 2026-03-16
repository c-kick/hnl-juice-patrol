"""Binary sensor platform for Juice Patrol."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .coordinator import JuicePatrolCoordinator
from .entity import JUICE_PATROL_DEVICE_INFO, JuicePatrolEntity, slugify_entity

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Juice Patrol binary sensors."""
    coordinator: JuicePatrolCoordinator = hass.data[DOMAIN][entry.entry_id]
    known: set[str] = set()

    def _create_binary_sensors(entity_ids: list[str]) -> None:
        """Create binary sensor entities for a list of source entity IDs."""
        new_entities: list[BinarySensorEntity] = []
        for entity_id in entity_ids:
            if entity_id in known:
                continue
            known.add(entity_id)
            info = (coordinator.data or {}).get(entity_id, {})
            slug = slugify_entity(entity_id)
            new_entities.append(
                JuicePatrolBatteryLow(coordinator, entity_id, slug, info)
            )
            new_entities.append(
                JuicePatrolStale(coordinator, entity_id, slug, info)
            )
        if new_entities:
            async_add_entities(new_entities)

    _create_binary_sensors(list((coordinator.data or {}).keys()))
    coordinator.async_register_new_device_callback(_create_binary_sensors)
    async_add_entities([JuicePatrolAttentionNeeded(coordinator)])


class JuicePatrolBatteryLow(JuicePatrolEntity, BinarySensorEntity):
    """Binary sensor that is on when a device's battery is below threshold."""

    _attr_device_class = BinarySensorDeviceClass.BATTERY

    def __init__(
        self,
        coordinator: JuicePatrolCoordinator,
        source_entity_id: str,
        slug: str,
        info: dict[str, Any],
    ) -> None:
        super().__init__(
            coordinator, source_entity_id, slug, info,
            id_suffix="battery_low", name_suffix="Battery Low",
        )

    @property
    def is_on(self) -> bool | None:
        info = self._entity_data
        return info.get("is_low") if info else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        info = self._entity_data
        return {
            "source_entity": self._source_entity_id,
            "threshold": info.get("threshold"),
            "level": info.get("level"),
        }


class JuicePatrolStale(JuicePatrolEntity, BinarySensorEntity):
    """Binary sensor that is on when a device hasn't reported recently."""

    _attr_device_class = BinarySensorDeviceClass.PROBLEM
    _attr_icon = "mdi:clock-alert"

    def __init__(
        self,
        coordinator: JuicePatrolCoordinator,
        source_entity_id: str,
        slug: str,
        info: dict[str, Any],
    ) -> None:
        super().__init__(
            coordinator, source_entity_id, slug, info,
            id_suffix="stale", name_suffix="Stale",
        )

    @property
    def is_on(self) -> bool | None:
        info = self._entity_data
        return info.get("is_stale") if info else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {
            "source_entity": self._source_entity_id,
            "stale_timeout_hours": self.coordinator.stale_timeout_hours,
        }


class JuicePatrolAttentionNeeded(BinarySensorEntity):
    """Summary binary sensor: on when ANY device needs attention."""

    _attr_device_class = BinarySensorDeviceClass.PROBLEM
    _attr_has_entity_name = True
    _attr_icon = "mdi:battery-alert-variant"

    def __init__(self, coordinator: JuicePatrolCoordinator) -> None:
        self.coordinator = coordinator
        self._attr_unique_id = f"{DOMAIN}_attention_needed"
        self._attr_name = "Attention Needed"

    @property
    def device_info(self):
        return JUICE_PATROL_DEVICE_INFO

    @property
    def should_poll(self) -> bool:
        return False

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(
            self.coordinator.async_add_listener(
                self._handle_coordinator_update
            )
        )

    @property
    def is_on(self) -> bool | None:
        data = self.coordinator.data
        if not data:
            return None
        return any(
            info.get("is_low") or info.get("is_stale")
            for info in data.values()
        )

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        data = self.coordinator.data
        if not data:
            return {}
        low = [eid for eid, info in data.items() if info.get("is_low")]
        stale = [eid for eid, info in data.items() if info.get("is_stale")]
        return {
            "low_battery_devices": low,
            "stale_devices": stale,
            "low_count": len(low),
            "stale_count": len(stale),
            "monitored_devices": len(data),
        }

    @callback
    def _handle_coordinator_update(self) -> None:
        self.async_write_ha_state()
