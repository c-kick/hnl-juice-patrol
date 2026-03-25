"""Tests for Juice Patrol persistent store."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.juice_patrol.data.store import DeviceData, JuicePatrolStore, StoreData


@pytest.fixture
def mock_hass():
    """Create a minimal mock HomeAssistant instance."""
    hass = MagicMock()
    hass.config.path = MagicMock(return_value="/config")
    return hass


@pytest.fixture
def store(mock_hass):
    """Create a JuicePatrolStore with mocked HA."""
    with patch("custom_components.juice_patrol.data.store.Store") as mock_store_cls:
        mock_store_instance = AsyncMock()
        mock_store_instance.async_load = AsyncMock(return_value=None)
        mock_store_instance.async_save = AsyncMock()
        mock_store_instance.async_remove = AsyncMock()
        mock_store_cls.return_value = mock_store_instance
        s = JuicePatrolStore(mock_hass)
        s._store = mock_store_instance
        return s


class TestDeviceData:
    """Test DeviceData dataclass."""

    def test_defaults(self):
        d = DeviceData()
        assert d.last_replaced is None
        assert d.ignored is False
        assert d.custom_threshold is None
        assert d.battery_type is None
        assert d.is_rechargeable is None
        assert d.replacement_confirmed is True

    def test_from_dict(self):
        raw = {
            "last_replaced": 1234567890.0,
            "ignored": True,
            "custom_threshold": 30,
            "battery_type": "CR2032",
            "is_rechargeable": False,
            "replacement_confirmed": False,
            "source_entity": "sensor.test",
            "device_id": "abc123",
        }
        d = DeviceData.from_dict(raw, "sensor.test")
        assert d.last_replaced == 1234567890.0
        assert d.ignored is True
        assert d.custom_threshold == 30
        assert d.battery_type == "CR2032"
        assert d.is_rechargeable is False
        assert d.replacement_confirmed is False
        assert d.device_id == "abc123"

    def test_from_dict_defaults(self):
        d = DeviceData.from_dict({}, "sensor.test")
        assert d.last_replaced is None
        assert d.ignored is False
        assert d.source_entity == "sensor.test"

    def test_to_dict(self):
        d = DeviceData(
            replacement_history=[100.0],
            ignored=False,
            custom_threshold=25,
            battery_type="AA",
            replacement_confirmed=True,
            source_entity="sensor.test",
            device_id="dev1",
        )
        result = d.to_dict()
        assert result["replacement_history"] == [100.0]
        assert result["custom_threshold"] == 25
        assert result["battery_type"] == "AA"
        assert result["device_id"] == "dev1"
        # last_replaced property still works
        assert d.last_replaced == 100.0

    def test_to_dict_omits_none_optionals(self):
        d = DeviceData(source_entity="sensor.test")
        result = d.to_dict()
        assert "custom_threshold" not in result
        assert "battery_type" not in result
        assert "is_rechargeable" not in result

    def test_roundtrip(self):
        """from_dict(to_dict(x)) should preserve data."""
        original = DeviceData(
            replacement_history=[500.0],
            ignored=True,
            custom_threshold=15,
            battery_type="AAA",
            is_rechargeable=True,
            replacement_confirmed=False,
            source_entity="sensor.foo",
            device_id="dev42",
        )
        restored = DeviceData.from_dict(original.to_dict(), "sensor.foo")
        assert restored.last_replaced == original.last_replaced
        assert restored.ignored == original.ignored
        assert restored.custom_threshold == original.custom_threshold
        assert restored.battery_type == original.battery_type
        assert restored.is_rechargeable == original.is_rechargeable


class TestJuicePatrolStore:
    """Test JuicePatrolStore operations."""

    @pytest.mark.asyncio
    async def test_load_fresh(self, store):
        """Fresh load (no existing store) creates empty data."""
        await store.async_load()
        assert len(store.devices) == 0

    @pytest.mark.asyncio
    async def test_load_existing(self, store):
        """Load existing store data."""
        store._store.async_load = AsyncMock(return_value={
            "version": 2,
            "devices": {
                "sensor.test": {
                    "last_replaced": None,
                    "ignored": False,
                    "replacement_confirmed": True,
                    "source_entity": "sensor.test",
                    "device_id": "dev1",
                }
            },
        })
        await store.async_load()
        assert "sensor.test" in store.devices
        assert store.devices["sensor.test"].device_id == "dev1"

    @pytest.mark.asyncio
    async def test_load_v1_migration(self, store):
        """Migrate from v1 store (strip readings)."""
        store._store.async_load = AsyncMock(return_value={
            "version": 1,
            "devices": {
                "sensor.test": {
                    "readings": [{"t": 1, "v": 90}],
                    "last_replaced": None,
                    "ignored": False,
                    "replacement_confirmed": True,
                    "source_entity": "sensor.test",
                    "device_id": None,
                }
            },
        })
        await store.async_load()
        assert "sensor.test" in store.devices
        # Readings should be stripped during migration
        assert not hasattr(store.devices["sensor.test"], "readings")

    @pytest.mark.asyncio
    async def test_load_corrupt_data(self, store):
        """Corrupt data starts fresh."""
        store._store.async_load = AsyncMock(return_value="not a dict")
        await store.async_load()
        assert len(store.devices) == 0

    @pytest.mark.asyncio
    async def test_save_not_dirty(self, store):
        """Save does nothing when not dirty."""
        await store.async_load()
        await store.async_save()
        store._store.async_save.assert_not_called()

    @pytest.mark.asyncio
    async def test_save_dirty(self, store):
        """Save writes when dirty."""
        await store.async_load()
        store.ensure_device("sensor.test")
        await store.async_save()
        store._store.async_save.assert_called_once()

    def test_ensure_device_creates(self, store):
        """ensure_device creates new entry if missing."""
        dev = store.ensure_device("sensor.new", device_id="dev1")
        assert dev.source_entity == "sensor.new"
        assert dev.device_id == "dev1"
        assert "sensor.new" in store.devices

    def test_ensure_device_updates_device_id(self, store):
        """ensure_device updates device_id if changed."""
        store.ensure_device("sensor.test", device_id="old")
        store.ensure_device("sensor.test", device_id="new")
        assert store.devices["sensor.test"].device_id == "new"

    def test_ensure_device_idempotent(self, store):
        """ensure_device doesn't overwrite existing data."""
        store.ensure_device("sensor.test", device_id="dev1")
        store.devices["sensor.test"].battery_type = "CR2032"
        store.ensure_device("sensor.test", device_id="dev1")
        assert store.devices["sensor.test"].battery_type == "CR2032"

    def test_get_device(self, store):
        store.ensure_device("sensor.test")
        assert store.get_device("sensor.test") is not None
        assert store.get_device("sensor.missing") is None

    def test_mark_replaced(self, store):
        store.ensure_device("sensor.test")
        assert store.mark_replaced("sensor.test") is True
        dev = store.get_device("sensor.test")
        assert dev.last_replaced is not None
        assert dev.replacement_confirmed is True

    def test_mark_replaced_missing(self, store):
        assert store.mark_replaced("sensor.missing") is False

    def test_undo_replacement(self, store):
        store.ensure_device("sensor.test")
        store.mark_replaced("sensor.test")
        assert store.get_device("sensor.test").last_replaced is not None
        assert store.undo_replacement("sensor.test") is True
        dev = store.get_device("sensor.test")
        assert dev.last_replaced is None
        assert dev.replacement_confirmed is True

    def test_undo_replacement_missing(self, store):
        assert store.undo_replacement("sensor.missing") is False

    def test_set_ignored(self, store):
        store.set_ignored("sensor.test", True)
        assert store.devices["sensor.test"].ignored is True
        store.set_ignored("sensor.test", False)
        assert store.devices["sensor.test"].ignored is False

    def test_set_device_threshold(self, store):
        store.ensure_device("sensor.test")
        assert store.set_device_threshold("sensor.test", 30) is True
        assert store.devices["sensor.test"].custom_threshold == 30

    def test_set_device_threshold_missing(self, store):
        assert store.set_device_threshold("sensor.missing", 30) is False

    def test_set_battery_type(self, store):
        store.ensure_device("sensor.test")
        assert store.set_battery_type("sensor.test", "CR2032") is True
        assert store.devices["sensor.test"].battery_type == "CR2032"

    def test_set_battery_type_clear(self, store):
        store.ensure_device("sensor.test")
        store.set_battery_type("sensor.test", "CR2032")
        store.set_battery_type("sensor.test", None)
        assert store.devices["sensor.test"].battery_type is None

    def test_set_battery_type_missing(self, store):
        assert store.set_battery_type("sensor.missing", "AA") is False

    def test_set_rechargeable(self, store):
        store.ensure_device("sensor.test")
        assert store.set_rechargeable("sensor.test", True) is True
        assert store.devices["sensor.test"].is_rechargeable is True
        store.set_rechargeable("sensor.test", None)
        assert store.devices["sensor.test"].is_rechargeable is None

    def test_set_rechargeable_missing(self, store):
        assert store.set_rechargeable("sensor.missing", True) is False

    def test_set_replacement_confirmed(self, store):
        store.ensure_device("sensor.test")
        store.mark_replaced("sensor.test")
        assert store.set_replacement_confirmed("sensor.test", True) is True
        assert store.devices["sensor.test"].replacement_confirmed is True

    def test_set_replacement_confirmed_missing(self, store):
        assert store.set_replacement_confirmed("sensor.missing", True) is False

    def test_mark_dirty(self, store):
        store.mark_dirty()
        assert store._dirty is True

    def test_get_ignored_entities(self, store):
        store.set_ignored("sensor.a", True)
        store.set_ignored("sensor.b", False)
        store.set_ignored("sensor.c", True)
        ignored = store.get_ignored_entities()
        assert ignored == {"sensor.a", "sensor.c"}

    def test_remove_device(self, store):
        store.ensure_device("sensor.test")
        assert store.remove_device("sensor.test") is True
        assert "sensor.test" not in store.devices

    def test_remove_device_missing(self, store):
        assert store.remove_device("sensor.missing") is False


