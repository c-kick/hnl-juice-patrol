"""Sensor platform for Juice Patrol."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.const import PERCENTAGE
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import JuicePatrolConfigEntry
from .const import DOMAIN
from .data import JuicePatrolCoordinator
from .entity import JUICE_PATROL_DEVICE_INFO, JuicePatrolEntity, slugify_entity

_LOGGER = logging.getLogger(__name__)

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: JuicePatrolConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Juice Patrol sensors."""
    coordinator: JuicePatrolCoordinator = entry.runtime_data
    known: set[str] = set()

    def _create_sensors(entity_ids: list[str]) -> None:
        """Create sensor entities for a list of source entity IDs."""
        new_entities: list[SensorEntity] = []
        for entity_id in entity_ids:
            if entity_id in known:
                continue
            known.add(entity_id)
            info = (coordinator.data or {}).get(entity_id, {})
            slug = slugify_entity(entity_id)
            new_entities.append(
                JuicePatrolBatteryLevel(coordinator, entity_id, slug, info)
            )
        if new_entities:
            async_add_entities(new_entities)

    # Create entities for currently discovered devices
    _create_sensors(list((coordinator.data or {}).keys()))

    # Register callback for dynamically discovered devices
    coordinator.async_register_new_device_callback(_create_sensors)

    # Summary sensor (only once)
    async_add_entities([JuicePatrolLowestBattery(coordinator)])


class JuicePatrolBatteryLevel(JuicePatrolEntity, SensorEntity):
    """Battery level sensor for a monitored device."""

    _attr_translation_key = "battery_level"
    _attr_device_class = SensorDeviceClass.BATTERY
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(
        self,
        coordinator: JuicePatrolCoordinator,
        source_entity_id: str,
        slug: str,
        info: dict[str, Any],
    ) -> None:
        """Initialize the sensor."""
        super().__init__(
            coordinator, source_entity_id, slug, info,
            id_suffix="battery_level",
        )

    @property
    def native_value(self) -> float | None:
        return self._entity_data.get("level")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        info = self._entity_data
        return {
            "source_entity": self._source_entity_id,
            "source_name": info.get("device_name"),
            "level": info.get("level"),
            "threshold": info.get("threshold"),
            "platform": info.get("platform"),
            "manufacturer": info.get("manufacturer"),
            "model": info.get("model"),
            "battery_type": info.get("battery_type"),
            "battery_type_source": info.get("battery_type_source"),
            "is_rechargeable": info.get("is_rechargeable", False),
            "charging_state": info.get("charging_state"),
            "replacement_pending": info.get("replacement_pending", False),
            "last_replaced": info.get("last_replaced"),
            "last_calculated": info.get("last_calculated"),
        }


class JuicePatrolLowestBattery(
    CoordinatorEntity[JuicePatrolCoordinator], SensorEntity
):
    """Summary sensor showing the device with the lowest battery."""

    _attr_translation_key = "lowest_battery"
    _attr_device_class = SensorDeviceClass.BATTERY
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_has_entity_name = True

    def __init__(self, coordinator: JuicePatrolCoordinator) -> None:
        """Initialize the summary sensor."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_lowest_battery"

    @property
    def device_info(self):
        return JUICE_PATROL_DEVICE_INFO

    @property
    def native_value(self) -> float | None:
        data = self.coordinator.data
        if not data:
            return None
        levels = [
            info["level"]
            for info in data.values()
            if info.get("level") is not None
        ]
        return min(levels) if levels else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        data = self.coordinator.data
        if not data:
            return {}

        devices_with_level = [
            (eid, info)
            for eid, info in data.items()
            if info.get("level") is not None
        ]
        if not devices_with_level:
            return {"monitored_devices": len(data)}

        lowest_eid, lowest_info = min(
            devices_with_level, key=lambda x: x[1]["level"]
        )
        return {
            "lowest_entity": lowest_eid,
            "lowest_device": lowest_info.get("device_name"),
            "monitored_devices": len(data),
        }
