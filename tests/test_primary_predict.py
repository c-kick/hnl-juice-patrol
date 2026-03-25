"""Tests for predict_primary() and _predict_current_cycle() in engine/primary.py."""

from __future__ import annotations

import math
import time

from custom_components.juice_patrol.engine.primary import (
    PrimaryPredictionResult,
    predict_primary,
)
from custom_components.juice_patrol.engine.predictions import (
    Confidence,
    PredictionStatus,
)

DAY = 86400.0


def _make_readings(
    values: list[float], interval_days: float = 1.0, start_t: float | None = None
) -> list[dict[str, float]]:
    if start_t is None:
        start_t = time.time() - len(values) * interval_days * DAY
    return [
        {"t": start_t + i * interval_days * DAY, "v": v}
        for i, v in enumerate(values)
    ]


def _make_alkaline_curve(
    n_days: int = 300,
    readings_per_day: int = 2,
    start_pct: float = 100.0,
    end_pct: float = 5.0,
    start_t: float | None = None,
) -> list[dict[str, float]]:
    """Generate a realistic alkaline exponential-ish discharge curve."""
    if start_t is None:
        start_t = time.time() - n_days * DAY
    n = n_days * readings_per_day
    readings = []
    for i in range(n):
        t = start_t + i * (DAY / readings_per_day)
        frac = i / (n - 1)
        v = start_pct * math.exp(-3.0 * frac * (start_pct - end_pct) / start_pct)
        v = max(end_pct, min(start_pct, v))
        readings.append({"t": t, "v": round(v, 1)})
    return readings


# --- Return type ---


def test_returns_primary_prediction_result():
    """predict_primary returns a PrimaryPredictionResult."""
    readings = _make_alkaline_curve(n_days=200)
    result = predict_primary(readings, [], chemistry="alkaline")
    assert isinstance(result, PrimaryPredictionResult)
    assert result.prediction is not None


# --- Insufficient data ---


def test_too_few_readings():
    readings = [{"t": time.time(), "v": 100.0}]
    result = predict_primary(readings, [])
    assert result.prediction.status == PredictionStatus.INSUFFICIENT_DATA


def test_empty_readings():
    result = predict_primary([], [])
    assert result.prediction.status == PredictionStatus.INSUFFICIENT_DATA
    assert result.plume_curves is None


# --- Single level (stuck at 100%) ---


def test_single_level():
    """All readings at 100% → SINGLE_LEVEL."""
    t0 = time.time() - 100 * DAY
    readings = [{"t": t0 + i * DAY, "v": 100.0} for i in range(100)]
    result = predict_primary(readings, [], chemistry="alkaline")
    assert result.prediction.status == PredictionStatus.SINGLE_LEVEL


# --- Basic alkaline prediction ---


def test_alkaline_basic_prediction():
    """Clean alkaline curve should produce a NORMAL prediction with days remaining."""
    readings = _make_alkaline_curve(n_days=200, readings_per_day=2)
    result = predict_primary(readings, [], chemistry="alkaline")
    pred = result.prediction
    assert pred.status == PredictionStatus.NORMAL
    assert pred.estimated_days_remaining is not None
    assert pred.estimated_days_remaining > 0
    assert pred.slope_per_day is not None
    assert pred.slope_per_day < 0  # discharging
    assert pred.chemistry == "alkaline"


def test_alkaline_has_plume():
    """Alkaline prediction should have plume bounds."""
    readings = _make_alkaline_curve(n_days=200, readings_per_day=2)
    result = predict_primary(readings, [], chemistry="alkaline")
    # Should have best/worst bounds (cold start plume from candidates)
    assert result.best_case_days is not None or result.worst_case_days is not None


# --- With prior cycles (S1-like) ---


def test_with_prior_cycle():
    """Prior cycle should produce a ShapePrior-informed prediction."""
    now = time.time()
    # Completed cycle: 280 days ago to 10 days ago
    c1_start = now - 290 * DAY
    c1 = _make_alkaline_curve(n_days=280, readings_per_day=2, start_t=c1_start, end_pct=5.0)

    # Replacement + current cycle: 10 days
    rep_t = c1[-1]["t"] + DAY
    c2_start = rep_t
    c2 = _make_alkaline_curve(n_days=9, readings_per_day=2, start_t=c2_start, start_pct=100.0, end_pct=90.0)

    all_readings = c1 + c2
    result = predict_primary(all_readings, [rep_t], chemistry="alkaline")
    pred = result.prediction
    # Should be NORMAL or at least have some prediction
    assert pred.status in (PredictionStatus.NORMAL, PredictionStatus.FLAT, PredictionStatus.INSUFFICIENT_RANGE)


# --- Chemistry caps (S3-like) ---


def test_lithium_primary_capped_at_medium():
    """Lithium primary confidence should be capped at MEDIUM."""
    readings = _make_alkaline_curve(n_days=200, readings_per_day=2)
    result = predict_primary(readings, [], chemistry="lithium_primary")
    pred = result.prediction
    if pred.confidence != Confidence.INSUFFICIENT_DATA:
        assert pred.confidence in (Confidence.LOW, Confidence.MEDIUM), (
            f"lithium_primary should be capped at MEDIUM, got {pred.confidence}"
        )


