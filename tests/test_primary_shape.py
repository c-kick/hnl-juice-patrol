"""Tests for ShapePrior and learn_discharge_shape() in engine/primary.py."""

from __future__ import annotations

import math

from custom_components.juice_patrol.engine.primary import (
    PrimaryCycle,
    ShapePrior,
    _quartiles,
    learn_discharge_shape,
    shape_prior_to_class_prior,
)

DAY = 86400.0


def _make_readings(
    values: list[float], interval_days: float = 1.0, start_t: float = 0.0
) -> list[dict[str, float]]:
    return [
        {"t": start_t + i * interval_days * DAY, "v": v}
        for i, v in enumerate(values)
    ]


def _make_alkaline_cycle(
    duration_days: int = 300,
    readings_per_day: int = 2,
    start_t: float = 0.0,
    noise: float = 0.0,
) -> PrimaryCycle:
    """Generate a realistic alkaline discharge cycle (gradual then cliff)."""
    import random

    n = duration_days * readings_per_day
    readings = []
    for i in range(n):
        t = start_t + i * (DAY / readings_per_day)
        # Exponential-ish decay: 100 → ~5 over duration
        frac = i / (n - 1)
        v = 100.0 * math.exp(-3.0 * frac)  # drops to ~5% at end
        if noise:
            v += random.uniform(-noise, noise)
        v = max(0.0, min(100.0, v))
        readings.append({"t": t, "v": round(v, 1)})
    return PrimaryCycle(
        readings=readings,
        start_t=readings[0]["t"],
        end_t=readings[-1]["t"],
        is_completed=True,
    )


# --- ShapePrior dataclass ---


def test_shape_prior_fields():
    sp = ShapePrior(
        median_params={"a": 100.0, "b": -0.01, "c": 5.0},
        param_spread={"a": 2.0, "b": 0.002, "c": 1.0},
        n_cycles=3,
        median_duration=280.0,
    )
    assert sp.n_cycles == 3
    assert sp.median_duration == 280.0
    assert "a" in sp.median_params


# --- learn_discharge_shape ---


def test_no_completed_cycles():
    """Empty list → None."""
    assert learn_discharge_shape([]) is None


def test_single_short_cycle():
    """Cycle with < 3 readings → None (can't fit)."""
    cycle = PrimaryCycle(
        readings=[{"t": 0.0, "v": 100.0}, {"t": DAY, "v": 90.0}],
        start_t=0.0,
        end_t=DAY,
        is_completed=True,
    )
    assert learn_discharge_shape([cycle]) is None


def test_single_valid_cycle():
    """One clean alkaline cycle should produce a ShapePrior."""
    cycle = _make_alkaline_cycle(duration_days=200, readings_per_day=2)
    result = learn_discharge_shape([cycle], chemistry="alkaline")
    assert result is not None
    assert isinstance(result, ShapePrior)
    assert result.n_cycles == 1
    assert result.median_duration > 0
    assert len(result.median_params) > 0
    # Single cycle → spread is 0 for all params
    for v in result.param_spread.values():
        assert v == 0.0


def test_multiple_cycles_aggregation():
    """Multiple cycles should aggregate parameters."""
    cycles = [
        _make_alkaline_cycle(duration_days=250, start_t=0),
        _make_alkaline_cycle(duration_days=300, start_t=300 * DAY),
        _make_alkaline_cycle(duration_days=280, start_t=700 * DAY),
    ]
    result = learn_discharge_shape(cycles, chemistry="alkaline")
    assert result is not None
    assert result.n_cycles >= 1
    # Median duration should be in the ballpark
    assert 200.0 < result.median_duration < 350.0
    # With multiple cycles, some params should have non-zero spread
    # (unless all cycles are identical, which they roughly are)


def test_multiple_cycles_param_spread():
    """Different-duration cycles produce non-zero parameter spread."""
    # Cycles with meaningfully different shapes
    cycles = [
        _make_alkaline_cycle(duration_days=150, readings_per_day=2, start_t=0),
        _make_alkaline_cycle(duration_days=350, readings_per_day=2, start_t=400 * DAY),
        _make_alkaline_cycle(duration_days=200, readings_per_day=2, start_t=800 * DAY),
        _make_alkaline_cycle(duration_days=300, readings_per_day=2, start_t=1100 * DAY),
    ]
    result = learn_discharge_shape(cycles, chemistry="alkaline")
    assert result is not None
    # 4 cycles should give us spread via IQR
    has_nonzero_spread = any(v > 0 for v in result.param_spread.values())
    assert has_nonzero_spread, "Different durations should produce parameter spread"


def test_chemistry_affects_model_selection():
    """Different chemistry should potentially select different models."""
    cycle = _make_alkaline_cycle(duration_days=200)
    result_alk = learn_discharge_shape([cycle], chemistry="alkaline")
    result_none = learn_discharge_shape([cycle], chemistry=None)
    # Both should succeed
    assert result_alk is not None
    assert result_none is not None


def test_mixed_quality_cycles():
    """Mix of good and bad cycles: bad ones skipped, good ones used."""
    good = _make_alkaline_cycle(duration_days=200)
    # Too-short cycle (2 readings)
    bad = PrimaryCycle(
        readings=[{"t": 0.0, "v": 100.0}, {"t": DAY, "v": 90.0}],
        start_t=0.0,
        end_t=DAY,
        is_completed=True,
    )
    result = learn_discharge_shape([bad, good], chemistry="alkaline")
    assert result is not None
    assert result.n_cycles == 1  # only the good cycle


# --- shape_prior_to_class_prior ---


def test_conversion_to_class_prior():
    """ShapePrior → ClassPrior preserves fields correctly."""
    sp = ShapePrior(
        median_params={"a": 100.0, "b": -0.01, "c": 5.0},
        param_spread={"a": 2.0, "b": 0.002, "c": 1.0},
        n_cycles=3,
        median_duration=280.0,
    )
    cp = shape_prior_to_class_prior(sp, "exponential")
    assert cp.model_name == "exponential"
    assert cp.median_params == sp.median_params
    assert cp.iqr_params == sp.param_spread
    assert cp.median_duration_days == sp.median_duration
    assert cp.cycle_count == 3


# --- _quartiles helper ---


def test_quartiles_basic():
    q1, q3 = _quartiles([1, 2, 3, 4, 5, 6, 7])
    assert q1 == 2.0  # median of [1,2,3]
    assert q3 == 6.0  # median of [5,6,7]


def test_quartiles_even():
    q1, q3 = _quartiles([1, 2, 3, 4, 5, 6])
    assert q1 == 2.0  # median of [1,2,3]
    assert q3 == 5.0  # median of [4,5,6]


def test_quartiles_small():
    q1, q3 = _quartiles([10, 20])
    assert q1 == 10.0
    assert q3 == 20.0


# --- Integration: learn_discharge_shape → shape_prior_to_class_prior ---


def test_end_to_end_prior_pipeline():
    """Full pipeline: cycles → ShapePrior → ClassPrior for use in fitting."""
    cycles = [
        _make_alkaline_cycle(duration_days=250, start_t=0),
        _make_alkaline_cycle(duration_days=300, start_t=300 * DAY),
    ]
    shape = learn_discharge_shape(cycles, chemistry="alkaline")
    assert shape is not None

    cp = shape_prior_to_class_prior(shape, shape.median_params.get("model", "exponential") or "exponential")
    # ClassPrior can be passed to fit_discharge_curve (just verify structure)
    assert cp.median_params is not None
    assert cp.cycle_count == shape.n_cycles
