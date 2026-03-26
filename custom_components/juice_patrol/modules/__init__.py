"""Module framework for Juice Patrol.

Each functional area (battery identification, replacement tracking, monitoring,
shopping list, dashboard) is a self-contained module that can be added or
removed without affecting the rest of the integration.

Modules declare dependencies, have their own lifecycle, and register their own
WebSocket handlers and services.
"""

from __future__ import annotations

import importlib
import logging
import pkgutil
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, ServiceCall

if TYPE_CHECKING:
    from ..data.coordinator import JuicePatrolCoordinator
    from ..discovery import DiscoveredBattery

_LOGGER = logging.getLogger(__name__)


class ServiceDefinition:
    """Describes a service a module wants to register."""

    __slots__ = ("name", "handler", "schema")

    def __init__(
        self,
        name: str,
        handler: Any,
        schema: vol.Schema | None = None,
    ) -> None:
        self.name = name
        self.handler = handler
        self.schema = schema


class JuicePatrolModule(ABC):
    """Base class for all Juice Patrol modules."""

    MODULE_ID: str
    DEPENDENCIES: tuple[str, ...] = ()

    def __init__(self, coordinator: JuicePatrolCoordinator) -> None:
        self.coordinator = coordinator
        self.hass: HomeAssistant = coordinator.hass

    @abstractmethod
    async def async_setup(self) -> None:
        """Set up the module. Called after dependencies are ready."""

    async def async_teardown(self) -> None:
        """Tear down the module. Called in reverse dependency order."""

    def ws_handlers(self) -> list:
        """Return WebSocket handler functions to register."""
        return []

    def services(self) -> list[ServiceDefinition]:
        """Return service definitions to register."""
        return []

    def get_entity_data(
        self,
        entity_id: str,
        battery: DiscoveredBattery,
        base_data: dict[str, Any],
    ) -> dict[str, Any]:
        """Return additional data to merge into entity data dict."""
        return {}

    def get_diagnostics(self) -> dict[str, Any]:
        """Return diagnostic data for this module."""
        return {}

    def on_entity_disappeared(self, entity_id: str) -> None:
        """Called when a previously-discovered entity disappears."""


