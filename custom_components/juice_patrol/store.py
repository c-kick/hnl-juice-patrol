"""Persistent JSON storage for Juice Patrol device metadata."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import STORE_KEY, STORE_VERSION

_LOGGER = logging.getLogger(__name__)


@dataclass
class DeviceData:
    """In-memory representation of a single device's metadata."""

    last_replaced: float | None = None
    ignored: bool = False
    custom_threshold: int | None = None
    battery_type: str | None = None  # e.g. "CR2032", "AA", "AAA"
    is_rechargeable: bool | None = None  # None=auto-detect, True/False=manual
    replacement_confirmed: bool = True  # False when jump detected but not confirmed
    source_entity: str = ""
    device_id: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any], entity_id: str) -> DeviceData:
        """Create from stored dict."""
        return cls(
            last_replaced=data.get("last_replaced"),
            ignored=data.get("ignored", False),
            custom_threshold=data.get("custom_threshold"),
            battery_type=data.get("battery_type"),
            is_rechargeable=data.get("is_rechargeable"),
            replacement_confirmed=data.get("replacement_confirmed", True),
            source_entity=data.get("source_entity", entity_id),
            device_id=data.get("device_id"),
        )

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dict for storage."""
        result: dict[str, Any] = {
            "last_replaced": self.last_replaced,
            "ignored": self.ignored,
            "replacement_confirmed": self.replacement_confirmed,
            "source_entity": self.source_entity,
            "device_id": self.device_id,
        }
        if self.custom_threshold is not None:
            result["custom_threshold"] = self.custom_threshold
        if self.battery_type is not None:
            result["battery_type"] = self.battery_type
        if self.is_rechargeable is not None:
            result["is_rechargeable"] = self.is_rechargeable
        return result


@dataclass
class StoreData:
    """Full store contents."""

    version: int = STORE_VERSION
    devices: dict[str, DeviceData] = field(default_factory=dict)


class JuicePatrolStore:
    """Manages persistent storage of device metadata."""

    # Old store key from v1 (readings-based architecture)
    _OLD_STORE_KEY = "juice_patrol.history"

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the store."""
        self._hass = hass
        self._store = Store[dict[str, Any]](hass, STORE_VERSION, STORE_KEY)
        self._data = StoreData()
        self._dirty = False

    @property
    def devices(self) -> dict[str, DeviceData]:
        """Return the device data dict."""
        return self._data.devices

    async def async_load(self) -> None:
        """Load data from disk."""
        raw = await self._store.async_load()
        if raw is None:
            # Try loading from old store key (v1 migration)
            old_store = Store[dict[str, Any]](
                self._hass, 1, self._OLD_STORE_KEY
            )
            raw = await old_store.async_load()
            if raw is not None:
                _LOGGER.info("Found old store at %s, migrating", self._OLD_STORE_KEY)
                # Remove old store after migration
                await old_store.async_remove()
            else:
                _LOGGER.info("No existing store found, starting fresh")
                self._data = StoreData()
                return

        try:
            old_version = raw.get("version", 1)

            # Migration from v1 → v2: strip readings from each device
            if old_version < STORE_VERSION:
                _LOGGER.info(
                    "Migrating store from v%d to v%d (stripping readings)",
                    old_version,
                    STORE_VERSION,
                )
                for dev_data in raw.get("devices", {}).values():
                    dev_data.pop("readings", None)
                self._dirty = True

            self._data = StoreData(
                version=STORE_VERSION,
                devices={
                    entity_id: DeviceData.from_dict(dev_data, entity_id)
                    for entity_id, dev_data in raw.get("devices", {}).items()
                },
            )
            _LOGGER.info(
                "Loaded store with %d devices", len(self._data.devices)
            )
        except Exception:
            _LOGGER.exception("Corrupt store data, starting fresh")
            self._data = StoreData()

    async def async_save(self) -> None:
        """Save data to disk if dirty."""
        if not self._dirty:
            return

        data: dict[str, Any] = {
            "version": self._data.version,
            "devices": {
                entity_id: dev.to_dict()
                for entity_id, dev in self._data.devices.items()
            },
        }
        await self._store.async_save(data)
        self._dirty = False
        _LOGGER.debug("Store saved (%d devices)", len(self._data.devices))

    def ensure_device(
        self,
        entity_id: str,
        *,
        device_id: str | None = None,
    ) -> DeviceData:
        """Get or create device metadata entry."""
        if entity_id not in self._data.devices:
            self._data.devices[entity_id] = DeviceData(
                source_entity=entity_id,
                device_id=device_id,
            )
            self._dirty = True
        dev = self._data.devices[entity_id]
        if device_id and dev.device_id != device_id:
            dev.device_id = device_id
            self._dirty = True
        return dev

    def get_device(self, entity_id: str) -> DeviceData | None:
        """Get device data for an entity."""
        return self._data.devices.get(entity_id)

    def mark_replaced(self, entity_id: str) -> bool:
        """Manually mark a battery as replaced."""
        dev = self._data.devices.get(entity_id)
        if dev is None:
            return False

        dev.last_replaced = time.time()
        dev.replacement_confirmed = False
        self._dirty = True
        _LOGGER.info("Battery manually marked as replaced: %s", entity_id)
        return True

    def set_ignored(self, entity_id: str, ignored: bool) -> None:
        """Set the ignored flag for a device."""
        if entity_id not in self._data.devices:
            self._data.devices[entity_id] = DeviceData(
                source_entity=entity_id,
            )
        self._data.devices[entity_id].ignored = ignored
        self._dirty = True

    def set_device_threshold(
        self, entity_id: str, threshold: int | None
    ) -> bool:
        """Set a custom threshold for a device. Returns False if not found."""
        dev = self._data.devices.get(entity_id)
        if dev is None:
            return False
        dev.custom_threshold = threshold
        self._dirty = True
        return True

    def set_battery_type(
        self, entity_id: str, battery_type: str | None
    ) -> bool:
        """Set battery type for a device. Returns False if not found."""
        dev = self._data.devices.get(entity_id)
        if dev is None:
            return False
        dev.battery_type = battery_type
        self._dirty = True
        return True

    def set_rechargeable(
        self, entity_id: str, is_rechargeable: bool | None
    ) -> bool:
        """Set rechargeable override. None = auto-detect. Returns False if not found."""
        dev = self._data.devices.get(entity_id)
        if dev is None:
            return False
        dev.is_rechargeable = is_rechargeable
        self._dirty = True
        return True

    def set_replacement_confirmed(
        self, entity_id: str, confirmed: bool
    ) -> bool:
        """Set replacement confirmation state. Returns False if not found."""
        dev = self._data.devices.get(entity_id)
        if dev is None:
            return False
        dev.replacement_confirmed = confirmed
        self._dirty = True
        return True

    def mark_dirty(self) -> None:
        """Mark the store as having unsaved changes."""
        self._dirty = True

    def get_ignored_entities(self) -> set[str]:
        """Return the set of ignored entity IDs."""
        return {
            entity_id
            for entity_id, dev in self._data.devices.items()
            if dev.ignored
        }

    def remove_device(self, entity_id: str) -> bool:
        """Remove a device from the store."""
        if entity_id in self._data.devices:
            del self._data.devices[entity_id]
            self._dirty = True
            return True
        return False
