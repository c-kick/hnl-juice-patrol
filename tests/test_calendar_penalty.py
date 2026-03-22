"""Tests for calendar aging penalty (Phase 2).

Verifies _calendar_penalty computes correct SoC loss from idle time,
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

    def test_zero_idle_returns_zero(self):
        """No idle time → no penalty."""
        assert _calendar_penalty(0.0, "NMC") == 0.0

    def test_negative_idle_returns_zero(self):
        """Negative idle time → no penalty."""
        assert _calendar_penalty(-5.0, "NMC") == 0.0

    def test_nmc_100_days(self):
        """NMC, 100 idle days → c_cal * sqrt(100) * 100."""
        expected = _C_CAL["NMC"] * math.sqrt(100) * 100.0
        result = _calendar_penalty(100.0, "NMC")
        assert abs(result - expected) < 1e-6

    def test_lfp_low_penalty(self):
        """LFP has lower calendar aging than NMC."""
        lfp = _calendar_penalty(100.0, "LFP")
        nmc = _calendar_penalty(100.0, "NMC")
        assert lfp < nmc

    def test_nimh_high_penalty(self):
        """NiMH has highest calendar aging of rechargeable chemistries."""
        nimh = _calendar_penalty(100.0, "NiMH")
        nmc = _calendar_penalty(100.0, "NMC")
        assert nimh > nmc

    def test_lithium_primary_very_low(self):
        """Lithium primary has very low calendar aging."""
        lp = _calendar_penalty(100.0, "lithium_primary")
        alk = _calendar_penalty(100.0, "alkaline")
        assert lp < alk

    def test_primary_idle_cap(self):
        """Primary cells cap idle days at _MAX_IDLE_DAYS_PRIMARY."""
        # 1000 days should give same result as _MAX_IDLE_DAYS_PRIMARY days
        capped = _calendar_penalty(1000.0, "alkaline")
        at_cap = _calendar_penalty(float(_MAX_IDLE_DAYS_PRIMARY), "alkaline")
        assert abs(capped - at_cap) < 1e-6

    def test_rechargeable_idle_cap(self):
        """Rechargeable cells cap idle days at _MAX_IDLE_DAYS."""
        capped = _calendar_penalty(2000.0, "NMC")
        at_cap = _calendar_penalty(float(_MAX_IDLE_DAYS), "NMC")
        assert abs(capped - at_cap) < 1e-6

    def test_unknown_chemistry_defaults_to_nmc(self):
        """Unknown chemistry uses NMC rate as default."""
        unknown = _calendar_penalty(100.0, "unknown")
        nmc = _calendar_penalty(100.0, "NMC")
        assert abs(unknown - nmc) < 1e-6

    def test_none_chemistry_defaults_to_nmc(self):
        """None chemistry uses NMC rate as default."""
        none_result = _calendar_penalty(100.0, None)
        nmc = _calendar_penalty(100.0, "NMC")
        assert abs(none_result - nmc) < 1e-6

    def test_sqrt_scaling(self):
        """Penalty scales with sqrt(idle_days)."""
        p1 = _calendar_penalty(25.0, "NMC")
        p2 = _calendar_penalty(100.0, "NMC")
        # sqrt(100) / sqrt(25) = 2.0
        assert abs(p2 / p1 - 2.0) < 1e-6

    def test_coin_cell_is_primary_capped(self):
        """Coin cell uses primary idle-day cap."""
        capped = _calendar_penalty(1000.0, "coin_cell")
        at_cap = _calendar_penalty(float(_MAX_IDLE_DAYS_PRIMARY), "coin_cell")
        assert abs(capped - at_cap) < 1e-6
