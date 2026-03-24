"""Tests for Juice Patrol coordinator."""

import asyncio
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.juice_patrol.const import (
    CONF_LOW_THRESHOLD,
    CONF_PREDICTION_HORIZON,
    CONF_STALE_TIMEOUT,
    DEFAULT_LOW_THRESHOLD,
    DEFAULT_PREDICTION_HORIZON,
    DEFAULT_STALE_TIMEOUT,
)
from custom_components.juice_patrol.data.coordinator import (
    JuicePatrolCoordinator,
    _extract_current_segment,
)


# ── Helpers ──────────────────────────────────────────────────────────────


def _readings(levels: list[float], span_hours: float = 48.0) -> list[dict[str, float]]:
    """Build evenly-spaced readings from a list of levels."""
    t0 = time.time() - span_hours * 3600
    count = len(levels)
    interval = (span_hours * 3600) / max(count - 1, 1) if count > 1 else 0
    return [{"t": t0 + i * interval, "v": v} for i, v in enumerate(levels)]


# ── Pure function: _extract_current_segment ──────────────────────────────


class TestExtractCurrentSegment:
    """Tests for the module-level _extract_current_segment function."""

    def test_fewer_than_5_readings_unchanged(self):
        """With fewer than 5 readings, return input unchanged (even if there's a jump)."""
        readings = _readings([100, 50, 90, 80])
        result = _extract_current_segment(readings)
        assert result is readings

    def test_empty_list(self):
        """Empty list returns empty list unchanged."""
        result = _extract_current_segment([])
        assert result == []

    def test_no_charge_cycle_unchanged(self):
        """Monotonic drain with no upward jump returns all readings."""
        readings = _readings([100, 90, 80, 70, 60, 50])
        result = _extract_current_segment(readings)
        assert result is readings

    def test_single_charge_cycle(self):
        """100->20->100->80->60 should return from last peak (100) onward."""
        readings = _readings([100, 60, 20, 100, 80, 60])
        result = _extract_current_segment(readings)
        # The last jump >= 20 is at index 3 (20 -> 100 = +80)
        assert len(result) == 3
        assert result[0]["v"] == 100
        assert result[-1]["v"] == 60

    def test_multiple_charge_cycles(self):
        """With multiple charge cycles, only the last one is extracted."""
        # Cycle 1: 100->30->90, Cycle 2: 90->20->95->70->50
        readings = _readings([100, 50, 30, 90, 70, 20, 95, 70, 50])
        result = _extract_current_segment(readings)
        # Last jump >= 20 is at index 6 (20 -> 95 = +75)
        assert len(result) == 3
        assert result[0]["v"] == 95
        assert result[-1]["v"] == 50

    def test_small_jump_not_peak(self):
        """A 10% jump is below the 20% threshold and should not be treated as a charge event."""
        # 100, 70, 60, 70, 60, 50 — the 60->70 jump is only 10
        readings = _readings([100, 70, 60, 70, 60, 50])
        result = _extract_current_segment(readings)
        # No jump >= 20 so all readings returned
        assert result is readings

    def test_segment_too_short_returns_all(self):
        """If the segment after the last peak has fewer than 3 readings, return all."""
        # 100, 60, 30, 90, 80 — peak at index 3 (30->90 = +60), segment is [90, 80] = 2 readings
        readings = _readings([100, 60, 30, 90, 80])
        result = _extract_current_segment(readings)
        assert result is readings

    def test_large_jump_at_boundary_exactly_20(self):
        """A jump of exactly 20 should be recognized as a charge event."""
        # 80, 60, 50, 30, 50, 40, 30 — jump at index 4 (30->50 = +20, exactly threshold)
        readings = _readings([80, 60, 50, 30, 50, 40, 30])
        result = _extract_current_segment(readings)
        # Segment from index 4 onward: [50, 40, 30] = 3 readings
        assert len(result) == 3
        assert result[0]["v"] == 50
        assert result[-1]["v"] == 30

    def test_jump_of_19_not_detected(self):
        """A jump of 19 (just below 20) should NOT be treated as a charge event."""
        readings = _readings([80, 60, 50, 31, 50, 40, 30])
        result = _extract_current_segment(readings)
        # 31->50 = +19, not >= 20
        assert result is readings


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
        with (
            patch(
                "custom_components.juice_patrol.data.coordinator.JuicePatrolStore"
            ) as mock_store_cls,
            patch(
                "custom_components.juice_patrol.data.coordinator.BatteryTypeResolver"
            ) as mock_resolver_cls,
            patch(
                "custom_components.juice_patrol.data.coordinator.HistoryCache"
            ),
        ):
            mock_store = MagicMock()
            mock_store.mark_replaced = MagicMock(return_value=True)
            mock_store.get_device = MagicMock(return_value=None)
            mock_store.async_save = AsyncMock()
            mock_store_cls.return_value = mock_store

            mock_resolver = MagicMock()
            mock_resolver.resolve_uncached = MagicMock(
                return_value=("CR2032", "library")
            )
            mock_resolver_cls.return_value = mock_resolver

            coordinator = JuicePatrolCoordinator(mock_hass, entry)
        return coordinator

    return _make


