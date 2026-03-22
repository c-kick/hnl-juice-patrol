"""Battery behavior analysis for Juice Patrol.

Handles reading stability, abnormal discharge detection, and rechargeable detection.
"""

from __future__ import annotations

import math
import re
import time
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

from .sessions import CompletedCycle
from .utils import detect_step_size as _detect_step_size
from .utils import median as _median


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

# --- Chemistry mapping ---
# Maps lowercase substrings from battery_type strings to chemistry enums.
# Includes rechargeable chemistries and primary cell form factors
# (alkaline, lithium_primary, coin_cell) for chemistry-aware reporting.
# Order matters: longer/more-specific substrings must precede shorter ones
# (e.g. "lithium aaa" before "aaa") so the first match wins.
_CHEMISTRY_MAP: dict[str, str] = {
    "lifepo4": "LFP",
    "lfp": "LFP",
    # "li-ion aa" / "li-ion aaa" must precede "li-ion" so explicit
    # lithium-primary AA/AAA overrides are matched first.
    "li-ion aa": "lithium_primary",
    "li-ion aaa": "lithium_primary",
    "li-ion": "NMC",
    "lithium-ion": "NMC",
    "lithium ion": "NMC",
    "lipo": "NMC",
    "li-po": "NMC",
    "lithium polymer": "NMC",
    # "nimh aa"/"nimh aaa" before generic "nimh" so rechargeable AA/AAA
    # form factors are explicitly caught as NiMH.
    "nimh aa": "NiMH",
    "nimh aaa": "NiMH",
    "nimh": "NiMH",
    "ni-mh": "NiMH",
    "nickel metal hydride": "NiMH",
    "lco": "LCO",
    "lithium cobalt": "LCO",
    # Primary chemistries — form-factor substrings.
    # coin_cell is a behavioural subtype of lithium_primary — both have
    # extremely flat discharge curves with an abrupt cliff.  The next
    # branch will consolidate these into lithium_primary with
    # coin_cell-specific priors for plateau detection and cliff thresholds.
    "cr2032": "coin_cell",
    "cr2025": "coin_cell",
    "cr2016": "coin_cell",
    "cr2430": "coin_cell",
    "cr2450": "coin_cell",
    "cr1632": "coin_cell",
    "cr1220": "coin_cell",
    "lithium aaa": "lithium_primary",
    "lithium aa": "lithium_primary",
    "l91": "lithium_primary",
    "fr6": "lithium_primary",
    "fr03": "lithium_primary",
    "cr123": "lithium_primary",
    "cr17345": "lithium_primary",
    # Generic CR prefix catch-all removed — handled by _cr_prefix_match()
    # below to avoid false positives on words containing "cr" (e.g. "micro").
    "c battery": "alkaline",
    "d battery": "alkaline",
    "9v": "alkaline",
    "pp3": "alkaline",
    "aaa": "alkaline",
    "aa": "alkaline",
}

# Miner's rule constants per chemistry (from CLAUDE.md domain knowledge).
# N_fail(DoD) = a × (DoD / 100)^(-b)
_MINER_PARAMS: dict[str, tuple[float, float]] = {
    #            a       b
    "LFP":    (2000.0, 1.0),
    "NMC":    (1000.0, 1.2),
    "NiMH":   (500.0,  1.5),
    "LCO":    (500.0,  1.4),
    "unknown": (1000.0, 1.2),  # default to NMC (most common rechargeable)
}


def chemistry_from_battery_type(battery_type: str | None) -> str:
    """Map a battery_type product string to a chemistry for degradation models.

    Returns one of "LFP", "NMC", "NiMH", "LCO", "alkaline",
    "lithium_primary", "coin_cell", or "unknown".
    """
    if not battery_type:
        return "unknown"
    normalised = battery_type.lower().strip()
    # Strip quantity prefix like "2× "
    if "\u00d7" in normalised:
        normalised = normalised.split("\u00d7", 1)[1].strip()
    for key, chem in _CHEMISTRY_MAP.items():
        if key in normalised:
            return chem
    # CR prefix catch-all: matches "cr2", "cr-v3", "cr 1/3n" etc. but not
    # words that merely contain "cr" (e.g. "micro", "secret").
    # Requires "cr" at start of string or after a space/separator.
    if re.search(r"(?:^|[\s\-×])cr[\d\-/\s]", normalised):
        return "lithium_primary"
    return "unknown"


