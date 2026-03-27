"""Tests for Juice Patrol coordinator."""

import asyncio
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.juice_patrol.const import (
    CONF_LOW_THRESHOLD,
    CONF_STALE_TIMEOUT,
    DEFAULT_LOW_THRESHOLD,
    DEFAULT_STALE_TIMEOUT,
)
from custom_components.juice_patrol.data.coordinator import (
    JuicePatrolCoordinator,
)


# ── Coordinator construction helper ──────────────────────────────────────


def _consume_coroutine(coro, *_args, **_kwargs):
    """Close coroutine to prevent 'never awaited' RuntimeWarnings."""
    if hasattr(coro, "close"):
        coro.close()
    return MagicMock()


@pytest.fixture
def mock_hass():
    """Minimal mock HomeAssistant for coordinator construction."""
    hass = MagicMock()
    hass.config.path = MagicMock(return_value="/config")
    hass.bus = MagicMock()
    hass.states = MagicMock()
    hass.async_create_task = MagicMock(side_effect=_consume_coroutine)
    return hass


@pytest.fixture
def make_coordinator(mock_hass):
    """Factory fixture that creates a JuicePatrolCoordinator with patched deps."""
    def _make(options: dict | None = None):
        entry = MagicMock()
        entry.options = options or {}
        entry.entry_id = "test_entry_id"
        with patch(
            "custom_components.juice_patrol.data.coordinator.JuicePatrolStore"
        ) as mock_store_cls:
            mock_store = MagicMock()
            mock_store.mark_replaced = MagicMock(return_value=True)
            mock_store.get_device = MagicMock(return_value=None)
            mock_store.async_save = AsyncMock()
            mock_store_cls.return_value = mock_store

            coordinator = JuicePatrolCoordinator(mock_hass, entry)
        return coordinator

    return _make


# ── Properties ───────────────────────────────────────────────────────────


class TestProperties:
    """Test coordinator config-entry properties."""

    def test_low_threshold_from_options(self, make_coordinator):
        coord = make_coordinator({CONF_LOW_THRESHOLD: 25})
        assert coord.low_threshold == 25

    def test_stale_timeout_default(self, make_coordinator):
        coord = make_coordinator({})
        assert coord.stale_timeout_hours == DEFAULT_STALE_TIMEOUT

    def test_low_threshold_default(self, make_coordinator):
        coord = make_coordinator({})
        assert coord.low_threshold == DEFAULT_LOW_THRESHOLD


# ── Dedup cleanup on disappeared entities ────────────────────────────────


class TestDedupCleanup:
    """Test that disappeared entities are cleaned from tracking sets."""

    @pytest.mark.asyncio
    async def test_disappeared_entities_cleaned_from_tracking(
        self, make_coordinator, mock_hass
    ):
        """When entities disappear, they are removed from tracking dicts."""
        coord = make_coordinator()

        # Simulate that these entities were previously tracked
        coord._last_known_levels = {
            "sensor.battery_1": 50.0,
            "sensor.battery_2": 30.0,
        }

        # Set up old discovered state (both entities)
        coord.discovered = {
            "sensor.battery_1": MagicMock(),
            "sensor.battery_2": MagicMock(),
        }

        # Mock discover to return only battery_1 (battery_2 has disappeared)
        remaining = MagicMock()
        remaining.entity_id = "sensor.battery_1"
        remaining.device_id = "dev_1"

        with (
            patch(
                "custom_components.juice_patrol.data.coordinator.async_discover_batteries",
                new_callable=AsyncMock,
                return_value=[remaining],
            ),
            patch(
                "custom_components.juice_patrol.data.coordinator.async_track_state_change_event",
                return_value=MagicMock(),
            ),
            patch(
                "custom_components.juice_patrol.data.coordinator.dr"
            ) as mock_dr,
        ):
            mock_dev_reg = MagicMock()
            mock_dev_reg.async_get_device.return_value = None
            mock_dr.async_get.return_value = mock_dev_reg

            coord.store.get_ignored_entities.return_value = set()
            coord.store.ensure_device = MagicMock()
            coord.store.get_device.return_value = None

            await coord._async_discover_and_subscribe()

        # battery_2 should be cleaned from tracking
        assert "sensor.battery_2" not in coord._last_known_levels

        # battery_1 should still be in last_known_levels
        assert "sensor.battery_1" in coord._last_known_levels


