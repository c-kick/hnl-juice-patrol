# Juice Patrol — Predictive Battery Monitoring for Home Assistant

## Project Overview

**Juice Patrol** (`juice_patrol`) is a custom Home Assistant integration that auto-discovers all battery-powered devices, tracks their discharge curves over time, predicts when batteries will die, and dispatches notifications — all without manual per-device configuration.

**Repository slug:** `juice_patrol`
**Integration domain:** `juice_patrol`
**Target distribution:** HACS custom repository → eventually HACS default → eventually official HA integration

### The Problem

- HA has no unified battery monitoring with prediction
- Devices die silently because batteries run out unnoticed
- Setting up per-device notification automations is tedious
- Predicting "time to empty" is near impossible for average users
- Existing solutions (Battery Notes, battery-state-card) handle metadata and display, not prediction

### What Juice Patrol Does

1. **Auto-discovers** every entity/device with a battery
2. **Tracks** discharge history with persistent storage
3. **Predicts** estimated time-to-empty per device using regression on discharge data
4. **Alerts** via configurable thresholds and notification targets
5. **Exposes** per-device sensors (level, predicted empty date, discharge rate, health) + summary sensor
6. **Detects** battery replacements, stale/dead devices, and anomalous readings

### Competitive Landscape

| Existing Project | What it does | What it lacks |
|---|---|---|
| Battery Notes | Battery type metadata, low threshold events, community device library | No prediction, no discharge tracking |
| battery-state-card | Lovelace card showing battery levels | Display only, no backend logic |
| Batpred | Home solar/storage battery prediction | Completely different domain (inverters, not device batteries) |
| DIY template sensors | Per-device statistics + template math | Manual setup per device, no persistence, no replacement detection |

**Juice Patrol fills the gap:** prediction + auto-discovery + notifications as a single installable integration.

---

## Architecture

### Component Structure

```
custom_components/juice_patrol/
│
│   # ── HA-required root files (must stay here) ──
├── __init__.py              # Integration setup, services, WS API, platform forwarding
├── manifest.json            # Integration metadata, dependencies
├── config_flow.py           # UI-based configuration (Settings → Integrations)
├── const.py                 # Constants, defaults, thresholds
├── entity.py                # Base entity class, slugify helper, device info
├── sensor.py                # Per-device sensors: level, predicted_empty, discharge_rate
├── binary_sensor.py         # Per-device binary sensors: battery_low, stale_device
├── panel.py                 # Sidebar panel registration (static JS file)
├── diagnostics.py           # Diagnostics dump for debugging
├── services.yaml            # Service definitions (force_refresh, mark_replaced, etc.)
├── strings.json             # UI strings (English)
├── icons.json               # MDI icon mappings
├── hacs.json                # HACS metadata (category: integration)
├── translations/
│   ├── en.json              # English translations
│   └── nl.json              # Dutch translations
│
│   # ── Prediction & analysis engine (pure Python, no HA deps) ──
├── engine/
│   ├── __init__.py          # Re-exports public API
│   ├── predictions.py       # Theil-Sen, WLR, confidence, reliability
│   ├── analysis.py          # Stability, anomaly, rechargeable detection
│   └── utils.py             # Shared helpers (detect_step_size, median)
│
│   # ── Data layer ──
├── data/
│   ├── __init__.py          # Re-exports public API
│   ├── coordinator.py       # DataUpdateCoordinator (event-driven + periodic)
│   ├── store.py             # Persistent JSON storage (device metadata only)
│   ├── history.py           # Recorder bridge (fetches battery stats, in-memory cache)
│   └── battery_types.py     # Battery type auto-detection (attributes + Battery Notes library)
│
│   # ── Device discovery ──
├── discovery/
│   ├── __init__.py          # Re-exports public API
│   └── discovery.py         # Battery entity discovery (2-pass: device_class + attributes)
│
│   # ── Frontend assets ──
└── frontend/
    └── juice_patrol_panel.js  # Panel UI (vanilla HTMLElement, full dashboard)
```

