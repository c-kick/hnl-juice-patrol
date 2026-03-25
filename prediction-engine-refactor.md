# Plan: First-Principles Primary Battery Prediction Engine

## Context

The prediction engine for non-rechargeable batteries has grown into a patchwork of fallbacks over the past week. The coordinator's `_predict_non_rechargeable()` (coordinator.py:1192) tries three progressively broader time windows, each smoothed with a fixed 168-hour rolling median, before giving up. This approach has structural problems:

- Smoothing is time-based — a 168h window is too narrow for a 400-day battery, too wide for a 30-day one
- No cycle isolation for primary cells — `extract_discharge_sessions()` is built for rechargeable sawtooth
- No multi-cycle learning — completed discharge curves are never used to inform the current prediction
- The 3-attempt fallback chain obscures logic and makes debugging difficult

The user defined a dead-simple pipeline: all history → cycle isolation → cycle-relative smoothing → pattern learning → chemistry-informed extrapolation. This plan implements exactly that.

**Scope: primary (non-rechargeable) cells only.** Rechargeable paths are untouched.

## Pipeline

```
predict_primary(all_readings, replacement_timestamps, chemistry, class_prior)
  │
  ├─ 1. isolate_primary_cycles()  →  list[PrimaryCycle]
  │     Split history at replacement boundaries (known timestamps + jump detection)
  │
  ├─ 2. For each completed cycle:
  │     cycle_relative_smooth() → compress() → fit_discharge_curve()
  │
  ├─ 3. learn_discharge_shape(completed_cycles)  →  ShapePrior | None
  │     Aggregate fitted parameters across completed cycles
  │
  └─ 4. Current (ongoing) cycle:
        cycle_relative_smooth() → compress() → fit with ShapePrior → extrapolate
        Apply: cliff detection, calendar penalty, stuck-plateau cap, confidence
```

## Changes

### 1. NEW: `engine/primary.py` (~400-500 lines)

Single new module with the clean pipeline. Public entry point:

```python
def predict_primary(
    all_readings: list[dict[str, float]],
    replacement_timestamps: list[float],  # from store: dev.replacement_history
    chemistry: str | None = None,
    class_prior: ClassPrior | None = None,
    target_level: float = 0.0,
) -> PredictionResult:
```

Internal pieces:

- **`PrimaryCycle`** dataclass — one battery life (replacement to replacement, or to now)
- **`isolate_primary_cycles()`** — splits readings at replacement timestamps (48h tolerance match) and large upward jumps (≥20%). Evidence: `dev.replacement_history` is `list[float]` (store.py:29), already passed to existing cycle functions (coordinator.py:1506, 1597)
- **`ShapePrior`** dataclass — median duration + median curve fit from completed cycles
- **`learn_discharge_shape()`** — smooth + fit each completed cycle, aggregate parameters
- **`_predict_current_cycle()`** — smooth → compress → fit (with prior) → extrapolate → cliff/calendar/confidence

Imports from `predictions.py`: `_classify_confidence`, `_calendar_penalty`, `_tail_cliff_ratio`, `_stuck_near_cliff`, `_candidate_models`, `_theil_sen`, `_validate_and_sort_readings`, `_strip_trailing_dead`, `_no_prediction`, `compute_reliability`, `Confidence`, `PredictionResult`, `PredictionStatus`. These are stable internal functions. `FLAT_SLOPE_THRESHOLD` imported from `..const` (same as predictions.py does, line 16).

Converts `ShapePrior` to `ClassPrior` to feed into existing `fit_discharge_curve(class_prior=...)` — reuses the existing prior mechanism in curve_fit.py.

### 2. MODIFY: `engine/smooth.py` — add `cycle_relative_smooth()`

```python
def cycle_relative_smooth(
    readings: list[dict[str, float]],
    window_frac: float = 0.05,  # 5% of cycle duration
    min_window_points: int = 3,
) -> list[dict[str, float]]:
```

Same structure as existing `rolling_median()` (which stays), but window size is proportional to the cycle's total time span instead of fixed hours. For a 400-day cycle: 20-day window. For a 30-day cycle: 1.5-day window. Zigbee bounce eliminated regardless of timescale.

### 3. MODIFY: `engine/__init__.py` — add re-exports

Add `predict_primary`, `PrimaryCycle`, `ShapePrior`.

### 4. MODIFY: `data/coordinator.py` — simplify `_predict_non_rechargeable()`

Replace the 3-attempt fallback chain (lines 1192-1259) with a single call:

```python
def _predict_non_rechargeable(self, ...) -> PredictionResult:
    replacement_timestamps = dev.replacement_history if dev else []
    return predict_primary(
        all_readings=all_readings,
        replacement_timestamps=replacement_timestamps,
        chemistry=chemistry,
        class_prior=class_prior,
    )
```

### 5. NO changes to:

- `engine/curve_fit.py` — used as-is (AICc selection, Nelder-Mead, ClassPrior support)
- `engine/compress.py` — used as-is (SDT compression per cycle)
- `engine/predictions.py` — untouched; serves rechargeable path + exports helpers
- `engine/sessions.py` — untouched; serves rechargeable path
- `engine/analysis.py` — untouched; `chemistry_from_battery_type()` called upstream
- `engine/models.py` — untouched; ClassPrior used as-is

## Implementation order

| Step | What | Depends on | Test file |
|------|------|------------|-----------|
| 1 | `smooth.py`: add `cycle_relative_smooth()` | nothing | `tests/test_smooth.py` (new) |
| 2 | `primary.py`: `PrimaryCycle` + `isolate_primary_cycles()` | nothing | `tests/test_primary_cycles.py` (new) |
| 3 | `primary.py`: `ShapePrior` + `learn_discharge_shape()` | steps 1-2 | `tests/test_primary_shape.py` (new) |
| 4 | `primary.py`: `_predict_current_cycle()` + `predict_primary()` | steps 1-3 | `tests/test_primary_predict.py` (new) |
| 5 | `coordinator.py`: wire up `predict_primary()` | step 4 | existing `tests/test_coordinator.py` must pass |
| 6 | `__init__.py`: add re-exports | step 4 | — |

## Verification

1. **Unit tests per step** — each step has its own test file, run with `python -m pytest tests/test_primary_*.py -x -v`
2. **Regression** — run full suite: `python -m pytest tests/ -x -v` — existing tests must pass unchanged
3. **Integration** — after wiring coordinator (step 5): restart HA, check `docker logs homeassistant 2>&1 | grep juice_patrol | tail -30` for errors
4. **Visual** — check detail charts for a few devices: smoothed curves should look cleaner, predictions should be reasonable
5. **Comparison** — for devices with known battery death dates (prediction accuracy baseline in memory), compare old vs new predictions
