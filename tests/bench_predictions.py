"""Performance benchmark: 47 entities × 500 readings, mixed model types.

Run with: python -m pytest tests/bench_predictions.py -v -s
"""

import math
import random
import time

from custom_components.juice_patrol.engine.compress import compress
from custom_components.juice_patrol.engine.predictions import (
    predict_discharge,
    predict_discharge_multisession,
)


# ---------------------------------------------------------------------------
# Data generators
# ---------------------------------------------------------------------------


def _staircase(
    n_readings: int = 500, step_pct: float = 5.0,
    plateau_min: int = 50, plateau_max: int = 100,
    seed: int = 0,
) -> list[dict[str, float]]:
    """Staircase: steps of step_pct with random-length plateaus."""
    rng = random.Random(seed)
    readings: list[dict[str, float]] = []
    t = 1_000_000.0
    level = 100.0
    while len(readings) < n_readings and level > 0:
        plateau_len = rng.randint(plateau_min, plateau_max)
        for _ in range(min(plateau_len, n_readings - len(readings))):
            readings.append({"t": t, "v": max(0.0, level)})
            t += 3600.0
        level -= step_pct
    # Fill remainder if we hit 0 early
    while len(readings) < n_readings:
        readings.append({"t": t, "v": 0.0})
        t += 3600.0
    return readings


def _exponential_decay(
    n_readings: int = 500,
    a: float = 90.0, b: float = 0.015, c: float = 5.0,
    span_days: float = 300.0,
    noise: float = 2.0,
    seed: int = 0,
) -> list[dict[str, float]]:
    """Exponential decay with Gaussian noise."""
    rng = random.Random(seed)
    t0 = 1_000_000.0
    interval = span_days * 86400.0 / (n_readings - 1)
    readings: list[dict[str, float]] = []
    for i in range(n_readings):
        t = t0 + i * interval
        days = i * span_days / (n_readings - 1)
        v = a * math.exp(-b * days) + c + rng.gauss(0, noise)
        readings.append({"t": t, "v": max(0.0, min(100.0, v))})
    return readings


def _weibull_curve(
    n_readings: int = 500,
    scale: float = 100.0, lam: float = 200.0, k: float = 2.5,
    span_days: float = 250.0,
    noise: float = 1.0,
    seed: int = 0,
) -> list[dict[str, float]]:
    """Weibull curve with noise."""
    rng = random.Random(seed)
    t0 = 1_000_000.0
    interval = span_days * 86400.0 / (n_readings - 1)
    readings: list[dict[str, float]] = []
    for i in range(n_readings):
        t = t0 + i * interval
        days = i * span_days / (n_readings - 1)
        v = scale * math.exp(-((days / lam) ** k)) + rng.gauss(0, noise)
        readings.append({"t": t, "v": max(0.0, min(100.0, v))})
    return readings


def _noisy_sawtooth(
    n_readings: int = 500,
    n_cycles: int = 4,
    noise: float = 2.0,
    seed: int = 0,
) -> list[dict[str, float]]:
    """Noisy sawtooth for rechargeable devices."""
    rng = random.Random(seed)
    readings_per_cycle = n_readings // n_cycles
    discharge_len = int(readings_per_cycle * 0.8)
    charge_len = readings_per_cycle - discharge_len
    readings: list[dict[str, float]] = []
    t = 1_000_000.0
    for _ in range(n_cycles):
        # Discharge 100 → 20
        for j in range(discharge_len):
            v = 100.0 - 80.0 * j / max(discharge_len - 1, 1)
            v += rng.gauss(0, noise)
            readings.append({"t": t, "v": max(0.0, min(100.0, v))})
            t += 3600.0
        # Charge 20 → 100
        for j in range(charge_len):
            v = 20.0 + 80.0 * j / max(charge_len - 1, 1)
            v += rng.gauss(0, noise)
            readings.append({"t": t, "v": max(0.0, min(100.0, v))})
            t += 1800.0
    return readings[:n_readings]


# ---------------------------------------------------------------------------
# Benchmark
# ---------------------------------------------------------------------------


def test_benchmark_47_entities():
    """47 entities × 500 readings: total prediction pass < 5 seconds."""
    entities: list[tuple[str, list[dict[str, float]]]] = []

    # 15 staircase
    for i in range(15):
        entities.append((
            f"staircase_{i}",
            _staircase(500, step_pct=5.0, plateau_min=50, plateau_max=100, seed=i),
        ))

    # 15 exponential decay
    for i in range(15):
        span = 200 + i * 14  # 200-396 days
        entities.append((
            f"exponential_{i}",
            _exponential_decay(500, span_days=span, noise=2.0, seed=100 + i),
        ))

    # 10 Weibull
    for i in range(10):
        lam = 150 + i * 10
        entities.append((
            f"weibull_{i}",
            _weibull_curve(500, lam=lam, noise=1.0, seed=200 + i),
        ))

    # 7 noisy sawtooth (rechargeable)
    for i in range(7):
        n_cycles = 3 + (i % 3)  # 3-5 cycles
        entities.append((
            f"sawtooth_{i}",
            _noisy_sawtooth(500, n_cycles=n_cycles, noise=2.0, seed=300 + i),
        ))

    assert len(entities) == 47

    timings: dict[str, float] = {}
    total_start = time.monotonic()

    for name, readings in entities:
        entity_start = time.monotonic()
        compressed = compress(readings)
        if name.startswith("sawtooth"):
            predict_discharge_multisession(
                readings,
                current_level=readings[-1]["v"],
                target_level=0.0,
            )
        else:
            predict_discharge(
                compressed, target_level=0.0, min_timespan_hours=1.0,
            )
        timings[name] = time.monotonic() - entity_start

    total_elapsed = time.monotonic() - total_start

    # Print breakdown by type
    print(f"\n{'='*60}")
    print(f"BENCHMARK: 47 entities × 500 readings")
    print(f"{'='*60}")

    type_groups = {
        "staircase": [], "exponential": [], "weibull": [], "sawtooth": [],
    }
    for name, elapsed in timings.items():
        for group in type_groups:
            if name.startswith(group):
                type_groups[group].append(elapsed)
                break

    for group, times in type_groups.items():
        avg = sum(times) / len(times) * 1000
        mx = max(times) * 1000
        total = sum(times) * 1000
        print(f"  {group:15s}: {len(times):2d} entities, "
              f"avg={avg:6.1f}ms, max={mx:6.1f}ms, total={total:7.1f}ms")

    print(f"{'─'*60}")
    print(f"  TOTAL: {total_elapsed:.3f}s (budget: 5.0s)")
    print(f"{'='*60}\n")

    assert total_elapsed < 5.0, (
        f"Total prediction pass took {total_elapsed:.3f}s (budget: 5.0s)"
    )
