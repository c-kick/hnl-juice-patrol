"""Tests for SDT compression (engine/compress.py)."""

import random

from custom_components.juice_patrol.engine.compress import (
    compress,
    dedup_consecutive,
    sdt_compress,
)


def _make_flat(value: float, count: int, start_t: float = 0.0, interval: float = 3600.0):
    """Generate count identical readings at fixed intervals."""
    return [{"t": start_t + i * interval, "v": value} for i in range(count)]


def _make_linear(start_v: float, end_v: float, count: int, start_t: float = 0.0, span_s: float = 86400.0 * 30):
    """Generate linearly declining readings."""
    interval = span_s / max(count - 1, 1)
    step = (end_v - start_v) / max(count - 1, 1)
    return [{"t": start_t + i * interval, "v": start_v + i * step} for i in range(count)]


class TestDedupConsecutive:
    """Test dedup_consecutive."""

    def test_empty(self):
        assert dedup_consecutive([]) == []

    def test_single(self):
        r = [{"t": 0.0, "v": 100.0}]
        assert dedup_consecutive(r) == r

    def test_two_same(self):
        r = [{"t": 0.0, "v": 100.0}, {"t": 1.0, "v": 100.0}]
        assert dedup_consecutive(r) == r  # both kept (first and last)

    def test_long_plateau_keeps_first_last(self):
        """400 identical readings → 2 points (first + last)."""
        readings = _make_flat(100.0, 400)
        result = dedup_consecutive(readings)
        assert len(result) == 2
        assert result[0] == readings[0]
        assert result[1] == readings[-1]

    def test_preserves_transitions(self):
        """Plateau → drop → plateau keeps boundary readings."""
        readings = (
            _make_flat(100.0, 10, start_t=0.0)
            + _make_flat(65.0, 10, start_t=36000.0)
        )
        result = dedup_consecutive(readings)
        values = [r["v"] for r in result]
        assert 100.0 in values
        assert 65.0 in values
        # first+last of each plateau = 4
        assert len(result) == 4

    def test_all_different(self):
        """No duplicates → nothing removed."""
        readings = [{"t": float(i), "v": float(i)} for i in range(10)]
        result = dedup_consecutive(readings)
        assert len(result) == 10


class TestSdtCompress:
    """Test sdt_compress."""

    def test_empty(self):
        assert sdt_compress([]) == []

    def test_single(self):
        r = [{"t": 0.0, "v": 50.0}]
        assert sdt_compress(r) == r

    def test_two_points(self):
        r = [{"t": 0.0, "v": 100.0}, {"t": 3600.0, "v": 99.0}]
        assert sdt_compress(r) == r

    def test_flat_plateau(self):
        """400 identical readings → 2 points (first + last)."""
        readings = _make_flat(100.0, 400)
        result = sdt_compress(readings, epsilon=2.0)
        assert len(result) == 2
        assert result[0] == readings[0]
        assert result[-1] == readings[-1]

    def test_linear_decline_within_epsilon(self):
        """Perfectly linear data within epsilon → very few points.

        A linear signal of 100→95 over 100 points (5% total drop) with
        epsilon=2.0 should compress heavily since intermediate points
        all lie on the line.
        """
        readings = _make_linear(100.0, 95.0, 100)
        result = sdt_compress(readings, epsilon=2.0)
        # Linear data should compress to just first+last (or very few)
        assert len(result) <= 4
        assert result[0] == readings[0]
        assert result[-1] == readings[-1]

    def test_linear_steep_preserves_endpoints(self):
        """Steep linear decline (100→0) over many points.

        Even steep linear data compresses well since all points lie on
        the same line.
        """
        readings = _make_linear(100.0, 0.0, 200)
        result = sdt_compress(readings, epsilon=2.0)
        assert len(result) <= 5
        assert result[0] == readings[0]
        assert result[-1] == readings[-1]

    def test_staircase_pattern(self):
        """Staircase: 100(×50) → 65(×30) → 40(×20) → 10(×10).

        SDT should keep transition points but compress the flats.
        """
        readings = (
            _make_flat(100.0, 50, start_t=0.0)
            + _make_flat(65.0, 30, start_t=180000.0)
            + _make_flat(40.0, 20, start_t=288000.0)
            + _make_flat(10.0, 10, start_t=360000.0)
        )
        result = sdt_compress(readings, epsilon=2.0)
        # Should capture each step transition — roughly 2 per step boundary + endpoints
        # Total input: 110 readings. Output should be much smaller.
        assert len(result) <= 12
        assert len(result) >= 5  # at minimum: first, each transition, last
        # First and last preserved
        assert result[0] == readings[0]
        assert result[-1] == readings[-1]
        # All staircase levels represented
        result_values = {r["v"] for r in result}
        assert 100.0 in result_values
        assert 65.0 in result_values
        assert 40.0 in result_values
        assert 10.0 in result_values

    def test_noisy_plateau_compressed(self):
        """Zigbee noise: 100 ± 1 over 200 readings.

        With epsilon=2.0, the noise is within the corridor → heavy compression.
        """
        rng = random.Random(42)
        readings = [
            {"t": float(i * 3600), "v": 100.0 + rng.uniform(-1.0, 1.0)}
            for i in range(200)
        ]
        result = sdt_compress(readings, epsilon=2.0)
        assert len(result) < 20  # heavy compression expected

    def test_sawtooth_preserves_peaks_and_troughs(self):
        """Noisy sawtooth (charge/discharge cycles).

        Discharge 100→20 then charge 20→95, repeated. Transitions exceed
        epsilon, so peaks and troughs must be preserved.
        """
        readings = []
        t = 0.0
        for cycle in range(3):
            # Discharge: 100 → 20 over 80 points
            for i in range(80):
                readings.append({"t": t, "v": 100.0 - i * 1.0})
                t += 3600.0
            # Charge: 20 → 95 over 30 points
            for i in range(30):
                readings.append({"t": t, "v": 20.0 + i * 2.5})
                t += 1800.0

        result = sdt_compress(readings, epsilon=2.0)
        result_values = [r["v"] for r in result]

        # Should preserve the overall shape: minima near 20, maxima near 100
        # SDT with epsilon=2 may absorb the exact trough by ±epsilon
        assert min(result_values) <= 25.0
        assert max(result_values) >= 95.0
        # Significant compression (330 → much fewer)
        assert len(result) < len(readings) // 2

    def test_small_epsilon_preserves_more(self):
        """Smaller epsilon → less compression (more points kept)."""
        readings = _make_linear(100.0, 50.0, 100)
        result_tight = sdt_compress(readings, epsilon=0.5)
        result_loose = sdt_compress(readings, epsilon=5.0)
        assert len(result_tight) >= len(result_loose)

    def test_preserves_time_order(self):
        """Output is sorted by timestamp."""
        readings = _make_linear(100.0, 50.0, 50)
        result = sdt_compress(readings, epsilon=2.0)
        for i in range(1, len(result)):
            assert result[i]["t"] > result[i - 1]["t"]


