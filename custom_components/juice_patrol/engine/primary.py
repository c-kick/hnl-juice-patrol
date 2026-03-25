"""Primary (non-rechargeable) battery prediction pipeline.

Cycle-aware, cache-backed engine for predicting remaining life of
primary cells (alkaline, lithium_primary, coin_cell).

Pure Python — no HA imports, no numpy/scipy.
"""

from __future__ import annotations

import statistics
import time
from dataclasses import dataclass

from .compress import compress
from .curve_fit import CurveFitResult, extrapolate_to_threshold, fit_discharge_curve
from .models import ClassPrior
from .smooth import cycle_relative_smooth
from .utils import detect_step_size

# 48-hour tolerance for matching readings to replacement timestamps
_REPLACEMENT_TOLERANCE_S = 48 * 3600.0

# Minimum upward jump (percentage points) to trigger an inferred cycle split
_JUMP_THRESHOLD_PCT = 20.0


@dataclass
class PrimaryCycle:
    """A single discharge cycle extracted from a primary battery's history."""

    readings: list[dict[str, float]]  # {"t": ..., "v": ...}
    start_t: float
    end_t: float
    is_completed: bool  # True if ended by replacement, False if ongoing
    replacement_t: float | None = None


def isolate_primary_cycles(
    readings: list[dict[str, float]],
    replacement_timestamps: list[float],
) -> list[PrimaryCycle]:
    """Split readings into primary discharge cycles.

    Cycles are split at:
    1. Known replacement timestamps (±48h tolerance match to nearest reading)
    2. Large upward jumps (≥20 pp) NOT near a known replacement

    The last segment is always the ongoing cycle (is_completed=False).
    Downward gaps (e.g., radio silence where level drops) do NOT trigger a split.

    Args:
        readings: sorted list of {"t": unix_ts, "v": pct}.
        replacement_timestamps: list of known replacement timestamps.

    Returns:
        List of PrimaryCycle, chronologically ordered. Empty if < 2 readings.
    """
    if len(readings) < 2:
        return []

    sorted_replacements = sorted(replacement_timestamps)

    # Find split points: indices where a new cycle begins (the index of the
    # first reading in the NEW cycle, i.e. the reading AFTER the split).
    split_indices: list[int] = []
    split_replacement_t: dict[int, float] = {}  # split_index → replacement timestamp

    # Pass 1: split at known replacement timestamps
    for rep_t in sorted_replacements:
        best_idx = _find_nearest_reading(readings, rep_t)
        if best_idx is None:
            continue
        # The replacement reading is the first of the new cycle
        # (the jump UP happens at this point)
        if best_idx not in split_indices and best_idx > 0:
            split_indices.append(best_idx)
            split_replacement_t[best_idx] = rep_t

    # Pass 2: detect large upward jumps not near a known replacement
    for i in range(1, len(readings)):
        jump = readings[i]["v"] - readings[i - 1]["v"]
        if jump >= _JUMP_THRESHOLD_PCT and not _near_any_split(
            i, split_indices, tolerance=2
        ):
            split_indices.append(i)

    split_indices = sorted(set(split_indices))

    # Build cycles from segments
    cycles: list[PrimaryCycle] = []
    segment_starts = [0] + split_indices
    segment_ends = split_indices + [len(readings)]

    for seg_idx, (start, end) in enumerate(zip(segment_starts, segment_ends)):
        segment = readings[start:end]
        if not segment:
            continue

        is_last = seg_idx == len(segment_starts) - 1
        rep_t = split_replacement_t.get(end) if not is_last and end in split_replacement_t else None

        cycles.append(
            PrimaryCycle(
                readings=segment,
                start_t=segment[0]["t"],
                end_t=segment[-1]["t"],
                is_completed=not is_last,
                replacement_t=rep_t,
            )
        )

    return cycles


