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

    def test_high_cliff_ratio_forces_low(self):
        """Cliff ratio > 2.5 forces LOW regardless of fit quality."""
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            cliff_ratio=3.0,
        )
        assert result == Confidence.LOW

    def test_moderate_cliff_ratio_no_penalty(self):
        """Cliff ratio ≤ 2.5 does not penalize."""
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            cliff_ratio=2.0,
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

    def test_normal_readings_no_stuck_penalty(self):
        """Normal readings don't trigger stuck-near-cliff penalty."""
        readings = [{"t": float(i), "v": 50.0 - i * 2} for i in range(10)]
        result = _classify_confidence(
            r_squared=0.95, timespan_hours=240, data_points=20,
            readings=readings,
        )
        assert result == Confidence.HIGH

    def test_cliff_already_low_stays_low(self):
        """Already-LOW confidence stays LOW with high cliff ratio."""
        result = _classify_confidence(
            r_squared=0.2, timespan_hours=24, data_points=4,
            cliff_ratio=5.0,
        )
        assert result == Confidence.LOW


class TestComputeReliability:
    """Chemistry-aware reliability scoring."""

    def test_lithium_primary_boost(self):
        """Lithium primary gets a reliability multiplier > 1.0."""
        base = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, chemistry="NMC",
        )
        boosted = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, chemistry="lithium_primary",
        )
        assert boosted >= base

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

    def test_high_cliff_ratio_reduces_reliability(self):
        """High cliff ratio reduces reliability score."""
        normal = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, cliff_ratio=1.0,
        )
        cliff = compute_reliability(
            data_points=30, timespan_hours=720, r_squared=0.9,
            confidence=Confidence.HIGH, cliff_ratio=4.0,
        )
        assert cliff < normal

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
