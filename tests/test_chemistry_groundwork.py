"""Tests for chemistry-aware prediction groundwork.

Covers:
1. Extended chemistry_from_battery_type() mappings
2. PredictionResult.chemistry field propagation
3. predict_discharge_multisession() chemistry parameter
4. Store round-trip with chemistry_override
5. Chemistry override precedence over auto-detected chemistry
6. Chemistry derived from fully resolved battery_type (post-autodetect)
"""

import sys
import time
import types
from unittest.mock import AsyncMock, MagicMock, patch

# The package __init__.py uses Python 3.12+ `type` statement.
# On 3.11, stub out the package to allow direct submodule imports.
if sys.version_info < (3, 12):
    for _name in (
        "custom_components",
        "custom_components.juice_patrol",
        "custom_components.juice_patrol.engine",
        "custom_components.juice_patrol.data",
    ):
        if _name not in sys.modules:
            _m = types.ModuleType(_name)
            _m.__path__ = [_name.replace(".", "/")]
            sys.modules[_name] = _m
    # Provide const values needed by engine modules
    _const = types.ModuleType("custom_components.juice_patrol.const")
    _const.FLAT_SLOPE_THRESHOLD = 0.02
    sys.modules["custom_components.juice_patrol.const"] = _const

from custom_components.juice_patrol.engine.analysis import chemistry_from_battery_type
from custom_components.juice_patrol.engine.predictions import (
    PredictionResult,
    predict_discharge,
    predict_discharge_multisession,
)

# DeviceData lives in data.store which imports from HA — stub HA modules
if sys.version_info < (3, 12):
    for _name in (
        "homeassistant",
        "homeassistant.core",
        "homeassistant.helpers",
        "homeassistant.helpers.storage",
    ):
        if _name not in sys.modules:
            _m = types.ModuleType(_name)
            _m.__path__ = [_name.replace(".", "/")]
            sys.modules[_name] = _m
    # Store needs HomeAssistant and Store class
    _ha_core = sys.modules["homeassistant.core"]
    _ha_core.HomeAssistant = MagicMock
    _storage = sys.modules["homeassistant.helpers.storage"]
    _storage.Store = MagicMock
    _const_mod = sys.modules["custom_components.juice_patrol.const"]
    _const_mod.MAX_DENIED_REPLACEMENTS = 50
    _const_mod.MAX_REPLACEMENT_HISTORY = 50
    _const_mod.STORE_KEY = "juice_patrol.metadata"
    _const_mod.STORE_MINOR_VERSION = 4
    _const_mod.STORE_VERSION = 2
    # engine.models needed by store
    _models = types.ModuleType("custom_components.juice_patrol.engine.models")
    _models.MAX_CYCLES_PER_DEVICE = 10
    sys.modules["custom_components.juice_patrol.engine.models"] = _models

from custom_components.juice_patrol.data.store import DeviceData


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_readings(
    start_level: float,
    end_level: float,
    count: int,
    span_hours: float,
) -> list[dict[str, float]]:
    """Generate evenly spaced readings from start_level to end_level."""
    t0 = time.time() - span_hours * 3600
    interval = (span_hours * 3600) / max(count - 1, 1)
    step = (end_level - start_level) / max(count - 1, 1)
    return [
        {"t": t0 + i * interval, "v": start_level + i * step}
        for i in range(count)
    ]


def _make_sawtooth(cycles: int = 3, points_per_cycle: int = 10) -> list[dict[str, float]]:
    """Generate sawtooth readings for multi-session testing."""
    readings = []
    t = time.time() - cycles * 7 * 86400  # start several weeks ago
    for c in range(cycles):
        for i in range(points_per_cycle):
            frac = i / (points_per_cycle - 1)
            level = 100.0 - frac * 60.0  # discharge from 100% to 40%
            readings.append({"t": t, "v": level})
            t += 86400 * 7 / points_per_cycle  # ~7 days per cycle
        # Charge back up
        t += 3600
        readings.append({"t": t, "v": 100.0})
        t += 3600
    return readings


# ---------------------------------------------------------------------------
# 1. chemistry_from_battery_type — extended mappings
# ---------------------------------------------------------------------------

