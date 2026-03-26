"""Battery type auto-detection for Juice Patrol.

Layers (in priority order):
1. Manual override (user-set via UI) — handled by store, not here
2. Entity/device attributes — check for battery_type attributes
3. Battery Notes library — fetch device→battery_type mapping from GitHub
"""

from __future__ import annotations

import logging
from typing import Any

from aiohttp import ClientTimeout

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.aiohttp_client import async_get_clientsession

_LOGGER = logging.getLogger(__name__)

BATTERY_NOTES_LIBRARY_URL = (
    "https://raw.githubusercontent.com/andrew-codechimp/HA-Battery-Notes"
    "/main/library/library.json"
)

# Attributes that may contain battery type information
TYPE_ATTRIBUTES = ("battery_type", "battery_kind")


class BatteryTypeResolver:
    """Resolves battery types from attributes and Battery Notes library."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the resolver."""
        self._hass = hass
        # Library indexed by lowercase manufacturer for O(1) lookup
        self._library_by_mfr: dict[str, list[dict[str, Any]]] = {}
        self._library_loaded = False
        # Cache resolved types: device_id -> (battery_type, source)
        self._cache: dict[str, tuple[str | None, str | None]] = {}

    async def async_load_library(self) -> None:
        """Fetch Battery Notes library from GitHub (once)."""
        if self._library_loaded:
            return

        self._library_loaded = True
        try:
            session = async_get_clientsession(self._hass)
            resp = await session.get(
                BATTERY_NOTES_LIBRARY_URL, timeout=ClientTimeout(total=15)
            )
            if resp.status != 200:
                _LOGGER.warning(
                    "Failed to fetch Battery Notes library: HTTP %s", resp.status
                )
                return

            data = await resp.json(content_type=None)
            devices = data.get("devices", [])

            # Index by lowercase manufacturer for fast lookup
            for entry in devices:
                mfr = (entry.get("manufacturer") or "").strip().lower()
                if mfr:
                    self._library_by_mfr.setdefault(mfr, []).append(entry)

            total = sum(len(v) for v in self._library_by_mfr.values())
            _LOGGER.info(
                "Loaded Battery Notes library: %d devices (%d manufacturers)",
                total,
                len(self._library_by_mfr),
            )
        except Exception:
            _LOGGER.warning(
                "Could not fetch Battery Notes library — "
                "battery type auto-detection from library unavailable",
                exc_info=True,
            )

    def invalidate_cache(self, entity_id: str | None = None) -> None:
        """Invalidate cached type resolution.

        Call when the user sets/clears a manual battery type override.
        Pass entity_id to invalidate a single device, or None to clear all.
        """
        if entity_id is None:
            self._cache.clear()
        else:
            self._cache.pop(entity_id, None)

    def resolve_type(
        self,
        entity_id: str,
        device_id: str | None,
    ) -> tuple[str | None, str | None]:
        """Resolve battery type for a device.

        Returns (battery_type, source) where source describes how it was found.
        Returns (None, None) if no type could be determined.
        Results are cached per entity_id.
        """
        cached = self._cache.get(entity_id)
        if cached is not None:
            return cached

        result = self.resolve_uncached(entity_id, device_id)
        # Only cache positive matches — (None, None) may be a race with
        # the Battery Notes library still loading in the background.
        if result != (None, None):
            self._cache[entity_id] = result
        return result

    def resolve_uncached(
        self,
        entity_id: str,
        device_id: str | None,
    ) -> tuple[str | None, str | None]:
        """Resolve battery type without cache (bypasses and does not update cache)."""
        # Layer (c): check entity/device attributes
        result = self._from_attributes(entity_id, device_id)
        if result:
            return result

        # Layer (b): Battery Notes library lookup
        if self._library_by_mfr and device_id:
            result = self._from_library(device_id)
            if result:
                return result

        return None, None

    def _from_attributes(
        self,
        entity_id: str,
        device_id: str | None,
    ) -> tuple[str, str] | None:
        """Check entity attributes for battery type info."""
        # Check the source entity itself
        state = self._hass.states.get(entity_id)
        if state:
            for attr in TYPE_ATTRIBUTES:
                val = state.attributes.get(attr)
                if val and isinstance(val, str) and val.strip():
                    return val.strip(), f"attribute: {attr}"

        # Check sibling entities on the same device
        if device_id:
            ent_reg = er.async_get(self._hass)
            for entry in er.async_entries_for_device(ent_reg, device_id):
                if entry.entity_id == entity_id:
                    continue
                sibling_state = self._hass.states.get(entry.entity_id)
                if not sibling_state:
                    continue
                for attr in TYPE_ATTRIBUTES:
                    val = sibling_state.attributes.get(attr)
                    if val and isinstance(val, str) and val.strip():
                        return val.strip(), f"sibling attribute: {attr}"

                # Battery Notes creates sensor.*_battery_type entities
                if "battery_type" in entry.entity_id and sibling_state.state:
                    bt = sibling_state.state.strip()
                    if bt and bt not in ("unknown", "unavailable"):
                        return bt, "battery_notes entity"

        return None

    def _from_library(self, device_id: str) -> tuple[str, str] | None:
        """Look up battery type from Battery Notes library by manufacturer+model."""
        dev_reg = dr.async_get(self._hass)
        device = dev_reg.async_get(device_id)
        if not device or not device.manufacturer or not device.model:
            return None

        manufacturer = str(device.manufacturer).strip().lower()
        entries = self._library_by_mfr.get(manufacturer)
        if not entries:
            return None

        model_lower = str(device.model).strip().lower()
        hw_version = str(device.hw_version or "").strip().lower()

        for entry in entries:
            entry_model = (entry.get("model") or "").strip()
            entry_model_lower = entry_model.lower()
            match_method = entry.get("model_match_method", "exact")

            # Check hw_version match if entry specifies one
            entry_hw = (entry.get("hw_version") or "").strip().lower()
            if entry_hw and hw_version and entry_hw != hw_version:
                continue

            matched = False
            if match_method == "startswith":
                matched = model_lower.startswith(entry_model_lower)
            elif match_method == "endswith":
                matched = model_lower.endswith(entry_model_lower)
            elif match_method == "contains":
                matched = entry_model_lower in model_lower
            else:  # exact
                matched = model_lower == entry_model_lower

            if matched:
                battery_type = entry.get("battery_type", "")
                quantity = entry.get("battery_quantity", 1)
                if quantity and quantity > 1:
                    battery_type = f"{quantity}× {battery_type}"
                return battery_type, "battery_notes library"

        return None