class ModuleRegistry:
    """Discovers, initialises, and manages Juice Patrol modules."""

    def __init__(self, coordinator: JuicePatrolCoordinator) -> None:
        self._coordinator = coordinator
        self._modules: dict[str, JuicePatrolModule] = {}
        self._setup_order: list[str] = []

    @property
    def modules_in_order(self) -> list[JuicePatrolModule]:
        """Return modules in dependency-resolved order."""
        return [self._modules[mid] for mid in self._setup_order if mid in self._modules]

    def get_module(self, module_id: str) -> JuicePatrolModule | None:
        """Get a module by ID, or None if not loaded."""
        return self._modules.get(module_id)

    async def async_setup_all(self) -> None:
        """Discover, resolve dependencies, and set up all modules."""
        discovered = self._discover_module_classes()
        order = self._resolve_order(discovered)

        for module_id in order:
            cls = discovered[module_id]
            try:
                module = cls(self._coordinator)
                await module.async_setup()
                self._modules[module_id] = module
                self._setup_order.append(module_id)
                _LOGGER.debug("Module '%s' set up successfully", module_id)
            except Exception:
                _LOGGER.exception(
                    "Module '%s' failed to set up — skipping", module_id
                )

        _LOGGER.info(
            "Module registry ready: %d/%d modules loaded (%s)",
            len(self._modules),
            len(discovered),
            ", ".join(self._setup_order),
        )

    async def async_teardown_all(self) -> None:
        """Tear down all modules in reverse order."""
        for module_id in reversed(self._setup_order):
            module = self._modules.get(module_id)
            if module is None:
                continue
            try:
                await module.async_teardown()
                _LOGGER.debug("Module '%s' torn down", module_id)
            except Exception:
                _LOGGER.exception(
                    "Module '%s' failed during teardown", module_id
                )
        self._modules.clear()
        self._setup_order.clear()

    def collect_ws_handlers(self) -> list:
        """Gather WebSocket handlers from all loaded modules."""
        handlers = []
        for module in self.modules_in_order:
            try:
                handlers.extend(module.ws_handlers())
            except Exception:
                _LOGGER.exception(
                    "Module '%s' failed to provide WS handlers",
                    module.MODULE_ID,
                )
        return handlers

    def collect_services(self) -> list[ServiceDefinition]:
        """Gather service definitions from all loaded modules."""
        services = []
        for module in self.modules_in_order:
            try:
                services.extend(module.services())
            except Exception:
                _LOGGER.exception(
                    "Module '%s' failed to provide services",
                    module.MODULE_ID,
                )
        return services

    def enrich_entity_data(
        self,
        entity_id: str,
        battery: DiscoveredBattery,
        base_data: dict[str, Any],
    ) -> dict[str, Any]:
        """Let each module enrich the entity data dict."""
        for module in self.modules_in_order:
            try:
                extra = module.get_entity_data(entity_id, battery, base_data)
                if extra:
                    base_data.update(extra)
            except Exception:
                _LOGGER.exception(
                    "Module '%s' failed in get_entity_data for %s",
                    module.MODULE_ID,
                    entity_id,
                )
        return base_data

    def on_entity_disappeared(self, entity_id: str) -> None:
        """Notify all modules that an entity has disappeared."""
        for module in self.modules_in_order:
            try:
                module.on_entity_disappeared(entity_id)
            except Exception:
                _LOGGER.exception(
                    "Module '%s' failed in on_entity_disappeared for %s",
                    module.MODULE_ID,
                    entity_id,
                )

    def get_all_diagnostics(self) -> dict[str, Any]:
        """Collect diagnostics from all modules."""
        diag: dict[str, Any] = {}
        for module in self.modules_in_order:
            try:
                module_diag = module.get_diagnostics()
                if module_diag:
                    diag[module.MODULE_ID] = module_diag
            except Exception:
                _LOGGER.exception(
                    "Module '%s' failed to provide diagnostics",
                    module.MODULE_ID,
                )
        return diag

    @staticmethod
    def _discover_module_classes() -> dict[str, type[JuicePatrolModule]]:
        """Import all sub-packages and find JuicePatrolModule subclasses."""
        from . import __path__ as pkg_path, __name__ as pkg_name

        classes: dict[str, type[JuicePatrolModule]] = {}
        for importer, modname, ispkg in pkgutil.iter_modules(pkg_path):
            if not ispkg:
                continue
            try:
                mod = importlib.import_module(f"{pkg_name}.{modname}")
            except Exception:
                _LOGGER.exception("Failed to import module package '%s'", modname)
                continue

            for attr_name in dir(mod):
                attr = getattr(mod, attr_name)
                if (
                    isinstance(attr, type)
                    and issubclass(attr, JuicePatrolModule)
                    and attr is not JuicePatrolModule
                    and hasattr(attr, "MODULE_ID")
                ):
                    classes[attr.MODULE_ID] = attr
        return classes

    @staticmethod
    def _resolve_order(
        classes: dict[str, type[JuicePatrolModule]],
    ) -> list[str]:
        """Topological sort of modules by dependencies."""
        visited: set[str] = set()
        order: list[str] = []
        temp_mark: set[str] = set()

        def visit(mid: str) -> None:
            if mid in visited:
                return
            if mid in temp_mark:
                _LOGGER.warning("Circular dependency detected involving '%s'", mid)
                return
            if mid not in classes:
                _LOGGER.warning("Unknown dependency '%s' — skipping", mid)
                return
            temp_mark.add(mid)
            for dep in classes[mid].DEPENDENCIES:
                visit(dep)
            temp_mark.discard(mid)
            visited.add(mid)
            order.append(mid)

        for mid in classes:
            visit(mid)
        return order