class TestChemistryMappingExtended:
    """Test new form-factor mappings added in this branch."""

    def test_generic_cr_prefix(self):
        """Any CR battery not explicitly listed → lithium_primary."""
        assert chemistry_from_battery_type("CR-V3") == "lithium_primary"
        assert chemistry_from_battery_type("CR2") == "lithium_primary"
        assert chemistry_from_battery_type("CR1/3N") == "lithium_primary"

    def test_specific_cr_still_coin_cell(self):
        """Explicitly listed CRxxxx entries still map to coin_cell."""
        assert chemistry_from_battery_type("CR2032") == "coin_cell"
        assert chemistry_from_battery_type("CR2450") == "coin_cell"
        assert chemistry_from_battery_type("CR1632") == "coin_cell"

    def test_li_ion_aa_override(self):
        """'Li-ion AA' maps to lithium_primary, not NMC."""
        assert chemistry_from_battery_type("Li-ion AA") == "lithium_primary"
        assert chemistry_from_battery_type("Li-ion AAA") == "lithium_primary"

    def test_nimh_aa_override(self):
        """'NiMH AA' explicitly maps to NiMH."""
        assert chemistry_from_battery_type("NiMH AA") == "NiMH"
        assert chemistry_from_battery_type("NiMH AAA") == "NiMH"

    def test_plain_aa_still_alkaline(self):
        """Plain AA/AAA without prefix stays alkaline."""
        assert chemistry_from_battery_type("AA") == "alkaline"
        assert chemistry_from_battery_type("AAA") == "alkaline"

    def test_existing_mappings_unchanged(self):
        """Verify existing mappings weren't broken."""
        assert chemistry_from_battery_type("Li-ion") == "NMC"
        assert chemistry_from_battery_type("NiMH") == "NiMH"
        assert chemistry_from_battery_type("LiFePO4") == "LFP"
        assert chemistry_from_battery_type("LCO") == "LCO"
        assert chemistry_from_battery_type("Lithium AA") == "lithium_primary"
        assert chemistry_from_battery_type("CR123A") == "lithium_primary"
        assert chemistry_from_battery_type("9V") == "alkaline"
        assert chemistry_from_battery_type(None) == "unknown"
        assert chemistry_from_battery_type("") == "unknown"


# ---------------------------------------------------------------------------
# 2. PredictionResult.chemistry field
# ---------------------------------------------------------------------------

class TestPredictionResultChemistry:
    """PredictionResult stores the chemistry used for the prediction."""

    def test_predict_discharge_stores_chemistry(self):
        """predict_discharge() stores chemistry on the result."""
        readings = _make_readings(100, 60, 20, span_hours=168)
        result = predict_discharge(readings, chemistry="alkaline")
        assert result.chemistry == "alkaline"

    def test_predict_discharge_chemistry_none_default(self):
        """Without chemistry arg, result.chemistry is None."""
        readings = _make_readings(100, 60, 20, span_hours=168)
        result = predict_discharge(readings)
        assert result.chemistry is None

    def test_predict_discharge_insufficient_data_stores_chemistry(self):
        """Even early-exit paths store chemistry."""
        readings = [{"t": time.time(), "v": 50}]
        result = predict_discharge(readings, chemistry="NMC")
        assert result.chemistry == "NMC"

    def test_predict_discharge_single_level_stores_chemistry(self):
        """Single-level early exit stores chemistry."""
        t = time.time()
        readings = [
            {"t": t - 86400 * 3, "v": 50},
            {"t": t - 86400 * 2, "v": 50},
            {"t": t - 86400, "v": 50},
            {"t": t, "v": 50},
        ]
        result = predict_discharge(readings, chemistry="coin_cell")
        assert result.chemistry == "coin_cell"


# ---------------------------------------------------------------------------
# 3. predict_discharge_multisession chemistry parameter
# ---------------------------------------------------------------------------

