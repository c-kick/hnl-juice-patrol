"""Sensor platform for Juice Patrol."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.const import EntityCategory, PERCENTAGE, UnitOfTime
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
                JuicePatrolDischargeRate(coordinator, entity_id, slug, info)
            )
            new_entities.append(
                JuicePatrolPredictedEmpty(coordinator, entity_id, slug, info)
            )
            new_entities.append(
                JuicePatrolDaysRemaining(coordinator, entity_id, slug, info)
            )
        if new_entities:
            async_add_entities(new_entities)

    # Create entities for currently discovered devices
    _create_sensors(list((coordinator.data or {}).keys()))

    # Register callback for dynamically discovered devices
    coordinator.async_register_new_device_callback(_create_sensors)

    # Summary sensor (only once)
    async_add_entities([JuicePatrolLowestBattery(coordinator)])


class JuicePatrolDischargeRate(JuicePatrolEntity, SensorEntity):
    """Discharge rate sensor (%/day) for a monitored device."""

    _attr_translation_key = "discharge_rate"
    _attr_native_unit_of_measurement = "%/day"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_entity_category = EntityCategory.DIAGNOSTIC

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
            id_suffix="discharge_rate",
        )

    @property
    def native_value(self) -> float | None:
        return self._entity_data.get("discharge_rate")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        info = self._entity_data
        analysis = info.get("analysis")
        attrs: dict[str, Any] = {
            "source_entity": self._source_entity_id,
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
            "discharge_rate_hour": info.get("discharge_rate_hour"),
        }
        if analysis:
            attrs.update({
                "stability": analysis.stability,
                "stability_cv": analysis.stability_cv,
                "mean_level": analysis.mean_level,
                "discharge_anomaly": analysis.discharge_anomaly,
                "drop_size": analysis.drop_size,
                "rechargeable_reason": analysis.rechargeable_reason,
            })
        return attrs


class JuicePatrolPredictedEmpty(JuicePatrolEntity, SensorEntity):
    """Predicted empty date sensor for a monitored device."""

    _attr_translation_key = "predicted_empty"
    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_entity_registry_enabled_default = False

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
            id_suffix="predicted_empty",
        )

    @property
    def native_value(self) -> datetime | None:
        if self._entity_data.get("is_stale"):
            return None
        prediction = self._entity_data.get("prediction")
        if prediction and prediction.estimated_empty_timestamp:
            return datetime.fromtimestamp(
                prediction.estimated_empty_timestamp, tz=UTC
            )
        return None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        prediction = self._entity_data.get("prediction")
        if prediction:
            return {
                "source_entity": self._source_entity_id,
                "confidence": prediction.confidence,
                "discharge_rate_per_day": prediction.slope_per_day,
                "data_points_used": prediction.data_points_used,
                "r_squared": prediction.r_squared,
                "status": prediction.status,
                "reliability": prediction.reliability,
            }
        return {"source_entity": self._source_entity_id}


class JuicePatrolDaysRemaining(JuicePatrolEntity, SensorEntity):
    """Days remaining sensor for a monitored device."""

    _attr_translation_key = "days_remaining"
    _attr_native_unit_of_measurement = UnitOfTime.DAYS
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
            id_suffix="days_remaining",
        )

    @property
    def native_value(self) -> float | None:
        if self._entity_data.get("is_stale"):
            return None
        prediction = self._entity_data.get("prediction")
        if prediction and prediction.estimated_days_remaining is not None:
            return prediction.estimated_days_remaining
        return None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        prediction = self._entity_data.get("prediction")
        if prediction:
            return {
                "source_entity": self._source_entity_id,
                "confidence": prediction.confidence,
                "status": prediction.status,
                "reliability": prediction.reliability,
                "hours_remaining": prediction.estimated_hours_remaining,
            }
        return {"source_entity": self._source_entity_id}


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
