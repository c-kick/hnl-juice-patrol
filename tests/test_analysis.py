"""Tests for Juice Patrol battery analysis."""

import time

from custom_components.juice_patrol.analysis import (
    AnalysisResult,
    DischargeAnomaly,
    Stability,
    analyze_battery,
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

    def test_battery_type_lithium(self):
        result = analyze_battery(
            _readings([90, 88, 86, 84, 82]),
            battery_type="Li-ion",
        )
        assert result.is_rechargeable is True
        assert "battery type" in result.rechargeable_reason

    def test_battery_type_nimh(self):
        result = analyze_battery(
            _readings([90, 88, 86, 84, 82]),
            battery_type="NiMH",
        )
        assert result.is_rechargeable is True

    def test_battery_type_cr2032_not_rechargeable(self):
        result = analyze_battery(
            _readings([90, 88, 86, 84, 82]),
            battery_type="CR2032",
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

    def test_behavioral_detection(self):
        """Gradual increases in readings indicate rechargeable."""
        now = time.time()
        readings = []
        for i in range(15):
            # Gradual increase: +2% every 2 hours
            readings.append({"t": now - (14 - i) * 7200, "v": 50 + i * 2})
        result = analyze_battery(readings)
        assert result.is_rechargeable is True
        assert "gradual charging" in result.rechargeable_reason

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
