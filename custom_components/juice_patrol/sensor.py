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
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import JuicePatrolConfigEntry
from .const import DOMAIN
from .data import JuicePatrolCoordinator
from .entity import JUICE_PATROL_DEVICE_INFO, JuicePatrolEntity, slugify_entity

_LOGGER = logging.getLogger(__name__)

PARALLEL_UPDATES = 0


def _is_rechargeable(
    coordinator: JuicePatrolCoordinator,
    entity_id: str,
    info: dict[str, Any],
) -> bool:
    """Check if a device is rechargeable from coordinator data or store."""
    if info.get("is_rechargeable"):
        return True
    # During deferred build coordinator.data is {}, fall back to store
    dev = coordinator.store.get_device(entity_id)
    return dev is not None and dev.is_rechargeable is True


async def async_setup_entry(
    hass: HomeAssistant,
    entry: JuicePatrolConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Juice Patrol sensors."""
    coordinator: JuicePatrolCoordinator = entry.runtime_data
    known: set[str] = set()
    known_rechargeable: set[str] = set()

    def _create_sensors(entity_ids: list[str]) -> None:
        """Create sensor entities for a list of source entity IDs."""
        new_entities: list[SensorEntity] = []
        for entity_id in entity_ids:
            if entity_id in known:
                continue
            known.add(entity_id)
            info = (coordinator.data or {}).get(entity_id, {})
            slug = slugify_entity(entity_id)
            # Universal sensors — always created
            new_entities.append(
                JuicePatrolDischargeRate(coordinator, entity_id, slug, info)
            )
            new_entities.append(
                JuicePatrolPredictedEmpty(coordinator, entity_id, slug, info)
            )
            new_entities.append(
                JuicePatrolDaysRemaining(coordinator, entity_id, slug, info)
            )
            # Rechargeable-only sensors
            if _is_rechargeable(coordinator, entity_id, info):
                known_rechargeable.add(entity_id)
                new_entities.append(
                    JuicePatrolSoH(coordinator, entity_id, slug, info)
                )
                new_entities.append(
                    JuicePatrolSoHCycling(coordinator, entity_id, slug, info)
                )
                new_entities.append(
                    JuicePatrolKneeRisk(coordinator, entity_id, slug, info)
                )
        if new_entities:
            async_add_entities(new_entities)

    def _handle_update() -> None:
        """Add rechargeable sensors when a device's rechargeable flag changes."""
        new_entities: list[SensorEntity] = []
        for entity_id, info in (coordinator.data or {}).items():
            if (
                info.get("is_rechargeable")
                and entity_id in known
                and entity_id not in known_rechargeable
            ):
                known_rechargeable.add(entity_id)
                slug = slugify_entity(entity_id)
                new_entities.append(
                    JuicePatrolSoH(coordinator, entity_id, slug, info)
                )
                new_entities.append(
                    JuicePatrolSoHCycling(coordinator, entity_id, slug, info)
                )
                new_entities.append(
                    JuicePatrolKneeRisk(coordinator, entity_id, slug, info)
                )
        if new_entities:
            _LOGGER.debug(
                "Adding rechargeable sensors for %d newly-rechargeable devices",
                len(new_entities) // 3,
            )
            async_add_entities(new_entities)

    # Create entities for all discovered devices — coordinator.data may
    # still be empty (deferred build), but discovered entities are available
    # immediately.  Entities start with empty state and get populated when
    # the deferred build completes and async_set_updated_data fires.
    _create_sensors(list(coordinator.discovered.keys()))

    # Register callback for dynamically discovered devices
    coordinator.async_register_new_device_callback(_create_sensors)

    # Listen for coordinator updates to catch rechargeable flag changes
    entry.async_on_unload(coordinator.async_add_listener(_handle_update))

    # Clean up orphaned rechargeable-only sensors for non-rechargeable devices.
    # These were created unconditionally in earlier versions.
    _RECHARGEABLE_SUFFIXES = ("_soh", "_soh_cycling", "_knee_risk")
    ent_reg = er.async_get(hass)
    for reg_entry in er.async_entries_for_config_entry(ent_reg, entry.entry_id):
        if reg_entry.domain != "sensor":
            continue
        uid = reg_entry.unique_id
        if any(uid.endswith(s) for s in _RECHARGEABLE_SUFFIXES):
            # Extract source entity_id from unique_id:
            # format is "juice_patrol_sensor.xxx_suffix"
            for suffix in _RECHARGEABLE_SUFFIXES:
                if uid.endswith(suffix):
                    source = uid.removeprefix(f"{DOMAIN}_").removesuffix(suffix)
                    break
            if source not in known_rechargeable:
                ent_reg.async_remove(reg_entry.entity_id)

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
            import time as _time
            if (prediction.estimated_empty_timestamp - _time.time()) > 3650 * 86400:
                return None
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
            if prediction.estimated_days_remaining > 3650:
                return None
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


class JuicePatrolSoH(JuicePatrolEntity, SensorEntity):
    """State of Health sensor for a monitored device."""

    _attr_translation_key = "soh"
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_suggested_display_precision = 1

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
            id_suffix="soh",
        )

    @property
    def native_value(self) -> float | None:
        return self._entity_data.get("soh")


class JuicePatrolSoHCycling(JuicePatrolEntity, SensorEntity):
    """Cycle health sensor (SoH from Miner's rule damage)."""

    _attr_translation_key = "soh_cycling"
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_suggested_display_precision = 1

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
            id_suffix="soh_cycling",
        )

    @property
    def native_value(self) -> float | None:
        return self._entity_data.get("soh_cycling")


class JuicePatrolKneeRisk(JuicePatrolEntity, SensorEntity):
    """Knee-point risk sensor for a monitored device."""

    _attr_translation_key = "knee_risk"
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_suggested_display_precision = 0

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
            id_suffix="knee_risk",
        )

    @property
    def native_value(self) -> float | None:
        raw = self._entity_data.get("knee_risk")
        if raw is not None:
            return round(raw * 100, 1)
        return None


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
