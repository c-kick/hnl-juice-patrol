# CLAUDE.md — Juice Patrol

Custom Home Assistant integration for predictive battery monitoring. See `PLAN.md` for architecture and `ideas.txt` for rough feature ideas.

**Quality target: Platinum** on the HA Integration Quality Scale.

## Hard Rules

- **NEVER build custom UI where an HA native component exists.** This has caused repeated rework. Research the HA frontend source BEFORE writing any `<div>` or `<button>` that looks like a standard UI pattern. Check: https://github.com/home-assistant/frontend/tree/dev/src/components and https://github.com/home-assistant/frontend/tree/dev/src/layouts. Cross-reference HACS (https://github.com/hacs/frontend) and Browser Mod for proven patterns. Verify in browser console: `customElements.get("ha-component-name")`.
- **No numpy, scipy, pandas** — must install without compilation on any HA instance (including RPi).
- **`engine/` has zero HA imports.** Pure Python math, testable without HA fixtures. Pass HA state as function parameters. When a constant is needed in both `const.py` and `engine/`, define it in both with a cross-reference comment.
- **Rechargeable = user's manual label only.** No auto-detection from battery_state, type strings, or heuristics — these caused false positives. Exception: initial discovery (when `is_rechargeable is None`) uses `battery_state` as a best-effort guess.
- **No direct notification calls** — fire events, let users build automations.
- **Never create releases without explicit user approval.** Repo is submitted to HACS default.

## Import Convention

Root files import from sub-packages via re-exports (`from .data import JuicePatrolCoordinator`). Modules within a sub-package use sibling imports (`from .store import ...`). Cross-package uses `..` (`from ..engine import ...`). Never reach into sub-package internals from root.

## Development Workflow

```bash
# Build panel (always run after changes, even Python-only — keeps dev mount in sync)
npm run build        # production (minified)
npm start            # watch mode

# Tests (activate venv first)
source .venv/bin/activate
python -m pytest tests/ -x -v

# Logs
docker logs homeassistant 2>&1 | grep juice_patrol | tail -30
```

