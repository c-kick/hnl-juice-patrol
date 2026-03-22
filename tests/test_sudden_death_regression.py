"""Regression test: soil moisture meter sudden death (Feb 2026).

Real failure case: 2× AA Zigbee soil moisture meter sat at 20% for ~5 months,
then died abruptly on Feb 1.  The old engine predicted April (59+ days remaining)
because the overall Theil-Sen slope was near-zero.  The fix uses stuck-plateau
detection and cliff-aware caps to predict ≤30 days.

This test replays the exact failure scenario with synthetic readings that match
the real device's behaviour: gradual decay → long flat plateau at 20%.
"""

import time

from custom_components.juice_patrol.engine.analysis import chemistry_from_battery_type
from custom_components.juice_patrol.engine.predictions import (
    Confidence,
    _strip_trailing_dead,
    _stuck_near_cliff,
    predict_discharge,
)


def _make_ts_readings(days_soc_pairs, t0=None):
    """Convert (day, soc) pairs to readings anchored so last = now."""
    if t0 is None:
        max_day = max(d for d, _ in days_soc_pairs)
        t0 = time.time() - max_day * 86400.0
    return [{"t": t0 + d * 86400.0, "v": soc} for d, soc in days_soc_pairs]


class TestSoilMoistureRegression:
    """Regression suite for the soil moisture meter sudden-death failure."""

    def _make_plateau_readings(self):
        """Simulate the real device: decay to 20%, then flat for 150 days.

        Matches the real sensor pattern:
        - Day 0-90: gradual decay 100% → 20% (typical alkaline curve)
        - Day 90-240: stuck at 20% (reporting every ~2 days like Zigbee)
        """
        pairs = []
        # Phase 1: gradual decay (roughly daily readings)
        for d in range(0, 91, 3):
            soc = 100.0 - (80.0 / 90.0) * d
            pairs.append((d, round(soc)))

        # Phase 2: stuck at 20% for 150 days (readings every 2 days)
        for d in range(92, 242, 2):
            pairs.append((d, 20.0))

        return _make_ts_readings(pairs)

    def test_chemistry_resolves_to_alkaline(self):
        """'2× AA' must map to 'alkaline'."""
        assert chemistry_from_battery_type("2× AA") == "alkaline"

    def test_stuck_near_cliff_fires(self):
        """Plateau data at 20% must trigger _stuck_near_cliff."""
        readings = self._make_plateau_readings()
        assert _stuck_near_cliff(readings, threshold_pct=30.0)

    def test_days_remaining_at_most_30(self):
        """Stuck at 20% alkaline → days_remaining ≤ 30 (not months)."""
        readings = self._make_plateau_readings()
        result = predict_discharge(readings, chemistry="alkaline")
        assert result.estimated_days_remaining is not None, (
            "Should produce a prediction even for flat plateau data"
        )
        assert result.estimated_days_remaining <= 30.0, (
            f"Expected ≤30 days, got {result.estimated_days_remaining:.1f} — "
            "the old engine would predict 59+ days here"
        )

    def test_confidence_not_high(self):
        """Flat plateau + cliff chemistry → confidence must be LOW or INSUFFICIENT_DATA."""
        readings = self._make_plateau_readings()
        result = predict_discharge(readings, chemistry="alkaline")
        assert result.confidence in (Confidence.LOW, Confidence.INSUFFICIENT_DATA), (
            f"Expected LOW or INSUFFICIENT_DATA, got {result.confidence.name}"
        )

    def test_alkaline_cap_at_14(self):
        """Alkaline stuck-plateau cap is 14 days specifically."""
        readings = self._make_plateau_readings()
        result = predict_discharge(readings, chemistry="alkaline")
        if result.estimated_days_remaining is not None:
            assert result.estimated_days_remaining <= 14.0, (
                f"Alkaline cap should be 14 days, got {result.estimated_days_remaining:.1f}"
            )


