"""Pure-Python parametric curve fitting for battery discharge curves.

Three model candidates fitted using Nelder-Mead simplex minimization,
selected by AICc. No external dependencies — runs on Raspberry Pi 3/4.
"""

from __future__ import annotations

import math
from dataclasses import dataclass


# ---------------------------------------------------------------------------
# Nelder-Mead simplex optimizer
# ---------------------------------------------------------------------------

def nelder_mead(
    func,
    x0: list[float],
    bounds: list[tuple[float, float]] | None = None,
    max_iter: int = 1000,
    tol: float = 1e-8,
    alpha: float = 1.0,
    gamma: float = 2.0,
    rho: float = 0.5,
    sigma: float = 0.5,
) -> tuple[list[float], float]:
    """Pure-Python Nelder-Mead simplex optimization.

    Args:
        func: Objective function mapping params → float (e.g. RSS).
        x0: Initial parameter guess.
        bounds: Optional [(lo, hi), ...] per parameter. Enforced via penalty.
        max_iter: Maximum iterations.
        tol: Convergence tolerance on simplex spread.
        alpha/gamma/rho/sigma: Standard Nelder-Mead coefficients.

    Returns:
        (best_params, best_value).
    """
    n = len(x0)

    # Wrap func with bounds penalty
    if bounds is not None:
        _raw = func
        _bounds = bounds
        def func(p):  # noqa: E306
            penalty = 0.0
            for i, (lo, hi) in enumerate(_bounds):
                if p[i] < lo:
                    penalty += 1e12 * (lo - p[i]) ** 2
                elif p[i] > hi:
                    penalty += 1e12 * (p[i] - hi) ** 2
            return _raw(p) + penalty

    # Build initial simplex
    simplex: list[list[float]] = [list(x0)]
    for i in range(n):
        point = list(x0)
        point[i] += max(abs(x0[i]) * 0.05, 1e-4)
        simplex.append(point)

    values = [func(p) for p in simplex]

    for _ in range(max_iter):
        # Order: best to worst
        order = sorted(range(n + 1), key=lambda k: values[k])
        simplex = [simplex[k] for k in order]
        values = [values[k] for k in order]

        best_val = values[0]
        worst_val = values[-1]
        second_worst_val = values[-2]

        # Convergence check
        if abs(worst_val - best_val) < tol:
            break

        # Centroid of all points except the worst
        centroid = [0.0] * n
        for i in range(n):
            for j in range(n):  # n points (excludes worst)
                centroid[i] += simplex[j][i]
            centroid[i] /= n

        # Reflection
        xr = [centroid[i] + alpha * (centroid[i] - simplex[-1][i]) for i in range(n)]
        fr = func(xr)

        if best_val <= fr < second_worst_val:
            simplex[-1] = xr
            values[-1] = fr
            continue

        # Expansion
        if fr < best_val:
            xe = [centroid[i] + gamma * (xr[i] - centroid[i]) for i in range(n)]
            fe = func(xe)
            if fe < fr:
                simplex[-1] = xe
                values[-1] = fe
            else:
                simplex[-1] = xr
                values[-1] = fr
            continue

        # Contraction
        xc = [centroid[i] + rho * (simplex[-1][i] - centroid[i]) for i in range(n)]
        fc = func(xc)
        if fc < worst_val:
            simplex[-1] = xc
            values[-1] = fc
            continue

        # Shrink: move all points toward the best
        best = simplex[0]
        for j in range(1, n + 1):
            simplex[j] = [best[i] + sigma * (simplex[j][i] - best[i]) for i in range(n)]
            values[j] = func(simplex[j])

    order = sorted(range(n + 1), key=lambda k: values[k])
    return simplex[order[0]], values[order[0]]


# ---------------------------------------------------------------------------
# Model functions
# ---------------------------------------------------------------------------

def _exp_model(t: float, a: float, b: float, c: float) -> float:
    """Exponential decay: pct(t) = a * exp(-b * t) + c."""
    return a * math.exp(-b * t) + c


def _exp_slope(t: float, a: float, b: float, _c: float) -> float:
    """Instantaneous slope of exponential decay at time t."""
    return -a * b * math.exp(-b * t)


def _weibull_model(t: float, scale: float, lam: float, k: float) -> float:
    """Weibull: pct(t) = scale * exp(-(t / λ)^k)."""
    if lam <= 0 or t < 0:
        return scale
    ratio = t / lam
    return scale * math.exp(-(ratio ** k))