def _find_nearest_reading(
    readings: list[dict[str, float]], timestamp: float
) -> int | None:
    """Find the index of the reading nearest to timestamp, within tolerance.

    Returns the index of the reading closest to the replacement timestamp
    where the value jumped UP (i.e., the first reading of the new battery).
    Searches within ±_REPLACEMENT_TOLERANCE_S.
    """
    best_idx: int | None = None
    best_dist = _REPLACEMENT_TOLERANCE_S + 1

    for i, r in enumerate(readings):
        dist = abs(r["t"] - timestamp)
        if dist > _REPLACEMENT_TOLERANCE_S:
            if r["t"] > timestamp + _REPLACEMENT_TOLERANCE_S:
                break  # readings are sorted, no point continuing
            continue
        # Prefer the reading that represents the jump UP (new battery)
        # — the one at or after the replacement timestamp with a higher value
        # than its predecessor
        if i > 0 and r["v"] > readings[i - 1]["v"] and dist < best_dist:
            best_dist = dist
            best_idx = i
        elif best_idx is None and dist < best_dist:
            best_dist = dist
            best_idx = i

    return best_idx


def _near_any_split(
    index: int, split_indices: list[int], tolerance: int = 2
) -> bool:
    """Check if index is within ±tolerance of any existing split index."""
    return any(abs(index - si) <= tolerance for si in split_indices)


# ---------------------------------------------------------------------------
# ShapePrior — aggregated discharge shape from completed cycles
# ---------------------------------------------------------------------------

@dataclass
class ShapePrior:
    """Aggregated discharge shape learned from completed primary cycles."""

    median_params: dict[str, float]  # Median fitted model parameters
    param_spread: dict[str, float]   # IQR (or range) of each parameter
    n_cycles: int                    # Number of completed cycles used
    median_duration: float           # Median cycle duration in days


def learn_discharge_shape(
    completed_cycles: list[PrimaryCycle],
    chemistry: str | None = None,
    window_frac: float = 0.05,
) -> ShapePrior | None:
    """Learn a discharge shape prior from completed cycles.

    For each completed cycle: smooth → compress → fit. Then aggregate
    the fitted parameters across cycles to produce a ShapePrior.

    Args:
        completed_cycles: List of completed PrimaryCycles (is_completed=True).
        chemistry: Chemistry string for model candidate selection.
        window_frac: Smoothing window fraction for cycle_relative_smooth.

    Returns:
        ShapePrior if at least one cycle produced a valid fit, else None.
    """
    if not completed_cycles:
        return None

    from .predictions import _candidate_models  # avoid circular at module level

    candidates = _candidate_models(chemistry)
    fits: list[CurveFitResult] = []
    durations: list[float] = []

    for cycle in completed_cycles:
        if len(cycle.readings) < 3:
            continue
        smoothed = cycle_relative_smooth(cycle.readings, window_frac=window_frac)
        compressed = compress(smoothed)
        if len(compressed) < 3:
            continue
        fit = fit_discharge_curve(compressed, candidates=candidates)
        if fit is None:
            continue
        duration_days = (cycle.end_t - cycle.start_t) / 86400.0
        fits.append(fit)
        durations.append(duration_days)

    if not fits:
        return None

    # Group fits by the most common model name
    model_counts: dict[str, int] = {}
    for f in fits:
        model_counts[f.model_name] = model_counts.get(f.model_name, 0) + 1
    best_model = max(model_counts, key=model_counts.get)  # type: ignore[arg-type]

    # Use only fits of the winning model for parameter aggregation
    model_fits = [f for f in fits if f.model_name == best_model]

    # Collect all parameter names from the winning model's fits
    all_param_names: set[str] = set()
    for f in model_fits:
        all_param_names.update(f.params.keys())

    # Compute median and spread (IQR or range) for each parameter
    median_params: dict[str, float] = {}
    param_spread: dict[str, float] = {}

    for name in sorted(all_param_names):
        values = [f.params[name] for f in model_fits if name in f.params]
        if not values:
            continue
        median_params[name] = statistics.median(values)
        if len(values) >= 4:
            q1, q3 = _quartiles(values)
            param_spread[name] = q3 - q1
        elif len(values) >= 2:
            param_spread[name] = max(values) - min(values)
        else:
            param_spread[name] = 0.0

    return ShapePrior(
        median_params=median_params,
        param_spread=param_spread,
        n_cycles=len(model_fits),
        median_duration=statistics.median(durations),
    )