# ── async_shutdown ─────────────────────────────────────────────────────


class TestAsyncShutdown:
    """Test that async_shutdown properly cleans up all resources."""

    @pytest.mark.asyncio
    async def test_shutdown_calls_super(self, make_coordinator):
        coord = make_coordinator()

        from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

        with patch.object(
            DataUpdateCoordinator,
            "async_shutdown",
            new_callable=AsyncMock,
        ) as mock_super:
            await coord.async_shutdown()

        mock_super.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_shutdown_cancels_entity_listener(self, make_coordinator):
        coord = make_coordinator()
        mock_unsub = MagicMock()
        coord._unsub_entity_listener = mock_unsub

        from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

        with patch.object(
            DataUpdateCoordinator,
            "async_shutdown",
            new_callable=AsyncMock,
        ):
            await coord.async_shutdown()

        mock_unsub.assert_called_once()
        assert coord._unsub_entity_listener is None

    @pytest.mark.asyncio
    async def test_shutdown_cancels_debounce_task(self, make_coordinator):
        coord = make_coordinator()
        mock_task = MagicMock()
        mock_task.done.return_value = False
        coord._discovery_debounce_task = mock_task

        from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

        with patch.object(
            DataUpdateCoordinator,
            "async_shutdown",
            new_callable=AsyncMock,
        ):
            await coord.async_shutdown()

        mock_task.cancel.assert_called_once()
        assert coord._discovery_debounce_task is None


# ── Entity registry listener ──────────────────────────────────────────


class TestEntityRegistryListener:
    """Test that entity registry changes trigger re-discovery."""

    def test_create_event_schedules_rediscovery(self, make_coordinator):
        coord = make_coordinator()
        event = MagicMock()
        event.data = {"action": "create", "entity_id": "sensor.new_battery"}

        coord._handle_entity_registry_update(event)

        coord.hass.async_create_task.assert_called_once()

    def test_remove_event_ignored(self, make_coordinator):
        coord = make_coordinator()
        event = MagicMock()
        event.data = {"action": "remove", "entity_id": "sensor.old_battery"}

        coord._handle_entity_registry_update(event)

        coord.hass.async_create_task.assert_not_called()

    def test_rapid_events_cancel_previous_debounce(self, make_coordinator):
        coord = make_coordinator()

        event1 = MagicMock()
        event1.data = {"action": "create", "entity_id": "sensor.battery_1"}
        mock_task = MagicMock()
        mock_task.done.return_value = False
        coord.hass.async_create_task.side_effect = (
            lambda coro, *a, **kw: (coro.close(), mock_task)[-1]
        )

        coord._handle_entity_registry_update(event1)
        assert coord._discovery_debounce_task is mock_task

        event2 = MagicMock()
        event2.data = {"action": "create", "entity_id": "sensor.battery_2"}
        coord._handle_entity_registry_update(event2)

        mock_task.cancel.assert_called_once()


# ── Sibling battery_state tracking ───────────────────────────────────


def _make_state_change_event(entity_id, new_value, old_value=None):
    """Build a mock state-change Event."""
    event = MagicMock()
    event.data = {"entity_id": entity_id}

    new_state = MagicMock()
    new_state.state = new_value
    event.data["new_state"] = new_state

    if old_value is not None:
        old_state = MagicMock()
        old_state.state = old_value
        event.data["old_state"] = old_state
    else:
        event.data["old_state"] = None

    return event