def _weibull_slope(t: float, scale: float, lam: float, k: float) -> float:
    """Instantaneous slope of Weibull at time t."""
    if lam <= 0 or t <= 0:
        return 0.0
    ratio = t / lam
    return -scale * (k / lam) * (ratio ** (k - 1)) * math.exp(-(ratio ** k))


# ---------------------------------------------------------------------------
# Residual / goodness-of-fit helpers
# ---------------------------------------------------------------------------

def _rss(observed: list[float], predicted: list[float]) -> float:
    """Residual sum of squares."""
    return sum((o - p) ** 2 for o, p in zip(observed, predicted))


def _r_squared(observed: list[float], predicted: list[float]) -> float:
    """Coefficient of determination."""
    n = len(observed)
    if n < 2:
        return 0.0
    mean_o = sum(observed) / n
    ss_tot = sum((o - mean_o) ** 2 for o in observed)
    if ss_tot == 0:
        return 1.0 if _rss(observed, predicted) == 0 else 0.0
    ss_res = _rss(observed, predicted)
    return max(0.0, 1.0 - ss_res / ss_tot)


def _residual_std(observed: list[float], predicted: list[float]) -> float:
    """Standard deviation of residuals."""
    n = len(observed)
    if n < 2:
        return 0.0
    residuals = [o - p for o, p in zip(observed, predicted)]
    mean_r = sum(residuals) / n
    var = sum((r - mean_r) ** 2 for r in residuals) / (n - 1)
    return math.sqrt(max(0.0, var))


def aic(n: int, k: int, rss_val: float) -> float:
    """AICc (small-sample corrected Akaike Information Criterion).

    Args:
        n: Number of data points.
        k: Number of model parameters.
        rss_val: Residual sum of squares.
    """
    if n <= k + 1 or rss_val <= 0:
        return float("inf")
    ll = -n / 2 * math.log(rss_val / n)
    a = 2 * k - 2 * ll
    if n - k - 1 > 0:
        a += (2 * k * (k + 1)) / (n - k - 1)
    return a


# ---------------------------------------------------------------------------
# Fitting functions
# ---------------------------------------------------------------------------

@dataclass
class CurveFitResult:
    """Result of fitting a parametric curve to discharge data."""

    model_name: str           # "exponential", "weibull", "piecewise_linear_N"
    params: dict[str, float]  # named parameters
    residual_std: float       # std of residuals (% points)
    aic: float
    r_squared: float

    def predict(self, t_days: float) -> float:
        """Evaluate the fitted model at time t_days."""
        p = self.params
        if self.model_name == "exponential":
            return _exp_model(t_days, p["a"], p["b"], p["c"])
        if self.model_name == "weibull":
            return _weibull_model(t_days, p["scale"], p["lambda"], p["k"])
        if self.model_name.startswith("piecewise_linear"):
            return _piecewise_eval(t_days, p)
        return 0.0

    def slope_at(self, t_days: float) -> float:
        """Instantaneous slope (%/day) at time t_days."""
        p = self.params
        if self.model_name == "exponential":
            return _exp_slope(t_days, p["a"], p["b"], p["c"])
        if self.model_name == "weibull":
            return _weibull_slope(t_days, p["scale"], p["lambda"], p["k"])
        if self.model_name.startswith("piecewise_linear"):
            return _piecewise_slope_at(t_days, p)
        return 0.0


def _fit_exponential(
    t: list[float], v: list[float],
) -> CurveFitResult | None:
    """Fit exponential decay: v(t) = a * exp(-b * t) + c."""
    if len(t) < 4:
        return None

    start_v = v[0]
    end_v = v[-1]
    duration = t[-1] - t[0]
    if duration <= 0:
        return None

    a0 = max(start_v - end_v, 1.0)
    # Initial guess for b: assume ~90% decay over the observed duration
    b0 = 2.3 / duration if duration > 0 else 0.01
    c0 = end_v

    def objective(params):
        a, b, c = params
        try:
            predicted = [_exp_model(ti, a, b, c) for ti in t]
        except (OverflowError, ValueError):
            return 1e20
        return _rss(v, predicted)

    bounds = [
        (0.0, 200.0),
        (1e-6, 10.0 / max(duration, 1.0)),
        (-10.0, max(end_v + 20.0, 50.0)),
    ]

    best_params, best_val = nelder_mead(
        objective, [a0, b0, c0], bounds=bounds, max_iter=2000,
    )

    a, b, c = best_params
    try:
        predicted = [_exp_model(ti, a, b, c) for ti in t]
    except (OverflowError, ValueError):
        return None

    return CurveFitResult(
        model_name="exponential",
        params={"a": a, "b": b, "c": c},
        residual_std=_residual_std(v, predicted),
        aic=aic(len(t), 3, _rss(v, predicted)),
        r_squared=_r_squared(v, predicted),
    )


