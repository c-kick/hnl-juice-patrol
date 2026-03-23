"""Tests for confidence classification with chemistry/cliff awareness (Phase 4).

Verifies _classify_confidence applies chemistry caps, cliff ratio penalties,
and stuck-near-cliff penalties correctly.
"""

from custom_components.juice_patrol.engine.predictions import (
    Confidence,
    _classify_confidence,
    compute_reliability,
    _RELIABILITY_MULTIPLIERS,
)


class TestClassifyConfidence:
    """Confidence classification with chemistry and cliff awareness."""

    def test_high_confidence_baseline(self):
        """Good fit + long timespan + enough points → HIGH."""
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
        )
        assert result == Confidence.HIGH

    def test_medium_confidence(self):
        """Moderate fit → MEDIUM."""
        result = _classify_confidence(
            r_squared=0.5, timespan_hours=100, data_points=8,
        )
        assert result == Confidence.MEDIUM

    def test_low_confidence(self):
        """Low fit quality → LOW."""
        result = _classify_confidence(
            r_squared=0.2, timespan_hours=24, data_points=4,
        )
        assert result == Confidence.LOW

    def test_insufficient_data(self):
        """Very poor fit → INSUFFICIENT_DATA."""
        result = _classify_confidence(
            r_squared=0.05, timespan_hours=24, data_points=4,
        )
        assert result == Confidence.INSUFFICIENT_DATA

    def test_coin_cell_capped_at_medium(self):
        """Coin cell with HIGH-quality data is capped at MEDIUM."""
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            chemistry="coin_cell",
        )
        assert result == Confidence.MEDIUM

    def test_lithium_primary_capped_at_medium(self):
        """Lithium primary with HIGH-quality data is capped at MEDIUM."""
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            chemistry="lithium_primary",
        )
        assert result == Confidence.MEDIUM

    def test_nmc_not_capped(self):
        """NMC chemistry does NOT cap HIGH confidence."""
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            chemistry="NMC",
        )
        assert result == Confidence.HIGH

    def test_high_soc_split_ratio_forces_low(self):
        """SoC-split ratio > 2.5 forces LOW regardless of fit quality."""
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            soc_split_ratio=3.0,
        )
        assert result == Confidence.LOW

    def test_moderate_soc_split_ratio_no_penalty(self):
        """SoC-split ratio ≤ 2.5 does not penalize."""
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            soc_split_ratio=2.0,
        )
        assert result == Confidence.HIGH

    def test_stuck_near_cliff_forces_low(self):
        """Stuck-near-cliff readings force LOW confidence."""
        readings = [{"t": float(i), "v": 25.0} for i in range(10)]
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            readings=readings,
        )
        assert result == Confidence.LOW

    def test_stuck_near_cliff_skipped_when_already_dead(self):
        """Stuck-near-cliff does NOT force LOW when days_remaining < 1.0.

        A flatlined battery with ~0 days remaining is confirmed dead —
        the prediction is correct and confident, not uncertain.
        """
        readings = [{"t": float(i), "v": 25.0} for i in range(10)]
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            readings=readings, days_remaining=0.0,
        )
        assert result == Confidence.HIGH

    def test_stuck_near_cliff_still_low_with_days_remaining(self):
        """Stuck-near-cliff still forces LOW when days_remaining >= 1.0."""
        readings = [{"t": float(i), "v": 25.0} for i in range(10)]
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            readings=readings, days_remaining=5.0,
        )
        assert result == Confidence.LOW

    def test_normal_readings_no_stuck_penalty(self):
        """Normal readings don't trigger stuck-near-cliff penalty."""
        readings = [{"t": float(i), "v": 50.0 - i * 2} for i in range(10)]
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            readings=readings,
        )
        assert result == Confidence.HIGH

    def test_soc_split_already_low_stays_low(self):
        """Already-LOW confidence stays LOW with high SoC-split ratio."""
        result = _classify_confidence(
            r_squared=0.2, timespan_hours=24, data_points=4,
            soc_split_ratio=5.0,
        )
        assert result == Confidence.LOW


