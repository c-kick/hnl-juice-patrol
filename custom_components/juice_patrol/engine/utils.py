"""Shared utility functions for Juice Patrol.

Functions used by both predictions.py and analysis.py live here
to avoid circular imports.
"""

from __future__ import annotations

from collections import Counter


def median(vals: list[float]) -> float:
    """Compute median of a list of values."""
    s = sorted(vals)
    n = len(s)
    if n == 0:
        return 0.0
    if n % 2 == 1:
        return s[n // 2]
    return (s[n // 2 - 1] + s[n // 2]) / 2


def detect_step_size(values: list[float]) -> float:
    """Detect the reporting granularity of a sensor.

    Returns the most common non-zero step between consecutive readings,
    ignoring large cliff-like drops that don't represent normal granularity.

    E.g. a sensor reporting [100, 95, 90, 85] has step size 5.
    """
    if len(values) < 3:
        return 1.0

    # Only consider diffs <= 20% — larger diffs are cliffs, not granularity
    diffs = [
        round(abs(values[i] - values[i - 1]), 1)
        for i in range(1, len(values))
    ]
    normal_diffs = [d for d in diffs if 0 < d <= 20]

    if not normal_diffs:
        return 1.0

    counts = Counter(normal_diffs)
    return counts.most_common(1)[0][0]