def _fit_weibull(
    t: list[float], v: list[float],
) -> CurveFitResult | None:
    """Fit Weibull: v(t) = scale * exp(-(t / λ)^k)."""
    if len(t) < 4:
        return None

    start_v = v[0]
    duration = t[-1] - t[0]
    if duration <= 0:
        return None

    scale0 = start_v
    lam0 = duration * 0.8
    k0 = 1.5

    def objective(params):
        scale, lam, k = params
        if lam <= 0:
            return 1e20
        try:
            predicted = [_weibull_model(ti, scale, lam, k) for ti in t]
        except (OverflowError, ValueError):
            return 1e20
        return _rss(v, predicted)

    bounds = [
        (max(start_v * 0.5, 10.0), min(start_v * 1.2, 150.0)),
        (max(duration * 0.01, 0.1), duration * 5.0),
        (0.3, 10.0),
    ]

    best_params, best_val = nelder_mead(
        objective, [scale0, lam0, k0], bounds=bounds, max_iter=2000,
    )

    scale, lam, k = best_params
    try:
        predicted = [_weibull_model(ti, scale, lam, k) for ti in t]
    except (OverflowError, ValueError):
        return None

    return CurveFitResult(
        model_name="weibull",
        params={"scale": scale, "lambda": lam, "k": k},
        residual_std=_residual_std(v, predicted),
        aic=aic(len(t), 3, _rss(v, predicted)),
        r_squared=_r_squared(v, predicted),
    )


# ---------------------------------------------------------------------------
# Piecewise linear fitting (closed-form, no optimizer needed)
# ---------------------------------------------------------------------------

def _piecewise_eval(t_days: float, params: dict[str, float]) -> float:
    """Evaluate a piecewise linear model at t_days."""
    n_seg = params.get("n_segments", 2)
    # Find which segment t_days falls into
    for s in range(int(n_seg)):
        t_start = params.get(f"t_start_{s}", 0.0)
        t_end = params.get(f"t_end_{s}", 0.0)
        if t_days <= t_end or s == int(n_seg) - 1:
            slope = params.get(f"slope_{s}", 0.0)
            intercept = params.get(f"intercept_{s}", 0.0)
            return slope * t_days + intercept
    return 0.0


def _piecewise_slope_at(t_days: float, params: dict[str, float]) -> float:
    """Return slope of the segment containing t_days."""
    n_seg = params.get("n_segments", 2)
    for s in range(int(n_seg)):
        t_end = params.get(f"t_end_{s}", 0.0)
        if t_days <= t_end or s == int(n_seg) - 1:
            return params.get(f"slope_{s}", 0.0)
    return 0.0


def _linear_fit_segment(
    t: list[float], v: list[float],
) -> tuple[float, float, float]:
    """Closed-form linear regression for a segment.

    Returns (slope, intercept, rss).
    """
    n = len(t)
    if n == 0:
        return 0.0, 0.0, 0.0
    if n == 1:
        return 0.0, v[0], 0.0

    sum_t = sum(t)
    sum_v = sum(v)
    sum_tt = sum(ti * ti for ti in t)
    sum_tv = sum(ti * vi for ti, vi in zip(t, v))

    denom = n * sum_tt - sum_t * sum_t
    if abs(denom) < 1e-15:
        mean_v = sum_v / n
        return 0.0, mean_v, sum((vi - mean_v) ** 2 for vi in v)

    slope = (n * sum_tv - sum_t * sum_v) / denom
    intercept = (sum_v - slope * sum_t) / n
    rss_val = sum((vi - (slope * ti + intercept)) ** 2 for ti, vi in zip(t, v))
    return slope, intercept, rss_val


def _fit_piecewise(
    t: list[float], v: list[float], n_segments: int = 2,
) -> CurveFitResult | None:
    """Fit piecewise linear model with n_segments.

    Uses grid search over breakpoint positions, closed-form linear
    fit per segment.
    """
    n = len(t)
    min_seg_points = 3
    if n < min_seg_points * n_segments:
        return None

    if n_segments == 2:
        return _fit_piecewise_2(t, v)
    if n_segments == 3:
        return _fit_piecewise_3(t, v)
    return None


