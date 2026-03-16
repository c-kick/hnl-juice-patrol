"""Shared test fixtures for Juice Patrol tests."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from homeassistant.core import HomeAssistant

from custom_components.juice_patrol.const import DOMAIN


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Automatically enable custom integrations in all tests."""
    yield


@pytest.fixture(autouse=True)
def skip_integration_deps():
    """Skip dependency setup — we don't need recorder/frontend in unit tests."""
    with (
        patch("homeassistant.config_entries.async_process_deps_reqs"),
        patch("homeassistant.setup.async_process_deps_reqs"),
    ):
        yield


@pytest.fixture
def mock_coordinator():
    """Create a mock JuicePatrolCoordinator."""
    coordinator = MagicMock()
    coordinator.data = {}
    coordinator.discovered = {}
    coordinator.store = MagicMock()
    coordinator.store.devices = {}
    coordinator.store.get_ignored_entities.return_value = set()
    coordinator.type_resolver = MagicMock()
    coordinator._history_cache = MagicMock()
    coordinator.async_request_refresh = AsyncMock()
    coordinator.async_manual_refresh = AsyncMock()
    coordinator.async_shutdown = AsyncMock()
    coordinator.low_threshold = 20
    coordinator.stale_timeout_hours = 48
    coordinator.prediction_horizon_days = 7
    coordinator.config_entry = MagicMock()
    coordinator.last_update_success = True
    coordinator.async_add_listener = MagicMock(return_value=lambda: None)
    coordinator.async_register_new_device_callback = MagicMock()
    return coordinator


@pytest.fixture
def mock_setup_panel():
    """Mock panel registration — patch where it's imported."""
    with patch(
        "custom_components.juice_patrol.async_setup_panel",
        new_callable=AsyncMock,
    ) as mock:
        yield mock


@pytest.fixture
def mock_coordinator_setup():
    """Mock the coordinator class — patch where it's imported in __init__.py."""
    with patch(
        "custom_components.juice_patrol.JuicePatrolCoordinator",
    ) as mock_cls:
        instance = MagicMock()
        instance.data = {}
        instance.discovered = {}
        instance.async_setup = AsyncMock()
        instance.async_config_entry_first_refresh = AsyncMock()
        instance.async_shutdown = AsyncMock()
        instance.async_request_refresh = AsyncMock()
        instance.async_register_new_device_callback = MagicMock()
        instance.last_update_success = True
        instance.store = MagicMock()
        instance.store.devices = {}
        mock_cls.return_value = instance
        yield mock_cls, instance
