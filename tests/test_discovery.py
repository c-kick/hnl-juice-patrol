"""Tests for Juice Patrol battery discovery."""

from custom_components.juice_patrol.discovery import (
    BATTERY_STRING_MAP,
    parse_battery_level,
)


class TestParseBatteryLevel:
    """Test parse_battery_level function."""

    def test_none(self):
        assert parse_battery_level(None) is None

    def test_int(self):
        assert parse_battery_level(85) == 85.0

    def test_float(self):
        assert parse_battery_level(72.5) == 72.5

    def test_zero(self):
        assert parse_battery_level(0) == 0.0

    def test_hundred(self):
        assert parse_battery_level(100) == 100.0

    def test_out_of_range_negative(self):
        assert parse_battery_level(-5) is None

    def test_out_of_range_high(self):
        assert parse_battery_level(150) is None

    def test_numeric_string(self):
        assert parse_battery_level("87") == 87.0

    def test_numeric_string_float(self):
        assert parse_battery_level("92.5") == 92.5

    def test_numeric_string_out_of_range(self):
        assert parse_battery_level("200") is None

    def test_string_normal(self):
        assert parse_battery_level("normal") == 100.0

    def test_string_low(self):
        assert parse_battery_level("low") == 25.0

    def test_string_critical(self):
        assert parse_battery_level("critical") == 5.0

    def test_string_full(self):
        assert parse_battery_level("full") == 100.0

    def test_string_case_insensitive(self):
        assert parse_battery_level("Normal") == 100.0
        assert parse_battery_level("LOW") == 25.0

    def test_string_unknown(self):
        assert parse_battery_level("banana") is None

    def test_empty_string(self):
        assert parse_battery_level("") is None

    def test_bool(self):
        # bool is a subclass of int in Python
        assert parse_battery_level(True) == 1.0
        assert parse_battery_level(False) == 0.0

    def test_all_string_mappings(self):
        """Verify all known string mappings produce a value."""
        for key, expected in BATTERY_STRING_MAP.items():
            result = parse_battery_level(key)
            if expected is not None:
                assert result == float(expected), f"Failed for '{key}'"
