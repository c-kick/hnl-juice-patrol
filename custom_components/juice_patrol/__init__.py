"""Juice Patrol — Battery Monitoring for Home Assistant."""

from __future__ import annotations

import logging

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import (
    config_validation as cv,
    device_registry as dr,
    entity_registry as er,
)
from homeassistant.helpers.typing import ConfigType

from .const import (
    DOMAIN,
    PLATFORMS,
)
from .data import JuicePatrolCoordinator
from .panel import async_setup_panel

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

_LOGGER = logging.getLogger(__name__)

type JuicePatrolConfigEntry = ConfigEntry[JuicePatrolCoordinator]


def _get_coordinator(hass: HomeAssistant) -> JuicePatrolCoordinator | None:
    """Get the single coordinator instance, or None if not loaded."""
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is ConfigEntryState.LOADED:
            return entry.runtime_data
    return None


def _ws_get_coordinator(
    hass: HomeAssistant, connection, msg_id: int
) -> JuicePatrolCoordinator | None:
    """Get coordinator for a WS handler, sending an error if unavailable."""
    coordinator = _get_coordinator(hass)
    if coordinator is None:
        connection.send_error(msg_id, "not_found", "Juice Patrol not set up")
    return coordinator


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up Juice Patrol — register panel and core WS handlers."""
    await async_setup_panel(hass)

    # Core WS handlers (not owned by any module)
    for ws_handler in (
        ws_refresh,
        ws_set_ignored,
        ws_get_ignored,
    ):
        websocket_api.async_register_command(hass, ws_handler)

    return True


async def async_setup_entry(
    hass: HomeAssistant, entry: JuicePatrolConfigEntry
) -> bool:
    """Set up Juice Patrol from a config entry."""
    coordinator = JuicePatrolCoordinator(hass, entry)
    try:
        await coordinator.async_setup()
        await coordinator.async_config_entry_first_refresh()
    except Exception:
        await coordinator.async_shutdown()
        raise

    entry.runtime_data = coordinator

    # Register module WS handlers and services
    for ws_handler in coordinator.registry.collect_ws_handlers():
        websocket_api.async_register_command(hass, ws_handler)

    for svc_def in coordinator.registry.collect_services():
        hass.services.async_register(
            DOMAIN, svc_def.name, svc_def.handler, schema=svc_def.schema
        )

    # Clean up entity registry entries from removed prediction engine sensors.
    _REMOVED_SUFFIXES = ("_discharge_rate", "_days_remaining", "_predicted_empty")
    ent_reg = er.async_get(hass)
    stale = [
        ent_entry
        for ent_entry in er.async_entries_for_config_entry(ent_reg, entry.entry_id)
        if ent_entry.unique_id
        and any(ent_entry.unique_id.endswith(s) for s in _REMOVED_SUFFIXES)
    ]
    for ent_entry in stale:
        _LOGGER.info("Removing orphaned prediction entity: %s", ent_entry.entity_id)
        ent_reg.async_remove(ent_entry.entity_id)

    # Clean up orphan devices that have no entities left
    dev_reg = dr.async_get(hass)
    for dev_entry in dr.async_entries_for_config_entry(dev_reg, entry.entry_id):
        if not er.async_entries_for_device(ent_reg, dev_entry.id):
            _LOGGER.info("Removing orphaned device: %s", dev_entry.name)
            dev_reg.async_remove_device(dev_entry.id)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    entry.async_on_unload(
        entry.add_update_listener(_async_options_updated)
    )

    _LOGGER.info("Juice Patrol setup complete")
    return True


async def _async_options_updated(
    hass: HomeAssistant, entry: JuicePatrolConfigEntry
) -> None:
    hass.async_create_task(entry.runtime_data.async_request_refresh())


# ---------------------------------------------------------------------------
# Core WebSocket API handlers (not module-owned)
# ---------------------------------------------------------------------------


@websocket_api.websocket_command(
    {vol.Required("type"): "juice_patrol/refresh"}
)
@websocket_api.async_response
async def ws_refresh(hass, connection, msg):
    """Force refresh with cache invalidation (throttled to prevent abuse)."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    if not coordinator.try_claim_refresh():
        connection.send_result(msg["id"], {"ok": True, "throttled": True})
        return
    await coordinator.async_manual_refresh()
    connection.send_result(msg["id"], {"ok": True})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/set_ignored",
        vol.Required("entity_id"): cv.entity_id,
        vol.Required("ignored"): bool,
    }
)
@websocket_api.async_response
async def ws_set_ignored(hass, connection, msg):
    """Set the ignored flag for a device."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    entity_id = msg["entity_id"]
    coordinator.store.set_ignored(entity_id, msg["ignored"])
    await coordinator.async_request_refresh()
    connection.send_result(msg["id"], {"ok": True})


@websocket_api.websocket_command(
    {vol.Required("type"): "juice_patrol/get_ignored"}
)
@websocket_api.async_response
async def ws_get_ignored(hass, connection, msg):
    """Return the list of ignored devices with basic info."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    ignored_ids = coordinator.store.get_ignored_entities()
    devices = []
    for entity_id in sorted(ignored_ids):
        state = hass.states.get(entity_id)
        name = (
            state.attributes.get("friendly_name", entity_id)
            if state
            else entity_id
        )
        level = None
        if state and state.state not in ("unavailable", "unknown"):
            try:
                level = float(state.state)
            except (ValueError, TypeError):
                pass
        devices.append({
            "entity_id": entity_id,
            "name": name,
            "level": level,
        })
    connection.send_result(msg["id"], {"devices": devices})


async def async_remove_config_entry_device(
    hass: HomeAssistant,
    config_entry: JuicePatrolConfigEntry,
    device_entry: dr.DeviceEntry,
) -> bool:
    """Allow removal of a device if it is no longer actively tracked."""
    coordinator: JuicePatrolCoordinator = config_entry.runtime_data
    for identifier in device_entry.identifiers:
        if identifier[0] != DOMAIN:
            continue
        device_id_or_entity = identifier[1]
        if device_id_or_entity == "juice_patrol":
            return False
        for battery in coordinator.discovered.values():
            if (battery.device_id or battery.entity_id) == device_id_or_entity:
                return False
    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: JuicePatrolConfigEntry
) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        await entry.runtime_data.async_shutdown()
    return unload_ok
