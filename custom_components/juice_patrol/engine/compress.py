"""Swinging Door Trending compression for battery readings.

Replaces _compress_plateaus() and _subsample_readings() from predictions.py.
SDT compresses any data within an epsilon corridor (including noisy plateaus)
while preserving slope transition points — critical for curve fitting.

No external dependencies (pure Python).
"""

from __future__ import annotations


def dedup_consecutive(
    readings: list[dict[str, float]],
) -> list[dict[str, float]]:
    """Remove consecutive readings with identical v values.

    HA recorder stores every state_changed event, even when the value
    hasn't changed (periodic Zigbee reports). This strips those duplicates,
    keeping only the first and last of each constant run.

    Args:
        readings: [{"t": unix_ts, "v": pct}], sorted by time.

    Returns:
        Deduplicated readings in the same format. Always keeps first and
        last reading of each constant-value run.
    """
    if len(readings) <= 2:
        return list(readings)

    result: list[dict[str, float]] = [readings[0]]
    for i in range(1, len(readings) - 1):
        if readings[i]["v"] != readings[i - 1]["v"] or readings[i]["v"] != readings[i + 1]["v"]:
            result.append(readings[i])
    result.append(readings[-1])
    return result


def sdt_compress(
    readings: list[dict[str, float]],
    epsilon: float = 2.0,
) -> list[dict[str, float]]:
    """Swinging Door Trending compression.

    Maintains an upper and lower "door" (slope bound) from the last stored
    point. As long as a new reading can be reached by a line that stays
    within epsilon of all intermediate readings, it is absorbed. When a
    reading falls outside the corridor, the previous reading is stored as
    a pivot and the doors reset.

    Args:
        readings: [{"t": unix_ts, "v": pct}], sorted by time.
                  None/unavailable values must already be filtered out.
        epsilon: Tolerance in percentage points. 2.0 is appropriate for
                 integer battery % data — collapses flat plateaus to 2 points
                 while preserving slope transitions.

    Returns:
        Compressed readings in the same {"t", "v"} format.
        Always includes the first and last reading.
    """
    if len(readings) <= 2:
        return list(readings)

    result: list[dict[str, float]] = [readings[0]]

    # The "pivot" is the last stored point
    pivot = readings[0]
    # Track the swinging door slopes
    upper_slope = float("inf")
    lower_slope = float("-inf")
    # The previous reading (candidate to be stored when door breaks)
    prev = readings[0]

    for i in range(1, len(readings)):
        curr = readings[i]
        dt = curr["t"] - pivot["t"]

        if dt <= 0:
            # Duplicate or out-of-order timestamp — skip
            continue

        # Slopes from pivot to current point ± epsilon
        slope_to_upper = (curr["v"] + epsilon - pivot["v"]) / dt
        slope_to_lower = (curr["v"] - epsilon - pivot["v"]) / dt

        # Narrow the corridor
        new_upper = min(upper_slope, slope_to_upper)
        new_lower = max(lower_slope, slope_to_lower)

        if new_upper < new_lower:
            # Door broken — store the previous point as a new pivot
            if prev["t"] != pivot["t"]:
                result.append(prev)
            pivot = prev
            # Reset doors from new pivot to current point
            dt = curr["t"] - pivot["t"]
            if dt > 0:
                upper_slope = (curr["v"] + epsilon - pivot["v"]) / dt
                lower_slope = (curr["v"] - epsilon - pivot["v"]) / dt
            else:
                upper_slope = float("inf")
                lower_slope = float("-inf")
        else:
            upper_slope = new_upper
            lower_slope = new_lower

        prev = curr

    # Always include the last reading
    if result[-1]["t"] != readings[-1]["t"]:
        result.append(readings[-1])

    return result


def compress(
    readings: list[dict[str, float]],
    epsilon: float = 2.0,
    min_points: int = 12,
) -> list[dict[str, float]]:
    """Full compression pipeline: dedup then SDT with adaptive epsilon.

    If SDT with the initial epsilon compresses below min_points, retries
    with progressively smaller epsilon until min_points is reached or
    epsilon drops below 0.1. This prevents smooth continuous declines
    (e.g. Inkbird temperature sensors draining ~5%/day) from being
    over-compressed to just 2-4 points.

    Args:
        readings: [{"t": unix_ts, "v": pct}], sorted by time.
        epsilon: Starting SDT tolerance in percentage points.
        min_points: Minimum output points. SDT will use a smaller epsilon
            if needed to preserve at least this many points.

    Returns:
        Compressed readings in the same format.
    """
    if len(readings) <= 2:
        return list(readings)

    deduped = dedup_consecutive(readings)

    if len(deduped) <= min_points:
        return deduped

    result = sdt_compress(deduped, epsilon=epsilon)
    # Adaptive: if over-compressed, retry with smaller epsilon
    while len(result) < min_points and epsilon > 0.1:
        epsilon *= 0.5
        result = sdt_compress(deduped, epsilon=epsilon)

    return result
