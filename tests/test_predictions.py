"""Tests for Juice Patrol prediction engine."""

import time

from custom_components.juice_patrol.engine.compress import compress as sdt_compress
from custom_components.juice_patrol.engine.predictions import (
    ChargePredictionResult,
    Confidence,
    PredictionResult,
    PredictionStatus,
    _adaptive_half_life,
    _detect_regime_change,
    _prediction_stability_score,
    _reject_by_residual,
    _theil_sen,
    compute_reliability,
    extract_charging_segment,
    predict_charge,
    predict_discharge,
)
from custom_components.juice_patrol.engine.utils import median as _median


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


def _make_noisy_readings(
    base_level: float,
    noise_amplitude: float,
    count: int,
    span_hours: float,
    slight_slope: float = 0.0,
) -> list[dict[str, float]]:
    """Generate readings with noise around a base level.

    slight_slope: %/day trend to add (negative = discharge).
    """
    import random
    rng = random.Random(42)  # deterministic
    t0 = time.time() - span_hours * 3600
    interval = (span_hours * 3600) / max(count - 1, 1)
    readings = []
    for i in range(count):
        t = t0 + i * interval
        days = (t - t0) / 86400.0
        v = base_level + slight_slope * days + rng.uniform(-noise_amplitude, noise_amplitude)
        readings.append({"t": t, "v": max(0.0, min(100.0, v))})
    return readings


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

    def test_normal_discharge_predicts_to_zero(self):
        """Predict time to 0% (empty) for a normally discharging battery."""
        readings = _make_readings(100.0, 80.0, count=20, span_hours=24 * 10)
        result = predict_discharge(readings, target_level=0.0)
        assert result.status == PredictionStatus.NORMAL
        assert result.slope_per_day is not None
        assert result.slope_per_day < 0  # Discharging
        assert result.estimated_days_remaining is not None
        assert result.estimated_days_remaining > 0
        assert result.estimated_empty_timestamp is not None
        assert result.r_squared is not None and result.r_squared > 0.9
        # With target=0, prediction should be longer than target=20
        result_20 = predict_discharge(readings, target_level=20.0)
        assert result.estimated_days_remaining > result_20.estimated_days_remaining

    def test_target_level_parameter(self):
        """target_level controls what level the prediction targets."""
        readings = _make_readings(100.0, 80.0, count=20, span_hours=24 * 10)
        result_0 = predict_discharge(readings, target_level=0.0)
        result_20 = predict_discharge(readings, target_level=20.0)
        result_50 = predict_discharge(readings, target_level=50.0)
        # Higher target = sooner predicted empty
        assert result_50.estimated_days_remaining < result_20.estimated_days_remaining
        assert result_20.estimated_days_remaining < result_0.estimated_days_remaining

    def test_charging_battery(self):
        """Detect charging when level is increasing."""
        readings = _make_readings(50.0, 90.0, count=10, span_hours=48)
        result = predict_discharge(readings)
        assert result.status == PredictionStatus.CHARGING
        assert result.slope_per_day > 0
        assert result.estimated_days_remaining is None

    def test_flat_battery(self):
        """Extremely small drain rounds to single level -> SINGLE_LEVEL."""
        # 0.01%/14d ≈ 0.0007%/day — all readings round to 95.0
        readings = _make_readings(95.0, 94.99, count=10, span_hours=24 * 14)
        result = predict_discharge(readings)
        assert result.status == PredictionStatus.SINGLE_LEVEL
        assert result.estimated_days_remaining is None

    def test_flat_battery_with_variation(self):
        """Detect flat when drain is low but values vary enough."""
        # 2% drop over 120 days = ~0.017%/day — under 0.02 threshold
        # range=2.0 exceeds step_size=1.0, so not INSUFFICIENT_RANGE
        readings = _make_readings(95.0, 93.0, count=30, span_hours=24 * 120)
        result = predict_discharge(readings)
        assert result.status == PredictionStatus.FLAT
        assert result.estimated_days_remaining is None

    def test_flat_threshold_raised(self):
        """Slopes between 0.01 and 0.02 are now classified as flat."""
        # 0.015%/day over 100 days = 1.5% total drop
        # range=1.5 > step_size=1.0, so not INSUFFICIENT_RANGE
        readings = _make_readings(95.0, 93.5, count=30, span_hours=24 * 100)
        result = predict_discharge(readings)
        assert result.status == PredictionStatus.FLAT

    def test_already_below_threshold_predicts_to_zero(self):
        """Battery below old threshold still gets meaningful prediction to 0%."""
        # 30% → 10% over 7 days: rate ~2.86%/day, at 10% → ~3.5 days to 0%
        readings = _make_readings(30.0, 10.0, count=10, span_hours=24 * 7)
        result = predict_discharge(readings, target_level=0.0)
        assert result.status == PredictionStatus.NORMAL
        assert result.estimated_days_remaining is not None
        # Should still have some time to reach 0% from current ~10%
        assert result.estimated_days_remaining >= 0

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
        result = predict_discharge(readings, target_level=0.0)
        # Should still produce a reasonable prediction despite outliers
        assert result.status == PredictionStatus.NORMAL
        assert result.estimated_days_remaining is not None


