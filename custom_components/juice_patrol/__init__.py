"""Juice Patrol — Predictive Battery Monitoring for Home Assistant."""

from __future__ import annotations

import logging
import re

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import config_validation as cv, device_registry as dr
from homeassistant.helpers.typing import ConfigType

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
from .data import JuicePatrolCoordinator
from .panel import async_setup_panel

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

_LOGGER = logging.getLogger(__name__)

type JuicePatrolConfigEntry = ConfigEntry[JuicePatrolCoordinator]

SERVICE_FORCE_REFRESH = "force_refresh"
SERVICE_MARK_REPLACED = "mark_replaced"
SERVICE_SET_DEVICE_THRESHOLD = "set_device_threshold"
SERVICE_IGNORE_DEVICE = "ignore_device"
SERVICE_UNIGNORE_DEVICE = "unignore_device"


def _get_coordinator(hass: HomeAssistant) -> JuicePatrolCoordinator | None:
    """Get the single coordinator instance, or None if not loaded."""
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is ConfigEntryState.LOADED:
            return entry.runtime_data
    return None


def _require_coordinator(hass: HomeAssistant) -> JuicePatrolCoordinator:
    """Get the coordinator, raising ServiceValidationError if unavailable."""
    coordinator = _get_coordinator(hass)
    if coordinator is None:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="not_loaded",
        )
    return coordinator


def _require_monitored(
    coordinator: JuicePatrolCoordinator, entity_id: str
) -> None:
    """Validate that entity_id is a monitored battery, or raise."""
    if entity_id not in coordinator.discovered:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="entity_not_monitored",
            translation_placeholders={"entity_id": entity_id},
        )


def _ws_get_coordinator(
    hass: HomeAssistant, connection, msg_id: int
) -> JuicePatrolCoordinator | None:
    """Get coordinator for a WS handler, sending an error if unavailable."""
    coordinator = _get_coordinator(hass)
    if coordinator is None:
        connection.send_error(msg_id, "not_found", "Juice Patrol not set up")
    return coordinator


async def _do_mark_replaced(
    coordinator: JuicePatrolCoordinator, entity_id: str
) -> None:
    """Mark a battery as replaced — shared by service and WS handlers."""
    if not await coordinator.async_mark_replaced(entity_id):
        raise HomeAssistantError(
            translation_domain=DOMAIN,
            translation_key="entity_not_in_store",
            translation_placeholders={"entity_id": entity_id},
        )


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up Juice Patrol — register services, panel, and WS API."""
    _register_services(hass)
    await async_setup_panel(hass)
    for ws_handler in (
        ws_get_settings,
        ws_update_settings,
        ws_set_battery_type,
        ws_set_rechargeable,
        ws_set_chemistry_override,
        ws_confirm_replacement,
        ws_mark_replaced,
        ws_undo_replacement,
        ws_deny_replacement,
        ws_detect_battery_type,
        ws_refresh,
        ws_recalculate,
        ws_get_shopping_list,
        ws_get_dashboard_data,
        ws_get_entity_chart,
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

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    entry.async_on_unload(
        entry.add_update_listener(_async_options_updated)
    )

    _LOGGER.info("Juice Patrol setup complete")
    return True


async def _async_options_updated(
    hass: HomeAssistant, entry: JuicePatrolConfigEntry
) -> None:
    """Handle options update."""
    await entry.runtime_data.async_request_refresh()


def _register_services(hass: HomeAssistant) -> None:
    """Register Juice Patrol services."""

    async def handle_force_refresh(call: ServiceCall) -> None:
        coordinator = _require_coordinator(hass)
        await coordinator.async_request_refresh()

    async def handle_mark_replaced(call: ServiceCall) -> None:
        coordinator = _require_coordinator(hass)
        entity_id = call.data["entity_id"]
        _require_monitored(coordinator, entity_id)
        await _do_mark_replaced(coordinator, entity_id)

    async def handle_set_device_threshold(call: ServiceCall) -> None:
        coordinator = _require_coordinator(hass)
        entity_id = call.data["entity_id"]
        threshold = call.data["threshold"]
        _require_monitored(coordinator, entity_id)
        if not coordinator.store.set_device_threshold(entity_id, threshold):
            raise HomeAssistantError(
                translation_domain=DOMAIN,
                translation_key="entity_not_in_store",
                translation_placeholders={"entity_id": entity_id},
            )
        await coordinator.async_request_refresh()

    async def handle_ignore_device(call: ServiceCall) -> None:
        coordinator = _require_coordinator(hass)
        entity_id = call.data["entity_id"]
        coordinator.store.set_ignored(entity_id, True)
        await coordinator.async_request_refresh()

    async def handle_unignore_device(call: ServiceCall) -> None:
        coordinator = _require_coordinator(hass)
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


# ---------------------------------------------------------------------------
# WebSocket API handlers
# ---------------------------------------------------------------------------


@websocket_api.websocket_command(
    {vol.Required("type"): "juice_patrol/get_settings"}
)
@websocket_api.async_response
async def ws_get_settings(hass, connection, msg):
    """Return current Juice Patrol settings."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    entry = coordinator.config_entry
    connection.send_result(msg["id"], {
        "entry_id": entry.entry_id,
        CONF_LOW_THRESHOLD: entry.options.get(CONF_LOW_THRESHOLD, DEFAULT_LOW_THRESHOLD),
        CONF_STALE_TIMEOUT: entry.options.get(CONF_STALE_TIMEOUT, DEFAULT_STALE_TIMEOUT),
        CONF_PREDICTION_HORIZON: entry.options.get(
            CONF_PREDICTION_HORIZON, DEFAULT_PREDICTION_HORIZON
        ),
    })


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
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    entry = coordinator.config_entry

    new_options = dict(entry.options)
    for key in (CONF_LOW_THRESHOLD, CONF_STALE_TIMEOUT, CONF_PREDICTION_HORIZON):
        if key in msg:
            new_options[key] = msg[key]

    hass.config_entries.async_update_entry(entry, options=new_options)
    connection.send_result(msg["id"], new_options)


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
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    entity_id = msg["entity_id"]
    battery_type = msg.get("battery_type")
    if coordinator.store.set_battery_type(entity_id, battery_type):
        coordinator.type_resolver.invalidate_cache(entity_id)
        await coordinator.async_request_refresh()
        connection.send_result(msg["id"], {"ok": True})
    else:
        connection.send_error(msg["id"], "not_found", f"Entity {entity_id} not in store")


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
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    entity_id = msg["entity_id"]
    value = msg.get("is_rechargeable")
    if coordinator.store.set_rechargeable(entity_id, value):
        await coordinator.async_request_refresh()
        connection.send_result(msg["id"], {"ok": True})
    else:
        connection.send_error(msg["id"], "not_found", f"Entity {entity_id} not in store")


