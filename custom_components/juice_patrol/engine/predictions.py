"""Prediction math for Juice Patrol.

Implements Theil-Sen robust regression with weighted linear regression fallback.
Covers both discharge and charge predictions.
No external dependencies (pure Python).
"""

from __future__ import annotations

import math
import random
import time
from dataclasses import dataclass
from enum import StrEnum

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


def predict_discharge(
    readings: list[dict[str, float]],
    target_level: float = 0.0,
    half_life_days: float | None = None,
    min_readings: int = 3,
    min_timespan_hours: float = 24.0,
) -> PredictionResult:
    """Predict when a battery will reach the target level.

    Args:
        readings: List of {"t": timestamp, "v": level} dicts.
        target_level: Battery level to predict reaching (%, default 0 = empty).
        half_life_days: Exponential decay half-life for weighting.
            None = auto-compute from drain characteristics.
        min_readings: Minimum readings required.
        min_timespan_hours: Minimum time span required (hours).

    Returns:
        PredictionResult with prediction data and confidence.
    """
    # Validate and sort input, then subsample for performance (Pi 3/4 safety)
    readings = _validate_and_sort_readings(readings)
    readings = _subsample_readings(readings)

    if len(readings) < min_readings:
        return _no_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings))

    # Check minimum timespan
    times = [r["t"] for r in readings]
    timespan_hours = (max(times) - min(times)) / 3600
    if timespan_hours < min_timespan_hours:
        return _no_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings))

    # Early gating: single-level or insufficient range
    values = [r["v"] for r in readings]
    unique_values = set(round(v, 1) for v in values)
    value_range = max(values) - min(values)

    if len(unique_values) <= 1:
        return _no_prediction(PredictionStatus.SINGLE_LEVEL, len(readings))

    step_size = _detect_step_size(values)
    if value_range <= step_size:
        return _no_prediction(PredictionStatus.INSUFFICIENT_RANGE, len(readings))

    # Compress staircase data: devices that report in discrete steps (e.g.
    # 100% for months, then 65%, then 61%) produce thousands of flat readings
    # that drown out the actual transitions in Theil-Sen's median slope.
    # Compress each plateau to its boundary readings (first + last) so the
    # transitions carry proportional weight.
    readings = _compress_plateaus(readings, unique_values)

    # Convert timestamps to days relative to the first reading
    t0 = readings[0]["t"]
    x = [(r["t"] - t0) / 86400.0 for r in readings]
    y = [r["v"] for r in readings]

    # Reject outliers using residual-based method (time-aware).
    # _reject_by_residual runs its own Theil-Sen fit to compute residuals.
    # We re-fit below on the cleaned data — the double Theil-Sen is intentional:
    # the first fit is on noisy data (to identify outliers), the second on
    # cleaned data (to produce the actual prediction).
    cleaned, x, y = _reject_by_residual(readings, x, y)
    if len(cleaned) < min_readings:
        # Rejection was too aggressive — fall back to unfiltered readings
        cleaned = readings
        t0 = cleaned[0]["t"]
        x = [(r["t"] - t0) / 86400.0 for r in cleaned]
        y = [r["v"] for r in cleaned]

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
    # Prefer WLR only when it clearly fits better AND agrees with Theil-Sen.
    slope, intercept, r_squared = ts_slope, ts_intercept, ts_r2
    if (
        wlr_r2 > ts_r2 + 0.1
        and ts_slope != 0
        and wlr_slope * ts_slope > 0  # Same sign
        and abs(wlr_slope - ts_slope) / abs(ts_slope) <= 0.5  # Within 50%
    ):
        slope, intercept, r_squared = wlr_slope, wlr_intercept, wlr_r2

    slope_per_hour = round(slope / 24.0, 4)

    # Interpret the slope.
    # t0 is stable through outlier rejection: x values were computed relative
    # to t0 before filtering, so removing points doesn't shift the coordinate
    # system. now_days and days_to_threshold share the same origin.
    now = time.time()
    now_days = (now - t0) / 86400.0

    n_cleaned = len(cleaned)

    if slope > 0.01:
        # Battery is charging or increasing — no empty prediction
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
                n_cleaned, timespan_hours, r_squared, conf,
                days_remaining=None,
            ),
            t0=t0,
        )

    if abs(slope) <= 0.02:
        # Extremely flat — effectively no drain
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
                n_cleaned, timespan_hours, r_squared, conf,
                days_remaining=None,
            ),
            t0=t0,
        )

    # R² gate: if the model explains < 10% of variance, the slope
    # is indistinguishable from noise — suppress rate and prediction.
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
                n_cleaned, timespan_hours, r_squared, conf,
                days_remaining=None,
            ),
            t0=t0,
        )

    # Predict when level hits target
    # y = slope * x + intercept → x = (target - intercept) / slope
    days_to_threshold = (target_level - intercept) / slope
    days_remaining = days_to_threshold - now_days

    if days_remaining < 0:
        # Already below threshold according to the model
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