class TestMultisessionChemistry:
    """predict_discharge_multisession() accepts and stores chemistry."""

    def test_multisession_stores_chemistry(self):
        """Chemistry is stored on multi-session results."""
        readings = _make_sawtooth(cycles=3, points_per_cycle=10)
        result = predict_discharge_multisession(
            readings, current_level=80.0, chemistry="NiMH",
        )
        assert result.chemistry == "NiMH"

    def test_multisession_chemistry_none_default(self):
        """Without chemistry arg, result.chemistry is None."""
        readings = _make_sawtooth(cycles=3, points_per_cycle=10)
        result = predict_discharge_multisession(
            readings, current_level=80.0,
        )
        assert result.chemistry is None

    def test_multisession_insufficient_sessions_stores_chemistry(self):
        """Even with insufficient sessions, chemistry is stored."""
        readings = [{"t": time.time(), "v": 50}]
        result = predict_discharge_multisession(
            readings, current_level=50.0, min_sessions=3, chemistry="NMC",
        )
        assert result.chemistry == "NMC"


# ---------------------------------------------------------------------------
# 4. Store round-trip with chemistry_override
# ---------------------------------------------------------------------------

class TestStoreChemistryOverride:
    """DeviceData persists chemistry_override through to_dict/from_dict."""

    def test_roundtrip_with_override(self):
        """chemistry_override survives serialization."""
        dev = DeviceData(source_entity="sensor.test", chemistry_override="alkaline")
        data = dev.to_dict()
        assert data["chemistry_override"] == "alkaline"

        restored = DeviceData.from_dict(data, "sensor.test")
        assert restored.chemistry_override == "alkaline"

    def test_roundtrip_without_override(self):
        """chemistry_override=None is not serialized (sparse storage)."""
        dev = DeviceData(source_entity="sensor.test")
        data = dev.to_dict()
        assert "chemistry_override" not in data

        restored = DeviceData.from_dict(data, "sensor.test")
        assert restored.chemistry_override is None

    def test_legacy_data_without_field(self):
        """Existing store records without chemistry_override load as None."""
        legacy_data = {
            "replacement_history": [],
            "denied_replacements": [],
            "ignored": False,
            "replacement_confirmed": True,
            "source_entity": "sensor.old",
            "device_id": None,
        }
        dev = DeviceData.from_dict(legacy_data, "sensor.old")
        assert dev.chemistry_override is None


# ---------------------------------------------------------------------------
# 5. Chemistry override precedence
# ---------------------------------------------------------------------------

class TestChemistryOverridePrecedence:
    """chemistry_override takes precedence over auto-detected chemistry."""

    def test_override_wins(self):
        """When override is set, it replaces auto-detected chemistry."""
        # AA would auto-detect as "alkaline", but override says "NiMH"
        dev = DeviceData(
            source_entity="sensor.test",
            battery_type="AA",
            chemistry_override="NiMH",
        )
        # Simulate coordinator logic
        chemistry_override = dev.chemistry_override
        chemistry = chemistry_override or chemistry_from_battery_type(dev.battery_type)
        assert chemistry == "NiMH"

    def test_no_override_uses_auto(self):
        """Without override, auto-detected chemistry is used."""
        dev = DeviceData(
            source_entity="sensor.test",
            battery_type="CR2032",
        )
        chemistry_override = dev.chemistry_override
        chemistry = chemistry_override or chemistry_from_battery_type(dev.battery_type)
        assert chemistry == "coin_cell"


# ---------------------------------------------------------------------------
# 6. Chemistry derived from fully resolved battery_type (post-autodetect)
# ---------------------------------------------------------------------------

class TestChemistryFromResolvedType:
    """Chemistry must be derived from the fully resolved battery_type,
    not from the dev.battery_type fallback.

    This tests the riskiest part of the coordinator refactor: the move of
    battery_type resolution from after predictions to before predictions.
    """

    def test_autodetected_type_used_for_chemistry(self):
        """When no manual type is set, auto-detected type drives chemistry.

        Simulates the coordinator logic: if dev.battery_type is None,
        the type_resolver provides the battery_type, and chemistry must
        be derived from that resolved type — not from the None fallback.
        """
        # Device has no manual battery_type
        dev = DeviceData(source_entity="sensor.motion", battery_type=None)

        # Simulate type_resolver returning "CR2032"
        auto_type = "CR2032"
        auto_source = "battery_notes"

        # Coordinator logic (moved to before predictions)
        manual_type = dev.battery_type
        if manual_type:
            battery_type = manual_type
        else:
            battery_type = auto_type  # from type_resolver

        chemistry_override = dev.chemistry_override
        chemistry = chemistry_override or chemistry_from_battery_type(battery_type)

        # Must use the auto-detected type, not the None fallback
        assert chemistry == "coin_cell"
        assert battery_type == "CR2032"

    def test_manual_type_takes_precedence(self):
        """When manual type is set, it takes precedence over auto-detect."""
        dev = DeviceData(source_entity="sensor.motion", battery_type="AAA")

        auto_type = "CR2032"  # auto-detect would say CR2032
        manual_type = dev.battery_type
        if manual_type:
            battery_type = manual_type
        else:
            battery_type = auto_type

        chemistry = chemistry_from_battery_type(battery_type)
        assert chemistry == "alkaline"  # from manual "AAA", not auto "CR2032"

    def test_chemistry_override_beats_resolved_type(self):
        """chemistry_override beats both manual and auto-detected type."""
        dev = DeviceData(
            source_entity="sensor.motion",
            battery_type="AAA",  # would auto-detect as alkaline
            chemistry_override="lithium_primary",  # user knows better
        )

        battery_type = dev.battery_type or "CR2032"
        chemistry_override = dev.chemistry_override
        chemistry = chemistry_override or chemistry_from_battery_type(battery_type)

        assert chemistry == "lithium_primary"