def shape_prior_to_class_prior(
    shape: ShapePrior, model_name: str,
) -> ClassPrior:
    """Convert a ShapePrior to a ClassPrior for use with fit_discharge_curve."""
    return ClassPrior(
        model_name=model_name,
        median_params=shape.median_params,
        iqr_params=shape.param_spread,
        median_duration_days=shape.median_duration,
        iqr_duration_days=0.0,  # not used for primary fitting
        cycle_count=shape.n_cycles,
        duration_series=[],
    )


def _quartiles(values: list[float]) -> tuple[float, float]:
    """Compute Q1 and Q3 using the median-of-halves method."""
    s = sorted(values)
    n = len(s)
    mid = n // 2
    lower = s[:mid]
    upper = s[mid + 1:] if n % 2 == 1 else s[mid:]
    q1 = statistics.median(lower) if lower else s[0]
    q3 = statistics.median(upper) if upper else s[-1]
    return q1, q3


# ---------------------------------------------------------------------------
# Prediction pipeline
# ---------------------------------------------------------------------------

@dataclass
class PrimaryPredictionResult:
    """Wraps PredictionResult with plume bounds."""

    prediction: "PredictionResult"  # Median — the "official" prediction
    best_case_days: float | None    # Optimistic bound
    worst_case_days: float | None   # Pessimistic bound
    plume_curves: dict | None       # {"median": [...], "best": [...], "worst": [...]}


def predict_primary(
    all_readings: list[dict[str, float]],
    replacement_timestamps: list[float],
    chemistry: str | None = None,
    class_prior: ClassPrior | None = None,
    target_level: float = 0.0,
) -> PrimaryPredictionResult:
    """Primary battery prediction pipeline.

    Splits readings into cycles, learns a shape prior from completed cycles,
    then predicts the current (ongoing) cycle with plume bounds.

    Args:
        all_readings: All readings for this device, sorted by time.
        replacement_timestamps: Known replacement timestamps.
        chemistry: Chemistry string (e.g. "alkaline", "coin_cell").
        class_prior: Optional class-level prior (from DeviceClassModels).
        target_level: Battery level to predict reaching (%).

    Returns:
        PrimaryPredictionResult with median prediction and plume bounds.
    """
    from .predictions import (
        PredictionResult,
        PredictionStatus,
        _no_prediction,
        _validate_and_sort_readings,
        _strip_trailing_dead,
    )

    readings = _validate_and_sort_readings(all_readings)
    if len(readings) < 3:
        return _wrap_no_prediction(
            _no_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings), chemistry=chemistry)
        )

    # Strip trailing dead readings
    n_before = len(readings)
    readings = _strip_trailing_dead(readings, dead_threshold=1.0)
    dead_at_ts: float | None = (
        readings[-1]["t"] if len(readings) < n_before and readings else None
    )

    if len(readings) < 3:
        return _wrap_no_prediction(
            _no_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings), chemistry=chemistry)
        )

    # Split into cycles
    cycles = isolate_primary_cycles(readings, replacement_timestamps)
    if not cycles:
        return _wrap_no_prediction(
            _no_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings), chemistry=chemistry)
        )

    # Separate completed and ongoing
    completed = [c for c in cycles if c.is_completed]
    ongoing = cycles[-1] if not cycles[-1].is_completed else None

    if ongoing is None:
        # All cycles are completed — no ongoing cycle to predict
        return _wrap_no_prediction(
            _no_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings), chemistry=chemistry)
        )

    # Learn shape from completed cycles
    shape = learn_discharge_shape(completed, chemistry=chemistry) if completed else None

    # Merge class_prior with shape_prior (shape takes precedence when available)
    effective_prior = class_prior
    if shape is not None:
        # Determine the best model name for the prior
        # Use the model from learn_discharge_shape's winning model
        model_name = _infer_model_name(shape, chemistry)
        effective_prior = shape_prior_to_class_prior(shape, model_name)

    # Predict the current cycle
    result = _predict_current_cycle(
        ongoing, shape, effective_prior, chemistry, target_level, dead_at_ts,
    )
    return result


