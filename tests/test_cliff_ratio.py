"""Tests for cliff ratio and stuck-near-cliff detection (Phase 3).

Verifies _cliff_ratio computes drain rate ratios correctly and
_stuck_near_cliff detects Zigbee cliff signatures.
"""

from custom_components.juice_patrol.engine.predictions import (
    _cliff_ratio,
    _stuck_near_cliff,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_discharge(
    start_pct: float, end_pct: float, n: int, span_days: float,
    t0: float = 1_700_000_000.0,
) -> list[dict[str, float]]:
    """Generate a linear discharge from start_pct to end_pct."""
    readings = []
    for i in range(n):
        frac = i / (n - 1) if n > 1 else 0.0
        readings.append({
            "t": t0 + frac * span_days * 86400.0,
            "v": start_pct + (end_pct - start_pct) * frac,
        })
    return readings


class TestCliffRatio:
    """Cliff ratio: drain rate below split / drain rate above split."""

    def test_uniform_discharge_ratio_near_one(self):
        """Linear discharge across the split → ratio ≈ 1.0."""
        readings = _make_discharge(80.0, 10.0, 50, span_days=100)
        ratio = _cliff_ratio(readings, split_pct=40.0)
        assert 0.8 < ratio < 1.3

    def test_cliff_discharge_ratio_above_one(self):
        """Fast drain below split, slow above → ratio > 1."""
        # Above 40%: slow (80→41 in 80 days)
        above = _make_discharge(80.0, 41.0, 20, span_days=80)
        # Below 40%: fast (39→5 in 10 days)
        t_start = above[-1]["t"] + 3600
        below = []
        for i in range(20):
            frac = i / 19
            below.append({
                "t": t_start + frac * 10 * 86400,
                "v": 39.0 + (5.0 - 39.0) * frac,
            })
        ratio = _cliff_ratio(above + below, split_pct=40.0)
        assert ratio > 2.0

    def test_insufficient_above_returns_one(self):
        """Not enough points above split → default 1.0."""
        readings = _make_discharge(35.0, 5.0, 20, span_days=30)
        ratio = _cliff_ratio(readings, split_pct=40.0, min_points=5)
        assert ratio == 1.0

    def test_insufficient_below_returns_one(self):
        """Not enough points below split → default 1.0."""
        readings = _make_discharge(90.0, 50.0, 20, span_days=30)
        ratio = _cliff_ratio(readings, split_pct=40.0, min_points=5)
        assert ratio == 1.0

    def test_flat_above_returns_one(self):
        """Zero drain rate above split → default 1.0."""
        t0 = 1_700_000_000.0
        above = [{"t": t0 + i * 86400, "v": 60.0} for i in range(10)]
        below = [{"t": t0 + (10 + i) * 86400, "v": 39.0 - i * 3.0} for i in range(10)]
        ratio = _cliff_ratio(above + below, split_pct=40.0, min_points=5)
        assert ratio == 1.0

    def test_custom_split_point(self):
        """Custom split_pct changes the partition."""
        readings = _make_discharge(90.0, 5.0, 40, span_days=100)
        ratio_low = _cliff_ratio(readings, split_pct=20.0, min_points=3)
        ratio_high = _cliff_ratio(readings, split_pct=60.0, min_points=3)
        # With linear discharge, both should be near 1.0
        assert 0.5 < ratio_low < 2.0
        assert 0.5 < ratio_high < 2.0


class TestStuckNearCliff:
    """Detect sensor stuck at a low level — Zigbee cliff signature."""

    def test_stuck_at_25_detected(self):
        """5 readings at 25% → stuck near cliff."""
        readings = [{"t": float(i), "v": 25.0} for i in range(5)]
        assert _stuck_near_cliff(readings) is True

    def test_not_stuck_at_60(self):
        """5 readings at 60% → not near cliff (above threshold)."""
        readings = [{"t": float(i), "v": 60.0} for i in range(5)]
        assert _stuck_near_cliff(readings) is False

    def test_spread_exceeds_tolerance(self):
        """Readings spread > 1.0 → not stuck."""
        readings = [{"t": float(i), "v": 25.0 + i * 0.5} for i in range(5)]
        # Values: 25.0, 25.5, 26.0, 26.5, 27.0 — spread = 2.0 > 1.0
        assert _stuck_near_cliff(readings) is False

    def test_too_few_readings(self):
        """Fewer than window → False."""
        readings = [{"t": float(i), "v": 25.0} for i in range(3)]
        assert _stuck_near_cliff(readings, window=5) is False

    def test_custom_threshold(self):
        """Custom threshold_pct changes detection boundary."""
        readings = [{"t": float(i), "v": 40.0} for i in range(5)]
        assert _stuck_near_cliff(readings, threshold_pct=30.0) is False
        assert _stuck_near_cliff(readings, threshold_pct=50.0) is True

    def test_only_tail_matters(self):
        """Only the last `window` readings matter, not earlier ones."""
        high = [{"t": float(i), "v": 80.0} for i in range(10)]
        low = [{"t": float(10 + i), "v": 25.0} for i in range(5)]
        assert _stuck_near_cliff(high + low, window=5) is True

    def test_at_exact_threshold(self):
        """Median exactly at threshold_pct → stuck."""
        readings = [{"t": float(i), "v": 30.0} for i in range(5)]
        assert _stuck_near_cliff(readings, threshold_pct=30.0) is True

    def test_stuck_near_cliff_detects_zigbee_pattern(self):
        """Readings stuck at 25% for 6 samples → detected."""
        readings = [{"t": float(i), "v": 25.0} for i in range(6)]
        assert _stuck_near_cliff(readings) is True

    def test_stuck_near_cliff_false_above_threshold(self):
        """Readings stuck at 50% → above 30% threshold → not detected."""
        readings = [{"t": float(i), "v": 50.0} for i in range(6)]
        assert _stuck_near_cliff(readings) is False