### Data Flow

```
Discovery Engine
    │
    ▼
State Listener (event bus: state_changed)
    │
    ▼
Coordinator (periodic + event-driven)
    │
    ├──▶ Store (JSON persistence in .storage/juice_patrol.history)
    │
    ├──▶ Prediction Engine (regression on discharge curves)
    │
    └──▶ Sensor Platform (exposes entities to HA)
            │
            └──▶ Notification Dispatcher (threshold checks → events/actions)
```

### Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Data persistence | Recorder (primary) + `.storage/` JSON (metadata only) | Instant predictions from historical data on first install; store v2 holds only device metadata (battery type, thresholds, replacement timestamps) |
| Discovery scope | `device_class: battery` sensors AND device attributes (`battery_level`, `battery_state`) | Wide net — ZHA, Z2M, and other integrations expose battery differently |
| Prediction model | Weighted linear regression (recent readings weighted higher) | Balances simplicity with accuracy for non-uniform reporting intervals. Phase 2: piecewise model for Li-ion cliff behavior |
| Update strategy | Event-driven (`state_changed`) + periodic coordinator scan (hourly) | Minimizes polling while catching devices that report infrequently |
| Config flow | Minimal initial setup (enable + global threshold), per-device overrides via options flow | Low barrier to entry, power users can tune per device |
| Notification method | Fire HA events (`juice_patrol_battery_low`, `juice_patrol_battery_predicted_low`, `juice_patrol_device_stale`) | User wires up their own automations/notifications via event triggers — maximum flexibility, no opinionated notify service dependency |

---

## Implementation Phases

### Phase 1: Foundation — Discovery + Storage + Basic Sensors

**Goal:** Install integration, auto-discover all batteries, show them as sensors.

#### 1.1 Scaffold
- [ ] `manifest.json` with correct metadata (version, dependencies, iot_class: `local_push`)
- [ ] `const.py` with domain, default scan interval, default thresholds
- [ ] `config_flow.py` — minimal: just enable, set global low threshold (default: 20%)
- [ ] `__init__.py` — setup entry, forward to sensor + binary_sensor platforms
- [ ] `strings.json` + `translations/en.json`