def _predict_current_cycle(
    ongoing: PrimaryCycle,
    shape: ShapePrior | None,
    class_prior: ClassPrior | None,
    chemistry: str | None,
    target_level: float,
    dead_at_ts: float | None,
) -> PrimaryPredictionResult:
    """Predict remaining life for the current ongoing cycle."""
    from .predictions import (
        Confidence,
        PredictionResult,
        PredictionStatus,
        _calendar_penalty,
        _candidate_models,
        _classify_confidence,
        _no_prediction,
        _stuck_near_cliff,
        _tail_cliff_ratio,
        _theil_sen,
        compute_reliability,
    )
    from ..const import FLAT_SLOPE_THRESHOLD

    readings = ongoing.readings
    if len(readings) < 3:
        return _wrap_no_prediction(
            _no_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings), chemistry=chemistry)
        )

    # Early gating: single level or insufficient range
    values = [r["v"] for r in readings]
    unique_values = set(round(v, 1) for v in values)
    value_range = max(values) - min(values)

    if len(unique_values) <= 1:
        return _wrap_no_prediction(
            _no_prediction(PredictionStatus.SINGLE_LEVEL, len(readings), chemistry=chemistry)
        )

    step_size = detect_step_size(values)
    if value_range <= step_size:
        return _wrap_no_prediction(
            _no_prediction(PredictionStatus.INSUFFICIENT_RANGE, len(readings), chemistry=chemistry)
        )

    # Smooth → compress → fit
    smoothed = cycle_relative_smooth(readings)
    compressed = compress(smoothed, step_size=step_size)
    if len(compressed) < 3:
        return _wrap_no_prediction(
            _no_prediction(PredictionStatus.INSUFFICIENT_DATA, len(compressed), chemistry=chemistry)
        )

    candidates = _candidate_models(chemistry)
    fit = fit_discharge_curve(compressed, class_prior=class_prior, candidates=candidates)

    # Timestamps and time context
    t0 = readings[0]["t"]
    now = time.time()
    now_days = (now - t0) / 86400.0
    timespan_hours = (readings[-1]["t"] - readings[0]["t"]) / 3600.0

    # Calendar aging
    idle_days = (now - readings[-1]["t"]) / 86400.0
    cal_soc_lost = 0.0
    if chemistry is not None:
        adjusted_soc = _calendar_penalty(readings[-1]["v"], idle_days, chemistry)
        if adjusted_soc < readings[-1]["v"]:
            cal_soc_lost = readings[-1]["v"] - adjusted_soc

    # Tail cliff ratio
    tcr = _tail_cliff_ratio(readings)

    # Stuck near cliff
    stuck = _stuck_near_cliff(readings)

    if fit is None or fit.r_squared < 0.10:
        # Theil-Sen fallback
        x = [(r["t"] - t0) / 86400.0 for r in compressed]
        y_vals = [r["v"] for r in compressed]
        if len(x) >= 3:
            slope, intercept, r2 = _theil_sen(x, y_vals)
        else:
            return _wrap_no_prediction(
                _no_prediction(PredictionStatus.INSUFFICIENT_DATA, len(compressed), chemistry=chemistry)
            )

        if abs(slope) <= FLAT_SLOPE_THRESHOLD:
            conf = _classify_confidence(
                r2, timespan_hours, len(compressed), chemistry=chemistry,
                readings=readings, tail_cliff_ratio=tcr,
            )
            pred = PredictionResult(
                slope_per_day=0.0,
                slope_per_hour=0.0,
                intercept=round(intercept, 2),
                r_squared=round(r2, 4),
                confidence=conf,
                estimated_empty_timestamp=None,
                estimated_days_remaining=None,
                estimated_hours_remaining=None,
                data_points_used=len(compressed),
                status=PredictionStatus.FLAT,
                reliability=compute_reliability(
                    len(compressed), timespan_hours, r2, conf,
                    chemistry=chemistry, tail_cliff_ratio=tcr,
                ),
                t0=t0,
                chemistry=chemistry,
            )
            return _wrap_no_prediction(pred)

        # Linear extrapolation
        current_val = readings[-1]["v"] - cal_soc_lost
        days_remaining = (target_level - current_val) / slope if slope < 0 else None
        if days_remaining is not None and days_remaining < 0:
            days_remaining = 0.0

        conf = _classify_confidence(
            r2, timespan_hours, len(compressed), chemistry=chemistry,
            readings=readings, tail_cliff_ratio=tcr,
            days_remaining=days_remaining,
        )
        if stuck and (days_remaining is None or days_remaining > 1.0):
            conf = Confidence.LOW

        empty_ts = round(now + days_remaining * 86400.0, 0) if days_remaining is not None else None
        pred = PredictionResult(
            slope_per_day=round(slope, 4),
            slope_per_hour=round(slope / 24.0, 4),
            intercept=round(intercept, 2),
            r_squared=round(r2, 4),
            confidence=conf,
            estimated_empty_timestamp=empty_ts,
            estimated_days_remaining=round(days_remaining, 1) if days_remaining is not None else None,
            estimated_hours_remaining=round(days_remaining * 24.0, 1) if days_remaining is not None else None,
            data_points_used=len(compressed),
            status=PredictionStatus.NORMAL,
            reliability=compute_reliability(
                len(compressed), timespan_hours, r2, conf,
                days_remaining=days_remaining, chemistry=chemistry,
                tail_cliff_ratio=tcr,
            ),
            t0=t0,
            chemistry=chemistry,
        )
        if dead_at_ts is not None:
            pred = _replace_fields(pred, estimated_empty_timestamp=round(dead_at_ts, 0),
                                   estimated_days_remaining=0.0, estimated_hours_remaining=0.0)
        # Cold-start plume from Theil-Sen — no model-spread, just scale slope
        plume = _build_plume_cold_theil_sen(readings, slope, t0, now, target_level)
        return PrimaryPredictionResult(
            prediction=pred,
            best_case_days=plume["best_days"],
            worst_case_days=plume["worst_days"],
            plume_curves=plume["curves"],
        )

    # --- Parametric fit succeeded ---
    slope = fit.slope_at(now_days)
    r_squared = fit.r_squared
    intercept_val = fit.predict(0.0)

    # Overall slope for FLAT/CHARGING classification
    first_v = readings[0]["v"]
    last_v = readings[-1]["v"]
    duration_days = timespan_hours / 24.0
    overall_slope = (last_v - first_v) / duration_days if duration_days > 0 else 0.0

    if overall_slope > 0.01:
        conf = _classify_confidence(
            r_squared, timespan_hours, len(compressed), chemistry=chemistry,
            readings=readings, tail_cliff_ratio=tcr,
        )
        pred = PredictionResult(
            slope_per_day=round(slope, 4),
            slope_per_hour=round(slope / 24.0, 4),
            intercept=round(intercept_val, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_empty_timestamp=None,
            estimated_days_remaining=None,
            estimated_hours_remaining=None,
            data_points_used=len(compressed),
            status=PredictionStatus.CHARGING,
            reliability=compute_reliability(
                len(compressed), timespan_hours, r_squared, conf,
                chemistry=chemistry, tail_cliff_ratio=tcr,
            ),
            t0=t0,
            chemistry=chemistry,
        )
        return _wrap_no_prediction(pred)

    if abs(overall_slope) <= FLAT_SLOPE_THRESHOLD:
        flat_slope = 0.0 if slope > 0 else round(slope, 4)
        conf = _classify_confidence(
            r_squared, timespan_hours, len(compressed), chemistry=chemistry,
            readings=readings, tail_cliff_ratio=tcr,
        )
        pred = PredictionResult(
            slope_per_day=flat_slope,
            slope_per_hour=0.0 if slope > 0 else round(slope / 24.0, 4),
            intercept=round(intercept_val, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_empty_timestamp=None,
            estimated_days_remaining=None,
            estimated_hours_remaining=None,
            data_points_used=len(compressed),
            status=PredictionStatus.FLAT,
            reliability=compute_reliability(
                len(compressed), timespan_hours, r_squared, conf,
                chemistry=chemistry, tail_cliff_ratio=tcr,
            ),
            t0=t0,
            chemistry=chemistry,
        )
        return _wrap_no_prediction(pred)

    # Clamp positive instantaneous slope when overall trend is discharging
    if overall_slope < -FLAT_SLOPE_THRESHOLD and slope > 0:
        slope = overall_slope

    # Extrapolate to target
    days_remaining = extrapolate_to_threshold(
        fit, current_t_days=now_days, threshold_pct=target_level,
    )

    # Cliff override for primary cells
    _cliff_chemistries = {"alkaline", "lithium_primary", "coin_cell"}
    use_tail_slope = (
        chemistry in _cliff_chemistries
        and tcr is not None
        and tcr > 2.5
    )
    if (
        use_tail_slope
        and days_remaining is not None
        and not fit.model_name.startswith("piecewise_linear")
    ):
        current_val = fit.predict(now_days) - cal_soc_lost
        # Tail slope from last 5 readings
        tail = readings[-5:]
        tt0 = tail[0]["t"]
        xt = [(_r["t"] - tt0) / 86400.0 for _r in tail]
        yt = [_r["v"] for _r in tail]
        t_slope, _, _ = _theil_sen(xt, yt)
        if t_slope < -0.001:
            tail_days = (target_level - current_val) / t_slope
            if tail_days >= 0:
                days_remaining = tail_days

    # Linear fallback if curve doesn't reach target
    if days_remaining is None:
        current_val = fit.predict(now_days) - cal_soc_lost
        if slope < -0.001:
            days_remaining = (target_level - current_val) / slope
            if days_remaining < 0:
                days_remaining = 0.0

    conf = _classify_confidence(
        r_squared, timespan_hours, len(compressed), chemistry=chemistry,
        readings=readings, tail_cliff_ratio=tcr,
        days_remaining=days_remaining,
    )
    if stuck and (days_remaining is None or days_remaining > 1.0):
        conf = Confidence.LOW

    empty_ts = round(now + days_remaining * 86400.0, 0) if days_remaining is not None else None

    pred = PredictionResult(
        slope_per_day=round(slope, 4),
        slope_per_hour=round(slope / 24.0, 4),
        intercept=round(intercept_val, 2),
        r_squared=round(r_squared, 4),
        confidence=conf,
        estimated_empty_timestamp=empty_ts,
        estimated_days_remaining=round(days_remaining, 1) if days_remaining is not None else None,
        estimated_hours_remaining=round(days_remaining * 24.0, 1) if days_remaining is not None else None,
        data_points_used=len(compressed),
        status=PredictionStatus.NORMAL,
        reliability=compute_reliability(
            len(compressed), timespan_hours, r_squared, conf,
            days_remaining=days_remaining, chemistry=chemistry,
            tail_cliff_ratio=tcr,
        ),
        t0=t0,
        chemistry=chemistry,
    )

    if dead_at_ts is not None:
        pred = _replace_fields(pred, estimated_empty_timestamp=round(dead_at_ts, 0),
                               estimated_days_remaining=0.0, estimated_hours_remaining=0.0)

    # Build plume
    plume = _build_plume(fit, shape, readings, t0, now, target_level, chemistry)

    return PrimaryPredictionResult(
        prediction=pred,
        best_case_days=plume["best_days"],
        worst_case_days=plume["worst_days"],
        plume_curves=plume["curves"],
    )


# ---------------------------------------------------------------------------
# Plume generation
# ---------------------------------------------------------------------------

def _build_plume(
    fit: CurveFitResult,
    shape: ShapePrior | None,
    readings: list[dict[str, float]],
    t0: float,
    now: float,
    target_level: float,
    chemistry: str | None,
) -> dict:
    """Build plume curves from a parametric fit.

    Returns dict with keys: best_days, worst_days, curves.
    """
    from .predictions import _candidate_models

    now_days = (now - t0) / 86400.0
    last_obs_days = (readings[-1]["t"] - t0) / 86400.0

    # Median extrapolation
    median_days = extrapolate_to_threshold(fit, now_days, target_level)

    if shape is not None and shape.n_cycles >= 1:
        # Prior-informed plume: perturb parameters
        best_days, worst_days = _plume_from_prior(
            fit, shape, now_days, target_level,
        )
    else:
        # Cold-start plume: spread across candidate models
        best_days, worst_days = _plume_from_candidates(
            readings, t0, now, target_level, chemistry,
        )

    # Generate curve points for chart rendering
    curves = _generate_plume_curves(
        fit, t0, last_obs_days, now_days, target_level,
        median_days, best_days, worst_days,
    )

    return {
        "best_days": best_days,
        "worst_days": worst_days,
        "curves": curves,
    }


def _plume_from_prior(
    fit: CurveFitResult,
    shape: ShapePrior,
    now_days: float,
    target_level: float,
) -> tuple[float | None, float | None]:
    """Compute best/worst days from ShapePrior parameter spread."""
    # Perturb parameters to get best/worst case fits
    # "Slow" edge (best case): parameters shifted to extend life
    # "Fast" edge (worst case): parameters shifted to shorten life
    median_days = extrapolate_to_threshold(fit, now_days, target_level)
    if median_days is None:
        return None, None

    # Use the parameter spread as a scaling factor on the median prediction
    # Larger spread → wider plume
    if shape.median_duration > 0:
        # Scale factor from cycle duration variance
        spread_ratio = sum(shape.param_spread.values()) / max(
            sum(abs(v) for v in shape.median_params.values()), 0.001
        )
    else:
        spread_ratio = 0.3  # default 30% spread

    # Clamp spread ratio to reasonable range
    spread_ratio = max(0.05, min(spread_ratio, 0.5))

    best_days = median_days * (1.0 + spread_ratio)
    worst_days = median_days * (1.0 - spread_ratio)
    worst_days = max(worst_days, 0.0)

    return best_days, worst_days


def _plume_from_candidates(
    readings: list[dict[str, float]],
    t0: float,
    now: float,
    target_level: float,
    chemistry: str | None,
) -> tuple[float | None, float | None]:
    """Cold-start plume: spread across all candidate model predictions."""
    from .predictions import _candidate_models

    now_days = (now - t0) / 86400.0
    candidates = _candidate_models(chemistry)

    smoothed = cycle_relative_smooth(readings)
    compressed = compress(smoothed)
    if len(compressed) < 3:
        return None, None

    # Try each candidate model independently
    if candidates is None:
        model_names = ["exponential", "piecewise_linear_2", "piecewise_linear_3"]
    else:
        model_names = candidates

    predictions: list[float] = []
    for model in model_names:
        f = fit_discharge_curve(compressed, candidates=[model])
        if f is None:
            continue
        days = extrapolate_to_threshold(f, now_days, target_level)
        if days is not None and days > 0:
            predictions.append(days)

    if not predictions:
        return None, None

    predictions.sort()
    return predictions[-1], predictions[0]  # best (longest), worst (shortest)


def _build_plume_cold_theil_sen(
    readings: list[dict[str, float]],
    slope: float,
    t0: float,
    now: float,
    target_level: float,
) -> dict:
    """Build a simple plume from Theil-Sen slope with ±30% spread."""
    now_days = (now - t0) / 86400.0
    current_val = readings[-1]["v"]

    if slope >= 0:
        return {"best_days": None, "worst_days": None, "curves": None}

    median_days = (target_level - current_val) / slope
    if median_days < 0:
        median_days = 0.0

    best_days = median_days * 1.3
    worst_days = max(median_days * 0.7, 0.0)

    return {
        "best_days": best_days,
        "worst_days": worst_days,
        "curves": None,  # Theil-Sen has no parametric curve for chart rendering
    }


def _generate_plume_curves(
    fit: CurveFitResult,
    t0: float,
    last_obs_days: float,
    now_days: float,
    target_level: float,
    median_days: float | None,
    best_days: float | None,
    worst_days: float | None,
    n_points: int = 50,
) -> dict | None:
    """Generate plume curve points for chart rendering.

    All three curves pass through the observed data and fan out from
    the observation boundary.
    """
    if median_days is None:
        return None

    # Extrapolation starts from the last observation
    extrap_start = last_obs_days
    # End at the furthest prediction bound (+ 10% margin)
    all_days = [d for d in [median_days, best_days, worst_days] if d is not None and d > 0]
    if not all_days:
        return None
    extrap_end = extrap_start + max(all_days) * 1.1

    if extrap_end <= extrap_start:
        return None

    step = (extrap_end - extrap_start) / n_points

    # Median curve: the actual fit extrapolation
    median_curve: list[dict[str, float]] = []
    for i in range(n_points + 1):
        t_days = extrap_start + i * step
        v = fit.predict(t_days)
        v = max(target_level, min(100.0, v))
        median_curve.append({"t": t0 + t_days * 86400.0, "v": round(v, 2)})

    # Best/worst: scale the median curve's departure from last observation
    last_obs_v = fit.predict(last_obs_days)

    def _scale_curve(days_bound: float | None) -> list[dict[str, float]] | None:
        if days_bound is None or median_days is None or median_days <= 0:
            return None
        scale = days_bound / median_days if median_days > 0 else 1.0
        curve: list[dict[str, float]] = []
        for i in range(n_points + 1):
            t_days = extrap_start + i * step
            median_v = fit.predict(t_days)
            # Delta from last observation, scaled by time ratio
            delta = median_v - last_obs_v
            scaled_v = last_obs_v + delta / scale if scale > 0 else median_v
            scaled_v = max(target_level, min(100.0, scaled_v))
            curve.append({"t": t0 + t_days * 86400.0, "v": round(scaled_v, 2)})
        return curve

    best_curve = _scale_curve(best_days)
    worst_curve = _scale_curve(worst_days)

    return {
        "median": median_curve,
        "best": best_curve,
        "worst": worst_curve,
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _wrap_no_prediction(pred: "PredictionResult") -> PrimaryPredictionResult:
    """Wrap a bare PredictionResult as a PrimaryPredictionResult with no plume."""
    return PrimaryPredictionResult(
        prediction=pred,
        best_case_days=None,
        worst_case_days=None,
        plume_curves=None,
    )


def _infer_model_name(shape: ShapePrior, chemistry: str | None) -> str:
    """Infer the best model name from a ShapePrior's parameters."""
    # Check for piecewise parameters (bp1, bp2, s1, s2, etc.)
    if any(k.startswith("bp") or k.startswith("s") and k[1:].isdigit()
           for k in shape.median_params):
        n_breakpoints = sum(1 for k in shape.median_params if k.startswith("bp"))
        if n_breakpoints >= 2:
            return "piecewise_linear_3"
        return "piecewise_linear_2"
    # Check for exponential parameters
    if "a" in shape.median_params and "b" in shape.median_params:
        return "exponential"
    # Fallback
    return "exponential"


def _replace_fields(pred: "PredictionResult", **kwargs) -> "PredictionResult":
    """Return a copy of PredictionResult with specified fields replaced."""
    from dataclasses import fields as dc_fields
    d = {f.name: getattr(pred, f.name) for f in dc_fields(pred)}
    d.update(kwargs)
    from .predictions import PredictionResult
    return PredictionResult(**d)
