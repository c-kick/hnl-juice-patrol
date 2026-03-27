# Juice Patrol
**Battery Monitoring for Home Assistant**

> **Warning:** This project is in early alpha. Expect breaking changes, incomplete features, and rough edges. Use at your own risk.

Juice Patrol auto-discovers all battery-powered devices in Home Assistant, tracks their discharge history, and provides a dedicated panel for monitoring and managing batteries across your home — without any manual per-device configuration.

## Features

- **Auto-discovery** — finds every entity with a battery sensor, no configuration needed
- **Discharge history** — reads from HA recorder statistics; full history available immediately
- **Discharge extrapolation** — projects time-to-empty in real time using chemistry-specific discharge curves (alkaline, lithium primary, Li-Ion, NiMH), computed directly in the browser with no backend overhead
- **Alerts** — fires HA events when a device drops below threshold or stops reporting
- **Per-device sensors** — battery level mirrored as a JP sensor with device metadata attached
- **Summary sensor** — tracks the device with the lowest battery across your installation
- **Battery type identification** — auto-detected from device attributes, Battery Notes integration, or set manually
- **Rechargeable device support** — mark devices as rechargeable; handled separately from primary cells
- **Battery replacement history** — manually record replacements; undo support
- **Stale device detection** — flags devices that stop reporting for a configurable period
- **Shopping list** — tracks which batteries need replacing
- **Custom panel** — full-featured dashboard with device table, detail view with history chart, and shopping list

## The Panel

Juice Patrol adds a sidebar panel with three views:

- **Dashboard** — sortable table of all monitored devices with battery level, type, and status badges
- **Detail view** — per-device history chart with LTTB-decimated discharge curve and a chemistry-informed projection to 0%
- **Shopping list** — devices that need new batteries

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Click the three dots menu → Custom repositories
3. Add `https://github.com/c-kick/juice-patrol` with category **Integration**
4. Search for "Juice Patrol" and install
5. Restart Home Assistant
6. Go to Settings → Integrations → Add Integration → Juice Patrol

### Manual

1. Copy `custom_components/juice_patrol/` to your HA `custom_components/` directory
2. Restart Home Assistant
3. Go to Settings → Integrations → Add Integration → Juice Patrol

## Configuration

On first setup, you set a global low battery threshold (default: 20%).

Additional settings are available in the integration's options:
- **Low battery threshold** — percentage below which a device is flagged
- **Stale timeout** — hours without a reading before a device is flagged as stale

## Events

Juice Patrol fires events you can use in automations:

| Event | Description |
|---|---|
| `juice_patrol_battery_low` | Device dropped below threshold |
| `juice_patrol_device_stale` | Device stopped reporting |

## License

MIT