# ── Properties ───────────────────────────────────────────────────────────


class TestProperties:
    """Test coordinator config-entry properties."""

    def test_low_threshold_from_options(self, make_coordinator):
        """low_threshold reads from config_entry.options."""
        coord = make_coordinator({CONF_LOW_THRESHOLD: 25})
        assert coord.low_threshold == 25

    def test_stale_timeout_default(self, make_coordinator):
        """stale_timeout_hours returns default when not in options."""
        coord = make_coordinator({})
        assert coord.stale_timeout_hours == DEFAULT_STALE_TIMEOUT

    def test_prediction_horizon_from_options(self, make_coordinator):
        """prediction_horizon_days reads from config_entry.options."""
        coord = make_coordinator({CONF_PREDICTION_HORIZON: 14})
        assert coord.prediction_horizon_days == 14

    def test_low_threshold_default(self, make_coordinator):
        """low_threshold returns default when not in options."""
        coord = make_coordinator({})
        assert coord.low_threshold == DEFAULT_LOW_THRESHOLD

    def test_prediction_horizon_default(self, make_coordinator):
        """prediction_horizon_days returns default when not set."""
        coord = make_coordinator({})
        assert coord.prediction_horizon_days == DEFAULT_PREDICTION_HORIZON


# ── async_mark_replaced ──────────────────────────────────────────────────


class TestAsyncMarkReplaced:
    """Test the async_mark_replaced method."""

    @pytest.mark.asyncio
    async def test_mark_replaced_success(self, make_coordinator):
        """Successful mark_replaced: store returns True, refresh scheduled."""
        coord = make_coordinator()
        coord.store.mark_replaced.return_value = True
        coord.async_request_refresh = AsyncMock()

        result = await coord.async_mark_replaced("sensor.battery_1")
        assert result is True
        coord.store.mark_replaced.assert_called_once_with("sensor.battery_1")
        # Refresh is fire-and-forget via async_create_task
        coord.hass.async_create_task.assert_called_once()

    @pytest.mark.asyncio
    async def test_mark_replaced_not_in_store(self, make_coordinator):
        """When store returns False, method returns False and does not refresh."""
        coord = make_coordinator()
        coord.store.mark_replaced.return_value = False
        coord.async_request_refresh = AsyncMock()

        result = await coord.async_mark_replaced("sensor.unknown")
        assert result is False
        coord.async_request_refresh.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_mark_replaced_invalidates_cache(self, make_coordinator):
        """Mark replaced should invalidate the history cache for that entity."""
        coord = make_coordinator()
        coord.store.mark_replaced.return_value = True
        coord.async_request_refresh = AsyncMock()

        await coord.async_mark_replaced("sensor.battery_1")
        coord._history_cache.invalidate.assert_called_once_with("sensor.battery_1")


# ── async_recalculate_entity ─────────────────────────────────────────────


