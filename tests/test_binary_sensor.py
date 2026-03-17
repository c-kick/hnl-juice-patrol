"""Tests for Juice Patrol binary sensor platform."""

from unittest.mock import MagicMock, patch

import pytest

from custom_components.juice_patrol.binary_sensor import (
    JuicePatrolAttentionNeeded,
    JuicePatrolBatteryLow,
    JuicePatrolStale,
    async_setup_entry,
)
from custom_components.juice_patrol.const import DOMAIN


def _make_device_info(
    *,
    level: float = 85,
    is_low: bool = False,
    is_stale: bool = False,
    threshold: int = 20,
    device_name: str = "Motion Sensor",
    device_id: str = "dev1",
) -> dict:
    return {
        "level": level,
        "is_low": is_low,
        "is_stale": is_stale,
        "threshold": threshold,
        "device_name": device_name,
        "device_id": device_id,
    }


def _make_battery_low(coordinator, entity_id="sensor.some_battery", **overrides):
    """Create a JuicePatrolBatteryLow from coordinator data."""
    info = coordinator.data[entity_id]
    slug = entity_id.split(".", 1)[-1]
    return JuicePatrolBatteryLow(coordinator, entity_id, slug, info)


def _make_stale(coordinator, entity_id="sensor.some_battery", **overrides):
    """Create a JuicePatrolStale from coordinator data."""
    info = coordinator.data[entity_id]
    slug = entity_id.split(".", 1)[-1]
    return JuicePatrolStale(coordinator, entity_id, slug, info)


class TestBatteryLow:
    """Test JuicePatrolBatteryLow binary sensor."""

    def test_is_on_true(self, mock_coordinator):
        """Battery below threshold reports is_on=True."""
        mock_coordinator.data = {
            "sensor.motion_battery": _make_device_info(level=15, is_low=True),
        }
        sensor = _make_battery_low(mock_coordinator, "sensor.motion_battery")
        assert sensor.is_on is True

    def test_is_on_false(self, mock_coordinator):
        """Battery above threshold reports is_on=False."""
        mock_coordinator.data = {
            "sensor.motion_battery": _make_device_info(level=85, is_low=False),
        }
        sensor = _make_battery_low(mock_coordinator, "sensor.motion_battery")
        assert sensor.is_on is False

    def test_is_on_none_when_no_data(self, mock_coordinator):
        """Returns None when coordinator has no data for entity."""
        mock_coordinator.data = {
            "sensor.motion_battery": _make_device_info(),
        }
        sensor = _make_battery_low(mock_coordinator, "sensor.motion_battery")
        # Clear data after construction to simulate missing data at runtime
        mock_coordinator.data = {}
        assert sensor.is_on is None

    def test_extra_state_attributes(self, mock_coordinator):
        """Attributes include source_entity, threshold, and level."""
        mock_coordinator.data = {
            "sensor.motion_battery": _make_device_info(
                level=15, is_low=True, threshold=20,
            ),
        }
        sensor = _make_battery_low(mock_coordinator, "sensor.motion_battery")
        attrs = sensor.extra_state_attributes
        assert attrs["source_entity"] == "sensor.motion_battery"
        assert attrs["threshold"] == 20
        assert attrs["level"] == 15


class TestStale:
    """Test JuicePatrolStale binary sensor."""

    def test_is_on_true(self, mock_coordinator):
        """Stale device reports is_on=True."""
        mock_coordinator.data = {
            "sensor.door_battery": _make_device_info(is_stale=True),
        }
        sensor = _make_stale(mock_coordinator, "sensor.door_battery")
        assert sensor.is_on is True

    def test_is_on_false(self, mock_coordinator):
        """Non-stale device reports is_on=False."""
        mock_coordinator.data = {
            "sensor.door_battery": _make_device_info(is_stale=False),
        }
        sensor = _make_stale(mock_coordinator, "sensor.door_battery")
        assert sensor.is_on is False

    def test_attributes_include_timeout(self, mock_coordinator):
        """Attributes include stale_timeout_hours from coordinator."""
        mock_coordinator.stale_timeout_hours = 72
        mock_coordinator.data = {
            "sensor.door_battery": _make_device_info(is_stale=False),
        }
        sensor = _make_stale(mock_coordinator, "sensor.door_battery")
        attrs = sensor.extra_state_attributes
        assert attrs["source_entity"] == "sensor.door_battery"
        assert attrs["stale_timeout_hours"] == 72


