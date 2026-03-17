"""DataUpdateCoordinator for Juice Patrol."""

from __future__ import annotations

import logging
import time
from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from ..const import (
    CONF_LOW_THRESHOLD,
    CONF_PREDICTION_HORIZON,
    CONF_STALE_TIMEOUT,
    DEFAULT_LOW_THRESHOLD,
    DEFAULT_PREDICTION_HORIZON,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_STALE_TIMEOUT,
    DOMAIN,
    MIN_READINGS_FOR_PREDICTION,
    MIN_TIMESPAN_HOURS,
    REPLACEMENT_LOW_MULTIPLIER,
    EVENT_BATTERY_LOW,
    EVENT_BATTERY_PREDICTED_LOW,
    EVENT_DEVICE_REPLACED,
    EVENT_DEVICE_STALE,
)
from homeassistant.helpers import device_registry as dr, entity_registry as er

from ..discovery import (
    BATTERY_ATTRIBUTES,
    DiscoveredBattery,
    SourceType,
    async_discover_batteries,
    parse_battery_level,
)
from ..engine import (
    AnalysisResult,
    PredictionResult,
    analyze_battery,
    extract_charging_segment,
    predict_charge,
    predict_discharge,
)
from .battery_types import BatteryTypeResolver
from .history import HistoryCache, async_get_readings
from .store import JuicePatrolStore

_LOGGER = logging.getLogger(__name__)


def _extract_current_segment(
    readings: list[dict[str, float]],
) -> list[dict[str, float]]:
    """Extract the current discharge segment from cyclic readings.

    For rechargeable devices that charge/discharge daily, the full history
    contains sawtooth patterns (100→20→100→20...). Linear regression on
    that produces garbage. Instead, find the last charge peak and return
    only readings from that peak onward.

    Returns the original readings unchanged if no cycling is detected.
    """
    if len(readings) < 5:
        return readings

    # Find the last significant upward jump (charge event):
    # a reading that is ≥20% higher than the previous one.
    last_peak_idx = None
    for i in range(len(readings) - 1, 0, -1):
        jump = readings[i]["v"] - readings[i - 1]["v"]
        if jump >= 20:
            # This is a charge jump — the peak is at index i
            last_peak_idx = i
            break

    if last_peak_idx is None:
        # No charge cycle detected — use all readings
        return readings

    segment = readings[last_peak_idx:]
    # Only use segment if it has enough data points for prediction
    if len(segment) < 3:
        return readings

    return segment


class JuicePatrolCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Coordinator that manages battery discovery, tracking, and state."""

    config_entry: ConfigEntry

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=DEFAULT_SCAN_INTERVAL),
        )
        self.config_entry = entry
        self.store = JuicePatrolStore(hass)
        self.type_resolver = BatteryTypeResolver(hass)
        self.discovered: dict[str, DiscoveredBattery] = {}
        self._tracked_entities: set[str] = set()
        self._unsub_state_listener: CALLBACK_TYPE | None = None
        self._history_cache = HistoryCache()
        self._last_known_levels: dict[str, float] = {}
        # Event dedup: track which entities have had events fired
        self._fired_low: set[str] = set()
        self._fired_predicted_low: set[str] = set()
        self._fired_stale: set[str] = set()
        self._first_full_build = True
        # Callback for dynamic entity creation
        self._new_device_callbacks: list[
            Callable[[list[str]], None]
        ] = []

    def async_register_new_device_callback(
        self, cb: Callable[[list[str]], None]
    ) -> None:
        """Register a callback for when new devices are discovered."""
        self._new_device_callbacks.append(cb)

    @property
    def low_threshold(self) -> int:
        """Get the configured low battery threshold."""
        return self.config_entry.options.get(
            CONF_LOW_THRESHOLD, DEFAULT_LOW_THRESHOLD
        )

    @property
    def stale_timeout_hours(self) -> int:
        """Get the configured stale timeout in hours."""
        return self.config_entry.options.get(
            CONF_STALE_TIMEOUT, DEFAULT_STALE_TIMEOUT
        )

    @property
    def prediction_horizon_days(self) -> int:
        """Get the configured prediction alert horizon in days."""
        return self.config_entry.options.get(
            CONF_PREDICTION_HORIZON, DEFAULT_PREDICTION_HORIZON
        )

    async def async_setup(self) -> None:
        """Set up the coordinator: load store and run initial discovery."""
        await self.store.async_load()
        await self.type_resolver.async_load_library()

    async def _async_update_data(self) -> dict[str, Any]:
        """Periodic update: re-discover devices and save store."""
        await self._async_discover_and_subscribe()
        await self.store.async_save()
        return await self._async_build_full_data()

    async def _async_discover_and_subscribe(self) -> None:
        """Run discovery and subscribe to state changes for new entities."""
        ignored = self.store.get_ignored_entities()
        batteries = await async_discover_batteries(self.hass, ignored)

        old_entity_ids = set(self.discovered.keys())
        self.discovered = {b.entity_id: b for b in batteries}
        new_entity_ids = set(self.discovered.keys())

        # Ensure device metadata exists for discovered devices
        for battery in batteries:
            self.store.ensure_device(
                battery.entity_id,
                device_id=battery.device_id,
            )

        # Replace state listener with one covering all entities
        if self._unsub_state_listener:
            self._unsub_state_listener()
            self._unsub_state_listener = None

        if new_entity_ids:
            self._unsub_state_listener = async_track_state_change_event(
                self.hass,
                list(new_entity_ids),
                self._handle_state_change,
            )
        self._tracked_entities = new_entity_ids

        # Notify platforms about newly discovered devices (#4)
        truly_new = new_entity_ids - old_entity_ids
        if truly_new and self._new_device_callbacks:
            for cb in self._new_device_callbacks:
                cb(list(truly_new))

        # Clean up in-memory tracking for disappeared entities
        disappeared = old_entity_ids - new_entity_ids
        for entity_id in disappeared:
            self._last_known_levels.pop(entity_id, None)
            self._fired_low.discard(entity_id)
            self._fired_stale.discard(entity_id)
            self._fired_predicted_low.discard(entity_id)

        # Clean up devices for entities that have disappeared (deduplicate by identifier)
        if disappeared:
            identifiers_to_remove: dict[str, list[str]] = {}
            for entity_id in disappeared:
                dev_data = self.store.get_device(entity_id)
                identifier = (
                    dev_data.device_id
                    if dev_data and dev_data.device_id
                    else entity_id
                )
                identifiers_to_remove.setdefault(identifier, []).append(entity_id)

            dev_reg = dr.async_get(self.hass)
            for identifier, entity_ids in identifiers_to_remove.items():
                device = dev_reg.async_get_device(
                    identifiers={(DOMAIN, identifier)}
                )
                if device:
                    dev_reg.async_update_device(
                        device.id,
                        remove_config_entry_id=self.config_entry.entry_id,
                    )
                    _LOGGER.info(
                        "Removed stale device for disappeared entities %s",
                        entity_ids,
                    )

    def _pre_populate_event_dedup(self, data: dict[str, Any]) -> None:
        """Pre-populate dedup sets from current state to prevent restart storm (#5)."""
        for entity_id, info in data.items():
            if info.get("is_low"):
                self._fired_low.add(entity_id)
            if info.get("is_stale"):
                self._fired_stale.add(entity_id)
            prediction = info.get("prediction")
            if (
                prediction
                and prediction.estimated_days_remaining is not None
                and prediction.estimated_days_remaining
                <= self.prediction_horizon_days
            ):
                self._fired_predicted_low.add(entity_id)

    @callback
    def _handle_state_change(self, event: Event) -> None:
        """Handle a state change event for a tracked battery entity."""
        entity_id = event.data.get("entity_id", "")
        new_state = event.data.get("new_state")

        if new_state is None:
            return

        state_value = new_state.state
        if state_value in (STATE_UNAVAILABLE, STATE_UNKNOWN, None):
            return

        battery = self.discovered.get(entity_id)
        if battery is None:
            return

        level: float | None = None
        if battery.source_type == SourceType.DEVICE_CLASS_SENSOR:
            try:
                level = float(state_value)
            except (ValueError, TypeError):
                return
        elif battery.source_type == SourceType.ATTRIBUTE_BATTERY_LEVEL:
            attrs = new_state.attributes
            for attr_name in BATTERY_ATTRIBUTES:
                if attr_name in attrs:
                    level = parse_battery_level(attrs[attr_name])
                    if level is not None:
                        break

        if level is None or not (0 <= level <= 100):
            return

        # Determine rechargeable status to prevent replacement detection
        # on normal charge cycles (BH-001).
        is_rechargeable = False
        if self.data:
            prev_data = self.data.get(entity_id, {})
            is_rechargeable = prev_data.get("is_rechargeable", False)
        if not is_rechargeable:
            dev = self.store.get_device(entity_id)
            if dev and dev.is_rechargeable is True:
                is_rechargeable = True

        # Replacement detection: compare against last known level
        old_level = self._last_known_levels.get(entity_id)
        replaced = False
        if old_level is not None and not is_rechargeable:
            if old_level <= self.low_threshold * REPLACEMENT_LOW_MULTIPLIER and level >= 80:
                _LOGGER.info(
                    "Battery replacement detected for %s: %s%% → %s%%",
                    entity_id,
                    old_level,
                    level,
                )
                dev = self.store.get_device(entity_id)
                if dev:
                    dev.last_replaced = time.time()
                    dev.replacement_confirmed = False
                    self.store.mark_dirty()
                self._history_cache.invalidate(entity_id)
                replaced = True

        self._last_known_levels[entity_id] = level
        battery.current_level = level

        # Fire replacement event if detected
        if replaced:
            self.hass.bus.async_fire(
                EVENT_DEVICE_REPLACED,
                {
                    "entity_id": entity_id,
                    "device_name": battery.device_name or entity_id,
                    "old_level": old_level,
                    "new_level": level,
                },
            )
            self._fired_low.discard(entity_id)
            self._fired_predicted_low.discard(entity_id)

        # Schedule async rebuild for this entity
        self.hass.async_create_task(
            self._async_rebuild_entity(entity_id, battery)
        )

    async def _async_rebuild_entity(
        self, entity_id: str, battery: DiscoveredBattery
    ) -> None:
        """Rebuild data for a single entity and update coordinator data."""
        entity_data = await self._async_build_entity_data(entity_id, battery)
        data = dict(self.data) if self.data else {}
        data[entity_id] = entity_data
        self._fire_events_for_entity(entity_id, entity_data)
        self.async_set_updated_data(data)

    async def _async_build_entity_data(
        self, entity_id: str, battery: DiscoveredBattery
    ) -> dict[str, Any]:
        """Build the data dict for a single entity (async — queries recorder)."""
        dev = self.store.get_device(entity_id)
        since = (
            datetime.fromtimestamp(dev.last_replaced, tz=timezone.utc)
            if dev and dev.last_replaced
            else None
        )
        all_readings = await async_get_readings(
            self.hass, entity_id, since=since, cache=self._history_cache
        )

        # Update last known level from readings
        if all_readings:
            self._last_known_levels[entity_id] = all_readings[-1]["v"]

        last_reading_time = all_readings[-1]["t"] if all_readings else None

        threshold = (
            dev.custom_threshold if dev and dev.custom_threshold
            else self.low_threshold
        )

        # For cyclic (rechargeable) devices, extract only the current
        # discharge segment for prediction. Full history is still used
        # for reading_count display.
        readings = _extract_current_segment(all_readings)
        is_cyclic = len(readings) < len(all_readings)

        # Determine minimum timespan based on data density:
        # Fast-discharge devices (phones, tablets) from raw history have
        # sub-hour intervals; slow sensors have hourly stats over months.
        if len(readings) >= 3:
            avg_interval_h = (
                (readings[-1]["t"] - readings[0]["t"])
                / (len(readings) - 1)
                / 3600
            )
            # If average interval is under 1 hour, this is high-frequency
            # data — relax the timespan requirement to 1 hour
            min_span = 1.0 if avg_interval_h < 1.0 else float(MIN_TIMESPAN_HOURS)
        else:
            min_span = float(MIN_TIMESPAN_HOURS)

        prediction = predict_discharge(
            readings,
            target_level=0.0,
            half_life_days=None,
            min_readings=MIN_READINGS_FOR_PREDICTION,
            min_timespan_hours=min_span,
        )

        # Sanity-check predictions against actual current level
        current = battery.current_level
        if prediction.estimated_days_remaining is not None:
            # Model says "already past target" (days=0) but actual level
            # is still well above 0% — model has diverged from reality.
            if prediction.estimated_days_remaining == 0.0 and (
                current is not None and current > 5
            ):
                prediction.estimated_days_remaining = None
                prediction.estimated_hours_remaining = None
                prediction.estimated_empty_timestamp = None

        # Auto-detect battery type if not manually set
        manual_type = dev.battery_type if dev else None
        if manual_type:
            battery_type = manual_type
            battery_type_source = "manual"
        else:
            battery_type, battery_type_source = self.type_resolver.resolve_type(
                entity_id, battery.device_id
            )

        # Run behavior analysis on the current segment (not full cyclic history)
        battery_state = self._get_battery_state(entity_id, battery.device_id)
        analysis = analyze_battery(
            readings,
            battery_type=battery_type,
            battery_state=battery_state,
            is_rechargeable_override=dev.is_rechargeable if dev else None,
            last_replaced=dev.last_replaced if dev else None,
            low_threshold=float(threshold),
        )

        # Flag unconfirmed replacements in the store
        if dev and analysis.replacement_detected and dev.replacement_confirmed:
            dev.replacement_confirmed = False
            self.store.mark_dirty()

        level = battery.current_level
        is_low = level is not None and level <= threshold

        now = time.time()
        is_stale = False
        if last_reading_time is not None:
            hours_since = (now - last_reading_time) / 3600
            is_stale = hours_since > self.stale_timeout_hours
        if not is_stale:
            source_state = self.hass.states.get(entity_id)
            if source_state and source_state.state in (
                STATE_UNAVAILABLE, STATE_UNKNOWN
            ):
                last_changed = source_state.last_changed.timestamp()
                hours_unavailable = (now - last_changed) / 3600
                is_stale = hours_unavailable > self.stale_timeout_hours

        return {
            "level": level,
            "device_name": battery.device_name,
            "device_id": battery.device_id,
            "source_type": battery.source_type,
            "platform": battery.platform,
            "manufacturer": battery.manufacturer,
            "model": battery.model,
            "reading_count": len(all_readings),
            "segment_count": len(readings),
            "is_cyclic": is_cyclic,
            "last_reading_time": last_reading_time,
            "discharge_rate": (
                abs(prediction.slope_per_day)
                if prediction.slope_per_day is not None
                else None
            ),
            "discharge_rate_hour": (
                abs(prediction.slope_per_hour)
                if prediction.slope_per_hour is not None
                else None
            ),
            "last_replaced": dev.last_replaced if dev else None,
            "custom_threshold": dev.custom_threshold if dev else None,
            "threshold": threshold,
            "prediction": prediction,
            "analysis": analysis,
            "battery_type": battery_type,
            "battery_type_source": battery_type_source,
            "is_rechargeable": analysis.is_rechargeable,
            "charging_state": battery_state,
            "replacement_pending": (
                dev is not None and not dev.replacement_confirmed
            ),
            "is_low": is_low,
            "is_stale": is_stale,
            "last_calculated": now,
        }

    def _get_battery_state(self, entity_id: str, device_id: str | None) -> str | None:
        """Find battery charging state from attributes or sibling entities.

        Checks:
        1. Attributes on the source entity (battery_state, charging)
        2. Sibling entities on the same device with 'battery_state' in the name
        """
        # Check attributes on the source entity
        state = self.hass.states.get(entity_id)
        if state:
            for attr in ("battery_state", "charging"):
                val = state.attributes.get(attr)
                if val:
                    return str(val)

        # Check sibling entities on the same device
        if device_id:
            ent_reg = er.async_get(self.hass)
            for entry in er.async_entries_for_device(ent_reg, device_id):
                if "battery_state" not in entry.entity_id:
                    continue
                sibling_state = self.hass.states.get(entry.entity_id)
                if sibling_state and sibling_state.state not in (
                    STATE_UNAVAILABLE, STATE_UNKNOWN, None
                ):
                    return sibling_state.state

        return None

    async def _async_build_full_data(self) -> dict[str, Any]:
        """Build the full data dict for all entities.

        Queries are run sequentially to avoid overwhelming the recorder's
        SQLite database with dozens of concurrent reads.
        """
        data: dict[str, Any] = {}
        for entity_id, battery in self.discovered.items():
            try:
                data[entity_id] = await self._async_build_entity_data(
                    entity_id, battery
                )
            except Exception:
                _LOGGER.warning(
                    "Failed to build data for %s", entity_id, exc_info=True
                )
                continue

        # On first full build, pre-populate dedup sets (#5)
        if self._first_full_build:
            self._first_full_build = False
            self._pre_populate_event_dedup(data)
        else:
            self._fire_events(data)
        return data

    async def async_manual_refresh(self) -> None:
        """Force refresh with cache invalidation."""
        self._history_cache.invalidate_all()
        await self.async_request_refresh()

    async def async_mark_replaced(self, entity_id: str) -> bool:
        """Mark a battery as replaced: update store, invalidate cache, refresh.

        Returns False if entity_id not found in store.
        """
        if not self.store.mark_replaced(entity_id):
            return False
        self._history_cache.invalidate(entity_id)
        await self.async_request_refresh()
        return True

    async def async_undo_replacement(self, entity_id: str) -> bool:
        """Undo a manual replacement: restore last_replaced, invalidate cache, refresh.

        Returns False if entity_id not found in store.
        """
        if not self.store.undo_replacement(entity_id):
            return False
        self._history_cache.invalidate(entity_id)
        await self.async_request_refresh()
        return True

    async def async_recalculate_entity(self, entity_id: str) -> bool:
        """Recalculate predictions for a single entity (invalidates its cache).

        Returns False if entity_id not discovered.
        """
        battery = self.discovered.get(entity_id)
        if not battery:
            return False
        self._history_cache.invalidate(entity_id)
        await self._async_rebuild_entity(entity_id, battery)
        return True

    def detect_battery_type(
        self, entity_id: str
    ) -> tuple[str | None, str | None]:
        """Auto-detect battery type for a discovered device (bypasses cache).

        Returns (battery_type, source) or (None, None).
        Raises KeyError if entity_id not discovered.
        """
        battery = self.discovered.get(entity_id)
        if battery is None:
            raise KeyError(entity_id)
        return self.type_resolver.resolve_uncached(entity_id, battery.device_id)

    @callback
    def _fire_events_for_entity(
        self, entity_id: str, info: dict[str, Any]
    ) -> None:
        """Fire events for a single entity."""
        device_name = info.get("device_name") or entity_id
        level = info.get("level")
        threshold = info.get("threshold", self.low_threshold)

        if info.get("is_low"):
            if entity_id not in self._fired_low:
                self._fired_low.add(entity_id)
                self.hass.bus.async_fire(
                    EVENT_BATTERY_LOW,
                    {
                        "entity_id": entity_id,
                        "device_name": device_name,
                        "level": level,
                        "threshold": threshold,
                    },
                )
        elif level is not None:
            self._fired_low.discard(entity_id)

        prediction: PredictionResult | None = info.get("prediction")
        if (
            prediction
            and prediction.estimated_days_remaining is not None
            and prediction.estimated_days_remaining
            <= self.prediction_horizon_days
        ):
            if entity_id not in self._fired_predicted_low:
                self._fired_predicted_low.add(entity_id)
                self.hass.bus.async_fire(
                    EVENT_BATTERY_PREDICTED_LOW,
                    {
                        "entity_id": entity_id,
                        "device_name": device_name,
                        "level": level,
                        "predicted_empty": prediction.estimated_empty_timestamp,
                        "days_remaining": prediction.estimated_days_remaining,
                        "confidence": prediction.confidence,
                    },
                )
        elif (
            prediction
            and prediction.estimated_days_remaining is not None
            and prediction.estimated_days_remaining
            > self.prediction_horizon_days
        ):
            self._fired_predicted_low.discard(entity_id)

        if info.get("is_stale"):
            if entity_id not in self._fired_stale:
                self._fired_stale.add(entity_id)
                last_reading = info.get("last_reading_time")
                hours_since = (
                    (time.time() - last_reading) / 3600
                    if last_reading
                    else 0
                )
                self.hass.bus.async_fire(
                    EVENT_DEVICE_STALE,
                    {
                        "entity_id": entity_id,
                        "device_name": device_name,
                        "last_seen": last_reading,
                        "stale_hours": round(hours_since, 1),
                    },
                )
        else:
            self._fired_stale.discard(entity_id)

    @callback
    def _fire_events(self, data: dict[str, Any]) -> None:
        """Fire events for all entities (used on full rebuild)."""
        for entity_id, info in data.items():
            self._fire_events_for_entity(entity_id, info)

    async def async_get_entity_chart_data(
        self, entity_id: str
    ) -> dict[str, Any] | None:
        """Return readings + prediction metadata for a single entity's chart.

        Returns None if the entity is not discovered.
        """
        battery = self.discovered.get(entity_id)
        if battery is None:
            return None

        dev = self.store.get_device(entity_id)
        since = (
            datetime.fromtimestamp(dev.last_replaced, tz=timezone.utc)
            if dev and dev.last_replaced
            else None
        )
        all_readings = await async_get_readings(
            self.hass, entity_id, since=since, cache=self._history_cache
        )
        readings = _extract_current_segment(all_readings)

        threshold = (
            dev.custom_threshold if dev and dev.custom_threshold
            else self.low_threshold
        )

        entity_data = self.data.get(entity_id, {}) if self.data else {}

        # Serialize prediction to plain dict
        prediction = entity_data.get("prediction")
        pred_dict: dict[str, Any] = {}
        if prediction is not None:
            pred_dict = {
                "slope_per_day": prediction.slope_per_day,
                "intercept": prediction.intercept,
                "r_squared": prediction.r_squared,
                "confidence": str(prediction.confidence),
                "estimated_empty_timestamp": prediction.estimated_empty_timestamp,
                "estimated_days_remaining": prediction.estimated_days_remaining,
                "status": str(prediction.status),
                "reliability": prediction.reliability,
                "data_points_used": prediction.data_points_used,
            }

        # Charge prediction (rechargeable batteries only)
        charge_pred_dict: dict[str, Any] | None = None
        is_rechargeable = entity_data.get("is_rechargeable", False)
        if is_rechargeable and all_readings:
            charging_segment = extract_charging_segment(all_readings)
            if charging_segment:
                charge_result = predict_charge(charging_segment)
                if (
                    charge_result.slope_per_hour is not None
                    and charge_result.estimated_full_timestamp is not None
                ):
                    charge_pred_dict = {
                        "slope_per_hour": charge_result.slope_per_hour,
                        "intercept": charge_result.intercept,
                        "r_squared": charge_result.r_squared,
                        "confidence": str(charge_result.confidence),
                        "estimated_full_timestamp": (
                            charge_result.estimated_full_timestamp
                        ),
                        "estimated_hours_to_full": (
                            charge_result.estimated_hours_to_full
                        ),
                        "status": str(charge_result.status),
                        "reliability": charge_result.reliability,
                        "data_points_used": charge_result.data_points_used,
                        "segment_start_timestamp": charging_segment[0]["t"],
                        "segment_start_level": charging_segment[0]["v"],
                    }

        return {
            "readings": readings,
            "all_readings": all_readings,
            "prediction": pred_dict,
            "charge_prediction": charge_pred_dict,
            "threshold": threshold,
            "last_replaced": dev.last_replaced if dev else None,
            "is_rechargeable": is_rechargeable,
            "first_reading_timestamp": readings[0]["t"] if readings else None,
            "device_name": battery.device_name,
            "level": battery.current_level,
            "battery_type": entity_data.get("battery_type"),
            "charging_state": entity_data.get("charging_state"),
        }

    async def async_shutdown(self) -> None:
        """Shut down the coordinator, save store, remove listeners."""
        if self._unsub_state_listener:
            self._unsub_state_listener()
            self._unsub_state_listener = None
        await self.store.async_save()
