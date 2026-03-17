"""Battery entity/device auto-discovery engine for Juice Patrol."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.const import PERCENTAGE
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er

from ..const import DOMAIN

_LOGGER = logging.getLogger(__name__)

# Attributes that indicate battery level on entities without device_class: battery
BATTERY_ATTRIBUTES = ("battery_level", "battery", "battery_state")

# String-to-percentage mapping for devices that report battery as text
BATTERY_STRING_MAP: dict[str, int | None] = {
    "normal": 100,
    "full": 100,
    "high": 75,
    "medium": 50,
    "low": 25,
    "critical": 5,
    "empty": 0,
}


class SourceType(StrEnum):
    """How the battery entity was discovered."""

    DEVICE_CLASS_SENSOR = "device_class_sensor"
    ATTRIBUTE_BATTERY_LEVEL = "attribute_battery_level"


@dataclass
class DiscoveredBattery:
    """A discovered battery entity."""

    entity_id: str
    device_id: str | None
    device_name: str | None
    current_level: float | None
    source_type: SourceType
    platform: str | None = None  # integration that provides this entity
    manufacturer: str | None = None
    model: str | None = None


def parse_battery_level(value: Any) -> float | None:
    """Parse a battery level from a state value or attribute.

    Handles numeric values and string descriptions.
    Returns a float 0-100 or None if unparseable.
    """
    if value is None:
        return None

    # Numeric
    if isinstance(value, (int, float)):
        return float(value) if 0 <= value <= 100 else None

    # String
    if isinstance(value, str):
        # Try numeric string first
        try:
            num = float(value)
            return num if 0 <= num <= 100 else None
        except ValueError:
            pass

        # Try known string mappings
        mapped = BATTERY_STRING_MAP.get(value.lower())
        if mapped is not None:
            return float(mapped)

    return None


async def async_discover_batteries(
    hass: HomeAssistant,
    ignored_entities: set[str] | None = None,
) -> list[DiscoveredBattery]:
    """Discover all battery-powered entities.

    Scans the entity registry for:
    1. Entities with device_class 'battery' (primary method)
    2. Entities with battery-related attributes (fallback)

    Returns a deduplicated list of DiscoveredBattery objects.
    """
    ignored = ignored_entities or set()
    ent_reg = er.async_get(hass)
    dev_reg = dr.async_get(hass)
    discovered: dict[str, DiscoveredBattery] = {}

    # Pass 1: entities with device_class: battery
    for entry in ent_reg.entities.values():
        if entry.entity_id in ignored:
            continue
        if entry.disabled:
            continue
        # Skip our own entities to prevent self-referential discovery
        if entry.platform == DOMAIN:
            continue
        if (
            entry.original_device_class != SensorDeviceClass.BATTERY
            and entry.device_class != SensorDeviceClass.BATTERY
        ):
            continue
        # Skip non-percentage battery sensors (e.g. battery voltage, temperature)
        if entry.unit_of_measurement and entry.unit_of_measurement != PERCENTAGE:
            continue

        device_name, manufacturer, model = _get_device_info(dev_reg, entry.device_id)
        state = hass.states.get(entry.entity_id)
        level = parse_battery_level(state.state) if state else None

        discovered[entry.entity_id] = DiscoveredBattery(
            entity_id=entry.entity_id,
            device_id=entry.device_id,
            device_name=device_name,
            current_level=level,
            source_type=SourceType.DEVICE_CLASS_SENSOR,
            platform=entry.platform,
            manufacturer=manufacturer,
            model=model,
        )

    # Pass 2: entities with battery attributes (that weren't already found)
    for state in hass.states.async_all():
        if state.entity_id in ignored or state.entity_id in discovered:
            continue

        # Skip our own entities
        reg_entry = ent_reg.async_get(state.entity_id)
        if reg_entry and reg_entry.platform == DOMAIN:
            continue

        attrs = state.attributes
        for attr_name in BATTERY_ATTRIBUTES:
            if attr_name not in attrs:
                continue

            level = parse_battery_level(attrs[attr_name])
            if level is None:
                continue

            # Find device_id from entity registry
            entry = ent_reg.async_get(state.entity_id)
            device_id = entry.device_id if entry else None
            device_name, manufacturer, model = _get_device_info(dev_reg, device_id)

            discovered[state.entity_id] = DiscoveredBattery(
                entity_id=state.entity_id,
                device_id=device_id,
                device_name=device_name,
                current_level=level,
                source_type=SourceType.ATTRIBUTE_BATTERY_LEVEL,
                platform=entry.platform if entry else None,
                manufacturer=manufacturer,
                model=model,
            )
            break  # Found a battery attribute, no need to check others

    # Deduplicate by device_id: keep one entity per device.
    # Prefer device_class sensors over attribute-based ones.
    seen_devices: dict[str, str] = {}  # device_id -> entity_id
    deduped: dict[str, DiscoveredBattery] = {}
    for entity_id, battery in discovered.items():
        if battery.device_id is None:
            # No device — keep as-is (can't dedup)
            deduped[entity_id] = battery
            continue

        existing_eid = seen_devices.get(battery.device_id)
        if existing_eid is None:
            # First entity for this device
            seen_devices[battery.device_id] = entity_id
            deduped[entity_id] = battery
        else:
            # Already have one for this device — prefer device_class sensor,
            # and break ties deterministically by entity_id sort order
            existing = deduped[existing_eid]
            prefer_new = False
            if (
                battery.source_type == SourceType.DEVICE_CLASS_SENSOR
                and existing.source_type != SourceType.DEVICE_CLASS_SENSOR
            ):
                prefer_new = True
            elif (
                battery.source_type == existing.source_type
                and entity_id < existing_eid
            ):
                # Same source type — pick lexically first for stability
                prefer_new = True

            if prefer_new:
                del deduped[existing_eid]
                seen_devices[battery.device_id] = entity_id
                deduped[entity_id] = battery

    result = list(deduped.values())
    _LOGGER.info("Discovered %d battery entities (%d before dedup)",
                 len(result), len(discovered))
    _LOGGER.debug(
        "Battery entities: %s",
        [b.entity_id for b in result],
    )
    return result


def _get_device_info(
    dev_reg: dr.DeviceRegistry, device_id: str | None
) -> tuple[str | None, str | None, str | None]:
    """Get device name, manufacturer, and model from the device registry.

    Returns (name, manufacturer, model).
    """
    if device_id is None:
        return None, None, None
    device = dev_reg.async_get(device_id)
    if device is None:
        return None, None, None
    name = device.name_by_user or device.name
    manufacturer = str(device.manufacturer).strip() if device.manufacturer else None
    model = str(device.model).strip() if device.model else None
    return name, manufacturer, model
