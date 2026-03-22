"""Tests for chemistry-aware model candidate selection (Phase 1).

Verifies _candidate_models returns the correct candidate list for each
chemistry class: primary cells get a restricted set, rechargeable and
unknown chemistries get all models.
"""

from custom_components.juice_patrol.engine.predictions import (
    _candidate_models,
    _PRIMARY_CHEMISTRY_MODELS,
)


class TestCandidateModels:
    """Chemistry-aware model candidate selection."""

    def test_alkaline_returns_primary_models(self):
        """Alkaline (primary cell) → restricted candidate list."""
        result = _candidate_models("alkaline")
        assert result == _PRIMARY_CHEMISTRY_MODELS
        assert "weibull" not in result

    def test_lithium_primary_returns_primary_models(self):
        """Lithium primary → restricted candidate list."""
        result = _candidate_models("lithium_primary")
        assert result == _PRIMARY_CHEMISTRY_MODELS

    def test_coin_cell_returns_primary_models(self):
        """Coin cell → restricted candidate list."""
        result = _candidate_models("coin_cell")
        assert result == _PRIMARY_CHEMISTRY_MODELS

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

    def test_primary_models_include_exponential(self):
        """Primary cells should still have exponential available."""
        result = _candidate_models("alkaline")
        assert "exponential" in result

    def test_primary_models_include_piecewise(self):
        """Primary cells should have piecewise linear models."""
        result = _candidate_models("alkaline")
        assert any("piecewise" in m for m in result)
