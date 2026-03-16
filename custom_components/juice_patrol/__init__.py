"""Juice Patrol — Predictive Battery Monitoring for Home Assistant."""

from __future__ import annotations

import logging

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv

from .const import (
    CONF_LOW_THRESHOLD,
    CONF_PREDICTION_HORIZON,
    CONF_STALE_TIMEOUT,
    DEFAULT_LOW_THRESHOLD,
    DEFAULT_PREDICTION_HORIZON,
    DEFAULT_STALE_TIMEOUT,
    DOMAIN,
    PLATFORMS,
)
from .coordinator import JuicePatrolCoordinator
from .panel import async_setup_panel

_LOGGER = logging.getLogger(__name__)

type JuicePatrolConfigEntry = ConfigEntry

SERVICE_FORCE_REFRESH = "force_refresh"
SERVICE_MARK_REPLACED = "mark_replaced"
SERVICE_SET_DEVICE_THRESHOLD = "set_device_threshold"
SERVICE_IGNORE_DEVICE = "ignore_device"
SERVICE_UNIGNORE_DEVICE = "unignore_device"


def _get_coordinator(hass: HomeAssistant) -> JuicePatrolCoordinator | None:
    """Get the single coordinator instance, or None if not set up."""
    coordinators = hass.data.get(DOMAIN, {})
    if not coordinators:
        return None
    return next(iter(coordinators.values()))


