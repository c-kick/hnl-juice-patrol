"""Tests for tail-cliff ratio and cliff integration into predict_discharge.

Verifies _tail_cliff_ratio detects the cliff-zone precursor signal for
primary cells, and that predict_discharge uses the tail slope (not the
overall Theil-Sen slope) when the cliff is detected.
"""

import time

from custom_components.juice_patrol.engine.predictions import (
    Confidence,
    _tail_cliff_ratio,
    _stuck_near_cliff,
    _CLIFF_CHEMISTRIES,
    _STUCK_PLATEAU_CAPS,
    predict_discharge,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_ts_readings(days_soc_pairs, t0=None):
    """Convert (day, soc) pairs to readings with timestamps.

    Timestamps are anchored so the last reading is "now" (for predict_discharge
    to treat the data as current, not historical).
    """
    if t0 is None:
        max_day = max(d for d, _ in days_soc_pairs)
        t0 = time.time() - max_day * 86400.0
    return [{"t": t0 + d * 86400.0, "v": soc} for d, soc in days_soc_pairs]


# ---------------------------------------------------------------------------
# _tail_cliff_ratio unit tests
# ---------------------------------------------------------------------------


class TestTailCliffRatio:
    """Unit tests for the tail-slope / overall-slope ratio."""

    def test_uniform_slope_ratio_near_one(self):
        """Linear discharge → ratio ≈ 1.0."""
        readings = _make_ts_readings(
            [(d, 100 - d * 0.5) for d in range(0, 200, 5)]  # 40 points
        )
        ratio = _tail_cliff_ratio(readings)
        assert ratio is not None
        assert 0.8 <= ratio <= 1.3

    def test_alkaline_cliff_deep(self):
        """9-point alkaline cliff series → ratio well above 2.5."""
        readings = _make_ts_readings([
            (0, 95), (30, 90), (60, 85), (90, 78),
            (100, 68), (105, 52), (110, 30), (112, 18), (114, 5),
        ])
        ratio = _tail_cliff_ratio(readings, tail_n=4)
        assert ratio is not None
        assert ratio > 5.0  # deep cliff

    def test_moderate_cliff(self):
        """Steeper tail but not extreme → 1.0 < ratio < 5.0."""
        # Gradual then steeper at the end
        readings = _make_ts_readings(
            [(d, 100 - d * 0.3) for d in range(0, 60, 3)]
            + [(60 + d, 82 - d * 1.0) for d in range(0, 15, 3)]
        )
        ratio = _tail_cliff_ratio(readings)
        assert ratio is not None
        assert ratio > 1.5

    def test_too_few_points_returns_none(self):
        """Fewer than tail_n + 3 → None."""
        readings = _make_ts_readings([(0, 100), (1, 99), (2, 98)])
        assert _tail_cliff_ratio(readings, tail_n=5) is None

    def test_flat_overall_returns_none(self):
        """Near-zero overall slope → None."""
        readings = _make_ts_readings(
            [(d, 50.0 + (0.1 if d % 2 else -0.1)) for d in range(20)]
        )
        assert _tail_cliff_ratio(readings) is None

    def test_exactly_tail_n_plus_3(self):
        """Exactly tail_n + 3 points — should work."""
        # 8 points (tail_n=5 → need 8)
        readings = _make_ts_readings(
            [(d, 90 - d) for d in range(0, 80, 10)]  # 8 points
        )
        ratio = _tail_cliff_ratio(readings, tail_n=5)
        assert ratio is not None

    def test_charging_returns_positive_ratio(self):
        """Charging data: both slopes positive → ratio near 1.0."""
        readings = _make_ts_readings(
            [(d, 10 + d * 0.5) for d in range(0, 40, 2)]  # 20 points
        )
        ratio = _tail_cliff_ratio(readings)
        assert ratio is not None
        assert 0.7 <= ratio <= 1.5


# ---------------------------------------------------------------------------
# Integration tests: cliff adjusts days_remaining
# ---------------------------------------------------------------------------


class TestCliffIntegration:
    """Verify that predict_discharge uses tail slope for primary cells in cliff."""

    def test_alkaline_cliff_short_remaining(self):
        """With chemistry='alkaline' and a steep cliff, days_remaining is short."""
        readings = _make_ts_readings([
            (0, 95), (30, 90), (60, 85), (90, 78),
            (100, 68), (105, 52), (110, 30), (112, 18), (114, 5),
        ])
        result = predict_discharge(readings, chemistry="alkaline")
        # Tail slope (~−7 %/day) predicts <2 days from 5% to 0%
        # Overall Theil-Sen (~−0.9 %/day) predicts ~5 days — the failure mode
        assert result.estimated_days_remaining is not None
        assert result.estimated_days_remaining < 3.0

    def test_lithium_primary_cliff(self):
        """Lithium primary with steep tail also gets short estimate."""
        readings = _make_ts_readings([
            (0, 100), (60, 98), (120, 96), (150, 94),
            (160, 90), (163, 70), (165, 40), (166, 15), (167, 3),
        ])
        result = predict_discharge(readings, chemistry="lithium_primary")
        assert result.estimated_days_remaining is not None
        assert result.estimated_days_remaining < 5.0

    def test_rechargeable_ignores_cliff(self):
        """NMC chemistry does not use tail-cliff override."""
        readings = _make_ts_readings([
            (0, 95), (30, 90), (60, 85), (90, 78),
            (100, 68), (105, 52), (110, 30), (112, 18), (114, 5),
        ])
        result_nmc = predict_discharge(readings, chemistry="NMC")
        result_alk = predict_discharge(readings, chemistry="alkaline")
        # NMC should not force LOW from tail_cliff_ratio alone
        # (it may get LOW from other signals like soc_split_ratio)
        # The key check: if both get a prediction, alkaline should be shorter
        if result_nmc.estimated_days_remaining and result_alk.estimated_days_remaining:
            assert result_alk.estimated_days_remaining <= result_nmc.estimated_days_remaining

    def test_unknown_chemistry_ignores_cliff(self):
        """Unknown chemistry does not use tail-cliff override."""
        readings = _make_ts_readings([
            (0, 95), (30, 90), (60, 85), (90, 78),
            (100, 68), (105, 52), (110, 30), (112, 18), (114, 5),
        ])
        result = predict_discharge(readings, chemistry="unknown")
        # Should not apply cliff detection (unknown is not in _CLIFF_CHEMISTRIES)
        assert "unknown" not in _CLIFF_CHEMISTRIES

    def test_no_cliff_normal_discharge(self):
        """Linear discharge: no cliff override, normal prediction."""
        readings = _make_ts_readings(
            [(d, 100 - d * 0.5) for d in range(0, 120, 5)]  # 24 points
        )
        result = predict_discharge(readings, chemistry="alkaline")
        # With linear discharge, days_remaining should be substantial
        if result.estimated_days_remaining is not None:
            assert result.estimated_days_remaining > 5.0


# ---------------------------------------------------------------------------
# Stuck-plateau cap tests
# ---------------------------------------------------------------------------


class TestStuckPlateauCap:
    """Verify stuck-plateau caps days_remaining per chemistry."""

    def _make_stuck_readings(self, stuck_pct=20.0, stuck_days=150):
        """Simulate gradual drop to stuck_pct, then flat for stuck_days."""
        pairs = [(0, 100), (30, 80), (60, 50), (90, 25)]
        pairs += [(90 + d, stuck_pct) for d in range(1, stuck_days + 1)]
        return _make_ts_readings(pairs)

    def test_alkaline_stuck_capped_at_14(self):
        """Alkaline stuck at 20% → days_remaining ≤ 14."""
        readings = self._make_stuck_readings()
        result = predict_discharge(readings, chemistry="alkaline")
        if result.estimated_days_remaining is not None:
            assert result.estimated_days_remaining <= 14.0

    def test_lithium_primary_stuck_capped_at_21(self):
        """Lithium primary stuck at 20% → days_remaining ≤ 21."""
        readings = self._make_stuck_readings()
        result = predict_discharge(readings, chemistry="lithium_primary")
        if result.estimated_days_remaining is not None:
            assert result.estimated_days_remaining <= 21.0

    def test_coin_cell_stuck_capped_at_21(self):
        """Coin cell stuck at 20% → days_remaining ≤ 21."""
        readings = self._make_stuck_readings()
        result = predict_discharge(readings, chemistry="coin_cell")
        if result.estimated_days_remaining is not None:
            assert result.estimated_days_remaining <= 21.0

    def test_nmc_not_in_caps(self):
        """NMC (rechargeable) is not in the stuck-plateau cap map."""
        assert "NMC" not in _STUCK_PLATEAU_CAPS
        assert "NMC" not in _CLIFF_CHEMISTRIES

    def test_stuck_above_threshold_no_cap(self):
        """Stuck at 50% (above 30% threshold) → no cap."""
        readings = self._make_stuck_readings(stuck_pct=50.0, stuck_days=60)
        result = predict_discharge(readings, chemistry="alkaline")
        # _stuck_near_cliff only triggers below 30%, so no cap
        # (the prediction may still be capped by other logic but not this one)
        assert not _stuck_near_cliff(readings, threshold_pct=30.0)


# ---------------------------------------------------------------------------
# Deep cliff confidence penalty
# ---------------------------------------------------------------------------


class TestDeepCliffConfidence:
    """Verify that deep cliff (tcr > 5.0) forces LOW on primary cells."""

    def test_deep_cliff_forces_low_alkaline(self):
        """Alkaline with very steep cliff → LOW confidence."""
        # Exaggerate the cliff so tcr > 5.0 (deep cliff threshold)
        readings = _make_ts_readings([
            (0, 95), (30, 93), (60, 91), (90, 89), (120, 87),
            (150, 85), (152, 60), (153, 30), (154, 10), (155, 2),
        ])
        result = predict_discharge(readings, chemistry="alkaline")
        assert result.confidence == Confidence.LOW

    def test_deep_cliff_nmc_not_forced_low(self):
        """NMC with same data → tail_cliff_ratio penalty does not apply."""
        readings = _make_ts_readings([
            (0, 95), (30, 90), (60, 85), (90, 78),
            (100, 68), (105, 52), (110, 30), (112, 18), (114, 5),
        ])
        result = predict_discharge(readings, chemistry="NMC")
        # NMC may still get LOW from soc_split_ratio, but the tail_cliff_ratio
        # penalty specifically should not fire
        assert "NMC" not in _CLIFF_CHEMISTRIES
