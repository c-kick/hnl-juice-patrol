"""Tests for Juice Patrol history cache."""

import time

from custom_components.juice_patrol.history import HistoryCache


class TestHistoryCache:
    """Test the in-memory history cache."""

    def test_get_empty(self):
        cache = HistoryCache()
        assert cache.get("sensor.test") is None

    def test_set_and_get(self):
        cache = HistoryCache()
        readings = [{"t": 1.0, "v": 90.0}]
        cache.set("sensor.test", readings)
        result = cache.get("sensor.test")
        assert result == readings

    def test_get_expired(self):
        cache = HistoryCache()
        readings = [{"t": 1.0, "v": 90.0}]
        # Set with a past expiry time
        cache._cache["sensor.test"] = (time.time() - 1, readings)
        assert cache.get("sensor.test") is None
        # Should have been removed
        assert "sensor.test" not in cache._cache

    def test_invalidate_single(self):
        cache = HistoryCache()
        cache.set("sensor.a", [{"t": 1, "v": 90}])
        cache.set("sensor.b", [{"t": 1, "v": 80}])
        cache.invalidate("sensor.a")
        assert cache.get("sensor.a") is None
        assert cache.get("sensor.b") is not None

    def test_invalidate_nonexistent(self):
        """Invalidating a non-existent key should not raise."""
        cache = HistoryCache()
        cache.invalidate("sensor.missing")  # Should not raise

    def test_invalidate_all(self):
        cache = HistoryCache()
        cache.set("sensor.a", [{"t": 1, "v": 90}])
        cache.set("sensor.b", [{"t": 1, "v": 80}])
        cache.invalidate_all()
        assert cache.get("sensor.a") is None
        assert cache.get("sensor.b") is None

    def test_overwrite(self):
        cache = HistoryCache()
        cache.set("sensor.test", [{"t": 1, "v": 90}])
        cache.set("sensor.test", [{"t": 2, "v": 80}])
        result = cache.get("sensor.test")
        assert result == [{"t": 2, "v": 80}]
