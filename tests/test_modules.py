"""Tests for the Juice Patrol module framework."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.juice_patrol.modules import (
    JuicePatrolModule,
    ModuleRegistry,
    ServiceDefinition,
)


# ── Helpers ──────────────────────────────────────────────────────────────


class _GoodModule(JuicePatrolModule):
    MODULE_ID = "good"
    DEPENDENCIES = ()

    async def async_setup(self):
        pass

    def get_entity_data(self, entity_id, battery, base_data):
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

    def ws_handlers(self):
        return ["ws_handler_1"]

    def services(self):
        return [ServiceDefinition("test_svc", lambda: None)]


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

        with patch.object(
            ModuleRegistry, "_discover_module_classes",
            return_value={"good": _GoodModule},
        ):
            await registry.async_setup_all()

        assert "good" in [m.MODULE_ID for m in registry.modules_in_order]

    @pytest.mark.asyncio
    async def test_failing_module_skipped(self):
        coordinator = MagicMock()
        coordinator.hass = MagicMock()
        registry = ModuleRegistry(coordinator)

        with patch.object(
            ModuleRegistry, "_discover_module_classes",
            return_value={
                "good": _GoodModule,
                "failing": _FailingModule,
            },
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

        with patch.object(
            ModuleRegistry, "_discover_module_classes",
            return_value={"a": _A, "b": _B},
        ):
            await registry.async_setup_all()
            await registry.async_teardown_all()

        assert teardown_order == ["b", "a"]


# ── Collection methods ───────────────────────────────────────────────────


class TestCollectMethods:

    @pytest.mark.asyncio
    async def test_collect_ws_handlers(self):
        coordinator = MagicMock()
        coordinator.hass = MagicMock()
        registry = ModuleRegistry(coordinator)

        with patch.object(
            ModuleRegistry, "_discover_module_classes",
            return_value={"with_handlers": _ModuleWithHandlers},
        ):
            await registry.async_setup_all()

        handlers = registry.collect_ws_handlers()
        assert "ws_handler_1" in handlers

    @pytest.mark.asyncio
    async def test_collect_services(self):
        coordinator = MagicMock()
        coordinator.hass = MagicMock()
        registry = ModuleRegistry(coordinator)

        with patch.object(
            ModuleRegistry, "_discover_module_classes",
            return_value={"with_handlers": _ModuleWithHandlers},
        ):
            await registry.async_setup_all()

        services = registry.collect_services()
        assert len(services) == 1
        assert services[0].name == "test_svc"


# ── Entity data enrichment ───────────────────────────────────────────────


class TestEnrichEntityData:

    @pytest.mark.asyncio
    async def test_enrich_merges_module_data(self):
        coordinator = MagicMock()
        coordinator.hass = MagicMock()
        registry = ModuleRegistry(coordinator)

        with patch.object(
            ModuleRegistry, "_discover_module_classes",
            return_value={"good": _GoodModule},
        ):
            await registry.async_setup_all()

        battery = MagicMock()
        base_data = {"level": 50}
        result = registry.enrich_entity_data("sensor.test", battery, base_data)

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
            def get_entity_data(self, entity_id, battery, base_data):
                raise RuntimeError("boom")

        with patch.object(
            ModuleRegistry, "_discover_module_classes",
            return_value={"crasher": _Crasher},
        ):
            await registry.async_setup_all()

        battery = MagicMock()
        base_data = {"level": 50}
        result = registry.enrich_entity_data("sensor.test", battery, base_data)

        # Should still return base_data despite module crash
        assert result["level"] == 50
