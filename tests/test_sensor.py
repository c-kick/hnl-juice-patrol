"""Tests for Juice Patrol sensor platform."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest

from custom_components.juice_patrol.const import DOMAIN
from custom_components.juice_patrol.engine.analysis import (
    AnalysisResult,
    DischargeAnomaly,
    Stability,
)
from custom_components.juice_patrol.engine.predictions import (
    Confidence,
    PredictionResult,
    PredictionStatus,
)
from custom_components.juice_patrol.sensor import (
    JuicePatrolDaysRemaining,
    JuicePatrolDischargeRate,
    JuicePatrolLowestBattery,
    JuicePatrolPredictedEmpty,
    async_setup_entry,
)


def _make_prediction(**overrides) -> PredictionResult:
    """Build a PredictionResult with sensible defaults."""
    defaults = dict(
        slope_per_day=-0.5,
        slope_per_hour=-0.021,
        intercept=100.0,
        r_squared=0.95,
        confidence=Confidence.HIGH,
        estimated_empty_timestamp=1710000000.0,
        estimated_days_remaining=45.2,
        estimated_hours_remaining=1084.8,
        data_points_used=30,
        status=PredictionStatus.NORMAL,
        reliability=85,
    )
    defaults.update(overrides)
    return PredictionResult(**defaults)


def _make_analysis(**overrides) -> AnalysisResult:
    """Build an AnalysisResult with sensible defaults."""
    defaults = dict(
        stability=Stability.STABLE,
        stability_cv=0.02,
        mean_level=85.0,
        discharge_anomaly=DischargeAnomaly.NORMAL,
        drop_size=None,
        is_rechargeable=False,
        rechargeable_reason=None,
        replacement_detected=False,
        replacement_old_level=None,
        replacement_new_level=None,
    )
    defaults.update(overrides)
    return AnalysisResult(**defaults)


def _make_device_info(
    *,
    level: int = 75,
    prediction: PredictionResult | None = None,
    analysis: AnalysisResult | None = None,
    **overrides,
) -> dict:
    """Build a coordinator data entry for a single device."""
    defaults = dict(
        level=level,
        device_name="Living Room Motion",
        device_id="dev123",
        source_type="device_class",
        platform="zha",
        discharge_rate=0.5,
        discharge_rate_hour=0.021,
        battery_type="CR2032",
        battery_type_source="battery_notes library",
        is_rechargeable=False,
        replacement_pending=False,
        prediction=prediction,
        analysis=analysis,
        is_low=False,
        is_stale=False,
        threshold=20,
    )
    defaults.update(overrides)
    return defaults


SOURCE_ENTITY = "sensor.living_room_motion_battery"
SLUG = "living_room_motion_battery"


class TestAsyncSetupEntry:
    """Tests for the async_setup_entry platform function."""

    @pytest.mark.asyncio
    async def test_creates_per_device_and_summary_sensors(
        self, mock_coordinator
    ) -> None:
        """Setup creates 3 per-device sensors + 1 summary sensor."""
        mock_coordinator.data = {SOURCE_ENTITY: _make_device_info()}

        entry = MagicMock()
        entry.runtime_data = mock_coordinator

        added: list = []

        def capture_add(entities, **kwargs):
            added.extend(entities)

        await async_setup_entry(MagicMock(), entry, capture_add)

        # 3 per-device (discharge_rate, predicted_empty, days_remaining) + 1 summary
        assert len(added) == 4
        types = {type(e) for e in added}
        assert types == {
            JuicePatrolDischargeRate,
            JuicePatrolPredictedEmpty,
            JuicePatrolDaysRemaining,
            JuicePatrolLowestBattery,
        }

    @pytest.mark.asyncio
    async def test_registers_callback_for_new_devices(
        self, mock_coordinator
    ) -> None:
        """Setup registers a new-device callback on the coordinator."""
        mock_coordinator.data = {}
        entry = MagicMock()
        entry.runtime_data = mock_coordinator

        await async_setup_entry(MagicMock(), entry, MagicMock())

        mock_coordinator.async_register_new_device_callback.assert_called_once()

    @pytest.mark.asyncio
    async def test_callback_creates_sensors_for_new_devices(
        self, mock_coordinator
    ) -> None:
        """The registered callback creates sensors when new devices appear."""
        mock_coordinator.data = {}
        entry = MagicMock()
        entry.runtime_data = mock_coordinator

        added: list = []

        def capture_add(entities, **kwargs):
            added.extend(entities)

        await async_setup_entry(MagicMock(), entry, capture_add)

        # Only the summary sensor so far
        assert len(added) == 1
        assert isinstance(added[0], JuicePatrolLowestBattery)

        # Simulate new device discovery via the registered callback
        callback = (
            mock_coordinator.async_register_new_device_callback.call_args[0][0]
        )
        mock_coordinator.data = {SOURCE_ENTITY: _make_device_info()}
        callback([SOURCE_ENTITY])

        # Should now have 1 summary + 3 per-device = 4
        assert len(added) == 4

    @pytest.mark.asyncio
    async def test_callback_skips_already_known_devices(
        self, mock_coordinator
    ) -> None:
        """The callback does not create duplicate sensors for known devices."""
        mock_coordinator.data = {SOURCE_ENTITY: _make_device_info()}
        entry = MagicMock()
        entry.runtime_data = mock_coordinator

        added: list = []

        def capture_add(entities, **kwargs):
            added.extend(entities)

        await async_setup_entry(MagicMock(), entry, capture_add)
        assert len(added) == 4  # 3 per-device + 1 summary

        # Call the callback again with the same entity
        callback = (
            mock_coordinator.async_register_new_device_callback.call_args[0][0]
        )
        callback([SOURCE_ENTITY])

        # No new entities should be added
        assert len(added) == 4


class TestDischargeRate:
    """Tests for JuicePatrolDischargeRate sensor."""

    def test_native_value(self, mock_coordinator) -> None:
        """Discharge rate is read from coordinator data."""
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(discharge_rate=1.23)
        }
        sensor = JuicePatrolDischargeRate(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        assert sensor.native_value == 1.23

    def test_native_value_none_when_no_data(self, mock_coordinator) -> None:
        """Discharge rate is None when coordinator has no data for entity."""
        mock_coordinator.data = {}
        sensor = JuicePatrolDischargeRate(
            mock_coordinator, SOURCE_ENTITY, SLUG, {},
        )
        assert sensor.native_value is None

    def test_extra_state_attributes_with_analysis(
        self, mock_coordinator
    ) -> None:
        """Attributes include analysis fields when analysis is present."""
        analysis = _make_analysis(
            stability=Stability.MODERATE,
            stability_cv=0.08,
            mean_level=72.0,
            discharge_anomaly=DischargeAnomaly.RAPID,
            drop_size=15.0,
            rechargeable_reason="charge cycle detected",
        )
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(analysis=analysis)
        }
        sensor = JuicePatrolDischargeRate(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        attrs = sensor.extra_state_attributes

        # Core attributes
        assert attrs["source_entity"] == SOURCE_ENTITY
        assert attrs["platform"] == "zha"
        assert attrs["battery_type"] == "CR2032"
        assert attrs["battery_type_source"] == "battery_notes library"
        assert attrs["is_rechargeable"] is False
        assert attrs["replacement_pending"] is False
        assert attrs["discharge_rate_hour"] == 0.021

        # Analysis attributes
        assert attrs["stability"] == Stability.MODERATE
        assert attrs["stability_cv"] == 0.08
        assert attrs["mean_level"] == 72.0
        assert attrs["discharge_anomaly"] == DischargeAnomaly.RAPID
        assert attrs["drop_size"] == 15.0
        assert attrs["rechargeable_reason"] == "charge cycle detected"

    def test_extra_state_attributes_without_analysis(
        self, mock_coordinator
    ) -> None:
        """Attributes omit analysis fields when analysis is None."""
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(analysis=None)
        }
        sensor = JuicePatrolDischargeRate(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        attrs = sensor.extra_state_attributes

        assert attrs["source_entity"] == SOURCE_ENTITY
        assert "stability" not in attrs
        assert "mean_level" not in attrs

    def test_unique_id(self, mock_coordinator) -> None:
        """Unique ID follows the DOMAIN_source_suffix pattern."""
        mock_coordinator.data = {SOURCE_ENTITY: _make_device_info()}
        sensor = JuicePatrolDischargeRate(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        assert sensor.unique_id == f"{DOMAIN}_{SOURCE_ENTITY}_discharge_rate"


class TestPredictedEmpty:
    """Tests for JuicePatrolPredictedEmpty sensor."""

    def test_datetime_conversion_from_timestamp(
        self, mock_coordinator
    ) -> None:
        """Converts estimated_empty_timestamp to a UTC datetime."""
        ts = 1710000000.0
        prediction = _make_prediction(estimated_empty_timestamp=ts)
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(prediction=prediction)
        }
        sensor = JuicePatrolPredictedEmpty(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        expected = datetime.fromtimestamp(ts, tz=UTC)
        assert sensor.native_value == expected

    def test_none_when_no_prediction(self, mock_coordinator) -> None:
        """Returns None when there is no prediction."""
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(prediction=None)
        }
        sensor = JuicePatrolPredictedEmpty(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        assert sensor.native_value is None

    def test_none_when_timestamp_is_none(self, mock_coordinator) -> None:
        """Returns None when prediction exists but timestamp is None."""
        prediction = _make_prediction(estimated_empty_timestamp=None)
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(prediction=prediction)
        }
        sensor = JuicePatrolPredictedEmpty(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        assert sensor.native_value is None

    def test_enabled_by_default(self, mock_coordinator) -> None:
        """Sensor is enabled by default."""
        mock_coordinator.data = {SOURCE_ENTITY: _make_device_info()}
        sensor = JuicePatrolPredictedEmpty(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        assert sensor.entity_registry_enabled_default is True

    def test_extra_state_attributes_with_prediction(
        self, mock_coordinator
    ) -> None:
        """Attributes include prediction details when prediction is present."""
        prediction = _make_prediction()
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(prediction=prediction)
        }
        sensor = JuicePatrolPredictedEmpty(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        attrs = sensor.extra_state_attributes

        assert attrs["source_entity"] == SOURCE_ENTITY
        assert attrs["confidence"] == Confidence.HIGH
        assert attrs["discharge_rate_per_day"] == -0.5
        assert attrs["data_points_used"] == 30
        assert attrs["r_squared"] == 0.95
        assert attrs["status"] == PredictionStatus.NORMAL
        assert attrs["reliability"] == 85

    def test_extra_state_attributes_without_prediction(
        self, mock_coordinator
    ) -> None:
        """Attributes only contain source_entity when no prediction."""
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(prediction=None)
        }
        sensor = JuicePatrolPredictedEmpty(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        attrs = sensor.extra_state_attributes
        assert attrs == {"source_entity": SOURCE_ENTITY}

    def test_none_when_stale(self, mock_coordinator) -> None:
        """Suppress prediction when device is stale."""
        prediction = _make_prediction(estimated_empty_timestamp=1710000000.0)
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(
                prediction=prediction, is_stale=True
            )
        }
        sensor = JuicePatrolPredictedEmpty(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        assert sensor.native_value is None


class TestDaysRemaining:
    """Tests for JuicePatrolDaysRemaining sensor."""

    def test_native_value_from_prediction(self, mock_coordinator) -> None:
        """Returns estimated_days_remaining from prediction."""
        prediction = _make_prediction(estimated_days_remaining=45.2)
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(prediction=prediction)
        }
        sensor = JuicePatrolDaysRemaining(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        assert sensor.native_value == 45.2

    def test_none_when_no_prediction(self, mock_coordinator) -> None:
        """Returns None when there is no prediction."""
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(prediction=None)
        }
        sensor = JuicePatrolDaysRemaining(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        assert sensor.native_value is None

    def test_none_when_days_remaining_is_none(
        self, mock_coordinator
    ) -> None:
        """Returns None when prediction exists but days_remaining is None."""
        prediction = _make_prediction(estimated_days_remaining=None)
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(prediction=prediction)
        }
        sensor = JuicePatrolDaysRemaining(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        assert sensor.native_value is None

    def test_extra_state_attributes(self, mock_coordinator) -> None:
        """Attributes include hours_remaining, confidence, status, reliability."""
        prediction = _make_prediction(
            estimated_hours_remaining=1084.8,
            confidence=Confidence.MEDIUM,
            status=PredictionStatus.NOISY,
            reliability=60,
        )
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(prediction=prediction)
        }
        sensor = JuicePatrolDaysRemaining(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        attrs = sensor.extra_state_attributes

        assert attrs["source_entity"] == SOURCE_ENTITY
        assert attrs["hours_remaining"] == 1084.8
        assert attrs["confidence"] == Confidence.MEDIUM
        assert attrs["status"] == PredictionStatus.NOISY
        assert attrs["reliability"] == 60

    def test_extra_state_attributes_without_prediction(
        self, mock_coordinator
    ) -> None:
        """Attributes only contain source_entity when no prediction."""
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(prediction=None)
        }
        sensor = JuicePatrolDaysRemaining(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        assert sensor.extra_state_attributes == {
            "source_entity": SOURCE_ENTITY,
        }

    def test_none_when_stale(self, mock_coordinator) -> None:
        """Suppress prediction when device is stale."""
        prediction = _make_prediction(estimated_days_remaining=45.2)
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(
                prediction=prediction, is_stale=True
            )
        }
        sensor = JuicePatrolDaysRemaining(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        assert sensor.native_value is None


class TestLowestBattery:
    """Tests for JuicePatrolLowestBattery summary sensor."""

    def test_min_level_across_devices(self, mock_coordinator) -> None:
        """Returns the minimum battery level across all monitored devices."""
        mock_coordinator.data = {
            "sensor.a_battery": _make_device_info(
                level=90, device_name="Device A"
            ),
            "sensor.b_battery": _make_device_info(
                level=15, device_name="Device B"
            ),
            "sensor.c_battery": _make_device_info(
                level=55, device_name="Device C"
            ),
        }
        sensor = JuicePatrolLowestBattery(mock_coordinator)
        assert sensor.native_value == 15

    def test_attributes_show_lowest_device(self, mock_coordinator) -> None:
        """Attributes identify the device with the lowest battery."""
        mock_coordinator.data = {
            "sensor.a_battery": _make_device_info(
                level=90, device_name="Device A"
            ),
            "sensor.b_battery": _make_device_info(
                level=15, device_name="Device B"
            ),
        }
        sensor = JuicePatrolLowestBattery(mock_coordinator)
        attrs = sensor.extra_state_attributes

        assert attrs["lowest_entity"] == "sensor.b_battery"
        assert attrs["lowest_device"] == "Device B"
        assert attrs["monitored_devices"] == 2

    def test_none_when_no_data(self, mock_coordinator) -> None:
        """Returns None when coordinator has no data."""
        mock_coordinator.data = None
        sensor = JuicePatrolLowestBattery(mock_coordinator)
        assert sensor.native_value is None
        assert sensor.extra_state_attributes == {}

    def test_none_when_empty_data(self, mock_coordinator) -> None:
        """Returns None when coordinator data dict is empty."""
        mock_coordinator.data = {}
        sensor = JuicePatrolLowestBattery(mock_coordinator)
        assert sensor.native_value is None

    def test_skips_devices_with_none_level(self, mock_coordinator) -> None:
        """Devices with level=None are excluded from the minimum."""
        mock_coordinator.data = {
            "sensor.a_battery": _make_device_info(level=None),
            "sensor.b_battery": _make_device_info(level=60),
        }
        sensor = JuicePatrolLowestBattery(mock_coordinator)
        assert sensor.native_value == 60

    def test_all_none_levels(self, mock_coordinator) -> None:
        """Returns None when all devices have level=None."""
        mock_coordinator.data = {
            "sensor.a_battery": _make_device_info(level=None),
            "sensor.b_battery": _make_device_info(level=None),
        }
        sensor = JuicePatrolLowestBattery(mock_coordinator)
        assert sensor.native_value is None
        attrs = sensor.extra_state_attributes
        assert attrs["monitored_devices"] == 2
        assert "lowest_entity" not in attrs

    def test_unique_id(self, mock_coordinator) -> None:
        """Summary sensor has a stable unique ID."""
        sensor = JuicePatrolLowestBattery(mock_coordinator)
        assert sensor.unique_id == f"{DOMAIN}_lowest_battery"

    def test_uses_juice_patrol_device_info(self, mock_coordinator) -> None:
        """Summary sensor is grouped under the Juice Patrol virtual device."""
        from custom_components.juice_patrol.entity import (
            JUICE_PATROL_DEVICE_INFO,
        )

        sensor = JuicePatrolLowestBattery(mock_coordinator)
        assert sensor.device_info is JUICE_PATROL_DEVICE_INFO
