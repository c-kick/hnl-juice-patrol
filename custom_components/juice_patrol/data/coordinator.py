"""DataUpdateCoordinator for Juice Patrol."""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Callable
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from ..const import (
    CONF_HISTORY_DAYS,
    CONF_LOW_THRESHOLD,
    CONF_PREDICTION_HORIZON,
    CONF_STALE_TIMEOUT,
    DEFAULT_HISTORY_DAYS,
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
    CompletedCycle,
    DeviceClassModels,
    PredictionResult,
    PredictionStatus,
    analyze_battery,
    chemistry_from_battery_type,
    damage_score,
    detect_replacement_jumps,
    extract_charging_segment,
    extract_completed_cycles,
    fit_discharge_curve,
    knee_risk_score,
    predict_charge,
    predict_discharge,
    predict_discharge_multisession,
    soh_from_cycles,
)
from ..engine.compress import compress as sdt_compress
from .battery_types import BatteryTypeResolver
from .history import HistoryCache, async_get_readings
from .store import JuicePatrolStore

_LOGGER = logging.getLogger(__name__)

# Minimum interval between WS-triggered refreshes (seconds)
_WS_REFRESH_MIN_INTERVAL = 5.0


def _historical_charge_rate(
    readings: list[dict[str, float]],
) -> float | None:
    """Compute median historical charge rate (%/hour) from trough→peak cycles.

    Finds local minima and maxima in the readings, pairs consecutive min→max
    as charge cycles, and returns the median rate. Returns None if fewer than
    2 charge cycles found.
    """
    if len(readings) < 3:
        return None

    extrema: list[tuple[str, float, float]] = []  # (type, timestamp, value)
    direction = 0  # 0=unknown, 1=rising, -1=falling
    for i in range(1, len(readings)):
        diff = readings[i]["v"] - readings[i - 1]["v"]
        if diff > 1:
            if direction == -1:
                extrema.append(("min", readings[i - 1]["t"], readings[i - 1]["v"]))
            direction = 1
        elif diff < -1:
            if direction == 1:
                extrema.append(("max", readings[i - 1]["t"], readings[i - 1]["v"]))
            direction = -1

    # Pair min→max to get charge rates
    rates: list[float] = []
    for i in range(len(extrema) - 1):
        if extrema[i][0] == "min" and extrema[i + 1][0] == "max":
            rise = extrema[i + 1][2] - extrema[i][2]
            hours = (extrema[i + 1][1] - extrema[i][1]) / 3600
            if rise >= 10 and hours > 0:
                rates.append(rise / hours)

    if len(rates) < 2:
        return None

    rates.sort()
    mid = len(rates) // 2
    return rates[mid] if len(rates) % 2 else (rates[mid - 1] + rates[mid]) / 2


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
        # Debounce: pending rebuild tasks per entity (cancel-on-supersede)
        self._pending_rebuilds: dict[str, asyncio.Task] = {}
        # Lock to prevent concurrent full rebuilds
        self._rebuild_lock = asyncio.Lock()
        # Chart data cache: {entity_id: (expire_ts, chart_data)}
        self._chart_cache: dict[str, tuple[float, dict[str, Any]]] = {}
        self._chart_cache_ttl = 30  # seconds
        # WS refresh throttle (per-coordinator, not module-level)
        self._last_ws_refresh: float = 0.0
        # Callback for dynamic entity creation
        self._new_device_callbacks: list[
            Callable[[list[str]], None]
        ] = []
        # Per-device-class model cache (populated from stored completed cycles)
        self._class_models = DeviceClassModels()
        # Background bootstrap task tracking
        self._bootstrap_task: asyncio.Task | None = None

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

    @property
    def history_days(self) -> int:
        """Get the configured history lookback window in days."""
        return self.config_entry.options.get(
            CONF_HISTORY_DAYS, DEFAULT_HISTORY_DAYS
        )

    async def async_setup(self) -> None:
        """Set up the coordinator: load store and run initial discovery."""
        await self.store.async_load()
        await self.type_resolver.async_load_library()
        # Populate class models from stored completed cycles
        self._load_class_models_from_store()

    def _load_class_models_from_store(self) -> None:
        """Populate DeviceClassModels from stored completed_cycles at startup."""
        for entity_id, dev in self.store.devices.items():
            if dev.completed_cycles:
                self._class_models.load_cycles(
                    entity_id, dev.battery_type, dev.completed_cycles,
                )

    async def _async_update_data(self) -> dict[str, Any]:
        """Periodic update: re-discover devices and save store."""
        await self._async_discover_and_subscribe()
        await self.store.async_save()
        result = await self._async_build_full_data()
        # Launch retroactive bootstrap after first successful full build
        if (
            not self.store.bootstrap_complete
            and self._bootstrap_task is None
            and self.discovered
        ):
            self._bootstrap_task = self.hass.async_create_task(
                self._async_bootstrap_completed_cycles()
            )
        return result

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
                    dev.replacement_history.append(time.time())
                    dev.replacement_confirmed = False
                    self.store.mark_dirty()
                self._history_cache.invalidate(entity_id)
                replaced = True

        self._last_known_levels[entity_id] = level
        battery.current_level = level

        # Fire replacement event and record completed cycle if detected
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
            # Schedule background cycle recording (needs async history read)
            self.hass.async_create_task(
                self._async_record_cycle_on_replacement(entity_id)
            )

        # Only rebuild when the level actually changed (or replacement detected).
        # HA fires state_changed on attribute changes too — without this gate,
        # every attribute update triggers a full prediction recalculation.
        if level == old_level and not replaced:
            return

        # Cancel any pending rebuild for this entity (debounce rapid updates)
        existing_task = self._pending_rebuilds.pop(entity_id, None)
        if existing_task and not existing_task.done():
            existing_task.cancel()

        # Schedule async rebuild for this entity
        task = self.hass.async_create_task(
            self._async_rebuild_entity(entity_id, battery)
        )
        self._pending_rebuilds[entity_id] = task

    async def _async_rebuild_entity(
        self, entity_id: str, battery: DiscoveredBattery
    ) -> None:
        """Rebuild data for a single entity and update coordinator data.

        Skips the coordinator update (which pushes to entities and UI) when
        the new data is not meaningfully different from the previous data.
        This prevents erratic sensors that jump ±1-2% every few seconds from
        triggering constant UI redraws with near-identical predictions.
        """
        entity_data = await self._async_build_entity_data(entity_id, battery)
        prev = self.data.get(entity_id) if self.data else None

        if prev is not None and not self._is_significant_change(prev, entity_data):
            return

        # Invalidate chart cache for this entity on significant change
        self._chart_cache.pop(entity_id, None)

        data = dict(self.data) if self.data else {}
        data[entity_id] = entity_data
        self._fire_events_for_entity(entity_id, entity_data)
        self.async_set_updated_data(data)

    @staticmethod
    def _is_significant_change(
        old: dict[str, Any], new: dict[str, Any]
    ) -> bool:
        """Return True if new entity data differs meaningfully from old.

        Checks boolean/categorical flags exactly, and numeric predictions
        with a ~10% relative tolerance.
        """
        # Boolean / categorical flags — any change is significant
        for key in ("is_low", "is_stale", "charging_state", "replacement_pending"):
            if old.get(key) != new.get(key):
                return True

        # Level change > 1% absolute — significant
        old_level = old.get("level")
        new_level = new.get("level")
        if old_level is None or new_level is None:
            if old_level != new_level:
                return True
        elif abs(new_level - old_level) > 1:
            return True

        # Prediction estimate — 10% relative tolerance
        old_pred = old.get("prediction")
        new_pred = new.get("prediction")
        old_days = old_pred.estimated_days_remaining if old_pred else None
        new_days = new_pred.estimated_days_remaining if new_pred else None

        if old_days is None or new_days is None:
            # None ↔ value transition is always significant
            if old_days != new_days:
                return True
        elif old_days == 0:
            # Any change from zero is significant
            if new_days != 0:
                return True
        elif abs(new_days - old_days) / abs(old_days) > 0.1:
            return True

        # Prediction status change (e.g. normal → charging)
        old_status = old_pred.status if old_pred else None
        new_status = new_pred.status if new_pred else None
        if old_status != new_status:
            return True

        return False

    async def _async_build_entity_data(
        self, entity_id: str, battery: DiscoveredBattery
    ) -> dict[str, Any]:
        """Build the data dict for a single entity (async — queries recorder)."""
        dev = self.store.get_device(entity_id)
        all_readings = await async_get_readings(
            self.hass, entity_id, since=None, cache=self._history_cache,
            history_days=self.history_days,
        )

        # Update last known level from readings
        if all_readings:
            self._last_known_levels[entity_id] = all_readings[-1]["v"]

        last_reading_time = all_readings[-1]["t"] if all_readings else None

        threshold = (
            dev.custom_threshold if dev and dev.custom_threshold
            else self.low_threshold
        )

        # Determine if this device is rechargeable.
        # User's manual label (True/False) is the single source of truth.
        # Only auto-detect when the user hasn't set a preference yet (None).
        is_rechargeable_hint = False
        if dev and dev.is_rechargeable is not None:
            # User has explicitly set this — trust it
            is_rechargeable_hint = dev.is_rechargeable
        else:
            # No user preference: check battery_state for initial guess
            battery_state_init = self._get_battery_state(entity_id, battery.device_id)
            if battery_state_init:
                normalized = battery_state_init.lower().replace(" ", "_")
                if normalized in ("charging", "not_charging", "full", "discharging"):
                    is_rechargeable_hint = True
            # Also carry forward from previous coordinator data if available
            if not is_rechargeable_hint and self.data is not None:
                prev_data = self.data.get(entity_id, {})
                is_rechargeable_hint = prev_data.get("is_rechargeable", False)

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

        # Choose prediction strategy based on rechargeable status
        current = battery.current_level
        battery_state = self._get_battery_state(entity_id, battery.device_id)
        is_charging = (
            battery_state
            and battery_state.lower() in ("charging",)
        )

        # Resolve battery type early so chemistry is available for predictions.
        # Manual type from store takes precedence over auto-detection.
        manual_type = dev.battery_type if dev else None
        if manual_type:
            battery_type = manual_type
            battery_type_source = "manual"
        else:
            battery_type, battery_type_source = self.type_resolver.resolve_type(
                entity_id, battery.device_id
            )

        # Compute chemistry — override takes precedence over auto-detected.
        chemistry_override = getattr(dev, "chemistry_override", None) if dev else None
        chemistry = chemistry_override or chemistry_from_battery_type(battery_type)

        # Look up class prior for this device (non-rechargeable only)
        prior_battery_type = dev.battery_type if dev else None
        class_prior = (
            self._class_models.get_class_prior(prior_battery_type, entity_id)
            if not is_rechargeable_hint
            else None
        )

        if is_rechargeable_hint and not is_charging and len(all_readings) >= 3:
            # Multi-session discharge analysis for rechargeable devices
            prediction = predict_discharge_multisession(
                all_readings,
                current_level=current if current is not None else 0.0,
                target_level=0.0,
                chemistry=chemistry,
            )
            # Suppress discharge prediction when the device is idle (not actively
            # discharging). Check the last few readings: if the level is stable or
            # rising, the device is on its charger or in standby — projecting a
            # discharge line would be misleading.
            if prediction.status == PredictionStatus.NORMAL:
                tail = all_readings[-5:] if len(all_readings) >= 5 else all_readings[-2:]
                if len(tail) >= 2:
                    tail_drop = tail[0]["v"] - tail[-1]["v"]
                    # Need at least 2% drop in the tail to consider it discharging
                    if tail_drop < 2.0:
                        from dataclasses import replace as _replace
                        prediction = _replace(
                            prediction,
                            status=PredictionStatus.IDLE,
                            estimated_empty_timestamp=None,
                            estimated_days_remaining=None,
                            estimated_hours_remaining=None,
                            r_squared=None,
                        )
        else:
            prediction = predict_discharge(
                readings,
                target_level=0.0,
                half_life_days=None,
                min_readings=MIN_READINGS_FOR_PREDICTION,
                min_timespan_hours=min_span,
                class_prior=class_prior,
                chemistry=chemistry,
            )
        # Sanity-check predictions against actual current level.
        # Copy before mutating to avoid corrupting shared state.
        if prediction.estimated_days_remaining is not None:
            # Model says "already past target" (days=0) but actual level
            # is still well above 0% — model has diverged from reality.
            if prediction.estimated_days_remaining == 0.0 and (
                current is not None and current > 5
            ):
                from dataclasses import replace as _replace
                prediction = _replace(
                    prediction,
                    estimated_days_remaining=None,
                    estimated_hours_remaining=None,
                    estimated_empty_timestamp=None,
                )

        # Health metrics from completed cycles (rechargeable only)
        soh: float | None = None
        dmg: float | None = None
        soh_cycling: float | None = None
        knee: float | None = None
        cycle_count = 0
        if dev and is_rechargeable_hint and dev.completed_cycles:
            cycles = [
                c for c in (
                    CompletedCycle.from_dict(d) for d in dev.completed_cycles
                )
                if c is not None
            ]
            cycle_count = len(cycles)
            soh = soh_from_cycles(cycles)
            dmg = damage_score(cycles, chemistry)
            soh_cycling = (
                round(max(0.0, 1.0 - dmg) * 100, 1)
                if dmg is not None else None
            )
            knee = knee_risk_score(cycles, chemistry)

        # If the device reports it's actively charging, override prediction status.
        # The mathematical slope may still be negative (e.g. recent charge didn't
        # exceed the 20% segment-split threshold), but the device knows best.
        # Copy before mutating to avoid corrupting shared state.
        from dataclasses import replace as _replace
        if (
            is_charging
            and prediction.status == PredictionStatus.NORMAL
        ):
            prediction = _replace(
                prediction,
                status=PredictionStatus.CHARGING,
                estimated_empty_timestamp=None,
                estimated_days_remaining=None,
                estimated_hours_remaining=None,
            )

        # Non-rechargeable devices can't charge — a positive slope is sensor noise
        # or slow drift. Reclassify CHARGING → FLAT to avoid misleading status.
        if (
            not is_rechargeable_hint
            and prediction.status == PredictionStatus.CHARGING
        ):
            prediction = _replace(prediction, status=PredictionStatus.FLAT)

        analysis = analyze_battery(
            readings,
            battery_type=battery_type,
            battery_state=battery_state,
            is_rechargeable_override=is_rechargeable_hint,
            last_replaced=dev.last_replaced if dev else None,
            low_threshold=float(threshold),
        )

        # Flag unconfirmed replacements in the store
        if dev and analysis.replacement_detected and dev.replacement_confirmed:
            dev.replacement_confirmed = False
            self.store.mark_dirty()

        level = battery.current_level
        is_low = level is not None and level < threshold

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
            "session_count": prediction.session_count,
            "replacement_history": dev.replacement_history if dev else [],
            "soh": soh,
            "damage_score": dmg,
            "soh_cycling": soh_cycling,
            "knee_risk": knee,
            "cycle_count": cycle_count,
            "chemistry": chemistry,
            "chemistry_override": chemistry_override,
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
        async with self._rebuild_lock:
            data: dict[str, Any] = {}
            failed_count = 0
            for entity_id, battery in self.discovered.items():
                try:
                    data[entity_id] = await self._async_build_entity_data(
                        entity_id, battery
                    )
                except Exception:
                    _LOGGER.warning(
                        "Failed to build data for %s", entity_id, exc_info=True
                    )
                    failed_count += 1
                    continue

            if failed_count:
                _LOGGER.warning(
                    "Partial data build: %d/%d entities failed",
                    failed_count,
                    len(self.discovered),
                )

            # On first full build, pre-populate dedup sets (#5)
            if self._first_full_build:
                self._first_full_build = False
                self._pre_populate_event_dedup(data)
            else:
                self._fire_events(data)
            return data

    def try_claim_refresh(self) -> bool:
        """Atomically check throttle and claim a refresh slot.

        Returns True if the refresh should proceed, False if throttled.
        """
        now = time.monotonic()
        if (now - self._last_ws_refresh) < _WS_REFRESH_MIN_INTERVAL:
            return False
        self._last_ws_refresh = now
        return True

    async def async_manual_refresh(self) -> None:
        """Force refresh with cache invalidation."""
        self._history_cache.invalidate_all()
        await self.async_request_refresh()

    async def async_mark_replaced(self, entity_id: str) -> bool:
        """Mark a battery as replaced: update store, invalidate cache.

        Returns False if entity_id not found in store.
        Schedules a background refresh (not awaited) for sensor updates.
        """
        if not self.store.mark_replaced(entity_id):
            return False
        self._history_cache.invalidate(entity_id)
        self.hass.async_create_task(self.async_request_refresh())
        return True

    async def async_mark_replaced_at(
        self, entity_id: str, timestamp: float
    ) -> bool:
        """Mark a battery as replaced at a specific timestamp.

        Returns False if entity_id not found in store.
        Schedules a background refresh (not awaited) for sensor updates.
        """
        if not self.store.mark_replaced_at(entity_id, timestamp):
            return False
        self._history_cache.invalidate(entity_id)
        self.hass.async_create_task(self.async_request_refresh())
        return True

    async def async_deny_replacement(
        self, entity_id: str, timestamp: float
    ) -> bool:
        """Deny a suspected replacement timestamp.

        Returns False if entity_id not found in store.
        """
        if not self.store.deny_replacement(entity_id, timestamp):
            return False
        return True

    async def async_undo_replacement(
        self, entity_id: str, *, timestamp: float | None = None
    ) -> bool:
        """Undo a replacement: update store, invalidate cache.

        If timestamp is given, remove that specific replacement.
        Otherwise pop the most recent one.
        Returns False if entity_id not found in store.
        Schedules a background refresh (not awaited) for sensor updates.
        """
        if timestamp is not None:
            if not self.store.remove_replacement(entity_id, timestamp):
                return False
        elif not self.store.undo_replacement(entity_id):
            return False
        self._history_cache.invalidate(entity_id)
        self.hass.async_create_task(self.async_request_refresh())
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

    @staticmethod
    def _generate_prediction_curve(
        readings: list[dict[str, float]],
        prediction: PredictionResult,
        entity_data: dict[str, Any],
    ) -> list[list[float]] | None:
        """Generate curve points for the chart from the fitted model.

        Re-fits the curve on the segment readings (fast — already compressed
        by the prediction pipeline) and samples points from start to the
        predicted empty timestamp or +30 days.

        Returns [[timestamp_ms, value], ...] or None if fitting fails.
        """
        compressed = sdt_compress(readings)
        if len(compressed) < 6:
            return None

        is_rechargeable = entity_data.get("is_rechargeable", False)
        if is_rechargeable:
            return None

        fit = fit_discharge_curve(compressed)
        if fit is None or fit.r_squared < 0.10:
            return None

        t0 = compressed[0]["t"]
        now = time.time()
        now_days = (now - t0) / 86400.0

        # Reject fits that predict an increase at t=now for non-rechargeable
        # devices — this means the model is fitting noise, not discharge.
        if fit.slope_at(now_days) > 0.0:
            return None

        # End point: predicted empty or +30 days
        end_days = now_days + 30.0
        if prediction.estimated_empty_timestamp is not None:
            end_days = min(
                (prediction.estimated_empty_timestamp - t0) / 86400.0,
                now_days + 365.0,
            )

        # Sample ~50 points from start to end
        start_days = 0.0
        n_points = 50
        step = (end_days - start_days) / max(n_points - 1, 1)
        curve: list[list[float]] = []
        prev_v = 200.0  # track previous value for monotonic enforcement
        for i in range(n_points):
            d = start_days + i * step
            v = fit.predict(d)
            v = max(0.0, min(100.0, v))
            # Non-rechargeable: enforce monotonic decrease. If the curve
            # starts going up (e.g. exponential floor rebound), flatten it.
            if v > prev_v:
                v = prev_v
            prev_v = v
            ts_ms = (t0 + d * 86400.0) * 1000
            curve.append([ts_ms, round(v, 2)])
            if v <= 0:
                break

        return curve if len(curve) >= 2 else None

    async def async_get_entity_chart_data(
        self, entity_id: str
    ) -> dict[str, Any] | None:
        """Return readings + prediction metadata for a single entity's chart.

        Returns None if the entity is not discovered.
        Uses a short-lived cache to prevent hammering the recorder on
        rapid frontend re-renders.
        """
        # Check chart cache first
        cached = self._chart_cache.get(entity_id)
        if cached is not None:
            expire_ts, chart_data = cached
            if time.time() < expire_ts:
                return chart_data
            else:
                del self._chart_cache[entity_id]

        battery = self.discovered.get(entity_id)
        if battery is None:
            return None

        dev = self.store.get_device(entity_id)
        all_readings = await async_get_readings(
            self.hass, entity_id, since=None, cache=self._history_cache,
            history_days=self.history_days,
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
                "t0": prediction.t0,
            }

        # Charge prediction (rechargeable batteries only)
        charge_pred_dict: dict[str, Any] | None = None
        is_rechargeable = entity_data.get("is_rechargeable", False)
        _LOGGER.debug(
            "Chart charge prediction for %s: is_rechargeable=%s, "
            "all_readings=%d, charging_state=%s",
            entity_id, is_rechargeable, len(all_readings),
            entity_data.get("charging_state"),
        )
        if is_rechargeable and all_readings:
            charging_segment = extract_charging_segment(all_readings)
            _LOGGER.debug(
                "Chart charge segment for %s: %s readings, "
                "rise=%.1f%% (%s→%s)",
                entity_id,
                len(charging_segment) if charging_segment else 0,
                (charging_segment[-1]["v"] - charging_segment[0]["v"])
                if charging_segment else 0,
                f'{charging_segment[0]["v"]:.0f}' if charging_segment else "-",
                f'{charging_segment[-1]["v"]:.0f}' if charging_segment else "-",
            )
            if charging_segment:
                charge_result = predict_charge(charging_segment)
                _LOGGER.debug(
                    "Chart predict_charge for %s: slope=%.4f%%/h, "
                    "status=%s, full_ts=%s, r2=%.3f",
                    entity_id,
                    charge_result.slope_per_hour or 0,
                    charge_result.status,
                    charge_result.estimated_full_timestamp,
                    charge_result.r_squared or 0,
                )
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
                else:
                    # No full prediction yet (too few readings or too short
                    # timespan), but pass the segment start so the chart can
                    # draw a visual charge line from observed data.
                    charge_pred_dict = {
                        "slope_per_hour": None,
                        "estimated_full_timestamp": None,
                        "segment_start_timestamp": charging_segment[0]["t"],
                        "segment_start_level": charging_segment[0]["v"],
                    }

            # Fallback: device reports charging but no live segment detected.
            # Use historical charge cycles to estimate time to full.
            is_charging_now = (
                (entity_data.get("charging_state") or "").lower() == "charging"
            )
            current_level = battery.current_level
            if (
                charge_pred_dict is None
                and is_charging_now
                and current_level is not None
                and current_level < 100
            ):
                hist_rate = _historical_charge_rate(all_readings)
                if hist_rate is not None and hist_rate > 0:
                    now_ts = time.time()
                    hours_to_full = (100 - current_level) / hist_rate
                    charge_pred_dict = {
                        "slope_per_hour": hist_rate,
                        "intercept": None,
                        "r_squared": None,
                        "confidence": "history-based",
                        "estimated_full_timestamp": now_ts + hours_to_full * 3600,
                        "estimated_hours_to_full": hours_to_full,
                        "status": "history-based",
                        "reliability": None,
                        "data_points_used": 0,
                        "segment_start_timestamp": now_ts,
                        "segment_start_level": current_level,
                    }

        # Detect suspected historical replacements (non-rechargeable only)
        suspected_replacements: list[dict[str, float]] = []
        if not is_rechargeable and all_readings:
            suspected_replacements = detect_replacement_jumps(
                all_readings,
                low_threshold=threshold,
                known_replacements=dev.replacement_history if dev else [],
                denied_replacements=dev.denied_replacements if dev else [],
            )

        # Generate prediction curve points from the fitted model.
        # The chart uses these to draw the actual model shape instead
        # of a single straight line from slope + intercept.
        prediction_curve: list[list[float]] | None = None
        if (
            prediction is not None
            and prediction.status == PredictionStatus.NORMAL
            and prediction.slope_per_day is not None
            and readings
        ):
            prediction_curve = self._generate_prediction_curve(
                readings, prediction, entity_data,
            )
        if prediction_curve:
            pred_dict["prediction_curve"] = prediction_curve

        result = {
            "readings": readings,
            "all_readings": all_readings,
            "prediction": pred_dict,
            "charge_prediction": charge_pred_dict,
            "threshold": threshold,
            "last_replaced": dev.last_replaced if dev else None,
            "replacement_history": dev.replacement_history if dev else [],
            "suspected_replacements": suspected_replacements,
            "is_rechargeable": is_rechargeable,
            "first_reading_timestamp": readings[0]["t"] if readings else None,
            "device_name": battery.device_name,
            "level": battery.current_level,
            "battery_type": entity_data.get("battery_type"),
            "charging_state": entity_data.get("charging_state"),
            "session_count": entity_data.get("session_count"),
        }

        # Cache the result for short-lived reuse
        self._chart_cache[entity_id] = (
            time.time() + self._chart_cache_ttl,
            result,
        )

        return result

    # ------------------------------------------------------------------
    # Completed-cycle detection (incremental + bootstrap)
    # ------------------------------------------------------------------

    async def _async_record_cycle_on_replacement(
        self, entity_id: str,
    ) -> None:
        """Record a completed cycle when a replacement is detected (incremental path)."""
        try:
            all_readings = await async_get_readings(
                self.hass, entity_id, since=None, cache=self._history_cache,
                history_days=self.history_days,
            )
            if len(all_readings) >= 3:
                await self._async_try_record_completed_cycle(
                    entity_id, all_readings,
                )
                await self.store.async_save()
        except Exception:
            _LOGGER.debug(
                "Failed to record cycle for %s", entity_id, exc_info=True,
            )

    async def _async_try_record_completed_cycle(
        self, entity_id: str, all_readings: list[dict[str, float]],
    ) -> None:
        """Check if a new completed cycle exists and record it.

        Called after a replacement is detected. Cross-references discharge
        sessions with all known replacement timestamps, fits the curve,
        and stores the result.
        """
        dev = self.store.get_device(entity_id)
        if dev is None or not dev.replacement_history:
            return

        cycles = extract_completed_cycles(
            all_readings, dev.replacement_history,
        )
        if not cycles:
            return

        # Only process cycles not already stored (by end_t dedup)
        stored_end_ts = {
            c.get("end_t", 0) for c in dev.completed_cycles
        }

        for cycle in cycles:
            # Skip if already stored (within 60s tolerance)
            if any(abs(cycle.end_t - ts) < 60 for ts in stored_end_ts):
                continue

            # Fit the discharge curve to the cycle's readings
            # Extract the readings for this cycle's time range
            cycle_readings = [
                r for r in all_readings
                if cycle.start_t <= r["t"] <= cycle.end_t
            ]
            if len(cycle_readings) < 3:
                continue

            compressed = sdt_compress(cycle_readings)
            fit = fit_discharge_curve(compressed)

            cycle_dict: dict = {
                "start_t": round(cycle.start_t),
                "end_t": round(cycle.end_t),
                "start_pct": round(cycle.start_pct, 1),
                "end_pct": round(cycle.end_pct, 1),
                "duration_days": round(cycle.duration_days, 2),
            }
            if fit is not None:
                cycle_dict["model"] = fit.model_name
                cycle_dict["params"] = {
                    k: round(v, 6) for k, v in fit.params.items()
                }
            else:
                cycle_dict["model"] = "none"
                cycle_dict["params"] = {}

            if self.store.add_completed_cycle(entity_id, cycle_dict):
                self._class_models.update_from_cycle(
                    entity_id,
                    dev.battery_type,
                    cycle_dict.get("model", "none"),
                    cycle_dict.get("params", {}),
                    cycle_dict["duration_days"],
                    start_pct=cycle_dict["start_pct"],
                    end_pct=cycle_dict["end_pct"],
                )
                _LOGGER.info(
                    "Recorded completed cycle for %s: %.1f days, model=%s",
                    entity_id,
                    cycle_dict["duration_days"],
                    cycle_dict.get("model", "none"),
                )

    async def _async_bootstrap_completed_cycles(self) -> None:
        """One-time retroactive bootstrap: discover historical cycles.

        Runs as a background task after setup — does NOT block integration.
        Processes entities sequentially to avoid spiking CPU/memory on a Pi.
        """
        _LOGGER.info("Starting retroactive completed-cycle bootstrap")
        count = 0
        try:
            for entity_id, battery in list(self.discovered.items()):
                try:
                    await self._async_bootstrap_entity(entity_id)
                    count += 1
                except Exception:
                    _LOGGER.debug(
                        "Bootstrap failed for %s", entity_id, exc_info=True,
                    )
                # Yield to event loop between entities
                await asyncio.sleep(0)

            self.store.bootstrap_complete = True
            await self.store.async_save()
            _LOGGER.info(
                "Completed-cycle bootstrap finished: %d entities processed, "
                "%d total cycles discovered",
                count,
                self._class_models.total_cycles,
            )
            # Trigger a refresh so predictions benefit immediately
            await self.async_request_refresh()
        except asyncio.CancelledError:
            _LOGGER.debug("Bootstrap cancelled (shutdown)")
        except Exception:
            _LOGGER.warning("Bootstrap failed", exc_info=True)

    async def _async_bootstrap_entity(self, entity_id: str) -> None:
        """Bootstrap completed cycles for a single entity."""
        dev = self.store.get_device(entity_id)
        if dev is None:
            return

        # Skip rechargeable devices — they have cyclical charge/discharge,
        # not replacement-terminated cycles
        if dev.is_rechargeable is True:
            return

        # Pull full history
        all_readings = await async_get_readings(
            self.hass, entity_id, since=None, cache=self._history_cache,
            history_days=self.history_days,
        )
        if len(all_readings) < 3:
            return

        # Discover historical replacements from jump detection
        threshold = dev.custom_threshold or self.low_threshold
        suspected = detect_replacement_jumps(
            all_readings,
            low_threshold=threshold,
            known_replacements=dev.replacement_history,
            denied_replacements=dev.denied_replacements,
        )

        # Backfill discovered replacements into replacement_history
        # (deduplicate with ±48h tolerance, do NOT fire events)
        tolerance_s = 48 * 3600.0
        for jump in suspected:
            ts = jump.get("timestamp")
            if ts is None:
                continue
            # Check if this timestamp is already known (within tolerance)
            already_known = any(
                abs(ts - existing) < tolerance_s
                for existing in dev.replacement_history
            )
            if not already_known:
                dev.replacement_history.append(ts)
                dev.replacement_history.sort()
                self.store.mark_dirty()

        if not dev.replacement_history:
            return

        # Detect and record completed cycles
        await self._async_try_record_completed_cycle(
            entity_id, all_readings,
        )

    async def async_shutdown(self) -> None:
        """Shut down the coordinator, save store, remove listeners."""
        if self._unsub_state_listener:
            self._unsub_state_listener()
            self._unsub_state_listener = None
        # Cancel bootstrap if running
        if self._bootstrap_task and not self._bootstrap_task.done():
            self._bootstrap_task.cancel()
            self._bootstrap_task = None
        # Cancel any pending rebuild tasks
        for task in self._pending_rebuilds.values():
            if not task.done():
                task.cancel()
        self._pending_rebuilds.clear()
        # Clear callbacks to prevent leaks on reload
        self._new_device_callbacks.clear()
        await self.store.async_save()