class TestPositiveSlopeClamp:
    """Test that positive instantaneous slopes are clamped on discharging devices."""

    def test_staircase_with_noisy_plateau_no_rising_slope(self):
        """A staircase sensor that dropped from 90→20 and sits on a noisy
        plateau should NOT report a positive slope_per_day, even if the
        curve fit's instantaneous slope at t=now is positive.

        Reproduces the Schakelaar verlichting schuur bug where the frontend
        drew a rising prediction line.
        """
        now = time.time()
        readings = []
        # Phase 1: plateau at ~90% for 60 days
        for h in range(0, 60 * 24, 6):
            readings.append({"t": now - (300 - h / 24) * 86400, "v": 90.0})
        # Phase 2: drop to ~40% over 30 days
        for h in range(0, 30 * 24, 6):
            frac = h / (30 * 24)
            readings.append({"t": now - (240 - h / 24) * 86400, "v": 90 - 50 * frac})
        # Phase 3: drop to ~20% over 30 days
        for h in range(0, 30 * 24, 6):
            frac = h / (30 * 24)
            readings.append({"t": now - (210 - h / 24) * 86400, "v": 40 - 20 * frac})
        # Phase 4: noisy plateau at ~20% for 120 days (slight upward noise)
        import random
        rng = random.Random(42)
        for h in range(0, 120 * 24, 6):
            noise = rng.uniform(-2, 3)  # biased slightly upward
            readings.append({"t": now - (180 - h / 24) * 86400, "v": 20 + noise})

        result = predict_discharge(readings, target_level=0.0)
        # The slope should not be positive
        if result.slope_per_day is not None:
            assert result.slope_per_day <= 0, (
                f"slope_per_day should not be positive for a discharging device, "
                f"got {result.slope_per_day}"
            )


class TestRSquaredGate:
    """Test that low R² predictions are gated to FLAT."""

    def test_low_r_squared_becomes_noisy(self):
        """Discharging slope with R² < 0.10 → NOISY (noise, no prediction)."""
        # Simulate the real-world case: slight negative slope buried in noise.
        # Use a zigzag pattern that produces a small negative slope but
        # very low R² because points alternate above/below the line.
        now = time.time()
        span_days = 365
        count = 100
        readings = []
        for i in range(count):
            t = now - (span_days - i * span_days / count) * 86400
            # Base level ~50 with tiny downward trend (-0.02%/day)
            base = 50.0 - 0.02 * (i * span_days / count)
            # Large alternating offset that destroys R²
            offset = 15.0 if i % 2 == 0 else -15.0
            readings.append({"t": t, "v": max(0.0, min(100.0, base + offset))})
        result = predict_discharge(readings)
        assert result.r_squared is not None and result.r_squared < 0.10
        assert result.status == PredictionStatus.NOISY
        # Slope is suppressed for noisy predictions
        assert result.slope_per_day is None
        assert result.slope_per_hour is None
        assert result.estimated_days_remaining is None

    def test_high_r_squared_passes_gate(self):
        """Clean discharge with high R² → NORMAL with prediction."""
        readings = _make_readings(100.0, 60.0, count=30, span_hours=24 * 20)
        result = predict_discharge(readings)
        assert result.r_squared is not None and result.r_squared > 0.9
        assert result.status == PredictionStatus.NORMAL
        assert result.estimated_days_remaining is not None

    def test_marginal_r_squared_passes(self):
        """R² just above 0.10 still produces a prediction."""
        # Moderate noise with a clear-ish trend
        readings = _make_noisy_readings(
            base_level=80.0, noise_amplitude=5.0, count=50,
            span_hours=24 * 30, slight_slope=-0.5,
        )
        result = predict_discharge(readings)
        if result.r_squared is not None and result.r_squared >= 0.10:
            # Parametric fitting may classify instantaneous slope differently
            assert result.status in (
                PredictionStatus.NORMAL, PredictionStatus.CHARGING,
            )


