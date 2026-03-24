"""Tests for Juice Patrol __init__.py — services, setup, unload."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError

from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.juice_patrol import (
    _async_options_updated,
    _get_coordinator,
    _require_coordinator,
    _require_monitored,
    async_setup,
    async_setup_entry,
    async_unload_entry,
)
from custom_components.juice_patrol.const import (
    CONF_LOW_THRESHOLD,
    DOMAIN,
)


async def test_async_setup_registers_services(
    hass: HomeAssistant, mock_setup_panel
) -> None:
    """Test that async_setup registers all services."""
    with patch(
        "custom_components.juice_patrol.websocket_api.async_register_command"
    ):
        result = await async_setup(hass, {})
        assert result is True

    assert hass.services.has_service(DOMAIN, "force_refresh")
    assert hass.services.has_service(DOMAIN, "mark_replaced")
    assert hass.services.has_service(DOMAIN, "set_device_threshold")
    assert hass.services.has_service(DOMAIN, "ignore_device")
    assert hass.services.has_service(DOMAIN, "unignore_device")


async def test_setup_and_unload_entry(
    hass: HomeAssistant,
    mock_setup_panel,
    mock_coordinator_setup,
) -> None:
    """Test full setup and unload cycle."""
    mock_cls, mock_instance = mock_coordinator_setup

    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Juice Patrol",
        data={},
        options={CONF_LOW_THRESHOLD: 20},
        unique_id=DOMAIN,
    )
    entry.add_to_hass(hass)

    with patch(
        "custom_components.juice_patrol.websocket_api.async_register_command"
    ):
        await async_setup(hass, {})

    # Mock platform forwarding to avoid needing real platforms
    with patch.object(
        hass.config_entries, "async_forward_entry_setups", new_callable=AsyncMock
    ):
        assert await async_setup_entry(hass, entry)

    assert entry.runtime_data is mock_instance

    # Unload
    with patch.object(
        hass.config_entries, "async_unload_platforms", return_value=True
    ):
        assert await async_unload_entry(hass, entry)

    mock_instance.async_shutdown.assert_called_once()


async def test_setup_entry_failure_cleans_up(
    hass: HomeAssistant,
    mock_setup_panel,
    mock_coordinator_setup,
) -> None:
    """Test that setup failure cleans up the coordinator."""
    mock_cls, mock_instance = mock_coordinator_setup
    mock_instance.async_config_entry_first_refresh = AsyncMock(
        side_effect=Exception("boom")
    )

    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Juice Patrol",
        data={},
        options={},
        unique_id=DOMAIN,
    )
    entry.add_to_hass(hass)

    with pytest.raises(Exception, match="boom"):
        await async_setup_entry(hass, entry)

    mock_instance.async_shutdown.assert_called_once()


class TestGetCoordinator:
    """Test coordinator lookup helpers."""

    def test_get_coordinator_none_when_not_loaded(self, hass: HomeAssistant):
        """Return None when no entries are loaded."""
        result = _get_coordinator(hass)
        assert result is None

    def test_require_coordinator_raises(self, hass: HomeAssistant):
        """Raise ServiceValidationError when not loaded."""
        with pytest.raises(ServiceValidationError):
            _require_coordinator(hass)

    def test_require_monitored_raises(self, mock_coordinator):
        """Raise when entity not in discovered."""
        with pytest.raises(ServiceValidationError):
            _require_monitored(mock_coordinator, "sensor.not_monitored")

    def test_require_monitored_ok(self, mock_coordinator):
        """No exception when entity is discovered."""
        mock_coordinator.discovered = {"sensor.battery": MagicMock()}
        _require_monitored(mock_coordinator, "sensor.battery")  # Should not raise


class TestAsyncOptionsUpdated:
    """Test that options update listener is non-blocking."""

    @pytest.mark.asyncio
    async def test_options_updated_is_fire_and_forget(self):
        """_async_options_updated should schedule refresh without awaiting it."""
        hass = MagicMock()
        hass.async_create_task = MagicMock(
            side_effect=lambda coro, *a, **kw: coro.close() or MagicMock()
        )
        entry = MagicMock()
        entry.runtime_data = MagicMock()
        entry.runtime_data.async_request_refresh = AsyncMock()

        await _async_options_updated(hass, entry)

        # The refresh should be scheduled via async_create_task, not awaited
        hass.async_create_task.assert_called_once()
        # The coroutine passed to async_create_task should be the refresh
        entry.runtime_data.async_request_refresh.assert_called_once()