class TestPrimaryCacheFields:
    """Test primary prediction cache fields on DeviceData."""

    def test_defaults(self):
        d = DeviceData()
        assert d.primary_cache_version == 0
        assert d.completed_cycle_curves == []
        assert d.shape_prior is None
        assert d.current_cycle_smoothed == []
        assert d.current_cycle_raw_tail == []
        assert d.current_cycle_last_raw_t is None
        assert d.cache_chemistry is None
        assert d.cache_window_frac == 0.05

    def test_from_dict_with_cache(self):
        raw = {
            "source_entity": "sensor.test",
            "primary_cache_version": 1,
            "completed_cycle_curves": [
                {"smoothed": [{"t": 1.0, "v": 100.0}], "fit_model": "exponential",
                 "fit_params": {"a": 1.0}, "duration_days": 300.0,
                 "start_t": 0.0, "end_t": 300.0}
            ],
            "shape_prior": {"median_params": {"a": 1.0}, "param_spread": {"a": 0.1}, "n_cycles": 1},
            "current_cycle_smoothed": [{"t": 500.0, "v": 95.0}],
            "current_cycle_raw_tail": [{"t": 499.0, "v": 96.0}],
            "current_cycle_last_raw_t": 500.0,
            "cache_chemistry": "alkaline",
            "cache_window_frac": 0.03,
        }
        d = DeviceData.from_dict(raw, "sensor.test")
        assert d.primary_cache_version == 1
        assert len(d.completed_cycle_curves) == 1
        assert d.completed_cycle_curves[0]["fit_model"] == "exponential"
        assert d.shape_prior["n_cycles"] == 1
        assert len(d.current_cycle_smoothed) == 1
        assert len(d.current_cycle_raw_tail) == 1
        assert d.current_cycle_last_raw_t == 500.0
        assert d.cache_chemistry == "alkaline"
        assert d.cache_window_frac == 0.03

    def test_from_dict_missing_cache_fields(self):
        """Old v4 data without cache fields should get defaults."""
        d = DeviceData.from_dict({"source_entity": "sensor.test"}, "sensor.test")
        assert d.primary_cache_version == 0
        assert d.completed_cycle_curves == []
        assert d.shape_prior is None
        assert d.current_cycle_last_raw_t is None
        assert d.cache_chemistry is None
        assert d.cache_window_frac == 0.05

    def test_to_dict_omits_empty_cache(self):
        """Empty/default cache fields should not appear in serialized output."""
        d = DeviceData(source_entity="sensor.test")
        result = d.to_dict()
        assert "primary_cache_version" not in result
        assert "completed_cycle_curves" not in result
        assert "shape_prior" not in result
        assert "current_cycle_smoothed" not in result
        assert "current_cycle_raw_tail" not in result
        assert "current_cycle_last_raw_t" not in result
        assert "cache_chemistry" not in result
        assert "cache_window_frac" not in result

    def test_to_dict_includes_populated_cache(self):
        d = DeviceData(
            source_entity="sensor.test",
            primary_cache_version=1,
            completed_cycle_curves=[{"smoothed": [], "fit_model": "linear",
                                      "fit_params": {}, "duration_days": 100.0,
                                      "start_t": 0.0, "end_t": 100.0}],
            shape_prior={"median_params": {}, "param_spread": {}, "n_cycles": 1},
            current_cycle_smoothed=[{"t": 1.0, "v": 90.0}],
            current_cycle_raw_tail=[{"t": 1.0, "v": 90.0}],
            current_cycle_last_raw_t=1.0,
            cache_chemistry="alkaline",
            cache_window_frac=0.10,
        )
        result = d.to_dict()
        assert result["primary_cache_version"] == 1
        assert len(result["completed_cycle_curves"]) == 1
        assert result["shape_prior"]["n_cycles"] == 1
        assert result["current_cycle_last_raw_t"] == 1.0
        assert result["cache_chemistry"] == "alkaline"
        assert result["cache_window_frac"] == 0.10

    def test_roundtrip_with_cache(self):
        original = DeviceData(
            source_entity="sensor.test",
            primary_cache_version=1,
            completed_cycle_curves=[{"smoothed": [{"t": 0.0, "v": 100.0}],
                                      "fit_model": "exp", "fit_params": {"k": 0.01},
                                      "duration_days": 200.0,
                                      "start_t": 0.0, "end_t": 200.0}],
            shape_prior={"median_params": {"k": 0.01}, "param_spread": {"k": 0.005}, "n_cycles": 1},
            current_cycle_smoothed=[{"t": 300.0, "v": 80.0}],
            current_cycle_raw_tail=[{"t": 295.0, "v": 81.0}, {"t": 300.0, "v": 80.0}],
            current_cycle_last_raw_t=300.0,
            cache_chemistry="coin_cell",
            cache_window_frac=0.07,
        )
        restored = DeviceData.from_dict(original.to_dict(), "sensor.test")
        assert restored.primary_cache_version == original.primary_cache_version
        assert restored.completed_cycle_curves == original.completed_cycle_curves
        assert restored.shape_prior == original.shape_prior
        assert restored.current_cycle_smoothed == original.current_cycle_smoothed
        assert restored.current_cycle_raw_tail == original.current_cycle_raw_tail
        assert restored.current_cycle_last_raw_t == original.current_cycle_last_raw_t
        assert restored.cache_chemistry == original.cache_chemistry
        assert restored.cache_window_frac == original.cache_window_frac