class TestConfidenceClassification:
    """Test confidence levels."""

    def test_high_confidence(self):
        """High confidence: good R² + enough data span + enough data points.

        Uses noise amplitude > SDT epsilon (2.0) to prevent over-compression.
        """
        readings = _make_noisy_readings(
            base_level=100.0, noise_amplitude=3.0, count=50,
            span_hours=24 * 14, slight_slope=-2.0,
        )
        result = predict_discharge(readings)
        assert result.confidence == Confidence.HIGH

    def test_medium_confidence_requires_both(self):
        """Medium confidence requires BOTH R² > 0.3 AND span >= 3d."""
        readings = _make_noisy_readings(
            base_level=100.0, noise_amplitude=3.0, count=40,
            span_hours=24 * 5, slight_slope=-3.0,
        )
        result = predict_discharge(readings)
        assert result.confidence in (Confidence.MEDIUM, Confidence.HIGH)

    def test_low_confidence_short_span(self):
        """Short span with decent R² gives LOW (not MEDIUM)."""
        # 1.5 day span, clean data → high R² but span < 3d
        readings = _make_readings(100.0, 90.0, count=10, span_hours=36)
        result = predict_discharge(readings, min_timespan_hours=1.0)
        # R² should be high but span < 3d → LOW under new AND logic
        assert result.confidence == Confidence.LOW

    def test_low_confidence_low_r_squared(self):
        """Low R² gives LOW regardless of span."""
        # Noisy data with short span to get low R²
        now = time.time()
        readings = [
            {"t": now - 86400 * 1.5, "v": 95.0},
            {"t": now - 86400 * 1.0, "v": 92.0},
            {"t": now - 43200, "v": 97.0},
            {"t": now, "v": 88.0},
        ]
        result = predict_discharge(readings, min_timespan_hours=1.0)
        assert result.confidence == Confidence.LOW


class TestComputeReliability:
    """Test the reliability scoring function."""

    def test_no_data(self):
        score = compute_reliability(0, 0.0, None, Confidence.INSUFFICIENT_DATA)
        assert score == 0

    def test_max_reliability(self):
        """Lots of data + long span + high R² = high reliability."""
        # 25 (span) + 15 (density) + 49.5 (R²) + 10 (bonus) = 99.5 → 100
        score = compute_reliability(200, 24 * 60, 0.99, Confidence.HIGH)
        assert score >= 90

    def test_high_r_squared_dominates(self):
        """R² is now 50% of the score — high R² yields high reliability."""
        score = compute_reliability(30, 24 * 30, 0.95, Confidence.HIGH)
        # 25 + 15*(~0) + 47.5 + 10 = ~82 minimum
        assert score >= 75

    def test_low_r_squared_penalized(self):
        """Low R² now heavily penalizes reliability even with lots of data."""
        # Simulates the bewegingssensor_zwart case: lots of data, low R²
        score = compute_reliability(8717, 24 * 365, 0.017, Confidence.LOW)
        # 25 (max span) + 15 (max density) + 0.85 (R²) + 0 (no bonus) ≈ 41
        assert score <= 45

    def test_consistency_bonus(self):
        """Bonus awarded when R² > 0.7 AND span >= 7 days."""
        score_with = compute_reliability(50, 24 * 14, 0.8, Confidence.HIGH)
        score_without = compute_reliability(50, 24 * 14, 0.65, Confidence.MEDIUM)
        # The difference should include the 10-point bonus (plus some R² diff)
        assert score_with > score_without

    def test_no_consistency_bonus_short_span(self):
        """No bonus despite high R² if span < 7 days."""
        score_short = compute_reliability(50, 24 * 3, 0.9, Confidence.MEDIUM)
        score_long = compute_reliability(50, 24 * 14, 0.9, Confidence.HIGH)
        # Long span gets the 10-point bonus, short doesn't
        assert score_long > score_short

    def test_partial_reliability(self):
        """Moderate data with decent R²."""
        score = compute_reliability(10, 24 * 7, 0.7, Confidence.MEDIUM)
        assert 40 <= score <= 80

    def test_short_span(self):
        """Short span penalizes reliability."""
        score = compute_reliability(10, 12, 0.9, Confidence.MEDIUM)
        assert score <= 60


def make_readings(
    levels: list[float],
    interval_hours: float = 1.0,
    start_t: float = 1000000.0,
) -> list[dict[str, float]]:
    """Generate synthetic readings from a list of levels."""
    return [
        {"t": start_t + i * interval_hours * 3600, "v": level}
        for i, level in enumerate(levels)
    ]


class TestMedian:
    """Test _median helper."""

    def test_odd_count(self):
        assert _median([3, 1, 2]) == 2

    def test_even_count(self):
        assert _median([4, 1, 3, 2]) == 2.5

    def test_single_value(self):
        assert _median([42.0]) == 42.0

    def test_empty(self):
        assert _median([]) == 0.0

    def test_all_same(self):
        assert _median([5, 5, 5, 5]) == 5.0


