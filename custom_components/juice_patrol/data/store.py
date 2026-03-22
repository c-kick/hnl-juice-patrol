"""Persistent JSON storage for Juice Patrol device metadata."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from ..const import (
    MAX_DENIED_REPLACEMENTS,
    MAX_REPLACEMENT_HISTORY,
    STORE_KEY,
    STORE_MINOR_VERSION,
    STORE_VERSION,
)
from ..engine.models import MAX_CYCLES_PER_DEVICE

_LOGGER = logging.getLogger(__name__)


@dataclass
class DeviceData:
    """In-memory representation of a single device's metadata."""

    replacement_history: list[float] = field(default_factory=list)
    denied_replacements: list[float] = field(default_factory=list)
    ignored: bool = False
    custom_threshold: int | None = None
    battery_type: str | None = None  # e.g. "CR2032", "AA", "AAA"
    is_rechargeable: bool | None = None  # None=auto-detect, True/False=manual
    replacement_confirmed: bool = True  # False when jump detected but not confirmed
    source_entity: str = ""
    device_id: str | None = None
    completed_cycles: list[dict] = field(default_factory=list)
    # Each cycle: {"start_t": float, "end_t": float, "start_pct": float,
    #              "end_pct": float, "duration_days": float,
    #              "model": str, "params": dict}
    # Chemistry override — when set, takes precedence over auto-detected
    # chemistry from battery_type.  Optional field with None default; no
    # store migration required (existing records simply won't have the key
    # and from_dict handles missing keys gracefully via .get()).
    chemistry_override: str | None = None

    @property
    def last_replaced(self) -> float | None:
        """Return the most recent replacement timestamp, or None."""
        return self.replacement_history[-1] if self.replacement_history else None

    @classmethod
    def from_dict(cls, data: dict[str, Any], entity_id: str) -> DeviceData:
        """Create from stored dict."""
        # Support both v3 (replacement_history) and v2 (last_replaced) formats
        replacement_history = data.get("replacement_history", [])
        if not replacement_history:
            last_replaced = data.get("last_replaced")
            if last_replaced is not None:
                replacement_history = [last_replaced]
        return cls(
            replacement_history=replacement_history,
            denied_replacements=data.get("denied_replacements", []),
            ignored=data.get("ignored", False),
            custom_threshold=data.get("custom_threshold"),
            battery_type=data.get("battery_type"),
            is_rechargeable=data.get("is_rechargeable"),
            replacement_confirmed=data.get("replacement_confirmed", True),
            source_entity=data.get("source_entity", entity_id),
            device_id=data.get("device_id"),
            completed_cycles=data.get("completed_cycles", []),
            chemistry_override=data.get("chemistry_override"),
        )

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dict for storage."""
        result: dict[str, Any] = {
            "replacement_history": self.replacement_history,
            "denied_replacements": self.denied_replacements,
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
        if self.completed_cycles:
            result["completed_cycles"] = self.completed_cycles
        if self.chemistry_override is not None:
            result["chemistry_override"] = self.chemistry_override
        return result


@dataclass
class StoreData:
    """Full store contents."""

    version: int = STORE_MINOR_VERSION
    devices: dict[str, DeviceData] = field(default_factory=dict)
    bootstrap_complete: bool = False


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

    @property
    def bootstrap_complete(self) -> bool:
        """Return whether the cycle bootstrap has run."""
        return self._data.bootstrap_complete

    @bootstrap_complete.setter
    def bootstrap_complete(self, value: bool) -> None:
        """Set the bootstrap complete flag."""
        self._data.bootstrap_complete = value
        self._dirty = True

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

            if old_version < STORE_MINOR_VERSION:
                _LOGGER.info(
                    "Migrating store from v%d to v%d",
                    old_version,
                    STORE_MINOR_VERSION,
                )
                for dev_data in raw.get("devices", {}).values():
                    # v1 → v2: strip readings
                    if old_version < 2:
                        dev_data.pop("readings", None)
                    # v2 → v3: convert last_replaced to replacement_history
                    if old_version < 3:
                        lr = dev_data.pop("last_replaced", None)
                        if lr is not None:
                            dev_data["replacement_history"] = [lr]
                        else:
                            dev_data.setdefault("replacement_history", [])
                    # v3 → v4: add completed_cycles
                    if old_version < 4:
                        dev_data.setdefault("completed_cycles", [])
                self._dirty = True

            self._data = StoreData(
                version=STORE_MINOR_VERSION,
                devices={
                    entity_id: DeviceData.from_dict(dev_data, entity_id)
                    for entity_id, dev_data in raw.get("devices", {}).items()
                },
                bootstrap_complete=raw.get("bootstrap_complete", False),
            )
            _LOGGER.info(
                "Loaded store with %d devices", len(self._data.devices)
            )
        except Exception:
            _LOGGER.exception("Corrupt store data, starting fresh")
            self._data = StoreData()

    async def async_save(self) -> None:
        """Save data to disk if dirty.

        Only clears the dirty flag after a successful save so data
        is re-persisted on the next attempt if the write fails.
        """
        if not self._dirty:
            return

        data: dict[str, Any] = {
            "version": self._data.version,
            "devices": {
                entity_id: dev.to_dict()
                for entity_id, dev in self._data.devices.items()
            },
            "bootstrap_complete": self._data.bootstrap_complete,
        }
        try:
            await self._store.async_save(data)
            self._dirty = False
            _LOGGER.debug("Store saved (%d devices)", len(self._data.devices))
        except Exception:
            _LOGGER.warning(
                "Failed to save store, will retry on next save cycle",
                exc_info=True,
            )
            # Do NOT clear _dirty — data will be retried on next save

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

    @staticmethod
    def _dedup_and_cap_timestamps(
        timestamps: list[float], max_count: int, tolerance: float = 60.0
    ) -> list[float]:
        """Deduplicate timestamps within tolerance and cap the list length.

        Keeps the most recent entries when exceeding max_count.
        """
        if not timestamps:
            return timestamps
        timestamps.sort()
        # Deduplicate: remove entries within tolerance of each other
        deduped = [timestamps[0]]
        for ts in timestamps[1:]:
            if abs(ts - deduped[-1]) > tolerance:
                deduped.append(ts)
        # Cap: keep most recent entries
        if len(deduped) > max_count:
            deduped = deduped[-max_count:]
        return deduped

    def mark_replaced(self, entity_id: str) -> bool:
        """Manually mark a battery as replaced (appends to history)."""
        dev = self._data.devices.get(entity_id)
        if dev is None:
            return False

        now = time.time()
        # Deduplicate: don't add if there's already a timestamp within 60s
        if dev.replacement_history and abs(dev.replacement_history[-1] - now) < 60:
            dev.replacement_confirmed = True
            self._dirty = True
            return True

        dev.replacement_history.append(now)
        dev.replacement_history = self._dedup_and_cap_timestamps(
            dev.replacement_history, MAX_REPLACEMENT_HISTORY
        )
        dev.replacement_confirmed = True
        self._dirty = True
        _LOGGER.info("Battery manually marked as replaced: %s", entity_id)
        return True

    def mark_replaced_at(self, entity_id: str, timestamp: float) -> bool:
        """Mark a battery as replaced at a specific timestamp (inserts chronologically)."""
        dev = self._data.devices.get(entity_id)
        if dev is None:
            return False

        # Deduplicate: don't add if there's already a timestamp within 60s
        if any(abs(ts - timestamp) < 60 for ts in dev.replacement_history):
            dev.replacement_confirmed = True
            self._dirty = True
            return True

        dev.replacement_history.append(timestamp)
        dev.replacement_history = self._dedup_and_cap_timestamps(
            dev.replacement_history, MAX_REPLACEMENT_HISTORY
        )
        dev.replacement_confirmed = True
        self._dirty = True
        _LOGGER.info("Battery marked as replaced at %s: %s", timestamp, entity_id)
        return True

    def undo_replacement(self, entity_id: str) -> bool:
        """Undo the most recent replacement (pops from history stack)."""
        dev = self._data.devices.get(entity_id)
        if dev is None:
            return False

        if dev.replacement_history:
            dev.replacement_history.pop()
        dev.replacement_confirmed = True
        self._dirty = True
        _LOGGER.info("Battery replacement undone: %s", entity_id)
        return True

    def remove_replacement(self, entity_id: str, timestamp: float) -> bool:
        """Remove a specific replacement by timestamp."""
        dev = self._data.devices.get(entity_id)
        if dev is None:
            return False
        try:
            dev.replacement_history.remove(timestamp)
        except ValueError:
            return False
        dev.replacement_confirmed = True
        self._dirty = True
        _LOGGER.info("Battery replacement removed (ts=%s): %s", timestamp, entity_id)
        return True

    def deny_replacement(self, entity_id: str, timestamp: float) -> bool:
        """Deny a suspected replacement (prevents re-suggestion)."""
        dev = self._data.devices.get(entity_id)
        if dev is None:
            return False

        dev.denied_replacements.append(timestamp)
        dev.denied_replacements = self._dedup_and_cap_timestamps(
            dev.denied_replacements, MAX_DENIED_REPLACEMENTS
        )
        self._dirty = True
        _LOGGER.info("Suspected replacement denied at %s: %s", timestamp, entity_id)
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

    def set_chemistry_override(
        self, entity_id: str, chemistry: str | None
    ) -> bool:
        """Set chemistry override. None = use auto-detected. Returns False if not found."""
        dev = self._data.devices.get(entity_id)
        if dev is None:
            return False
        dev.chemistry_override = chemistry
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

    def add_completed_cycle(
        self, entity_id: str, cycle: dict,
    ) -> bool:
        """Append a completed cycle to a device's history.

        Deduplicates by end_t (within 60s tolerance). Caps at
        MAX_CYCLES_PER_DEVICE, evicting oldest.

        Returns True if added, False if device not found or duplicate.
        """
        dev = self._data.devices.get(entity_id)
        if dev is None:
            return False

        end_t = cycle.get("end_t")
        if end_t is not None:
            # Deduplicate: don't add if there's already a cycle ending near this time
            for existing in dev.completed_cycles:
                if abs(existing.get("end_t", 0) - end_t) < 60:
                    return False

        dev.completed_cycles.append(cycle)
        # Cap at max, evict oldest
        if len(dev.completed_cycles) > MAX_CYCLES_PER_DEVICE:
            dev.completed_cycles = dev.completed_cycles[-MAX_CYCLES_PER_DEVICE:]
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