def predict_discharge_multisession(
    all_readings: list[dict[str, float]],
    current_level: float,
    target_level: float = 0.0,
    min_sessions: int = 1,
) -> PredictionResult:
    """Predict discharge for rechargeable devices using multi-session analysis.

    Instead of fitting a single regression line to sawtooth data, this
    extracts individual discharge sessions and computes the median slope
    across all sessions.

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

    # Compute Theil-Sen slope for each session (cache r² for single-session path)
    session_results: list[tuple[float, float]] = []  # (slope, r_squared)
    for session in sessions:
        t0 = session[0]["t"]
        x = [(r["t"] - t0) / 86400.0 for r in session]
        y = [r["v"] for r in session]
        slope, _, r_sq = _theil_sen(x, y)
        if slope != 0:
            session_results.append((slope, r_sq))

    session_slopes = [s for s, _ in session_results]

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
    # intercept = current_level - slope * 0  (at t=now, days_offset=0)
    # For chart formula: y = slope * ((t - t0) / 86400) + intercept
    # We set t0 = now, so intercept = current_level
    intercept = current_level

    # Compute R² across all session points (how consistent the slopes are)
    # Use coefficient of variation of slopes as a proxy
    if len(session_slopes) >= 2:
        mean_slope = sum(session_slopes) / len(session_slopes)
        if mean_slope != 0:
            variance = sum((s - mean_slope) ** 2 for s in session_slopes) / len(session_slopes)
            cv = (variance ** 0.5) / abs(mean_slope)
            # Map CV to R²-like score: CV=0 → R²=1.0, CV=1 → R²=0.0
            r_squared = max(0.0, min(1.0, 1.0 - cv))
        else:
            r_squared = 0.0
    else:
        # Single session — reuse the cached R² from the loop
        r_squared = session_results[0][1] if session_results else 0.0

    # Compute total timespan across all readings for confidence
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
                total_points, timespan_hours, r_squared, conf,
                days_remaining=None,
            ),
            session_count=len(sessions),
            t0=now,
        )

    # Predict time to target
    if median_slope >= 0:
        # Not draining — can't predict empty
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

    # slope is negative (discharging): days = (target - current) / slope
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

    Args:
        x: Independent variable (days since first reading).
        y: Dependent variable (battery level %).
        max_pairs: Maximum number of pairs to evaluate. If the total
                   number of pairs exceeds this, use random sampling
                   for O(n) performance.

    Returns:
        (slope, intercept, r_squared)
    """
    n = len(x)
    total_pairs = n * (n - 1) // 2

    if total_pairs <= max_pairs:
        # Exact: enumerate all pairs
        slopes = []
        for i in range(n):
            for j in range(i + 1, n):
                dx = x[j] - x[i]
                if dx != 0:
                    slopes.append((y[j] - y[i]) / dx)
    else:
        # Sampled: random pairs for large datasets (Pi 3/4 safety)
        rng = random.Random(42)  # deterministic seed for reproducibility
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


def _adaptive_half_life(
    readings: list[dict[str, float]],
    default: float = 14.0,
) -> float:
    """Calculate an appropriate half-life based on observed drain characteristics.

    Slower drain -> longer memory window to capture the true trend.
    Faster drain -> shorter window to stay responsive.

    Assumes readings are sorted by time (oldest first). This is guaranteed
    by predict_discharge(), which receives sorted data from the coordinator,
    and _reject_by_residual() / _subsample_readings() both preserve order.

    Returns half-life in days.
    """
    if len(readings) < 5:
        return default

    timespan_days = (readings[-1]["t"] - readings[0]["t"]) / 86400
    if timespan_days < 1:
        return default

    value_range = readings[0]["v"] - readings[-1]["v"]
    # Note: value_range can be negative if battery is charging or
    # readings aren't monotonically decreasing. Handle gracefully.

    if value_range < 0:
        # Charging or increasing — no meaningful drain to base half-life on
        return default

    if value_range <= 2:
        # Essentially flat — use a long window to maximize signal extraction
        return max(timespan_days * 0.5, 30.0)

    # Derive from observed drain rate:
    # half-life ~ time it takes to drain 20 percentage points
    days_per_percent = timespan_days / value_range
    half_life = days_per_percent * 20
    # Clamp: minimum 7 days (don't over-react), maximum 180 days
    # (don't weight ancient data equally)
    return min(max(half_life, 7.0), 180.0)


