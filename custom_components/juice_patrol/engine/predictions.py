"""Prediction math for Juice Patrol.

Parametric curve fitting (exponential, Weibull, piecewise linear) with
Theil-Sen robust regression as fallback. SDT compression preprocessing.
No external dependencies (pure Python).
"""

from __future__ import annotations

import math
import random
import time
from dataclasses import dataclass
from enum import StrEnum

from ..const import FLAT_SLOPE_THRESHOLD
from .compress import compress as _sdt_compress
from .curve_fit import extrapolate_to_threshold as _extrapolate
from .curve_fit import fit_discharge_curve as _fit_curve
from .models import ClassPrior
from .sessions import extract_discharge_sessions
from .utils import detect_step_size as _detect_step_size, median as _median


class Confidence(StrEnum):
    """Prediction confidence classification."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INSUFFICIENT_DATA = "insufficient_data"


class PredictionStatus(StrEnum):
    """Prediction status classification."""

    NORMAL = "normal"
    CHARGING = "charging"
    FLAT = "flat"
    IDLE = "idle"
    NOISY = "noisy"
    INSUFFICIENT_DATA = "insufficient_data"
    SINGLE_LEVEL = "single_level"
    INSUFFICIENT_RANGE = "insufficient_range"


@dataclass
class PredictionResult:
    """Result of a discharge prediction for a single device."""

    slope_per_day: float | None  # %/day (negative = discharging)
    slope_per_hour: float | None  # %/hour (for fast-discharge display)
    intercept: float | None
    r_squared: float | None
    confidence: Confidence
    estimated_empty_timestamp: float | None  # Unix timestamp
    estimated_days_remaining: float | None
    estimated_hours_remaining: float | None  # for fast-discharge devices
    data_points_used: int
    status: PredictionStatus
    reliability: int | None = None  # 0-100 score
    session_count: int | None = None  # number of discharge sessions (multi-session only)
    t0: float | None = None  # reference timestamp for the regression (intercept is at t0)
    chemistry: str | None = None  # chemistry used for this prediction (from chemistry_from_battery_type)


def _no_prediction(
    status: PredictionStatus,
    data_points: int,
    session_count: int | None = None,
    chemistry: str | None = None,
) -> PredictionResult:
    """Create a PredictionResult for early-exit cases with no usable prediction."""
    return PredictionResult(
        slope_per_day=None,
        slope_per_hour=None,
        intercept=None,
        r_squared=None,
        confidence=Confidence.INSUFFICIENT_DATA,
        estimated_empty_timestamp=None,
        estimated_days_remaining=None,
        estimated_hours_remaining=None,
        data_points_used=data_points,
        status=status,
        reliability=None,
        session_count=session_count,
        t0=None,
        chemistry=chemistry,
    )


def _validate_and_sort_readings(
    readings: list[dict[str, float]],
) -> list[dict[str, float]]:
    """Validate and sort readings by timestamp, removing duplicates.

    Ensures readings are sorted by time (oldest first), removes entries
    with duplicate timestamps (keeps last), and filters out readings
    with timestamps in the future (clock skew tolerance: 1 hour).
    """
    if len(readings) <= 1:
        return readings

    # Sort by timestamp
    readings = sorted(readings, key=lambda r: r["t"])

    # Remove duplicate timestamps (keep last occurrence at each timestamp)
    seen: dict[float, dict[str, float]] = {}
    for r in readings:
        seen[r["t"]] = r
    readings = sorted(seen.values(), key=lambda r: r["t"])

    # Filter out future timestamps (allow 1 hour tolerance for clock skew)
    cutoff = time.time() + 3600
    readings = [r for r in readings if r["t"] <= cutoff]

    return readings


def _strip_trailing_dead(
    readings: list[dict[str, float]],
    dead_threshold: float = 1.0,
) -> list[dict[str, float]]:
    """Remove trailing readings where the battery is effectively dead.

    Walks backwards from the end and strips readings with v ≤ dead_threshold.
    Keeps at least 3 readings so downstream gating works normally.
    If the entire series is at or below the threshold, returns it unchanged
    (the battery was always "dead" from the engine's perspective).
    """
    if len(readings) <= 3:
        return readings

    # Find the last reading above the dead threshold
    last_alive = len(readings) - 1
    while last_alive >= 0 and readings[last_alive]["v"] <= dead_threshold:
        last_alive -= 1

    if last_alive < 0:
        # Every reading is at/below threshold — return unchanged
        return readings

    # Keep up to last_alive (inclusive), but ensure at least 3 readings
    trimmed = readings[: last_alive + 1]
    if len(trimmed) < 3:
        return readings

    return trimmed


# ---------------------------------------------------------------------------
# Main discharge prediction — parametric fitting with Theil-Sen fallback
# ---------------------------------------------------------------------------


def predict_discharge(
    readings: list[dict[str, float]],
    target_level: float = 0.0,
    half_life_days: float | None = None,
    min_readings: int = 3,
    min_timespan_hours: float = 24.0,
    class_prior: ClassPrior | None = None,
    _depth: int = 0,
    chemistry: str | None = None,
) -> PredictionResult:
    """Predict when a battery will reach the target level.

    Pipeline:
    1. Validate & sort, SDT compress
    2. Early gating (insufficient data, single level, insufficient range)
    3. Regime-change detection (at depth 0)
    4. Parametric curve fit (≥6 points) → Theil-Sen fallback (<6 points)
    5. Status classification, confidence, extrapolation

    Args:
        readings: List of {"t": timestamp, "v": level} dicts.
        target_level: Battery level to predict reaching (%, default 0 = empty).
        half_life_days: Exponential decay half-life for WLR weighting (fallback path).
        min_readings: Minimum readings required.
        min_timespan_hours: Minimum time span required (hours).
        class_prior: Optional prior from completed cycles of the same device class.
        chemistry: Optional chemistry string (e.g. "coin_cell", "NMC") from
            chemistry_from_battery_type(). Influences model selection,
            confidence caps, and reliability scoring.

    Returns:
        PredictionResult with prediction data and confidence.
    """
    # Validate and sort (but do NOT compress yet — need raw counts for gating)
    readings = _validate_and_sort_readings(readings)

    # Strip trailing "dead battery" readings (≤1%) before fitting.
    # Post-death 0% readings add no signal and flatten the fitted slope,
    # causing the prediction to overshoot by weeks/months.
    # The normal pipeline then curve-fits the actual discharge, producing
    # a proper prediction line that shows users the system predicted correctly.
    n_before_strip = len(readings)
    readings = _strip_trailing_dead(readings, dead_threshold=1.0)
    # When dead readings were stripped, the battery died around the last
    # surviving reading.  Use its timestamp for estimated_empty_timestamp
    # instead of "now + 0 days" (which would be the present, not when it died).
    dead_at_ts: float | None = (
        readings[-1]["t"] if len(readings) < n_before_strip and readings else None
    )

    if len(readings) < min_readings:
        return _no_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings), chemistry=chemistry)

    # Check minimum timespan
    times = [r["t"] for r in readings]
    timespan_hours = (max(times) - min(times)) / 3600
    if timespan_hours < min_timespan_hours:
        return _no_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings), chemistry=chemistry)

    # Early gating: single-level or insufficient range (on raw data)
    values = [r["v"] for r in readings]
    unique_values = set(round(v, 1) for v in values)
    value_range = max(values) - min(values)

    if len(unique_values) <= 1:
        return _no_prediction(PredictionStatus.SINGLE_LEVEL, len(readings), chemistry=chemistry)

    step_size = _detect_step_size(values)
    if value_range <= step_size:
        return _no_prediction(PredictionStatus.INSUFFICIENT_RANGE, len(readings), chemistry=chemistry)

    # Compute SoC-split ratio on raw readings before compression
    cr = _soc_split_ratio(readings)

    # Compute tail-cliff ratio for primary-cell cliff detection
    tcr = _tail_cliff_ratio(readings)
    use_tail_slope = (
        chemistry in _CLIFF_CHEMISTRIES
        and tcr is not None
        and tcr > 2.5
    )

    # SDT compress for fitting (preserves slope transitions, removes plateaus)
    full_readings = readings
    readings = _sdt_compress(readings, step_size=step_size)

    # Convert timestamps to days relative to the first reading
    t0 = readings[0]["t"]
    x = [(r["t"] - t0) / 86400.0 for r in readings]
    y = [r["v"] for r in readings]

    # Regime-change detection (BEFORE outlier rejection, at depth 0 only).
    if _depth == 0:
        pre_ts_slope, _, _ = _theil_sen(x, y)
        tail_result = _detect_regime_change(readings, x, y, pre_ts_slope, step_size=step_size)
        if tail_result is not None:
            tail_readings, _, _ = tail_result
            result = predict_discharge(
                tail_readings,
                target_level=target_level,
                half_life_days=half_life_days,
                min_readings=min(min_readings, 3),
                min_timespan_hours=min(min_timespan_hours, 1.0),
                class_prior=class_prior,
                _depth=1,
                chemistry=chemistry,
            )
            # Reclassify confidence using the full dataset context.
            from dataclasses import replace as _replace
            full_conf = _classify_confidence(
                result.r_squared or 0.0,
                timespan_hours,
                len(readings),
                chemistry=chemistry,
                soc_split_ratio=cr,
                readings=full_readings,
                tail_cliff_ratio=tcr,
            )
            if full_conf != result.confidence:
                result = _replace(
                    result,
                    confidence=full_conf,
                    reliability=compute_reliability(
                        result.data_points_used,
                        timespan_hours,
                        result.r_squared,
                        full_conf,
                        days_remaining=result.estimated_days_remaining,
                        chemistry=chemistry,
                        soc_split_ratio=cr,
                        tail_cliff_ratio=tcr,
                    ),
                )
            return result

    n_points = len(readings)
    now = time.time()
    now_days = (now - t0) / 86400.0

    # Calendar aging: estimate SoC lost while sensor was idle
    idle_days = (now - readings[-1]["t"]) / 86400.0
    cal_soc_lost = 0.0
    if chemistry is not None:
        adjusted_soc = _calendar_penalty(readings[-1]["v"], idle_days, chemistry)
        if adjusted_soc < readings[-1]["v"]:
            cal_soc_lost = readings[-1]["v"] - adjusted_soc

    # --- Fallback chain: parametric → Theil-Sen → insufficient ---
    # Try parametric curve fitting BEFORE outlier rejection. Parametric
    # models (exponential, Weibull, piecewise) handle non-linearity
    # natively — outlier rejection is designed for linear Theil-Sen and
    # would incorrectly discard steep transitions that are signal.
    curve_fit = None
    if n_points >= 6:
        curve_fit = _fit_curve(
            readings, class_prior=class_prior,
            candidates=_candidate_models(chemistry),
        )

    if curve_fit is not None and curve_fit.r_squared > 0.10:
        result = _build_result_from_curve(
            curve_fit, readings, full_readings, t0, now, now_days, target_level,
            timespan_hours, n_points, chemistry=chemistry, soc_split_ratio=cr,
            cal_soc_lost=cal_soc_lost, use_tail_slope=use_tail_slope,
            tail_cliff_ratio=tcr,
        )
    else:
        # Theil-Sen fallback: reject outliers first (linear model is sensitive)
        cleaned, x, y = _reject_by_residual(readings, x, y)
        if len(cleaned) < min_readings:
            cleaned = readings
            t0 = cleaned[0]["t"]
            x = [(r["t"] - t0) / 86400.0 for r in cleaned]
            y = [r["v"] for r in cleaned]

        result = _predict_discharge_theil_sen(
            cleaned, x, y, t0, now, now_days, target_level,
            half_life_days, timespan_hours, len(cleaned),
            chemistry=chemistry, soc_split_ratio=cr,
            full_readings=full_readings, cal_soc_lost=cal_soc_lost,
            use_tail_slope=use_tail_slope, tail_cliff_ratio=tcr,
        )

    # Post-death override: when dead readings were stripped, the battery is
    # dead regardless of what the curve fit predicts.  Keep the fitted slope
    # and R² (they produce the prediction curve on the chart) but override
    # days remaining and timestamp to reflect reality.
    if dead_at_ts is not None:
        from dataclasses import replace as _dc_replace
        result = _dc_replace(
            result,
            estimated_empty_timestamp=round(dead_at_ts, 0),
            estimated_days_remaining=0.0,
            estimated_hours_remaining=0.0,
        )

    return result


def _build_result_from_curve(
    fit, cleaned, full_readings, t0, now, now_days, target_level,
    timespan_hours, n_cleaned,
    chemistry: str | None = None,
    soc_split_ratio: float = 1.0,
    cal_soc_lost: float = 0.0,
    use_tail_slope: bool = False,
    tail_cliff_ratio: float | None = None,
) -> PredictionResult:
    """Build PredictionResult from a successful CurveFitResult."""
    # Compute instantaneous slope at t=now as %/day
    slope = fit.slope_at(now_days)
    slope_per_hour = round(slope / 24.0, 4)
    r_squared = fit.r_squared

    # Intercept: value of the fitted curve at t=0
    intercept = fit.predict(0.0)

    # For FLAT/CHARGING classification, use the overall (macro) slope
    # rather than the instantaneous slope. Piecewise models return
    # the slope of the *current segment*, which can be near-zero on a
    # noisy plateau even when the macro trend is clearly discharging.
    first_v = full_readings[0]["v"]
    last_v = full_readings[-1]["v"]
    duration_days = (full_readings[-1]["t"] - full_readings[0]["t"]) / 86400.0
    overall_slope = (last_v - first_v) / duration_days if duration_days > 0 else 0.0

    if overall_slope > 0.01:
        conf = _classify_confidence(
            r_squared, timespan_hours, n_cleaned,
            chemistry=chemistry, soc_split_ratio=soc_split_ratio, readings=full_readings,
            tail_cliff_ratio=tail_cliff_ratio,
        )
        return PredictionResult(
            slope_per_day=round(slope, 4),
            slope_per_hour=slope_per_hour,
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_empty_timestamp=None,
            estimated_days_remaining=None,
            estimated_hours_remaining=None,
            data_points_used=n_cleaned,
            status=PredictionStatus.CHARGING,
            reliability=compute_reliability(
                n_cleaned, timespan_hours, r_squared, conf, days_remaining=None,
                chemistry=chemistry, soc_split_ratio=soc_split_ratio,
                tail_cliff_ratio=tail_cliff_ratio,
            ),
            t0=t0,
            chemistry=chemistry,
        )

    if abs(overall_slope) <= FLAT_SLOPE_THRESHOLD:
        # Zero out positive slopes — a FLAT device shouldn't report
        # a positive discharge rate (confusing in the UI).
        flat_slope = 0.0 if slope > 0 else round(slope, 4)
        flat_slope_per_hour = 0.0 if slope > 0 else slope_per_hour
        conf = _classify_confidence(
            r_squared, timespan_hours, n_cleaned,
            chemistry=chemistry, soc_split_ratio=soc_split_ratio, readings=full_readings,
            tail_cliff_ratio=tail_cliff_ratio,
        )
        return PredictionResult(
            slope_per_day=flat_slope,
            slope_per_hour=flat_slope_per_hour,
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_empty_timestamp=None,
            estimated_days_remaining=None,
            estimated_hours_remaining=None,
            data_points_used=n_cleaned,
            status=PredictionStatus.FLAT,
            reliability=compute_reliability(
                n_cleaned, timespan_hours, r_squared, conf, days_remaining=None,
                chemistry=chemistry, soc_split_ratio=soc_split_ratio,
                tail_cliff_ratio=tail_cliff_ratio,
            ),
            t0=t0,
            chemistry=chemistry,
        )

    if r_squared < 0.10:
        conf = _classify_confidence(
            r_squared, timespan_hours, n_cleaned,
            chemistry=chemistry, soc_split_ratio=soc_split_ratio, readings=full_readings,
            tail_cliff_ratio=tail_cliff_ratio,
        )
        return PredictionResult(
            slope_per_day=None,
            slope_per_hour=None,
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_empty_timestamp=None,
            estimated_days_remaining=None,
            estimated_hours_remaining=None,
            data_points_used=n_cleaned,
            status=PredictionStatus.NOISY,
            reliability=compute_reliability(
                n_cleaned, timespan_hours, r_squared, conf, days_remaining=None,
                chemistry=chemistry, soc_split_ratio=soc_split_ratio,
                tail_cliff_ratio=tail_cliff_ratio,
            ),
            t0=t0,
            chemistry=chemistry,
        )

    # If the overall trend is clearly discharging but the instantaneous
    # slope is positive (e.g. piecewise model on a noisy plateau at the
    # bottom of a discharge curve), clamp slope_per_day to the overall
    # slope.  This prevents the frontend from drawing a rising prediction
    # line when the device is clearly draining.
    if overall_slope < -FLAT_SLOPE_THRESHOLD and slope > 0:
        slope = overall_slope
        slope_per_hour = round(slope / 24.0, 4)

    # Extrapolate to target using the fitted curve
    days_remaining_val = _extrapolate(
        fit, current_t_days=now_days, threshold_pct=target_level,
    )

    if days_remaining_val is None:
        # Curve doesn't reach target (e.g. exponential with floor above target)
        # Fall back to linear extrapolation from the current slope
        current_val = fit.predict(now_days)
        if slope < -0.001:
            days_remaining_val = (target_level - current_val) / slope
            if days_remaining_val < 0:
                days_remaining_val = 0.0
        else:
            days_remaining_val = None

    # Cliff override for primary cells: when the tail is much steeper than
    # the overall trend and the model is not piecewise (which already handles
    # breakpoints natively), re-extrapolate using the tail slope.
    if (
        use_tail_slope
        and days_remaining_val is not None
        and not fit.model_name.startswith("piecewise_linear")
    ):
        current_val = fit.predict(now_days)
        # Compute tail OLS slope from the last 5 full_readings
        _tail = full_readings[-5:]
        _t0t = _tail[0]["t"]
        _xt = [(_r["t"] - _t0t) / 86400.0 for _r in _tail]
        _yt = [_r["v"] for _r in _tail]
        _n = len(_xt)
        _sx = sum(_xt)
        _sy = sum(_yt)
        _sxx = sum(_xi * _xi for _xi in _xt)
        _sxy = sum(_xi * _yi for _xi, _yi in zip(_xt, _yt))
        _d = _n * _sxx - _sx * _sx
        if abs(_d) > 1e-15:
            tail_slope = (_n * _sxy - _sx * _sy) / _d
            if tail_slope < -0.001:
                days_remaining_val = max(0.0, (target_level - current_val) / tail_slope)
                slope = tail_slope
                slope_per_hour = round(slope / 24.0, 4)

    # Stuck-plateau cap for primary cells: sensor stuck at a low level
    # is in the pre-cliff zone — cap remaining days by chemistry.
    if (
        chemistry in _STUCK_PLATEAU_CAPS
        and full_readings is not None
        and _stuck_near_cliff(full_readings, threshold_pct=30.0)
        and days_remaining_val is not None
    ):
        cap = _STUCK_PLATEAU_CAPS[chemistry]
        if days_remaining_val > cap:
            days_remaining_val = cap

    if days_remaining_val is not None:
        if days_remaining_val < 0:
            days_remaining_val = 0.0
        # Calendar aging penalty: reduce remaining days by SoC lost / |slope|
        if cal_soc_lost > 0 and slope < -FLAT_SLOPE_THRESHOLD:
            days_remaining_val = max(0.0, days_remaining_val - cal_soc_lost / abs(slope))
        hours_remaining = round(days_remaining_val * 24.0, 1)
        estimated_empty_timestamp = now + (days_remaining_val * 86400.0)
        conf = _classify_confidence(
            r_squared, timespan_hours, n_cleaned,
            chemistry=chemistry, soc_split_ratio=soc_split_ratio, readings=full_readings,
            tail_cliff_ratio=tail_cliff_ratio,
        )
        return PredictionResult(
            slope_per_day=round(slope, 4),
            slope_per_hour=slope_per_hour,
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_empty_timestamp=round(estimated_empty_timestamp, 0),
            estimated_days_remaining=round(days_remaining_val, 1),
            estimated_hours_remaining=hours_remaining,
            data_points_used=n_cleaned,
            status=PredictionStatus.NORMAL,
            reliability=compute_reliability(
                n_cleaned, timespan_hours, r_squared, conf,
                days_remaining=days_remaining_val,
                chemistry=chemistry, soc_split_ratio=soc_split_ratio,
                tail_cliff_ratio=tail_cliff_ratio,
            ),
            t0=t0,
            chemistry=chemistry,
        )

    # Can't extrapolate — return with slope but no prediction
    conf = _classify_confidence(
        r_squared, timespan_hours, n_cleaned,
        chemistry=chemistry, soc_split_ratio=soc_split_ratio, readings=full_readings,
        tail_cliff_ratio=tail_cliff_ratio,
    )
    return PredictionResult(
        slope_per_day=round(slope, 4),
        slope_per_hour=slope_per_hour,
        intercept=round(intercept, 2),
        r_squared=round(r_squared, 4),
        confidence=conf,
        estimated_empty_timestamp=None,
        estimated_days_remaining=None,
        estimated_hours_remaining=None,
        data_points_used=n_cleaned,
        status=PredictionStatus.NORMAL,
        reliability=compute_reliability(
            n_cleaned, timespan_hours, r_squared, conf, days_remaining=None,
            chemistry=chemistry, soc_split_ratio=soc_split_ratio,
            tail_cliff_ratio=tail_cliff_ratio,
        ),
        t0=t0,
        chemistry=chemistry,
    )


def _predict_discharge_theil_sen(
    cleaned, x, y, t0, now, now_days, target_level,
    half_life_days, timespan_hours, n_cleaned,
    chemistry: str | None = None,
    soc_split_ratio: float = 1.0,
    full_readings: list[dict[str, float]] | None = None,
    cal_soc_lost: float = 0.0,
    use_tail_slope: bool = False,
    tail_cliff_ratio: float | None = None,
) -> PredictionResult:
    """Theil-Sen fallback path (< 6 points or parametric fit failed)."""
    # Auto-compute half-life from drain characteristics if not specified
    if half_life_days is None:
        half_life_days = _adaptive_half_life(cleaned)

    # Calculate weights (exponential decay, most recent = highest weight)
    t_max = x[-1]
    decay = math.log(2) / half_life_days
    weights = [math.exp(-decay * (t_max - xi)) for xi in x]

    # Primary estimator: Theil-Sen (robust to outliers)
    ts_slope, ts_intercept, ts_r2 = _theil_sen(x, y)

    # Secondary estimator: weighted linear regression
    wlr_slope, wlr_intercept, wlr_r2 = _weighted_linear_regression(x, y, weights)

    # Model selection: use Theil-Sen by default.
    slope, intercept, r_squared = ts_slope, ts_intercept, ts_r2
    if (
        wlr_r2 > ts_r2 + 0.1
        and ts_slope != 0
        and wlr_slope * ts_slope > 0  # Same sign
        and abs(wlr_slope - ts_slope) / abs(ts_slope) <= 0.5  # Within 50%
    ):
        slope, intercept, r_squared = wlr_slope, wlr_intercept, wlr_r2

    slope_per_hour = round(slope / 24.0, 4)

    _readings = full_readings or cleaned

    if slope > 0.01:
        conf = _classify_confidence(
            r_squared, timespan_hours, n_cleaned,
            chemistry=chemistry, soc_split_ratio=soc_split_ratio, readings=_readings,
            tail_cliff_ratio=tail_cliff_ratio,
        )
        return PredictionResult(
            slope_per_day=round(slope, 4),
            slope_per_hour=slope_per_hour,
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_empty_timestamp=None,
            estimated_days_remaining=None,
            estimated_hours_remaining=None,
            data_points_used=n_cleaned,
            status=PredictionStatus.CHARGING,
            reliability=compute_reliability(
                n_cleaned, timespan_hours, r_squared, conf, days_remaining=None,
                chemistry=chemistry, soc_split_ratio=soc_split_ratio,
                tail_cliff_ratio=tail_cliff_ratio,
            ),
            t0=t0,
            chemistry=chemistry,
        )

    if abs(slope) <= FLAT_SLOPE_THRESHOLD:
        flat_slope = 0.0 if slope > 0 else round(slope, 4)
        flat_slope_per_hour = 0.0 if slope > 0 else slope_per_hour
        conf = _classify_confidence(
            r_squared, timespan_hours, n_cleaned,
            chemistry=chemistry, soc_split_ratio=soc_split_ratio, readings=_readings,
            tail_cliff_ratio=tail_cliff_ratio,
        )
        return PredictionResult(
            slope_per_day=flat_slope,
            slope_per_hour=flat_slope_per_hour,
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_empty_timestamp=None,
            estimated_days_remaining=None,
            estimated_hours_remaining=None,
            data_points_used=n_cleaned,
            status=PredictionStatus.FLAT,
            reliability=compute_reliability(
                n_cleaned, timespan_hours, r_squared, conf, days_remaining=None,
                chemistry=chemistry, soc_split_ratio=soc_split_ratio,
                tail_cliff_ratio=tail_cliff_ratio,
            ),
            t0=t0,
            chemistry=chemistry,
        )

    if r_squared < 0.10:
        conf = _classify_confidence(
            r_squared, timespan_hours, n_cleaned,
            chemistry=chemistry, soc_split_ratio=soc_split_ratio, readings=_readings,
            tail_cliff_ratio=tail_cliff_ratio,
        )
        return PredictionResult(
            slope_per_day=None,
            slope_per_hour=None,
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_empty_timestamp=None,
            estimated_days_remaining=None,
            estimated_hours_remaining=None,
            data_points_used=n_cleaned,
            status=PredictionStatus.NOISY,
            reliability=compute_reliability(
                n_cleaned, timespan_hours, r_squared, conf, days_remaining=None,
                chemistry=chemistry, soc_split_ratio=soc_split_ratio,
                tail_cliff_ratio=tail_cliff_ratio,
            ),
            t0=t0,
            chemistry=chemistry,
        )

    # Predict when level hits target
    days_to_threshold = (target_level - intercept) / slope
    days_remaining = days_to_threshold - now_days

    if days_remaining < 0:
        days_remaining = 0.0

    # Cliff override for primary cells: use tail slope instead of
    # overall Theil-Sen when entering the cliff zone.
    if use_tail_slope and _readings:
        _tail = _readings[-5:]
        if len(_tail) >= 3:
            _t0t = _tail[0]["t"]
            _xt = [(_r["t"] - _t0t) / 86400.0 for _r in _tail]
            _yt = [_r["v"] for _r in _tail]
            _n = len(_xt)
            _sx = sum(_xt)
            _sy = sum(_yt)
            _sxx = sum(_xi * _xi for _xi in _xt)
            _sxy = sum(_xi * _yi for _xi, _yi in zip(_xt, _yt))
            _d = _n * _sxx - _sx * _sx
            if abs(_d) > 1e-15:
                tail_slope = (_n * _sxy - _sx * _sy) / _d
                if tail_slope < -0.001:
                    current_val = _readings[-1]["v"]
                    days_remaining = max(0.0, (target_level - current_val) / tail_slope)
                    slope = tail_slope
                    slope_per_hour = round(slope / 24.0, 4)

    # Stuck-plateau cap for primary cells
    if (
        chemistry in _STUCK_PLATEAU_CAPS
        and _readings is not None
        and _stuck_near_cliff(_readings, threshold_pct=30.0)
    ):
        cap = _STUCK_PLATEAU_CAPS[chemistry]
        if days_remaining > cap:
            days_remaining = cap

    # Calendar aging penalty: reduce remaining days by SoC lost / |slope|
    if cal_soc_lost > 0 and slope < -FLAT_SLOPE_THRESHOLD:
        days_remaining = max(0.0, days_remaining - cal_soc_lost / abs(slope))

    hours_remaining = round(days_remaining * 24.0, 1)
    estimated_empty_timestamp = now + (days_remaining * 86400.0)
    conf = _classify_confidence(
        r_squared, timespan_hours, n_cleaned,
        chemistry=chemistry, soc_split_ratio=soc_split_ratio, readings=_readings,
        tail_cliff_ratio=tail_cliff_ratio,
    )

    return PredictionResult(
        slope_per_day=round(slope, 4),
        slope_per_hour=slope_per_hour,
        intercept=round(intercept, 2),
        r_squared=round(r_squared, 4),
        confidence=conf,
        estimated_empty_timestamp=round(estimated_empty_timestamp, 0),
        estimated_days_remaining=round(days_remaining, 1),
        estimated_hours_remaining=hours_remaining,
        data_points_used=n_cleaned,
        status=PredictionStatus.NORMAL,
        reliability=compute_reliability(
            n_cleaned, timespan_hours, r_squared, conf,
            days_remaining=days_remaining,
            chemistry=chemistry, soc_split_ratio=soc_split_ratio,
            tail_cliff_ratio=tail_cliff_ratio,
        ),
        t0=t0,
        chemistry=chemistry,
    )


# ---------------------------------------------------------------------------
# Multi-session prediction (rechargeable devices)
# ---------------------------------------------------------------------------


def predict_discharge_multisession(
    all_readings: list[dict[str, float]],
    current_level: float,
    target_level: float = 0.0,
    min_sessions: int = 1,
    chemistry: str | None = None,
) -> PredictionResult:
    """Predict discharge for rechargeable devices using multi-session analysis.

    Extracts individual discharge sessions and fits parametric curves to each.
    Uses median of per-session predicted durations for the aggregate prediction.
    Falls back to Theil-Sen slopes when sessions are too short for curve fitting.

    Args:
        all_readings: Full reading history (sawtooth), sorted by time.
        current_level: Current battery level (%).
        target_level: Target level to predict reaching (default 0).
        min_sessions: Minimum number of discharge sessions required.
        chemistry: Optional chemistry string (e.g. "NMC", "NiMH") from
            chemistry_from_battery_type(). Stored on the result for downstream use.

    Returns:
        Standard PredictionResult so all downstream consumers work unchanged.
    """
    sessions = extract_discharge_sessions(all_readings)
    total_points = sum(len(s) for s in sessions)

    if len(sessions) < min_sessions:
        return _no_prediction(
            PredictionStatus.INSUFFICIENT_DATA, total_points,
            session_count=len(sessions),
            chemistry=chemistry,
        )

    # Fit each session: try parametric first, fall back to Theil-Sen slope
    session_slopes: list[float] = []
    session_durations: list[float] = []  # predicted total duration per session
    session_r2s: list[float] = []

    for session in sessions:
        compressed = _sdt_compress(session)
        t0_s = compressed[0]["t"]
        x = [(r["t"] - t0_s) / 86400.0 for r in compressed]
        y = [r["v"] for r in compressed]

        fit = None
        if len(compressed) >= 6:
            fit = _fit_curve(compressed)

        if fit is not None and fit.r_squared > 0.10:
            # Use curve fit: compute duration to target from session start
            duration = _extrapolate(fit, current_t_days=0.0, threshold_pct=target_level)
            if duration is not None and duration > 0:
                session_durations.append(duration)
            # Instantaneous slope at end of session for slope aggregate
            slope = fit.slope_at(x[-1])
            if slope != 0:
                session_slopes.append(slope)
            session_r2s.append(fit.r_squared)
        else:
            # Theil-Sen fallback
            slope, _, r_sq = _theil_sen(x, y)
            if slope != 0:
                session_slopes.append(slope)
                # Estimate duration from linear slope
                if slope < 0:
                    start_v = y[0]
                    linear_duration = (target_level - start_v) / slope
                    if linear_duration > 0:
                        session_durations.append(linear_duration)
            session_r2s.append(r_sq)

    if not session_slopes:
        return _no_prediction(
            PredictionStatus.FLAT, total_points,
            session_count=len(sessions),
            chemistry=chemistry,
        )

    median_slope = _median(session_slopes)
    slope_per_hour = round(median_slope / 24.0, 4)

    # Determine status from slope
    if median_slope > 0.01:
        status = PredictionStatus.CHARGING
    elif abs(median_slope) <= FLAT_SLOPE_THRESHOLD:
        status = PredictionStatus.FLAT
    else:
        status = PredictionStatus.NORMAL

    # Calibrate intercept to current level at now
    now = time.time()
    intercept = current_level

    # Compute R²: use median of per-session R²s or CV-based score
    if len(session_r2s) >= 2 and len(session_slopes) >= 2:
        mean_slope = sum(session_slopes) / len(session_slopes)
        if mean_slope != 0:
            variance = sum((s - mean_slope) ** 2 for s in session_slopes) / len(session_slopes)
            cv = (variance ** 0.5) / abs(mean_slope)
            r_squared = max(0.0, min(1.0, 1.0 - cv))
        else:
            r_squared = 0.0
    else:
        r_squared = session_r2s[0] if session_r2s else 0.0

    timespan_hours = (all_readings[-1]["t"] - all_readings[0]["t"]) / 3600

    if status == PredictionStatus.CHARGING or status == PredictionStatus.FLAT:
        if status == PredictionStatus.FLAT and median_slope > 0:
            report_slope = 0.0
            report_slope_per_hour = 0.0
        else:
            report_slope = round(median_slope, 4)
            report_slope_per_hour = slope_per_hour
        conf = _classify_confidence(r_squared, timespan_hours, total_points)
        return PredictionResult(
            slope_per_day=report_slope,
            slope_per_hour=report_slope_per_hour,
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_empty_timestamp=None,
            estimated_days_remaining=None,
            estimated_hours_remaining=None,
            data_points_used=total_points,
            status=status,
            reliability=compute_reliability(
                total_points, timespan_hours, r_squared, conf, days_remaining=None,
            ),
            session_count=len(sessions),
            t0=now,
            chemistry=chemistry,
        )

    if median_slope >= 0:
        conf = _classify_confidence(r_squared, timespan_hours, total_points)
        return PredictionResult(
            slope_per_day=round(median_slope, 4),
            slope_per_hour=slope_per_hour,
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_empty_timestamp=None,
            estimated_days_remaining=None,
            estimated_hours_remaining=None,
            data_points_used=total_points,
            status=PredictionStatus.FLAT,
            reliability=None,
            session_count=len(sessions),
            t0=now,
            chemistry=chemistry,
        )

    # Use median of per-session predicted durations if available,
    # otherwise fall back to linear slope extrapolation
    if session_durations:
        median_duration = _median(session_durations)
        # How far into the "average" cycle are we? Estimate from current level.
        # Assume cycle starts near 100%.
        frac_remaining = (current_level - target_level) / max(100.0 - target_level, 1.0)
        days_remaining = median_duration * max(0.0, frac_remaining)
    else:
        days_remaining = (target_level - current_level) / median_slope

    if days_remaining < 0:
        days_remaining = 0.0

    hours_remaining = round(days_remaining * 24.0, 1)
    estimated_empty_timestamp = now + (days_remaining * 86400.0)
    conf = _classify_confidence(r_squared, timespan_hours, total_points)

    return PredictionResult(
        slope_per_day=round(median_slope, 4),
        slope_per_hour=slope_per_hour,
        intercept=round(intercept, 2),
        r_squared=round(r_squared, 4),
        confidence=conf,
        estimated_empty_timestamp=round(estimated_empty_timestamp, 0),
        estimated_days_remaining=round(days_remaining, 1),
        estimated_hours_remaining=hours_remaining,
        data_points_used=total_points,
        status=PredictionStatus.NORMAL,
        reliability=compute_reliability(
            total_points, timespan_hours, r_squared, conf,
            days_remaining=days_remaining,
        ),
        session_count=len(sessions),
        t0=now,
        chemistry=chemistry,
    )


# ---------------------------------------------------------------------------
# Theil-Sen and WLR (kept as fallback estimators)
# ---------------------------------------------------------------------------


def _weighted_linear_regression(
    x: list[float],
    y: list[float],
    weights: list[float],
) -> tuple[float, float, float]:
    """Compute weighted linear regression.

    Returns (slope, intercept, r_squared).
    """
    n = len(x)
    w_sum = sum(weights)

    # Weighted means
    wx_sum = sum(w * xi for w, xi in zip(weights, x))
    wy_sum = sum(w * yi for w, yi in zip(weights, y))
    x_mean = wx_sum / w_sum
    y_mean = wy_sum / w_sum

    # Weighted covariance and variance
    ss_xy = sum(w * (xi - x_mean) * (yi - y_mean) for w, xi, yi in zip(weights, x, y))
    ss_xx = sum(w * (xi - x_mean) ** 2 for w, xi in zip(weights, x))

    if ss_xx == 0:
        return 0.0, y_mean, 0.0

    slope = ss_xy / ss_xx
    intercept = y_mean - slope * x_mean

    # R² (weighted)
    ss_res = sum(w * (yi - (slope * xi + intercept)) ** 2 for w, xi, yi in zip(weights, x, y))
    ss_tot = sum(w * (yi - y_mean) ** 2 for w, yi in zip(weights, y))

    r_squared = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
    r_squared = max(0.0, min(1.0, r_squared))  # Clamp

    return slope, intercept, r_squared


def _theil_sen(
    x: list[float], y: list[float], max_pairs: int = 5000
) -> tuple[float, float, float]:
    """Theil-Sen robust linear regression.

    Computes the median of all pairwise slopes. O(n^2) for exact,
    falls back to random sampling for large datasets.

    Returns:
        (slope, intercept, r_squared)
    """
    n = len(x)
    total_pairs = n * (n - 1) // 2

    if total_pairs <= max_pairs:
        slopes = []
        for i in range(n):
            for j in range(i + 1, n):
                dx = x[j] - x[i]
                if dx != 0:
                    slopes.append((y[j] - y[i]) / dx)
    else:
        rng = random.Random(42)
        slopes = []
        for _ in range(max_pairs):
            i, j = sorted(rng.sample(range(n), 2))
            dx = x[j] - x[i]
            if dx != 0:
                slopes.append((y[j] - y[i]) / dx)

    if not slopes:
        return 0.0, _median(y), 0.0

    slope = _median(slopes)
    intercepts = [yi - slope * xi for xi, yi in zip(x, y)]
    intercept = _median(intercepts)

    # R² from residuals
    y_mean = sum(y) / n
    ss_res = sum((yi - (slope * xi + intercept)) ** 2 for xi, yi in zip(x, y))
    ss_tot = sum((yi - y_mean) ** 2 for yi in y)
    r_squared = max(0.0, 1.0 - ss_res / ss_tot) if ss_tot > 0 else 0.0

    return slope, intercept, r_squared


# ---------------------------------------------------------------------------
# Regime-change detection
# ---------------------------------------------------------------------------


def _detect_regime_change(
    readings: list[dict[str, float]],
    x: list[float],
    y: list[float],
    overall_slope: float,
    min_tail_points: int = 5,
    change_ratio: float = 3.0,
    step_size: float = 1.0,
) -> tuple[list[dict[str, float]], list[float], list[float]] | None:
    """Detect if the recent tail has a dramatically different slope.

    Catches acceleration (voltage cliff) and deceleration (power-save mode).
    Also detects deceleration into a plateau: when the overall data is
    clearly discharging but the tail has flattened out (e.g. TRADFRI
    sensors sitting on a noisy plateau after a step drop).
    """
    if len(readings) < min_tail_points + 3:
        return None

    # Compute the "head" slope (everything except the tail) to detect
    # deceleration even when the overall slope is diluted by the plateau.
    now_t = readings[-1]["t"]
    cutoff_24h = now_t - 86400
    idx_24h = next(
        (i for i in range(len(readings)) if readings[i]["t"] >= cutoff_24h),
        len(readings),
    )
    idx_20pct = max(0, len(readings) - max(min_tail_points, len(readings) // 5))
    tail_start = min(idx_24h, idx_20pct)

    tail_readings = readings[tail_start:]
    if len(tail_readings) < min_tail_points:
        return None

    # Original gate: bail if overall slope is near-zero.
    # But first, check if the HEAD (pre-tail) was clearly discharging
    # even though the full dataset slope is diluted.
    head_readings = readings[:tail_start + 1]  # overlap one point
    reference_slope = overall_slope
    if abs(overall_slope) < 0.01 and len(head_readings) >= min_tail_points:
        head_t0 = head_readings[0]["t"]
        head_x = [(r["t"] - head_t0) / 86400.0 for r in head_readings]
        head_y = [r["v"] for r in head_readings]
        head_slope, _, _ = _theil_sen(head_x, head_y)
        # Head was clearly discharging — use it as the reference slope
        if head_slope < -0.05:
            reference_slope = head_slope  # use for ratio checks only
        else:
            return None
    elif abs(overall_slope) < 0.01:
        return None

    tail_range = abs(tail_readings[0]["v"] - tail_readings[-1]["v"])

    if tail_range < max(step_size, 3.0):
        return None

    tail_t0 = tail_readings[0]["t"]
    tail_x = [(r["t"] - tail_t0) / 86400.0 for r in tail_readings]
    tail_y = [r["v"] for r in tail_readings]
    tail_slope, _, _ = _theil_sen(tail_x, tail_y)

    abs_overall = abs(reference_slope)
    abs_tail = abs(tail_slope)

    # Direction reversal (e.g. discharge→charge transition)
    if overall_slope * tail_slope < 0 and abs_tail > 0.1:
        return tail_readings, tail_x, tail_y

    # Acceleration: tail is much steeper than overall (voltage cliff)
    if abs_overall > 0 and abs_tail / abs_overall >= change_ratio:
        return tail_readings, tail_x, tail_y

    # Deceleration: tail is much flatter than overall (plateau after drop).
    # Relaxed tail_range gate: noisy TRADFRI sensors oscillate ±2% on a
    # plateau, so tail_range can be <3.0 even though the macro trend is real.
    if abs_tail > 0.05 and abs_overall / abs_tail >= change_ratio:
        return tail_readings, tail_x, tail_y

    return None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _adaptive_half_life(
    readings: list[dict[str, float]],
    default: float = 14.0,
) -> float:
    """Calculate an appropriate half-life based on observed drain characteristics.

    Returns half-life in days.
    """
    if len(readings) < 5:
        return default

    timespan_days = (readings[-1]["t"] - readings[0]["t"]) / 86400
    if timespan_days < 1:
        return default

    value_range = readings[0]["v"] - readings[-1]["v"]

    if value_range < 0:
        return default

    if value_range <= 2:
        return max(timespan_days * 0.5, 30.0)

    days_per_percent = timespan_days / value_range
    half_life = days_per_percent * 20
    return min(max(half_life, 7.0), 180.0)


# Curve-fit model candidates per primary chemistry.
# Alkaline: two-regime (gradual + cliff); exponential can capture the
# steepening near EOL.  Piecewise finds the breakpoint.
# Lithium primary / coin cell: flat plateau then abrupt step.  Exponential
# over-fits mid-life; Weibull is overkill for a single-use cell.
# Rechargeable / unknown: None → all models (AICc decides).
_CHEMISTRY_CANDIDATES: dict[str, list[str]] = {
    "alkaline": ["piecewise_linear_2", "piecewise_linear_3", "exponential"],
    "lithium_primary": ["piecewise_linear_2", "piecewise_linear_3"],
    "coin_cell": ["piecewise_linear_2", "piecewise_linear_3"],
}

# Primary (non-rechargeable) chemistries — used for idle-day caps
_PRIMARY_CHEMISTRIES = frozenset(_CHEMISTRY_CANDIDATES.keys())


def _candidate_models(chemistry: str | None) -> list[str] | None:
    """Return the curve-fit candidate list appropriate for a chemistry.

    Returns None (= all models) for rechargeable / unknown chemistries,
    or a chemistry-specific restricted list for primary cells where certain
    model families are known to be inappropriate.
    """
    if chemistry is not None and chemistry in _CHEMISTRY_CANDIDATES:
        return _CHEMISTRY_CANDIDATES[chemistry]
    return None

# Max idle days for calendar aging penalty.
# Zigbee/Z-Wave sensors frequently go offline for days; idle_days uses
# last-reading timestamp which cannot distinguish radio silence from
# genuine idle.  A 14-day cap limits phantom SoC penalties from network
# outages while still correcting for genuine slow sensors.
_MAX_IDLE_DAYS = 365
_MAX_IDLE_DAYS_PRIMARY = 14

# Calendar aging constants: c_cal per chemistry (25°C, 50% SoC).
# Q_loss_cal ≈ c_cal × idle_days^0.5  (see CLAUDE.md domain knowledge)
_C_CAL: dict[str, float] = {
    "LFP":             0.0002,
    "NMC":             0.0005,
    "NiMH":            0.001,
    "LCO":             0.0008,
    "alkaline":        0.00105,
    "lithium_primary": 0.00052,
    "coin_cell":       0.00052,
    "unknown":         0.00105,
}


def _calendar_penalty(
    current_soc: float,
    idle_days: float,
    chemistry: str | None,
) -> float:
    """Return SoC adjusted for calendar aging during idle time.

    Uses the simplified square-root model: loss = c_cal × √(idle_days).
    Idle days are capped per chemistry class to avoid phantom penalties
    from radio-silent sensors.

    Returns current_soc minus the estimated loss, clamped to >= 0.
    """
    if idle_days <= 0:
        return current_soc
    chem = chemistry or "unknown"
    cap = _MAX_IDLE_DAYS_PRIMARY if chem in _PRIMARY_CHEMISTRIES else _MAX_IDLE_DAYS
    capped = min(idle_days, cap)
    c_cal = _C_CAL.get(chem, _C_CAL["unknown"])
    loss = c_cal * math.sqrt(capped) * 100.0  # convert fraction to %
    return max(0.0, current_soc - loss)


# Chemistry-specific reliability multipliers.
# Flat-curve primaries (coin_cell, lithium_primary) are penalised because
# integer SoC quantisation makes R² an unreliable quality signal.
# High self-discharge chemistries (NiMH) are also penalised.
_RELIABILITY_MULTIPLIERS: dict[str, float] = {
    "LFP":             1.0,
    "NMC":             1.0,
    "NiMH":            0.85,
    "LCO":             0.90,
    "alkaline":        1.05,
    "lithium_primary": 0.80,
    "coin_cell":       0.75,
}


def _soc_split_ratio(
    readings: list[dict[str, float]],
    split_pct: float = 40.0,
    min_points: int = 5,
) -> float:
    """Ratio of drain rate below split_pct to drain rate above it.

    Values > 1.0 mean the battery drains faster below the split point
    (Li-ion cliff behaviour). Returns 1.0 when there is insufficient
    data on either side of the split.
    """
    above: list[tuple[float, float]] = []  # (t, v)
    below: list[tuple[float, float]] = []
    for r in readings:
        if r["v"] > split_pct:
            above.append((r["t"], r["v"]))
        else:
            below.append((r["t"], r["v"]))

    if len(above) < min_points or len(below) < min_points:
        return 1.0

    # Compute drain rate (%/day) for each segment
    def _rate(pts: list[tuple[float, float]]) -> float:
        dt = (pts[-1][0] - pts[0][0]) / 86400.0
        dv = pts[0][1] - pts[-1][1]  # positive = discharging
        if dt <= 0 or dv <= 0:
            return 0.0
        return dv / dt

    rate_above = _rate(above)
    rate_below = _rate(below)
    if rate_above <= 0:
        return 1.0
    return rate_below / rate_above


def _stuck_near_cliff(
    readings: list[dict[str, float]],
    threshold_pct: float = 30.0,
    window: int = 5,
) -> bool:
    """Detect sensor stuck at a low level — Zigbee cliff signature.

    Returns True when the last ``window`` readings are all within 1.0 SoC
    unit of each other AND their median is at or below ``threshold_pct``.
    This catches the pattern where a sensor reports e.g. 25 % for weeks
    then drops to 0 % in one step — _detect_regime_change is blind to
    this because the tail slope is zero.
    """
    if len(readings) < window:
        return False
    tail = [r["v"] for r in readings[-window:]]
    lo, hi = min(tail), max(tail)
    if hi - lo > 1.0:
        return False
    return _median(tail) <= threshold_pct


# Primary (non-rechargeable) chemistries eligible for cliff detection.
_CLIFF_CHEMISTRIES = frozenset({"alkaline", "lithium_primary", "coin_cell"})

# Stuck-plateau remaining-days caps per chemistry.
# Primary cell stuck below 30% is in the pre-cliff zone — historical data
# shows these die in days to weeks, not months.
_STUCK_PLATEAU_CAPS: dict[str, float] = {
    "alkaline": 14.0,
    "lithium_primary": 21.0,
    "coin_cell": 21.0,
}


def _tail_cliff_ratio(
    readings: list[dict[str, float]],
    tail_n: int = 5,
) -> float | None:
    """Ratio of tail slope to overall Theil-Sen slope.

    Quantifies how steep the current discharge rate is relative to the
    session baseline.  > 2.5 indicates entering cliff zone; > 5.0 deep cliff.

    Returns None if fewer than tail_n + 3 points, or if overall slope is
    near-zero (can't compute meaningful ratio for flat discharge).

    Uses _theil_sen() for the overall slope. Uses simple OLS for the tail
    (no outliers expected in the last few readings; Theil-Sen on 5 points
    has high variance).
    """
    if len(readings) < tail_n + 3:
        return None

    # Overall Theil-Sen slope (%/day)
    t0 = readings[0]["t"]
    x_all = [(r["t"] - t0) / 86400.0 for r in readings]
    y_all = [r["v"] for r in readings]
    overall_slope, _, _ = _theil_sen(x_all, y_all)

    if abs(overall_slope) < FLAT_SLOPE_THRESHOLD:
        return None

    # Tail OLS slope (last tail_n readings)
    tail = readings[-tail_n:]
    t0_tail = tail[0]["t"]
    x_tail = [(r["t"] - t0_tail) / 86400.0 for r in tail]
    y_tail = [r["v"] for r in tail]

    n = len(x_tail)
    sum_x = sum(x_tail)
    sum_y = sum(y_tail)
    sum_xx = sum(xi * xi for xi in x_tail)
    sum_xy = sum(xi * yi for xi, yi in zip(x_tail, y_tail))
    denom = n * sum_xx - sum_x * sum_x
    if abs(denom) < 1e-15:
        return None
    tail_slope = (n * sum_xy - sum_x * sum_y) / denom

    if overall_slope == 0:
        return None
    return tail_slope / overall_slope


def _reject_by_residual(
    readings: list[dict[str, float]],
    x: list[float],
    y: list[float],
    threshold_mad: float = 3.0,
) -> tuple[list[dict[str, float]], list[float], list[float]]:
    """Reject outliers based on Theil-Sen regression residuals."""
    if len(readings) < 5:
        return readings, x, y

    slope, intercept, _ = _theil_sen(x, y)
    residuals = [yi - (slope * xi + intercept) for xi, yi in zip(x, y)]
    med_res = _median(residuals)
    abs_devs = [abs(r - med_res) for r in residuals]
    mad = _median(abs_devs)

    if mad == 0:
        epsilon = 1.0
        filtered = [
            (r, xi, yi) for r, xi, yi, res in zip(readings, x, y, residuals)
            if abs(res - med_res) <= epsilon
        ]
        if len(filtered) < 3:
            return readings, x, y
        return (
            [f[0] for f in filtered],
            [f[1] for f in filtered],
            [f[2] for f in filtered],
        )

    filtered = [
        (r, xi, yi) for r, xi, yi, res in zip(readings, x, y, residuals)
        if abs(res - med_res) <= threshold_mad * mad
    ]

    if len(filtered) < 3:
        return readings, x, y

    return (
        [f[0] for f in filtered],
        [f[1] for f in filtered],
        [f[2] for f in filtered],
    )


def _classify_confidence(
    r_squared: float,
    timespan_hours: float,
    data_points: int = 10,
    chemistry: str | None = None,
    soc_split_ratio: float = 1.0,
    readings: list[dict[str, float]] | None = None,
    tail_cliff_ratio: float | None = None,
) -> Confidence:
    """Classify prediction confidence.

    Additional chemistry / cliff awareness:
    - coin_cell and lithium_primary are capped at MEDIUM (staircase sensors
      with 5-10% steps make HIGH unreliable).
    - coin_cell and lithium_primary get more generous R² thresholds (lowered
      by 0.05) because integer SoC quantisation artificially deflates R².
    - soc_split_ratio > 2.5 forces LOW (rapid drain-rate change below the
      split point makes the extrapolation unreliable).
    - tail_cliff_ratio > 2.5 on primary chemistry forces LOW (cliff zone —
      slope estimate is unreliable).
    - _stuck_near_cliff forces LOW (sensor stuck at a low plateau; the
      next step is likely to zero).
    """
    timespan_days = timespan_hours / 24.0

    # Flat-curve chemistries: lower R² thresholds by 0.05 to compensate
    # for integer SoC quantisation artificially deflating R².
    flat_curve = chemistry in ("coin_cell", "lithium_primary")
    r2_high = 0.75 if flat_curve else 0.8
    r2_med = 0.25 if flat_curve else 0.3
    r2_low = 0.05 if flat_curve else 0.1

    if r_squared > r2_high and timespan_days >= 7 and data_points >= 10:
        level = Confidence.HIGH
    elif r_squared > r2_med and timespan_days >= 3 and data_points >= 5:
        level = Confidence.MEDIUM
    elif r_squared > r2_low:
        level = Confidence.LOW
    else:
        return Confidence.INSUFFICIENT_DATA

    # Cap coin_cell / lithium_primary at MEDIUM — coarse staircase readings
    if flat_curve and level == Confidence.HIGH:
        level = Confidence.MEDIUM

    # SoC-split ratio penalty
    if soc_split_ratio > 2.5 and level != Confidence.LOW:
        level = Confidence.LOW

    # Cliff penalty: tail_cliff_ratio > 2.5 on primary chemistry forces LOW.
    # The cliff makes the slope estimate unreliable regardless of R².
    if (
        tail_cliff_ratio is not None
        and tail_cliff_ratio > 2.5
        and chemistry in _CLIFF_CHEMISTRIES
        and level != Confidence.LOW
    ):
        level = Confidence.LOW

    # Stuck-near-cliff penalty
    if readings and _stuck_near_cliff(readings):
        level = Confidence.LOW

    return level


def compute_reliability(
    data_points: int,
    timespan_hours: float,
    r_squared: float | None,
    confidence: Confidence,
    days_remaining: float | None = None,
    chemistry: str | None = None,
    soc_split_ratio: float = 1.0,
    tail_cliff_ratio: float | None = None,
) -> int:
    """Compute a 0-100 reliability score for a prediction."""
    timespan_days = timespan_hours / 24.0

    if timespan_days < 1:
        span_score = 0.0
    elif timespan_days >= 30:
        span_score = 25.0
    else:
        span_score = (timespan_days / 30.0) * 25.0

    if timespan_days > 0:
        readings_per_day = data_points / timespan_days
    else:
        readings_per_day = 0.0
    if readings_per_day < 1:
        density_score = 0.0
    elif readings_per_day >= 4:
        density_score = 15.0
    else:
        density_score = ((readings_per_day - 1) / 3.0) * 15.0

    r2 = r_squared if r_squared is not None else 0.0
    r2_score = max(0.0, min(1.0, r2)) * 50.0

    consistency_bonus = 10.0 if r2 > 0.7 and timespan_days >= 7 else 0.0

    extrap_penalty = 0.0
    if days_remaining is not None and timespan_days > 0:
        ratio = days_remaining / timespan_days
        if ratio > 5:
            extrap_penalty = -20.0
        elif ratio > 2:
            extrap_penalty = -20.0 * ((ratio - 2.0) / 3.0)

    raw = span_score + density_score + r2_score + consistency_bonus + extrap_penalty

    # Chemistry multiplier
    chem = chemistry or "unknown"
    multiplier = _RELIABILITY_MULTIPLIERS.get(chem, 1.0)
    raw *= multiplier

    # SoC-split penalty: high soc_split_ratio means the extrapolation below the
    # split point is unreliable. Scale: ratio 2.5→−10, 5.0→−20.
    if soc_split_ratio > 2.0:
        split_penalty = min(20.0, (soc_split_ratio - 2.0) * (20.0 / 3.0))
        raw -= split_penalty

    # Tail-cliff penalty for primary cells: chemistry-specific.
    # alkaline: −15 at cliff (>2.5), −25 at deep cliff (>5.0)
    # lithium_primary/coin_cell: −20 at cliff, −30 at deep cliff
    if tail_cliff_ratio is not None and tail_cliff_ratio > 2.5 and chem in _CLIFF_CHEMISTRIES:
        if chem == "alkaline":
            tcr_penalty = 15.0 if tail_cliff_ratio <= 5.0 else 25.0
        else:
            # lithium_primary, coin_cell — abrupt cliff, harder to predict
            tcr_penalty = 20.0 if tail_cliff_ratio <= 5.0 else 30.0
        raw -= tcr_penalty

    return round(max(0, min(100, raw)))


def _prediction_stability_score(
    history: list[dict[str, float]],
) -> float:
    """Compute prediction stability from historical empty estimates.

    Returns a score from 0.0 (wildly unstable) to 10.0 (rock solid).
    """
    timestamps = [
        h["empty_ts"] for h in history
        if h.get("empty_ts") is not None
    ]
    if len(timestamps) < 3:
        return 0.0

    days = [ts / 86400 for ts in timestamps]
    diffs = [abs(days[i] - days[i - 1]) for i in range(1, len(days))]
    avg_shift = sum(diffs) / len(diffs)

    if avg_shift < 1:
        return 10.0
    if avg_shift < 3:
        return 7.0
    if avg_shift < 7:
        return 4.0
    if avg_shift < 14:
        return 2.0
    return 0.0


# ---------------------------------------------------------------------------
# Charge prediction (rechargeable batteries)
# ---------------------------------------------------------------------------


@dataclass
class ChargePredictionResult:
    """Result of a charge prediction for a rechargeable battery."""

    slope_per_hour: float | None  # %/hour (positive = charging)
    intercept: float | None
    r_squared: float | None
    confidence: Confidence
    estimated_full_timestamp: float | None  # Unix timestamp
    estimated_hours_to_full: float | None
    data_points_used: int
    status: PredictionStatus
    reliability: int | None = None


def _no_charge_prediction(
    status: PredictionStatus, data_points: int
) -> ChargePredictionResult:
    """Create a ChargePredictionResult for early-exit cases."""
    return ChargePredictionResult(
        slope_per_hour=None,
        intercept=None,
        r_squared=None,
        confidence=Confidence.INSUFFICIENT_DATA,
        estimated_full_timestamp=None,
        estimated_hours_to_full=None,
        data_points_used=data_points,
        status=status,
        reliability=None,
    )


def extract_charging_segment(
    readings: list[dict[str, float]],
    min_rise: float = 5.0,
    noise_tolerance: float = 2.0,
    max_flat_run: int = 3,
) -> list[dict[str, float]] | None:
    """Extract the current charging segment from the tail of the readings.

    Walks backwards from the last reading, collecting contiguous readings
    where the level is generally rising.
    """
    if len(readings) < 3:
        return None

    segment_indices = [len(readings) - 1]
    peak = readings[-1]["v"]
    flat_count = 0

    for i in range(len(readings) - 2, -1, -1):
        v = readings[i]["v"]
        v_next = readings[i + 1]["v"]

        if v > v_next + noise_tolerance:
            break

        if v >= v_next:
            flat_count += 1
            if flat_count > max_flat_run:
                break
        else:
            flat_count = 0

        segment_indices.append(i)
        peak = max(peak, v)

    segment_indices.reverse()
    segment = [readings[i] for i in segment_indices]

    total_rise = segment[-1]["v"] - segment[0]["v"]
    if total_rise < min_rise or len(segment) < 3:
        return None

    return segment


def predict_charge(
    readings: list[dict[str, float]],
    target_level: float = 100.0,
    min_readings: int = 3,
    min_timespan_hours: float = 0.5,
) -> ChargePredictionResult:
    """Predict when a charging battery will reach the target level.

    Uses SDT compression then Theil-Sen (charge is fast and linear).
    """
    if len(readings) < min_readings:
        return _no_charge_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings))

    times = [r["t"] for r in readings]
    timespan_hours = (max(times) - min(times)) / 3600
    if timespan_hours < min_timespan_hours:
        return _no_charge_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings))

    # SDT compression preprocessing (after gating on raw count)
    readings = _sdt_compress(readings)

    # Convert to hours relative to first reading
    t0 = readings[0]["t"]
    x = [(r["t"] - t0) / 3600.0 for r in readings]
    y = [r["v"] for r in readings]

    # Theil-Sen regression
    slope, intercept, r_squared = _theil_sen(x, y)

    if slope <= 0.5:
        return ChargePredictionResult(
            slope_per_hour=round(slope, 4),
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=Confidence.INSUFFICIENT_DATA,
            estimated_full_timestamp=None,
            estimated_hours_to_full=None,
            data_points_used=len(readings),
            status=PredictionStatus.FLAT,
            reliability=None,
        )

    if r_squared < 0.10:
        conf = _classify_confidence(r_squared, timespan_hours, len(readings))
        return ChargePredictionResult(
            slope_per_hour=round(slope, 4),
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_full_timestamp=None,
            estimated_hours_to_full=None,
            data_points_used=len(readings),
            status=PredictionStatus.NOISY,
            reliability=None,
        )

    hours_to_target = (target_level - intercept) / slope
    now = time.time()
    now_hours = (now - t0) / 3600.0
    hours_remaining = hours_to_target - now_hours

    if hours_remaining < 0:
        hours_remaining = 0.0

    if hours_remaining > 48:
        return ChargePredictionResult(
            slope_per_hour=round(slope, 4),
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=Confidence.LOW,
            estimated_full_timestamp=None,
            estimated_hours_to_full=None,
            data_points_used=len(readings),
            status=PredictionStatus.NORMAL,
            reliability=None,
        )

    estimated_full_timestamp = now + (hours_remaining * 3600.0)
    conf = _classify_confidence(r_squared, timespan_hours, len(readings))

    return ChargePredictionResult(
        slope_per_hour=round(slope, 4),
        intercept=round(intercept, 2),
        r_squared=round(r_squared, 4),
        confidence=conf,
        estimated_full_timestamp=round(estimated_full_timestamp, 0),
        estimated_hours_to_full=round(hours_remaining, 1),
        data_points_used=len(readings),
        status=PredictionStatus.NORMAL,
        reliability=compute_reliability(
            len(readings), timespan_hours, r_squared, conf,
            days_remaining=hours_remaining / 24.0,
        ),
    )
