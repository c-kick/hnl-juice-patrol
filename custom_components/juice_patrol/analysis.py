"""Battery behavior analysis for Juice Patrol.

Handles reading stability, abnormal discharge detection, and rechargeable detection.
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass
from enum import StrEnum
from typing import Any


class Stability(StrEnum):
    """Reading stability classification."""

    STABLE = "stable"
    MODERATE = "moderate"
    ERRATIC = "erratic"
    INSUFFICIENT_DATA = "insufficient_data"


class DischargeAnomaly(StrEnum):
    """Discharge anomaly classification."""

    NORMAL = "normal"
    RAPID = "rapid"
    CLIFF = "cliff"  # Massive sudden drop (e.g. 86% → 7%)


# Battery types known to be rechargeable
RECHARGEABLE_TYPES = frozenset({
    "li-ion", "lipo", "li-po", "lithium-ion", "lithium-polymer",
    "nimh", "ni-mh", "nicd", "ni-cd",
    "built-in", "internal", "rechargeable",
})


@dataclass
class AnalysisResult:
    """Result of battery behavior analysis for a single device."""

    stability: Stability
    stability_cv: float | None  # Coefficient of variation (0-1)
    mean_level: float | None  # Mean of recent readings
    discharge_anomaly: DischargeAnomaly
    drop_size: float | None  # Size of anomalous drop, if any
    is_rechargeable: bool
    rechargeable_reason: str | None  # Why we think it's rechargeable
    replacement_detected: bool  # Jump detected since last confirmation
    replacement_old_level: float | None
    replacement_new_level: float | None


def analyze_battery(
    readings: list[dict[str, float]],
    *,
    battery_type: str | None = None,
    battery_state: str | None = None,
    is_rechargeable_override: bool | None = None,
    last_replaced: float | None = None,
    low_threshold: float = 20.0,
    window_hours: float = 168.0,  # 7 days
) -> AnalysisResult:
    """Analyze battery behavior from readings and metadata.

    Args:
        readings: List of {"t": timestamp, "v": level} dicts, sorted by time.
        battery_type: User-set or auto-detected battery type string.
        battery_state: Current battery_state attribute value (charging/discharging/etc).
        is_rechargeable_override: User manual override for rechargeable flag.
        last_replaced: Timestamp of last replacement (from store).
        low_threshold: Configured low battery threshold.
        window_hours: Analysis window for stability/anomaly detection.
    """
    now = time.time()
    cutoff = now - (window_hours * 3600)
    recent = [r for r in readings if r["t"] >= cutoff]

    # --- Rechargeable detection (run first, informs stability) ---
    is_rechargeable, rechargeable_reason = _detect_rechargeable(
        readings, battery_type, battery_state, is_rechargeable_override
    )

    # --- Stability ---
    stability, cv, mean_level = _analyze_stability(recent)

    # --- Discharge anomaly ---
    anomaly, drop_size = _detect_anomaly(recent)

    # --- Upward-trend anomaly on non-rechargeable devices ---
    # Even with few readings, a non-rechargeable device consistently
    # going UP is abnormal and should be flagged.
    if not is_rechargeable and len(recent) >= 3:
        increases = sum(
            1 for i in range(1, len(recent))
            if recent[i]["v"] > recent[i - 1]["v"]
        )
        if increases >= len(recent) - 1:
            # Almost all readings are increasing
            total_rise = recent[-1]["v"] - recent[0]["v"]
            if total_rise > 3:
                stability = Stability.ERRATIC
                if cv is None:
                    cv = 0.0
                if mean_level is None:
                    vals = [r["v"] for r in recent]
                    mean_level = round(sum(vals) / len(vals), 1)

    # --- Replacement detection ---
    replacement_detected = False
    replacement_old = None
    replacement_new = None
    if len(readings) >= 2:
        # Look for recent large upward jump (not gradual charging)
        prev = readings[-2]
        curr = readings[-1]
        jump = curr["v"] - prev["v"]
        time_gap_hours = (curr["t"] - prev["t"]) / 3600

        if (
            jump >= 40  # Large jump up
            and prev["v"] <= low_threshold * 2  # Was reasonably low
            and curr["v"] >= 80  # Now high
            and time_gap_hours < 48  # Within reasonable time
            and not is_rechargeable  # Not a rechargeable device
        ):
            # Only flag if this jump is more recent than last_replaced
            if last_replaced is None or curr["t"] > last_replaced:
                replacement_detected = True
                replacement_old = prev["v"]
                replacement_new = curr["v"]

    return AnalysisResult(
        stability=stability,
        stability_cv=cv,
        mean_level=mean_level,
        discharge_anomaly=anomaly,
        drop_size=drop_size,
        is_rechargeable=is_rechargeable,
        rechargeable_reason=rechargeable_reason,
        replacement_detected=replacement_detected,
        replacement_old_level=replacement_old,
        replacement_new_level=replacement_new,
    )


def _analyze_stability(
    recent: list[dict[str, float]],
) -> tuple[Stability, float | None, float | None]:
    """Analyze reading stability by detecting sustained level shifts.

    Erratic means the battery shows behavior that doesn't follow a normal
    discharge curve: sustained unexpected drops, unexplained rises (on
    non-rechargeable devices), or non-monotonic level changes that persist
    across multiple readings.

    Simple measurement noise (±1-2% between readings) is NOT erratic.

    Returns (stability, cv, mean).
    """
    if len(recent) < 5:
        return Stability.INSUFFICIENT_DATA, None, None

    values = [r["v"] for r in recent]
    mean = sum(values) / len(values)
    if mean == 0:
        return Stability.STABLE, 0.0, 0.0

    variance = sum((v - mean) ** 2 for v in values) / len(values)
    stddev = math.sqrt(variance)
    cv = stddev / mean

    # If the total range of readings is small (≤ 10%), this is just
    # normal measurement noise — not erratic behavior.
    value_range = max(values) - min(values)
    if value_range <= 10:
        return Stability.STABLE, round(cv, 4), round(mean, 1)

    # Detect the reporting granularity (step size) of this sensor.
    step_size = _detect_step_size(values)

    # Segment tolerance accounts for reporting granularity:
    # at least the step size, minimum 3%
    tolerance = max(step_size + 1.0, 3.0)

    # Minimum shift size to be considered significant
    min_shift = max(step_size * 2, 10.0)

    # Detect sustained level shifts by looking at segments.
    segments = _find_segments(values, tolerance=tolerance)

    # Threshold for shifts so large that even a single-reading segment
    # is clearly not noise (e.g. 86% → 3%).
    cliff_threshold = 30.0

    reversals = 0
    large_non_monotonic_shifts = 0
    cliff_shifts = 0

    for i in range(1, len(segments)):
        prev_seg = segments[i - 1]
        curr_seg = segments[i]
        shift = curr_seg["mean"] - prev_seg["mean"]
        abs_shift = abs(shift)

        # For very large shifts (>30%), even single-reading segments are
        # clearly significant — a device going 86%→3% is not noise.
        # For smaller shifts, require ≥2 readings per segment.
        if abs_shift < cliff_threshold:
            if prev_seg["count"] < 2 or curr_seg["count"] < 2:
                continue
        else:
            cliff_shifts += 1

        # Upward shift is suspicious (not normal discharge)
        if shift > min_shift:
            large_non_monotonic_shifts += 1

        # A reversal: direction changes with significant magnitude
        if i >= 2:
            prev_shift = segments[i - 1]["mean"] - segments[i - 2]["mean"]
            if shift * prev_shift < 0 and abs(shift) > min_shift:
                reversals += 1

    # Classify: cliff shifts in both directions (drop + recovery) is erratic
    if reversals >= 2 or large_non_monotonic_shifts >= 3 or cliff_shifts >= 2:
        stability = Stability.ERRATIC
    elif reversals >= 1 or large_non_monotonic_shifts >= 2 or cliff_shifts >= 1:
        stability = Stability.MODERATE
    else:
        stability = Stability.STABLE

    return stability, round(cv, 4), round(mean, 1)


def _detect_step_size(values: list[float]) -> float:
    """Detect the reporting granularity of a sensor.

    Returns the most common non-zero step between consecutive readings.
    E.g. a sensor reporting [100, 95, 90, 85] has step size 5.
    """
    if len(values) < 3:
        return 1.0

    diffs = [abs(values[i] - values[i - 1]) for i in range(1, len(values))]
    nonzero = [d for d in diffs if d > 0]
    if not nonzero:
        return 1.0

    # Find the most common non-zero diff (likely the step size)
    from collections import Counter
    counts = Counter(round(d, 1) for d in nonzero)
    most_common = counts.most_common(1)[0][0]
    return most_common


def _find_segments(
    values: list[float], tolerance: float = 3.0
) -> list[dict[str, Any]]:
    """Split a value series into segments of similar readings.

    A new segment starts when a reading differs from the current segment's
    mean by more than `tolerance`.
    """
    if not values:
        return []

    segments: list[dict[str, Any]] = []
    seg_start = 0
    seg_sum = values[0]
    seg_count = 1

    for i in range(1, len(values)):
        seg_mean = seg_sum / seg_count
        if abs(values[i] - seg_mean) > tolerance:
            segments.append({
                "mean": round(seg_mean, 1),
                "count": seg_count,
                "start": seg_start,
                "end": i - 1,
            })
            seg_start = i
            seg_sum = values[i]
            seg_count = 1
        else:
            seg_sum += values[i]
            seg_count += 1

    # Final segment
    segments.append({
        "mean": round(seg_sum / seg_count, 1),
        "count": seg_count,
        "start": seg_start,
        "end": len(values) - 1,
    })

    return segments


def _detect_anomaly(
    recent: list[dict[str, float]],
) -> tuple[DischargeAnomaly, float | None]:
    """Detect abnormal discharge patterns.

    Returns (anomaly_type, drop_size).
    """
    if len(recent) < 3:
        return DischargeAnomaly.NORMAL, None

    # Check the most recent reading pair for a sudden drop
    prev = recent[-2]
    curr = recent[-1]
    drop = prev["v"] - curr["v"]
    time_hours = (curr["t"] - prev["t"]) / 3600

    if time_hours <= 0:
        return DischargeAnomaly.NORMAL, None

    # Cliff: drop > 30% in one reading interval
    if drop > 30:
        return DischargeAnomaly.CLIFF, round(drop, 1)

    # Rapid: discharge rate > 10x the average
    # Calculate average drop rate from all recent readings
    if len(recent) >= 4:
        total_drop = recent[0]["v"] - recent[-1]["v"]
        total_hours = (recent[-1]["t"] - recent[0]["t"]) / 3600
        if total_hours > 0 and total_drop > 0:
            avg_rate = total_drop / total_hours  # %/hour average
            current_rate = drop / time_hours
            if current_rate > avg_rate * 10 and drop > 5:
                return DischargeAnomaly.RAPID, round(drop, 1)

    return DischargeAnomaly.NORMAL, None


def _detect_rechargeable(
    readings: list[dict[str, float]],
    battery_type: str | None,
    battery_state: str | None,
    is_rechargeable_override: bool | None,
) -> tuple[bool, str | None]:
    """Detect if a device has a rechargeable battery.

    Returns (is_rechargeable, reason).
    """
    # Manual override takes priority
    if is_rechargeable_override is not None:
        return is_rechargeable_override, "manual" if is_rechargeable_override else None

    # Battery type indicates rechargeable
    if battery_type and battery_type.lower().strip() in RECHARGEABLE_TYPES:
        return True, f"battery type: {battery_type}"

    # battery_state attribute indicates a rechargeable device
    # Values vary by integration: "Charging", "Not Charging", "Full",
    # "not_charging", "discharging", etc.
    if battery_state:
        normalized = battery_state.lower().replace(" ", "_")
        if normalized in (
            "charging", "not_charging", "full", "discharging",
        ):
            return True, f"battery_state: {battery_state}"

    # Behavioral: detect gradual level increases (not a jump/replacement)
    if len(readings) >= 10:
        # Look for multiple gradual increases over the last 20 readings
        window = readings[-20:]
        gradual_increases = 0
        for i in range(1, len(window)):
            diff = window[i]["v"] - window[i - 1]["v"]
            time_hours = (window[i]["t"] - window[i - 1]["t"]) / 3600
            # Gradual increase: 0.5-15% over at least 30 min
            if 0.5 <= diff <= 15 and time_hours >= 0.5:
                gradual_increases += 1

        if gradual_increases >= 3:
            return True, "gradual charging detected"

    return False, None
