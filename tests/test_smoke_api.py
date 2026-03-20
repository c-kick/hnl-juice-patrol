"""Smoke test: verify the public API contract hasn't broken."""

import time

from custom_components.juice_patrol.engine import (
    ChargePredictionResult,
    Confidence,
    PredictionResult,
    PredictionStatus,
    analyze_battery,
    compute_reliability,
    detect_replacement_jumps,
    extract_charging_segment,
    extract_discharge_sessions,
    predict_charge,
    predict_discharge,
    predict_discharge_multisession,
)


def _make_readings(
    start: float, end: float, count: int, span_hours: float,
) -> list[dict[str, float]]:
    t0 = time.time() - span_hours * 3600
    interval = (span_hours * 3600) / max(count - 1, 1)
    step = (end - start) / max(count - 1, 1)
    return [
        {"t": t0 + i * interval, "v": start + i * step}
        for i in range(count)
    ]


class TestDischargeApiContract:
    """Verify predict_discharge returns correct PredictionResult."""

    def test_normal_discharge(self):
        """10-point decline 100→90 over 30 days → NORMAL, slope<0, days>0."""
        readings = _make_readings(100.0, 90.0, 10, span_hours=24 * 30)
        result = predict_discharge(readings, target_level=0.0)

        assert isinstance(result, PredictionResult)
        assert result.status == PredictionStatus.NORMAL
        assert result.slope_per_day is not None
        assert result.slope_per_day < 0
        assert result.estimated_days_remaining is not None
        assert result.estimated_days_remaining > 0
        assert result.r_squared is not None
        assert result.confidence in (
            Confidence.HIGH, Confidence.MEDIUM, Confidence.LOW,
        )
        assert result.data_points_used > 0
        assert result.t0 is not None


class TestChargeApiContract:
    """Verify predict_charge returns correct ChargePredictionResult."""

    def test_normal_charge(self):
        """10-point rise 20→80 over 6 hours → NORMAL, hours_to_full>0."""
        readings = _make_readings(20.0, 80.0, 10, span_hours=6)
        result = predict_charge(readings)

        assert isinstance(result, ChargePredictionResult)
        assert result.status == PredictionStatus.NORMAL
        assert result.slope_per_hour is not None
        assert result.slope_per_hour > 0
        assert result.estimated_hours_to_full is not None
        assert result.estimated_hours_to_full > 0
        assert result.estimated_full_timestamp is not None


class TestAllImportsAccessible:
    """Verify all public symbols are importable and callable/instantiable."""

    def test_enums(self):
        assert PredictionStatus.NORMAL == "normal"
        assert Confidence.HIGH == "high"

    def test_functions_callable(self):
        """All public functions exist and are callable."""
        assert callable(predict_discharge)
        assert callable(predict_discharge_multisession)
        assert callable(predict_charge)
        assert callable(extract_charging_segment)
        assert callable(compute_reliability)
        assert callable(analyze_battery)
        assert callable(detect_replacement_jumps)
        assert callable(extract_discharge_sessions)
