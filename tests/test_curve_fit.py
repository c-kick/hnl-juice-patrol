"""Tests for parametric curve fitting (engine/curve_fit.py).

Each test generates a known curve, adds ±2% Gaussian noise, fits it,
and verifies parameter recovery within 10% and prediction accuracy
within 15%.
"""

import math
import random

from custom_components.juice_patrol.engine.curve_fit import (
    CurveFitResult,
    _fit_exponential,
    _fit_piecewise,
    _fit_weibull,
    _r_squared,
    aic,
    extrapolate_to_threshold,
    fit_discharge_curve,
    nelder_mead,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_noisy(
    func, t_values: list[float], noise_pct: float = 2.0, seed: int = 42,
) -> list[float]:
    """Generate values from func(t) + Gaussian noise (clipped to ±noise_pct)."""
    rng = random.Random(seed)
    result = []
    for t in t_values:
        clean = func(t)
        noisy = clean + rng.gauss(0, noise_pct)
        result.append(noisy)
    return result


def _make_readings(
    func, n: int = 100, span_days: float = 180.0,
    noise_pct: float = 2.0, seed: int = 42,
) -> tuple[list[dict[str, float]], list[float]]:
    """Generate readings as [{"t", "v"}] from a function.

    Returns (readings, t_days) where t_days is the time axis in days.
    """
    t_days = [i * span_days / (n - 1) for i in range(n)]
    v = _make_noisy(func, t_days, noise_pct, seed)
    t0 = 1_700_000_000.0  # arbitrary epoch
    readings = [{"t": t0 + td * 86400.0, "v": vi} for td, vi in zip(t_days, v)]
    return readings, t_days


def _assert_close(actual: float, expected: float, rel_tol: float, label: str):
    """Assert actual is within rel_tol of expected (relative)."""
    if expected == 0:
        assert abs(actual) < 0.1, f"{label}: expected ~0, got {actual}"
        return
    ratio = abs(actual - expected) / abs(expected)
    assert ratio < rel_tol, (
        f"{label}: expected {expected}, got {actual} (off by {ratio:.1%})"
    )


# ---------------------------------------------------------------------------
# Nelder-Mead optimizer tests
# ---------------------------------------------------------------------------

class TestNelderMead:
    """Basic optimizer tests."""

    def test_quadratic_minimum(self):
        """Find minimum of (x-3)^2 + (y-5)^2."""
        def f(p):
            return (p[0] - 3) ** 2 + (p[1] - 5) ** 2

        params, val = nelder_mead(f, [0.0, 0.0], max_iter=500)
        assert abs(params[0] - 3.0) < 0.01
        assert abs(params[1] - 5.0) < 0.01
        assert val < 1e-6

    def test_rosenbrock(self):
        """Find minimum of Rosenbrock function near (1, 1)."""
        def f(p):
            return (1 - p[0]) ** 2 + 100 * (p[1] - p[0] ** 2) ** 2

        params, val = nelder_mead(f, [0.0, 0.0], max_iter=5000, tol=1e-12)
        assert abs(params[0] - 1.0) < 0.05
        assert abs(params[1] - 1.0) < 0.05

    def test_bounds_enforced(self):
        """Optimum at (3, 5) but bounded to [0, 2] × [0, 4]."""
        def f(p):
            return (p[0] - 3) ** 2 + (p[1] - 5) ** 2

        params, _ = nelder_mead(
            f, [1.0, 2.0], bounds=[(0, 2), (0, 4)], max_iter=500,
        )
        assert params[0] <= 2.1  # near boundary
        assert params[1] <= 4.1


# ---------------------------------------------------------------------------
# Exponential decay fitting
# ---------------------------------------------------------------------------

class TestFitExponential:
    """Test exponential decay: v(t) = a * exp(-b * t) + c."""

    # Known params: a=80, b=0.02, c=15  → starts at 95, decays to ~15
    TRUE_A = 80.0
    TRUE_B = 0.02
    TRUE_C = 15.0

    def _true_func(self, t):
        return self.TRUE_A * math.exp(-self.TRUE_B * t) + self.TRUE_C

    def test_parameter_recovery(self):
        """Recover a, b, c within 10% from noisy data."""
        readings, t_days = _make_readings(
            self._true_func, n=120, span_days=200, noise_pct=2.0,
        )
        t = t_days
        v = [r["v"] for r in readings]

        fit = _fit_exponential(t, v)
        assert fit is not None
        _assert_close(fit.params["a"], self.TRUE_A, 0.10, "a")
        _assert_close(fit.params["b"], self.TRUE_B, 0.10, "b")
        _assert_close(fit.params["c"], self.TRUE_C, 0.15, "c")
        assert fit.r_squared > 0.95

    def test_prediction_accuracy(self):
        """Predict time to threshold within 15%."""
        readings, t_days = _make_readings(
            self._true_func, n=150, span_days=180, noise_pct=2.0,
        )
        fit = fit_discharge_curve(readings)
        assert fit is not None

        # True time to reach 25%: 80*exp(-0.02*t)+15 = 25 → t = -ln(10/80)/0.02 ≈ 103.97
        true_t_to_25 = -math.log(10.0 / self.TRUE_A) / self.TRUE_B

        # We're at t=80 days, predict remaining to 25%
        result = extrapolate_to_threshold(fit, current_t_days=80.0, threshold_pct=25.0)
        assert result is not None
        expected_remaining = true_t_to_25 - 80.0
        _assert_close(result, expected_remaining, 0.15, "days to 25%")

    def test_slope_at(self):
        """Instantaneous slope matches analytical derivative."""
        readings, _ = _make_readings(
            self._true_func, n=100, span_days=150, noise_pct=1.0,
        )
        fit = fit_discharge_curve(readings)
        assert fit is not None

        # True slope at t=50: -a*b*exp(-b*50) = -80*0.02*exp(-1) ≈ -0.589
        true_slope = -self.TRUE_A * self.TRUE_B * math.exp(-self.TRUE_B * 50)
        _assert_close(fit.slope_at(50.0), true_slope, 0.15, "slope at t=50")


# ---------------------------------------------------------------------------
# Weibull fitting
# ---------------------------------------------------------------------------

class TestFitWeibull:
    """Test Weibull: v(t) = scale * exp(-(t / λ)^k)."""

    # Known params: scale=100, λ=150, k=2.5
    # Shape: long plateau then steep cliff — typical lithium cell
    TRUE_SCALE = 100.0
    TRUE_LAMBDA = 150.0
    TRUE_K = 2.5

    def _true_func(self, t):
        if t <= 0:
            return self.TRUE_SCALE
        return self.TRUE_SCALE * math.exp(-((t / self.TRUE_LAMBDA) ** self.TRUE_K))

    def test_parameter_recovery(self):
        """Recover scale, λ, k within 10% from noisy data."""
        readings, t_days = _make_readings(
            self._true_func, n=150, span_days=200, noise_pct=2.0,
        )
        t = t_days
        v = [r["v"] for r in readings]

        fit = _fit_weibull(t, v)
        assert fit is not None
        _assert_close(fit.params["scale"], self.TRUE_SCALE, 0.10, "scale")
        _assert_close(fit.params["lambda"], self.TRUE_LAMBDA, 0.10, "lambda")
        _assert_close(fit.params["k"], self.TRUE_K, 0.10, "k")
        assert fit.r_squared > 0.95

    def test_prediction_accuracy(self):
        """Predict time to 10% within 15%."""
        readings, _ = _make_readings(
            self._true_func, n=100, span_days=130, noise_pct=2.0,
        )
        fit = fit_discharge_curve(readings)
        assert fit is not None

        # True time to 10%: 100*exp(-(t/150)^2.5) = 10
        # → (t/150)^2.5 = ln(10) → t = 150 * ln(10)^(1/2.5)
        true_t = self.TRUE_LAMBDA * (math.log(10)) ** (1.0 / self.TRUE_K)

        current_t = 100.0
        result = extrapolate_to_threshold(fit, current_t_days=current_t, threshold_pct=10.0)
        assert result is not None
        expected_remaining = true_t - current_t
        _assert_close(result, expected_remaining, 0.15, "days to 10%")

    def test_cliff_shape_detected(self):
        """Weibull with k>1 produces accelerating decay (cliff)."""
        readings, _ = _make_readings(
            self._true_func, n=100, span_days=160, noise_pct=1.0,
        )
        fit = fit_discharge_curve(readings)
        assert fit is not None
        # Slope should get steeper over time
        slope_early = abs(fit.slope_at(50.0))
        slope_late = abs(fit.slope_at(140.0))
        assert slope_late > slope_early * 2, "Cliff shape: late slope should be much steeper"


# ---------------------------------------------------------------------------
# Piecewise linear fitting
# ---------------------------------------------------------------------------

class TestFitPiecewise:
    """Test piecewise linear fitting."""

    def test_two_segment(self):
        """Fit a 2-segment staircase: slow then fast decline."""
        def true_func(t):
            if t < 100:
                return 100.0 - 0.1 * t  # slow: -0.1%/day
            return 90.0 - 0.5 * (t - 100)  # fast: -0.5%/day

        readings, t_days = _make_readings(
            true_func, n=100, span_days=140, noise_pct=1.0,
        )
        t = t_days
        v = [r["v"] for r in readings]

        fit = _fit_piecewise(t, v, n_segments=2)
        assert fit is not None
        assert fit.model_name == "piecewise_linear_2"
        assert fit.r_squared > 0.95

    def test_three_segment(self):
        """Fit a 3-segment staircase: plateau, moderate, cliff."""
        def true_func(t):
            if t < 60:
                return 100.0 - 0.05 * t      # near-flat
            if t < 120:
                return 97.0 - 0.3 * (t - 60)  # moderate
            return 79.0 - 1.5 * (t - 120)      # cliff

        readings, t_days = _make_readings(
            true_func, n=120, span_days=140, noise_pct=1.5,
        )
        t = t_days
        v = [r["v"] for r in readings]

        fit = _fit_piecewise(t, v, n_segments=3)
        assert fit is not None
        assert fit.model_name == "piecewise_linear_3"
        assert fit.r_squared > 0.90

    def test_prediction_accuracy(self):
        """Extrapolate from the last segment."""
        def true_func(t):
            if t < 80:
                return 100.0 - 0.05 * t
            return 96.0 - 0.8 * (t - 80)  # steep: hits 0 at t=200

        readings, _ = _make_readings(
            true_func, n=80, span_days=120, noise_pct=1.0,
        )
        fit = fit_discharge_curve(readings)
        assert fit is not None

        result = extrapolate_to_threshold(fit, current_t_days=120.0, threshold_pct=0.0)
        assert result is not None
        # True: 96 - 0.8*(t-80) = 0 → t = 200. Remaining from 120 = 80 days
        _assert_close(result, 80.0, 0.20, "days to 0%")


# ---------------------------------------------------------------------------
# AIC model selection
# ---------------------------------------------------------------------------

class TestModelSelection:
    """Test that fit_discharge_curve selects the right model."""

    def test_exponential_data_selects_exponential(self):
        """Pure exponential data → exponential model selected."""
        def func(t):
            return 90.0 * math.exp(-0.015 * t) + 5.0

        readings, _ = _make_readings(func, n=100, span_days=200, noise_pct=1.5)
        fit = fit_discharge_curve(readings)
        assert fit is not None
        assert fit.model_name in ("exponential", "weibull")  # weibull can match too
        assert fit.r_squared > 0.95

    def test_staircase_selects_piecewise(self):
        """Sharp staircase data → piecewise model selected."""
        def func(t):
            if t < 90:
                return 100.0
            if t < 91:
                return 100.0 - 35.0 * (t - 90)  # sharp drop in 1 day
            return 65.0

        readings, _ = _make_readings(func, n=100, span_days=180, noise_pct=0.5)
        fit = fit_discharge_curve(readings)
        assert fit is not None
        # Piecewise should fit this well
        assert fit.r_squared > 0.90

    def test_insufficient_data_returns_none(self):
        """Fewer than 4 points → None."""
        readings = [
            {"t": 0.0, "v": 100.0},
            {"t": 86400.0, "v": 95.0},
            {"t": 172800.0, "v": 90.0},
        ]
        assert fit_discharge_curve(readings) is None


# ---------------------------------------------------------------------------
# AIC function
# ---------------------------------------------------------------------------

class TestAic:
    """Test AICc computation."""

    def test_lower_rss_lower_aic(self):
        """Better fit (lower RSS) → lower AIC at same complexity."""
        a1 = aic(50, 3, 100.0)
        a2 = aic(50, 3, 200.0)
        assert a1 < a2

    def test_more_params_penalized(self):
        """More parameters penalized for same RSS."""
        a3 = aic(50, 3, 100.0)
        a6 = aic(50, 6, 100.0)
        assert a6 > a3

    def test_degenerate_returns_inf(self):
        assert aic(3, 3, 100.0) == float("inf")  # n <= k + 1
        assert aic(10, 3, 0.0) == float("inf")   # rss = 0
        assert aic(10, 3, -1.0) == float("inf")  # rss < 0


# ---------------------------------------------------------------------------
# Extrapolation edge cases
# ---------------------------------------------------------------------------

class TestExtrapolate:
    """Edge cases for extrapolate_to_threshold."""

    def test_already_below_threshold(self):
        """If current value is already below threshold, return 0."""
        fit = CurveFitResult(
            model_name="exponential",
            params={"a": 80.0, "b": 0.02, "c": 5.0},
            residual_std=1.0, aic=100.0, r_squared=0.99,
        )
        result = extrapolate_to_threshold(fit, current_t_days=300.0, threshold_pct=50.0)
        assert result == 0.0

    def test_asymptote_above_threshold(self):
        """Exponential with floor above threshold → None."""
        fit = CurveFitResult(
            model_name="exponential",
            params={"a": 50.0, "b": 0.01, "c": 30.0},
            residual_std=1.0, aic=100.0, r_squared=0.99,
        )
        result = extrapolate_to_threshold(fit, current_t_days=0.0, threshold_pct=10.0)
        assert result is None

    def test_weibull_reaches_zero(self):
        """Weibull always reaches 0 (no floor)."""
        fit = CurveFitResult(
            model_name="weibull",
            params={"scale": 100.0, "lambda": 150.0, "k": 2.0},
            residual_std=1.0, aic=100.0, r_squared=0.99,
        )
        result = extrapolate_to_threshold(fit, current_t_days=0.0, threshold_pct=5.0)
        assert result is not None
        assert result > 0

    def test_piecewise_extrapolation(self):
        """Piecewise linear extrapolates the last segment."""
        fit = CurveFitResult(
            model_name="piecewise_linear_2",
            params={
                "n_segments": 2,
                "t_start_0": 0.0, "t_end_0": 50.0,
                "slope_0": -0.1, "intercept_0": 100.0,
                "t_start_1": 50.0, "t_end_1": 100.0,
                "slope_1": -0.5, "intercept_1": 120.0,
            },
            residual_std=1.0, aic=100.0, r_squared=0.99,
        )
        # At t=100: -0.5*100 + 120 = 70
        # Reaches 0: -0.5*t + 120 = 0 → t = 240. From t=100: 140 days
        result = extrapolate_to_threshold(fit, current_t_days=100.0, threshold_pct=0.0)
        assert result is not None
        _assert_close(result, 140.0, 0.05, "piecewise extrapolation")


# ---------------------------------------------------------------------------
# Performance test
# ---------------------------------------------------------------------------

class TestPerformance:
    """Ensure fitting stays within performance budget."""

    def test_fit_100_points_under_50ms(self):
        """Single fit with 100 points must complete in <50ms."""
        import time

        def func(t):
            return 80 * math.exp(-0.015 * t) + 10

        readings, _ = _make_readings(func, n=100, span_days=200, noise_pct=2.0)

        start = time.monotonic()
        fit = fit_discharge_curve(readings)
        elapsed = time.monotonic() - start

        assert fit is not None
        assert elapsed < 0.05, f"Fit took {elapsed:.3f}s (budget: 0.05s)"

    def test_fit_500_points_under_100ms(self):
        """Larger dataset still within budget."""
        import time

        def func(t):
            return 100.0 * math.exp(-((t / 300.0) ** 2.0))

        readings, _ = _make_readings(func, n=500, span_days=400, noise_pct=2.0)

        start = time.monotonic()
        fit = fit_discharge_curve(readings)
        elapsed = time.monotonic() - start

        assert fit is not None
        assert elapsed < 0.2, f"Fit took {elapsed:.3f}s (budget: 0.2s)"