def _reject_by_residual(
    readings: list[dict[str, float]],
    x: list[float],
    y: list[float],
    threshold_mad: float = 3.0,
) -> tuple[list[dict[str, float]], list[float], list[float]]:
    """Reject outliers based on Theil-Sen regression residuals.

    Fits a robust line, computes residuals, then rejects points
    whose residual exceeds threshold_mad x MAD (median absolute
    deviation). This correctly handles the natural spread of a
    draining battery while catching genuine sensor glitches.

    Args:
        readings: Original reading dicts.
        x: Time values (days).
        y: Level values (%).
        threshold_mad: MAD multiplier for rejection threshold.

    Returns:
        (filtered_readings, filtered_x, filtered_y)
    """
    if len(readings) < 5:
        return readings, x, y

    slope, intercept, _ = _theil_sen(x, y)
    residuals = [yi - (slope * xi + intercept) for xi, yi in zip(x, y)]
    med_res = _median(residuals)
    abs_devs = [abs(r - med_res) for r in residuals]
    mad = _median(abs_devs)

    if mad == 0:
        # Most residuals are identical (e.g. perfect linear data with
        # a few outliers). Any point deviating from the median residual
        # by more than a small epsilon is an outlier.
        epsilon = 1.0  # 1 percentage point tolerance
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
        # Too aggressive — fall back to unfiltered
        return readings, x, y

    return (
        [f[0] for f in filtered],
        [f[1] for f in filtered],
        [f[2] for f in filtered],
    )


def _compress_plateaus(
    readings: list[dict[str, float]],
    unique_values: set[float],
    max_unique_ratio: float = 0.05,
) -> list[dict[str, float]]:
    """Compress staircase discharge data by collapsing plateaus.

    Devices with coarse reporting (e.g. Zigbee door sensors) discharge in
    discrete jumps: 100% for months, then 65% for weeks, then 61%.  This
    produces thousands of identical readings per plateau.  Theil-Sen computes
    the median of all pairwise slopes — when >95% of pairs are within a
    single flat plateau, the median slope is ≈ 0, masking a real 39% drop.

    Fix: for staircase data (few unique values relative to reading count),
    compress each plateau to its first and last reading.  The timing of
    transitions is preserved, and they now dominate the slope calculation.

    Args:
        readings: Subsampled readings (sorted by time).
        unique_values: Set of unique rounded values (already computed).
        max_unique_ratio: Trigger compression when unique/total ≤ this ratio.

    Returns:
        Compressed readings, or original if not a staircase pattern.
    """
    if len(readings) < 20:
        return readings

    # Only compress if the data looks like a staircase: very few unique
    # values compared to the number of readings.
    if len(unique_values) > max(3, len(readings) * max_unique_ratio):
        return readings

    compressed: list[dict[str, float]] = []
    i = 0
    while i < len(readings):
        val = round(readings[i]["v"], 1)
        j = i + 1
        while j < len(readings) and round(readings[j]["v"], 1) == val:
            j += 1
        # Keep first and last of each plateau
        compressed.append(readings[i])
        if j - 1 > i:
            compressed.append(readings[j - 1])
        i = j

    return compressed