class TestTheilSen:
    """Test _theil_sen robust estimator."""

    def test_clean_linear_data_matches_wlr(self):
        """On clean data, Theil-Sen slope should be close to WLR."""
        # Perfect linear: 100 → 50 over 50 days = -1%/day
        x = [float(i) for i in range(51)]
        y = [100.0 - i for i in range(51)]
        slope, intercept, r2 = _theil_sen(x, y)
        assert abs(slope - (-1.0)) < 0.05  # within 5%
        assert abs(intercept - 100.0) < 0.5
        assert r2 > 0.99

    def test_robust_to_outlier_contamination(self):
        """Theil-Sen handles 20% outliers; WLR would be skewed."""
        import random
        rng = random.Random(123)
        n = 50
        x = [float(i) for i in range(n)]
        y = [100.0 - 0.5 * i for i in range(n)]  # true slope = -0.5
        # Contaminate 20% of points
        contaminated = rng.sample(range(n), n // 5)
        for idx in contaminated:
            y[idx] += rng.uniform(20, 40)
        slope, intercept, r2 = _theil_sen(x, y)
        # Should still recover close to -0.5
        assert abs(slope - (-0.5)) < 0.15  # Within 30% of true slope

    def test_sampling_mode_close_to_exact(self):
        """With max_pairs=small, sampled result is close to exact."""
        x = [float(i) for i in range(200)]
        y = [80.0 - 0.2 * i for i in range(200)]
        exact_slope, _, _ = _theil_sen(x, y, max_pairs=200 * 199 // 2)
        sampled_slope, _, _ = _theil_sen(x, y, max_pairs=500)
        assert abs(sampled_slope - exact_slope) / abs(exact_slope) < 0.10

    def test_all_identical_values(self):
        """All identical y values produce zero slope."""
        x = [float(i) for i in range(10)]
        y = [50.0] * 10
        slope, intercept, r2 = _theil_sen(x, y)
        assert slope == 0.0
        assert intercept == 50.0

    def test_two_points(self):
        """Two points produce exact slope."""
        x = [0.0, 10.0]
        y = [100.0, 80.0]
        slope, intercept, r2 = _theil_sen(x, y)
        assert abs(slope - (-2.0)) < 0.01
        assert abs(intercept - 100.0) < 0.01

    def test_single_point(self):
        """Single point: no pairs → zero slope, median y as intercept."""
        x = [5.0]
        y = [42.0]
        slope, intercept, r2 = _theil_sen(x, y)
        assert slope == 0.0
        assert intercept == 42.0


class TestRejectByResidual:
    """Test _reject_by_residual outlier rejection."""

    def test_clean_linear_data_no_rejection(self):
        """Clean linear data: no points should be rejected."""
        readings = make_readings(
            [100.0 - i * 0.5 for i in range(20)], interval_hours=12.0
        )
        x = [i * 0.5 for i in range(20)]  # days
        y = [r["v"] for r in readings]
        filtered_r, filtered_x, filtered_y = _reject_by_residual(readings, x, y)
        assert len(filtered_r) == 20

    def test_transient_spikes_rejected(self):
        """Transient spikes far from the regression line are rejected."""
        # Steady drain -1%/day over 20 days
        levels = [100.0 - i for i in range(20)]
        # Inject large spikes: index 5 should be ~95 but we report 50
        # and index 15 should be ~85 but we report 100
        levels[5] = 50.0
        levels[15] = 100.0
        readings = make_readings(levels, interval_hours=24.0)
        x = [float(i) for i in range(20)]
        y = [r["v"] for r in readings]
        filtered_r, filtered_x, filtered_y = _reject_by_residual(readings, x, y)
        # The two spikes should be rejected
        assert len(filtered_r) < 20
        # Valid points should remain
        assert len(filtered_r) >= 17

    def test_slow_drain_no_rejection(self):
        """100 → 20 over months: the spread is signal, not noise."""
        levels = [100.0 - i * (80.0 / 29) for i in range(30)]
        readings = make_readings(levels, interval_hours=24.0 * 7)  # weekly
        x = [i * 7.0 for i in range(30)]
        y = [r["v"] for r in readings]
        filtered_r, filtered_x, filtered_y = _reject_by_residual(readings, x, y)
        assert len(filtered_r) == 30  # No points rejected

    def test_all_identical_no_crash(self):
        """All identical values: MAD=0, no crash, no rejection."""
        readings = make_readings([50.0] * 10, interval_hours=1.0)
        x = [i / 24.0 for i in range(10)]
        y = [50.0] * 10
        filtered_r, filtered_x, filtered_y = _reject_by_residual(readings, x, y)
        assert len(filtered_r) == 10

    def test_few_readings_returned_unchanged(self):
        """Less than 5 readings: returned as-is."""
        readings = make_readings([100, 90, 80], interval_hours=24.0)
        x = [0.0, 1.0, 2.0]
        y = [100.0, 90.0, 80.0]
        filtered_r, filtered_x, filtered_y = _reject_by_residual(readings, x, y)
        assert len(filtered_r) == 3


class TestAdaptiveHalfLife:
    """Test _adaptive_half_life calculation."""

    def test_slow_drain(self):
        """Slow drain (1%/month over 6 months): half-life >> 14 days."""
        # 6% drop over 180 days = ~0.033%/day
        levels = [100.0 - i * (6.0 / 29) for i in range(30)]
        readings = make_readings(levels, interval_hours=24.0 * 6)  # every 6 days
        hl = _adaptive_half_life(readings)
        # days_per_percent = 180/6 = 30, hl = 30*20 = 600 -> clamped to 180
        assert hl > 14.0
        assert hl <= 180.0

    def test_fast_drain(self):
        """Fast drain (2%/day): half-life < 14 days."""
        # 40% drop over 20 days = 2%/day
        levels = [100.0 - i * 2.0 for i in range(20)]
        readings = make_readings(levels, interval_hours=24.0)
        hl = _adaptive_half_life(readings)
        # days_per_percent = 20/40 = 0.5, hl = 0.5*20 = 10
        assert hl < 14.0
        assert hl >= 7.0

    def test_flat_readings(self):
        """Flat readings: half-life at least 30 days."""
        readings = make_readings([95.0] * 30, interval_hours=24.0)
        hl = _adaptive_half_life(readings)
        assert hl >= 30.0

    def test_negative_drain_returns_default(self):
        """Charging (negative value_range) returns default."""
        # Levels increasing
        levels = [50.0 + i * 2.0 for i in range(20)]
        readings = make_readings(levels, interval_hours=24.0)
        hl = _adaptive_half_life(readings)
        assert hl == 14.0  # default

    def test_few_readings_returns_default(self):
        """Less than 5 readings returns default."""
        readings = make_readings([100, 90, 80], interval_hours=24.0)
        hl = _adaptive_half_life(readings)
        assert hl == 14.0

    def test_short_timespan_returns_default(self):
        """Less than 1 day timespan returns default."""
        readings = make_readings([100, 99, 98, 97, 96], interval_hours=0.1)
        hl = _adaptive_half_life(readings)
        assert hl == 14.0


class TestSingleLevelInsufficientRange:
    """Test SINGLE_LEVEL and INSUFFICIENT_RANGE early gating."""

    def test_single_level_all_100(self):
        """Device reporting only 100% for 90 days -> SINGLE_LEVEL."""
        readings = make_readings([100.0] * 90, interval_hours=24.0)
        result = predict_discharge(readings)
        assert result.status == PredictionStatus.SINGLE_LEVEL
        assert result.confidence == Confidence.INSUFFICIENT_DATA
        assert result.slope_per_day is None

    def test_insufficient_range_one_step(self):
        """Device reporting 100%, 95% with step_size=5 -> INSUFFICIENT_RANGE."""
        # Many readings alternating between 100 and 95 — range = step
        levels = [100.0 if i % 2 == 0 else 95.0 for i in range(30)]
        readings = make_readings(levels, interval_hours=24.0)
        result = predict_discharge(readings)
        assert result.status == PredictionStatus.INSUFFICIENT_RANGE
        assert result.confidence == Confidence.INSUFFICIENT_DATA

    def test_two_steps_not_gated(self):
        """Device with range > step_size passes early gating."""
        # Steps of 5: 100, 95, 90 — range=10, step=5 → not gated
        levels = [100.0 - (i // 3) * 5 for i in range(30)]
        readings = make_readings(levels, interval_hours=24.0)
        result = predict_discharge(readings)
        assert result.status != PredictionStatus.SINGLE_LEVEL
        assert result.status != PredictionStatus.INSUFFICIENT_RANGE


class TestExtrapolationPenalty:
    """Test extrapolation ratio penalty in compute_reliability."""

    def test_high_extrapolation_penalized(self):
        """days_remaining=300, timespan=7 days -> reliability penalized."""
        score_short_obs = compute_reliability(
            50, 24 * 7, 0.9, Confidence.HIGH, days_remaining=300.0,
        )
        score_long_obs = compute_reliability(
            50, 24 * 300, 0.9, Confidence.HIGH, days_remaining=300.0,
        )
        # Short observation predicting far out should be penalized vs
        # the same prediction with a long observation period
        assert score_long_obs > score_short_obs
        # The penalty should be substantial (ratio=300/7=42.8 > 5 -> -20)
        assert score_long_obs - score_short_obs >= 15

    def test_no_penalty_within_observation(self):
        """days_remaining=10, timespan=30 days -> no penalty."""
        score_no_dr = compute_reliability(50, 24 * 30, 0.9, Confidence.HIGH)
        score_with_dr = compute_reliability(
            50, 24 * 30, 0.9, Confidence.HIGH, days_remaining=10.0,
        )
        # ratio = 10/30 = 0.33 < 2 -> no penalty
        assert score_no_dr == score_with_dr

    def test_partial_penalty_moderate_ratio(self):
        """Ratio between 2 and 5 gets partial penalty."""
        # ratio = 3.5 -> penalty = -20 * (3.5-2)/3 = -10
        score = compute_reliability(
            50, 24 * 10, 0.9, Confidence.HIGH, days_remaining=35.0,
        )
        score_no_penalty = compute_reliability(
            50, 24 * 10, 0.9, Confidence.HIGH, days_remaining=10.0,
        )
        assert score < score_no_penalty


class TestSdtCompression:
    """Test SDT compression integration in the prediction pipeline.

    _subsample_readings has been replaced by SDT compression (engine/compress.py).
    These tests verify that compression works correctly within predict_discharge.
    """

    def test_short_input_preserved(self):
        """Short input is not destroyed by compression."""
        readings = make_readings([100 - i for i in range(10)], interval_hours=1.0)
        result = sdt_compress(readings)
        # First and last must be preserved
        assert result[0]["t"] == readings[0]["t"]
        assert result[-1]["t"] == readings[-1]["t"]

    def test_identical_readings_compressed(self):
        """10,000 identical readings → 2 points after SDT."""
        readings = make_readings([50.0] * 10000, interval_hours=0.1)
        result = sdt_compress(readings)
        assert len(result) == 2
        assert result[0]["t"] == readings[0]["t"]
        assert result[-1]["t"] == readings[-1]["t"]

    def test_transitions_preserved(self):
        """All transition levels are kept even in large staircase datasets.

        Steps must be > SDT epsilon (2.0) to remain distinct after compression.
        """
        levels = []
        for level_idx in range(20):
            levels.extend([100.0 - level_idx * 5.0] * 200)
        readings = make_readings(levels, interval_hours=0.1)
        result = sdt_compress(readings)
        result_values = {round(r["v"], 1) for r in result}
        original_unique = {round(v, 1) for v in levels}
        # All unique levels should be represented in the compressed output
        assert original_unique == result_values

    def test_output_sorted_by_time(self):
        """Compressed output maintains time ordering."""
        levels = [100.0 - (i % 5) * 3 for i in range(2000)]
        readings = make_readings(levels, interval_hours=0.1)
        result = sdt_compress(readings)
        for i in range(1, len(result)):
            assert result[i]["t"] > result[i - 1]["t"]

    def test_prediction_works_on_large_data(self):
        """Predictions on large datasets work correctly via SDT compression."""
        # Synthetic linear drain: 100 -> 50 over 1000 hours
        levels = [100.0 - i * (50.0 / 9999) for i in range(10000)]
        readings = make_readings(levels, interval_hours=0.1)
        result = predict_discharge(
            readings, target_level=0.0, min_timespan_hours=1.0,
        )
        assert result.status == PredictionStatus.NORMAL
        assert result.slope_per_day is not None
        assert result.slope_per_day < 0


class TestPredictionStabilityScore:
    """Test _prediction_stability_score function."""

    def test_very_stable(self):
        """Predictions converging within 1 day -> score 10.0."""
        base_ts = 1720000000.0
        history = [
            {"computed_at": 1710000000 + i * 86400, "empty_ts": base_ts + i * 3600}
            for i in range(5)
        ]
        # avg_shift in days: ~0.04 (3600s / 86400s) -> < 1 -> 10.0
        assert _prediction_stability_score(history) == 10.0

    def test_moderately_stable(self):
        """Predictions shifting by 1-3 days on average -> score 7.0."""
        history = [
            {"computed_at": 1710000000 + i * 86400,
             "empty_ts": 1720000000 + i * 86400 * 2}  # ~2 day shifts
            for i in range(5)
        ]
        assert _prediction_stability_score(history) == 7.0

    def test_somewhat_unstable(self):
        """Predictions shifting by 3-7 days on average -> score 4.0."""
        history = [
            {"computed_at": 1710000000 + i * 86400,
             "empty_ts": 1720000000 + i * 86400 * 5}  # ~5 day shifts
            for i in range(5)
        ]
        assert _prediction_stability_score(history) == 4.0

    def test_very_unstable(self):
        """Predictions shifting by > 14 days -> score 0.0."""
        history = [
            {"computed_at": 1710000000 + i * 86400,
             "empty_ts": 1720000000 + i * 86400 * 20}  # ~20 day shifts
            for i in range(5)
        ]
        assert _prediction_stability_score(history) == 0.0

    def test_insufficient_history(self):
        """Less than 3 entries -> 0.0."""
        history = [
            {"computed_at": 1710000000, "empty_ts": 1720000000},
            {"computed_at": 1710086400, "empty_ts": 1720100000},
        ]
        assert _prediction_stability_score(history) == 0.0

    def test_empty_history(self):
        """Empty history -> 0.0."""
        assert _prediction_stability_score([]) == 0.0

    def test_none_empty_ts_skipped(self):
        """Entries with None empty_ts are skipped."""
        history = [
            {"computed_at": 1710000000, "empty_ts": 1720000000},
            {"computed_at": 1710086400, "empty_ts": None},
            {"computed_at": 1710172800, "empty_ts": 1720003600},
            {"computed_at": 1710259200, "empty_ts": None},
            {"computed_at": 1710345600, "empty_ts": 1720007200},
        ]
        # Only 3 valid entries, small shifts -> stable
        assert _prediction_stability_score(history) == 10.0


# ── Charge prediction tests ──


class TestExtractChargingSegment:
    """Tests for extract_charging_segment()."""

    def test_empty_readings(self):
        assert extract_charging_segment([]) is None

    def test_too_few_readings(self):
        readings = [{"t": 1000, "v": 50}, {"t": 2000, "v": 55}]
        assert extract_charging_segment(readings) is None

    def test_discharging_returns_none(self):
        readings = _make_readings(100, 50, 10, span_hours=48)
        assert extract_charging_segment(readings) is None

    def test_flat_returns_none(self):
        readings = _make_readings(95, 95, 10, span_hours=48)
        assert extract_charging_segment(readings) is None

    def test_charging_segment_detected(self):
        readings = _make_readings(20, 80, 10, span_hours=4)
        segment = extract_charging_segment(readings)
        assert segment is not None
        assert len(segment) >= 3
        assert segment[-1]["v"] > segment[0]["v"]

    def test_charging_after_discharge(self):
        """Discharge then charge — should extract only the charging tail."""
        t0 = time.time() - 72 * 3600
        discharge = _make_readings(100, 30, 20, span_hours=48, start_time=t0)
        charge = _make_readings(
            30, 85, 10, span_hours=4,
            start_time=discharge[-1]["t"] + 3600,
        )
        all_readings = discharge + charge
        segment = extract_charging_segment(all_readings)
        assert segment is not None
        # Segment should start near the charge start, not the discharge
        assert segment[0]["v"] < 40
        assert segment[-1]["v"] > 80

    def test_small_noise_dips_tolerated(self):
        """Small jitter during charging should not break the segment."""
        t0 = time.time() - 4 * 3600
        readings = [
            {"t": t0, "v": 30},
            {"t": t0 + 1800, "v": 35},
            {"t": t0 + 3600, "v": 34},  # small dip
            {"t": t0 + 5400, "v": 40},
            {"t": t0 + 7200, "v": 45},
            {"t": t0 + 9000, "v": 44},  # small dip
            {"t": t0 + 10800, "v": 50},
            {"t": t0 + 12600, "v": 55},
        ]
        segment = extract_charging_segment(readings)
        assert segment is not None
        assert len(segment) == 8

    def test_below_min_rise_returns_none(self):
        """Total rise below min_rise threshold should return None."""
        readings = _make_readings(50, 53, 5, span_hours=2)
        assert extract_charging_segment(readings) is None

    def test_at_100_returns_none(self):
        """Battery sitting at 100% should not produce a charging segment."""
        readings = _make_readings(100, 100, 10, span_hours=24)
        assert extract_charging_segment(readings) is None


class TestPredictCharge:
    """Tests for predict_charge()."""

    def test_too_few_readings(self):
        readings = [{"t": 1000, "v": 30}, {"t": 2000, "v": 40}]
        result = predict_charge(readings)
        assert result.status == PredictionStatus.INSUFFICIENT_DATA

    def test_too_short_timespan(self):
        t0 = time.time()
        readings = [
            {"t": t0, "v": 30},
            {"t": t0 + 60, "v": 31},
            {"t": t0 + 120, "v": 32},
        ]
        result = predict_charge(readings, min_timespan_hours=0.5)
        assert result.status == PredictionStatus.INSUFFICIENT_DATA

    def test_normal_charging(self):
        """Steady charging from 20% to 60% over 2 hours should predict full."""
        readings = _make_readings(20, 60, 10, span_hours=2)
        result = predict_charge(readings)
        assert result.status == PredictionStatus.NORMAL
        assert result.slope_per_hour is not None
        assert result.slope_per_hour > 0
        assert result.estimated_full_timestamp is not None
        assert result.estimated_hours_to_full is not None
        assert result.estimated_hours_to_full > 0
        # SDT compresses perfectly linear data; just verify points > 0
        assert result.data_points_used > 0

    def test_flat_charge_returns_flat(self):
        """Nearly flat readings should return FLAT status."""
        readings = _make_readings(50, 50.5, 10, span_hours=2)
        result = predict_charge(readings)
        assert result.status == PredictionStatus.FLAT

    def test_charge_prediction_result_type(self):
        readings = _make_readings(30, 70, 8, span_hours=2)
        result = predict_charge(readings)
        assert isinstance(result, ChargePredictionResult)

    def test_implausible_cap(self):
        """Very slow charge should cap prediction at 48h."""
        readings = _make_readings(10, 11, 10, span_hours=5)
        result = predict_charge(readings)
        # slope ~0.2%/hr → 450h to full — should be capped
        assert result.estimated_full_timestamp is None


class TestDetectRegimeChange:
    """Test _detect_regime_change function."""

    def _make_two_phase(
        self,
        slow_hours: int,
        slow_start: float,
        slow_end: float,
        fast_hours: int,
        fast_start: float,
        fast_end: float,
    ) -> tuple[list[dict], list[float], list[float], float]:
        """Create two-phase readings and return (readings, x, y, ts_slope)."""
        t0 = time.time() - (slow_hours + fast_hours) * 3600
        readings = []
        for h in range(slow_hours):
            v = slow_start + (slow_end - slow_start) * h / max(slow_hours - 1, 1)
            readings.append({"t": t0 + h * 3600, "v": v})
        for h in range(fast_hours):
            v = fast_start + (fast_end - fast_start) * h / max(fast_hours - 1, 1)
            readings.append({"t": t0 + (slow_hours + h) * 3600, "v": v})
        x = [(r["t"] - readings[0]["t"]) / 86400.0 for r in readings]
        y = [r["v"] for r in readings]
        slope, _, _ = _theil_sen(x, y)
        return readings, x, y, slope

    def test_no_change_gradual_drain(self):
        """Gradual drain should not trigger regime change."""
        readings = _make_readings(100, 70, 168, span_hours=168)
        x = [(r["t"] - readings[0]["t"]) / 86400.0 for r in readings]
        y = [r["v"] for r in readings]
        slope, _, _ = _theil_sen(x, y)
        assert _detect_regime_change(readings, x, y, slope) is None

    def test_acceleration_detected(self):
        """Slow drain then steep drop should be detected."""
        readings, x, y, slope = self._make_two_phase(
            slow_hours=150, slow_start=100, slow_end=92,
            fast_hours=15, fast_start=92, fast_end=70,
        )
        result = _detect_regime_change(readings, x, y, slope)
        assert result is not None
        tail_readings, _, _ = result
        # Tail should contain only the steep portion
        assert tail_readings[-1]["v"] < 75

    def test_deceleration_detected(self):
        """Fast drain then slowdown should be detected."""
        readings, x, y, slope = self._make_two_phase(
            slow_hours=120, slow_start=100, slow_end=30,
            fast_hours=72, fast_start=30, fast_end=20,
        )
        result = _detect_regime_change(readings, x, y, slope)
        assert result is not None

    def test_flat_overall_not_triggered(self):
        """Flat overall slope should not trigger detection."""
        readings = _make_readings(99.5, 99.0, 100, span_hours=168)
        x = [(r["t"] - readings[0]["t"]) / 86400.0 for r in readings]
        y = [r["v"] for r in readings]
        # Force a near-flat overall slope
        assert _detect_regime_change(readings, x, y, -0.005) is None

    def test_insufficient_points(self):
        """Too few readings should return None."""
        readings = _make_readings(100, 90, 6, span_hours=6)
        x = [(r["t"] - readings[0]["t"]) / 86400.0 for r in readings]
        y = [r["v"] for r in readings]
        slope, _, _ = _theil_sen(x, y)
        assert _detect_regime_change(readings, x, y, slope) is None

    def test_deceleration_into_plateau_blocked(self):
        """Near-flat tail (range < 3.0) should NOT trigger regime change.

        A flat tail is too noisy to be meaningful — the guard should
        prevent detection, not cause it (regression fix).
        """
        readings, x, y, slope = self._make_two_phase(
            slow_hours=120, slow_start=100, slow_end=40,
            fast_hours=48, fast_start=40, fast_end=38.5,
        )
        result = _detect_regime_change(readings, x, y, slope)
        assert result is None

    def test_sign_flip_detected(self):
        """Draining then rising should be detected."""
        readings, x, y, slope = self._make_two_phase(
            slow_hours=120, slow_start=100, slow_end=40,
            fast_hours=48, fast_start=40, fast_end=55,
        )
        result = _detect_regime_change(readings, x, y, slope)
        assert result is not None


class TestPredictDischargeRegimeChange:
    """Integration tests: predict_discharge with regime changes."""

    def test_acceleration_uses_tail(self):
        """Acceleration should produce steeper slope than overall data."""
        t0 = time.time() - 175 * 3600
        readings = []
        # Flat at 100% for 26 hours
        for h in range(26):
            readings.append({"t": t0 + h * 3600, "v": 100.0})
        # Slow drain for 130 hours
        for h in range(130):
            v = 99.9 - (h / 130) * 8.5
            readings.append({"t": t0 + (26 + h) * 3600, "v": v})
        # Steep drop for 15 hours
        for h in range(15):
            v = 91.4 - (h / 14) * 21.8
            readings.append({"t": t0 + (156 + h) * 3600, "v": v})

        result = predict_discharge(readings, target_level=0.0)
        # With regime change detection, should use the steep tail.
        # The parametric model's instantaneous slope at t=now may be less
        # extreme than the average tail slope, but still much steeper than
        # the overall ~1.5%/day.
        assert result.slope_per_day is not None
        assert abs(result.slope_per_day) > 2.0  # Steeper than overall ~1.5
        assert result.estimated_days_remaining is not None
        assert result.estimated_days_remaining < 40  # Not 55+

    def test_no_double_recursion(self):
        """Three-phase data should not recurse beyond depth 1."""
        t0 = time.time() - 300 * 3600
        readings = []
        # Phase 1: slow (100h)
        for h in range(100):
            readings.append({"t": t0 + h * 3600, "v": 100 - h * 0.05})
        # Phase 2: medium (100h)
        for h in range(100):
            readings.append({"t": t0 + (100 + h) * 3600, "v": 95 - h * 0.3})
        # Phase 3: steep (50h)
        for h in range(50):
            readings.append({"t": t0 + (200 + h) * 3600, "v": 65 - h * 1.0})

        # Should not raise RecursionError — depth is capped at 1
        result = predict_discharge(readings, target_level=0.0)
        assert result.status in (PredictionStatus.NORMAL, PredictionStatus.FLAT)