def test_coin_cell_capped_at_medium():
    """Coin cell confidence should be capped at MEDIUM."""
    readings = _make_alkaline_curve(n_days=200, readings_per_day=2)
    result = predict_primary(readings, [], chemistry="coin_cell")
    pred = result.prediction
    if pred.confidence != Confidence.INSUFFICIENT_DATA:
        assert pred.confidence in (Confidence.LOW, Confidence.MEDIUM), (
            f"coin_cell should be capped at MEDIUM, got {pred.confidence}"
        )


# --- Dead battery (trailing zeros stripped) ---


def test_dead_battery_zero_days():
    """Battery with trailing 0% readings → days_remaining = 0."""
    now = time.time()
    # Normal decline then death
    readings = _make_alkaline_curve(n_days=200, readings_per_day=2, start_t=now - 210 * DAY, end_pct=2.0)
    # Add 10 days of 0% readings
    for i in range(20):
        readings.append({"t": readings[-1]["t"] + DAY * 0.5, "v": 0.0})

    result = predict_primary(readings, [], chemistry="alkaline")
    pred = result.prediction
    if pred.estimated_days_remaining is not None:
        assert pred.estimated_days_remaining == 0.0


# --- Cold start plume (S6-like) ---


def test_cold_start_plume_has_bounds():
    """No prior cycles → should produce best/worst bounds from candidate models."""
    # 90-day alkaline curve with non-linear shape to provoke model disagreement
    t0 = time.time() - 90 * DAY
    n = 180
    readings = []
    for i in range(n):
        t = t0 + i * 0.5 * DAY
        frac = i / (n - 1)
        # Exponential-ish: models should disagree on extrapolation
        v = 100.0 * math.exp(-1.5 * frac)
        readings.append({"t": t, "v": round(v, 1)})

    result = predict_primary(readings, [], chemistry="alkaline")
    # Cold start: should have some plume information
    assert result.best_case_days is not None or result.worst_case_days is not None, (
        "Cold start prediction should have plume bounds"
    )


# --- Radio silence gap (S7-like) ---


def test_radio_silence_gap_no_split():
    """30-day gap with downward level should NOT split into two cycles."""
    now = time.time()
    t0 = now - 300 * DAY
    readings = []
    # 200 days normal decline
    for d in range(200):
        t = t0 + d * DAY
        v = 100.0 - d * 0.175  # ~65% at day 200
        readings.append({"t": t, "v": round(v, 1)})
    # 30-day gap, then 70 more days
    for d in range(70):
        t = t0 + (230 + d) * DAY
        v = 55.0 - d * 0.5
        v = max(0.0, v)
        readings.append({"t": t, "v": round(v, 1)})

    result = predict_primary(readings, [], chemistry="alkaline")
    pred = result.prediction
    # Should produce a prediction, not insufficient data
    assert pred.status != PredictionStatus.INSUFFICIENT_DATA


# --- Plume structure ---


def test_plume_curves_structure():
    """Plume curves should have median, best, worst keys with point lists."""
    readings = _make_alkaline_curve(n_days=200, readings_per_day=2)
    result = predict_primary(readings, [], chemistry="alkaline")
    if result.plume_curves is not None:
        assert "median" in result.plume_curves
        assert "best" in result.plume_curves
        assert "worst" in result.plume_curves
        median = result.plume_curves["median"]
        assert len(median) > 0
        assert "t" in median[0]
        assert "v" in median[0]


def test_plume_curves_values_bounded():
    """Plume curve values should stay between 0 and 100."""
    readings = _make_alkaline_curve(n_days=200, readings_per_day=2)
    result = predict_primary(readings, [], chemistry="alkaline")
    if result.plume_curves is not None:
        for key in ("median", "best", "worst"):
            curve = result.plume_curves.get(key)
            if curve is not None:
                for pt in curve:
                    assert 0.0 <= pt["v"] <= 100.0, (
                        f"Plume {key} value {pt['v']} out of bounds"
                    )


# --- Regression: predict_primary doesn't crash on various chemistries ---


def test_all_primary_chemistries():
    """predict_primary runs without error for all primary chemistries."""
    readings = _make_alkaline_curve(n_days=150, readings_per_day=2)
    for chem in ("alkaline", "lithium_primary", "coin_cell", None):
        result = predict_primary(readings, [], chemistry=chem)
        assert isinstance(result, PrimaryPredictionResult), f"Failed for chemistry={chem}"


# --- Multiple replacement cycles ---


def test_three_cycles_prediction():
    """Three cycles: two completed, one ongoing. Should use shape prior."""
    now = time.time()
    # Cycle 1: 250 days
    c1_start = now - 600 * DAY
    c1 = _make_alkaline_curve(n_days=250, readings_per_day=1, start_t=c1_start, end_pct=5.0)
    rep1_t = c1[-1]["t"] + DAY

    # Cycle 2: 280 days
    c2_start = rep1_t
    c2 = _make_alkaline_curve(n_days=280, readings_per_day=1, start_t=c2_start, end_pct=5.0)
    rep2_t = c2[-1]["t"] + DAY

    # Cycle 3: 50 days ongoing
    c3_start = rep2_t
    c3 = _make_alkaline_curve(n_days=50, readings_per_day=1, start_t=c3_start, start_pct=100.0, end_pct=85.0)

    all_readings = c1 + c2 + c3
    result = predict_primary(all_readings, [rep1_t, rep2_t], chemistry="alkaline")
    pred = result.prediction
    assert pred.status != PredictionStatus.INSUFFICIENT_DATA
