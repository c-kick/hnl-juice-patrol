"""Tests for Juice Patrol base entity module."""

from custom_components.juice_patrol.entity import slugify_entity


class TestSlugifyEntity:
    """Test entity ID slugification."""

    def test_sensor(self):
        assert slugify_entity("sensor.living_room_motion_battery") == "living_room_motion_battery"

    def test_binary_sensor(self):
        assert slugify_entity("binary_sensor.door_lock_battery") == "door_lock_battery"

    def test_no_domain(self):
        assert slugify_entity("nodomain") == "nodomain"

    def test_multiple_dots(self):
        assert slugify_entity("sensor.a.b.c") == "a.b.c"

    def test_empty(self):
        assert slugify_entity("") == ""
