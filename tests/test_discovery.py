"""Tests for Juice Patrol battery discovery."""

from custom_components.juice_patrol.discovery.discovery import (
    BATTERY_STRING_MAP,
    DiscoveredBattery,
    SourceType,
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


def _make_battery(
    entity_id: str,
    device_id: str | None = None,
    current_level: float | None = None,
    source_type: SourceType = SourceType.DEVICE_CLASS_SENSOR,
) -> DiscoveredBattery:
    """Create a DiscoveredBattery for dedup tests."""
    return DiscoveredBattery(
        entity_id=entity_id,
        device_id=device_id,
        device_name=f"Device {entity_id}",
        current_level=current_level,
        source_type=source_type,
    )


class TestDedupPreference:
    """Test that dedup correctly selects the best entity per device.

    Exercises the dedup logic in async_discover_batteries by building
    pre-dedup dicts and verifying which entity survives.  This covers
    the fix for battery_state entities (non-numeric) winning over
    battery_level entities (numeric) for the same device.
    """

    @staticmethod
    def _dedup(discovered: dict[str, DiscoveredBattery]) -> dict[str, DiscoveredBattery]:
        """Minimal extraction of the dedup algorithm from async_discover_batteries."""
        seen_devices: dict[str, str] = {}
        deduped: dict[str, DiscoveredBattery] = {}
        for entity_id, battery in discovered.items():
            if battery.device_id is None:
                deduped[entity_id] = battery
                continue
            existing_eid = seen_devices.get(battery.device_id)
            if existing_eid is None:
                seen_devices[battery.device_id] = entity_id
                deduped[entity_id] = battery
            else:
                existing = deduped[existing_eid]
                prefer_new = False
                new_has_level = battery.current_level is not None
                existing_has_level = existing.current_level is not None
                if (
                    battery.source_type == SourceType.DEVICE_CLASS_SENSOR
                    and existing.source_type != SourceType.DEVICE_CLASS_SENSOR
                ):
                    prefer_new = True
                elif (
                    existing.source_type == SourceType.DEVICE_CLASS_SENSOR
                    and battery.source_type != SourceType.DEVICE_CLASS_SENSOR
                ):
                    prefer_new = False
                elif new_has_level and not existing_has_level:
                    prefer_new = True
                elif not new_has_level and existing_has_level:
                    prefer_new = False
                elif entity_id < existing_eid:
                    prefer_new = True

                if prefer_new:
                    del deduped[existing_eid]
                    seen_devices[battery.device_id] = entity_id
                    deduped[entity_id] = battery
        return deduped

    def test_level_entity_preferred_over_state_entity(self):
        """Battery level entity (numeric) must beat battery state entity (None level)."""
        state = _make_battery(
            "sensor.dev_battery_state", device_id="dev1", current_level=None,
        )
        level = _make_battery(
            "sensor.dev_battery_level", device_id="dev1", current_level=85.0,
        )
        # state sorts before level, so it's iterated first
        discovered = {"sensor.dev_battery_state": state, "sensor.dev_battery_level": level}
        result = self._dedup(discovered)
        assert "sensor.dev_battery_level" in result
        assert "sensor.dev_battery_state" not in result

    def test_state_entity_alphabetically_first_still_loses(self):
        """Even when the state entity has a smaller entity_id, level entity wins."""
        state = _make_battery(
            "sensor.dev_bat", device_id="dev1", current_level=None,
        )
        level = _make_battery(
            "sensor.dev_battery", device_id="dev1", current_level=75.0,
        )
        discovered = {"sensor.dev_bat": state, "sensor.dev_battery": level}
        result = self._dedup(discovered)
        assert "sensor.dev_battery" in result
        assert "sensor.dev_bat" not in result

    def test_device_class_sensor_still_preferred_over_attribute(self):
        """Device class sensor is still preferred over attribute-based discovery."""
        dc_sensor = _make_battery(
            "sensor.dev_battery", device_id="dev1", current_level=75.0,
            source_type=SourceType.DEVICE_CLASS_SENSOR,
        )
        attr_based = _make_battery(
            "sensor.dev_main", device_id="dev1", current_level=80.0,
            source_type=SourceType.ATTRIBUTE_BATTERY_LEVEL,
        )
        discovered = {"sensor.dev_main": attr_based, "sensor.dev_battery": dc_sensor}
        result = self._dedup(discovered)
        assert "sensor.dev_battery" in result
        assert "sensor.dev_main" not in result

    def test_both_have_level_picks_lexically_first(self):
        """When both entities have valid levels, pick lexically first for stability."""
        a = _make_battery("sensor.aaa_battery", device_id="dev1", current_level=80.0)
        b = _make_battery("sensor.zzz_battery", device_id="dev1", current_level=90.0)
        discovered = {"sensor.zzz_battery": b, "sensor.aaa_battery": a}
        result = self._dedup(discovered)
        assert "sensor.aaa_battery" in result
        assert "sensor.zzz_battery" not in result

    def test_neither_has_level_picks_lexically_first(self):
        """When neither entity has a level, pick lexically first for stability."""
        a = _make_battery("sensor.aaa_state", device_id="dev1", current_level=None)
        b = _make_battery("sensor.zzz_state", device_id="dev1", current_level=None)
        discovered = {"sensor.zzz_state": b, "sensor.aaa_state": a}
        result = self._dedup(discovered)
        assert "sensor.aaa_state" in result
        assert "sensor.zzz_state" not in result

    def test_no_device_id_always_kept(self):
        """Entities without a device_id are always kept (no dedup possible)."""
        a = _make_battery("sensor.standalone_1", device_id=None, current_level=80.0)
        b = _make_battery("sensor.standalone_2", device_id=None, current_level=90.0)
        discovered = {"sensor.standalone_1": a, "sensor.standalone_2": b}
        result = self._dedup(discovered)
        assert len(result) == 2