**What needs a restart:**
- Python changes → `docker restart homeassistant`
- New WS commands → restart HA (registered once on setup, reload won't re-register)
- JS/CSS changes → browser hard-refresh only (Ctrl+Shift+R)

**Dev mount:** `~/hnl-juice-patrol/custom_components/juice_patrol` is bind-mounted read-only into the HA container via Portainer.

**Commit style:** conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`)

## Panel Gotchas (things that silently break)

### Entity Discovery — DO NOT CHANGE
The panel discovers entities by iterating ALL `hass.states`, checking for a `source_entity` attribute. It does NOT filter by `integration`. Never add an integration filter — the Python sensors don't set one and the entire devices view will silently break. Logic is in `_updateEntities()`.

### hass is NOT Reactive
HA sets `hass` on every state change for any entity. Making it a reactive Lit property would re-render hundreds of times/minute. A custom setter computes an entity hash and only triggers a Lit render when it changes. In detail view, `_processHassUpdate()` updates `_entityMap` silently without assigning `_entities` to prevent chart flashing.

### ha-data-table Shadow DOM Boundary
Column `template` functions render inside ha-data-table's shadow DOM, NOT our panel's. CSS classes from `static get styles()` do NOT work — use inline `style` strings. HA CSS custom properties DO work (they inherit through shadow boundaries). The `_columns` getter must be cached by reference (`this._cachedColumns`) — ha-data-table reprocesses on every new object.

### ha-chart-base Quirks
- Set `chart.data` and `chart.options` separately — never put `series` in `options` (triggers `replaceMerge` that bypasses `_getSeries()`)
- `markLine`, `markArea` do NOT work — render vertical lines as two-point line series, areas as `areaStyle` series
- `visualMap` with `dimension: 1` crashes with time-series data — use split-series approach
- Series-level `label`, `endLabel`, and scatter labels do NOT render — use rich data point objects on line series
- Set `chart.height` as CSS string (e.g. `"400px"`) to override default height calculation

### Imperative Dialogs
Dialog buttons go INSIDE body content using `jp-dialog-actions` class — NOT via `slot="primaryAction"` / `slot="secondaryAction"` (slots don't work with imperatively created `ha-dialog`). Use `showConfirmDialog()` helper instead of duplicating boilerplate.

### ha-dropdown
Does NOT auto-wire trigger click — you must call `showMenu()` manually. `@wa-select` event provides `e.detail.item.value`.

### hass-subpage
NOT available in our panel context. Use `hass-tabs-subpage` everywhere.

### ha-button
Web Awesome/Shoelace, NOT Material Design. Use `variant="neutral"` for secondary, `variant="danger"` for destructive. `--mdc-theme-primary` does nothing.

## Python Gotchas

- **`er.async_entries_for_device()`** for sibling entity lookup — never iterate `ent_reg.entities.values()` with a filter
- **Device registry values can be `int`** — always `str()` before `.strip()/.lower()`
- **Store versioning:** never bump `STORE_VERSION` without an `async_migrate_func` — HA will crash on startup
- **WS/service handlers** in `__init__.py` must never access coordinator internals (`_history_cache`, `_async_rebuild_entity`). Use public methods only.
- **WS refresh strategy:** handlers needing fresh data `await` the refresh. Handlers that only mutate store metadata schedule refresh via `hass.async_create_task()` and respond immediately.

## Battery degradation domain knowledge

### What the data can reveal (no current sensor)

Juice Patrol only has `{timestamp, soc_pct}`. From this we can infer:

| Observable | What it encodes |
|---|---|
| Duration trend across CompletedCycles | Capacity fade — shorter cycles = less Ah capacity |
| Slope acceleration between sessions | Approaching knee point |
| Variance of ΔQ across cycles | Severson feature — predicts end-of-life trajectory |
| DoD distribution across cycles | Damage accumulation (Miner's rule) |
| Calendar time between cycles | Calendar aging (SEI growth at rest) |

### Chemistry taxonomy

`chemistry_from_battery_type()` in `engine/analysis.py` maps battery type strings to
one of these chemistry values. The full set — primary and rechargeable — is:

**Primary (non-rechargeable):**

| Value | Form factors | Discharge shape | Cliff behaviour |
|---|---|---|---|
| `alkaline` | AA, AAA, C, D, 9V (default) | Quasi-linear with steepening near EOL | Cliff at ~15–20% SoC, weeks away |
| `lithium_primary` | CR123A, Li-ion AA (Energizer Ultimate) | Very flat plateau, long life | Abrupt cliff, harder to predict |
| `coin_cell` | CR2032, CR2450, CR2016, CR1632 | Near-flat entire life | Sharp terminal drop |

`coin_cell` is a behavioural subtype of `lithium_primary` — both share the flat-curve
geometry. They are kept separate in `_CHEMISTRY_MAP` because `_candidate_models()` and
`_classify_confidence()` use `"coin_cell"` specifically. The next chemistry-prediction
branch should consolidate these.

Form-factor → chemistry defaults (covers ~80% of real deployments):
- `CR*` prefix → always `coin_cell` (lithium by IEC definition, no alkaline CR exists)
- `AA`, `AAA`, `C`, `D`, `9V` → default `alkaline` (lithium AA variants require explicit override)
- `Li-ion AA`, `lithium AA` → `lithium_primary`
- `NiMH AA`, `NiMH AAA` → `NiMH` (rechargeable)

**Rechargeable:**

| Value | Form factors | Notes |
|---|---|---|
| `NMC` | 18650, Li-ion, LiPo, built-in | Sloping curve, detectable knee |
| `LFP` | LiFePO4 cells | Very flat, hard SoC estimation |
| `NiMH` | AA/AAA rechargeable | Flat plateau → cliff (like alkaline) |
| `LCO` | Older Li-ion | Shortest cycle life |
| `unknown` | Anything unmatched | Falls back to NMC params for rechargeables, alkaline c_cal for primaries |

### Capacity fade model (rechargeable only)

```
SoH = Q_actual / Q_rated * 100%
    ≈ duration_current_cycle / duration_first_few_cycles * 100%

Q(N) = Q₀ × (1 − α × N^β),  β ≈ 0.5 (SEI-dominated, √N law)
```

From `CompletedCycle` history, SoH is computable as:
```
duration_fade = duration_cycle_N / median(duration_cycles[0:3])
```

### Knee-point detection (rechargeable only)

Knee = inflection where capacity fade accelerates from linear to exponential collapse.
Observable signal: `d²(duration)/dN²` becoming strongly negative.
Implemented in `knee_risk_score()` in `engine/analysis.py`.

NMC cells knee at ~80–90% capacity remaining (typically cycle 500–800).
LFP cells rarely knee before cycle 2,000. LCO knees early (~300 cycles at high temp).

### Sudden death — primary cells

Primary cells (alkaline, lithium_primary, coin_cell) do not degrade across cycles —
they have one discharge life. Their failure mode is **sudden death**: a long plateau
followed by a rapid cliff. This is a within-session geometric property, not a
cross-cycle electrochemical signal.

Observable precursor: the ratio of tail slope to overall Theil-Sen slope.

```
cliff_ratio = tail_slope (last 5 readings) / overall_theil_sen_slope

> 2.5 = entering cliff zone
> 5.0 = deep cliff — days remaining, not weeks
```

The engine must use the **tail slope** for days-remaining when cliff_ratio > 2.5
on a primary chemistry. Using the overall slope over-predicts by 5–8× in cliff territory.

Real failure case: soil moisture meter (2× AA Zigbee), flat at 20% for 5 months,
sudden death Feb 1. Engine predicted April. Fix: cliff detection on primary cells.

### DoD damage accumulation — Miner's rule (rechargeable only)

```
D = Σ (1 / N_fail(DoD_i)),  N_fail(DoD) = a × DoD^(−b)

# LFP:  a=2000, b=1.0   NMC: a=1000, b=1.2
# NiMH: a=500,  b=1.5   LCO: a=500,  b=1.4
```

Implemented in `damage_score()` in `engine/analysis.py`.

### Calendar aging — self-discharge constants

Capacity lost while idle: `Q_loss ≈ c_cal × idle_days^0.5`

```
# Primary cells (slow self-discharge):
alkaline:         c_cal ≈ 0.00105 / day^0.5  (~2%/year)
lithium_primary:  c_cal ≈ 0.00052 / day^0.5  (~1%/year)
coin_cell:        c_cal ≈ 0.00052 / day^0.5  (~1%/year)

# Rechargeable (faster self-discharge):
LFP:   c_cal = 0.0002 / day^0.5
NMC:   c_cal = 0.0005 / day^0.5
NiMH:  c_cal = 0.001  / day^0.5

# Fallback:
unknown: use 0.00105 (most conservative primary value)
```

### Severson feature (early RUL prediction, rechargeable only)

```
feature = Var(ΔQ_N2−N1(v)) — correlates ρ = −0.92 with log(cycle_life)
```
Available from CompletedCycle history after ≥10 cycles.

### Chemistry-specific prediction model preference

| Chemistry | Preferred model(s) | Rationale |
|---|---|---|
| `alkaline` | piecewise_linear → exponential | Two-regime: gradual then cliff |
| `lithium_primary` | piecewise_linear → linear | Flat then step; Weibull overkill |
| `coin_cell` | piecewise_linear → linear | Same cliff geometry as lithium_primary |
| `NMC` / rechargeable | exponential → Weibull | Sloping, knee-detectable |
| `unknown` | AICc selects from all | No prior knowledge |

This preference is implemented via `_candidate_models(chemistry)` in `engine/predictions.py`,
which returns an ordered candidate list for AICc model selection.

### Real-world sensor noise (Zigbee / Z-Wave / BLE)

HA battery sensors are noisy in predictable ways. The engine handles this via:

- **IQR outlier filter** (`_filter_outlier_cycles`): Tukey fence at 2.5× IQR on
  DoD-normalised durations. Applied before `soh_from_cycles` and `knee_risk_score`.
  Falls back to unfiltered if filtering would leave < 3 cycles.
- **Minimum duration gate** (`_dod_normalised_duration`, `min_duration_days=1.0`):
  Rejects cycles shorter than 1 day — eliminates false replacements from network rejoins.
- **Knee noise floor** (`knee_risk_score`): `abs(threshold) × 0.3` per chemistry.
  Suppresses score flicker on devices with naturally uneven cycle lengths.
- **`damage_score` is intentionally unfiltered**: DoD-based, not duration-based.
  Do not add outlier filtering there.

---

## Current engine gaps

### Resolved
1. ~~**No SoH computation**~~ — ✅ `soh_from_cycles()`, `duration_fade()` in `engine/analysis.py`
2. ~~**No knee-point detection**~~ — ✅ `knee_risk_score()` in `engine/analysis.py`
3. ~~**No DoD-weighted damage accumulation**~~ — ✅ `damage_score()` with Miner's rule in `engine/analysis.py`
6. ~~**ClassPrior only carries fit params**~~ — ✅ `ClassPrior.duration_series` added; `update_from_cycle` stores `start_pct`/`end_pct`

4. ~~**No calendar aging penalty**~~ — ✅ `_calendar_penalty()` in `engine/predictions.py`; `_C_CAL` dict holds per-chemistry self-discharge constants
5. ~~**Chemistry params not fed to curve_fit**~~ — ✅ `_candidate_models()` + `_CHEMISTRY_CANDIDATES` in `engine/predictions.py` gate model selection by chemistry
7. ~~**Prediction engine is chemistry-blind**~~ — ✅ Resolved across four implementations: `_tail_cliff_ratio()` + stuck-plateau cap (sudden death), `_C_CAL` constant corrections (calendar aging), `_classify_confidence()` cliff threshold + R² adjustments, `_RELIABILITY_MULTIPLIERS` flip (confidence)

---

## Testing conventions

- Pure Python, no HA dependencies in engine tests
- Test files: `tests/test_*.py`
- Reading format: `[{"t": float, "v": float}, ...]`
- Use `_make_readings(func, n, span_days, noise_pct)` helper pattern from `test_curve_fit.py`
- Use `_make_cycles(n, base_duration, fade_per_cycle)` for CompletedCycle-based tests
- Use `_make_cycles_from_durations(durations)` for explicit duration series tests
- Assert prediction accuracy within ±20% of true value for noisy data, ±10% for clean

## Code style

- Type-annotated, dataclasses for result types
- No external deps in engine/ (no numpy, scipy, sklearn)
- All math is pure Python with `math` stdlib only
- New modules follow the same `from __future__ import annotations` + dataclass pattern

## Out of scope

These are technically valid battery health approaches that do NOT apply to Juice Patrol.
Do not propose them, even if they would improve accuracy.

### Requires hardware we don't have
- **EIS / impedance spectroscopy** — needs AC signal injection hardware
- **Coulomb counting** — needs a current sensor; HA only exposes SoC %
- **Pulse resistance testing** — needs controllable load + high-resolution ADC
- **OCV-SoC curve fitting** — needs voltage readings at rest; we only have integer SoC %
- **Incremental Capacity Analysis (ICA) / Differential Voltage Analysis (DVA)** — needs
  continuous voltage data at controlled C-rate; not available from HA battery sensors
- **Kalman / Extended Kalman / Unscented Kalman filters** — state vector requires
  current and voltage; meaningless with SoC % as the only observable
- **Peukert's law** — requires known discharge current; we have none

### Requires dependencies we cannot install
- **numpy, scipy, pandas, sklearn** — must run on RPi without compilation
- **tensorflow, torch** — same reason, also overkill
- **LSTM / neural networks** — training infrastructure not available on HA host;
  inference-only models still need numpy/scipy for feature extraction

### Architecturally out of scope
- **Auto-detection of rechargeable status** from heuristics or battery_state — caused
  false positives; user manual label is the only source of truth (see Hard Rules)
- **Rainflow counting on raw SoC time series** — we do not have sub-minute resolution;
  the session extraction model (`extract_discharge_sessions`) is the correct abstraction
- **Arrhenius temperature correction** — no temperature sensor available per device;
  use chemistry-level calendar aging constants from the domain knowledge section instead
- **Per-cell SoH for battery packs** — HA exposes pack-level % only; cell-level
  balancing and capacity estimation are not possible from available data

### Valid future work (not excluded)
- **Extending `_CHEMISTRY_MAP`** in `engine/analysis.py` with product-name substrings
  (e.g. `"18650"`, `"rcr123"`, `"14500"`) to improve chemistry resolution for devices
  that use cell-form-factor naming. This is pure data expansion, not a new technique.
- **Consolidating `coin_cell` and `lithium_primary`** — these are behaviourally identical;
  the split exists only because current code checks for `"coin_cell"` specifically.
  Safe to unify once per-chemistry prediction logic is implemented.