class TestAttentionNeeded:
    """Test JuicePatrolAttentionNeeded summary binary sensor."""

    def test_is_on_none_when_no_data(self, mock_coordinator):
        """Returns None when coordinator data is empty."""
        mock_coordinator.data = None
        sensor = JuicePatrolAttentionNeeded(mock_coordinator)
        assert sensor.is_on is None

    def test_is_on_false_all_ok(self, mock_coordinator):
        """All devices healthy means is_on=False."""
        mock_coordinator.data = {
            "sensor.a": _make_device_info(is_low=False, is_stale=False),
            "sensor.b": _make_device_info(is_low=False, is_stale=False),
        }
        sensor = JuicePatrolAttentionNeeded(mock_coordinator)
        assert sensor.is_on is False

    def test_is_on_true_one_low(self, mock_coordinator):
        """One low-battery device triggers attention."""
        mock_coordinator.data = {
            "sensor.a": _make_device_info(is_low=True, is_stale=False),
            "sensor.b": _make_device_info(is_low=False, is_stale=False),
        }
        sensor = JuicePatrolAttentionNeeded(mock_coordinator)
        assert sensor.is_on is True

    def test_is_on_true_one_stale(self, mock_coordinator):
        """One stale device triggers attention."""
        mock_coordinator.data = {
            "sensor.a": _make_device_info(is_low=False, is_stale=True),
            "sensor.b": _make_device_info(is_low=False, is_stale=False),
        }
        sensor = JuicePatrolAttentionNeeded(mock_coordinator)
        assert sensor.is_on is True

    def test_is_on_true_low_and_stale(self, mock_coordinator):
        """Both low and stale devices trigger attention."""
        mock_coordinator.data = {
            "sensor.a": _make_device_info(is_low=True, is_stale=False),
            "sensor.b": _make_device_info(is_low=False, is_stale=True),
        }
        sensor = JuicePatrolAttentionNeeded(mock_coordinator)
        assert sensor.is_on is True

    def test_attributes_empty_when_no_data(self, mock_coordinator):
        """Returns empty dict when no data."""
        mock_coordinator.data = None
        sensor = JuicePatrolAttentionNeeded(mock_coordinator)
        assert sensor.extra_state_attributes == {}

    def test_attributes_lists_and_counts(self, mock_coordinator):
        """Attributes include correct device lists and counts."""
        mock_coordinator.data = {
            "sensor.a": _make_device_info(is_low=True, is_stale=False),
            "sensor.b": _make_device_info(is_low=False, is_stale=True),
            "sensor.c": _make_device_info(is_low=False, is_stale=False),
        }
        sensor = JuicePatrolAttentionNeeded(mock_coordinator)
        attrs = sensor.extra_state_attributes
        assert attrs["low_battery_devices"] == ["sensor.a"]
        assert attrs["stale_devices"] == ["sensor.b"]
        assert attrs["low_count"] == 1
        assert attrs["stale_count"] == 1
        assert attrs["monitored_devices"] == 3

    def test_unique_id(self, mock_coordinator):
        """Summary sensor has expected unique ID."""
        sensor = JuicePatrolAttentionNeeded(mock_coordinator)
        assert sensor.unique_id == f"{DOMAIN}_attention_needed"


class TestSetupEntry:
    """Test async_setup_entry creates the right entities."""

    @pytest.mark.asyncio
    async def test_creates_per_device_and_summary_sensors(self, mock_coordinator):
        """Setup creates 2 binary sensors per device + 1 summary."""
        mock_coordinator.data = {
            "sensor.motion_battery": _make_device_info(device_name="Motion"),
            "sensor.door_battery": _make_device_info(device_name="Door"),
        }

        entry = MagicMock()
        entry.runtime_data = mock_coordinator

        added_entities: list = []

        def capture_add(entities, **kwargs):
            added_entities.extend(entities)

        hass = MagicMock()
        await async_setup_entry(hass, entry, capture_add)

        # 2 devices x 2 sensors (BatteryLow + Stale) + 1 AttentionNeeded
        assert len(added_entities) == 5

        type_counts = {}
        for entity in added_entities:
            cls_name = type(entity).__name__
            type_counts[cls_name] = type_counts.get(cls_name, 0) + 1

        assert type_counts["JuicePatrolBatteryLow"] == 2
        assert type_counts["JuicePatrolStale"] == 2
        assert type_counts["JuicePatrolAttentionNeeded"] == 1

    @pytest.mark.asyncio
    async def test_registers_new_device_callback(self, mock_coordinator):
        """Setup registers a callback for new device discovery."""
        mock_coordinator.data = {}

        entry = MagicMock()
        entry.runtime_data = mock_coordinator

        hass = MagicMock()
        await async_setup_entry(hass, entry, MagicMock())

        mock_coordinator.async_register_new_device_callback.assert_called_once()