def _filter_outlier_cycles(
    cycles: list[CompletedCycle],
    iqr_multiplier: float = 2.5,
) -> list[CompletedCycle]:
    """Remove cycles whose DoD-normalised duration is an outlier.

    Uses Tukey fences (median ± iqr_multiplier × IQR) with a generous
    multiplier to catch only extreme outliers — e.g. a reporting gap that
    makes one cycle look 10× longer, or a false replacement that produces
    a near-zero duration.

    Returns the original list unchanged when:
    - Fewer than 4 valid cycles (insufficient data to judge)
    - Filtering would leave fewer than 3 cycles (noisy data > no data)
    """
    # Build (index, normalised_duration) pairs for valid cycles
    pairs: list[tuple[int, float]] = []
    for i, c in enumerate(cycles):
        nd = _dod_normalised_duration(c)
        if nd is not None:
            pairs.append((i, nd))

    if len(pairs) < 4:
        return cycles

    values = sorted(v for _, v in pairs)
    n = len(values)
    q1 = values[n // 4]
    q3 = values[(3 * n) // 4]
    iqr = q3 - q1

    # With zero IQR (all identical durations), no outlier filtering is needed
    if iqr <= 0:
        return cycles

    lower = q1 - iqr_multiplier * iqr
    upper = q3 + iqr_multiplier * iqr

    # Indices of cycles that pass the filter (or were skipped as invalid)
    valid_indices = {i for i, _ in pairs}
    keep_indices: set[int] = set()
    for i, nd in pairs:
        if lower <= nd <= upper:
            keep_indices.add(i)
    # Also keep cycles that weren't evaluated (shallow DoD etc.)
    for i in range(len(cycles)):
        if i not in valid_indices:
            keep_indices.add(i)

    if len(keep_indices) < 3:
        return cycles

    return [c for i, c in enumerate(cycles) if i in keep_indices]


# damage_score is DoD-based, not duration-based — outlier durations don't
# affect it, so _filter_outlier_cycles is NOT applied here.  Its robustness
# comes from the DoD math and the 5% shallow-cycle gate.
def damage_score(
    cycles: list[CompletedCycle],
    chemistry: str,
) -> float | None:
    """Compute cumulative Miner's rule damage from completed cycles.

    D = Σ 1/N_fail(DoD_i) where N_fail(DoD) = a × (DoD/100)^(-b).
    Skips cycles with DoD < 5% (noise / partial reads).

    Args:
        cycles: Completed discharge cycles with start_pct and end_pct.
        chemistry: One of "LFP", "NMC", "NiMH", "LCO", "unknown".

    Returns:
        Cumulative damage D (0.0 = pristine, 1.0 = end of life),
        or None if no valid cycles.
    """
    a, b = _MINER_PARAMS.get(chemistry, _MINER_PARAMS["unknown"])

    d = 0.0
    valid = 0
    for c in cycles:
        dod = c.start_pct - c.end_pct
        if dod < 5:
            continue
        dod_frac = dod / 100.0
        n_fail = a * dod_frac ** (-b)
        d += 1.0 / n_fail
        valid += 1

    if valid < 1:
        return None
    return round(d, 6)


def _dod_normalised_duration(
    c: CompletedCycle,
    min_duration_days: float = 1.0,
) -> float | None:
    """Duration per unit DoD — comparable across different discharge depths.

    Returns duration_days / (DoD / 100), or None if:
    - DoD is too shallow to be meaningful (≤ 5%)
    - Duration is below min_duration_days (default 1.0 day).  Any IoT sensor
      (door, motion, temperature) lasts weeks to months per charge; a cycle
      shorter than 24 hours is almost certainly a false replacement trigger
      from a network rejoin or device reboot, not a real discharge.
    """
    if c.duration_days < min_duration_days:
        return None
    dod = c.start_pct - c.end_pct
    if dod <= 5:
        return None
    return c.duration_days / (dod / 100.0)


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
    if mean <= 1.0:
        # Battery is dead or near-dead — not meaningful to analyze variance
        return Stability.STABLE, 0.0, round(mean, 1)

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
            # For rechargeable devices, a cliff drop that recovers
            # (level returns to within 15% of the pre-drop level in a
            # later segment) is a normal discharge→recharge cycle, not
            # erratic behavior.  Only count unrecovered cliff drops.
            if is_rechargeable and shift < 0:
                pre_drop_level = prev_seg["mean"]
                recovered = any(
                    segments[j]["mean"] >= pre_drop_level - 15
                    for j in range(i + 1, len(segments))
                    if segments[j]["count"] >= 2
                )
                if not recovered:
                    cliff_shifts += 1
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
    # The user's manual label is the single source of truth.
    # No auto-detection from battery_state or other heuristics.
    if is_rechargeable_override is not None:
        return is_rechargeable_override, "manual" if is_rechargeable_override else None

    return False, None


# Chemistry-specific knee thresholds: d² value at which risk = 1.0.
# More negative = stronger acceleration of fade.
# NMC knees at 80–90% cap remaining; LFP rarely knees before 2000 cycles.
_KNEE_THRESHOLDS: dict[str, float] = {
    "NMC":     -0.03,
    "LCO":     -0.03,
    "NiMH":    -0.03,
    "LFP":     -0.01,
    "unknown": -0.01,  # conservative (LFP-like)
}


def knee_risk_score(
    cycles: list[CompletedCycle],
    chemistry: str,
) -> float | None:
    """Detect approaching knee-point from cross-cycle duration acceleration.

    Computes d²(duration)/dN² over the most recent cycles.  A strongly
    negative second derivative means fade is accelerating — the hallmark
    of an approaching knee collapse.

    Outlier cycles are filtered first, and a chemistry-aware noise floor
    (30% of the knee threshold) suppresses false positives from devices
    with slightly irregular cycle lengths — e.g. a reporting gap that
    makes one cycle look 20% longer produces a Δ² spike that would
    otherwise flicker the score between 0.01 and 0.0.

    Returns a 0.0–1.0 risk score (1.0 = at or past knee), or None if
    fewer than 5 cycles with usable DoD (> 5%) are available.
    """
    cycles = _filter_outlier_cycles(cycles)

    # Build DoD-normalised duration series (comparable across different depths)
    durations = [_dod_normalised_duration(c) for c in cycles]
    valid = [d for d in durations if d is not None]

    if len(valid) < 5:
        return None

    # First differences: Δ[i] = duration[i+1] − duration[i]
    deltas = [valid[i + 1] - valid[i] for i in range(len(valid) - 1)]
    # Second differences: Δ²[i] = Δ[i+1] − Δ[i]
    d2 = [deltas[i + 1] - deltas[i] for i in range(len(deltas) - 1)]

    if len(d2) < 3:
        return None

    # Instantaneous acceleration = mean of last 3 second differences
    accel = sum(d2[-3:]) / 3.0

    # Map to 0–1 using chemistry-specific threshold
    threshold = _KNEE_THRESHOLDS.get(chemistry, _KNEE_THRESHOLDS["unknown"])

    # Noise floor: 30% of the chemistry threshold.  Any |accel| below this
    # is indistinguishable from sensor jitter and returns 0.0.
    noise_floor = abs(threshold) * 0.3
    if abs(accel) < noise_floor:
        return 0.0

    # threshold is negative; accel ≥ 0 → score 0, accel ≤ threshold → score 1
    if accel >= 0:
        return 0.0
    score = accel / threshold  # both negative → positive ratio
    return round(max(0.0, min(1.0, score)), 4)


def soh_from_cycles(cycles: list[CompletedCycle]) -> float | None:
    """Estimate State of Health from completed discharge cycles.

    Uses duration as a proxy for capacity (Q). Normalises durations by
    depth-of-discharge so cycles with different depths are comparable.
    Reference capacity Q₀ is the median of the first 3 valid cycles.

    Outlier cycles (spurious durations from reporting gaps or false
    replacements) are filtered before computation.

    Returns SoH as a float 0–100, or None if fewer than 3 usable cycles.
    """
    if len(cycles) < 3:
        return None

    cycles = _filter_outlier_cycles(cycles)
    normed = [_dod_normalised_duration(c) for c in cycles]
    valid = [(i, d) for i, d in enumerate(normed) if d is not None]

    if len(valid) < 3:
        return None

    # Q₀ = median of first 3 valid normalised durations
    first_three = sorted(d for _, d in valid[:3])
    q0 = first_three[1]  # median of 3 = middle value
    if q0 <= 0:
        return None

    # Current capacity proxy = last valid normalised duration
    _, q_current = valid[-1]

    soh = (q_current / q0) * 100.0
    return round(max(0.0, min(100.0, soh)), 1)


def duration_fade(
    cycles: list[CompletedCycle],
    index: int,
    ref_count: int = 3,
) -> float | None:
    """Compute DoD-normalised duration fade ratio for cycle at index.

    Returns cycle[index] normalised duration / median(first ref_count),
    or None if not enough valid reference cycles.

    A value of 1.0 means no fade; 0.8 means 20% capacity loss.
    """
    if len(cycles) < ref_count or index < 0 or index >= len(cycles):
        return None

    ref_normed = [_dod_normalised_duration(c) for c in cycles[:ref_count]]
    ref_valid = [d for d in ref_normed if d is not None]
    if len(ref_valid) < ref_count:
        return None

    q0 = _median(ref_valid)
    if q0 <= 0:
        return None

    q_n = _dod_normalised_duration(cycles[index])
    if q_n is None:
        return None

    return round(q_n / q0, 4)
