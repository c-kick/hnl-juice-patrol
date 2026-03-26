"""Tests for Juice Patrol sensor platform."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from custom_components.juice_patrol.const import DOMAIN
from custom_components.juice_patrol.sensor import (
    JuicePatrolBatteryLevel,
    JuicePatrolLowestBattery,
    async_setup_entry,
)


def _make_device_info(
    *,
    level: int = 75,
    **overrides,
) -> dict:
    """Build a coordinator data entry for a single device."""
    defaults = dict(
        level=level,
        device_name="Living Room Motion",
        device_id="dev123",
        source_type="device_class",
        platform="zha",
        battery_type="CR2032",
        battery_type_source="battery_notes library",
        is_rechargeable=False,
        replacement_pending=False,
        is_low=False,
        is_stale=False,
        threshold=20,
        manufacturer="Aqara",
        model="RTCGQ11LM",
        charging_state=None,
        last_replaced=None,
        last_calculated=1710000000.0,
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
        """Setup creates 1 per-device sensor + 1 summary sensor."""
        mock_coordinator.data = {SOURCE_ENTITY: _make_device_info()}

        entry = MagicMock()
        entry.runtime_data = mock_coordinator

        added: list = []

        def capture_add(entities, **kwargs):
            added.extend(entities)

        await async_setup_entry(MagicMock(), entry, capture_add)

        # 1 per-device (battery_level) + 1 summary (lowest_battery)
        assert len(added) == 2
        types = {type(e) for e in added}
        assert types == {
            JuicePatrolBatteryLevel,
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

        # Should now have 1 summary + 1 per-device = 2
        assert len(added) == 2

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
        assert len(added) == 2  # 1 per-device + 1 summary

        # Call the callback again with the same entity
        callback = (
            mock_coordinator.async_register_new_device_callback.call_args[0][0]
        )
        callback([SOURCE_ENTITY])

        # No new entities should be added
        assert len(added) == 2


class TestBatteryLevel:
    """Tests for JuicePatrolBatteryLevel sensor."""

    def test_native_value(self, mock_coordinator) -> None:
        """Battery level is read from coordinator data."""
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info(level=75)
        }
        sensor = JuicePatrolBatteryLevel(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        assert sensor.native_value == 75

    def test_native_value_none_when_no_data(self, mock_coordinator) -> None:
        """Battery level is None when coordinator has no data for entity."""
        mock_coordinator.data = {}
        sensor = JuicePatrolBatteryLevel(
            mock_coordinator, SOURCE_ENTITY, SLUG, {},
        )
        assert sensor.native_value is None

    def test_extra_state_attributes(self, mock_coordinator) -> None:
        """Attributes include all expected fields."""
        mock_coordinator.data = {
            SOURCE_ENTITY: _make_device_info()
        }
        sensor = JuicePatrolBatteryLevel(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        attrs = sensor.extra_state_attributes

        assert attrs["source_entity"] == SOURCE_ENTITY
        assert attrs["platform"] == "zha"
        assert attrs["battery_type"] == "CR2032"
        assert attrs["battery_type_source"] == "battery_notes library"
        assert attrs["is_rechargeable"] is False
        assert attrs["replacement_pending"] is False

    def test_unique_id(self, mock_coordinator) -> None:
        """Unique ID follows the DOMAIN_source_suffix pattern."""
        mock_coordinator.data = {SOURCE_ENTITY: _make_device_info()}
        sensor = JuicePatrolBatteryLevel(
            mock_coordinator, SOURCE_ENTITY, SLUG,
            mock_coordinator.data[SOURCE_ENTITY],
        )
        assert sensor.unique_id == f"{DOMAIN}_{SOURCE_ENTITY}_battery_level"


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
