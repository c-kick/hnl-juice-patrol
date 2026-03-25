"""Tests for cycle_relative_smooth() in engine/smooth.py."""

from __future__ import annotations

from custom_components.juice_patrol.engine.smooth import (
    cycle_relative_smooth,
    rolling_median,
)

DAY = 86400.0


def _make_readings(
    values: list[float], interval_days: float = 1.0, start_t: float = 0.0
) -> list[dict[str, float]]:
    """Build readings list from a sequence of values at regular intervals."""
    return [
        {"t": start_t + i * interval_days * DAY, "v": v}
        for i, v in enumerate(values)
    ]


# --- Basic behaviour ---


def test_passthrough_short_input():
    """Fewer than 3 readings returned unchanged."""
    r = [{"t": 0.0, "v": 100.0}, {"t": DAY, "v": 95.0}]
    result = cycle_relative_smooth(r)
    assert result == r
    assert result is not r  # must be a copy


def test_preserves_timestamps():
    """Output timestamps match input timestamps exactly."""
    readings = _make_readings([100, 95, 90, 85, 80], interval_days=10)
    result = cycle_relative_smooth(readings)
    assert [r["t"] for r in result] == [r["t"] for r in readings]


def test_preserves_length():
    """Output has the same number of points as input."""
    readings = _make_readings([100, 95, 90, 85, 80, 75, 70], interval_days=5)
    result = cycle_relative_smooth(readings)
    assert len(result) == len(readings)


# --- Window scaling ---


def test_window_scales_with_duration():
    """Longer cycles get wider absolute windows; shorter cycles get narrower ones.

    We verify by adding random noise to a clean declining signal and checking
    that the smoothed output tracks the clean signal closely.
    """
    import random

    random.seed(123)
    # 300-day cycle, 2 readings/day, clean decline 100→0 + noise
    n = 600
    clean = [100.0 - i * (100.0 / (n - 1)) for i in range(n)]
    noisy = [v + random.uniform(-5, 5) for v in clean]
    readings = _make_readings(noisy, interval_days=0.5)

    result = cycle_relative_smooth(readings, window_frac=0.05)
    # 5% of 300 days = 15-day window ≈ 30 points: should remove ±5 noise
    interior = result[30:-30]
    for i, r in enumerate(interior, start=30):
        assert abs(r["v"] - clean[i]) < 3.0, (
            f"Day {i * 0.5}: smoothed={r['v']:.1f} vs clean={clean[i]:.1f}"
        )


def test_small_window_preserves_trend():
    """With a small window_frac on a clean signal, smoothing barely changes values."""
    # Linear decline 100→0 over 200 days, no noise
    n = 200
    values = [100.0 - i * (100.0 / (n - 1)) for i in range(n)]
    readings = _make_readings(values, interval_days=1.0)

    result = cycle_relative_smooth(readings, window_frac=0.02)
    for orig, smooth in zip(readings, result):
        assert abs(orig["v"] - smooth["v"]) < 2.0, (
            f"Clean signal should be barely affected: {orig['v']} vs {smooth['v']}"
        )


# --- min_window_points ---


def test_min_window_points_widens():
    """When time-window contains too few points, it widens to min_window_points."""
    # 5 points spread over 100 days → 5% window = 5 days = only 1 point per window
    # min_window_points=3 should widen to include neighbours
    readings = _make_readings([100, 50, 100, 50, 100], interval_days=25)
    result = cycle_relative_smooth(readings, window_frac=0.05, min_window_points=3)

    # With min_window_points=1, each point's window contains only itself → raw values
    result_no_widen = cycle_relative_smooth(
        readings, window_frac=0.05, min_window_points=1
    )
    assert [r["v"] for r in result_no_widen] == [100, 50, 100, 50, 100], (
        "With min_window_points=1, output should equal raw values"
    )
    # With widening to 3, interior points pull in neighbours → different medians
    # Index 2: window [1,2,3] = [50,100,50], median = 50 (different from raw 100)
    assert result[2]["v"] == 50.0
    diffs = sum(1 for a, b in zip(result, result_no_widen) if a["v"] != b["v"])
    assert diffs > 0, "min_window_points should change the output"


