"""Tests for PrimaryCycle and isolate_primary_cycles() in engine/primary.py."""

from __future__ import annotations

from custom_components.juice_patrol.engine.primary import (
    PrimaryCycle,
    isolate_primary_cycles,
)

DAY = 86400.0


def _make_readings(
    values: list[float], interval_days: float = 1.0, start_t: float = 0.0
) -> list[dict[str, float]]:
    """Build readings list from a sequence of values at regular intervals."""
    return [
        {"t": start_t + i * interval_days * DAY, "v": v}
        for i, v in enumerate(values)
    ]


# --- Edge cases ---


def test_empty_readings():
    assert isolate_primary_cycles([], []) == []


def test_single_reading():
    assert isolate_primary_cycles([{"t": 0.0, "v": 100.0}], []) == []


def test_two_readings_no_split():
    """Two readings, no replacements → one ongoing cycle."""
    readings = _make_readings([100.0, 95.0])
    cycles = isolate_primary_cycles(readings, [])
    assert len(cycles) == 1
    assert cycles[0].is_completed is False
    assert len(cycles[0].readings) == 2


# --- Single cycle (no replacements, no jumps) ---


def test_single_declining_cycle():
    """Monotonically declining readings → one ongoing cycle."""
    values = [100.0 - i * 5 for i in range(20)]
    readings = _make_readings(values)
    cycles = isolate_primary_cycles(readings, [])
    assert len(cycles) == 1
    assert cycles[0].is_completed is False
    assert cycles[0].start_t == readings[0]["t"]
    assert cycles[0].end_t == readings[-1]["t"]
    assert len(cycles[0].readings) == 20


# --- Split at known replacement ---


def test_split_at_replacement():
    """Known replacement splits into completed + ongoing."""
    # Cycle 1: 100→20 over 10 days, then replacement at day 10
    # Cycle 2: 100→80 over 5 days (ongoing)
    values_c1 = [100.0 - i * 8 for i in range(11)]  # 100, 92, ..., 20
    values_c2 = [100.0 - i * 4 for i in range(6)]   # 100, 96, ..., 80
    readings = _make_readings(values_c1 + values_c2)
    # Replacement timestamp at the jump point (day 11, where value goes from 20→100)
    rep_t = 11 * DAY

    cycles = isolate_primary_cycles(readings, [rep_t])
    assert len(cycles) == 2
    assert cycles[0].is_completed is True
    assert cycles[1].is_completed is False
    # First cycle ends before the jump
    assert cycles[0].readings[-1]["v"] == 20.0
    # Second cycle starts at 100
    assert cycles[1].readings[0]["v"] == 100.0


def test_replacement_with_tolerance():
    """Replacement timestamp doesn't need to match exactly — 48h tolerance."""
    values = [100, 90, 80, 70, 60, 100, 95, 90]
    readings = _make_readings(values, interval_days=1.0)
    # Replacement is 12 hours before the actual jump (well within 48h)
    rep_t = 5 * DAY - 12 * 3600
    cycles = isolate_primary_cycles(readings, [rep_t])
    assert len(cycles) == 2
    assert cycles[0].is_completed is True


def test_replacement_outside_tolerance():
    """Replacement timestamp too far from any reading → no split from it."""
    values = [100, 90, 80, 70, 60, 100, 95, 90]
    readings = _make_readings(values, interval_days=1.0)
    # Replacement 5 days away from any reading (way outside 48h tolerance)
    rep_t = -5 * DAY
    cycles = isolate_primary_cycles(readings, [rep_t])
    # The ≥20% jump at index 5 (60→100 = +40) still triggers a split
    assert len(cycles) == 2


def test_multiple_replacements():
    """Three cycles from two replacements."""
    values = (
        [100, 80, 60, 40, 20]      # cycle 1: days 0-4
        + [100, 90, 80, 70, 60]     # cycle 2: days 5-9
        + [100, 95, 90, 85, 80]     # cycle 3: days 10-14 (ongoing)
    )
    readings = _make_readings(values, interval_days=1.0)
    rep_timestamps = [5 * DAY, 10 * DAY]

    cycles = isolate_primary_cycles(readings, rep_timestamps)
    assert len(cycles) == 3
    assert cycles[0].is_completed is True
    assert cycles[1].is_completed is True
    assert cycles[2].is_completed is False


# --- Split at upward jump (no known replacement) ---


def test_jump_detection_splits():
    """≥20% upward jump triggers a split even without known replacement."""
    # Decline to 50, then jump to 95 (+45 pp), then decline
    values = [100, 90, 80, 70, 60, 50, 95, 90, 85]
    readings = _make_readings(values)
    cycles = isolate_primary_cycles(readings, [])
    assert len(cycles) == 2
    assert cycles[0].is_completed is True
    assert cycles[0].readings[-1]["v"] == 50.0
    assert cycles[1].readings[0]["v"] == 95.0
    assert cycles[1].is_completed is False


