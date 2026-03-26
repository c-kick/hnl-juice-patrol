"""Tests for Juice Patrol diagnostics."""

from unittest.mock import MagicMock

import pytest

from custom_components.juice_patrol.diagnostics import (
    async_get_config_entry_diagnostics,
)


@pytest.mark.asyncio
async def test_diagnostics_empty(hass, mock_coordinator) -> None:
    """Test diagnostics with no discovered devices."""
    entry = MagicMock()
    entry.runtime_data = mock_coordinator
    entry.options = {"low_threshold": 20}
    mock_coordinator.data = {}

    result = await async_get_config_entry_diagnostics(hass, entry)
    assert result["discovered_devices"] == 0
    assert result["devices"] == {}
    assert "config_options" in result


@pytest.mark.asyncio
async def test_diagnostics_with_devices(hass, mock_coordinator) -> None:
    """Test diagnostics with devices."""
    entry = MagicMock()
    entry.runtime_data = mock_coordinator
    entry.options = {"low_threshold": 20}

    mock_coordinator.data = {
        "sensor.test_battery": {
            "level": 85.0,
            "battery_type": "CR2032",
            "is_rechargeable": False,
            "is_low": False,
            "is_stale": False,
            "last_replaced": None,
        }
    }
    mock_coordinator.discovered = {"sensor.test_battery": MagicMock()}
    mock_coordinator.store.devices = {"sensor.test_battery": MagicMock()}
    mock_coordinator.store.get_ignored_entities.return_value = set()

    result = await async_get_config_entry_diagnostics(hass, entry)
    assert result["discovered_devices"] == 1
    assert "sensor.test_battery" in result["devices"]
    diag = result["devices"]["sensor.test_battery"]
    assert diag["level"] == 85.0
    assert diag["battery_type"] == "CR2032"
    assert diag["is_rechargeable"] is False


@pytest.mark.asyncio
async def test_diagnostics_no_data(hass, mock_coordinator) -> None:
    """Test diagnostics when device has minimal data."""
    entry = MagicMock()
    entry.runtime_data = mock_coordinator
    entry.options = {}

    mock_coordinator.data = {
        "sensor.test_battery": {
            "level": 95.0,
            "battery_type": None,
            "is_rechargeable": False,
            "is_low": False,
            "is_stale": False,
            "last_replaced": None,
        }
    }
    mock_coordinator.discovered = {}
    mock_coordinator.store.devices = {}

    result = await async_get_config_entry_diagnostics(hass, entry)
    diag = result["devices"]["sensor.test_battery"]
    assert diag["level"] == 95.0
    assert diag["battery_type"] is None