@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/set_chemistry_override",
        vol.Required("entity_id"): cv.entity_id,
        vol.Optional("chemistry"): vol.Any(str, None),
    }
)
@websocket_api.async_response
async def ws_set_chemistry_override(hass, connection, msg):
    """Set chemistry override for a device. None = use auto-detected."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    entity_id = msg["entity_id"]
    value = msg.get("chemistry")
    if coordinator.store.set_chemistry_override(entity_id, value):
        await coordinator.async_request_refresh()
        connection.send_result(msg["id"], {"ok": True})
    else:
        connection.send_error(msg["id"], "not_found", f"Entity {entity_id} not in store")


@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/confirm_replacement",
        vol.Required("entity_id"): cv.entity_id,
    }
)
@websocket_api.async_response
async def ws_confirm_replacement(hass, connection, msg):
    """Confirm a detected battery replacement."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    entity_id = msg["entity_id"]
    if coordinator.store.set_replacement_confirmed(entity_id, True):
        await coordinator.async_request_refresh()
        connection.send_result(msg["id"], {"ok": True})
    else:
        connection.send_error(msg["id"], "not_found", f"Entity {entity_id} not in store")


@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/mark_replaced",
        vol.Required("entity_id"): cv.entity_id,
        vol.Optional("timestamp"): vol.Coerce(float),
    }
)
@websocket_api.async_response
async def ws_mark_replaced(hass, connection, msg):
    """Manually mark a battery as replaced, optionally at a specific timestamp."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    entity_id = msg["entity_id"]
    timestamp = msg.get("timestamp")
    try:
        if timestamp is not None:
            if not await coordinator.async_mark_replaced_at(entity_id, timestamp):
                raise HomeAssistantError(
                    translation_domain=DOMAIN,
                    translation_key="entity_not_in_store",
                    translation_placeholders={"entity_id": entity_id},
                )
        else:
            await _do_mark_replaced(coordinator, entity_id)
        connection.send_result(msg["id"], {"ok": True})
    except HomeAssistantError:
        connection.send_error(msg["id"], "not_found", f"Entity {entity_id} not in store")


@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/undo_replacement",
        vol.Required("entity_id"): cv.entity_id,
        vol.Optional("timestamp"): vol.Coerce(float),
    }
)
@websocket_api.async_response
async def ws_undo_replacement(hass, connection, msg):
    """Undo a battery replacement. If timestamp given, remove that specific one; otherwise pop most recent."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    entity_id = msg["entity_id"]
    timestamp = msg.get("timestamp")
    if await coordinator.async_undo_replacement(entity_id, timestamp=timestamp):
        connection.send_result(msg["id"], {"ok": True})
    else:
        connection.send_error(
            msg["id"], "not_found", f"Entity {entity_id} not in store"
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/deny_replacement",
        vol.Required("entity_id"): cv.entity_id,
        vol.Required("timestamp"): vol.Coerce(float),
    }
)
@websocket_api.async_response
async def ws_deny_replacement(hass, connection, msg):
    """Deny a suspected historical replacement (won't be suggested again)."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    entity_id = msg["entity_id"]
    if await coordinator.async_deny_replacement(entity_id, msg["timestamp"]):
        connection.send_result(msg["id"], {"ok": True})
    else:
        connection.send_error(
            msg["id"], "not_found", f"Entity {entity_id} not in store"
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/detect_battery_type",
        vol.Required("entity_id"): cv.entity_id,
    }
)
@websocket_api.async_response
async def ws_detect_battery_type(hass, connection, msg):
    """Auto-detect battery type for a device (ignoring manual override)."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    entity_id = msg["entity_id"]
    try:
        battery_type, source = coordinator.detect_battery_type(entity_id)
    except KeyError:
        connection.send_error(msg["id"], "not_found", f"Entity {entity_id} not discovered")
        return
    connection.send_result(msg["id"], {
        "battery_type": battery_type,
        "source": source,
    })


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
        vol.Required("type"): "juice_patrol/recalculate",
        vol.Required("entity_id"): cv.entity_id,
    }
)
@websocket_api.async_response
async def ws_recalculate(hass, connection, msg):
    """Recalculate predictions for a single device (invalidates its cache)."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    entity_id = msg["entity_id"]
    if not await coordinator.async_recalculate_entity(entity_id):
        connection.send_error(
            msg["id"], "not_found", f"Entity {entity_id} not discovered"
        )
        return
    connection.send_result(msg["id"], {"ok": True})


@websocket_api.websocket_command(
    {vol.Required("type"): "juice_patrol/get_shopping_list"}
)
@websocket_api.async_response
async def ws_get_shopping_list(hass, connection, msg):
    """Get battery shopping list grouped by base battery type."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return

    data = coordinator.data or {}
    horizon = coordinator.prediction_horizon_days

    def _parse_battery_type(raw: str) -> tuple[str, int]:
        """Parse '2× AAA' into ('AAA', 2), 'CR2032' into ('CR2032', 1)."""
        m = re.match(r"^(\d+)\s*[×x]\s*(.+)$", raw, re.IGNORECASE)
        if m:
            return m.group(2).strip(), int(m.group(1))
        return raw.strip(), 1

    # Group by base battery type (exclude rechargeable devices — they don't need replacement)
    groups_map: dict[str, list[dict]] = {}
    for entity_id, info in data.items():
        if info.get("is_rechargeable"):
            continue
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