class TestSiblingBatteryStateDiscovery:
    """Test that sibling battery_state entities are discovered and tracked."""

    @pytest.mark.asyncio
    async def test_sibling_discovered_and_tracked(self, make_coordinator, mock_hass):
        coord = make_coordinator()

        battery = MagicMock()
        battery.entity_id = "sensor.ipad_battery_level"
        battery.device_id = "dev_ipad"

        sibling_entry = MagicMock()
        sibling_entry.entity_id = "sensor.ipad_battery_state"

        # The sibling must have a state value that looks like a charging state
        # (coordinator now uses state-value detection, not entity_id substring)
        sibling_state = MagicMock()
        sibling_state.state = "Charging"
        mock_hass.states.get = lambda eid: (
            sibling_state if eid == "sensor.ipad_battery_state" else None
        )

        mock_ent_reg = MagicMock()

        def _entries_for_device(reg, device_id):
            if device_id == "dev_ipad":
                return [sibling_entry]
            return []

        with (
            patch(
                "custom_components.juice_patrol.data.coordinator.async_discover_batteries",
                new_callable=AsyncMock,
                return_value=[battery],
            ),
            patch(
                "custom_components.juice_patrol.data.coordinator.async_track_state_change_event",
                return_value=MagicMock(),
            ) as mock_track,
            patch(
                "custom_components.juice_patrol.data.coordinator.dr"
            ) as mock_dr,
            patch(
                "custom_components.juice_patrol.data.coordinator.er"
            ) as mock_er,
        ):
            mock_dev_reg = MagicMock()
            mock_dev_reg.async_get_device.return_value = None
            mock_dr.async_get.return_value = mock_dev_reg

            mock_er.async_get.return_value = mock_ent_reg
            mock_er.async_entries_for_device = _entries_for_device

            coord.store.get_ignored_entities.return_value = set()
            coord.store.ensure_device = MagicMock()
            coord.store.get_device.return_value = None

            await coord._async_discover_and_subscribe()

        assert coord._sibling_to_source == {
            "sensor.ipad_battery_state": "sensor.ipad_battery_level"
        }

        tracked_ids = mock_track.call_args[0][1]
        assert "sensor.ipad_battery_level" in tracked_ids
        assert "sensor.ipad_battery_state" in tracked_ids

    @pytest.mark.asyncio
    async def test_no_siblings_for_device_without_device_id(
        self, make_coordinator, mock_hass
    ):
        coord = make_coordinator()

        battery = MagicMock()
        battery.entity_id = "sensor.orphan_battery"
        battery.device_id = None

        with (
            patch(
                "custom_components.juice_patrol.data.coordinator.async_discover_batteries",
                new_callable=AsyncMock,
                return_value=[battery],
            ),
            patch(
                "custom_components.juice_patrol.data.coordinator.async_track_state_change_event",
                return_value=MagicMock(),
            ),
            patch(
                "custom_components.juice_patrol.data.coordinator.dr"
            ) as mock_dr,
            patch(
                "custom_components.juice_patrol.data.coordinator.er"
            ) as mock_er,
        ):
            mock_dev_reg = MagicMock()
            mock_dev_reg.async_get_device.return_value = None
            mock_dr.async_get.return_value = mock_dev_reg

            mock_er.async_get.return_value = MagicMock()
            mock_er.async_entries_for_device = MagicMock()

            coord.store.get_ignored_entities.return_value = set()
            coord.store.ensure_device = MagicMock()
            coord.store.get_device.return_value = None

            await coord._async_discover_and_subscribe()

        assert coord._sibling_to_source == {}
        mock_er.async_entries_for_device.assert_not_called()


