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


def _no_prediction(
    status: PredictionStatus,
    data_points: int,
    session_count: int | None = None,
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

    Returns:
        PredictionResult with prediction data and confidence.
    """
    # Validate and sort (but do NOT compress yet — need raw counts for gating)
    readings = _validate_and_sort_readings(readings)

    if len(readings) < min_readings:
        return _no_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings))

    # Check minimum timespan
    times = [r["t"] for r in readings]
    timespan_hours = (max(times) - min(times)) / 3600
    if timespan_hours < min_timespan_hours:
        return _no_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings))

    # Early gating: single-level or insufficient range (on raw data)
    values = [r["v"] for r in readings]
    unique_values = set(round(v, 1) for v in values)
    value_range = max(values) - min(values)

    if len(unique_values) <= 1:
        return _no_prediction(PredictionStatus.SINGLE_LEVEL, len(readings))

    step_size = _detect_step_size(values)
    if value_range <= step_size:
        return _no_prediction(PredictionStatus.INSUFFICIENT_RANGE, len(readings))

    # SDT compress for fitting (preserves slope transitions, removes plateaus)
    readings = _sdt_compress(readings)

    # Convert timestamps to days relative to the first reading
    t0 = readings[0]["t"]
    x = [(r["t"] - t0) / 86400.0 for r in readings]
    y = [r["v"] for r in readings]

    # Regime-change detection (BEFORE outlier rejection, at depth 0 only).
    if _depth == 0:
        pre_ts_slope, _, _ = _theil_sen(x, y)
        tail_result = _detect_regime_change(readings, x, y, pre_ts_slope)
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
            )
            # Reclassify confidence using the full dataset context.
            from dataclasses import replace as _replace
            full_conf = _classify_confidence(
                result.r_squared or 0.0,
                timespan_hours,
                len(readings),
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
                    ),
                )
            return result

    # Reject outliers using residual-based method
    cleaned, x, y = _reject_by_residual(readings, x, y)
    if len(cleaned) < min_readings:
        cleaned = readings
        t0 = cleaned[0]["t"]
        x = [(r["t"] - t0) / 86400.0 for r in cleaned]
        y = [r["v"] for r in cleaned]

    n_cleaned = len(cleaned)
    now = time.time()
    now_days = (now - t0) / 86400.0

    # --- Fallback chain: parametric → Theil-Sen → insufficient ---
    # Try parametric curve fitting first (≥6 points)
    curve_fit = None
    if n_cleaned >= 6:
        curve_fit = _fit_curve(cleaned, class_prior=class_prior)

    if curve_fit is not None and curve_fit.r_squared > 0.10:
        # Parametric model succeeded — use it
        return _build_result_from_curve(
            curve_fit, cleaned, t0, now, now_days, target_level,
            timespan_hours, n_cleaned,
        )

    # Theil-Sen fallback (works for ≥3 points)
    return _predict_discharge_theil_sen(
        cleaned, x, y, t0, now, now_days, target_level,
        half_life_days, timespan_hours, n_cleaned,
    )


def _build_result_from_curve(
    fit, cleaned, t0, now, now_days, target_level,
    timespan_hours, n_cleaned,
) -> PredictionResult:
    """Build PredictionResult from a successful CurveFitResult."""
    # Compute instantaneous slope at t=now as %/day
    slope = fit.slope_at(now_days)
    slope_per_hour = round(slope / 24.0, 4)
    r_squared = fit.r_squared

    # Intercept: value of the fitted curve at t=0
    intercept = fit.predict(0.0)

    if slope > 0.01:
        conf = _classify_confidence(r_squared, timespan_hours, n_cleaned)
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
            ),
            t0=t0,
        )

    if abs(slope) <= 0.02:
        conf = _classify_confidence(r_squared, timespan_hours, n_cleaned)
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
            status=PredictionStatus.FLAT,
            reliability=compute_reliability(
                n_cleaned, timespan_hours, r_squared, conf, days_remaining=None,
            ),
            t0=t0,
        )

    if r_squared < 0.10:
        conf = _classify_confidence(r_squared, timespan_hours, n_cleaned)
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
            ),
            t0=t0,
        )

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

    if days_remaining_val is not None:
        if days_remaining_val < 0:
            days_remaining_val = 0.0
        hours_remaining = round(days_remaining_val * 24.0, 1)
        estimated_empty_timestamp = now + (days_remaining_val * 86400.0)
        conf = _classify_confidence(r_squared, timespan_hours, n_cleaned)
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
            ),
            t0=t0,
        )

    # Can't extrapolate — return with slope but no prediction
    conf = _classify_confidence(r_squared, timespan_hours, n_cleaned)
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
        ),
        t0=t0,
    )


def _predict_discharge_theil_sen(
    cleaned, x, y, t0, now, now_days, target_level,
    half_life_days, timespan_hours, n_cleaned,
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

    if slope > 0.01:
        conf = _classify_confidence(r_squared, timespan_hours, n_cleaned)
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
            ),
            t0=t0,
        )

    if abs(slope) <= 0.02:
        conf = _classify_confidence(r_squared, timespan_hours, n_cleaned)
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
            status=PredictionStatus.FLAT,
            reliability=compute_reliability(
                n_cleaned, timespan_hours, r_squared, conf, days_remaining=None,
            ),
            t0=t0,
        )

    if r_squared < 0.10:
        conf = _classify_confidence(r_squared, timespan_hours, n_cleaned)
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
            ),
            t0=t0,
        )

    # Predict when level hits target
    days_to_threshold = (target_level - intercept) / slope
    days_remaining = days_to_threshold - now_days

    if days_remaining < 0:
        days_remaining = 0.0

    hours_remaining = round(days_remaining * 24.0, 1)
    estimated_empty_timestamp = now + (days_remaining * 86400.0)
    conf = _classify_confidence(r_squared, timespan_hours, n_cleaned)

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
        ),
        t0=t0,
    )


# ---------------------------------------------------------------------------
# Multi-session prediction (rechargeable devices)
# ---------------------------------------------------------------------------


def predict_discharge_multisession(
    all_readings: list[dict[str, float]],
    current_level: float,
    target_level: float = 0.0,
    min_sessions: int = 1,
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

    Returns:
        Standard PredictionResult so all downstream consumers work unchanged.
    """
    sessions = extract_discharge_sessions(all_readings)
    total_points = sum(len(s) for s in sessions)

    if len(sessions) < min_sessions:
        return _no_prediction(
            PredictionStatus.INSUFFICIENT_DATA, total_points,
            session_count=len(sessions),
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
        )

    median_slope = _median(session_slopes)
    slope_per_hour = round(median_slope / 24.0, 4)

    # Determine status from slope
    if median_slope > 0.01:
        status = PredictionStatus.CHARGING
    elif abs(median_slope) <= 0.02:
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
            status=status,
            reliability=compute_reliability(
                total_points, timespan_hours, r_squared, conf, days_remaining=None,
            ),
            session_count=len(sessions),
            t0=now,
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
) -> tuple[list[dict[str, float]], list[float], list[float]] | None:
    """Detect if the recent tail has a dramatically different slope.

    Catches acceleration (voltage cliff) and deceleration (power-save mode).
    """
    if len(readings) < min_tail_points + 3:
        return None

    if abs(overall_slope) < 0.01:
        return None

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

    tail_range = abs(tail_readings[0]["v"] - tail_readings[-1]["v"])
    if tail_range < 3.0:
        return None

    tail_t0 = tail_readings[0]["t"]
    tail_x = [(r["t"] - tail_t0) / 86400.0 for r in tail_readings]
    tail_y = [r["v"] for r in tail_readings]
    tail_slope, _, _ = _theil_sen(tail_x, tail_y)

    abs_overall = abs(overall_slope)
    abs_tail = abs(tail_slope)

    if overall_slope * tail_slope < 0 and abs_tail > 0.1:
        return tail_readings, tail_x, tail_y

    if abs_overall > 0 and abs_tail / abs_overall >= change_ratio:
        return tail_readings, tail_x, tail_y

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
    r_squared: float, timespan_hours: float, data_points: int = 10,
) -> Confidence:
    """Classify prediction confidence."""
    timespan_days = timespan_hours / 24.0

    if r_squared > 0.8 and timespan_days >= 7 and data_points >= 10:
        return Confidence.HIGH
    if r_squared > 0.3 and timespan_days >= 3 and data_points >= 5:
        return Confidence.MEDIUM
    if r_squared > 0.1:
        return Confidence.LOW
    return Confidence.INSUFFICIENT_DATA


def compute_reliability(
    data_points: int,
    timespan_hours: float,
    r_squared: float | None,
    confidence: Confidence,
    days_remaining: float | None = None,
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

    return round(max(0, min(100,
        span_score + density_score + r2_score
        + consistency_bonus + extrap_penalty
    )))


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
