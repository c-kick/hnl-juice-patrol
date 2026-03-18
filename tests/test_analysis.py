"""Tests for Juice Patrol battery analysis."""

import time

from custom_components.juice_patrol.engine.analysis import (
    AnalysisResult,
    DischargeAnomaly,
    Stability,
    analyze_battery,
    detect_replacement_jumps,
)


def _readings(levels: list[float], span_hours: float = 168.0) -> list[dict[str, float]]:
    """Generate readings from level list over the given span."""
    now = time.time()
    count = len(levels)
    if count <= 1:
        return [{"t": now, "v": levels[0]}] if levels else []
    interval = (span_hours * 3600) / (count - 1)
    return [{"t": now - (count - 1 - i) * interval, "v": v} for i, v in enumerate(levels)]


class TestStability:
    """Test stability analysis."""

    def test_insufficient_data(self):
        result = analyze_battery(_readings([90, 88, 85]))
        assert result.stability == Stability.INSUFFICIENT_DATA

    def test_stable_discharge(self):
        """Gradual monotonic discharge is stable."""
        levels = [100, 98, 96, 94, 92, 90, 88, 86, 84, 82]
        result = analyze_battery(_readings(levels))
        assert result.stability == Stability.STABLE

    def test_stable_narrow_range(self):
        """Small range readings (< 10%) are stable even if noisy."""
        levels = [95, 96, 94, 95, 93, 94, 95, 93, 94, 93]
        result = analyze_battery(_readings(levels))
        assert result.stability == Stability.STABLE

    def test_erratic_cliff_and_recovery(self):
        """Large cliff drop + recovery is erratic."""
        levels = [90, 88, 86, 5, 3, 85, 83, 81, 4, 80]
        result = analyze_battery(_readings(levels))
        assert result.stability in (Stability.ERRATIC, Stability.MODERATE)

    def test_upward_trend_nonrechargeable(self):
        """Non-rechargeable device with consistently rising levels is erratic."""
        levels = [80, 82, 84, 86, 88, 90, 92, 94, 96, 98]
        result = analyze_battery(
            _readings(levels),
            is_rechargeable_override=False,
        )
        assert result.stability == Stability.ERRATIC