async def async_setup_entry(hass: HomeAssistant, entry: JuicePatrolConfigEntry) -> bool:
    """Set up Juice Patrol from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    coordinator = JuicePatrolCoordinator(hass, entry)
    try:
        await coordinator.async_setup()
        await coordinator.async_config_entry_first_refresh()
    except Exception:
        await coordinator.async_shutdown()
        raise

    hass.data[DOMAIN][entry.entry_id] = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Register services, panel, and WS API (only once)
    if not hass.services.has_service(DOMAIN, SERVICE_FORCE_REFRESH):
        _register_services(hass)
        await async_setup_panel(hass)
        for ws_handler in (
            ws_get_settings,
            ws_update_settings,
            ws_set_battery_type,
            ws_set_rechargeable,
            ws_confirm_replacement,
            ws_mark_replaced,
            ws_detect_battery_type,
            ws_refresh,
            ws_get_shopping_list,
        ):
            websocket_api.async_register_command(hass, ws_handler)

    # Refresh coordinator when options change (e.g. from panel settings)
    entry.async_on_unload(
        entry.add_update_listener(_async_options_updated)
    )

    _LOGGER.info("Juice Patrol setup complete")
    return True


async def _async_options_updated(
    hass: HomeAssistant, entry: JuicePatrolConfigEntry
) -> None:
    """Handle options update."""
    coordinator: JuicePatrolCoordinator = hass.data[DOMAIN].get(entry.entry_id)
    if coordinator:
        await coordinator.async_request_refresh()


def _register_services(hass: HomeAssistant) -> None:
    """Register Juice Patrol services."""

    async def handle_force_refresh(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass)
        if coordinator:
            await coordinator.async_request_refresh()

    async def handle_mark_replaced(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass)
        if not coordinator:
            return
        entity_id = call.data["entity_id"]
        if entity_id not in coordinator.discovered:
            _LOGGER.warning("Entity %s is not a monitored battery", entity_id)
            return
        if coordinator.store.mark_replaced(entity_id):
            coordinator._history_cache.invalidate(entity_id)
            await coordinator.async_request_refresh()

    async def handle_set_device_threshold(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass)
        if not coordinator:
            return
        entity_id = call.data["entity_id"]
        threshold = call.data["threshold"]
        if entity_id not in coordinator.discovered:
            _LOGGER.warning("Entity %s is not a monitored battery", entity_id)
            return
        if coordinator.store.set_device_threshold(entity_id, threshold):
            await coordinator.async_request_refresh()
        else:
            _LOGGER.warning("Entity %s not found in store", entity_id)

    async def handle_ignore_device(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass)
        if not coordinator:
            return
        entity_id = call.data["entity_id"]
        if entity_id not in coordinator.discovered:
            _LOGGER.warning("Entity %s is not a monitored battery", entity_id)
            return
        coordinator.store.set_ignored(entity_id, True)
        await coordinator.async_request_refresh()

    async def handle_unignore_device(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass)
        if not coordinator:
            return
        entity_id = call.data["entity_id"]
        coordinator.store.set_ignored(entity_id, False)
        await coordinator.async_request_refresh()

    entity_schema = vol.Schema({vol.Required("entity_id"): cv.entity_id})

    hass.services.async_register(
        DOMAIN, SERVICE_FORCE_REFRESH, handle_force_refresh
    )
    hass.services.async_register(
        DOMAIN, SERVICE_MARK_REPLACED, handle_mark_replaced, schema=entity_schema
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_DEVICE_THRESHOLD,
        handle_set_device_threshold,
        schema=vol.Schema(
            {
                vol.Required("entity_id"): cv.entity_id,
                vol.Required("threshold"): vol.All(int, vol.Range(min=1, max=99)),
            }
        ),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_IGNORE_DEVICE, handle_ignore_device, schema=entity_schema
    )
    hass.services.async_register(
        DOMAIN, SERVICE_UNIGNORE_DEVICE, handle_unignore_device, schema=entity_schema
    )


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "juice_patrol/get_settings"}
)
@websocket_api.async_response
async def ws_get_settings(hass, connection, msg):
    """Return current Juice Patrol settings."""
    coordinators = hass.data.get(DOMAIN, {})
    if not coordinators:
        connection.send_error(msg["id"], "not_found", "Juice Patrol not set up")
        return
    entry_id = next(iter(coordinators))
    entry = hass.config_entries.async_get_entry(entry_id)
    connection.send_result(msg["id"], {
        "entry_id": entry_id,
        CONF_LOW_THRESHOLD: entry.options.get(CONF_LOW_THRESHOLD, DEFAULT_LOW_THRESHOLD),
        CONF_STALE_TIMEOUT: entry.options.get(CONF_STALE_TIMEOUT, DEFAULT_STALE_TIMEOUT),
        CONF_PREDICTION_HORIZON: entry.options.get(
            CONF_PREDICTION_HORIZON, DEFAULT_PREDICTION_HORIZON
        ),
    })


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/update_settings",
        vol.Optional(CONF_LOW_THRESHOLD): vol.All(int, vol.Range(min=1, max=99)),
        vol.Optional(CONF_STALE_TIMEOUT): vol.All(int, vol.Range(min=1, max=720)),
        vol.Optional(CONF_PREDICTION_HORIZON): vol.All(int, vol.Range(min=1, max=90)),
    }
)
@websocket_api.async_response
async def ws_update_settings(hass, connection, msg):
    """Update Juice Patrol settings."""
    coordinators = hass.data.get(DOMAIN, {})
    if not coordinators:
        connection.send_error(msg["id"], "not_found", "Juice Patrol not set up")
        return
    entry_id = next(iter(coordinators))
    entry = hass.config_entries.async_get_entry(entry_id)

    new_options = dict(entry.options)
    for key in (CONF_LOW_THRESHOLD, CONF_STALE_TIMEOUT, CONF_PREDICTION_HORIZON):
        if key in msg:
            new_options[key] = msg[key]

    hass.config_entries.async_update_entry(entry, options=new_options)
    connection.send_result(msg["id"], new_options)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/set_battery_type",
        vol.Required("entity_id"): cv.entity_id,
        vol.Optional("battery_type"): vol.Any(str, None),
    }
)
@websocket_api.async_response
async def ws_set_battery_type(hass, connection, msg):
    """Set battery type for a device."""
    coordinator = _get_coordinator(hass)
    if not coordinator:
        connection.send_error(msg["id"], "not_found", "Juice Patrol not set up")
        return
    entity_id = msg["entity_id"]
    battery_type = msg.get("battery_type")
    if coordinator.store.set_battery_type(entity_id, battery_type):
        coordinator.type_resolver.invalidate_cache(entity_id)
        await coordinator.async_request_refresh()
        connection.send_result(msg["id"], {"ok": True})
    else:
        connection.send_error(msg["id"], "not_found", f"Entity {entity_id} not in store")


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/set_rechargeable",
        vol.Required("entity_id"): cv.entity_id,
        vol.Optional("is_rechargeable"): vol.Any(bool, None),
    }
)
@websocket_api.async_response
async def ws_set_rechargeable(hass, connection, msg):
    """Set rechargeable flag for a device. None = auto-detect."""
    coordinator = _get_coordinator(hass)
    if not coordinator:
        connection.send_error(msg["id"], "not_found", "Juice Patrol not set up")
        return
    entity_id = msg["entity_id"]
    value = msg.get("is_rechargeable")
    if coordinator.store.set_rechargeable(entity_id, value):
        await coordinator.async_request_refresh()
        connection.send_result(msg["id"], {"ok": True})
    else:
        connection.send_error(msg["id"], "not_found", f"Entity {entity_id} not in store")


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/confirm_replacement",
        vol.Required("entity_id"): cv.entity_id,
    }
)
@websocket_api.async_response
async def ws_confirm_replacement(hass, connection, msg):
    """Confirm a detected battery replacement."""
    coordinator = _get_coordinator(hass)
    if not coordinator:
        connection.send_error(msg["id"], "not_found", "Juice Patrol not set up")
        return
    entity_id = msg["entity_id"]
    if coordinator.store.set_replacement_confirmed(entity_id, True):
        await coordinator.async_request_refresh()
        connection.send_result(msg["id"], {"ok": True})
    else:
        connection.send_error(msg["id"], "not_found", f"Entity {entity_id} not in store")


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/mark_replaced",
        vol.Required("entity_id"): cv.entity_id,
    }
)
@websocket_api.async_response
async def ws_mark_replaced(hass, connection, msg):
    """Manually mark a battery as replaced."""
    coordinator = _get_coordinator(hass)
    if not coordinator:
        connection.send_error(msg["id"], "not_found", "Juice Patrol not set up")
        return
    entity_id = msg["entity_id"]
    if coordinator.store.mark_replaced(entity_id):
        coordinator._history_cache.invalidate(entity_id)
        await coordinator.async_request_refresh()
        connection.send_result(msg["id"], {"ok": True})
    else:
        connection.send_error(msg["id"], "not_found", f"Entity {entity_id} not in store")


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/detect_battery_type",
        vol.Required("entity_id"): cv.entity_id,
    }
)
@websocket_api.async_response
async def ws_detect_battery_type(hass, connection, msg):
    """Auto-detect battery type for a device (ignoring manual override)."""
    coordinator = _get_coordinator(hass)
    if not coordinator:
        connection.send_error(msg["id"], "not_found", "Juice Patrol not set up")
        return
    entity_id = msg["entity_id"]
    battery = coordinator.discovered.get(entity_id)
    if not battery:
        connection.send_error(msg["id"], "not_found", f"Entity {entity_id} not discovered")
        return
    # Resolve without cache to get fresh auto-detected result
    battery_type, source = coordinator.type_resolver._resolve_uncached(
        entity_id, battery.device_id
    )
    connection.send_result(msg["id"], {
        "battery_type": battery_type,
        "source": source,
    })


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "juice_patrol/refresh"}
)
@websocket_api.async_response
async def ws_refresh(hass, connection, msg):
    """Force refresh with cache invalidation."""
    coordinator = _get_coordinator(hass)
    if not coordinator:
        connection.send_error(msg["id"], "not_found", "Juice Patrol not set up")
        return
    await coordinator.async_manual_refresh()
    connection.send_result(msg["id"], {"ok": True})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "juice_patrol/get_shopping_list"}
)
@websocket_api.async_response
async def ws_get_shopping_list(hass, connection, msg):
    """Get battery shopping list grouped by base battery type."""
    import re

    coordinator = _get_coordinator(hass)
    if not coordinator:
        connection.send_error(msg["id"], "not_found", "Juice Patrol not set up")
        return

    data = coordinator.data or {}
    horizon = coordinator.prediction_horizon_days

    def _parse_battery_type(raw: str) -> tuple[str, int]:
        """Parse '2× AAA' into ('AAA', 2), 'CR2032' into ('CR2032', 1)."""
        m = re.match(r"^(\d+)\s*[×x]\s*(.+)$", raw, re.IGNORECASE)
        if m:
            return m.group(2).strip(), int(m.group(1))
        return raw.strip(), 1

    # Group by base battery type
    groups_map: dict[str, list[dict]] = {}
    for entity_id, info in data.items():
        raw_type = info.get("battery_type") or "Unknown"
        base_type, battery_count = _parse_battery_type(raw_type)
        device_entry = {
            "entity_id": entity_id,
            "device_name": info.get("device_name") or entity_id,
            "level": info.get("level"),
            "days_remaining": (
                info["prediction"].estimated_days_remaining
                if info.get("prediction")
                else None
            ),
            "is_low": info.get("is_low", False),
            "battery_count": battery_count,
        }
        groups_map.setdefault(base_type, []).append(device_entry)

    groups = []
    total_needed = 0
    for battery_type, devices in sorted(groups_map.items(), key=lambda x: (x[0] == "Unknown", x[0])):
        # Total batteries in this group (sum of per-device counts)
        total_batteries = sum(d["battery_count"] for d in devices)
        needs_replacement = sum(
            d["battery_count"] for d in devices
            if d["is_low"] or (
                d["days_remaining"] is not None
                and d["days_remaining"] <= horizon
            )
        )
        total_needed += needs_replacement
        groups.append({
            "battery_type": battery_type,
            "device_count": len(devices),
            "battery_count": total_batteries,
            "needs_replacement": needs_replacement,
            "devices": sorted(devices, key=lambda d: d.get("days_remaining") or 9999),
        })

    connection.send_result(msg["id"], {
        "groups": groups,
        "total_needed": total_needed,
    })


async def async_unload_entry(
    hass: HomeAssistant, entry: JuicePatrolConfigEntry
) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

    if unload_ok:
        coordinator: JuicePatrolCoordinator = hass.data[DOMAIN].pop(
            entry.entry_id, None
        )
        if coordinator:
            await coordinator.async_shutdown()

        # Remove services if no more entries
        if not hass.data.get(DOMAIN):
            for service in (
                SERVICE_FORCE_REFRESH,
                SERVICE_MARK_REPLACED,
                SERVICE_SET_DEVICE_THRESHOLD,
                SERVICE_IGNORE_DEVICE,
                SERVICE_UNIGNORE_DEVICE,
            ):
                hass.services.async_remove(DOMAIN, service)

    return unload_ok