class TestStoreMigrationV5:
    """Test v4 → v5 migration (primary prediction cache fields)."""

    @pytest.mark.asyncio
    async def test_v4_to_v5_migration(self, store):
        """v4 store data gets cache fields set to defaults during migration."""
        store._store.async_load = AsyncMock(return_value={
            "version": 4,
            "devices": {
                "sensor.test": {
                    "replacement_history": [1000.0],
                    "denied_replacements": [],
                    "ignored": False,
                    "replacement_confirmed": True,
                    "source_entity": "sensor.test",
                    "device_id": "dev1",
                    "completed_cycles": [{"start_t": 0, "end_t": 100}],
                }
            },
        })
        await store.async_load()
        dev = store.devices["sensor.test"]
        # Existing fields preserved
        assert dev.replacement_history == [1000.0]
        assert dev.completed_cycles == [{"start_t": 0, "end_t": 100}]
        # New cache fields at defaults
        assert dev.primary_cache_version == 0
        assert dev.completed_cycle_curves == []
        assert dev.shape_prior is None
        assert dev.current_cycle_smoothed == []
        assert dev.current_cycle_raw_tail == []
        assert dev.current_cycle_last_raw_t is None
        assert dev.cache_chemistry is None
        assert dev.cache_window_frac == 0.05
        # Store marked dirty for re-save
        assert store._dirty is True

    @pytest.mark.asyncio
    async def test_v5_data_loads_without_migration(self, store):
        """v5 store data with cache fields loads directly."""
        store._store.async_load = AsyncMock(return_value={
            "version": 5,
            "devices": {
                "sensor.test": {
                    "replacement_history": [],
                    "denied_replacements": [],
                    "ignored": False,
                    "replacement_confirmed": True,
                    "source_entity": "sensor.test",
                    "device_id": None,
                    "primary_cache_version": 1,
                    "cache_chemistry": "alkaline",
                    "current_cycle_last_raw_t": 42.0,
                }
            },
        })
        await store.async_load()
        dev = store.devices["sensor.test"]
        assert dev.primary_cache_version == 1
        assert dev.cache_chemistry == "alkaline"
        assert dev.current_cycle_last_raw_t == 42.0
        # Not dirty — no migration needed
        assert store._dirty is False