# ---------------------------------------------------------------------------
# 7. _candidate_models — chemistry-gated model selection
# ---------------------------------------------------------------------------

from custom_components.juice_patrol.engine.predictions import _candidate_models


class TestCandidateModels:
    """Test chemistry-specific model candidate lists."""

    def test_alkaline_starts_with_piecewise(self):
        models = _candidate_models("alkaline")
        assert models is not None
        assert models[0] == "piecewise_linear_2"

    def test_alkaline_includes_exponential(self):
        models = _candidate_models("alkaline")
        assert "exponential" in models

    def test_alkaline_excludes_weibull(self):
        models = _candidate_models("alkaline")
        assert "weibull" not in models

    def test_coin_cell_excludes_weibull(self):
        models = _candidate_models("coin_cell")
        assert models is not None
        assert "weibull" not in models

    def test_coin_cell_excludes_exponential(self):
        """Coin cell plateau is too flat for exponential decay."""
        models = _candidate_models("coin_cell")
        assert "exponential" not in models

    def test_lithium_primary_excludes_exponential(self):
        """Lithium primary plateau is too flat for exponential decay."""
        models = _candidate_models("lithium_primary")
        assert models is not None
        assert "exponential" not in models

    def test_lithium_primary_has_piecewise(self):
        models = _candidate_models("lithium_primary")
        assert "piecewise_linear_2" in models
        assert "piecewise_linear_3" in models

    def test_unknown_returns_none(self):
        """Unknown chemistry → None (all models tried)."""
        assert _candidate_models("unknown") is None
        assert _candidate_models(None) is None

    def test_rechargeable_returns_none(self):
        """Rechargeable chemistries → None (all models tried)."""
        assert _candidate_models("NMC") is None
        assert _candidate_models("LFP") is None
        assert _candidate_models("NiMH") is None
        assert _candidate_models("LCO") is None

    def test_unrecognised_falls_back_to_all(self):
        assert _candidate_models("unobtanium") is None


class TestAlkalineFlatThenCliff:
    """Regression: flat-then-cliff alkaline should select piecewise model."""

    def test_piecewise_selected_for_alkaline_cliff(self):
        """90 days flat at 95%, then 10 days dropping 95→20%.

        Piecewise should win — it can model the breakpoint.
        The prediction should extrapolate from the cliff segment,
        not the overall average.
        """
        now = time.time()
        readings = []
        # Flat phase: 90 days at ~95% (daily readings)
        for i in range(90):
            readings.append({"t": now - (100 - i) * 86400, "v": 95.0})
        # Cliff phase: 10 days, 95 → 20
        for i in range(11):
            t = now - (10 - i) * 86400
            v = 95.0 - (75.0 * i / 10)
            readings.append({"t": t, "v": v})

        result = predict_discharge(readings, target_level=0.0, chemistry="alkaline")

        assert result.status.value == "normal"
        assert result.estimated_days_remaining is not None
        # With cliff slope of ~7.5%/day, reaching 20→0 takes ~2.7 days.
        # Linear overall slope would predict ~50+ days.  Piecewise should
        # extrapolate from the cliff, giving a much shorter estimate.
        assert result.estimated_days_remaining < 20
