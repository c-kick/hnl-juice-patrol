# Juice Patrol

[![HACS Validation](https://github.com/c-kick/juice-patrol/actions/workflows/validate.yml/badge.svg)](https://github.com/c-kick/juice-patrol/actions/workflows/validate.yml)
[![Hassfest](https://github.com/c-kick/juice-patrol/actions/workflows/hassfest.yml/badge.svg)](https://github.com/c-kick/juice-patrol/actions/workflows/hassfest.yml)

**Predictive Battery Monitoring for Home Assistant**

> **Warning:** This project is in early alpha. Expect breaking changes, incomplete features, and rough edges. Use at your own risk.

Juice Patrol auto-discovers all battery-powered devices, tracks their discharge curves over time, predicts when batteries will die, and fires events for notifications — all without manual per-device configuration.

## Features

- **Auto-discovery** — finds every entity/device with a battery
- **Discharge tracking** — persistent storage of battery readings over time
- **Prediction** — estimated time-to-empty per device using weighted regression
- **Alerts** — configurable threshold and prediction-based events
- **Per-device sensors** — battery level, discharge rate, predicted empty date, days remaining
- **Summary sensors** — lowest battery, attention needed
- **Battery replacement detection** — segments discharge curves on replacement
- **Stale device detection** — flags devices that stop reporting

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
- **Max readings** — maximum stored readings per device (FIFO eviction)
- **Prediction horizon** — days ahead to alert on predicted low battery

## Events

Juice Patrol fires events that you can use in automations:

| Event | Description |
|---|---|
| `juice_patrol_battery_low` | Device dropped below threshold |
| `juice_patrol_battery_predicted_low` | Device predicted to hit threshold within horizon |
| `juice_patrol_device_stale` | Device stopped reporting |
| `juice_patrol_device_replaced` | Battery replacement detected |

## License

MIT