class TestAsyncRecalculateEntity:
    """Test the async_recalculate_entity method."""

    @pytest.mark.asyncio
    async def test_recalculate_not_discovered(self, make_coordinator):
        """Returns False when entity is not in discovered dict."""
        coord = make_coordinator()
        coord.discovered = {}

        result = await coord.async_recalculate_entity("sensor.unknown")
        assert result is False

    @pytest.mark.asyncio
    async def test_recalculate_success(self, make_coordinator):
        """When entity is discovered, invalidates cache and rebuilds."""
        coord = make_coordinator()
        battery = MagicMock()
        battery.entity_id = "sensor.battery_1"
        coord.discovered = {"sensor.battery_1": battery}

        # Mock the internal rebuild to avoid running the full pipeline
        coord._async_rebuild_entity = AsyncMock()

        result = await coord.async_recalculate_entity("sensor.battery_1")
        assert result is True
        coord._history_cache.invalidate.assert_called_once_with("sensor.battery_1")
        coord._async_rebuild_entity.assert_awaited_once_with(
            "sensor.battery_1", battery
        )


# ── detect_battery_type ──────────────────────────────────────────────────


class TestDetectBatteryType:
    """Test the detect_battery_type method."""

    def test_detect_delegates_to_resolver(self, make_coordinator):
        """detect_battery_type calls type_resolver.resolve_uncached."""
        coord = make_coordinator()
        battery = MagicMock()
        battery.device_id = "device_abc"
        coord.discovered = {"sensor.battery_1": battery}
        coord.type_resolver.resolve_uncached.return_value = ("CR2032", "library")

        result = coord.detect_battery_type("sensor.battery_1")
        assert result == ("CR2032", "library")
        coord.type_resolver.resolve_uncached.assert_called_once_with(
            "sensor.battery_1", "device_abc"
        )

    def test_detect_raises_for_unknown_entity(self, make_coordinator):
        """detect_battery_type raises KeyError for non-discovered entities."""
        coord = make_coordinator()
        coord.discovered = {}

        with pytest.raises(KeyError):
            coord.detect_battery_type("sensor.nonexistent")


# ── Dedup cleanup on disappeared entities ────────────────────────────────


class TestDedupCleanup:
    """Test that disappeared entities are cleaned from tracking sets."""

    @pytest.mark.asyncio
    async def test_disappeared_entities_cleaned_from_tracking_sets(
        self, make_coordinator, mock_hass
    ):
        """When entities disappear, they are removed from all tracking dicts/sets."""
        coord = make_coordinator()

        # Simulate that these entities were previously tracked
        coord._last_known_levels = {
            "sensor.battery_1": 50.0,
            "sensor.battery_2": 30.0,
        }
        coord._fired_low = {"sensor.battery_1", "sensor.battery_2"}
        coord._fired_stale = {"sensor.battery_1"}
        coord._fired_predicted_low = {"sensor.battery_2"}

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

        # battery_2 should be cleaned from all tracking structures
        assert "sensor.battery_2" not in coord._last_known_levels
        assert "sensor.battery_2" not in coord._fired_low
        assert "sensor.battery_2" not in coord._fired_stale
        assert "sensor.battery_2" not in coord._fired_predicted_low

        # battery_1 should still be in last_known_levels
        assert "sensor.battery_1" in coord._last_known_levels
        # battery_1 stays in fired_low (still discovered, cleanup only removes disappeared)
        assert "sensor.battery_1" in coord._fired_low


# ── async_get_entity_chart_data ────────────────────────────────────────


