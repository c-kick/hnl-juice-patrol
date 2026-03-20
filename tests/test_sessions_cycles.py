"""Tests for completed cycle detection and device class models."""

from custom_components.juice_patrol.engine.models import (
    DeviceClassModels,
    MAX_CYCLES_PER_DEVICE,
)
from custom_components.juice_patrol.engine.sessions import (
    CompletedCycle,
    extract_completed_cycles,
    extract_discharge_sessions,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_discharge(
    start_v: float, end_v: float, count: int,
    start_t: float, span_hours: float,
) -> list[dict[str, float]]:
    """Generate a linear discharge segment."""
    interval = (span_hours * 3600) / max(count - 1, 1)
    step = (end_v - start_v) / max(count - 1, 1)
    return [
        {"t": start_t + i * interval, "v": start_v + i * step}
        for i in range(count)
    ]


def _make_sawtooth(
    cycles: int, start_t: float = 1_000_000.0,
    high: float = 100.0, low: float = 20.0,
    discharge_hours: float = 200.0, charge_hours: float = 5.0,
    points_per_segment: int = 20,
) -> list[dict[str, float]]:
    """Generate sawtooth charge/discharge readings."""
    readings: list[dict[str, float]] = []
    t = start_t
    for _ in range(cycles):
        # Discharge
        readings.extend(_make_discharge(
            high, low, points_per_segment, t, discharge_hours,
        ))
        t = readings[-1]["t"] + 3600
        # Charge
        readings.extend(_make_discharge(
            low, high, points_per_segment // 4 or 3, t, charge_hours,
        ))
        t = readings[-1]["t"] + 3600
    return readings


# ---------------------------------------------------------------------------
# extract_completed_cycles tests
# ---------------------------------------------------------------------------


class TestExtractCompletedCycles:
    """Test completed cycle detection."""

    def test_empty_readings(self):
        assert extract_completed_cycles([], [1000.0]) == []

    def test_no_replacements(self):
        readings = _make_discharge(100, 20, 20, 1_000_000, 200)
        assert extract_completed_cycles(readings, []) == []

    def test_single_cycle_matched(self):
        """One discharge session ending near a replacement → 1 completed cycle."""
        readings = _make_discharge(100, 20, 20, 1_000_000, 200)
        end_t = readings[-1]["t"]
        # Replacement 12 hours after session end (within 48h tolerance)
        replacement_t = end_t + 12 * 3600

        cycles = extract_completed_cycles(readings, [replacement_t])
        assert len(cycles) == 1
        c = cycles[0]
        assert isinstance(c, CompletedCycle)
        assert c.start_pct == 100.0
        assert c.end_pct == 20.0
        assert c.duration_days > 0
        assert abs(c.replacement_t - replacement_t) < 1

    def test_replacement_too_far(self):
        """Replacement > tolerance_hours after session end → no match."""
        readings = _make_discharge(100, 20, 20, 1_000_000, 200)
        end_t = readings[-1]["t"]
        # 72 hours later — exceeds 48h default tolerance
        replacement_t = end_t + 72 * 3600

        cycles = extract_completed_cycles(readings, [replacement_t])
        assert len(cycles) == 0

    def test_custom_tolerance(self):
        """Custom tolerance window."""
        readings = _make_discharge(100, 20, 20, 1_000_000, 200)
        end_t = readings[-1]["t"]
        replacement_t = end_t + 5 * 3600

        # 2h tolerance — too tight
        cycles = extract_completed_cycles(
            readings, [replacement_t], tolerance_hours=2.0,
        )
        assert len(cycles) == 0

        # 10h tolerance — should match
        cycles = extract_completed_cycles(
            readings, [replacement_t], tolerance_hours=10.0,
        )
        assert len(cycles) == 1

    def test_multiple_cycles_from_sawtooth(self):
        """Sawtooth with replacements at each trough → multiple completed cycles."""
        readings = _make_sawtooth(3, start_t=1_000_000)

        # Find the discharge session ends (troughs)
        sessions = extract_discharge_sessions(readings)
        assert len(sessions) >= 2  # at least 2 full discharge sessions

        # Place replacements near each session end
        replacement_ts = [s[-1]["t"] + 3600 for s in sessions]

        cycles = extract_completed_cycles(readings, replacement_ts)
        assert len(cycles) >= 2

    def test_replacement_matched_once(self):
        """Each replacement matches at most one session."""
        readings = _make_sawtooth(3, start_t=1_000_000)
        sessions = extract_discharge_sessions(readings)

        # Single replacement near the first session end
        replacement_ts = [sessions[0][-1]["t"] + 1800]

        cycles = extract_completed_cycles(readings, replacement_ts)
        assert len(cycles) == 1

    def test_replacement_before_session_end(self):
        """Replacement slightly before session end (within tolerance) matches."""
        readings = _make_discharge(100, 20, 20, 1_000_000, 200)
        end_t = readings[-1]["t"]
        # Replacement 6 hours BEFORE session end
        replacement_t = end_t - 6 * 3600

        cycles = extract_completed_cycles(readings, [replacement_t])
        assert len(cycles) == 1

    def test_small_drop_filtered(self):
        """Sessions with < min_drop are not considered."""
        # Only 3% drop — below default 5% threshold
        readings = _make_discharge(100, 97, 10, 1_000_000, 48)
        replacement_t = readings[-1]["t"] + 3600

        cycles = extract_completed_cycles(readings, [replacement_t])
        assert len(cycles) == 0

    def test_cycles_sorted_chronologically(self):
        """Output is sorted by end_t."""
        readings = _make_sawtooth(4, start_t=1_000_000)
        sessions = extract_discharge_sessions(readings)
        # Replacements in reverse order
        replacement_ts = [s[-1]["t"] + 1800 for s in reversed(sessions)]

        cycles = extract_completed_cycles(readings, replacement_ts)
        for i in range(1, len(cycles)):
            assert cycles[i].end_t >= cycles[i - 1].end_t


# ---------------------------------------------------------------------------
# DeviceClassModels tests
# ---------------------------------------------------------------------------


class TestDeviceClassModels:
    """Test the in-memory class model cache."""

    def _sample_cycle(self, duration: float = 90.0) -> dict:
        return {
            "model": "exponential",
            "params": {"a": 80.0, "b": 0.02, "c": 15.0},
            "duration_days": duration,
        }

    def test_empty_prior(self):
        """No cycles → no prior."""
        models = DeviceClassModels()
        assert models.get_class_prior(None, "sensor.test") is None

    def test_single_cycle_prior(self):
        """One cycle → prior with that cycle's params."""
        models = DeviceClassModels()
        models.update_from_cycle(
            "sensor.test", "CR2032",
            "exponential", {"a": 80.0, "b": 0.02, "c": 15.0}, 90.0,
        )

        prior = models.get_class_prior("CR2032", "sensor.test")
        assert prior is not None
        assert prior.cycle_count == 1
        assert prior.model_name == "exponential"
        assert prior.median_duration_days == 90.0
        assert abs(prior.median_params["a"] - 80.0) < 0.01

    def test_class_grouping_by_battery_type(self):
        """Devices with same battery_type share a class."""
        models = DeviceClassModels()
        models.update_from_cycle(
            "sensor.door_1", "CR2032",
            "exponential", {"a": 80.0, "b": 0.02, "c": 15.0}, 90.0,
        )
        models.update_from_cycle(
            "sensor.door_2", "CR2032",
            "exponential", {"a": 85.0, "b": 0.018, "c": 12.0}, 100.0,
        )

        # Both contribute to the CR2032 class
        prior = models.get_class_prior("CR2032", "sensor.door_1")
        assert prior is not None
        assert prior.cycle_count == 2
        assert prior.median_duration_days == 95.0  # median of 90, 100

    def test_different_types_separate(self):
        """Different battery types have separate classes."""
        models = DeviceClassModels()
        models.update_from_cycle(
            "sensor.a", "CR2032",
            "exponential", {"a": 80.0}, 90.0,
        )
        models.update_from_cycle(
            "sensor.b", "AA",
            "exponential", {"a": 60.0}, 365.0,
        )

        prior_cr = models.get_class_prior("CR2032", "sensor.a")
        prior_aa = models.get_class_prior("AA", "sensor.b")
        assert prior_cr is not None
        assert prior_aa is not None
        assert prior_cr.median_duration_days == 90.0
        assert prior_aa.median_duration_days == 365.0

    def test_no_battery_type_per_entity(self):
        """Without battery_type, each entity is its own class."""
        models = DeviceClassModels()
        models.update_from_cycle(
            "sensor.a", None,
            "exponential", {"a": 80.0}, 90.0,
        )
        models.update_from_cycle(
            "sensor.b", None,
            "exponential", {"a": 60.0}, 180.0,
        )

        prior_a = models.get_class_prior(None, "sensor.a")
        prior_b = models.get_class_prior(None, "sensor.b")
        assert prior_a is not None and prior_a.cycle_count == 1
        assert prior_b is not None and prior_b.cycle_count == 1

    def test_load_cycles(self):
        """Loading stored cycles populates the class."""
        models = DeviceClassModels()
        stored = [
            {"model": "exponential", "params": {"a": 80.0}, "duration_days": 90.0},
            {"model": "exponential", "params": {"a": 85.0}, "duration_days": 100.0},
        ]
        models.load_cycles("sensor.test", "CR2032", stored)

        prior = models.get_class_prior("CR2032", "sensor.test")
        assert prior is not None
        assert prior.cycle_count == 2

    def test_dominant_model_selected(self):
        """Prior uses the most common model type."""
        models = DeviceClassModels()
        for _ in range(3):
            models.update_from_cycle(
                "sensor.x", "CR2032",
                "exponential", {"a": 80.0}, 90.0,
            )
        models.update_from_cycle(
            "sensor.x", "CR2032",
            "weibull", {"scale": 100.0}, 95.0,
        )

        prior = models.get_class_prior("CR2032", "sensor.x")
        assert prior is not None
        assert prior.model_name == "exponential"

    def test_iqr_computed(self):
        """IQR is computed across cycles."""
        models = DeviceClassModels()
        durations = [80.0, 85.0, 90.0, 95.0, 100.0, 105.0, 110.0, 120.0]
        for d in durations:
            models.update_from_cycle(
                "sensor.x", "CR2032",
                "exponential", {"a": 80.0}, d,
            )

        prior = models.get_class_prior("CR2032", "sensor.x")
        assert prior is not None
        assert prior.iqr_duration_days > 0

    def test_update_returns_cycle_dict(self):
        """update_from_cycle returns the stored cycle dict."""
        models = DeviceClassModels()
        result = models.update_from_cycle(
            "sensor.x", "CR2032",
            "exponential", {"a": 80.123456789}, 90.123,
        )
        assert result["model"] == "exponential"
        assert result["params"]["a"] == 80.123457  # rounded to 6 decimals
        assert result["duration_days"] == 90.12

    def test_class_count_and_total(self):
        """Verify class_count and total_cycles properties."""
        models = DeviceClassModels()
        models.update_from_cycle("s.a", "CR2032", "exp", {}, 90)
        models.update_from_cycle("s.b", "CR2032", "exp", {}, 100)
        models.update_from_cycle("s.c", "AA", "exp", {}, 365)

        assert models.class_count == 2  # CR2032 and AA
        assert models.total_cycles == 3