class TestDischargeAnomaly:
    """Test discharge anomaly detection."""

    def test_normal(self):
        levels = [100, 98, 96, 94, 92, 90]
        result = analyze_battery(_readings(levels))
        assert result.discharge_anomaly == DischargeAnomaly.NORMAL

    def test_cliff_drop(self):
        """Drop >30% in one interval is a cliff."""
        levels = [90, 88, 86, 84, 82, 40]
        result = analyze_battery(_readings(levels))
        assert result.discharge_anomaly == DischargeAnomaly.CLIFF
        assert result.drop_size is not None
        assert result.drop_size > 30

    def test_normal_small_drop(self):
        """A moderate drop is not an anomaly."""
        levels = [90, 88, 86, 84, 82, 75]
        result = analyze_battery(_readings(levels))
        assert result.discharge_anomaly == DischargeAnomaly.NORMAL

    def test_gradual_cliff_multi_reading(self):
        """80 -> 55 -> 20 over 24h -> CLIFF detected (cumulative > 40)."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 90},
            {"t": now - 43200, "v": 80},
            {"t": now - 21600, "v": 55},
            {"t": now, "v": 20},
        ]
        result = analyze_battery(readings)
        assert result.discharge_anomaly == DischargeAnomaly.CLIFF

    def test_normal_drain_not_cliff(self):
        """80 -> 78 -> 76 over 24h -> NORMAL."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 90},
            {"t": now - 43200, "v": 80},
            {"t": now - 21600, "v": 78},
            {"t": now, "v": 76},
        ]
        result = analyze_battery(readings)
        assert result.discharge_anomaly == DischargeAnomaly.NORMAL

    def test_single_interval_cliff_still_works(self):
        """Single large drop > 30% still detected."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 90},
            {"t": now - 43200, "v": 88},
            {"t": now, "v": 30},
        ]
        result = analyze_battery(readings)
        assert result.discharge_anomaly == DischargeAnomaly.CLIFF

    def test_slow_multi_drop_not_cliff(self):
        """80 -> 55 -> 20 over 7 days -> NORMAL (too slow for cliff)."""
        now = time.time()
        readings = [
            {"t": now - 86400 * 14, "v": 90},
            {"t": now - 86400 * 7, "v": 80},
            {"t": now - 86400 * 4, "v": 55},
            {"t": now, "v": 20},
        ]
        result = analyze_battery(readings)
        assert result.discharge_anomaly == DischargeAnomaly.NORMAL


class TestRechargeableDetection:
    """Test rechargeable battery detection."""

    def test_manual_override_true(self):
        result = analyze_battery(
            _readings([90, 88, 86, 84, 82]),
            is_rechargeable_override=True,
        )
        assert result.is_rechargeable is True
        assert result.rechargeable_reason == "manual"

    def test_manual_override_false(self):
        result = analyze_battery(
            _readings([90, 88, 86, 84, 82]),
            is_rechargeable_override=False,
        )
        assert result.is_rechargeable is False

    def test_battery_type_not_rechargeable(self):
        """Battery type alone no longer triggers rechargeable — only manual
        override and battery_state do."""
        for btype in ("Li-ion", "NiMH", "CR2032"):
            result = analyze_battery(
                _readings([90, 88, 86, 84, 82]),
                battery_type=btype,
            )
            assert result.is_rechargeable is False

    def test_battery_state_charging(self):
        result = analyze_battery(
            _readings([90, 88, 86, 84, 82]),
            battery_state="Charging",
        )
        assert result.is_rechargeable is True
        assert "battery_state" in result.rechargeable_reason

    def test_battery_state_not_charging(self):
        result = analyze_battery(
            _readings([90, 88, 86, 84, 82]),
            battery_state="Not Charging",
        )
        assert result.is_rechargeable is True

    def test_gradual_increases_not_rechargeable(self):
        """Gradual increases alone no longer trigger rechargeable —
        removed behavioral heuristic to prevent false positives from
        staircase sensors bouncing between discrete levels."""
        now = time.time()
        readings = []
        for i in range(15):
            readings.append({"t": now - (14 - i) * 7200, "v": 50 + i * 2})
        result = analyze_battery(readings)
        assert result.is_rechargeable is False

    def test_no_rechargeable_indicators(self):
        result = analyze_battery(
            _readings([90, 88, 86, 84, 82]),
            battery_type="AAA",
        )
        assert result.is_rechargeable is False
        assert result.rechargeable_reason is None


class TestReplacementDetection:
    """Test battery replacement detection in analysis."""

    def test_replacement_detected(self):
        """Large jump from low to high on non-rechargeable = replacement."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 15},
            {"t": now, "v": 100},
        ]
        result = analyze_battery(readings, low_threshold=20.0)
        assert result.replacement_detected is True
        assert result.replacement_old_level == 15
        assert result.replacement_new_level == 100

    def test_no_replacement_on_rechargeable(self):
        """Rechargeable devices don't trigger replacement."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 15},
            {"t": now, "v": 100},
        ]
        result = analyze_battery(
            readings,
            is_rechargeable_override=True,
            low_threshold=20.0,
        )
        assert result.replacement_detected is False

    def test_no_replacement_small_jump(self):
        """Small jump is not a replacement."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 50},
            {"t": now, "v": 70},
        ]
        result = analyze_battery(readings, low_threshold=20.0)
        assert result.replacement_detected is False

    def test_no_replacement_already_confirmed(self):
        """Jump after last_replaced timestamp is not flagged."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 15},
            {"t": now - 3600, "v": 100},
        ]
        result = analyze_battery(
            readings,
            last_replaced=now,  # Replaced after the readings
            low_threshold=20.0,
        )
        assert result.replacement_detected is False


class TestDetectReplacementJumps:
    """Test historical replacement jump detection."""

    def test_single_replacement(self):
        """Detect a clear replacement jump in history."""
        now = time.time()
        readings = [
            {"t": now - 86400 * 10, "v": 100},
            {"t": now - 86400 * 8, "v": 80},
            {"t": now - 86400 * 6, "v": 50},
            {"t": now - 86400 * 4, "v": 20},
            {"t": now - 86400 * 3, "v": 100},  # Replacement
            {"t": now - 86400 * 2, "v": 95},
            {"t": now, "v": 90},
        ]
        result = detect_replacement_jumps(readings, low_threshold=20.0)
        assert len(result) == 1
        assert result[0]["old_level"] == 20
        assert result[0]["new_level"] == 100

    def test_multiple_replacements(self):
        """Detect multiple replacements in longer history."""
        now = time.time()
        readings = [
            {"t": now - 86400 * 20, "v": 100},
            {"t": now - 86400 * 15, "v": 30},
            {"t": now - 86400 * 14, "v": 100},  # First replacement
            {"t": now - 86400 * 10, "v": 35},
            {"t": now - 86400 * 9, "v": 100},   # Second replacement
            {"t": now, "v": 90},
        ]
        result = detect_replacement_jumps(readings, low_threshold=20.0)
        assert len(result) == 2

    def test_excludes_known_replacements(self):
        """Already-confirmed replacements are excluded."""
        now = time.time()
        jump_ts = now - 86400 * 3
        readings = [
            {"t": now - 86400 * 4, "v": 20},
            {"t": jump_ts, "v": 100},
            {"t": now, "v": 90},
        ]
        result = detect_replacement_jumps(
            readings, low_threshold=20.0,
            known_replacements=[jump_ts],
        )
        assert len(result) == 0

    def test_excludes_denied_replacements(self):
        """User-denied replacements are excluded."""
        now = time.time()
        jump_ts = now - 86400 * 3
        readings = [
            {"t": now - 86400 * 4, "v": 20},
            {"t": jump_ts, "v": 100},
            {"t": now, "v": 90},
        ]
        result = detect_replacement_jumps(
            readings, low_threshold=20.0,
            denied_replacements=[jump_ts],
        )
        assert len(result) == 0

    def test_moderate_to_high_is_suspicious(self):
        """Jump from moderate level to high is suspicious on non-rechargeable."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 60},
            {"t": now, "v": 100},
        ]
        result = detect_replacement_jumps(readings, low_threshold=20.0)
        assert len(result) == 1  # 60→100 (+40) is suspicious

    def test_no_jump_when_small(self):
        """Small upward movement is not a replacement."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 50},
            {"t": now, "v": 65},
        ]
        result = detect_replacement_jumps(readings, low_threshold=20.0)
        assert len(result) == 0

    def test_multi_step_ramp(self):
        """Detect replacement that calibrates over multiple readings (e.g., 54→70→100)."""
        now = time.time()
        readings = [
            {"t": now - 86400 * 5, "v": 100},
            {"t": now - 86400 * 3, "v": 54},
            {"t": now - 86400 * 3 + 3600, "v": 70},   # +16, intermediate
            {"t": now - 86400 * 3 + 7200, "v": 100},   # +46 cumulative
            {"t": now, "v": 95},
        ]
        result = detect_replacement_jumps(readings, low_threshold=20.0)
        assert len(result) == 1
        assert result[0]["old_level"] == 54
        assert result[0]["new_level"] == 100

    def test_empty_readings(self):
        """Empty or single reading returns nothing."""
        assert detect_replacement_jumps([], low_threshold=20.0) == []
        assert detect_replacement_jumps(
            [{"t": time.time(), "v": 50}], low_threshold=20.0
        ) == []
