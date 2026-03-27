"""Tests for the Juice Patrol module framework."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.juice_patrol.modules import (
    JuicePatrolModule,
    ModuleRegistry,
    ServiceDefinition,
    WsCommandDefinition,
    MODULES,
)


# ── Helpers ──────────────────────────────────────────────────────────────


class _GoodModule(JuicePatrolModule):
    MODULE_ID = "good"
    DEPENDENCIES = ()

    async def async_setup(self):
        pass

    def get_entity_data(self, entity_id, battery, base_data, device_data):
        return {"from_good": True}


class _DependentModule(JuicePatrolModule):
    MODULE_ID = "dependent"
    DEPENDENCIES = ("good",)

    async def async_setup(self):
        pass


class _FailingModule(JuicePatrolModule):
    MODULE_ID = "failing"
    DEPENDENCIES = ()

    async def async_setup(self):
        raise RuntimeError("setup failed")


class _ModuleWithHandlers(JuicePatrolModule):
    MODULE_ID = "with_handlers"
    DEPENDENCIES = ()

    async def async_setup(self):
        pass

    @classmethod
    def ws_command_definitions(cls):
        return [
            WsCommandDefinition(
                command_type="test/command",
                schema={},
                handler_method="handle_ws_test",
            )
        ]

    @classmethod
    def service_definitions(cls):
        return [ServiceDefinition("test_svc", "handle_svc_test")]

    async def handle_ws_test(self, hass, connection, msg):
        pass

    async def handle_svc_test(self, call):
        pass


# ── Explicit module list ────────────────────────────────────────────────


class TestExplicitModuleList:

    def test_modules_list_contains_all_expected(self):
        module_ids = {cls.MODULE_ID for cls in MODULES}
        assert module_ids == {
            "battery_id", "monitoring", "replacement", "shopping"
        }


# ── Dependency resolution ────────────────────────────────────────────────


class TestDependencyResolution:

    def test_topological_sort_simple(self):
        order = ModuleRegistry._resolve_order({
            "good": _GoodModule,
            "dependent": _DependentModule,
        })
        assert order.index("good") < order.index("dependent")

    def test_missing_dependency_skipped(self):
        order = ModuleRegistry._resolve_order({
            "dependent": _DependentModule,
            # "good" is missing
        })
        # dependent should still appear (with a warning logged)
        assert "dependent" in order


# ── Setup / teardown ─────────────────────────────────────────────────────


class TestSetupTeardown:

    @pytest.mark.asyncio
    async def test_setup_all_loads_modules(self):
        coordinator = MagicMock()
        coordinator.hass = MagicMock()
        registry = ModuleRegistry(coordinator)

        with patch(
            "custom_components.juice_patrol.modules.MODULES",
            [_GoodModule],
        ):
            await registry.async_setup_all()

        assert "good" in [m.MODULE_ID for m in registry.modules_in_order]

    @pytest.mark.asyncio
    async def test_failing_module_skipped(self):
        coordinator = MagicMock()
        coordinator.hass = MagicMock()
        registry = ModuleRegistry(coordinator)

        with patch(
            "custom_components.juice_patrol.modules.MODULES",
            [_GoodModule, _FailingModule],
        ):
            await registry.async_setup_all()

        module_ids = [m.MODULE_ID for m in registry.modules_in_order]
        assert "good" in module_ids
        assert "failing" not in module_ids

    @pytest.mark.asyncio
    async def test_teardown_in_reverse_order(self):
        coordinator = MagicMock()
        coordinator.hass = MagicMock()
        registry = ModuleRegistry(coordinator)

        teardown_order = []

        class _A(JuicePatrolModule):
            MODULE_ID = "a"
            DEPENDENCIES = ()
            async def async_setup(self): pass
            async def async_teardown(self):
                teardown_order.append("a")

        class _B(JuicePatrolModule):
            MODULE_ID = "b"
            DEPENDENCIES = ("a",)
            async def async_setup(self): pass
            async def async_teardown(self):
                teardown_order.append("b")

        with patch(
            "custom_components.juice_patrol.modules.MODULES",
            [_A, _B],
        ):
            await registry.async_setup_all()
            await registry.async_teardown_all()

        assert teardown_order == ["b", "a"]


# ── WS/service definitions (class-level) ─────────────────────────────────


class TestDefinitions:

    def test_ws_command_definitions_classmethod(self):
        defns = _ModuleWithHandlers.ws_command_definitions()
        assert len(defns) == 1
        assert defns[0].command_type == "test/command"
        assert defns[0].handler_method == "handle_ws_test"

    def test_service_definitions_classmethod(self):
        defns = _ModuleWithHandlers.service_definitions()
        assert len(defns) == 1
        assert defns[0].name == "test_svc"
        assert defns[0].handler_method == "handle_svc_test"

    def test_base_module_returns_empty_definitions(self):
        assert _GoodModule.ws_command_definitions() == []
        assert _GoodModule.service_definitions() == []


# ── Entity data enrichment ───────────────────────────────────────────────


class TestEnrichEntityData:

    @pytest.mark.asyncio
    async def test_enrich_merges_module_data(self):
        coordinator = MagicMock()
        coordinator.hass = MagicMock()
        registry = ModuleRegistry(coordinator)

        with patch(
            "custom_components.juice_patrol.modules.MODULES",
            [_GoodModule],
        ):
            await registry.async_setup_all()

        battery = MagicMock()
        base_data = {"level": 50}
        result = registry.enrich_entity_data(
            "sensor.test", battery, base_data, None
        )

        assert result["level"] == 50
        assert result["from_good"] is True

    @pytest.mark.asyncio
    async def test_failing_get_entity_data_does_not_crash(self):
        coordinator = MagicMock()
        coordinator.hass = MagicMock()
        registry = ModuleRegistry(coordinator)

        class _Crasher(JuicePatrolModule):
            MODULE_ID = "crasher"
            DEPENDENCIES = ()
            async def async_setup(self): pass
            def get_entity_data(self, entity_id, battery, base_data, device_data):
                raise RuntimeError("boom")

        with patch(
            "custom_components.juice_patrol.modules.MODULES",
            [_Crasher],
        ):
            await registry.async_setup_all()

        battery = MagicMock()
        base_data = {"level": 50}
        result = registry.enrich_entity_data(
            "sensor.test", battery, base_data, None
        )

        # Should still return base_data despite module crash
        assert result["level"] == 50

    @pytest.mark.asyncio
    async def test_key_collision_logged(self, caplog):
        """Overlapping keys from modules produce a debug log."""
        coordinator = MagicMock()
        coordinator.hass = MagicMock()
        registry = ModuleRegistry(coordinator)

        class _OverWriter(JuicePatrolModule):
            MODULE_ID = "overwriter"
            DEPENDENCIES = ()
            async def async_setup(self): pass
            def get_entity_data(self, entity_id, battery, base_data, device_data):
                return {"level": 99}

        with patch(
            "custom_components.juice_patrol.modules.MODULES",
            [_OverWriter],
        ):
            await registry.async_setup_all()

        import logging
        with caplog.at_level(logging.DEBUG):
            result = registry.enrich_entity_data(
                "sensor.test", MagicMock(), {"level": 50}, None
            )

        assert result["level"] == 99
        assert "overwrites keys" in caplog.text


# ── Coordinator callback hooks ───────────────────────────────────────────


class TestCoordinatorHooks:

    def test_async_on_entity_updated(self):
        """Coordinator callback hook fires and can be unsubscribed."""
        from custom_components.juice_patrol.data.coordinator import (
            JuicePatrolCoordinator,
        )
        from unittest.mock import patch as _patch

        hass = MagicMock()
        hass.async_create_task = MagicMock(
            side_effect=lambda coro, *a, **kw: (
                coro.close() if hasattr(coro, "close") else None,
                MagicMock(),
            )[-1]
        )
        entry = MagicMock()
        entry.options = {}
        entry.entry_id = "test"

        with _patch(
            "custom_components.juice_patrol.data.coordinator.JuicePatrolStore"
        ):
            coord = JuicePatrolCoordinator(hass, entry)

        calls = []
        unsub = coord.async_on_entity_updated(
            lambda eid, data: calls.append((eid, data))
        )

        # Simulate callback
        for cb in coord._on_entity_updated:
            cb("sensor.test", {"level": 42})

        assert len(calls) == 1
        assert calls[0] == ("sensor.test", {"level": 42})

        unsub()
        assert len(coord._on_entity_updated) == 0

    def test_async_on_full_update(self):
        """Coordinator full-update callback hook fires and can be unsubscribed."""
        from custom_components.juice_patrol.data.coordinator import (
            JuicePatrolCoordinator,
        )
        from unittest.mock import patch as _patch

        hass = MagicMock()
        hass.async_create_task = MagicMock(
            side_effect=lambda coro, *a, **kw: (
                coro.close() if hasattr(coro, "close") else None,
                MagicMock(),
            )[-1]
        )
        entry = MagicMock()
        entry.options = {}
        entry.entry_id = "test"

        with _patch(
            "custom_components.juice_patrol.data.coordinator.JuicePatrolStore"
        ):
            coord = JuicePatrolCoordinator(hass, entry)

        calls = []
        unsub = coord.async_on_full_update(lambda data: calls.append(data))

        for cb in coord._on_full_update:
            cb({"sensor.a": {}})

        assert len(calls) == 1

        unsub()
        assert len(coord._on_full_update) == 0
