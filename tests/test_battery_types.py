"""Tests for Juice Patrol battery type resolver."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.juice_patrol.data.battery_types import BatteryTypeResolver


@pytest.fixture
def mock_hass():
    """Create a minimal mock HomeAssistant instance."""
    hass = MagicMock()
    hass.states.get.return_value = None
    return hass


@pytest.fixture
def resolver(mock_hass):
    """Create a BatteryTypeResolver with mocked HA."""
    return BatteryTypeResolver(mock_hass)


def _make_library_response(devices):
    """Build a mock aiohttp response for the Battery Notes library."""
    resp = MagicMock()
    resp.status = 200
    resp.json = AsyncMock(return_value={"devices": devices})
    session = MagicMock()
    session.get = AsyncMock(return_value=resp)
    return session


class TestAsyncLoadLibrary:
    """Test library fetching and indexing."""

    @pytest.mark.asyncio
    async def test_loads_and_indexes_by_manufacturer(self, resolver):
        """Verify library is indexed by lowercase manufacturer."""
        devices = [
            {"manufacturer": "Aqara", "model": "MCCGQ11LM", "battery_type": "CR2032"},
            {"manufacturer": "Aqara", "model": "WSDCGQ11LM", "battery_type": "CR2032"},
            {"manufacturer": "IKEA", "model": "TRADFRI remote", "battery_type": "CR2032"},
        ]
        session = _make_library_response(devices)

        with patch(
            "custom_components.juice_patrol.data.battery_types.async_get_clientsession",
            return_value=session,
        ):
            await resolver.async_load_library()

        assert "aqara" in resolver._library_by_mfr
        assert len(resolver._library_by_mfr["aqara"]) == 2
        assert "ikea" in resolver._library_by_mfr
        assert len(resolver._library_by_mfr["ikea"]) == 1

    @pytest.mark.asyncio
    async def test_only_loads_once(self, resolver):
        """Second call should be a no-op."""
        session = _make_library_response([
            {"manufacturer": "Aqara", "model": "X", "battery_type": "CR2032"},
        ])

        with patch(
            "custom_components.juice_patrol.data.battery_types.async_get_clientsession",
            return_value=session,
        ):
            await resolver.async_load_library()
            await resolver.async_load_library()

        # get() should only have been called once
        session.get.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_handles_http_error(self, resolver):
        """Non-200 status logs warning, library stays empty."""
        resp = MagicMock()
        resp.status = 503
        session = MagicMock()
        session.get = AsyncMock(return_value=resp)

        with patch(
            "custom_components.juice_patrol.data.battery_types.async_get_clientsession",
            return_value=session,
        ):
            await resolver.async_load_library()

        assert resolver._library_by_mfr == {}
        # Flag is still set so it won't retry
        assert resolver._library_loaded is True

    @pytest.mark.asyncio
    async def test_handles_network_failure(self, resolver):
        """Exception during fetch should not crash."""
        session = MagicMock()
        session.get = AsyncMock(side_effect=Exception("Connection refused"))

        with patch(
            "custom_components.juice_patrol.data.battery_types.async_get_clientsession",
            return_value=session,
        ):
            await resolver.async_load_library()

        assert resolver._library_by_mfr == {}
        assert resolver._library_loaded is True


class TestResolveType:
    """Test cached resolution logic."""

    def test_returns_cached_result(self, resolver, mock_hass):
        """Second call returns cached result without re-resolving."""
        state = MagicMock()
        state.attributes = {"battery_type": "CR2032"}
        mock_hass.states.get.return_value = state

        result1 = resolver.resolve_type("sensor.door_battery", "device_1")
        assert result1 == ("CR2032", "attribute: battery_type")

        # Clear the state so resolution would return nothing if called again
        mock_hass.states.get.return_value = None

        result2 = resolver.resolve_type("sensor.door_battery", "device_1")
        assert result2 == ("CR2032", "attribute: battery_type")

    def test_invalidate_cache_single(self, resolver, mock_hass):
        """Invalidating one entity forces re-resolution for that entity only."""
        state = MagicMock()
        state.attributes = {"battery_type": "CR2032"}
        mock_hass.states.get.return_value = state

        resolver.resolve_type("sensor.door_battery", "device_1")
        resolver.resolve_type("sensor.motion_battery", "device_2")

        # Invalidate only one
        resolver.invalidate_cache("sensor.door_battery")

        # door_battery is evicted, motion_battery is still cached
        assert "sensor.door_battery" not in resolver._cache
        assert "sensor.motion_battery" in resolver._cache

    def test_invalidate_cache_all(self, resolver, mock_hass):
        """Clearing all cache forces re-resolution for everything."""
        state = MagicMock()
        state.attributes = {"battery_type": "AAA"}
        mock_hass.states.get.return_value = state

        resolver.resolve_type("sensor.door_battery", "device_1")
        resolver.resolve_type("sensor.motion_battery", "device_2")

        resolver.invalidate_cache()

        assert resolver._cache == {}


class TestFromAttributes:
    """Test attribute-based battery type detection."""

    def test_finds_battery_type_attribute(self, resolver, mock_hass):
        """Direct entity attribute battery_type is found."""
        state = MagicMock()
        state.attributes = {"battery_type": "CR2032"}
        mock_hass.states.get.return_value = state

        result = resolver.resolve_type("sensor.door_battery", None)
        assert result == ("CR2032", "attribute: battery_type")

    def test_finds_sibling_attribute(self, resolver, mock_hass):
        """Sibling entity has battery_type attribute."""
        # Source entity has no battery_type
        source_state = MagicMock()
        source_state.attributes = {}

        # Sibling entity has battery_type
        sibling_state = MagicMock()
        sibling_state.attributes = {"battery_type": "AAA"}

        def get_state(entity_id):
            if entity_id == "sensor.door_battery":
                return source_state
            if entity_id == "sensor.door_other":
                return sibling_state
            return None

        mock_hass.states.get.side_effect = get_state

        mock_ent_reg = MagicMock()
        sibling_entry = MagicMock(entity_id="sensor.door_other")
        source_entry = MagicMock(entity_id="sensor.door_battery")

        with (
            patch(
                "custom_components.juice_patrol.data.battery_types.er.async_get",
                return_value=mock_ent_reg,
            ),
            patch(
                "custom_components.juice_patrol.data.battery_types.er.async_entries_for_device",
                return_value=[source_entry, sibling_entry],
            ),
        ):
            result = resolver.resolve_type("sensor.door_battery", "device_1")

        assert result == ("AAA", "sibling attribute: battery_type")

    def test_finds_battery_notes_entity(self, resolver, mock_hass):
        """Sibling *_battery_type entity state is used."""
        # Source entity has no battery_type
        source_state = MagicMock()
        source_state.attributes = {}

        # Battery Notes entity has a state value
        bn_state = MagicMock()
        bn_state.attributes = {}
        bn_state.state = "CR2450"

        def get_state(entity_id):
            if entity_id == "sensor.door_battery":
                return source_state
            if entity_id == "sensor.door_battery_type":
                return bn_state
            return None

        mock_hass.states.get.side_effect = get_state

        mock_ent_reg = MagicMock()
        source_entry = MagicMock(entity_id="sensor.door_battery")
        bn_entry = MagicMock(entity_id="sensor.door_battery_type")

        with (
            patch(
                "custom_components.juice_patrol.data.battery_types.er.async_get",
                return_value=mock_ent_reg,
            ),
            patch(
                "custom_components.juice_patrol.data.battery_types.er.async_entries_for_device",
                return_value=[source_entry, bn_entry],
            ),
        ):
            result = resolver.resolve_type("sensor.door_battery", "device_1")

        assert result == ("CR2450", "battery_notes entity")

    def test_returns_none_when_no_attributes(self, resolver, mock_hass):
        """No type info available returns (None, None)."""
        # Source entity exists but has no relevant attributes
        state = MagicMock()
        state.attributes = {"friendly_name": "Door Battery"}
        mock_hass.states.get.return_value = state

        mock_ent_reg = MagicMock()

        with (
            patch(
                "custom_components.juice_patrol.data.battery_types.er.async_get",
                return_value=mock_ent_reg,
            ),
            patch(
                "custom_components.juice_patrol.data.battery_types.er.async_entries_for_device",
                return_value=[],
            ),
        ):
            result = resolver.resolve_type("sensor.door_battery", "device_1")

        assert result == (None, None)


class TestFromLibrary:
    """Test Battery Notes library lookup."""

    @pytest.fixture
    def resolver_with_library(self, resolver):
        """Pre-populate the library with test entries."""
        resolver._library_by_mfr = {
            "aqara": [
                {
                    "manufacturer": "Aqara",
                    "model": "MCCGQ11LM",
                    "battery_type": "CR2032",
                },
            ],
            "ikea": [
                {
                    "manufacturer": "IKEA",
                    "model": "TRADFRI",
                    "model_match_method": "startswith",
                    "battery_type": "CR2032",
                    "battery_quantity": 2,
                },
            ],
            "philips": [
                {
                    "manufacturer": "Philips",
                    "model": "RWL02",
                    "model_match_method": "contains",
                    "battery_type": "CR2450",
                },
            ],
            "sonoff": [
                {
                    "manufacturer": "Sonoff",
                    "model": "SNZB-02D",
                    "battery_type": "CR2032",
                    "hw_version": "2.0",
                },
            ],
        }
        resolver._library_loaded = True
        return resolver

    def _mock_device(self, manufacturer, model, hw_version=None):
        """Create a mock device registry entry."""
        device = MagicMock()
        device.manufacturer = manufacturer
        device.model = model
        device.hw_version = hw_version
        return device

    def test_exact_match(self, resolver_with_library, mock_hass):
        """Manufacturer + model exact match."""
        mock_hass.states.get.return_value = None

        mock_dev_reg = MagicMock()
        mock_dev_reg.async_get.return_value = self._mock_device("Aqara", "MCCGQ11LM")

        with patch(
            "custom_components.juice_patrol.data.battery_types.dr.async_get",
            return_value=mock_dev_reg,
        ):
            result = resolver_with_library.resolve_type("sensor.door_battery", "device_1")

        assert result == ("CR2032", "battery_notes library")

    def test_startswith_match(self, resolver_with_library, mock_hass):
        """Model match method: startswith."""
        mock_hass.states.get.return_value = None

        mock_dev_reg = MagicMock()
        mock_dev_reg.async_get.return_value = self._mock_device(
            "IKEA", "TRADFRI remote control"
        )

        with patch(
            "custom_components.juice_patrol.data.battery_types.dr.async_get",
            return_value=mock_dev_reg,
        ):
            result = resolver_with_library.resolve_type("sensor.remote_battery", "device_2")

        assert result == ("2\u00d7 CR2032", "battery_notes library")

    def test_contains_match(self, resolver_with_library, mock_hass):
        """Model match method: contains."""
        mock_hass.states.get.return_value = None

        mock_dev_reg = MagicMock()
        mock_dev_reg.async_get.return_value = self._mock_device(
            "Philips", "Hue RWL021 US"
        )

        with patch(
            "custom_components.juice_patrol.data.battery_types.dr.async_get",
            return_value=mock_dev_reg,
        ):
            result = resolver_with_library.resolve_type("sensor.hue_battery", "device_3")

        assert result == ("CR2450", "battery_notes library")

    def test_quantity_multiplier(self, resolver_with_library, mock_hass):
        """battery_quantity > 1 produces 'N x TYPE' format."""
        mock_hass.states.get.return_value = None

        mock_dev_reg = MagicMock()
        mock_dev_reg.async_get.return_value = self._mock_device(
            "IKEA", "TRADFRI motion sensor"
        )

        with patch(
            "custom_components.juice_patrol.data.battery_types.dr.async_get",
            return_value=mock_dev_reg,
        ):
            result = resolver_with_library.resolve_type("sensor.motion_battery", "device_4")

        battery_type, source = result
        assert battery_type == "2\u00d7 CR2032"
        assert source == "battery_notes library"

    def test_no_match_returns_none(self, resolver_with_library, mock_hass):
        """Unknown device returns (None, None)."""
        mock_hass.states.get.return_value = None

        mock_dev_reg = MagicMock()
        mock_dev_reg.async_get.return_value = self._mock_device(
            "UnknownBrand", "XYZ-999"
        )

        with patch(
            "custom_components.juice_patrol.data.battery_types.dr.async_get",
            return_value=mock_dev_reg,
        ):
            result = resolver_with_library.resolve_type("sensor.unknown_battery", "device_5")

        assert result == (None, None)

    def test_hw_version_mismatch_skipped(self, resolver_with_library, mock_hass):
        """Library entry with hw_version that doesn't match is skipped."""
        mock_hass.states.get.return_value = None

        mock_dev_reg = MagicMock()
        # Device has hw_version 1.0, library entry requires 2.0
        mock_dev_reg.async_get.return_value = self._mock_device(
            "Sonoff", "SNZB-02D", hw_version="1.0"
        )

        with patch(
            "custom_components.juice_patrol.data.battery_types.dr.async_get",
            return_value=mock_dev_reg,
        ):
            result = resolver_with_library.resolve_type("sensor.sonoff_battery", "device_6")

        assert result == (None, None)