@websocket_api.websocket_command(
    {vol.Required("type"): "juice_patrol/get_dashboard_data"}
)
@websocket_api.async_response
async def ws_get_dashboard_data(hass, connection, msg):
    """Return replacement history and first-seen data for all devices."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return

    data = coordinator.data or {}
    replacement_data = {}
    for entity_id, info in data.items():
        history = info.get("replacement_history", [])
        # first_seen: earliest replacement timestamp, or last_reading_time as fallback
        first_seen = None
        if history:
            first_seen = min(history)
        if first_seen is None and info.get("last_reading_time"):
            first_seen = info["last_reading_time"]
        replacement_data[entity_id] = {
            "replacement_history": history,
            "first_seen": first_seen,
        }

    connection.send_result(msg["id"], {"replacement_data": replacement_data})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "juice_patrol/get_entity_chart",
        vol.Required("entity_id"): cv.entity_id,
    }
)
@websocket_api.async_response
async def ws_get_entity_chart(hass, connection, msg):
    """Return chart data (readings + prediction) for a single entity."""
    coordinator = _ws_get_coordinator(hass, connection, msg["id"])
    if not coordinator:
        return
    entity_id = msg["entity_id"]
    chart_data = await coordinator.async_get_entity_chart_data(entity_id)
    if chart_data is None:
        connection.send_error(
            msg["id"], "not_found", f"Entity {entity_id} not discovered"
        )
        return
    connection.send_result(msg["id"], chart_data)


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
        # The virtual summary device should not be removable
        if device_id_or_entity == "juice_patrol":
            return False
        # Check if any discovered entity still uses this identifier
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
