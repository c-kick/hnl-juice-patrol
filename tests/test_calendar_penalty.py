"""Tests for calendar aging penalty (Phase 2).

Verifies _calendar_penalty returns correctly adjusted SoC from idle time,
with chemistry-specific rates and idle-day caps.
"""

import math

from custom_components.juice_patrol.engine.predictions import (
    _calendar_penalty,
    _C_CAL,
    _MAX_IDLE_DAYS,
    _MAX_IDLE_DAYS_PRIMARY,
)


class TestCalendarPenalty:
    """Calendar aging penalty computation."""

    def test_zero_idle_returns_same_soc(self):
        """No idle time → SoC unchanged."""
        assert _calendar_penalty(80.0, 0.0, "NMC") == 80.0

    def test_negative_idle_returns_same_soc(self):
        """Negative idle time → SoC unchanged."""
        assert _calendar_penalty(80.0, -5.0, "NMC") == 80.0

    def test_nmc_100_days(self):
        """NMC, 100 idle days → current_soc - c_cal * sqrt(100) * 100."""
        loss = _C_CAL["NMC"] * math.sqrt(100) * 100.0
        result = _calendar_penalty(80.0, 100.0, "NMC")
        assert abs(result - (80.0 - loss)) < 1e-6

    def test_lfp_lower_loss_than_nmc(self):
        """LFP has lower calendar aging than NMC → higher adjusted SoC."""
        lfp = _calendar_penalty(80.0, 100.0, "LFP")
        nmc = _calendar_penalty(80.0, 100.0, "NMC")
        assert lfp > nmc

    def test_nimh_higher_loss_than_nmc(self):
        """NiMH has highest calendar aging of rechargeable → lower adjusted SoC."""
        nimh = _calendar_penalty(80.0, 100.0, "NiMH")
        nmc = _calendar_penalty(80.0, 100.0, "NMC")
        assert nimh < nmc

    def test_lithium_primary_less_loss_than_alkaline(self):
        """Lithium primary has very low calendar aging → higher adjusted SoC."""
        lp = _calendar_penalty(80.0, 100.0, "lithium_primary")
        alk = _calendar_penalty(80.0, 100.0, "alkaline")
        assert lp > alk

    def test_primary_idle_cap(self):
        """Primary cells cap idle days at _MAX_IDLE_DAYS_PRIMARY."""
        capped = _calendar_penalty(80.0, 1000.0, "alkaline")
        at_cap = _calendar_penalty(80.0, float(_MAX_IDLE_DAYS_PRIMARY), "alkaline")
        assert abs(capped - at_cap) < 1e-6

    def test_rechargeable_idle_cap(self):
        """Rechargeable cells cap idle days at _MAX_IDLE_DAYS."""
        capped = _calendar_penalty(80.0, 2000.0, "NMC")
        at_cap = _calendar_penalty(80.0, float(_MAX_IDLE_DAYS), "NMC")
        assert abs(capped - at_cap) < 1e-6

    def test_unknown_chemistry_uses_conservative_primary(self):
        """Unknown chemistry uses most conservative primary c_cal (0.00105)."""
        unknown = _calendar_penalty(80.0, 10.0, "unknown")
        # c_cal=0.00105, idle_days=10 → loss = 0.00105 * sqrt(10) * 100 ≈ 0.332
        expected = 80.0 - (0.00105 * 10.0**0.5 * 100.0)
        assert abs(unknown - expected) < 0.01

    def test_none_chemistry_defaults_to_unknown(self):
        """None chemistry falls back to 'unknown' constant."""
        none_result = _calendar_penalty(80.0, 10.0, None)
        unknown_result = _calendar_penalty(80.0, 10.0, "unknown")
        assert abs(none_result - unknown_result) < 1e-6

    def test_sqrt_scaling(self):
        """Loss scales with sqrt(idle_days)."""
        soc = 80.0
        p1 = soc - _calendar_penalty(soc, 25.0, "NMC")   # loss at 25 days
        p2 = soc - _calendar_penalty(soc, 100.0, "NMC")   # loss at 100 days
        # sqrt(100) / sqrt(25) = 2.0
        assert abs(p2 / p1 - 2.0) < 1e-6

    def test_coin_cell_is_primary_capped(self):
        """Coin cell uses primary idle-day cap."""
        capped = _calendar_penalty(80.0, 1000.0, "coin_cell")
        at_cap = _calendar_penalty(80.0, float(_MAX_IDLE_DAYS_PRIMARY), "coin_cell")
        assert abs(capped - at_cap) < 1e-6

    def test_result_clamped_to_zero(self):
        """Adjusted SoC never goes below 0."""
        result = _calendar_penalty(0.5, 365.0, "NiMH")
        assert result == 0.0
