"""Tests for Juice Patrol diagnostics."""

from unittest.mock import MagicMock

import pytest

from custom_components.juice_patrol.diagnostics import (
    async_get_config_entry_diagnostics,
)
from custom_components.juice_patrol.predictions import (
    Confidence,
    PredictionResult,
    PredictionStatus,
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

    prediction = PredictionResult(
        slope_per_day=-1.5,
        slope_per_hour=-0.0625,
        intercept=100.0,
        r_squared=0.95,
        confidence=Confidence.HIGH,
        estimated_empty_timestamp=1710000000.0,
        estimated_days_remaining=53.0,
        estimated_hours_remaining=1272.0,
        data_points_used=50,
        status=PredictionStatus.NORMAL,
        reliability=85,
    )

    mock_coordinator.data = {
        "sensor.test_battery": {
            "level": 85.0,
            "reading_count": 50,
            "discharge_rate": 1.5,
            "last_replaced": None,
            "prediction": prediction,
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
    assert diag["prediction_confidence"] == Confidence.HIGH
    assert diag["prediction_days_remaining"] == 53.0


@pytest.mark.asyncio
async def test_diagnostics_no_prediction(hass, mock_coordinator) -> None:
    """Test diagnostics when device has no prediction."""
    entry = MagicMock()
    entry.runtime_data = mock_coordinator
    entry.options = {}

    mock_coordinator.data = {
        "sensor.test_battery": {
            "level": 95.0,
            "reading_count": 2,
            "discharge_rate": None,
            "last_replaced": None,
            "prediction": None,
        }
    }
    mock_coordinator.discovered = {}
    mock_coordinator.store.devices = {}

    result = await async_get_config_entry_diagnostics(hass, entry)
    diag = result["devices"]["sensor.test_battery"]
    assert diag["prediction_confidence"] is None
    assert diag["prediction_days_remaining"] is None