def _fit_piecewise_2(
    t: list[float], v: list[float],
) -> CurveFitResult | None:
    """2-segment piecewise linear fit via grid search."""
    n = len(t)
    min_pts = 3
    if n < 2 * min_pts:
        return None

    best_rss = float("inf")
    best_bp = min_pts

    # Grid search over breakpoint index
    for bp in range(min_pts, n - min_pts + 1):
        _, _, rss1 = _linear_fit_segment(t[:bp], v[:bp])
        _, _, rss2 = _linear_fit_segment(t[bp:], v[bp:])
        total = rss1 + rss2
        if total < best_rss:
            best_rss = total
            best_bp = bp

    s1, i1, _ = _linear_fit_segment(t[:best_bp], v[:best_bp])
    s2, i2, _ = _linear_fit_segment(t[best_bp:], v[best_bp:])

    predicted = [s1 * ti + i1 for ti in t[:best_bp]] + [s2 * ti + i2 for ti in t[best_bp:]]

    # 4 params: 2 slopes + 2 intercepts (breakpoint is selected, not free)
    n_params = 4
    params = {
        "n_segments": 2,
        "t_start_0": t[0], "t_end_0": t[best_bp - 1],
        "slope_0": s1, "intercept_0": i1,
        "t_start_1": t[best_bp], "t_end_1": t[-1],
        "slope_1": s2, "intercept_1": i2,
    }

    rss_val = _rss(v, predicted)
    return CurveFitResult(
        model_name="piecewise_linear_2",
        params=params,
        residual_std=_residual_std(v, predicted),
        aic=aic(n, n_params, rss_val),
        r_squared=_r_squared(v, predicted),
    )


