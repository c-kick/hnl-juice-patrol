"""Recorder bridge for Juice Patrol — fetches battery readings from HA recorder.

Two data sources, tried in order:
1. Long-term statistics (hourly means) — available for entities with state_class
2. Raw state history (significant changes) — fallback for entities without
   state_class (phones, tablets, etc.) — kept for recorder purge_keep_days
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta

from homeassistant.core import HomeAssistant
from homeassistant.util.dt import utcnow

from .const import HISTORY_CACHE_TTL, HISTORY_DEFAULT_DAYS

_LOGGER = logging.getLogger(__name__)

# Max days to query raw history (HA default purge is 10 days)
_RAW_HISTORY_DAYS = 10


class HistoryCache:
    """In-memory cache for recorder queries."""

    def __init__(self) -> None:
        """Initialize the cache."""
        self._cache: dict[str, tuple[float, list[dict[str, float]]]] = {}

    def invalidate(self, entity_id: str) -> None:
        """Remove a single entity from the cache."""
        self._cache.pop(entity_id, None)

    def invalidate_all(self) -> None:
        """Clear the entire cache."""
        self._cache.clear()

    def get(self, entity_id: str) -> list[dict[str, float]] | None:
        """Get cached readings if not expired, else None."""
        entry = self._cache.get(entity_id)
        if entry is None:
            return None
        expire_ts, readings = entry
        if time.time() > expire_ts:
            del self._cache[entity_id]
            return None
        return readings

    def set(self, entity_id: str, readings: list[dict[str, float]]) -> None:
        """Store readings in cache with TTL."""
        self._cache[entity_id] = (time.time() + HISTORY_CACHE_TTL, readings)


async def async_get_readings(
    hass: HomeAssistant,
    entity_id: str,
    since: datetime | None = None,
    cache: HistoryCache | None = None,
) -> list[dict[str, float]]:
    """Get battery readings from recorder.

    Tries long-term statistics first (hourly means, up to HISTORY_DEFAULT_DAYS).
    Falls back to raw state history (up to ~10 days) for entities without
    state_class (phones, tablets, etc.).

    Returns [{"t": unix_ts, "v": level}] — same format predictions.py expects.
    """
    # Check cache first
    if cache is not None:
        cached = cache.get(entity_id)
        if cached is not None:
            return cached

    # Try long-term statistics first
    readings = await _async_get_from_statistics(hass, entity_id, since)

    # Fall back to raw state history if statistics returned nothing
    if not readings:
        readings = await _async_get_from_history(hass, entity_id, since)

    if cache is not None:
        cache.set(entity_id, readings)

    return readings


async def _async_get_from_statistics(
    hass: HomeAssistant,
    entity_id: str,
    since: datetime | None,
) -> list[dict[str, float]]:
    """Fetch from long-term statistics (hourly means)."""
    try:
        from homeassistant.components.recorder import get_instance
        from homeassistant.components.recorder.statistics import (
            statistics_during_period,
        )
    except ImportError:
        return []

    start_time = since if since else utcnow() - timedelta(days=HISTORY_DEFAULT_DAYS)

    try:
        stats = await get_instance(hass).async_add_executor_job(
            statistics_during_period,
            hass,
            start_time,
            None,  # end_time
            {entity_id},
            "hour",
            None,  # units
            {"mean"},
        )
    except Exception:
        _LOGGER.debug(
            "Failed to fetch statistics for %s", entity_id, exc_info=True
        )
        return []

    entity_stats = stats.get(entity_id, [])
    readings: list[dict[str, float]] = []
    for entry in entity_stats:
        mean = entry.get("mean")
        if mean is None:
            continue
        val = max(0.0, min(100.0, float(mean)))
        readings.append({"t": entry["start"], "v": val})

    if readings:
        _LOGGER.debug(
            "Fetched %d readings from statistics for %s", len(readings), entity_id
        )
    return readings


async def _async_get_from_history(
    hass: HomeAssistant,
    entity_id: str,
    since: datetime | None,
) -> list[dict[str, float]]:
    """Fetch from raw state history (significant changes).

    Used as fallback for entities without state_class (no long-term statistics).
    """
    try:
        from homeassistant.components.recorder import get_instance
        from homeassistant.components.recorder.history import (
            get_significant_states,
        )
    except ImportError:
        return []

    # Raw history is limited by purge_keep_days (default ~10 days)
    default_since = utcnow() - timedelta(days=_RAW_HISTORY_DAYS)
    start_time = since if since and since > default_since else default_since

    try:
        states = await get_instance(hass).async_add_executor_job(
            get_significant_states,
            hass,
            start_time,
            None,  # end_time
            [entity_id],
            None,  # filters
            True,  # include_start_time_state
            True,  # significant_changes_only
            True,  # minimal_response
            True,  # no_attributes
        )
    except Exception:
        _LOGGER.debug(
            "Failed to fetch history for %s", entity_id, exc_info=True
        )
        return []

    entity_states = states.get(entity_id, [])
    readings: list[dict[str, float]] = []
    for state in entity_states:
        try:
            val = float(state.state)
        except (ValueError, TypeError, AttributeError):
            continue
        if not (0 <= val <= 100):
            continue
        ts = state.last_changed.timestamp()
        readings.append({"t": ts, "v": val})

    if readings:
        _LOGGER.debug(
            "Fetched %d readings from raw history for %s", len(readings), entity_id
        )
    return readings
