"""Module framework for Juice Patrol.

Each functional area (battery identification, replacement tracking, monitoring,
shopping list, dashboard) is a self-contained module that can be added or
removed without affecting the rest of the integration.

Modules declare dependencies, have their own lifecycle, and register their own
WebSocket handlers and services.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, ServiceCall

if TYPE_CHECKING:
    from ..data.store import DeviceData
    from ..data.coordinator import JuicePatrolCoordinator
    from ..discovery import DiscoveredBattery

_LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class WsCommandDefinition:
    """Describes a WS command a module wants to register."""

    command_type: str
    schema: dict[vol.Marker, Any]
    handler_method: str


@dataclass(frozen=True)
class ServiceDefinition:
    """Describes a service a module wants to register."""

    name: str
    handler_method: str
    schema: vol.Schema | None = None


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

    @classmethod
    def ws_command_definitions(cls) -> list[WsCommandDefinition]:
        """Return WS command definitions (class-level, no instance needed)."""
        return []

    @classmethod
    def service_definitions(cls) -> list[ServiceDefinition]:
        """Return service definitions (class-level, no instance needed)."""
        return []

    def get_entity_data(
        self,
        entity_id: str,
        battery: DiscoveredBattery,
        base_data: dict[str, Any],
        device_data: DeviceData | None,
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
        """Resolve dependencies and set up all modules."""
        discovered = {cls.MODULE_ID: cls for cls in MODULES}
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

    def enrich_entity_data(
        self,
        entity_id: str,
        battery: DiscoveredBattery,
        base_data: dict[str, Any],
        device_data: DeviceData | None,
    ) -> dict[str, Any]:
        """Let each module enrich the entity data dict."""
        for module in self.modules_in_order:
            try:
                extra = module.get_entity_data(
                    entity_id, battery, base_data, device_data
                )
                if extra:
                    if _LOGGER.isEnabledFor(logging.DEBUG):
                        overlap = set(extra) & set(base_data)
                        if overlap:
                            _LOGGER.debug(
                                "Module '%s' overwrites keys %s for %s",
                                module.MODULE_ID,
                                overlap,
                                entity_id,
                            )
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


# Explicit module list — add new modules here.
# Imported after class definitions to avoid circular imports.
from .battery_id import BatteryIdModule  # noqa: E402
from .monitoring import MonitoringModule  # noqa: E402
from .replacement import ReplacementModule  # noqa: E402
from .shopping import ShoppingModule  # noqa: E402

MODULES: list[type[JuicePatrolModule]] = [
    BatteryIdModule,
    MonitoringModule,
    ReplacementModule,
    ShoppingModule,
]