#### 1.2 Discovery Engine (`discovery.py`)
- [ ] Scan entity registry for entities with `device_class: battery` (all domains)
- [ ] Scan device registry for devices with battery-related entities
- [ ] Also check entity attributes for `battery_level`, `battery_state` keys (for integrations that don't use device_class)
- [ ] Return normalized list: `{entity_id, device_id, device_name, current_level, last_updated, source_type}`
- [ ] `source_type` enum: `device_class_sensor | attribute_battery_level | attribute_battery_state`
- [ ] Exclude entities explicitly marked as ignored (user config)
- [ ] Handle entities that report battery as string ("Normal"/"Low") — map to estimated % or binary

#### 1.3 Persistent Store (`store.py`)
- [ ] Use `homeassistant.helpers.storage.Store` (async JSON in `.storage/juice_patrol.history`)
- [ ] Schema: `{version: int, devices: {entity_id: {readings: [{timestamp, level}], last_replaced: timestamp|null, metadata: {}}}}`
- [ ] Max readings per device: configurable, default 500 (at 1 reading/6hrs that's ~4 months)
- [ ] FIFO eviction when max reached
- [ ] Battery replacement detection: if level jumps from ≤ threshold to ≥ 80%, segment the curve — store `last_replaced` timestamp, start fresh reading series
- [ ] Debounce: don't store duplicate consecutive readings (same level within 1hr window)
- [ ] Migration support: version field for future schema changes

#### 1.4 Coordinator (`coordinator.py`)
- [ ] Extend `DataUpdateCoordinator`
- [ ] On setup: run discovery, load store, subscribe to `state_changed` events for discovered entities
- [ ] On `state_changed`: validate reading, append to store, trigger prediction update
- [ ] Periodic full scan (hourly): re-run discovery (catches newly added devices), check for stale devices
- [ ] Stale detection: if entity hasn't reported in > configurable duration (default: 48h), flag it

#### 1.5 Sensor Platform (`sensor.py`)
- [ ] Per discovered device, create sensors:
  - `sensor.juice_patrol_{device}_battery_level` — mirror of source (for consistent naming + dashboard grouping)
  - `sensor.juice_patrol_{device}_discharge_rate` — %/day average over last 7 days
- [ ] Summary sensor: `sensor.juice_patrol_lowest_battery` — entity with lowest level + attributes listing all devices sorted by level

#### 1.6 Binary Sensor Platform (`binary_sensor.py`)
- [ ] Per device: `binary_sensor.juice_patrol_{device}_battery_low` — on when below threshold
- [ ] Per device: `binary_sensor.juice_patrol_{device}_stale` — on when no reading received beyond stale timeout
- [ ] Summary: `binary_sensor.juice_patrol_attention_needed` — on when ANY device is low or stale

### Phase 2: Prediction Engine

**Goal:** Estimate when each battery will hit the low threshold.

#### 2.1 Prediction Math (`predictions.py`)
- [ ] Input: array of `{timestamp, level}` readings for a single device
- [ ] Minimum data requirement: at least 3 readings spanning ≥ 24h before making predictions
- [ ] Weighted linear regression: more recent readings get higher weight (exponential decay)
- [ ] Calculate: slope (%/day), intercept, R² confidence score
- [ ] Predict: `estimated_empty_date` = date when extrapolated level hits low threshold
- [ ] Predict: `estimated_days_remaining` = days from now to estimated_empty_date
- [ ] Confidence classification: `high` (R² > 0.8 + >7 days of data), `medium` (R² > 0.5 or >3 days), `low` (insufficient data)
- [ ] Edge cases:
  - Positive slope (charging/increasing) → return `null` prediction, flag as "charging or erratic"
  - Flat slope (< 0.01%/day) → return "years" estimate, flag as "extremely low drain"
  - Recent replacement detected → only use post-replacement data
  - Wild outliers → IQR-based outlier rejection before regression

#### 2.2 Additional Sensors
- [ ] `sensor.juice_patrol_{device}_predicted_empty` — datetime sensor: estimated date battery hits threshold
- [ ] `sensor.juice_patrol_{device}_days_remaining` — numeric sensor: days until threshold
- [ ] Attributes on prediction sensors: `confidence`, `discharge_rate_per_day`, `data_points_used`, `r_squared`

### Phase 3: Notifications & Events

**Goal:** Alert users proactively.

#### 3.1 Event System
- [ ] Fire `juice_patrol_battery_low` event when device drops below threshold
  - Event data: `{entity_id, device_name, level, threshold}`
  - Only fire once per threshold crossing (track in coordinator state)
  - Reset when level goes back above threshold (battery replaced)
- [ ] Fire `juice_patrol_battery_predicted_low` event when predicted_empty is within configurable horizon (default: 7 days)
  - Event data: `{entity_id, device_name, level, predicted_empty, days_remaining, confidence}`
  - Fire once per prediction horizon entry (don't spam daily)
- [ ] Fire `juice_patrol_device_stale` event when device stops reporting
  - Event data: `{entity_id, device_name, last_seen, stale_hours}`
- [ ] Fire `juice_patrol_device_replaced` event on replacement detection
  - Event data: `{entity_id, device_name, old_level, new_level, previous_lifetime_days}`

#### 3.2 Services
- [ ] `juice_patrol.force_refresh` — trigger immediate full discovery + prediction update
- [ ] `juice_patrol.mark_replaced` — manually mark a battery as replaced (resets curve)
- [ ] `juice_patrol.set_device_threshold` — override threshold for specific device
- [ ] `juice_patrol.ignore_device` — exclude a device from monitoring
- [ ] `juice_patrol.unignore_device` — re-include a previously ignored device

### Phase 4: Options Flow & Polish

**Goal:** Per-device configuration, UX refinement.

#### 4.1 Options Flow (`config_flow.py`)
- [ ] Global settings: low threshold, stale timeout, prediction horizon, max stored readings
- [ ] Per-device overrides: custom threshold, custom stale timeout, ignore toggle
- [ ] Notification settings: which event types to fire

#### 4.2 Diagnostics (`diagnostics.py`)
- [ ] Dump: discovered devices count, per-device reading counts, prediction confidence summary, store size
- [ ] Redact entity names if requested

#### 4.3 Quality
- [ ] Unit tests: discovery logic, prediction math (especially edge cases), store operations, replacement detection
- [ ] Type hints throughout
- [ ] Strict `pyright` / `mypy` compliance
- [ ] `hacs.json` for HACS repository metadata
- [ ] README.md with installation, configuration, and usage docs
- [ ] HACS validation (hassfest + hacs/action)

### Phase 5 (Future): Advanced Prediction & Dashboard Card

- Piecewise regression for Li-ion cliff behavior (separate model for >40% and <40%)
- Per-device learned discharge profiles (compare devices of same model)
- Optional companion Lovelace card showing all devices with predicted timeline visualization
- Integration with Battery Notes (read battery type metadata if both installed)
- Seasonal adjustment (temperature-correlated discharge for outdoor sensors)

---

## Technical Notes

### Entity Naming Convention

```
sensor.juice_patrol_{device_slug}_battery_level
sensor.juice_patrol_{device_slug}_discharge_rate
sensor.juice_patrol_{device_slug}_predicted_empty
sensor.juice_patrol_{device_slug}_days_remaining
binary_sensor.juice_patrol_{device_slug}_battery_low
binary_sensor.juice_patrol_{device_slug}_stale
```

`device_slug` derived from device name via `slugify()`, deduplicated with suffix if needed.

### Store Schema (v1)

```json
{
  "version": 1,
  "devices": {
    "sensor.living_room_motion_battery": {
      "readings": [
        {"t": 1710000000, "v": 97},
        {"t": 1710021600, "v": 96}
      ],
      "last_replaced": null,
      "ignored": false,
      "custom_threshold": null,
      "source_entity": "sensor.living_room_motion_battery",
      "device_id": "abc123def456"
    }
  }
}
```

Compact keys (`t`, `v`) to minimize storage size with hundreds of devices over months.

### Minimum HA Version

Target: **Home Assistant 2024.1.0+** (for current `DataUpdateCoordinator` API, `Store` v2, config flow patterns)

### Dependencies

No external PyPI packages required. Pure HA APIs:
- `homeassistant.helpers.storage.Store`
- `homeassistant.helpers.update_coordinator.DataUpdateCoordinator`
- `homeassistant.helpers.entity_registry`
- `homeassistant.helpers.device_registry`
- `homeassistant.helpers.event.async_track_state_change_event`
- Standard library `statistics` for regression (or minimal numpy-free implementation)

### Prediction: Weighted Linear Regression (No NumPy)

```python
def weighted_linear_regression(
    times: list[float],      # unix timestamps
    values: list[float],     # battery percentages
    half_life_days: float = 14.0
) -> tuple[float, float, float]:
    """Returns (slope_per_day, intercept, r_squared)."""
    # Exponential decay weights: recent readings matter more
    # w_i = exp(-lambda * (t_max - t_i))
    # lambda = ln(2) / half_life
    ...
```

No numpy dependency — keep the integration lightweight and installable without compilation.

---

## Development Workflow

### Local Development Setup

```bash
# Clone into HA custom_components
cd /path/to/ha-config/custom_components/
git clone https://github.com/<user>/juice-patrol.git juice_patrol

# Or symlink for development
ln -s /path/to/juice-patrol/custom_components/juice_patrol ./juice_patrol
```

### Testing

```bash
# Run tests
pytest tests/ -v

# Type checking
mypy custom_components/juice_patrol/

# HACS validation
docker run --rm -v $(pwd):/github/workspace ghcr.io/hacs/action:main
```

### Commit Convention

Use conventional commits:
- `feat:` new functionality
- `fix:` bug fixes
- `refactor:` restructuring without behavior change
- `test:` adding/updating tests
- `docs:` documentation changes

---

## Build Order (Recommended)

Start with the scaffold and work outward:

1. **Scaffold** — manifest, const, minimal config_flow, __init__
2. **Discovery** — get the entity list working, log what we find
3. **Store** — persistence layer, test read/write/eviction
4. **Coordinator** — wire discovery + store + event listener
5. **Sensors** — expose level + discharge rate
6. **Prediction** — the math, exposed as additional sensors
7. **Events** — threshold crossing + stale detection events
8. **Services** — force_refresh, mark_replaced, ignore
9. **Options flow** — per-device config
10. **Tests + docs + HACS packaging**

---

## Future Work / TODO

### Recharge List
The shopping list currently excludes rechargeable devices. A complementary "Recharge" tab or section could show rechargeable devices that are low or predicted to need charging soon — useful for devices like portable sensors, phones, tablets. Unlike the shopping list, these don't need to be purchased, just plugged in.

### Battery Health & Deterioration Detection
Detect deteriorating batteries — especially rechargeable ones that lose capacity over time. Inspired by Apple's battery health feature which calculates chemical aging (see: https://support.apple.com/en-us/101575). Implementation ideas:
- Track maximum charge level over time (if a phone used to charge to 100% but now only reaches 92%, that's degradation)
- For rechargeable devices: compute charge cycle counts, compare discharge curves across cycles
- Long-term trend analysis: is the device draining faster than it used to for the same usage pattern?
- Surface as a "battery health" percentage (100% = new, declining over months)
- Fire events when health drops below configurable thresholds

### Text-Based Battery Level Support
Some devices report battery level as text strings ("normal", "low", "critical") instead of percentages. While basic string-to-percentage mapping exists, these entities need:
- Proper prediction handling (discrete levels, not continuous curves)
- Appropriate confidence/reliability scoring for low-resolution data
- Clear UI indication that predictions are based on coarse data

### Entity ↔ Juice Patrol Navigation
When clicking a device row in the panel, it opens the source battery entity's more-info dialog. There's currently no way to navigate the other direction — from a battery entity back to its Juice Patrol data. Ideas:
- Add a "View in Juice Patrol" link/button to Juice Patrol sensor attributes or the more-info card
- Or: when the panel opens, accept a `?entity=sensor.xxx` query param that auto-scrolls/highlights that device
- Consider using HA's `hass-more-info` event with a Juice Patrol entity instead of the source entity, so users see discharge rate, predictions, and analysis directly

### Per-Entity Recalculate
Add a "Recalculate" option to the per-device action menu (⋮ dot menu) that invalidates the history cache for just that one entity and rebuilds its prediction, without refreshing all 47+ devices. This is useful for:
- Quick verification after marking a replacement
- Checking if a device's prediction improves after new data comes in
- Faster feedback loop than the global refresh button
Implementation: new WS command `juice_patrol/recalculate` with `entity_id` param → invalidates cache for that entity → rebuilds only that entity's data → returns updated prediction.

### Refresh Button UX
The refresh button (🔄) next to the cogwheel is unclear about what it does. Improve discoverability:
- Add a tooltip that explains: "Refresh all predictions — clears the recorder cache and re-fetches battery history for all devices"
- Consider showing a brief inline explanation on first use, or a subtitle under the button
- Distinguish from HA's native refresh (which reloads the page) — this only invalidates the Juice Patrol history cache and triggers a coordinator refresh
- Optionally show a small indicator while refresh is in progress (spinner or disabled state with "Refreshing..." text)

### Panel Toolbar (HA Native Pattern)
Replace the custom `.header` div inside `#jp-content` with a proper HA toolbar element. Follow the pattern used by HACS, Browser Mod, and native HA dashboards for consistent UX:
- Use `<app-toolbar>` or `<ha-top-app-bar-fixed>` as the native HA panels do
- Integrate settings, refresh, and navigation into the toolbar
- Ensure proper scroll behavior (sticky toolbar, scrollable content area)
