"""Smoothing algorithms for noisy battery readings.

Pure Python — no HA imports, no numpy/scipy.
"""

from __future__ import annotations

import bisect
import math


def rolling_median(
    readings: list[dict[str, float]],
    window_hours: float = 48.0,
) -> list[dict[str, float]]:
    """Apply a time-based rolling median to battery readings.

    For each reading, the median is computed over all readings within
    ±window_hours/2 of that reading's timestamp.  This smooths out
    Zigbee/Z-Wave bounce noise (e.g. 20→30→20→30) while preserving
    the genuine long-term discharge trend.

    Args:
        readings: sorted list of {"t": unix_ts, "v": pct}.
        window_hours: total window width in hours.

    Returns:
        New list of {"t", "v"} with the same timestamps but smoothed values.
    """
    if len(readings) < 3:
        return list(readings)

    half_window = window_hours * 3600.0 / 2.0
    timestamps = [r["t"] for r in readings]
    values = [r["v"] for r in readings]
    n = len(readings)
    result: list[dict[str, float]] = []

    for i in range(n):
        t = timestamps[i]
        # Binary search for window boundaries
        lo = bisect.bisect_left(timestamps, t - half_window)
        hi = bisect.bisect_right(timestamps, t + half_window)
        window_vals = sorted(values[lo:hi])
        wn = len(window_vals)
        if wn % 2 == 1:
            median = window_vals[wn // 2]
        else:
            median = (window_vals[wn // 2 - 1] + window_vals[wn // 2]) / 2.0
        result.append({"t": t, "v": round(median, 2)})

    return result


def gaussian_smooth(
    readings: list[dict[str, float]],
    n_output: int = 150,
    bandwidth_frac: float = 0.03,
    min_bandwidth_days: float = 3.0,
) -> list[dict[str, float]]:
    """Gaussian kernel smoother for battery readings.

    Produces *n_output* evenly-spaced points using Gaussian-weighted local
    averaging.  Unlike rolling median, the output has no step transitions —
    the Gaussian kernel inherently interpolates through discontinuities.

    Args:
        readings: sorted list of {"t": unix_ts, "v": pct}.
        n_output: number of evenly-spaced output points.
        bandwidth_frac: sigma as a fraction of total duration.
        min_bandwidth_days: minimum sigma in days (prevents under-smoothing
            on short cycles).

    Returns:
        List of {"t", "v"} with *n_output* evenly-spaced, smoothed points.
    """
    if len(readings) < 3:
        return list(readings)

    timestamps = [r["t"] for r in readings]
    values = [r["v"] for r in readings]

    t_start = timestamps[0]
    t_end = timestamps[-1]
    duration = t_end - t_start
    if duration <= 0:
        return list(readings)

    sigma = max(duration * bandwidth_frac, min_bandwidth_days * 86400.0)
    cutoff = 3.0 * sigma  # truncate at 3σ for performance
    inv_2sigma2 = 1.0 / (2.0 * sigma * sigma)

    step = duration / max(n_output - 1, 1)
    result: list[dict[str, float]] = []

    for i in range(n_output):
        t = t_start + i * step

        # Binary search for points within ±3σ
        lo = bisect.bisect_left(timestamps, t - cutoff)
        hi = bisect.bisect_right(timestamps, t + cutoff)

        if lo >= hi:
            # No points in window — find nearest
            idx = min(bisect.bisect_left(timestamps, t), len(timestamps) - 1)
            result.append({"t": t, "v": round(values[idx], 2)})
            continue

        total_w = 0.0
        total_wv = 0.0
        for j in range(lo, hi):
            dt = timestamps[j] - t
            w = math.exp(-(dt * dt) * inv_2sigma2)
            total_w += w
            total_wv += w * values[j]

        v = total_wv / total_w if total_w > 0 else values[lo]
        result.append({"t": t, "v": round(v, 2)})

    return result


def cycle_relative_smooth(
    readings: list[dict[str, float]],
    window_frac: float = 0.05,
    min_window_points: int = 3,
    cycle_duration: float | None = None,
) -> list[dict[str, float]]:
    """Apply a cycle-relative rolling median to battery readings.

    Window size scales with cycle duration: window_frac × (last_t − first_t).
    This gives a 15-day window for a 300-day cycle, 1.5 days for a 30-day
    cycle, and 55 days for a 3-year cycle — always proportional.

    When the time-based window contains fewer than *min_window_points*
    neighbours, the window is widened to include at least that many points
    (symmetrically around the centre point).

    Args:
        readings: sorted list of {"t": unix_ts, "v": pct}.
        window_frac: window as a fraction of total cycle duration.
        min_window_points: minimum number of points in each window.
        cycle_duration: override for the auto-detected cycle span (seconds).
            Use when smoothing a tail fragment that is part of a longer cycle.

    Returns:
        New list of {"t", "v"} with the same timestamps but smoothed values.
    """
    if len(readings) < 3:
        return list(readings)

    timestamps = [r["t"] for r in readings]
    values = [r["v"] for r in readings]
    n = len(readings)

    if cycle_duration is None:
        cycle_duration = timestamps[-1] - timestamps[0]
    half_window = (window_frac * cycle_duration) / 2.0

    result: list[dict[str, float]] = []

    for i in range(n):
        t = timestamps[i]
        lo = bisect.bisect_left(timestamps, t - half_window)
        hi = bisect.bisect_right(timestamps, t + half_window)

        # Widen to meet min_window_points if needed
        while (hi - lo) < min_window_points and (lo > 0 or hi < n):
            if lo > 0:
                lo -= 1
            if (hi - lo) < min_window_points and hi < n:
                hi += 1

        window_vals = sorted(values[lo:hi])
        wn = len(window_vals)
        if wn % 2 == 1:
            median = window_vals[wn // 2]
        else:
            median = (window_vals[wn // 2 - 1] + window_vals[wn // 2]) / 2.0
        result.append({"t": t, "v": round(median, 2)})

    return result