class TestPostDeathStripping:
    """Regression: post-death 0% readings distort curve fit.

    Real case: soil moisture meter (2× AA alkaline) — replaced July 28 2025,
    gradual decay to 20% by Aug 25, plateau 132 days, cliff Jan 5-20, then
    hundreds of 0% readings until Feb 1.  Engine predicted Mar 22 (48 days
    after actual death on ~Jan 20).

    Root cause: trailing 0% readings flatten the Theil-Sen slope to near-zero,
    making the curve fit see "gently declining" instead of "cliff then dead".
    """

    def _make_full_lifecycle_readings(self):
        """Simulate the real device lifecycle with post-death readings.

        - Day 0-30: decay 100% → 20% (roughly daily readings)
        - Day 30-162: plateau at ~20% (readings every 12h, Zigbee-style)
        - Day 162-177: cliff 20% → 0% (15 days)
        - Day 177-207: dead at 0% (readings every 12h, 30 days post-death)

        Actual death point is around day 177.
        """
        pairs = []
        # Phase 1: gradual decay (daily readings)
        for d in range(0, 31):
            soc = 100.0 - (80.0 / 30.0) * d
            pairs.append((d, round(max(soc, 20.0))))

        # Phase 2: plateau at 20% (every 12 hours = 0.5 day)
        day = 30.5
        while day <= 162.0:
            pairs.append((day, 20.0))
            day += 0.5

        # Phase 3: cliff from 20% → 0% over 15 days
        for i in range(31):  # every 0.5 day over 15 days
            day = 162.0 + i * 0.5
            soc = 20.0 - (20.0 / 15.0) * (i * 0.5)
            pairs.append((day, round(max(soc, 0.0))))

        # Phase 4: dead at 0% for 30 days (every 12 hours)
        day = 177.5
        while day <= 207.0:
            pairs.append((day, 0.0))
            day += 0.5

        return _make_ts_readings(pairs)

    def test_strip_trailing_dead_removes_zeros(self):
        """_strip_trailing_dead removes trailing 0% readings."""
        readings = self._make_full_lifecycle_readings()
        original_len = len(readings)
        stripped = _strip_trailing_dead(readings, dead_threshold=1.0)

        # Should have removed the post-death 0% tail
        assert len(stripped) < original_len, (
            f"Expected fewer readings after stripping, got {len(stripped)}/{original_len}"
        )
        # Last reading in stripped should be > 1%
        assert stripped[-1]["v"] > 1.0, (
            f"Last stripped reading should be above threshold, got {stripped[-1]['v']}"
        )

    def test_strip_trailing_dead_preserves_all_if_no_dead(self):
        """No trailing dead readings → no stripping."""
        pairs = [(d, 100.0 - d) for d in range(0, 50)]
        readings = _make_ts_readings(pairs)
        stripped = _strip_trailing_dead(readings, dead_threshold=1.0)
        assert len(stripped) == len(readings)

    def test_strip_trailing_dead_all_dead(self):
        """All readings dead → return unchanged."""
        pairs = [(d, 0.0) for d in range(0, 30)]
        readings = _make_ts_readings(pairs)
        stripped = _strip_trailing_dead(readings, dead_threshold=1.0)
        assert len(stripped) == len(readings)

    def test_prediction_lands_near_actual_death(self):
        """With post-death stripping, the engine recognises the battery is dead.

        Day 177 is when the battery actually hit 0%.  Without the fix, the
        engine predicted ~48 days into the future because the flat 0% tail
        pulled the fitted slope toward zero.  With the fix, trailing 0%
        readings are stripped and the engine sees the cliff ending at ~2%,
        correctly predicting 0 days remaining (battery already dead).

        The key assertion: estimated_days_remaining must be ≤ 15, not the
        48+ days the old engine produced.  In practice the engine returns 0
        because the stripped data already shows the cliff bottoming out.
        """
        readings = self._make_full_lifecycle_readings()
        result = predict_discharge(readings, chemistry="alkaline")

        assert result.estimated_empty_timestamp is not None, (
            "Should produce a prediction for this dataset"
        )
        assert result.estimated_days_remaining is not None, (
            "Should produce days_remaining for this dataset"
        )

        # The battery died 30 days ago.  The engine should say "already dead"
        # (0 days remaining) or at most a few days.  The old engine said 48+.
        assert result.estimated_days_remaining <= 15.0, (
            f"Expected ≤15 days remaining (battery is dead), got "
            f"{result.estimated_days_remaining:.1f} — the old engine predicted 48+"
        )

        # The estimated_empty_timestamp should be near the actual cliff,
        # not months in the future.  The cliff ends around day 177 in our
        # synthetic data.  With trailing-dead stripping, the last reading
        # is near the cliff bottom, so the timestamp should be within 15
        # days of the actual death.
        readings = self._make_full_lifecycle_readings()
        max_day = max(r["t"] for r in readings)
        # Day 177 in our data = actual death; compute its absolute timestamp
        t0 = readings[0]["t"]
        actual_death_ts = t0 + 177.0 * 86400.0

        ts_diff_days = abs(result.estimated_empty_timestamp - actual_death_ts) / 86400.0
        assert ts_diff_days <= 15.0, (
            f"estimated_empty_timestamp should be within 15 days of actual death, "
            f"but was {ts_diff_days:.1f} days off"
        )
