"""Discharge prediction math for Juice Patrol.

Implements weighted linear regression without numpy dependencies.
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass
from enum import StrEnum


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
    INSUFFICIENT_DATA = "insufficient_data"


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


def predict_discharge(
    readings: list[dict[str, float]],
    low_threshold: float = 20.0,
    half_life_days: float = 14.0,
    min_readings: int = 3,
    min_timespan_hours: float = 24.0,
) -> PredictionResult:
    """Predict when a battery will hit the low threshold.

    Args:
        readings: List of {"t": timestamp, "v": level} dicts.
        low_threshold: Battery level threshold to predict (%).
        half_life_days: Exponential decay half-life for weighting.
        min_readings: Minimum readings required.
        min_timespan_hours: Minimum time span required (hours).

    Returns:
        PredictionResult with prediction data and confidence.
    """
    _insufficient = PredictionResult(
        slope_per_day=None,
        slope_per_hour=None,
        intercept=None,
        r_squared=None,
        confidence=Confidence.INSUFFICIENT_DATA,
        estimated_empty_timestamp=None,
        estimated_days_remaining=None,
        estimated_hours_remaining=None,
        data_points_used=len(readings),
        status=PredictionStatus.INSUFFICIENT_DATA,
        reliability=None,
    )

    if len(readings) < min_readings:
        return _insufficient

    # Check minimum timespan
    times = [r["t"] for r in readings]
    timespan_hours = (max(times) - min(times)) / 3600
    if timespan_hours < min_timespan_hours:
        return _insufficient

    # Reject outliers using IQR
    values = [r["v"] for r in readings]
    cleaned = _reject_outliers(readings, values)
    if len(cleaned) < min_readings:
        cleaned = readings  # Fall back to unfiltered if too many rejected

    # Convert timestamps to days relative to the first reading
    t0 = cleaned[0]["t"]
    x = [(r["t"] - t0) / 86400.0 for r in cleaned]
    y = [r["v"] for r in cleaned]

    # Calculate weights (exponential decay, most recent = highest weight)
    t_max = x[-1]
    decay = math.log(2) / half_life_days
    weights = [math.exp(-decay * (t_max - xi)) for xi in x]

    # Weighted linear regression
    slope, intercept, r_squared = _weighted_linear_regression(x, y, weights)
    slope_per_hour = round(slope / 24.0, 4)

    # Interpret the slope
    now = time.time()
    now_days = (now - t0) / 86400.0

    if slope > 0.01:
        # Battery is charging or increasing — no empty prediction
        conf = _classify_confidence(r_squared, timespan_hours)
        return PredictionResult(
            slope_per_day=round(slope, 4),
            slope_per_hour=slope_per_hour,
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_empty_timestamp=None,
            estimated_days_remaining=None,
            estimated_hours_remaining=None,
            data_points_used=len(cleaned),
            status=PredictionStatus.CHARGING,
            reliability=compute_reliability(len(cleaned), timespan_hours, r_squared, conf),
        )

    if abs(slope) <= 0.01:
        # Extremely flat — effectively no drain
        conf = _classify_confidence(r_squared, timespan_hours)
        return PredictionResult(
            slope_per_day=round(slope, 4),
            slope_per_hour=slope_per_hour,
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 4),
            confidence=conf,
            estimated_empty_timestamp=None,
            estimated_days_remaining=None,
            estimated_hours_remaining=None,
            data_points_used=len(cleaned),
            status=PredictionStatus.FLAT,
            reliability=compute_reliability(len(cleaned), timespan_hours, r_squared, conf),
        )

    # Predict when level hits threshold
    # y = slope * x + intercept → x = (threshold - intercept) / slope
    days_to_threshold = (low_threshold - intercept) / slope
    days_remaining = days_to_threshold - now_days

    if days_remaining < 0:
        # Already below threshold according to the model
        days_remaining = 0.0

    hours_remaining = round(days_remaining * 24.0, 1)
    estimated_empty_timestamp = now + (days_remaining * 86400.0)
    conf = _classify_confidence(r_squared, timespan_hours)

    return PredictionResult(
        slope_per_day=round(slope, 4),
        slope_per_hour=slope_per_hour,
        intercept=round(intercept, 2),
        r_squared=round(r_squared, 4),
        confidence=conf,
        estimated_empty_timestamp=round(estimated_empty_timestamp, 0),
        estimated_days_remaining=round(days_remaining, 1),
        estimated_hours_remaining=hours_remaining,
        data_points_used=len(cleaned),
        status=PredictionStatus.NORMAL,
        reliability=compute_reliability(len(cleaned), timespan_hours, r_squared, conf),
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


def _reject_outliers(
    readings: list[dict[str, float]],
    values: list[float],
) -> list[dict[str, float]]:
    """Reject outlier readings using IQR method.

    Returns filtered readings list.
    """
    if len(values) < 5:
        return readings  # Not enough data for meaningful IQR

    sorted_vals = sorted(values)
    n = len(sorted_vals)
    q1 = sorted_vals[n // 4]
    q3 = sorted_vals[3 * n // 4]
    iqr = q3 - q1

    if iqr == 0:
        return readings  # All values are similar

    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    return [r for r in readings if lower <= r["v"] <= upper]


def _classify_confidence(
    r_squared: float, timespan_hours: float
) -> Confidence:
    """Classify prediction confidence."""
    timespan_days = timespan_hours / 24.0

    if r_squared > 0.8 and timespan_days >= 7:
        return Confidence.HIGH
    if r_squared > 0.5 or timespan_days >= 3:
        return Confidence.MEDIUM
    return Confidence.LOW


def compute_reliability(
    data_points: int,
    timespan_hours: float,
    r_squared: float | None,
    confidence: Confidence,
) -> int:
    """Compute a 0-100 reliability score for a prediction.

    Scoring:
    - Data span: 0-40 points (0 for <1 day, 40 for >=30 days, linear)
    - Data density: 0-30 points (readings/day: 0 for <1/day, 30 for >=4/day)
    - R-squared: 0-30 points (linear from 0 to 1)
    """
    timespan_days = timespan_hours / 24.0

    # Data span score (0-40)
    if timespan_days < 1:
        span_score = 0.0
    elif timespan_days >= 30:
        span_score = 40.0
    else:
        span_score = (timespan_days / 30.0) * 40.0

    # Data density score (0-30)
    if timespan_days > 0:
        readings_per_day = data_points / timespan_days
    else:
        readings_per_day = 0.0
    if readings_per_day < 1:
        density_score = 0.0
    elif readings_per_day >= 4:
        density_score = 30.0
    else:
        density_score = ((readings_per_day - 1) / 3.0) * 30.0

    # R-squared score (0-30)
    r2 = r_squared if r_squared is not None else 0.0
    r2_score = max(0.0, min(1.0, r2)) * 30.0

    return round(span_score + density_score + r2_score)
