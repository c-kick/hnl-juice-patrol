"""Battery behavior analysis for Juice Patrol.

Handles reading stability, abnormal discharge detection, and rechargeable detection.
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

from .utils import detect_step_size as _detect_step_size


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


# Replacement detection — mirrors const.REPLACEMENT_LOW_MULTIPLIER (engine/ cannot import HA deps)
_REPLACEMENT_LOW_MULTIPLIER = 2


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
    stability, cv, mean_level = _analyze_stability(recent, is_rechargeable)

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
            and prev["v"] <= low_threshold * _REPLACEMENT_LOW_MULTIPLIER
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
    is_rechargeable: bool = False,
) -> tuple[Stability, float | None, float | None]:
    """Analyze reading stability by detecting sustained level shifts.

    Erratic means the battery shows behavior that doesn't follow a normal
    discharge curve: sustained unexpected drops, unexplained rises (on
    non-rechargeable devices), or non-monotonic level changes that persist
    across multiple readings.

    For rechargeable devices, reversals (charge/discharge cycles) are normal
    and do NOT count as erratic behavior.

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

    # Classify: for rechargeable devices, reversals and upward shifts are
    # normal charge/discharge cycles — only cliff shifts matter.
    if is_rechargeable:
        if cliff_shifts >= 2:
            stability = Stability.ERRATIC
        elif cliff_shifts >= 1:
            stability = Stability.MODERATE
        else:
            stability = Stability.STABLE
    elif reversals >= 2 or large_non_monotonic_shifts >= 3 or cliff_shifts >= 2:
        stability = Stability.ERRATIC
    elif reversals >= 1 or large_non_monotonic_shifts >= 2 or cliff_shifts >= 1:
        stability = Stability.MODERATE
    else:
        stability = Stability.STABLE

    return stability, round(cv, 4), round(mean, 1)


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

    Checks both single-interval and multi-interval drops.

    Returns (anomaly_type, drop_size).
    """
    if len(recent) < 3:
        return DischargeAnomaly.NORMAL, None

    # --- Multi-interval cliff detection ---
    # Check windows of 2 and 3 readings for cumulative drops
    for window_size in (2, 3):
        if len(recent) >= window_size + 1:
            start = recent[-(window_size + 1)]
            end = recent[-1]
            drop = start["v"] - end["v"]
            hours = (end["t"] - start["t"]) / 3600
            if drop > 40 and 0 < hours < 72:
                return DischargeAnomaly.CLIFF, round(drop, 1)

    # --- Single-interval checks ---
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
    if len(recent) >= 4:
        total_drop = recent[0]["v"] - recent[-1]["v"]
        total_hours = (recent[-1]["t"] - recent[0]["t"]) / 3600
        if total_hours > 0 and total_drop > 0:
            avg_rate = total_drop / total_hours
            current_rate = drop / time_hours
            if current_rate > avg_rate * 10 and drop > 5:
                return DischargeAnomaly.RAPID, round(drop, 1)

    return DischargeAnomaly.NORMAL, None


def detect_replacement_jumps(
    readings: list[dict[str, float]],
    low_threshold: float = 20.0,
    *,
    known_replacements: list[float] | None = None,
    denied_replacements: list[float] | None = None,
) -> list[dict[str, float]]:
    """Detect suspected battery replacement jumps in historical readings.

    Scans for sharp upward transitions where level was low and jumps to high,
    characteristic of a physical battery swap on non-rechargeable devices.

    Args:
        readings: List of {"t": timestamp, "v": level} dicts, sorted by time.
        low_threshold: Configured low battery threshold (%).
        known_replacements: Timestamps already in replacement_history (to exclude).
        denied_replacements: Timestamps the user has dismissed (to exclude).

    Returns:
        List of {"timestamp": float, "old_level": float, "new_level": float}
        for each suspected replacement, sorted chronologically.
    """
    if len(readings) < 2:
        return []

    known = set(known_replacements or [])
    denied = set(denied_replacements or [])
    # Tolerance for matching timestamps (±2 hours handles recorder aggregation)
    match_tolerance = 7200

    results: list[dict[str, float]] = []
    # Max time window for multi-step replacements (device calibrating to 100%)
    max_ramp_seconds = 6 * 3600  # 6 hours
    # Minimum jump to be considered suspicious (user can always dismiss)
    min_jump = 30
    # Minimum final level to be suspicious
    min_end_level = 70

    def _is_excluded(ts: float) -> bool:
        """Check if timestamp is already known or denied."""
        if any(abs(ts - k) < match_tolerance for k in known):
            return True
        return any(abs(ts - d) < match_tolerance for d in denied)

    # Track which readings are already part of a detected replacement
    # to avoid double-counting
    used: set[int] = set()

    for i in range(1, len(readings)):
        if i in used:
            continue

        prev = readings[i - 1]
        curr = readings[i]
        jump = curr["v"] - prev["v"]

        # Single-reading jump check
        if jump >= min_jump and curr["v"] >= min_end_level:
            if not _is_excluded(curr["t"]):
                results.append({
                    "timestamp": curr["t"],
                    "old_level": prev["v"],
                    "new_level": curr["v"],
                })
                used.add(i)
            continue

        # Multi-step ramp check: look ahead up to 3 readings within the
        # time window for a cumulative rise that looks like a replacement
        # (e.g., 54→70→100 over 2 hours = device calibrating after swap)
        if curr["v"] > prev["v"]:
            for j in range(i + 1, min(i + 4, len(readings))):
                end = readings[j]
                if end["t"] - prev["t"] > max_ramp_seconds:
                    break
                total_jump = end["v"] - prev["v"]
                if total_jump >= min_jump and end["v"] >= min_end_level:
                    if not _is_excluded(end["t"]):
                        results.append({
                            "timestamp": end["t"],
                            "old_level": prev["v"],
                            "new_level": end["v"],
                        })
                        # Mark intermediate readings as used
                        for k in range(i, j + 1):
                            used.add(k)
                    break

    return results


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

    # battery_state attribute indicates a rechargeable device — this is a
    # direct signal from the device itself, not a heuristic.
    # Values vary by integration: "Charging", "Not Charging", "Full",
    # "not_charging", "discharging", etc.
    if battery_state:
        normalized = battery_state.lower().replace(" ", "_")
        if normalized in (
            "charging", "not_charging", "full", "discharging",
        ):
            return True, f"battery_state: {battery_state}"

    return False, None