class TestCompress:
    """Test the full compress() pipeline (dedup + SDT)."""

    def test_flat_400_to_2(self):
        """400 identical readings → 2 points after dedup + SDT."""
        readings = _make_flat(100.0, 400)
        result = compress(readings, epsilon=2.0)
        assert len(result) == 2

    def test_staircase_with_zigbee_noise(self):
        """Staircase with ±1 noise on each plateau.

        Real-world Zigbee pattern: 100 ± 1 for 200 readings, then
        65 ± 1 for 100 readings, then 61 ± 1 for 50 readings.
        """
        rng = random.Random(123)
        readings = []
        t = 0.0
        for level, count in [(100.0, 200), (65.0, 100), (61.0, 50)]:
            for _ in range(count):
                readings.append({"t": t, "v": level + rng.uniform(-1.0, 1.0)})
                t += 3600.0

        result = compress(readings, epsilon=2.0)
        # 350 readings → should compress to a manageable number
        assert len(result) < 30
        # Transitions preserved
        result_values = [r["v"] for r in result]
        # Should have values near 100, 65, and 61
        assert any(v > 98 for v in result_values)
        assert any(63 < v < 67 for v in result_values)
        assert any(59 < v < 63 for v in result_values)

    def test_preserves_rapid_changes(self):
        """A sudden 30% drop should not be compressed away."""
        readings = (
            _make_flat(100.0, 50, start_t=0.0)
            + [{"t": 180001.0, "v": 70.0}]  # sudden drop
            + _make_flat(70.0, 50, start_t=180002.0, interval=3600.0)
        )
        result = compress(readings, epsilon=2.0)
        result_values = [r["v"] for r in result]
        assert 100.0 in result_values
        assert 70.0 in result_values

    def test_empty_and_small(self):
        assert compress([]) == []
        r1 = [{"t": 0.0, "v": 50.0}]
        assert compress(r1) == r1
        r2 = [{"t": 0.0, "v": 100.0}, {"t": 1.0, "v": 99.0}]
        assert compress(r2) == r2

    def test_performance_large_input(self):
        """1000 readings should compress in well under 100ms."""
        import time as t
        readings = _make_linear(100.0, 0.0, 1000, span_s=86400.0 * 365)
        start = t.monotonic()
        result = compress(readings, epsilon=2.0)
        elapsed = t.monotonic() - start
        assert elapsed < 0.1  # 100ms budget
        assert len(result) < len(readings)