class TestAsyncGetEntityChartData:
    """Test the async_get_entity_chart_data method."""

    @pytest.mark.asyncio
    async def test_returns_none_for_unknown_entity(self, make_coordinator):
        """Returns None when entity is not discovered."""
        coord = make_coordinator()
        coord.discovered = {}
        result = await coord.async_get_entity_chart_data("sensor.unknown")
        assert result is None

    @pytest.mark.asyncio
    async def test_returns_chart_data(self, make_coordinator, mock_hass):
        """Returns chart data dict with readings, prediction, and metadata."""
        coord = make_coordinator()
        battery = MagicMock()
        battery.device_name = "Test Device"
        battery.current_level = 75.0
        battery.device_id = "dev_123"
        coord.discovered = {"sensor.battery_1": battery}

        # Mock store device
        dev_data = MagicMock()
        dev_data.last_replaced = None
        dev_data.custom_threshold = None
        coord.store.get_device.return_value = dev_data

        # Mock readings
        readings = _readings([100, 90, 80, 70, 60], span_hours=48.0)

        # Mock prediction in coordinator data
        mock_prediction = MagicMock()
        mock_prediction.slope_per_day = -2.5
        mock_prediction.intercept = 100.0
        mock_prediction.r_squared = 0.95
        mock_prediction.confidence = "high"
        mock_prediction.estimated_empty_timestamp = time.time() + 86400 * 20
        mock_prediction.estimated_days_remaining = 20.0
        mock_prediction.status = "normal"
        mock_prediction.reliability = 85
        mock_prediction.data_points_used = 5

        coord.data = {
            "sensor.battery_1": {
                "prediction": mock_prediction,
                "is_rechargeable": False,
                "battery_type": "CR2032",
                "charging_state": None,
            }
        }

        with patch(
            "custom_components.juice_patrol.data.coordinator.async_get_readings",
            new_callable=AsyncMock,
            return_value=readings,
        ):
            result = await coord.async_get_entity_chart_data("sensor.battery_1")

        assert result is not None
        assert result["device_name"] == "Test Device"
        assert result["level"] == 75.0
        assert len(result["readings"]) == 5
        assert len(result["all_readings"]) == 5
        assert result["prediction"]["slope_per_day"] == -2.5
        assert result["prediction"]["confidence"] == "high"
        assert result["prediction"]["r_squared"] == 0.95
        assert result["prediction"]["reliability"] == 85
        assert result["is_rechargeable"] is False
        assert result["battery_type"] == "CR2032"
        assert result["first_reading_timestamp"] == readings[0]["t"]

    @pytest.mark.asyncio
    async def test_returns_empty_prediction_when_no_data(
        self, make_coordinator, mock_hass
    ):
        """When coordinator has no data for entity, prediction dict is empty."""
        coord = make_coordinator()
        battery = MagicMock()
        battery.device_name = "Empty Device"
        battery.current_level = None
        battery.device_id = None
        coord.discovered = {"sensor.battery_1": battery}
        coord.store.get_device.return_value = None
        coord.data = {}

        with patch(
            "custom_components.juice_patrol.data.coordinator.async_get_readings",
            new_callable=AsyncMock,
            return_value=[],
        ):
            result = await coord.async_get_entity_chart_data("sensor.battery_1")

        assert result is not None
        assert result["readings"] == []
        assert result["prediction"] == {}
        assert result["first_reading_timestamp"] is None


# ── async_shutdown ─────────────────────────────────────────────────────


class TestAsyncShutdown:
    """Test that async_shutdown properly cleans up all resources."""

    @pytest.mark.asyncio
    async def test_shutdown_calls_super(self, make_coordinator):
        """async_shutdown must call super().async_shutdown() to cancel periodic timer."""
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
        """async_shutdown removes the entity registry listener."""
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
        """async_shutdown cancels any pending debounced rediscovery."""
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
        """A 'create' entity registry event schedules debounced rediscovery."""
        coord = make_coordinator()
        event = MagicMock()
        event.data = {"action": "create", "entity_id": "sensor.new_battery"}

        coord._handle_entity_registry_update(event)

        coord.hass.async_create_task.assert_called_once()

    def test_remove_event_ignored(self, make_coordinator):
        """A 'remove' entity registry event does not schedule rediscovery."""
        coord = make_coordinator()
        event = MagicMock()
        event.data = {"action": "remove", "entity_id": "sensor.old_battery"}

        coord._handle_entity_registry_update(event)

        coord.hass.async_create_task.assert_not_called()

    def test_rapid_events_cancel_previous_debounce(self, make_coordinator):
        """Rapid create events cancel the previous debounce task."""
        coord = make_coordinator()

        # First event — return a controllable mock task
        event1 = MagicMock()
        event1.data = {"action": "create", "entity_id": "sensor.battery_1"}
        mock_task = MagicMock()
        mock_task.done.return_value = False
        coord.hass.async_create_task.side_effect = (
            lambda coro, *a, **kw: (coro.close(), mock_task)[-1]
        )

        coord._handle_entity_registry_update(event1)
        assert coord._discovery_debounce_task is mock_task

        # Second event — should cancel the first
        event2 = MagicMock()
        event2.data = {"action": "create", "entity_id": "sensor.battery_2"}
        coord._handle_entity_registry_update(event2)

        mock_task.cancel.assert_called_once()
