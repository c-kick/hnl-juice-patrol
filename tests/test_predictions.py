"""Tests for Juice Patrol prediction engine."""

import time

from custom_components.juice_patrol.predictions import (
    Confidence,
    PredictionResult,
    PredictionStatus,
    compute_reliability,
    predict_discharge,
)


def _make_readings(
    start_level: float,
    end_level: float,
    count: int,
    span_hours: float,
    start_time: float | None = None,
) -> list[dict[str, float]]:
    """Generate evenly spaced readings from start_level to end_level."""
    t0 = start_time or (time.time() - span_hours * 3600)
    interval = (span_hours * 3600) / max(count - 1, 1)
    step = (end_level - start_level) / max(count - 1, 1)
    return [
        {"t": t0 + i * interval, "v": start_level + i * step}
        for i in range(count)
    ]


class TestPredictDischarge:
    """Test predict_discharge function."""

    def test_insufficient_readings(self):
        """Return insufficient data with fewer than min_readings."""
        readings = [{"t": 1.0, "v": 90.0}, {"t": 2.0, "v": 89.0}]
        result = predict_discharge(readings, min_readings=3)
        assert result.confidence == Confidence.INSUFFICIENT_DATA
        assert result.status == PredictionStatus.INSUFFICIENT_DATA
        assert result.slope_per_day is None
        assert result.estimated_days_remaining is None

    def test_empty_readings(self):
        result = predict_discharge([])
        assert result.confidence == Confidence.INSUFFICIENT_DATA
        assert result.data_points_used == 0

    def test_insufficient_timespan(self):
        """Return insufficient data when timespan is too short."""
        now = time.time()
        readings = [
            {"t": now - 3600, "v": 100.0},
            {"t": now - 1800, "v": 99.5},
            {"t": now, "v": 99.0},
        ]
        result = predict_discharge(readings, min_timespan_hours=24.0)
        assert result.confidence == Confidence.INSUFFICIENT_DATA

    def test_normal_discharge(self):
        """Predict time to empty for a normally discharging battery."""
        readings = _make_readings(100.0, 80.0, count=20, span_hours=24 * 10)
        result = predict_discharge(readings, low_threshold=20.0)
        assert result.status == PredictionStatus.NORMAL
        assert result.slope_per_day is not None
        assert result.slope_per_day < 0  # Discharging
        assert result.estimated_days_remaining is not None
        assert result.estimated_days_remaining > 0
        assert result.estimated_empty_timestamp is not None
        assert result.r_squared is not None and result.r_squared > 0.9

    def test_charging_battery(self):
        """Detect charging when level is increasing."""
        readings = _make_readings(50.0, 90.0, count=10, span_hours=48)
        result = predict_discharge(readings)
        assert result.status == PredictionStatus.CHARGING
        assert result.slope_per_day > 0
        assert result.estimated_days_remaining is None

    def test_flat_battery(self):
        """Detect flat when drain is extremely low."""
        readings = _make_readings(95.0, 94.99, count=10, span_hours=24 * 14)
        result = predict_discharge(readings)
        assert result.status == PredictionStatus.FLAT
        assert result.estimated_days_remaining is None

    def test_already_below_threshold(self):
        """Handle battery already below threshold."""
        readings = _make_readings(30.0, 10.0, count=10, span_hours=24 * 7)
        result = predict_discharge(readings, low_threshold=20.0)
        assert result.status == PredictionStatus.NORMAL
        # Model should show 0 or very low remaining
        assert result.estimated_days_remaining is not None
        assert result.estimated_days_remaining <= 1.0

    def test_slope_per_hour(self):
        """Check slope_per_hour is correctly derived from slope_per_day."""
        readings = _make_readings(100.0, 76.0, count=25, span_hours=24 * 12)
        result = predict_discharge(readings)
        assert result.slope_per_hour is not None
        assert result.slope_per_day is not None
        assert abs(result.slope_per_hour - result.slope_per_day / 24.0) < 0.001

    def test_data_points_used(self):
        """Verify data_points_used reflects actual count after outlier removal."""
        readings = _make_readings(100.0, 80.0, count=15, span_hours=24 * 10)
        result = predict_discharge(readings)
        assert result.data_points_used > 0
        assert result.data_points_used <= 15

    def test_outlier_rejection(self):
        """Outliers should not break predictions."""
        readings = _make_readings(100.0, 80.0, count=20, span_hours=24 * 10)
        # Inject outliers
        readings[5]["v"] = 5.0
        readings[15]["v"] = 200.0
        result = predict_discharge(readings, low_threshold=20.0)
        # Should still produce a reasonable prediction despite outliers
        assert result.status == PredictionStatus.NORMAL
        assert result.estimated_days_remaining is not None


class TestConfidenceClassification:
    """Test confidence levels."""

    def test_high_confidence(self):
        """High confidence: good R² + enough data span."""
        readings = _make_readings(100.0, 70.0, count=50, span_hours=24 * 14)
        result = predict_discharge(readings)
        assert result.confidence == Confidence.HIGH

    def test_medium_confidence(self):
        """Medium confidence: moderate data."""
        readings = _make_readings(100.0, 85.0, count=8, span_hours=24 * 4)
        result = predict_discharge(readings)
        assert result.confidence in (Confidence.MEDIUM, Confidence.HIGH)

    def test_low_confidence(self):
        """Low confidence: minimal data."""
        # Noisy data with short span to get low R²
        now = time.time()
        readings = [
            {"t": now - 86400 * 1.5, "v": 95.0},
            {"t": now - 86400 * 1.0, "v": 92.0},
            {"t": now - 43200, "v": 97.0},
            {"t": now, "v": 88.0},
        ]
        result = predict_discharge(readings, min_timespan_hours=1.0)
        assert result.confidence in (Confidence.LOW, Confidence.MEDIUM)


class TestComputeReliability:
    """Test the reliability scoring function."""

    def test_no_data(self):
        score = compute_reliability(0, 0.0, None, Confidence.INSUFFICIENT_DATA)
        assert score == 0

    def test_max_reliability(self):
        """Lots of data + long span + high R² = high reliability."""
        score = compute_reliability(200, 24 * 60, 0.99, Confidence.HIGH)
        assert score >= 90

    def test_partial_reliability(self):
        """Moderate data."""
        score = compute_reliability(10, 24 * 7, 0.7, Confidence.MEDIUM)
        assert 20 <= score <= 70

    def test_short_span(self):
        """Short span penalizes reliability."""
        score = compute_reliability(10, 12, 0.9, Confidence.MEDIUM)
        assert score < 60