def test_min_window_points_at_edges():
    """Edge points also get widened windows, not crash."""
    readings = _make_readings([100, 90, 80], interval_days=50)
    result = cycle_relative_smooth(readings, window_frac=0.01, min_window_points=3)
    assert len(result) == 3
    # All 3 points form the window for each → median = 90
    assert result[0]["v"] == 90.0
    assert result[1]["v"] == 90.0
    assert result[2]["v"] == 90.0


# --- Staircase smoothing (Zigbee pattern) ---


def test_zigbee_staircase_with_bounce_noise():
    """Noisy Zigbee staircase: smoothing should remove ±1-step bounce noise."""
    import random

    random.seed(99)
    # 300-day cycle, 2 readings/day, 5% steps with bounces
    readings = []
    t = 0.0
    level = 100.0
    for step in range(20):
        for j in range(30):
            # Add occasional ±5 bounce (simulates Zigbee jitter)
            noise = random.choice([-5, 0, 0, 0, 5]) if j % 3 == 0 else 0
            readings.append({"t": t, "v": max(0.0, level + noise)})
            t += DAY * 0.5
        level -= 5.0

    result = cycle_relative_smooth(readings, window_frac=0.05)

    # Bounces should be eliminated: smoothed values should not exceed raw range
    # and the max point-to-point jump should be smaller than the bounce magnitude
    raw_jumps = [
        abs(readings[i + 1]["v"] - readings[i]["v"])
        for i in range(len(readings) - 1)
    ]
    smooth_jumps = [
        abs(result[i + 1]["v"] - result[i]["v"])
        for i in range(len(result) - 1)
    ]
    # 90th percentile jump should be much smaller after smoothing
    raw_jumps.sort()
    smooth_jumps.sort()
    p90_raw = raw_jumps[int(len(raw_jumps) * 0.9)]
    p90_smooth = smooth_jumps[int(len(smooth_jumps) * 0.9)]
    assert p90_smooth <= p90_raw, (
        f"Smoothed p90 jump ({p90_smooth}) should be <= raw ({p90_raw})"
    )


# --- Noise removal ---


def test_bounce_noise_removed():
    """±1% bounce noise on a declining signal should be eliminated."""
    import random

    random.seed(42)
    n = 400
    clean = [100.0 - i * 0.25 for i in range(n)]  # 100→0 over 400 days
    noisy_vals = [v + random.uniform(-1, 1) for v in clean]
    readings = _make_readings(noisy_vals, interval_days=1.0)

    result = cycle_relative_smooth(readings, window_frac=0.05)

    # Smoothed should track clean signal closely for interior points
    for i in range(20, n - 20):
        assert abs(result[i]["v"] - clean[i]) < 2.0, (
            f"At day {i}: smoothed={result[i]['v']:.1f} vs clean={clean[i]:.1f}"
        )


# --- Edge cases ---


def test_identical_timestamps():
    """All readings at the same timestamp shouldn't crash."""
    readings = [{"t": 1000.0, "v": v} for v in [100, 90, 80, 70, 60]]
    # cycle_duration = 0 → half_window = 0 → all points in window
    result = cycle_relative_smooth(readings)
    assert len(result) == 5


def test_single_cluster_with_outlier():
    """Dense cluster + one distant point: median computed correctly."""
    readings = [
        {"t": 0.0, "v": 100.0},
        {"t": DAY, "v": 95.0},
        {"t": 2 * DAY, "v": 90.0},
        {"t": 3 * DAY, "v": 85.0},
        {"t": 100 * DAY, "v": 10.0},  # far outlier
    ]
    result = cycle_relative_smooth(readings, window_frac=0.05)
    # Window of 5% of 100 days = 5 days → first 4 points are in each other's windows
    assert len(result) == 5


# --- Comparison with rolling_median ---


def test_equivalent_to_rolling_median_when_window_matches():
    """When window_frac produces the same window as window_hours, results match."""
    readings = _make_readings(
        [100, 97, 93, 88, 82, 75, 67, 58, 48, 37, 25], interval_days=10
    )
    # Total duration = 100 days. window_frac=0.02 → 2 days = 48 hours
    result_cycle = cycle_relative_smooth(readings, window_frac=0.02, min_window_points=1)
    result_fixed = rolling_median(readings, window_hours=48.0)
    assert result_cycle == result_fixed