class TestSiblingStateChange:
    """Test that sibling battery_state changes trigger source entity rebuilds."""

    def test_sibling_change_triggers_rebuild(self, make_coordinator):
        coord = make_coordinator()
        source_battery = MagicMock()
        coord.discovered = {"sensor.ipad_battery_level": source_battery}
        coord._sibling_to_source = {
            "sensor.ipad_battery_state": "sensor.ipad_battery_level"
        }

        event = _make_state_change_event(
            "sensor.ipad_battery_state",
            new_value="Charging",
            old_value="Not Charging",
        )

        coord._handle_state_change(event)

        coord.hass.async_create_task.assert_called_once()
        assert "sensor.ipad_battery_level" in coord._pending_rebuilds

    def test_sibling_unchanged_state_no_rebuild(self, make_coordinator):
        coord = make_coordinator()
        source_battery = MagicMock()
        coord.discovered = {"sensor.ipad_battery_level": source_battery}
        coord._sibling_to_source = {
            "sensor.ipad_battery_state": "sensor.ipad_battery_level"
        }

        event = _make_state_change_event(
            "sensor.ipad_battery_state",
            new_value="Charging",
            old_value="Charging",
        )

        coord._handle_state_change(event)

        coord.hass.async_create_task.assert_not_called()

    def test_sibling_change_debounces_rapid_updates(self, make_coordinator):
        coord = make_coordinator()
        source_battery = MagicMock()
        coord.discovered = {"sensor.ipad_battery_level": source_battery}
        coord._sibling_to_source = {
            "sensor.ipad_battery_state": "sensor.ipad_battery_level"
        }

        first_task = MagicMock()
        first_task.done.return_value = False
        coord.hass.async_create_task.side_effect = (
            lambda coro, *a, **kw: (coro.close(), first_task)[-1]
        )

        event1 = _make_state_change_event(
            "sensor.ipad_battery_state",
            new_value="Charging",
            old_value="Not Charging",
        )
        coord._handle_state_change(event1)
        assert coord._pending_rebuilds["sensor.ipad_battery_level"] is first_task

        second_task = MagicMock()
        second_task.done.return_value = False
        coord.hass.async_create_task.side_effect = (
            lambda coro, *a, **kw: (coro.close(), second_task)[-1]
        )

        event2 = _make_state_change_event(
            "sensor.ipad_battery_state",
            new_value="Not Charging",
            old_value="Charging",
        )
        coord._handle_state_change(event2)

        first_task.cancel.assert_called_once()
        assert coord._pending_rebuilds["sensor.ipad_battery_level"] is second_task

    def test_non_sibling_entity_unaffected(self, make_coordinator):
        coord = make_coordinator()
        battery = MagicMock()
        battery.source_type = MagicMock()
        coord.discovered = {"sensor.door_sensor_battery": battery}
        coord._sibling_to_source = {}
        coord.data = {}

        event = _make_state_change_event(
            "sensor.door_sensor_battery",
            new_value="85",
            old_value="86",
        )

        coord._handle_state_change(event)

        assert "sensor.door_sensor_battery" not in coord._pending_rebuilds

    def test_sibling_with_no_initial_old_state(self, make_coordinator):
        coord = make_coordinator()
        source_battery = MagicMock()
        coord.discovered = {"sensor.ipad_battery_level": source_battery}
        coord._sibling_to_source = {
            "sensor.ipad_battery_state": "sensor.ipad_battery_level"
        }

        event = _make_state_change_event(
            "sensor.ipad_battery_state",
            new_value="Charging",
            old_value=None,
        )

        coord._handle_state_change(event)

        coord.hass.async_create_task.assert_called_once()


class TestUpdateData:
    """Verify _async_update_data runs discovery and build."""

    @pytest.mark.asyncio
    async def test_update_data_calls_discover_and_build(self, make_coordinator):
        coord = make_coordinator()

        with (
            patch.object(
                coord, "_async_discover_and_subscribe", new_callable=AsyncMock
            ) as mock_discover,
            patch.object(
                coord, "_async_build_full_data", new_callable=AsyncMock,
                return_value={"sensor.battery_1": {"level": 50}},
            ) as mock_build,
        ):
            result = await coord._async_update_data()

        mock_discover.assert_awaited_once()
        mock_build.assert_awaited_once()
        assert "sensor.battery_1" in result