def _fit_piecewise_3(
    t: list[float], v: list[float],
) -> CurveFitResult | None:
    """3-segment piecewise linear fit via grid search."""
    n = len(t)
    min_pts = 3
    if n < 3 * min_pts:
        return None

    best_rss = float("inf")
    best_bp1 = min_pts
    best_bp2 = 2 * min_pts

    # Coarse grid search — step to keep O(n) manageable
    step = max(1, n // 25)
    for bp1 in range(min_pts, n - 2 * min_pts + 1, step):
        _, _, rss1 = _linear_fit_segment(t[:bp1], v[:bp1])
        for bp2 in range(bp1 + min_pts, n - min_pts + 1, step):
            _, _, rss2 = _linear_fit_segment(t[bp1:bp2], v[bp1:bp2])
            _, _, rss3 = _linear_fit_segment(t[bp2:], v[bp2:])
            total = rss1 + rss2 + rss3
            if total < best_rss:
                best_rss = total
                best_bp1 = bp1
                best_bp2 = bp2

    # Refine around best breakpoints (fine search ±step)
    for bp1 in range(max(min_pts, best_bp1 - step), min(n - 2 * min_pts + 1, best_bp1 + step + 1)):
        _, _, rss1 = _linear_fit_segment(t[:bp1], v[:bp1])
        for bp2 in range(max(bp1 + min_pts, best_bp2 - step), min(n - min_pts + 1, best_bp2 + step + 1)):
            _, _, rss2 = _linear_fit_segment(t[bp1:bp2], v[bp1:bp2])
            _, _, rss3 = _linear_fit_segment(t[bp2:], v[bp2:])
            total = rss1 + rss2 + rss3
            if total < best_rss:
                best_rss = total
                best_bp1 = bp1
                best_bp2 = bp2

    s1, i1, _ = _linear_fit_segment(t[:best_bp1], v[:best_bp1])
    s2, i2, _ = _linear_fit_segment(t[best_bp1:best_bp2], v[best_bp1:best_bp2])
    s3, i3, _ = _linear_fit_segment(t[best_bp2:], v[best_bp2:])

    predicted = (
        [s1 * ti + i1 for ti in t[:best_bp1]]
        + [s2 * ti + i2 for ti in t[best_bp1:best_bp2]]
        + [s3 * ti + i3 for ti in t[best_bp2:]]
    )

    n_params = 6
    params = {
        "n_segments": 3,
        "t_start_0": t[0], "t_end_0": t[best_bp1 - 1],
        "slope_0": s1, "intercept_0": i1,
        "t_start_1": t[best_bp1], "t_end_1": t[best_bp2 - 1],
        "slope_1": s2, "intercept_1": i2,
        "t_start_2": t[best_bp2], "t_end_2": t[-1],
        "slope_2": s3, "intercept_2": i3,
    }

    rss_val = _rss(v, predicted)
    return CurveFitResult(
        model_name="piecewise_linear_3",
        params=params,
        residual_std=_residual_std(v, predicted),
        aic=aic(n, n_params, rss_val),
        r_squared=_r_squared(v, predicted),
    )


# ---------------------------------------------------------------------------
# Model selection and public API
# ---------------------------------------------------------------------------

def fit_discharge_curve(
    readings: list[dict[str, float]],
) -> CurveFitResult | None:
    """Fit all model candidates and return the best by AICc.

    Args:
        readings: [{"t": unix_ts, "v": pct}], sorted by time, compressed.

    Returns:
        Best CurveFitResult, or None if no model could be fitted.
    """
    if len(readings) < 4:
        return None

    t0 = readings[0]["t"]
    # Normalize to days for numerical stability
    t = [(r["t"] - t0) / 86400.0 for r in readings]
    v = [r["v"] for r in readings]

    candidates: list[CurveFitResult] = []

    exp_fit = _fit_exponential(t, v)
    if exp_fit is not None:
        candidates.append(exp_fit)

    weibull_fit = _fit_weibull(t, v)
    if weibull_fit is not None:
        candidates.append(weibull_fit)

    pw2 = _fit_piecewise(t, v, n_segments=2)
    if pw2 is not None:
        candidates.append(pw2)

    pw3 = _fit_piecewise(t, v, n_segments=3)
    if pw3 is not None:
        candidates.append(pw3)

    if not candidates:
        return None

    # Select by AICc (lowest is best)
    candidates.sort(key=lambda c: c.aic)
    return candidates[0]


def extrapolate_to_threshold(
    fit: CurveFitResult,
    current_t_days: float,
    threshold_pct: float = 0.0,
    max_days: float = 1500.0,
    step_days: float | None = None,
) -> float | None:
    """Predict days from current_t_days until the curve reaches threshold.

    Uses numerical root-finding: steps forward along the curve until the
    predicted value drops to or below the threshold.

    Args:
        fit: Fitted curve result.
        current_t_days: Current position on the curve (days since t0).
        threshold_pct: Target battery percentage.
        max_days: Maximum extrapolation horizon.
        step_days: Step size for search. Auto-computed if None.

    Returns:
        Days from current_t_days to threshold, or None if unreachable.
    """
    current_val = fit.predict(current_t_days)
    if current_val <= threshold_pct:
        return 0.0

    # For exponential with floor above threshold, check analytically
    if fit.model_name == "exponential":
        c = fit.params["c"]
        if c > threshold_pct + 0.5:
            # The curve asymptotes above the threshold — unreachable
            return None
        a = fit.params["a"]
        b = fit.params["b"]
        if a > 0 and b > 0:
            target = threshold_pct - c
            if target <= 0:
                # Already below when a*exp(-b*t) reaches 0
                # Solve: a*exp(-b*t) + c = threshold → t = -ln((threshold-c)/a)/b
                try:
                    t_target = -math.log(max(target, 1e-10) / a) / b
                except (ValueError, ZeroDivisionError):
                    return None
                days = t_target - current_t_days
                if 0 < days <= max_days:
                    return days
                return None if days > max_days else 0.0

    # For Weibull, try analytical
    if fit.model_name == "weibull":
        scale = fit.params["scale"]
        lam = fit.params["lambda"]
        k = fit.params["k"]
        if scale > 0 and lam > 0 and k > 0 and threshold_pct >= 0:
            ratio = threshold_pct / scale
            if 0 < ratio < 1:
                try:
                    t_target = lam * (-math.log(ratio)) ** (1.0 / k)
                except (ValueError, ZeroDivisionError):
                    t_target = None
                if t_target is not None:
                    days = t_target - current_t_days
                    if 0 < days <= max_days:
                        return days
                    return None if days > max_days else 0.0

    # Numerical stepping for piecewise or fallback
    if step_days is None:
        step_days = max(max_days / 10000, 0.01)

    t = current_t_days + step_days
    end_t = current_t_days + max_days
    prev_val = current_val

    while t <= end_t:
        val = fit.predict(t)
        if val <= threshold_pct:
            # Linear interpolation for sub-step accuracy
            if prev_val > threshold_pct and prev_val != val:
                frac = (prev_val - threshold_pct) / (prev_val - val)
                return (t - step_days) + frac * step_days - current_t_days
            return t - current_t_days
        prev_val = val
        t += step_days

    return None
