"""Tests for chemistry-aware model candidate selection.

Verifies _candidate_models returns the correct candidate list for each
chemistry class: primary cells get chemistry-specific restricted sets,
rechargeable and unknown chemistries get all models.
"""

from custom_components.juice_patrol.engine.predictions import (
    _candidate_models,
    _CHEMISTRY_CANDIDATES,
)


class TestCandidateModels:
    """Chemistry-aware model candidate selection."""

    def test_alkaline_returns_chemistry_specific_list(self):
        """Alkaline (primary cell) → restricted candidate list."""
        result = _candidate_models("alkaline")
        assert result == _CHEMISTRY_CANDIDATES["alkaline"]
        assert "weibull" not in result

    def test_alkaline_includes_exponential(self):
        """Alkaline gets exponential (captures steepening near EOL)."""
        result = _candidate_models("alkaline")
        assert "exponential" in result

    def test_lithium_primary_excludes_exponential(self):
        """Lithium primary plateau is too flat for exponential decay."""
        result = _candidate_models("lithium_primary")
        assert result == _CHEMISTRY_CANDIDATES["lithium_primary"]
        assert "exponential" not in result

    def test_coin_cell_excludes_exponential(self):
        """Coin cell plateau is too flat for exponential decay."""
        result = _candidate_models("coin_cell")
        assert result == _CHEMISTRY_CANDIDATES["coin_cell"]
        assert "exponential" not in result

    def test_nmc_returns_all_models(self):
        """NMC (rechargeable) → None (all models)."""
        assert _candidate_models("NMC") is None

    def test_lfp_returns_all_models(self):
        """LFP (rechargeable) → None (all models)."""
        assert _candidate_models("LFP") is None

    def test_nimh_returns_all_models(self):
        """NiMH (rechargeable) → None (all models)."""
        assert _candidate_models("NiMH") is None

    def test_lco_returns_all_models(self):
        """LCO (rechargeable) → None (all models)."""
        assert _candidate_models("LCO") is None

    def test_unknown_returns_all_models(self):
        """Unknown chemistry → None (all models)."""
        assert _candidate_models("unknown") is None

    def test_none_returns_all_models(self):
        """None chemistry → None (all models)."""
        assert _candidate_models(None) is None

    def test_all_primary_have_piecewise(self):
        """All primary chemistries should have piecewise linear models."""
        for chem in _CHEMISTRY_CANDIDATES:
            result = _candidate_models(chem)
            assert any("piecewise" in m for m in result), f"{chem} missing piecewise"