class TestComputeReliability:
    """Chemistry-aware reliability scoring."""

    def test_lithium_primary_penalized(self):
        """Lithium primary gets a reliability multiplier ≤ 0.81 × unknown baseline."""
        baseline = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, chemistry="unknown",
        )
        penalized = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, chemistry="lithium_primary",
        )
        assert penalized <= baseline * 0.81

    def test_nimh_penalty(self):
        """NiMH gets a reliability multiplier < 1.0."""
        base = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, chemistry="NMC",
        )
        penalized = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, chemistry="NiMH",
        )
        assert penalized <= base

    def test_high_soc_split_ratio_reduces_reliability(self):
        """High SoC-split ratio reduces reliability score."""
        normal = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, soc_split_ratio=1.0,
        )
        penalized = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, soc_split_ratio=4.0,
        )
        assert penalized < normal

    def test_score_clamped_0_to_100(self):
        """Reliability score is always in [0, 100]."""
        low = compute_reliability(
            data_points=1, timespan_hours=1, r_squared=0.0,
            confidence=Confidence.INSUFFICIENT_DATA,
        )
        high = compute_reliability(
            data_points=100, timespan_hours=2000, r_squared=1.0,
            confidence=Confidence.HIGH,
        )
        assert 0 <= low <= 100
        assert 0 <= high <= 100

    def test_coin_cell_penalized_vs_unknown(self):
        """coin_cell → output ≤ 0.76 × unknown baseline (0.75 multiplier)."""
        baseline = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, chemistry="unknown",
        )
        penalized = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, chemistry="coin_cell",
        )
        assert penalized <= baseline * 0.76

    def test_cliff_ratio_reduces_reliability(self):
        """tail_cliff_ratio=3.0 → output reduced vs no cliff."""
        baseline = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, chemistry="alkaline",
        )
        cliff = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, chemistry="alkaline",
            tail_cliff_ratio=3.0,
        )
        assert cliff < baseline

    def test_coin_cell_plus_cliff_stacks(self):
        """coin_cell + cliff_ratio=3.0 → both penalties stack."""
        baseline = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, chemistry="unknown",
        )
        both = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, chemistry="coin_cell",
            tail_cliff_ratio=3.0,
        )
        assert both < baseline * 0.76


class TestClassifyConfidenceChemistryAware:
    """Chemistry-aware confidence: R² thresholds, caps, and cliff override."""

    def test_coin_cell_high_r2_capped_at_medium(self):
        """coin_cell, R²=0.95, good timespan, many points → MEDIUM (not HIGH)."""
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            chemistry="coin_cell",
        )
        assert result == Confidence.MEDIUM

    def test_alkaline_high_r2_gets_high(self):
        """alkaline, R²=0.95, good timespan, many points → HIGH (uncapped)."""
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            chemistry="alkaline",
        )
        assert result == Confidence.HIGH

    def test_alkaline_cliff_forces_low(self):
        """alkaline, R²=0.95, cliff_ratio=3.0 → LOW (cliff override)."""
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            chemistry="alkaline", tail_cliff_ratio=3.0,
        )
        assert result == Confidence.LOW

    def test_unknown_unchanged(self):
        """unknown, R²=0.95, good timespan → HIGH (current behaviour)."""
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            chemistry="unknown",
        )
        assert result == Confidence.HIGH

    def test_coin_cell_generous_low_threshold(self):
        """coin_cell with R²=0.08 gets LOW (not INSUFFICIENT_DATA)."""
        result = _classify_confidence(
            r_squared=0.08, timespan_hours=240, data_points=20,
            chemistry="coin_cell",
        )
        assert result == Confidence.LOW

    def test_unknown_r2_008_insufficient(self):
        """unknown with R²=0.08 gets INSUFFICIENT_DATA (standard threshold)."""
        result = _classify_confidence(
            r_squared=0.08, timespan_hours=240, data_points=20,
            chemistry="unknown",
        )
        assert result == Confidence.INSUFFICIENT_DATA