def test_small_upward_jump_no_split():
    """< 20% upward jump does NOT split (noise, not replacement)."""
    values = [100, 90, 85, 95, 90, 85, 80]  # +10 at index 3
    readings = _make_readings(values)
    cycles = isolate_primary_cycles(readings, [])
    assert len(cycles) == 1


def test_exactly_20_jump_splits():
    """Exactly 20% upward jump should trigger split."""
    values = [100, 80, 60, 80, 70, 60]  # +20 at index 3
    readings = _make_readings(values)
    cycles = isolate_primary_cycles(readings, [])
    assert len(cycles) == 2


# --- Downward gaps do NOT split ---


def test_downward_gap_no_split():
    """Radio silence gap where level drops does NOT trigger split (S7)."""
    # 100→65 (normal decline), then 30-day gap, then 55→0
    readings = (
        _make_readings([100, 90, 80, 70, 65], interval_days=1.0)
        + _make_readings([55, 50, 45, 40], interval_days=1.0, start_t=35 * DAY)
    )
    cycles = isolate_primary_cycles(readings, [])
    assert len(cycles) == 1, "Downward gap should not trigger a split"


def test_large_downward_jump_no_split():
    """Even a big downward jump (e.g., -30%) is not a replacement."""
    values = [100, 95, 90, 60, 55, 50]  # -30 at index 3, downward
    readings = _make_readings(values)
    cycles = isolate_primary_cycles(readings, [])
    assert len(cycles) == 1


# --- Jump near known replacement doesn't double-split ---


def test_jump_near_replacement_no_double_split():
    """Jump at the same index as a known replacement → single split, not two."""
    values = [100, 80, 60, 40, 100, 90, 80]
    readings = _make_readings(values)
    # Replacement exactly at the jump
    rep_t = 4 * DAY
    cycles = isolate_primary_cycles(readings, [rep_t])
    assert len(cycles) == 2, "Should not double-split"


# --- Replacement timestamp on the split gets associated ---


def test_replacement_t_stored():
    """Completed cycles store the replacement timestamp when known."""
    values = [100, 80, 60, 40, 100, 90, 80]
    readings = _make_readings(values)
    rep_t = 4 * DAY
    cycles = isolate_primary_cycles(readings, [rep_t])
    assert cycles[0].is_completed is True
    assert cycles[0].replacement_t == rep_t


def test_inferred_jump_no_replacement_t():
    """Inferred jumps (no known replacement) have replacement_t = None."""
    values = [100, 80, 60, 40, 100, 90, 80]
    readings = _make_readings(values)
    cycles = isolate_primary_cycles(readings, [])
    assert cycles[0].replacement_t is None


# --- Last segment is always ongoing ---


def test_last_segment_always_ongoing():
    """Even if the last reading is low, the last cycle is ongoing."""
    values = [100, 80, 60, 40, 20, 100, 80, 60, 5]
    readings = _make_readings(values)
    rep_t = 5 * DAY
    cycles = isolate_primary_cycles(readings, [rep_t])
    assert cycles[-1].is_completed is False
    assert cycles[-1].readings[-1]["v"] == 5.0


# --- PrimaryCycle dataclass ---


def test_primary_cycle_fields():
    """PrimaryCycle stores expected fields."""
    r = [{"t": 0.0, "v": 100.0}, {"t": DAY, "v": 90.0}]
    c = PrimaryCycle(readings=r, start_t=0.0, end_t=DAY, is_completed=False)
    assert c.readings == r
    assert c.start_t == 0.0
    assert c.end_t == DAY
    assert c.is_completed is False
    assert c.replacement_t is None


# --- Scenario-based tests from the spec ---


def test_scenario_s1_alkaline_zigbee():
    """S1: Alkaline Zigbee staircase with one prior cycle → 2 cycles."""
    # Prior cycle: ~280 days, 5% steps
    c1_values = []
    level = 100.0
    for _ in range(56):  # 56 steps × 5 days = 280 days
        c1_values.extend([level] * 5)
        level -= (100.0 / 56)

    # Current cycle: ~100 days so far
    c2_values = []
    level = 100.0
    for _ in range(20):
        c2_values.extend([level] * 5)
        level -= 5.0

    all_values = c1_values + [100.0] + c2_values  # jump back to 100
    readings = _make_readings(all_values, interval_days=0.5)
    rep_t = len(c1_values) * 0.5 * DAY

    cycles = isolate_primary_cycles(readings, [rep_t])
    assert len(cycles) == 2
    assert cycles[0].is_completed is True
    assert cycles[1].is_completed is False


def test_scenario_s7_radio_silence_gap():
    """S7: 30-day gap with level drop does NOT split."""
    # 200 days normal, 30-day gap, 70 more days
    readings = []
    for d in range(200):
        readings.append({"t": d * DAY, "v": 100.0 - d * 0.175})  # ~65% at day 200
    # Gap: no readings for 30 days
    for d in range(70):
        t = (230 + d) * DAY
        readings.append({"t": t, "v": 55.0 - d * 0.5})

    cycles = isolate_primary_cycles(readings, [])
    assert len(cycles) == 1, "Gap should not trigger a split"