def _subsample_readings(
    readings: list[dict[str, float]],
    max_points: int = 500,
) -> list[dict[str, float]]:
    """Subsample readings for performance while preserving signal.

    Strategy:
    - Always keep the first and last readings (defines the full span).
    - Always keep readings where a level transition occurred (the signal).
    - Fill remaining budget with evenly-spaced samples from the rest.

    This ensures that devices with coarse reporting granularity (where
    transitions are the only useful data) don't lose any signal, while
    high-frequency reporters get thinned to a manageable size.

    Args:
        readings: Full reading list, sorted by time.
        max_points: Target maximum number of readings to keep.

    Returns:
        Subsampled reading list, sorted by time.
    """
    if len(readings) <= max_points:
        return readings

    # Always keep: first, last, and all transition points
    transitions = {0, len(readings) - 1}
    for i in range(1, len(readings)):
        if round(readings[i]["v"], 1) != round(readings[i - 1]["v"], 1):
            transitions.add(i)
            transitions.add(i - 1)  # keep the reading before the transition

    # If transitions exceed budget, subsample transitions themselves
    # to prevent unbounded output on noisy sensors.
    if len(transitions) >= max_points:
        indices = sorted(transitions)
        if len(indices) > max_points * 2:
            # Too many transitions — keep first, last, and evenly-spaced sample
            step = max(1, len(indices) // max_points)
            kept = set(indices[::step])
            kept.add(indices[0])
            kept.add(indices[-1])
            indices = sorted(kept)
        return [readings[i] for i in indices]

    # Fill remaining budget with evenly-spaced samples
    remaining_budget = max_points - len(transitions)
    non_transition_indices = [
        i for i in range(len(readings)) if i not in transitions
    ]

    if non_transition_indices and remaining_budget > 0:
        step = max(1, len(non_transition_indices) // remaining_budget)
        sampled = set(non_transition_indices[::step])
    else:
        sampled = set()

    all_indices = sorted(transitions | sampled)
    return [readings[i] for i in all_indices]


def _classify_confidence(
    r_squared: float, timespan_hours: float, data_points: int = 10,
) -> Confidence:
    """Classify prediction confidence.

    Considers R-squared, timespan, AND data point count.
    A 3-point prediction with high R-squared should not be HIGH confidence.
    """
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
    """Compute a 0-100 reliability score for a prediction.

    Scoring:
    - Data span: 0-25 points (0 for <1 day, 25 for >=30 days, linear)
    - Data density: 0-15 points (readings/day: 0 for <1/day, 15 for >=4/day)
    - R-squared: 0-50 points (linear from 0 to 1)
    - Consistency bonus: 10 points if R² > 0.7 AND span >= 7 days
    - Extrapolation ratio penalty: 0 to -20 points when predicting
      far beyond the observed timespan
    """
    timespan_days = timespan_hours / 24.0

    # Data span score (0-25)
    if timespan_days < 1:
        span_score = 0.0
    elif timespan_days >= 30:
        span_score = 25.0
    else:
        span_score = (timespan_days / 30.0) * 25.0

    # Data density score (0-15)
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

    # R-squared score (0-50)
    r2 = r_squared if r_squared is not None else 0.0
    r2_score = max(0.0, min(1.0, r2)) * 50.0

    # Consistency bonus (0 or 10): well-fit model with sufficient time span
    consistency_bonus = 10.0 if r2 > 0.7 and timespan_days >= 7 else 0.0

    # Extrapolation ratio penalty (0 to -20)
    extrap_penalty = 0.0
    if days_remaining is not None and timespan_days > 0:
        ratio = days_remaining / timespan_days
        if ratio > 5:
            extrap_penalty = -20.0
        elif ratio > 2:
            # Linear ramp from 0 at ratio=2 to -20 at ratio=5
            extrap_penalty = -20.0 * ((ratio - 2.0) / 3.0)

    return round(max(0, min(100,
        span_score + density_score + r2_score
        + consistency_bonus + extrap_penalty
    )))


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
    where the level is generally rising. Small dips (within noise_tolerance)
    are tolerated; larger dips or extended flat runs terminate the search.

    Args:
        readings: Full history, sorted by time (oldest first).
        min_rise: Minimum total rise (%) to qualify as a charging segment.
        noise_tolerance: Max allowed dip (%) during a charging run.
        max_flat_run: Max consecutive non-rising readings before termination.

    Returns:
        The charging segment (oldest-first) or None if not charging.
    """
    if len(readings) < 3:
        return None

    # Walk backwards
    segment_indices = [len(readings) - 1]
    peak = readings[-1]["v"]
    flat_count = 0

    for i in range(len(readings) - 2, -1, -1):
        v = readings[i]["v"]
        v_next = readings[i + 1]["v"]

        if v > v_next + noise_tolerance:
            # Significant dip going backward = we went past the charge start
            break

        if v >= v_next:
            # Non-rising (going backward means this was a rise going forward)
            flat_count += 1
            if flat_count > max_flat_run:
                break
        else:
            flat_count = 0

        segment_indices.append(i)
        peak = max(peak, v)

    segment_indices.reverse()
    segment = [readings[i] for i in segment_indices]

    # Check total rise
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

    Args:
        readings: Charging segment ({"t": timestamp, "v": level}), oldest first.
        target_level: Level to predict reaching (default 100%).
        min_readings: Minimum readings required.
        min_timespan_hours: Minimum time span required (hours).

    Returns:
        ChargePredictionResult with charge prediction data.
    """
    if len(readings) < min_readings:
        return _no_charge_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings))

    times = [r["t"] for r in readings]
    timespan_hours = (max(times) - min(times)) / 3600
    if timespan_hours < min_timespan_hours:
        return _no_charge_prediction(PredictionStatus.INSUFFICIENT_DATA, len(readings))

    # Convert to hours relative to first reading
    t0 = readings[0]["t"]
    x = [(r["t"] - t0) / 3600.0 for r in readings]
    y = [r["v"] for r in readings]

    # Theil-Sen regression
    slope, intercept, r_squared = _theil_sen(x, y)

    if slope <= 0.5:
        # Not meaningfully charging (< 0.5 %/hour)
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

    # R² gate
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

    # Predict when level hits target
    # y = slope * x + intercept → x = (target - intercept) / slope
    hours_to_target = (target_level - intercept) / slope
    now = time.time()
    now_hours = (now - t0) / 3600.0
    hours_remaining = hours_to_target - now_hours

    if hours_remaining < 0:
        hours_remaining = 0.0

    # Cap implausible predictions (> 48h to full)
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
