import { LitElement, html, css, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";

class JuicePatrolPanel extends LitElement {
  static get properties() {
    return {
      narrow: { type: Boolean },
      _entities: { state: true },
      _activeView: { state: true },
      _filterText: { state: true },
      _filterCategory: { state: true },
      _settingsOpen: { state: true },
      _settingsDirty: { state: true },
      _settingsValues: { state: true },
      _configEntry: { state: true },
      _sortCol: { state: true },
      _sortAsc: { state: true },
      _detailEntity: { state: true },
      _chartData: { state: true },
      _chartLoading: { state: true },
      _shoppingData: { state: true },
      _shoppingLoading: { state: true },
      _refreshing: { state: true },
      _flashGeneration: { state: true },
      _expandedGroups: { state: true },
      _ignoredCount: { state: true },
      _ignoredEntities: { state: true },
    };
  }

  constructor() {
    super();
    this._hass = null;
    this._panel = null;
    this._hassInitialized = false;
    this._entities = [];
    this._configEntry = null;
    this._settingsOpen = false;
    this._settingsDirty = false;
    this._settingsValues = {};
    this._sortCol = "level";
    this._sortAsc = true;
    this._userSorted = false;
    this._prevLevels = new Map();
    this._recentlyChanged = new Map();
    this._activeView = "devices";
    this._shoppingData = null;
    this._shoppingLoading = false;
    this._refreshing = false;
    this._expandedGroups = {};
    this._filterText = "";
    this._filterCategory = null;
    this._highlightEntity = null;
    this._highlightApplied = false;
    this._highlightAttempts = 0;
    this._detailEntity = null;
    this._chartData = null;
    this._chartLoading = false;
    this._chartLastLevel = null;
    this._flashGeneration = 0;
    this._ignoredCount = 0;
    this._ignoredEntities = null;
    this._flashCleanupTimer = null;
    this._refreshTimer = null;
    this._chartDebounce = null;
    this._entityMap = new Map();
  }

  set hass(hass) {
    this._hass = hass;
    this._processHassUpdate(!this._hassInitialized);
    this._hassInitialized = true;
  }

  get hass() {
    return this._hass;
  }

  set panel(val) {
    this._panel = val;
  }

  get panel() {
    return this._panel;
  }

  /** Base URL path for this panel (e.g. "/juice-patrol"). */
  get _basePath() {
    return `/${this._panel?.url_path || "juice-patrol"}`;
  }

  connectedCallback() {
    super.connectedCallback();
    this.requestUpdate();
    this._escapeHandler = (e) => {
      if (e.key === "Escape") this._closeOverlays();
    };
    window.addEventListener("keydown", this._escapeHandler);
    this._popstateHandler = () => {
      this._syncViewFromUrl();
    };
    window.addEventListener("popstate", this._popstateHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    for (const t of ["_flashCleanupTimer", "_refreshTimer", "_chartDebounce"]) {
      if (this[t]) { clearTimeout(this[t]); this[t] = null; }
    }
    this._refreshing = false;
    if (this._escapeHandler) {
      window.removeEventListener("keydown", this._escapeHandler);
      this._escapeHandler = null;
    }
    if (this._popstateHandler) {
      window.removeEventListener("popstate", this._popstateHandler);
      this._popstateHandler = null;
    }
  }

  firstUpdated() {
    // Restore view from URL path (handles refresh / direct navigation)
    this._syncViewFromUrl();

    // Legacy ?entity= param support for highlight-only deep links
    const params = new URLSearchParams(window.location.search);
    const entityParam = params.get("entity");
    if (entityParam && /^[a-z0-9_]+\.[a-z0-9_]+$/.test(entityParam)) {
      this._highlightEntity = entityParam;
    }
  }

  /** Sync _activeView and _detailEntity from the current URL path. */
  _syncViewFromUrl() {
    const path = window.location.pathname;
    const prefix = `${this._basePath}/detail/`;
    if (path.startsWith(prefix)) {
      const entityId = decodeURIComponent(path.slice(prefix.length));
      if (/^[a-z0-9_]+\.[a-z0-9_]+$/.test(entityId)) {
        if (this._detailEntity !== entityId || this._activeView !== "detail") {
          this._detailEntity = entityId;
          this._activeView = "detail";
          this._chartData = null;
          this._chartLastLevel = null;
          this._loadChartData(entityId);
        }
        return;
      }
    }
    // Any other path → main view
    if (this._activeView === "detail") {
      this._detailEntity = null;
      this._chartData = null;
      this._chartEl = null;
      this._activeView = "devices";
    }
  }

  updated(changed) {
    if (changed.has("_chartData") && this._chartData) {
      requestAnimationFrame(() => this._initChart(this._chartData));
    }
    if (changed.has("_entities")) {
      if (!this._highlightApplied && this._highlightEntity) {
        this._applyDeepLinkHighlight();
      }
      // If detail view is open but the device disappeared, close it
      if (this._activeView === "detail" && this._detailEntity &&
          !this._entityMap.get(this._detailEntity)) {
        this._closeDetail();
      }
    }
  }

  // ── hass processing ──

  _processHassUpdate(isFirstLoad) {
    if (!this._hass) return;

    const prevHash = this._entityHash;
    this._updateEntities();
    const newHash = this._entityHash;

    // Only sort + assign _entities (trigger re-render) when data actually changed
    if (newHash !== prevHash) {
      const sorted = this._sortEntities(this._entityList);
      this._entityMap = new Map(sorted.map((d) => [d.sourceEntity, d]));
      this._entities = sorted;
    }

    if (isFirstLoad) {
      this._loadConfig();
      this._loadIgnored();
    }

    // Auto-refresh chart data when entity level changes in detail view
    if (this._activeView === "detail" && this._detailEntity && !this._chartLoading) {
      const dev = this._getDevice(this._detailEntity);
      if (dev && dev.level !== this._chartLastLevel) {
        this._chartLastLevel = dev.level;
        clearTimeout(this._chartDebounce);
        this._chartDebounce = setTimeout(() => this._loadChartData(this._detailEntity), 2000);
      }
    }
  }

  _updateEntities() {
    if (!this._hass) return;
    const states = this._hass.states;
    const devices = new Map();

    for (const [entityId, state] of Object.entries(states)) {
      const attrs = state.attributes || {};
      const sourceEntity = attrs.source_entity;
      if (!sourceEntity) continue;
      if (entityId.includes("lowest_battery") || entityId.includes("attention_needed")) continue;
      const hasSuffix =
        entityId.includes("_discharge_rate") ||
        entityId.includes("_days_remaining") ||
        entityId.includes("_predicted_empty") ||
        entityId.includes("_battery_low") ||
        entityId.includes("_stale");
      if (!hasSuffix) continue;

      if (!devices.has(sourceEntity)) {
        devices.set(sourceEntity, {
          sourceEntity,
          name: null,
          level: null,
          dischargeRate: null,
          daysRemaining: null,
          predictedEmpty: null,
          isLow: false,
          isStale: false,
          confidence: null,
          threshold: null,
          stability: null,
          stabilityCv: null,
          meanLevel: null,
          anomaly: null,
          dropSize: null,
          isRechargeable: false,
          rechargeableReason: null,
          replacementPending: false,
          batteryType: null,
          batteryTypeSource: null,
          manufacturer: null,
          model: null,
          chargingState: null,
          reliability: null,
          predictionStatus: null,
          platform: null,
          dischargeRateHour: null,
          hoursRemaining: null,
          lastCalculated: null,
        });
      }
      const dev = devices.get(sourceEntity);

      const sourceState = states[sourceEntity];
      if (sourceState && sourceState.state !== "unavailable" && sourceState.state !== "unknown") {
        const parsed = parseFloat(sourceState.state);
        if (!isNaN(parsed)) dev.level = parsed;
      }
      if (sourceState?.attributes?.friendly_name) {
        dev.name = sourceState.attributes.friendly_name;
      }

      if (entityId.includes("_discharge_rate")) {
        dev.dischargeRate =
          state.state !== "unknown" && state.state !== "unavailable"
            ? parseFloat(state.state)
            : null;
        dev.stability = attrs.stability || null;
        dev.stabilityCv = attrs.stability_cv ?? null;
        dev.meanLevel = attrs.mean_level ?? null;
        dev.anomaly = attrs.discharge_anomaly || null;
        dev.dropSize = attrs.drop_size ?? null;
        dev.isRechargeable = attrs.is_rechargeable || false;
        dev.rechargeableReason = attrs.rechargeable_reason || null;
        dev.replacementPending = attrs.replacement_pending || false;
        dev.lastReplaced = attrs.last_replaced || null;
        dev.batteryType = attrs.battery_type || null;
        dev.batteryTypeSource = attrs.battery_type_source || null;
        dev.platform = attrs.platform || null;
        dev.manufacturer = attrs.manufacturer || null;
        dev.model = attrs.model || null;
        dev.chargingState = attrs.charging_state
          ? attrs.charging_state.toLowerCase().replace(/\s/g, "_")
          : null;
        dev.dischargeRateHour = attrs.discharge_rate_hour ?? null;
        dev.lastCalculated = attrs.last_calculated || null;
      } else if (entityId.includes("_days_remaining")) {
        dev.daysRemaining =
          state.state !== "unknown" && state.state !== "unavailable"
            ? parseFloat(state.state)
            : null;
        dev.confidence = attrs.confidence || null;
        dev.reliability = attrs.reliability ?? null;
        dev.predictionStatus = attrs.status || null;
        dev.hoursRemaining = attrs.hours_remaining ?? null;
      } else if (entityId.includes("_predicted_empty")) {
        dev.predictedEmpty =
          state.state !== "unknown" && state.state !== "unavailable" ? state.state : null;
      } else if (entityId.includes("_battery_low")) {
        dev.isLow = state.state === "on";
        dev.threshold = attrs.threshold;
      } else if (entityId.includes("_stale")) {
        dev.isStale = state.state === "on";
      }
    }

    // Recompute isLow from actual level
    const globalThreshold = this._settingsValues.low_threshold ?? 20;
    const now = Date.now();
    let flashChanged = false;
    for (const dev of devices.values()) {
      if (dev.level !== null) {
        const t = dev.threshold ?? globalThreshold;
        dev.isLow = dev.level <= t;
      }
      const roundedLevel = dev.level !== null ? Math.ceil(dev.level) : null;
      const prevLevel = this._prevLevels.get(dev.sourceEntity);
      if (prevLevel !== undefined && roundedLevel !== null && roundedLevel !== prevLevel) {
        this._recentlyChanged.set(dev.sourceEntity, {
          ts: now,
          dir: roundedLevel > prevLevel ? "up" : "down",
        });
        flashChanged = true;
      }
      if (roundedLevel !== null) {
        this._prevLevels.set(dev.sourceEntity, roundedLevel);
      }
    }

    // Expire old change markers (skip sweep when map is empty)
    if (this._recentlyChanged.size > 0) {
      for (const [key, entry] of this._recentlyChanged) {
        if (now - entry.ts > 3000) {
          this._recentlyChanged.delete(key);
          flashChanged = true;
        }
      }
      // Schedule cleanup after animation completes
      if (!this._flashCleanupTimer) {
        this._flashCleanupTimer = setTimeout(() => {
          this._flashCleanupTimer = null;
          this._recentlyChanged.clear();
          this._flashGeneration = (this._flashGeneration || 0) + 1;
        }, 3000);
      }
    }

    if (flashChanged) {
      this._flashGeneration = (this._flashGeneration || 0) + 1;
    }

    // Store unsorted list — sort happens in _processHassUpdate only when hash changes
    this._entityList = [...devices.values()];

    // Build hash for change detection
    const changed = this._recentlyChanged.size > 0
      ? [...this._recentlyChanged.keys()].join(",")
      : "";
    this._entityHash =
      this._entityList
        .map(
          (d) =>
            `${d.sourceEntity}:${d.level}:${d.isLow}:${d.isStale}:${d.stability}:${d.replacementPending}:${d.batteryType}`
        )
        .join("|") +
      "|!" +
      changed;
  }

  _sortEntities(list) {
    const col = this._sortCol;
    const asc = this._sortAsc;
    const dir = asc ? 1 : -1;

    return list.sort((a, b) => {
      const av = this._getSortValue(a, col);
      const bv = this._getSortValue(b, col);

      if (av === null && bv !== null) return 1;
      if (av !== null && bv === null) return -1;

      if (!this._userSorted) {
        const aAtt =
          a.replacementPending ||
          a.isLow ||
          a.isStale ||
          (a.anomaly && a.anomaly !== "normal");
        const bAtt =
          b.replacementPending ||
          b.isLow ||
          b.isStale ||
          (b.anomaly && b.anomaly !== "normal");
        if (aAtt !== bAtt) return aAtt ? -1 : 1;
      }

      if (av === bv) return 0;
      return (av < bv ? -1 : 1) * dir;
    });
  }

  _getSortValue(dev, col) {
    switch (col) {
      case "name":
        return (dev.name || dev.sourceEntity).toLowerCase();
      case "level":
        return dev.level;
      case "type":
        return (dev.batteryType || "").toLowerCase() || null;
      case "rate":
        return dev.dischargeRate;
      case "days":
        return dev.daysRemaining;
      case "reliability":
        return dev.reliability;
      case "empty":
        return dev.predictedEmpty;
      default:
        return dev.level;
    }
  }

  _getFilteredEntities() {
    let list = this._entities;
    const cat = this._filterCategory;
    if (cat === "low") list = list.filter((d) => d.isLow);
    else if (cat === "stale") list = list.filter((d) => d.isStale);
    else if (cat === "unavailable") list = list.filter((d) => d.level === null);
    else if (cat === "pending") list = list.filter((d) => d.replacementPending);
    else if (cat === "anomaly")
      list = list.filter((d) => d.anomaly && d.anomaly !== "normal");

    const q = this._filterText.toLowerCase().trim();
    if (q) {
      list = list.filter((d) => {
        const name = (d.name || d.sourceEntity).toLowerCase();
        const type = (d.batteryType || "").toLowerCase();
        const plat = (d.platform || "").toLowerCase();
        const entity = d.sourceEntity.toLowerCase();
        const mfr = (d.manufacturer || "").toLowerCase();
        const mdl = (d.model || "").toLowerCase();
        return (
          name.includes(q) ||
          type.includes(q) ||
          plat.includes(q) ||
          entity.includes(q) ||
          mfr.includes(q) ||
          mdl.includes(q)
        );
      });
    }
    return list;
  }

  // ── Helpers ──

  _getDevice(entityId) {
    return this._entityMap.get(entityId);
  }

  _formatLevel(level) {
    const d = this._displayLevel(level);
    return d !== null ? d + "%" : "\u2014";
  }

  _wsErrorMessage(e, feature) {
    return e?.message?.includes("unknown command")
      ? `Restart Home Assistant to enable ${feature}`
      : `${feature} failed`;
  }

  _getBatteryIcon(dev) {
    if (dev.isRechargeable) {
      if (dev.level === null) return "mdi:battery-unknown";
      if (dev.level <= 10) return "mdi:battery-charging-10";
      if (dev.level <= 30) return "mdi:battery-charging-30";
      if (dev.level <= 60) return "mdi:battery-charging-60";
      if (dev.level <= 90) return "mdi:battery-charging-90";
      return "mdi:battery-charging-100";
    }
    const level = dev.level;
    if (level === null) return "mdi:battery-unknown";
    if (level <= 5) return "mdi:battery-outline";
    if (level <= 15) return "mdi:battery-10";
    if (level <= 25) return "mdi:battery-20";
    if (level <= 35) return "mdi:battery-30";
    if (level <= 45) return "mdi:battery-40";
    if (level <= 55) return "mdi:battery-50";
    if (level <= 65) return "mdi:battery-60";
    if (level <= 75) return "mdi:battery-70";
    if (level <= 85) return "mdi:battery-80";
    if (level <= 95) return "mdi:battery-90";
    return "mdi:battery";
  }

  _getLevelColor(level, threshold) {
    if (level === null) return "var(--disabled-text-color)";
    const t = threshold ?? this._settingsValues.low_threshold ?? 20;
    if (level <= t / 2) return "var(--error-color, #db4437)";
    if (level <= t * 1.25) return "var(--warning-color, #ffa726)";
    return "var(--success-color, #43a047)";
  }

  _displayLevel(level) {
    if (level === null) return null;
    return Math.ceil(level);
  }

  _isActivelyCharging(dev) {
    return dev.isRechargeable && dev.chargingState === "charging";
  }

  _isFastDischarge(dev) {
    return dev.dischargeRateHour !== null && dev.dischargeRateHour >= 1;
  }

  _predictionReason(dev) {
    const s = dev.predictionStatus;
    if (!s || s === "normal") return null;
    const labels = {
      charging: "Charging",
      flat: "Flat",
      noisy: "Noisy data",
      insufficient_data: "Not enough data",
      single_level: "Single level",
      insufficient_range: "Tiny range",
    };
    return labels[s] || null;
  }

  _predictionReasonDetail(status) {
    const details = {
      charging: "This battery is currently charging, so no discharge prediction is generated. Once it starts discharging again, a new prediction will be calculated.",
      flat: "The battery level has been essentially flat \u2014 no significant discharge detected. This is normal for devices with very slow drain. A prediction will appear once enough change is observed.",
      noisy: "The battery data is too irregular to fit a reliable trend line. This can happen with sensors that report inconsistent values. The prediction will improve as more stable readings accumulate.",
      insufficient_data: "There are not enough data points or the observation period is too short to calculate a prediction. Juice Patrol needs at least 3 readings spanning 24 hours.",
      single_level: "All recorded readings have the same battery level. This typically means the sensor reports a fixed value or hasn't changed since discovery.",
      insufficient_range: "The battery level has barely changed \u2014 the total variation is within one reporting step. More drain needs to occur before a trend can be detected.",
    };
    return details[status] || null;
  }

  _formatRate(dev) {
    if (this._isFastDischarge(dev)) {
      return dev.dischargeRateHour !== null ? dev.dischargeRateHour + "%/h" : "\u2014";
    }
    return dev.dischargeRate !== null ? dev.dischargeRate + "%/d" : "\u2014";
  }

  _formatTimeRemaining(dev) {
    if (this._isFastDischarge(dev) && dev.hoursRemaining !== null) {
      if (dev.hoursRemaining < 1) return Math.round(dev.hoursRemaining * 60) + "m";
      return dev.hoursRemaining + "h";
    }
    return dev.daysRemaining !== null ? dev.daysRemaining + "d" : "\u2014";
  }

  _formatDate(isoString, includeTime = false) {
    if (!isoString) return "\u2014";
    try {
      const d = new Date(isoString);
      if (includeTime) {
        const now = new Date();
        const sameYear = d.getFullYear() === now.getFullYear();
        const dateOpts = sameYear
          ? { month: "short", day: "numeric" }
          : { month: "short", day: "numeric", year: "numeric" };
        return (
          d.toLocaleDateString(undefined, dateOpts) +
          " " +
          d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
        );
      }
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "\u2014";
    }
  }

  _parseBatteryType(str) {
    if (!str) return { count: 0, type: "" };
    const m = str.match(/^(\d+)\s*[×x]\s*(.+)$/i);
    if (m) return { count: parseInt(m[1]), type: m[2].trim() };
    return { count: 1, type: str.trim() };
  }

  _formatBatteryType(type, count) {
    if (!type) return "";
    return count > 1 ? `${count}× ${type}` : type;
  }

  _erraticTooltip(dev) {
    const parts = [];
    const display = this._displayLevel(dev.level);
    const mean = this._displayLevel(dev.meanLevel);

    if (mean !== null && display !== null && display > mean + 3 && !dev.isRechargeable) {
      parts.push(
        `Level is rising (${display}%) without a charge state — not expected for a non-rechargeable battery`
      );
    } else if (mean !== null && display !== null && Math.abs(display - mean) > 5) {
      parts.push(
        `Current level (${display}%) differs significantly from 7-day average (${mean}%)`
      );
    }

    if (dev.stabilityCv !== null && dev.stabilityCv > 0.05) {
      parts.push(`High reading variance (CV: ${(dev.stabilityCv * 100).toFixed(1)}%)`);
    }

    if (parts.length === 0) {
      parts.push("Battery readings show non-monotonic or inconsistent behavior");
    }

    return parts.join(". ");
  }

  _showToast(message) {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        bubbles: true,
        composed: true,
        detail: { message },
      })
    );
  }

  _applyDeepLinkHighlight() {
    if (!this._highlightEntity || this._highlightApplied) return;
    this._highlightAttempts = (this._highlightAttempts || 0) + 1;
    if (this._highlightAttempts > 10) {
      this._highlightApplied = true;
      return;
    }
    const row = this.shadowRoot.querySelector(
      `.device-row[data-entity="${CSS.escape(this._highlightEntity)}"]`
    );
    if (!row) return;
    this._highlightApplied = true;
    requestAnimationFrame(() => {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.add("highlighted");
      setTimeout(() => row.classList.remove("highlighted"), 3000);
    });
  }

  // ── WS calls ──

  async _loadConfig() {
    if (!this._hass) return;
    try {
      const settings = await this._hass.callWS({ type: "juice_patrol/get_settings" });
      this._configEntry = { entry_id: settings.entry_id };
      this._settingsValues = {
        low_threshold: settings.low_threshold,
        stale_timeout: settings.stale_timeout,
        prediction_horizon: settings.prediction_horizon,
      };
    } catch (e) {
      console.error("Juice Patrol: failed to load config", e);
    }
  }

  async _saveSettings() {
    if (!this._hass) return;
    try {
      const result = await this._hass.callWS({
        type: "juice_patrol/update_settings",
        low_threshold: parseInt(this._settingsValues.low_threshold),
        stale_timeout: parseInt(this._settingsValues.stale_timeout),
        prediction_horizon: parseInt(this._settingsValues.prediction_horizon),
      });
      this._settingsDirty = false;
      this._settingsValues = {
        low_threshold: result.low_threshold,
        stale_timeout: result.stale_timeout,
        prediction_horizon: result.prediction_horizon,
      };
      this._settingsOpen = false;
      this._showToast("Settings saved");
    } catch (e) {
      console.error("Juice Patrol: failed to save settings", e);
      this._showToast("Failed to save settings");
    }
  }

  async _markReplaced(entityId) {
    const dev = this._getDevice(entityId);
    if (dev?.isRechargeable) {
      this._showReplaceRechargeableDialog(entityId);
      return;
    }
    this._showReplaceDialog(entityId);
  }

  async _doMarkReplaced(entityId) {
    try {
      await this._hass.callWS({
        type: "juice_patrol/mark_replaced",
        entity_id: entityId,
      });
      this._showToast("Battery marked as replaced");
    } catch (e) {
      this._showToast("Failed to mark as replaced");
    }
  }

  _showReplaceRechargeableDialog(entityId) {
    const dialog = document.createElement("ha-dialog");
    dialog.open = true;
    dialog.headerTitle = "Replace rechargeable battery?";
    this.shadowRoot.appendChild(dialog);

    const closeDialog = () => { dialog.open = false; dialog.remove(); };

    const body = document.createElement("div");
    body.innerHTML = `
      <p style="margin-top:0">This device is marked as <strong>rechargeable</strong>, which means
      Juice Patrol expects its battery level to gradually rise and fall as it
      charges and discharges. Charging is detected automatically \u2014 you don't
      need to do anything when you plug it in.</p>
      <p><strong>"Mark as replaced"</strong> is for when you physically swap the
      battery pack itself (e.g. a worn-out cell that no longer holds charge).</p>
      <p>If you just recharged the device, you can ignore this \u2014 Juice Patrol
      already handles that.</p>
      <p style="border-left:3px solid var(--error-color, #db4437); padding:4px 12px; margin:16px 0">
        <strong>Warning:</strong> This will discard all Juice Patrol history for this
        device and start tracking from scratch. Recorder data is not affected.
        This action can be undone.</p>
      <div class="jp-dialog-actions">
        <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>
        <ha-button class="jp-dialog-confirm" variant="danger">Yes, battery was replaced</ha-button>
      </div>
    `;
    dialog.appendChild(body);

    body.querySelector(".jp-dialog-cancel").addEventListener("click", closeDialog);
    body.querySelector(".jp-dialog-confirm").addEventListener("click", () => {
      closeDialog();
      this._doMarkReplaced(entityId);
    });
  }

  _showReplaceDialog(entityId) {
    const dialog = document.createElement("ha-dialog");
    dialog.open = true;
    dialog.headerTitle = "Mark battery as replaced?";
    this.shadowRoot.appendChild(dialog);

    const closeDialog = () => { dialog.open = false; dialog.remove(); };

    const body = document.createElement("div");
    body.innerHTML = `
      <p style="margin-top:0">This tells Juice Patrol that you swapped the batteries.
      The discharge history will be reset and tracking starts fresh.</p>
      <p style="border-left:3px solid var(--error-color, #db4437); padding:4px 12px; margin:16px 0">
        <strong>Warning:</strong> This will discard all Juice Patrol history for this
        device and start tracking from scratch. Recorder data is not affected.
        This action can be undone.</p>
      <div class="jp-dialog-actions">
        <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>
        <ha-button class="jp-dialog-confirm" variant="danger">Yes, battery was replaced</ha-button>
      </div>
    `;
    dialog.appendChild(body);

    body.querySelector(".jp-dialog-cancel").addEventListener("click", closeDialog);
    body.querySelector(".jp-dialog-confirm").addEventListener("click", () => {
      closeDialog();
      this._doMarkReplaced(entityId);
    });
  }

  async _undoReplacement(entityId) {
    try {
      await this._hass.callWS({
        type: "juice_patrol/undo_replacement",
        entity_id: entityId,
      });
      this._showToast("Replacement undone — history restored");
    } catch (e) {
      this._showToast("Failed to undo replacement");
    }
  }

  async _confirmReplacement(entityId) {
    try {
      await this._hass.callWS({
        type: "juice_patrol/confirm_replacement",
        entity_id: entityId,
      });
      this._showToast("Replacement confirmed");
    } catch (e) {
      this._showToast("Failed to confirm");
    }
  }

  async _recalculate(entityId) {
    try {
      await this._hass.callWS({
        type: "juice_patrol/recalculate",
        entity_id: entityId,
      });
      this._showToast("Prediction recalculated");
    } catch (e) {
      this._showToast(this._wsErrorMessage(e, "recalculation"));
    }
  }

  async _refresh() {
    if (this._refreshing) return;
    this._refreshing = true;
    try {
      await this._hass.callWS({ type: "juice_patrol/refresh" });
      this._showToast("Predictions refreshed");
    } catch (e) {
      this._showToast("Refresh failed");
    }
    this._refreshTimer = setTimeout(() => {
      this._refreshTimer = null;
      this._refreshing = false;
    }, 2000);
  }

  async _loadIgnored() {
    if (!this._hass) return;
    try {
      const result = await this._hass.callWS({
        type: "juice_patrol/get_ignored",
      });
      this._ignoredCount = result.devices.length;
      this._ignoredEntities = result.devices;
    } catch (e) {
      console.error("Juice Patrol: failed to load ignored devices", e);
    }
  }

  async _ignoreDevice(entityId) {
    if (!this._hass) return;
    try {
      await this._hass.callWS({
        type: "juice_patrol/set_ignored",
        entity_id: entityId,
        ignored: true,
      });
      this._showToast("Device ignored");
      this._loadIgnored();
    } catch (e) {
      this._showToast("Failed to ignore device");
    }
  }

  async _unignoreDevice(entityId) {
    if (!this._hass) return;
    try {
      await this._hass.callWS({
        type: "juice_patrol/set_ignored",
        entity_id: entityId,
        ignored: false,
      });
      this._showToast("Device restored");
      this._loadIgnored();
    } catch (e) {
      this._showToast("Failed to unignore device");
    }
  }

  async _loadShoppingList() {
    if (!this._hass) return;
    this._shoppingLoading = true;
    try {
      this._shoppingData = await this._hass.callWS({
        type: "juice_patrol/get_shopping_list",
      });
    } catch (e) {
      console.error("Juice Patrol: failed to load shopping list", e);
      this._shoppingData = null;
    }
    this._shoppingLoading = false;
  }

  async _loadChartData(entityId) {
    if (!this._hass || this._chartLoading) return;
    this._chartLoading = true;
    this._chartData = null;
    try {
      const data = await this._hass.callWS({
        type: "juice_patrol/get_entity_chart",
        entity_id: entityId,
      });
      this._chartLastLevel = data?.level ?? null;
      this._chartData = data;
    } catch (e) {
      console.error("Juice Patrol: failed to load chart data", e);
      this._showToast(this._wsErrorMessage(e, "chart view"));
      this._chartData = null;
    }
    this._chartLoading = false;
  }

  async _saveBatteryType(entityId, type) {
    try {
      await this._hass.callWS({
        type: "juice_patrol/set_battery_type",
        entity_id: entityId,
        battery_type: type,
      });
      this._showToast(type ? `Battery type set to ${type}` : "Battery type cleared");
    } catch (e) {
      this._showToast("Failed to set battery type");
    }
  }

  // ── Actions ──

  _openDetail(entityId) {
    this._closeOverlays();
    this._detailEntity = entityId;
    this._activeView = "detail";
    this._chartData = null;
    this._chartLastLevel = null;
    const detailUrl = `${this._basePath}/detail/${encodeURIComponent(entityId)}`;
    history.pushState({ jpDetail: entityId }, "", detailUrl);
    this._loadChartData(entityId);
  }

  // Called by the Back button — triggers history.back() which fires popstate → _syncViewFromUrl
  _closeDetail() {
    if (this._activeView === "detail") {
      history.back();
    }
  }

  _toggleSort(col) {
    if (this._sortCol === col) {
      this._sortAsc = !this._sortAsc;
    } else {
      this._sortCol = col;
      this._sortAsc = true;
    }
    this._userSorted = true;
    this._entities = this._sortEntities([...this._entities]);
  }

  _setFilter(cat) {
    this._closeOverlays();
    this._filterCategory = this._filterCategory === cat ? null : cat;
    if (this._activeView !== "devices") this._activeView = "devices";
    if (this._filterCategory === "ignored") this._loadIgnored();
  }

  _switchTab(view) {
    if (view === this._activeView) return;
    this._closeOverlays();
    this._activeView = view;
    if (view === "shopping") this._loadShoppingList();
  }

  _handleSearchInput(e) {
    const val = e.target.value;
    this._filterText = val;
    // Debounce not needed — Lit batches updates. The input retains focus naturally.
  }

  _clearSearch() {
    this._filterText = "";
  }

  _clearFilter() {
    this._filterCategory = null;
  }

  _toggleSettings() {
    this._settingsOpen = !this._settingsOpen;
    if (this._settingsOpen) {
      this._settingsDirty = false;
      this._loadConfig();
    }
  }

  _handleSettingInput(e) {
    const key = e.target.dataset.key;
    this._settingsValues = { ...this._settingsValues, [key]: e.target.value };
    this._settingsDirty = true;
  }

  _cancelSettings() {
    this._settingsOpen = false;
    this._settingsDirty = false;
  }

  _handleMenuSelect(e, entityId) {
    const action = e.detail?.item?.value;
    if (!action || !entityId) return;
    const dev = this._getDevice(entityId);
    if (action === "detail") {
      this._openDetail(entityId);
    } else if (action === "confirm") {
      this._confirmReplacement(entityId);
    } else if (action === "replace") {
      this._markReplaced(entityId);
    } else if (action === "recalculate") {
      this._recalculate(entityId);
    } else if (action === "type") {
      this._setBatteryType(entityId, dev?.batteryType);
    } else if (action === "undo-replace") {
      this._undoReplacement(entityId);
    } else if (action === "ignore") {
      this._ignoreDevice(entityId);
    }
  }

  _closeOverlays() {
    // Remove any imperative dialogs
    this.shadowRoot
      .querySelectorAll("ha-dialog")
      .forEach((el) => { el.open = false; el.remove(); });
  }

  _handleRowClick(entityId) {
    this._openDetail(entityId);
  }

  _handleActionClick(e, action, entityId) {
    e.stopPropagation();
    if (action === "confirm") {
      this._confirmReplacement(entityId);
    }
  }

  // ── Battery type dialog (stays imperative) ──

  _setBatteryType(entityId, currentType) {
    this._closeOverlays();
    const dev = this._getDevice(entityId);
    const current = currentType || dev?.batteryType || "";
    const parsed = this._parseBatteryType(current);
    const presets = ["CR2032", "CR2450", "CR123A", "AA", "AAA", "Li-ion", "Built-in"];

    let badges = [];
    let lockedType = null;
    if (current && presets.includes(parsed.type)) {
      for (let i = 0; i < parsed.count; i++) badges.push(parsed.type);
      lockedType = parsed.type;
    }

    let rechargeable = dev?.isRechargeable || false;
    let rechargeableChanged = false;

    const dialog = document.createElement("ha-dialog");
    dialog.open = true;
    dialog.headerTitle = "Set battery type";
    this.shadowRoot.appendChild(dialog);

    const closeDialog = () => { dialog.open = false; dialog.remove(); };

    const esc = (s) => {
      if (!s) return "";
      const d = document.createElement("div");
      d.textContent = s;
      return d.innerHTML;
    };

    const body = document.createElement("div");
    dialog.appendChild(body);

    const renderDialog = () => {
      const badgeHtml =
        badges.length > 0
          ? badges
              .map(
                (b, i) =>
                  `<span class="jp-badge-chip" data-idx="${i}" title="Click to remove">${esc(b)} \u2715</span>`
              )
              .join("")
          : '<span class="jp-badge-placeholder">Click a battery type below, or type a custom value</span>';

      body.innerHTML = `
        <div class="jp-dialog-desc">${esc(dev?.name || entityId)}</div>
        <div class="jp-badge-field">${badgeHtml}</div>
        <div class="jp-dialog-presets">
          ${presets
            .map((t) => {
              const disabled = lockedType !== null && t !== lockedType;
              return `<button class="jp-preset${disabled ? " disabled" : ""}${t === lockedType ? " active" : ""}"
              data-type="${t}" ${disabled ? "disabled" : ""}>${t}</button>`;
            })
            .join("")}
        </div>
        <div class="jp-dialog-or">or type a custom value:</div>
        <input type="text" class="jp-dialog-input" placeholder="e.g. 18650, LR44, custom..."
               value="${badges.length === 0 && !presets.includes(parsed.type) ? esc(current) : ""}">
        <ha-button class="jp-autodetect" style="margin-top:8px;width:100%">
          <ha-icon slot="start" icon="mdi:auto-fix"></ha-icon>
          Autodetect
        </ha-button>
        <label class="jp-rechargeable-toggle">
          <input type="checkbox" class="jp-rechargeable-cb" ${rechargeable ? "checked" : ""}>
          <ha-icon icon="mdi:power-plug-battery" style="--mdc-icon-size:16px"></ha-icon>
          Rechargeable battery
        </label>
        <div class="jp-dialog-actions">
          <ha-button variant="neutral" class="jp-dialog-clear">Clear</ha-button>
          <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>
          <ha-button class="jp-dialog-save">Save</ha-button>
        </div>
      `;
      bindDialogEvents();
    };

    const bindDialogEvents = () => {
      body.querySelectorAll(".jp-badge-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          badges.splice(parseInt(chip.dataset.idx), 1);
          if (badges.length === 0) lockedType = null;
          renderDialog();
        });
      });

      body.querySelectorAll(".jp-preset:not([disabled])").forEach((btn) => {
        btn.addEventListener("click", () => {
          const t = btn.dataset.type;
          lockedType = t;
          badges.push(t);
          const input = body.querySelector(".jp-dialog-input");
          if (input) input.value = "";
          renderDialog();
        });
      });

      body.querySelector(".jp-autodetect")?.addEventListener("click", async () => {
        const btn = body.querySelector(".jp-autodetect");
        if (btn) {
          btn.disabled = true;
          btn.textContent = "Detecting...";
        }
        try {
          const result = await this._hass.callWS({
            type: "juice_patrol/detect_battery_type",
            entity_id: entityId,
          });
          if (result.battery_type) {
            const p = this._parseBatteryType(result.battery_type);
            badges = [];
            lockedType = null;
            if (presets.includes(p.type)) {
              for (let i = 0; i < p.count; i++) badges.push(p.type);
              lockedType = p.type;
            }
            renderDialog();
            if (!presets.includes(p.type)) {
              const input = body.querySelector(".jp-dialog-input");
              if (input) input.value = result.battery_type;
            }
            this._showToast(`Detected: ${result.battery_type} (${result.source})`);
          } else {
            this._showToast("Could not auto-detect battery type");
            if (btn) {
              btn.disabled = false;
              btn.textContent = "Autodetect";
            }
          }
        } catch (e) {
          console.warn("Juice Patrol: auto-detect failed", e);
          this._showToast(this._wsErrorMessage(e, "auto-detection"));
          if (btn) {
            btn.disabled = false;
            btn.innerHTML =
              '<ha-icon icon="mdi:auto-fix" style="--mdc-icon-size:16px;vertical-align:middle;margin-right:4px"></ha-icon> Autodetect';
          }
        }
      });

      body.querySelector(".jp-rechargeable-cb")?.addEventListener("change", (e) => {
        rechargeable = e.target.checked;
        rechargeableChanged = true;
      });

      dialog.addEventListener("closed", closeDialog);
      body
        .querySelector(".jp-dialog-cancel")
        ?.addEventListener("click", closeDialog);
      body.querySelector(".jp-dialog-clear")?.addEventListener("click", () => {
        badges = [];
        lockedType = null;
        const input = body.querySelector(".jp-dialog-input");
        if (input) input.value = "";
        renderDialog();
      });

      body
        .querySelector(".jp-dialog-save")
        ?.addEventListener("click", async () => {
          let val;
          const customInput = body.querySelector(".jp-dialog-input");
          const customVal = customInput?.value?.trim();
          if (badges.length > 0) {
            val = this._formatBatteryType(lockedType, badges.length);
          } else if (customVal) {
            val = customVal;
          } else {
            val = null;
          }
          closeDialog();
          const typeChanged = val !== (current || null);
          if (rechargeableChanged) {
            try {
              await this._hass.callWS({
                type: "juice_patrol/set_rechargeable",
                entity_id: entityId,
                is_rechargeable: rechargeable,
              });
            } catch (e) {
              this._showToast("Failed to update rechargeable state");
            }
          }
          if (typeChanged) {
            await this._saveBatteryType(entityId, val);
          }
        });

      const input = body.querySelector(".jp-dialog-input");
      input?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") body.querySelector(".jp-dialog-save")?.click();
        if (e.key === "Escape") closeDialog();
      });
    };

    renderDialog();
  }

  // ── Chart ──

  // Resolve a CSS custom property to an actual color value ECharts can use.
  // Falls back to the provided default if the variable is unset or empty.
  _resolveColor(varName, fallback) {
    const v = getComputedStyle(this).getPropertyValue(varName).trim();
    return v || fallback;
  }

  async _initChart(chartData) {
    const container = this.shadowRoot.getElementById("jp-chart");
    if (!container || !chartData || !chartData.readings || chartData.readings.length === 0)
      return;

    if (!customElements.get("ha-chart-base")) {
      try {
        await window.loadCardHelpers?.();
        await new Promise((r) => setTimeout(r, 100));
      } catch (e) {
        console.warn("Juice Patrol: loadCardHelpers failed", e);
      }
    }

    if (!customElements.get("ha-chart-base")) {
      container.innerHTML = '<div class="empty-state">Chart component not available</div>';
      return;
    }

    // Resolve HA theme colors to concrete values — ECharts renders to canvas
    // and cannot resolve CSS custom properties.
    const colorLevel = this._resolveColor("--primary-color", "#03a9f4");
    const colorPredicted = this._resolveColor("--warning-color", "#ffa726");
    const colorThreshold = this._resolveColor("--error-color", "#db4437");
    const colorCharge = this._resolveColor("--success-color", "#4caf50");
    const colorNowLine = this._resolveColor("--secondary-text-color", "#999");
    const colorAxis = this._resolveColor("--secondary-text-color", "#999");
    const colorGrid = this._resolveColor("--divider-color", "rgba(0,0,0,0.12)");
    const colorTooltipBg = this._resolveColor(
      "--ha-card-background",
      this._resolveColor("--card-background-color", "#fff")
    );
    const colorTooltipText = this._resolveColor("--primary-text-color", "#212121");
    const colorLegend = this._resolveColor("--primary-text-color", "#212121");

    const readings = chartData.readings;
    const pred = chartData.prediction;
    const t0 = chartData.first_reading_timestamp;
    const threshold = chartData.threshold;

    const observed = readings.map((r) => [r.t * 1000, r.v]);

    const chargePred = chartData.charge_prediction;
    const isCharging = chartData.charging_state === "Charging";
    const hasChargePred = chargePred && chargePred.estimated_full_timestamp;

    const fitted = [];
    if (pred.slope_per_day != null && pred.intercept != null && t0 != null) {
      const fittedY = (t) => {
        const days = (t - t0) / 86400;
        return pred.slope_per_day * days + pred.intercept;
      };
      const startT = readings[0].t;
      const nowT = Date.now() / 1000;
      // When charging, truncate the discharge line at now (no future projection)
      const endT = isCharging
        ? nowT
        : pred.estimated_empty_timestamp
          ? Math.min(pred.estimated_empty_timestamp, nowT + 365 * 86400)
          : nowT + 30 * 86400;
      for (const t of [startT, nowT, ...(isCharging ? [] : [endT])]) {
        fitted.push([t * 1000, Math.max(0, Math.min(100, fittedY(t)))]);
      }
    }

    const tMin = observed[0]?.[0] || Date.now();
    const nowMs = Date.now();
    let tMax;
    if (isCharging && chargePred && chargePred.segment_start_timestamp != null) {
      // Estimate charge endpoint for x-axis scoping
      const segStartV = chargePred.segment_start_level;
      const currentLevel = chartData.level;
      const slopeH = hasChargePred
        ? chargePred.slope_per_hour
        : (currentLevel > segStartV && (nowMs / 1000 - chargePred.segment_start_timestamp) > 0)
          ? (currentLevel - segStartV) / ((nowMs / 1000 - chargePred.segment_start_timestamp) / 3600)
          : 0;
      if (slopeH > 0) {
        const fullT = hasChargePred
          ? chargePred.estimated_full_timestamp * 1000
          : nowMs + ((100 - currentLevel) / slopeH) * 3600000;
        const pad = (fullT - tMin) * 0.1;
        tMax = fullT + pad;
      } else {
        // Charging but can't compute rate — show observed + 20% padding
        tMax = nowMs + (nowMs - tMin) * 0.2;
      }
    } else if (isCharging) {
      // Charging but no charge prediction data at all
      tMax = nowMs + (nowMs - tMin) * 0.2;
    } else {
      tMax = fitted.length
        ? fitted[fitted.length - 1][0]
        : observed[observed.length - 1]?.[0] || nowMs;
    }

    const series = [
      {
        name: "Battery Level",
        type: "line",
        data: observed,
        smooth: false,
        symbol: observed.length > 50 ? "none" : "circle",
        symbolSize: 4,
        lineStyle: { width: 2, color: colorLevel },
        itemStyle: { color: colorLevel },
        areaStyle: { color: colorLevel, opacity: 0.07 },
      },
    ];

    if (fitted.length > 0) {
      series.push({
        name: "Discharge prediction",
        type: "line",
        data: fitted,
        smooth: false,
        symbol: "none",
        lineStyle: { width: 2, type: "dashed", color: colorPredicted },
        itemStyle: { color: colorPredicted },
      });
    }

    // Charge prediction line (rechargeable devices currently charging)
    if (isCharging && chargePred && chargePred.segment_start_timestamp != null) {
      const segStartT = chargePred.segment_start_timestamp;
      const segStartV = chargePred.segment_start_level;
      const nowT = Date.now() / 1000;
      const currentLevel = chartData.level;

      // Use engine prediction if available, otherwise compute from observed rise
      let slopePerHour = hasChargePred ? chargePred.slope_per_hour : null;
      if ((slopePerHour == null || slopePerHour <= 0) && currentLevel > segStartV) {
        const elapsedHours = (nowT - segStartT) / 3600;
        if (elapsedHours > 0) {
          slopePerHour = (currentLevel - segStartV) / elapsedHours;
        }
      }

      if (slopePerHour > 0) {
        const hoursToFull = (100 - currentLevel) / slopePerHour;
        const endT = hasChargePred
          ? chargePred.estimated_full_timestamp
          : nowT + hoursToFull * 3600;
        const fittedChargeY = (t) => {
          const hours = (t - segStartT) / 3600;
          return slopePerHour * hours + segStartV;
        };
        const chargePoints = [segStartT, nowT, endT].map(
          (t) => [t * 1000, Math.max(0, Math.min(100, fittedChargeY(t)))]
        );
        series.push({
          name: "Charge prediction",
          type: "line",
          data: chargePoints,
          smooth: false,
          symbol: "none",
          lineStyle: { width: 2, type: "dashed", color: colorCharge },
          itemStyle: { color: colorCharge },
        });
      }
    }

    series.push({
      name: "Threshold",
      type: "line",
      data: [
        [tMin, threshold],
        [tMax, threshold],
      ],
      symbol: "none",
      lineStyle: { width: 1, type: "dotted", color: colorThreshold },
      itemStyle: { color: colorThreshold },
    });

    series.push({
      name: "Now",
      type: "line",
      data: [],
      markLine: {
        silent: true,
        symbol: "none",
        data: [{ xAxis: Date.now() }],
        lineStyle: { type: "solid", width: 1, color: colorNowLine },
        label: { formatter: "Now", fontSize: 11, color: colorNowLine },
      },
    });

    const isNarrow = container.clientWidth < 500;

    const option = {
      xAxis: {
        type: "time",
        axisLabel: { color: colorAxis, fontSize: isNarrow ? 10 : 12 },
        axisLine: { lineStyle: { color: colorGrid } },
        splitLine: { lineStyle: { color: colorGrid } },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: { formatter: "{value}%", color: colorAxis },
        axisLine: { lineStyle: { color: colorGrid } },
        splitLine: { lineStyle: { color: colorGrid } },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: colorTooltipBg,
        borderColor: colorGrid,
        textStyle: { color: colorTooltipText },
        formatter: (params) => {
          if (!params || params.length === 0) return "";
          const date = new Date(params[0].value[0]);
          const dateStr =
            date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            }) +
            " " +
            date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
          let h = `<b>${dateStr}</b><br>`;
          for (const p of params) {
            if (p.seriesName === "Now") continue;
            const val =
              typeof p.value[1] === "number" ? p.value[1].toFixed(1) + "%" : "\u2014";
            h += `${p.marker} ${p.seriesName}: ${val}<br>`;
          }
          return h;
        },
      },
      legend: {
        show: true,
        bottom: 0,
        textStyle: { color: colorLegend, fontSize: isNarrow ? 10 : 11 },
        itemWidth: isNarrow ? 12 : 16,
        itemHeight: isNarrow ? 8 : 10,
        itemGap: isNarrow ? 6 : 8,
        padding: [4, 0, 0, 0],
        selected: {
          "Discharge prediction": !isCharging,
          "Charge prediction": isCharging,
        },
      },
      grid: {
        left: isNarrow ? 40 : 50,
        right: isNarrow ? 10 : 20,
        top: 20,
        bottom: isNarrow ? 60 : 50,
        containLabel: false,
      },
      series,
    };

    const chart = document.createElement("ha-chart-base");
    chart.hass = this._hass;

    container.innerHTML = "";
    container.appendChild(chart);

    requestAnimationFrame(() => {
      if ("chartOptions" in chart) {
        chart.chartOptions = option;
      } else if ("data" in chart && "options" in chart) {
        chart.data = series;
        chart.options = option;
      } else {
        chart.chart_options = option;
      }
    });
  }

  // ── Render ──

  render() {
    if (!this._hass) return html`<div class="loading">Loading...</div>`;
    return html`
      ${this._renderToolbar()}
      <div id="jp-content">
        ${this._activeView === "detail"
          ? this._renderDetailView()
          : this._renderMainView()}
      </div>
    `;
  }

  _renderToolbar() {
    return html`
      <div class="toolbar">
        <ha-menu-button .hass=${this._hass} .narrow=${this.narrow}></ha-menu-button>
        <div class="main-title">Juice Patrol</div>
        <ha-icon-button
          id="refreshBtn"
          class=${this._refreshing ? "spinning" : ""}
          title="Re-fetch all battery data and recalculate predictions"
          .disabled=${this._refreshing}
          @click=${this._refresh}
        >
          <ha-icon icon="mdi:refresh"></ha-icon>
        </ha-icon-button>
        <ha-icon-button title="Settings" @click=${this._toggleSettings}>
          <ha-icon icon="mdi:cog"></ha-icon>
        </ha-icon-button>
      </div>
    `;
  }

  _renderMainView() {
    const totalDevices = this._entities.length;
    let lowCount = 0, staleCount = 0, unavailableCount = 0, pendingCount = 0, anomalyCount = 0;
    for (const d of this._entities) {
      if (d.isLow) lowCount++;
      if (d.isStale) staleCount++;
      if (d.level === null) unavailableCount++;
      if (d.replacementPending) pendingCount++;
      if (d.anomaly && d.anomaly !== "normal") anomalyCount++;
    }

    return html`
      ${this._renderSummaryCards(
        totalDevices,
        lowCount,
        staleCount,
        unavailableCount,
        pendingCount,
        anomalyCount
      )}
      ${this._settingsOpen && this._configEntry ? this._renderSettings() : nothing}
      ${this._renderFilterBar()}
      ${this._renderTabBar()}
      ${this._activeView === "shopping"
        ? this._renderShoppingList()
        : this._renderDeviceTable()}
    `;
  }

  _renderSummaryCards(total, low, stale, unavailable, pending, anomaly) {
    const card = (filter, value, label, color = "inherit") => {
      const classes = {
        "summary-card": true,
        clickable: true,
        "active-filter": this._filterCategory === filter,
      };
      return html`
        <div class=${classMap(classes)} @click=${() => this._setFilter(filter)}>
          <div class="value" style="color:${value > 0 ? color : "inherit"}">${value}</div>
          <div class="label">${label}</div>
        </div>
      `;
    };

    return html`
      <div class="summary">
        <div
          class="summary-card clickable ${this._filterCategory === null
            ? "active-filter"
            : ""}"
          @click=${() => this._setFilter(null)}
        >
          <div class="value">${total}</div>
          <div class="label">Monitored</div>
        </div>
        ${card("low", low, "Low battery", "var(--error-color)")}
        ${card("stale", stale, "Stale", "var(--warning-color)")}
        ${unavailable > 0
          ? card("unavailable", unavailable, "Unavailable", "var(--disabled-text-color)")
          : nothing}
        ${pending > 0
          ? card("pending", pending, "Pending", "var(--primary-color)")
          : nothing}
        ${anomaly > 0
          ? card("anomaly", anomaly, "Anomaly", "var(--error-color)")
          : nothing}
        ${this._ignoredCount > 0
          ? card("ignored", this._ignoredCount, "Ignored", "var(--secondary-text-color)")
          : nothing}
      </div>
    `;
  }

  _renderSettings() {
    const opts = this._settingsValues;
    return html`
      <ha-card header="Settings" class="settings-card">
        <div class="card-content">
          ${this._renderSettingRow(
            "Low battery threshold",
            'Devices below this level trigger a juice_patrol_battery_low event.',
            "low_threshold",
            opts.low_threshold ?? 20,
            1,
            99,
            "%"
          )}
          ${this._renderSettingRow(
            "Stale device timeout",
            "Devices not reporting within this period are marked stale.",
            "stale_timeout",
            opts.stale_timeout ?? 48,
            1,
            720,
            "hrs"
          )}
          ${this._renderSettingRow(
            "Prediction alert horizon",
            "Alert when a device is predicted to die within this many days.",
            "prediction_horizon",
            opts.prediction_horizon ?? 7,
            1,
            90,
            "days"
          )}
        </div>
        <div class="card-actions">
          <ha-button variant="neutral" @click=${this._cancelSettings}>Cancel</ha-button>
          <ha-button
            .disabled=${!this._settingsDirty}
            @click=${this._saveSettings}
          >
            Save
          </ha-button>
        </div>
      </ha-card>
    `;
  }

  _renderSettingRow(label, desc, key, value, min, max, unit) {
    return html`
      <ha-settings-row>
        <span slot="heading">${label}</span>
        <span slot="description">${desc}</span>
        <ha-textfield
          type="number"
          .min=${String(min)}
          .max=${String(max)}
          data-key=${key}
          .value=${String(value)}
          .suffix=${unit}
          style="width: 90px"
          @input=${this._handleSettingInput}
        ></ha-textfield>
      </ha-settings-row>
    `;
  }

  _renderFilterBar() {
    const FILTER_LABELS = { low: "Low battery", stale: "Stale", unavailable: "Unavailable", pending: "Pending", anomaly: "Anomaly", ignored: "Ignored" };
    const filterLabel = FILTER_LABELS[this._filterCategory] || this._filterCategory;

    return html`
      <div class="filter-bar">
        <div class="search-field">
          <ha-icon
            icon="mdi:magnify"
            style="--mdc-icon-size:20px;color:var(--secondary-text-color)"
          ></ha-icon>
          <input
            type="text"
            placeholder="Filter devices..."
            .value=${this._filterText}
            @input=${this._handleSearchInput}
          />
          ${this._filterText
            ? html`<button
                class="search-clear"
                title="Clear search"
                @click=${this._clearSearch}
              >
                <ha-icon icon="mdi:close" style="--mdc-icon-size:16px"></ha-icon>
              </button>`
            : nothing}
        </div>
        ${this._filterCategory
          ? html`<button class="filter-chip" @click=${this._clearFilter}>
              <ha-icon
                icon="mdi:filter-remove"
                style="--mdc-icon-size:14px"
              ></ha-icon>
              ${filterLabel}
              <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
            </button>`
          : nothing}
      </div>
    `;
  }

  _renderTabBar() {
    return html`
      <div class="tab-bar">
        <button
          class="tab ${this._activeView === "devices" ? "active" : ""}"
          @click=${() => this._switchTab("devices")}
        >
          <ha-icon
            icon="mdi:battery-heart-variant"
            style="--mdc-icon-size:18px"
          ></ha-icon>
          Devices
        </button>
        <button
          class="tab ${this._activeView === "shopping" ? "active" : ""}"
          @click=${() => this._switchTab("shopping")}
        >
          <ha-icon icon="mdi:cart-outline" style="--mdc-icon-size:18px"></ha-icon>
          Shopping List
        </button>
      </div>
    `;
  }

  _renderDeviceTable() {
    if (this._filterCategory === "ignored") {
      return this._renderIgnoredDevices();
    }

    const filtered = this._getFilteredEntities();

    if (filtered.length === 0) {
      if (this._entities.length === 0 && !this._configEntry) {
        return html`<div class="devices">
          <div class="loading-state">
            <ha-spinner size="small"></ha-spinner>
            <div>Discovering battery devices\u2026</div>
          </div>
        </div>`;
      }
      return html`<div class="devices">
        <div class="empty-state">
          ${this._entities.length === 0
            ? "No battery devices discovered yet."
            : "No devices match the current filter."}
        </div>
      </div>`;
    }

    return html`
      <div class="devices">
        ${this._renderDeviceHeader()}
        ${repeat(
          filtered,
          (dev) => dev.sourceEntity,
          (dev) => this._renderDeviceRow(dev)
        )}
      </div>
    `;
  }

  _renderIgnoredDevices() {
    const devices = this._ignoredEntities;
    if (!devices) {
      return html`<div class="devices">
        <div class="empty-state">Loading ignored devices\u2026</div>
      </div>`;
    }
    if (devices.length === 0) {
      return html`<div class="devices">
        <div class="empty-state">No ignored devices.</div>
      </div>`;
    }
    return html`
      <div class="devices">
        ${repeat(
          devices,
          (d) => d.entity_id,
          (d) => html`
            <div class="ignored-row">
              <ha-icon
                icon="mdi:eye-off"
                style="--mdc-icon-size:20px; color:var(--secondary-text-color)"
              ></ha-icon>
              <div class="ignored-info">
                <div class="ignored-name">${d.name}</div>
                <div class="ignored-entity">${d.entity_id}</div>
              </div>
              ${d.level !== null
                ? html`<div class="ignored-level">${Math.round(d.level)}%</div>`
                : nothing}
              <ha-button
                @click=${() => this._unignoreDevice(d.entity_id)}
                title="Stop ignoring this device"
              >
                <ha-icon slot="start" icon="mdi:eye"></ha-icon>
                Restore
              </ha-button>
            </div>
          `
        )}
      </div>
    `;
  }

  _renderSortHeader(col, label, opts = {}) {
    const active = this._sortCol === col;
    const arrow = active ? (this._sortAsc ? "\u25B2" : "\u25BC") : "";
    return html`
      <div
        class="sort-header ${active ? "active" : ""}"
        style=${opts.style || ""}
        title=${opts.title || ""}
        @click=${(e) => {
          e.stopPropagation();
          this._toggleSort(col);
        }}
      >
        ${label}${arrow ? html`<span class="sort-arrow">${arrow}</span>` : nothing}
      </div>
    `;
  }

  _renderDeviceHeader() {
    return html`
      <div class="device-header">
        <div></div>
        ${this._renderSortHeader("name", "Device", {
          style: "justify-content:flex-start",
        })}
        ${this._renderSortHeader("level", "Level", {
          style: "justify-content:flex-start",
        })}
        ${this._renderSortHeader("type", "Type", {
          style: "justify-content:flex-start",
        })}
        ${this._renderSortHeader("rate", "Rate")}
        ${this._renderSortHeader("days", "Left")}
        ${this._renderSortHeader("reliability", "Rel", {
          title: "Prediction reliability score (0-100%)",
        })}
        ${this._renderSortHeader("empty", "Empty by")}
        <div></div>
      </div>
    `;
  }

  _renderDeviceRow(dev) {
    const changeEntry = this._recentlyChanged.get(dev.sourceEntity);
    const classes = {
      "device-row": true,
      attention:
        !dev.replacementPending &&
        (dev.isLow || dev.isStale || (dev.anomaly && dev.anomaly !== "normal")),
      pending: dev.replacementPending,
      "just-updated-up": changeEntry?.dir === "up",
      "just-updated-down": changeEntry?.dir === "down",
    };

    return html`
      <div
        class=${classMap(classes)}
        data-entity=${dev.sourceEntity}
        @click=${() => this._handleRowClick(dev.sourceEntity)}
      >
        <div class="icon-cell">
          <ha-icon
            icon=${this._getBatteryIcon(dev)}
            style="color:${this._getLevelColor(dev.level, dev.threshold)}"
          ></ha-icon>
        </div>
        <div class="name-cell">
          <div>${dev.name || dev.sourceEntity}${this._renderBadges(dev)}</div>
          ${this._renderDeviceSub(dev)}
        </div>
        ${this._renderLevelCell(dev)}
        <div
          class="type-cell"
          title=${dev.batteryTypeSource ? `Source: ${dev.batteryTypeSource}` : ""}
        >
          ${dev.batteryType || "\u2014"}
        </div>
        <div class="data-cell">${this._formatRate(dev)}</div>
        <div class="data-cell">${this._formatTimeRemaining(dev)}</div>
        <div class="data-cell reliability-cell">${this._renderReliabilityBadge(dev)}</div>
        <div class="data-cell">
          ${dev.predictedEmpty
            ? this._formatDate(dev.predictedEmpty, this._isFastDischarge(dev))
            : "\u2014"}
        </div>
        <div class="action-cell">
          <ha-dropdown
              @wa-select=${(e) => this._handleMenuSelect(e, dev.sourceEntity)}
            >
              <ha-icon-button
                slot="trigger"
                @click=${(e) => {
                  e.stopPropagation();
                  const dd = e.currentTarget.closest("ha-dropdown");
                  if (dd) dd.open ? dd.hideMenu() : dd.showMenu();
                }}
              >
                <ha-icon icon="mdi:dots-vertical"></ha-icon>
              </ha-icon-button>
              ${this._renderDropdownItems(dev)}
            </ha-dropdown>
        </div>
      </div>
    `;
  }

  _renderBadges(dev) {
    const badges = [];
    if (dev.replacementPending) {
      const label = dev.isRechargeable ? "RECHARGED?" : "REPLACED?";
      const title = dev.isRechargeable
        ? "Battery level jumped significantly \u2014 normal recharge cycle?"
        : "Battery level jumped significantly \u2014 was the battery replaced?";
      badges.push(html`<span class="badge replaced" title=${title}>${label}</span>`);
    }
    if (dev.isLow) {
      const t = dev.threshold ?? this._settingsValues.low_threshold ?? 20;
      badges.push(
        html`<span
          class="badge low"
          title="Battery is at ${this._displayLevel(dev.level)}%, below the ${t}% threshold"
          >LOW</span
        >`
      );
    }
    if (dev.isStale) {
      badges.push(
        html`<span
          class="badge stale"
          title="No battery reading received within the stale timeout period"
          >STALE</span
        >`
      );
    }
    if (dev.anomaly === "cliff") {
      badges.push(
        html`<span
          class="badge cliff"
          title="Sudden drop of ${dev.dropSize ?? "?"}% in a single reading interval"
          >CLIFF DROP</span
        >`
      );
    } else if (dev.anomaly === "rapid") {
      badges.push(
        html`<span
          class="badge rapid"
          title="Discharge rate significantly higher than average \u2014 ${dev.dropSize ??
          "?"}% drop"
          >RAPID</span
        >`
      );
    }
    if (dev.stability === "erratic") {
      badges.push(
        html`<span class="badge erratic" title=${this._erraticTooltip(dev)}
          >ERRATIC</span
        >`
      );
    }
    const skipReasons = dev.isRechargeable ? new Set(["flat", "charging"]) : new Set();
    if (!dev.predictedEmpty && this._predictionReason(dev) && !skipReasons.has(dev.predictionStatus)) {
      const reason = this._predictionReason(dev);
      badges.push(
        html`<span
          class="badge prediction-reason"
          title=${this._predictionReasonDetail(dev.predictionStatus) || ""}
          >No prediction: ${reason}</span
        >`
      );
    }
    if (dev.isRechargeable) {
      if (this._isActivelyCharging(dev)) {
        badges.push(
          html`<span class="badge charging" title="Currently charging">
            <ha-icon
              icon="mdi:battery-charging"
              style="--mdc-icon-size:14px"
            ></ha-icon>
            Charging
          </span>`
        );
      } else {
        badges.push(
          html`<span
            class="badge rechargeable"
            title="Rechargeable: ${dev.rechargeableReason || "detected"}"
          >
            <ha-icon
              icon="mdi:power-plug-battery"
              style="--mdc-icon-size:14px"
            ></ha-icon>
          </span>`
        );
      }
    }
    if (
      dev.meanLevel !== null &&
      dev.stability &&
      dev.stability !== "stable" &&
      dev.stability !== "insufficient_data"
    ) {
      const displayMean = this._displayLevel(dev.meanLevel);
      const displayLevel = this._displayLevel(dev.level);
      if (displayMean !== null && Math.abs(displayMean - (displayLevel ?? 0)) > 2) {
        badges.push(
          html`<span
            class="badge avg"
            title="7-day average is ${displayMean}% while current reading is ${displayLevel ??
            "?"}%"
            >avg ${displayMean}%</span
          >`
        );
      }
    }
    return badges;
  }

  _renderDeviceSub(dev) {
    const parts = [];
    const nameLC = (dev.name || "").toLowerCase();
    if (dev.manufacturer && !nameLC.includes(dev.manufacturer.toLowerCase())) {
      parts.push(dev.manufacturer);
    }
    if (dev.model && !nameLC.includes(dev.model.toLowerCase())) {
      parts.push(dev.model);
    }
    let sub = parts.join(" ");
    if (sub && dev.platform) {
      sub += ` \u00b7 ${dev.platform}`;
    } else if (!sub && dev.platform) {
      sub = dev.platform;
    }
    if (!sub) return nothing;
    return html`<div class="name-sub">${sub}</div>`;
  }

  _renderLevelCell(dev) {
    const color = this._getLevelColor(dev.level, dev.threshold);
    return html`<div class="level-cell" style="color:${color}">${this._formatLevel(dev.level)}</div>`;
  }

  _renderReliabilityBadge(dev) {
    const r = dev.reliability;
    const hasTimePrediction = dev.daysRemaining !== null || dev.hoursRemaining !== null;
    if (r === null || r === undefined || !hasTimePrediction) return "\u2014";
    const cls = r >= 70 ? "high" : r >= 40 ? "medium" : "low";
    return html`<span
      class="reliability-badge ${cls}"
      title="Prediction reliability: ${r}%"
      >${r}%</span
    >`;
  }

  // ── Dropdown Menu Items ──

  _renderDropdownItems(dev) {
    return html`
      <ha-dropdown-item value="detail">
        <ha-icon slot="icon" icon="mdi:information-outline"></ha-icon>
        More info
      </ha-dropdown-item>
      <wa-divider></wa-divider>
      ${dev?.replacementPending ? html`
      <ha-dropdown-item value="confirm">
        <ha-icon slot="icon" icon="mdi:check-circle-outline"></ha-icon>
        Confirm replacement
      </ha-dropdown-item>` : nothing}
      <ha-dropdown-item value="replace">
        <ha-icon slot="icon" icon="mdi:battery-sync"></ha-icon>
        Mark as replaced
      </ha-dropdown-item>
      ${dev?.lastReplaced ? html`
      <ha-dropdown-item value="undo-replace">
        <ha-icon slot="icon" icon="mdi:undo"></ha-icon>
        Undo replacement
      </ha-dropdown-item>` : nothing}
      <ha-dropdown-item value="recalculate">
        <ha-icon slot="icon" icon="mdi:calculator-variant"></ha-icon>
        Recalculate
      </ha-dropdown-item>
      <ha-dropdown-item value="type">
        <ha-icon slot="icon" icon="mdi:battery-heart-variant"></ha-icon>
        Set battery type${dev?.batteryType ? ` (${dev.batteryType})` : ""}
      </ha-dropdown-item>
      <wa-divider></wa-divider>
      <ha-dropdown-item value="ignore">
        <ha-icon slot="icon" icon="mdi:eye-off"></ha-icon>
        Ignore device
      </ha-dropdown-item>
    `;
  }

  // ── Shopping List ──

  _renderShoppingList() {
    if (this._shoppingLoading) {
      return html`<div class="devices">
        <div class="empty-state">Loading shopping list...</div>
      </div>`;
    }
    if (!this._shoppingData || !this._shoppingData.groups) {
      return html`<div class="devices">
        <div class="empty-state">
          No shopping data available. Click refresh to load.
        </div>
      </div>`;
    }

    const { groups, total_needed } = this._shoppingData;
    if (groups.length === 0) {
      return html`<div class="devices">
        <div class="empty-state">No battery devices found.</div>
      </div>`;
    }

    return html`
      <div class="shopping-summary">
        <div class="summary-card">
          <div
            class="value"
            style="color:${total_needed > 0
              ? "var(--warning-color)"
              : "var(--success-color)"}"
          >
            ${total_needed}
          </div>
          <div class="label">Batteries needed</div>
        </div>
        ${groups
          .filter((g) => g.needs_replacement > 0 && g.battery_type !== "Unknown")
          .map(
            (g) => html`
              <div class="summary-card shopping-need-card">
                <div class="value">${g.needs_replacement}</div>
                <div class="label">${g.battery_type}</div>
              </div>
            `
          )}
      </div>
      <div class="shopping-groups">
        ${groups.map((group) => this._renderShoppingGroup(group))}
      </div>
      ${groups.some((g) => g.battery_type === "Unknown")
        ? html`<div class="shopping-hint">
            <ha-icon
              icon="mdi:information-outline"
              style="--mdc-icon-size:16px"
            ></ha-icon>
            Devices with unknown battery type can be configured from the Devices tab.
          </div>`
        : nothing}
    `;
  }

  _renderShoppingGroup(group) {
    const isUnknown = group.battery_type === "Unknown";
    const icon = isUnknown ? "mdi:help-circle-outline" : "mdi:battery";
    const isExpanded = !!this._expandedGroups[group.battery_type];
    const countText = `${group.battery_count} batter${group.battery_count !== 1 ? "ies" : "y"} in ${group.device_count} device${group.device_count !== 1 ? "s" : ""}${group.needs_replacement > 0 ? ` \u2014 ${group.needs_replacement} need${group.needs_replacement !== 1 ? "" : "s"} replacement` : ""}`;

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e) => {
          const next = { ...this._expandedGroups };
          if (e.detail.expanded) { next[group.battery_type] = true; }
          else { delete next[group.battery_type]; }
          this._expandedGroups = next;
        }}
      >
        <ha-icon slot="leading-icon" icon=${icon} style="--mdc-icon-size:20px"></ha-icon>
        <span slot="header" class="shopping-type">${group.battery_type}</span>
        <span slot="secondary">
          ${group.needs_replacement > 0
            ? html`<span class="shopping-need-badge">${group.needs_replacement}\u00d7</span> `
            : nothing}
          ${countText}
        </span>
        <div class="shopping-devices-inner">
          ${group.devices.map((d) => {
            const levelColor = this._getLevelColor(d.level, null);
            const needsIt =
              d.is_low ||
              (d.days_remaining !== null &&
                d.days_remaining <= (this._settingsValues.prediction_horizon ?? 7));
            const countLabel = d.battery_count > 1 ? ` (${d.battery_count}\u00d7)` : "";
            return html`
              <div class="shopping-device ${needsIt ? "needs-replacement" : ""}">
                <span class="shopping-device-name"
                  >${d.device_name}${countLabel}</span
                >
                <span class="shopping-device-level" style="color:${levelColor}">
                  ${this._formatLevel(d.level)}
                </span>
                <span class="shopping-device-days">
                  ${d.days_remaining !== null ? d.days_remaining + "d" : "\u2014"}
                </span>
              </div>
            `;
          })}
        </div>
      </ha-expansion-panel>
    `;
  }

  // ── Detail View ──

  _renderDetailView() {
    const entityId = this._detailEntity;
    const dev = this._getDevice(entityId);
    if (!dev) {
      // Device disappeared — updated() will close the detail view
      return html`<div class="empty-state">Device not found</div>`;
    }

    const deviceName = dev.name || entityId;

    return html`
      <div class="detail-toolbar">
        <ha-button variant="neutral" @click=${this._closeDetail}>
          <ha-icon slot="start" icon="mdi:arrow-left"></ha-icon>
          Back
        </ha-button>
        <div class="detail-device-name">${deviceName}</div>
      </div>
      ${this._renderDetailMeta(dev)} ${this._renderDetailChart()}
      ${this._renderDetailActions()}
    `;
  }

  _renderDetailMeta(dev) {
    const cd = this._chartData;
    const pred = cd?.prediction || {};

    const statusTexts = {
      normal: "Normal discharge",
      charging: "Currently charging",
      flat: "Flat \u2014 no significant discharge detected",
      noisy: "Noisy \u2014 data too irregular for prediction",
      insufficient_data: "Not enough data for prediction",
      single_level: "Single level \u2014 all readings identical",
      insufficient_range: "Insufficient range \u2014 readings too close together",
    };
    const statusText = statusTexts[pred.status] || pred.status || "Unknown";

    const levelColor = this._getLevelColor(dev.level, dev.threshold);

    return html`
      <div class="detail-meta">
        <div class="detail-meta-grid">
          <div class="detail-meta-item">
            <div class="detail-meta-label">Current Level</div>
            <div class="detail-meta-value" style="color:${levelColor}">
              ${this._formatLevel(dev.level)}
            </div>
          </div>
          <div class="detail-meta-item">
            <div class="detail-meta-label">Battery Type</div>
            <div class="detail-meta-value">${dev.batteryType || "\u2014"}</div>
          </div>
          <div class="detail-meta-item">
            <div class="detail-meta-label">Discharge Rate</div>
            <div class="detail-meta-value">${this._formatRate(dev)}</div>
          </div>
          <div class="detail-meta-item">
            <div class="detail-meta-label">Time Remaining</div>
            <div class="detail-meta-value">${this._formatTimeRemaining(dev)}</div>
          </div>
          <div class="detail-meta-item">
            <div class="detail-meta-label">Status</div>
            <div class="detail-meta-value">${statusText}</div>
          </div>
          <div class="detail-meta-item">
            <div class="detail-meta-label">Confidence</div>
            <div class="detail-meta-value">
              <span class="confidence-dot ${pred.confidence || ""}"></span>
              ${pred.confidence || "\u2014"}
            </div>
          </div>
          ${pred.r_squared != null
            ? html`<div class="detail-meta-item">
                <div class="detail-meta-label" title="How well the trend line fits the data. 1.0 = perfect fit, 0.0 = no pattern. Above 0.7 is a good fit, below 0.3 means the data is too scattered for a reliable prediction.">R\u00b2</div>
                <div class="detail-meta-value">${pred.r_squared.toFixed(3)}</div>
              </div>`
            : nothing}
          ${pred.reliability != null
            ? html`<div class="detail-meta-item">
                <div class="detail-meta-label">Reliability</div>
                <div class="detail-meta-value">${this._renderReliabilityBadge(dev)}</div>
              </div>`
            : nothing}
          <div class="detail-meta-item">
            <div class="detail-meta-label">Data Points</div>
            <div class="detail-meta-value">
              ${pred.data_points_used ?? (cd?.readings?.length ?? "\u2014")}
            </div>
          </div>
          ${cd?.charge_prediction?.estimated_full_timestamp
            ? html`<div class="detail-meta-item">
                <div class="detail-meta-label">Predicted Full</div>
                <div class="detail-meta-value">
                  ${this._formatDate(cd.charge_prediction.estimated_full_timestamp * 1000, true)}
                </div>
              </div>`
            : dev.predictedEmpty
            ? html`<div class="detail-meta-item">
                <div class="detail-meta-label">Predicted Empty</div>
                <div class="detail-meta-value">
                  ${this._formatDate(dev.predictedEmpty, this._isFastDischarge(dev))}
                </div>
              </div>`
            : nothing}
          ${dev.lastCalculated
            ? html`<div class="detail-meta-item">
                <div class="detail-meta-label">Last Calculated</div>
                <div class="detail-meta-value">
                  ${this._formatDate(dev.lastCalculated * 1000, true)}
                </div>
              </div>`
            : nothing}
        </div>
        ${!dev.predictedEmpty && pred.status && pred.status !== "normal"
          ? html`<div class="detail-reason">
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size:18px; color:var(--secondary-text-color); flex-shrink:0"></ha-icon>
              <div>
                <strong>Why is there no prediction?</strong>
                <div class="detail-reason-text">${this._predictionReasonDetail(pred.status) || "Unknown reason."}</div>
              </div>
            </div>`
          : nothing}
      </div>
    `;
  }

  _renderDetailChart() {
    if (this._chartLoading) {
      return html`
        <div class="detail-chart" id="jp-chart">
          <div class="loading-state">
            <ha-spinner size="small"></ha-spinner>
            <div>Loading chart data\u2026</div>
          </div>
        </div>
      `;
    }
    const hasReadings =
      this._chartData && this._chartData.readings && this._chartData.readings.length > 0;
    if (!hasReadings) {
      return html`
        <div class="detail-chart" id="jp-chart">
          <div class="empty-state">Not enough data yet to display a chart.</div>
        </div>
      `;
    }
    return html`<div class="detail-chart" id="jp-chart"></div>`;
  }

  _renderDetailActions() {
    const entityId = this._detailEntity;
    if (!entityId) return nothing;
    const dev = this._getDevice(entityId);

    return html`
      <div class="detail-actions">
        <ha-button
          @click=${() => {
            this.dispatchEvent(
              new CustomEvent("hass-more-info", {
                bubbles: true,
                composed: true,
                detail: { entityId },
              })
            );
          }}
        >
          <ha-icon slot="start" icon="mdi:information-outline"></ha-icon>
          More info
        </ha-button>
        <ha-button
          @click=${() => this._markReplaced(entityId)}
        >
          <ha-icon slot="start" icon="mdi:battery-sync"></ha-icon>
          Mark as replaced
        </ha-button>
        ${dev?.lastReplaced ? html`
        <ha-button variant="danger"
          @click=${() => this._undoReplacement(entityId)}
        >
          <ha-icon slot="start" icon="mdi:undo"></ha-icon>
          Undo replacement
        </ha-button>` : nothing}
        <ha-button
          @click=${async () => {
            await this._recalculate(entityId);
            setTimeout(() => this._loadChartData(entityId), 500);
          }}
        >
          <ha-icon slot="start" icon="mdi:calculator-variant"></ha-icon>
          Recalculate
        </ha-button>
        <ha-button
          @click=${() => this._setBatteryType(entityId, dev?.batteryType)}
        >
          <ha-icon slot="start" icon="mdi:battery-heart-variant"></ha-icon>
          Set battery type
        </ha-button>
        <ha-button
          @click=${() => this._ignoreDevice(entityId)}
        >
          <ha-icon slot="start" icon="mdi:eye-off"></ha-icon>
          Ignore device
        </ha-button>
      </div>
    `;
  }

  // ── Styles ──

  static get styles() {
    return css`
      :host {
        display: block;
        font-family: var(--primary-font-family, Roboto, sans-serif);
        color: var(--primary-text-color);
        background: var(--primary-background-color);
        --card-bg: var(--ha-card-background, var(--card-background-color, #fff));
        --border: var(--divider-color, rgba(0, 0, 0, 0.12));
        height: 100%;
        overflow: hidden;
      }
      .toolbar {
        display: flex;
        align-items: center;
        font-size: 20px;
        height: var(--header-height, 56px);
        font-weight: 400;
        color: var(
          --sidebar-text-color,
          var(--app-header-text-color, var(--primary-text-color))
        );
        background-color: var(
          --sidebar-background-color,
          var(--app-header-background-color, var(--primary-background-color))
        );
        border-bottom: 1px solid var(--divider-color);
        box-sizing: border-box;
        padding: 8px 12px;
        position: sticky;
        top: 0;
        z-index: 5;
      }
      .toolbar ha-menu-button {
        pointer-events: auto;
        color: var(--sidebar-icon-color);
      }
      .toolbar .main-title {
        margin-inline-start: 24px;
        line-height: 1.5;
        flex-grow: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .toolbar ha-icon-button {
        color: var(--sidebar-icon-color, var(--secondary-text-color));
      }
      #jp-content {
        padding: 16px;
        height: calc(100% - var(--header-height, 56px));
        overflow-y: auto;
        box-sizing: border-box;
      }
      .summary {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .summary-card {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 16px 20px;
        min-width: 120px;
        border: 1px solid var(--border);
      }
      .summary-card.clickable {
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .summary-card.clickable:hover {
        border-color: var(--primary-color);
      }
      .summary-card.active-filter {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 1px var(--primary-color);
      }
      .filter-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
      }
      .search-field {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--card-bg);
      }
      .search-field:focus-within {
        border-color: var(--primary-color);
      }
      .search-field input {
        flex: 1;
        border: none;
        background: none;
        outline: none;
        font-size: 14px;
        color: var(--primary-text-color);
        font-family: inherit;
      }
      .search-field input::placeholder {
        color: var(--secondary-text-color);
      }
      .search-clear {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        border-radius: 50%;
      }
      .search-clear:hover {
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
      }
      .filter-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 10px;
        border: 1px solid var(--primary-color);
        border-radius: 16px;
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
        color: var(--primary-color);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        font-family: inherit;
      }
      .filter-chip:hover {
        background: color-mix(in srgb, var(--primary-color) 20%, transparent);
      }
      .summary-card .value {
        font-size: 28px;
        font-weight: 500;
      }
      .summary-card .label {
        font-size: 13px;
        color: var(--secondary-text-color);
        margin-top: 2px;
      }
      .settings-card {
        margin-bottom: 20px;
      }
      .settings-card ha-textfield {
        --text-field-padding: 0 8px;
      }
      .devices {
        background: var(--card-bg);
        border-radius: 12px;
        border: 1px solid var(--border);
        overflow: hidden;
      }
      .device-row {
        display: grid;
        grid-template-columns: 44px 1fr 90px 70px 80px 90px 50px 100px 56px;
        align-items: center;
        padding: 10px 16px;
        gap: 6px;
        border-bottom: 1px solid var(--border);
        cursor: pointer;
      }
      .device-row:last-child {
        border-bottom: none;
      }
      .device-row:hover {
        background: var(--secondary-background-color);
      }
      .device-row.attention {
        background: color-mix(in srgb, var(--error-color, #db4437) 8%, transparent);
      }
      .device-row.attention:hover {
        background: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent);
      }
      .device-row.pending {
        background: color-mix(in srgb, var(--primary-color) 8%, transparent);
      }
      .device-row.pending:hover {
        background: color-mix(in srgb, var(--primary-color) 14%, transparent);
      }
      .ignored-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
      }
      .ignored-row:last-child {
        border-bottom: none;
      }
      .ignored-info {
        flex: 1;
        min-width: 0;
      }
      .ignored-name {
        font-size: 14px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ignored-entity {
        font-size: 12px;
        color: var(--secondary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ignored-level {
        font-size: 14px;
        color: var(--secondary-text-color);
        white-space: nowrap;
      }
      .device-header {
        display: grid;
        grid-template-columns: 44px 1fr 90px 70px 80px 90px 50px 100px 56px;
        padding: 10px 16px;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid var(--border);
      }
      .icon-cell {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .icon-cell ha-icon {
        --mdc-icon-size: 24px;
      }
      .name-cell {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
      }
      .name-sub {
        font-size: 11px;
        color: var(--secondary-text-color);
        opacity: 0.7;
        margin-top: 1px;
      }
      .badge {
        display: inline-block;
        font-size: 9px;
        padding: 1px 5px;
        border-radius: 4px;
        margin-left: 4px;
        font-weight: 500;
        vertical-align: middle;
      }
      .badge.low {
        background: color-mix(in srgb, var(--error-color) 20%, transparent);
        color: var(--error-color);
      }
      .badge.stale {
        background: color-mix(in srgb, var(--warning-color) 20%, transparent);
        color: var(--warning-color);
      }
      .badge.replaced {
        background: color-mix(in srgb, var(--primary-color) 20%, transparent);
        color: var(--primary-color);
      }
      .badge.cliff,
      .badge.rapid {
        background: color-mix(in srgb, var(--error-color) 15%, transparent);
        color: var(--error-color);
      }
      .badge.erratic {
        background: color-mix(in srgb, var(--warning-color) 15%, transparent);
        color: var(--warning-color);
      }
      .badge.noisy {
        background: color-mix(in srgb, var(--warning-color) 15%, transparent);
        color: var(--warning-color);
      }
      .badge.rechargeable {
        background: color-mix(
          in srgb,
          var(--success-color, #43a047) 15%,
          transparent
        );
        color: var(--success-color, #43a047);
        padding: 2px 5px;
        display: inline-flex;
        align-items: center;
      }
      .badge.charging {
        background: color-mix(
          in srgb,
          var(--success-color, #43a047) 20%,
          transparent
        );
        color: var(--success-color, #43a047);
        padding: 2px 5px;
        display: inline-flex;
        align-items: center;
        gap: 2px;
      }
      .badge.avg {
        background: color-mix(in srgb, var(--info-color, #039be5) 15%, transparent);
        color: var(--info-color, #039be5);
      }
      .level-cell {
        font-size: 14px;
        font-weight: 500;
        text-align: left;
      }
      .data-cell {
        font-size: 13px;
        color: var(--secondary-text-color);
        text-align: right;
      }
      .action-cell {
        display: flex;
        justify-content: center;
      }
      .action-btn {
        background: none;
        border: 1px solid var(--border);
        border-radius: 6px;
        cursor: pointer;
        padding: 4px 6px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        font-family: inherit;
      }
      .action-btn:hover {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
      }
      .action-btn.confirm {
        border-color: var(--primary-color);
        color: var(--primary-color);
      }
      .confidence-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        margin-right: 4px;
        vertical-align: middle;
      }
      .confidence-dot.high {
        background: var(--success-color);
      }
      .confidence-dot.medium {
        background: var(--warning-color);
      }
      .confidence-dot.low {
        background: var(--error-color);
      }
      .sort-header {
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 2px;
        justify-content: flex-end;
      }
      .sort-header:first-of-type {
        justify-content: flex-start;
      }
      .sort-header:hover {
        color: var(--primary-text-color);
      }
      .sort-header.active {
        color: var(--primary-color);
      }
      .sort-arrow {
        font-size: 10px;
      }
      .type-cell {
        font-size: 12px;
        color: var(--secondary-text-color);
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .empty-state {
        padding: 40px;
        text-align: center;
        color: var(--secondary-text-color);
      }
      .loading-state {
        padding: 32px;
        text-align: center;
        color: var(--secondary-text-color);
      }
      .loading-state ha-spinner {
        margin-bottom: 8px;
      }
      ha-dropdown {
        --ha-dropdown-font-size: 14px;
      }
      .jp-dialog-desc {
        font-size: 13px;
        color: var(--secondary-text-color);
        margin-bottom: 12px;
      }
      .jp-dialog-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--primary-background-color);
        color: var(--primary-text-color);
        font-size: 14px;
        outline: none;
        box-sizing: border-box;
      }
      .jp-dialog-input:focus {
        border-color: var(--primary-color);
      }
      .jp-dialog-presets {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 12px;
      }
      .jp-preset {
        padding: 4px 10px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
        font-size: 12px;
        cursor: pointer;
        font-family: inherit;
      }
      .jp-preset:hover:not([disabled]) {
        border-color: var(--primary-color);
        color: var(--primary-color);
      }
      .jp-preset.active {
        border-color: var(--primary-color);
        background: color-mix(in srgb, var(--primary-color) 15%, transparent);
        color: var(--primary-color);
      }
      .jp-preset.disabled {
        opacity: 0.35;
        cursor: default;
      }
      .jp-badge-field {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        min-height: 40px;
        padding: 8px 10px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--primary-background-color);
        align-items: center;
        margin-bottom: 12px;
      }
      .jp-badge-chip {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 4px 10px;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 500;
        background: color-mix(in srgb, var(--primary-color) 15%, transparent);
        color: var(--primary-color);
        cursor: pointer;
        user-select: none;
        border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
      }
      .jp-badge-chip:hover {
        background: color-mix(in srgb, var(--error-color) 15%, transparent);
        color: var(--error-color);
        border-color: color-mix(in srgb, var(--error-color) 30%, transparent);
      }
      .jp-badge-placeholder {
        color: var(--secondary-text-color);
        font-size: 13px;
        font-style: italic;
      }
      .jp-dialog-or {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin: 12px 0 6px;
        text-align: center;
      }
      .jp-rechargeable-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        user-select: none;
      }
      .jp-rechargeable-toggle:hover {
        border-color: var(--primary-color);
      }
      .jp-rechargeable-toggle ha-icon {
        color: var(--secondary-text-color);
      }
      .jp-rechargeable-toggle:has(input:checked) {
        border-color: var(--success-color, #43a047);
        background: color-mix(
          in srgb,
          var(--success-color, #43a047) 8%,
          transparent
        );
      }
      .jp-rechargeable-toggle:has(input:checked) ha-icon {
        color: var(--success-color, #43a047);
      }
      .jp-dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 20px;
      }
      @keyframes jp-flash-up {
        0% {
          background: color-mix(
            in srgb,
            var(--success-color, #43a047) 25%,
            transparent
          );
        }
        100% {
          background: transparent;
        }
      }
      @keyframes jp-flash-down {
        0% {
          background: color-mix(
            in srgb,
            var(--warning-color, #ffa726) 25%,
            transparent
          );
        }
        100% {
          background: transparent;
        }
      }
      @keyframes jp-flash-up-attention {
        0% {
          background: color-mix(
            in srgb,
            var(--success-color, #43a047) 25%,
            transparent
          );
        }
        100% {
          background: color-mix(
            in srgb,
            var(--error-color, #db4437) 8%,
            transparent
          );
        }
      }
      @keyframes jp-flash-down-attention {
        0% {
          background: color-mix(
            in srgb,
            var(--warning-color, #ffa726) 25%,
            transparent
          );
        }
        100% {
          background: color-mix(
            in srgb,
            var(--error-color, #db4437) 8%,
            transparent
          );
        }
      }
      .device-row.just-updated-up {
        animation: jp-flash-up 2.5s ease-out;
      }
      .device-row.just-updated-down {
        animation: jp-flash-down 2.5s ease-out;
      }
      .device-row.attention.just-updated-up {
        animation: jp-flash-up-attention 2.5s ease-out;
      }
      .device-row.attention.just-updated-down {
        animation: jp-flash-down-attention 2.5s ease-out;
      }
      @keyframes jp-highlight-pulse {
        0% {
          background: color-mix(in srgb, var(--primary-color) 30%, transparent);
        }
        50% {
          background: color-mix(in srgb, var(--primary-color) 10%, transparent);
        }
        100% {
          background: transparent;
        }
      }
      .device-row.highlighted {
        animation: jp-highlight-pulse 3s ease-out;
      }
      @keyframes jp-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      ha-icon-button.spinning ha-icon {
        animation: jp-spin 1s linear infinite;
      }
      .reliability-cell {
        text-align: center !important;
      }
      .reliability-badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 500;
        padding: 1px 6px;
        border-radius: 8px;
      }
      .reliability-badge.high {
        background: color-mix(
          in srgb,
          var(--success-color, #43a047) 15%,
          transparent
        );
        color: var(--success-color, #43a047);
      }
      .reliability-badge.medium {
        background: color-mix(
          in srgb,
          var(--warning-color, #ffa726) 15%,
          transparent
        );
        color: var(--warning-color, #ffa726);
      }
      .reliability-badge.low {
        background: color-mix(
          in srgb,
          var(--disabled-text-color, #999) 15%,
          transparent
        );
        color: var(--disabled-text-color, #999);
      }
      .tab-bar {
        display: flex;
        gap: 0;
        margin-bottom: 16px;
        border-bottom: 2px solid var(--border);
      }
      .tab {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 20px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--secondary-text-color);
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        font-family: inherit;
      }
      .tab:hover {
        color: var(--primary-text-color);
      }
      .tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }
      .shopping-summary {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }
      .shopping-groups {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .shopping-type {
        font-size: 16px;
        font-weight: 500;
      }
      .shopping-devices-inner {
        padding: 0 8px;
      }
      .shopping-device {
        display: grid;
        grid-template-columns: 1fr 60px 60px;
        padding: 8px 0;
        border-top: 1px solid var(--border);
        font-size: 13px;
        align-items: center;
      }
      .shopping-device.needs-replacement {
        color: var(--error-color);
      }
      .shopping-device-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .shopping-device-level {
        text-align: right;
        font-weight: 500;
      }
      .shopping-device-days {
        text-align: right;
        color: var(--secondary-text-color);
      }
      .shopping-need-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 24px;
        padding: 0 6px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        background: color-mix(
          in srgb,
          var(--error-color, #db4437) 15%,
          transparent
        );
        color: var(--error-color, #db4437);
      }
      .shopping-need-card {
        min-width: 80px;
        text-align: center;
      }
      .shopping-need-card .value {
        font-size: 22px;
      }
      .shopping-need-card .label {
        font-size: 11px;
      }
      .shopping-hint {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding: 12px 16px;
        background: color-mix(in srgb, var(--info-color, #039be5) 10%, transparent);
        border-radius: 8px;
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .detail-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
      }
      .detail-device-name {
        font-size: 18px;
        font-weight: 500;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .detail-meta {
        background: var(--card-bg);
        border-radius: 12px;
        border: 1px solid var(--border);
        padding: 16px;
        margin-bottom: 16px;
      }
      .detail-meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 16px;
      }
      .detail-meta-label {
        font-size: 12px;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .detail-meta-value {
        font-size: 15px;
        font-weight: 500;
      }
      .detail-reason {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        margin-top: 12px;
        padding: 12px 14px;
        background: color-mix(in srgb, var(--info-color, #039be5) 8%, transparent);
        border-radius: 8px;
        font-size: 14px;
        line-height: 1.5;
      }
      .detail-reason strong {
        display: block;
        margin-bottom: 2px;
      }
      .detail-reason-text {
        color: var(--secondary-text-color);
      }
      .prediction-reason {
        display: inline-block;
        font-size: 9px;
        padding: 1px 5px;
        border-radius: 4px;
        font-weight: 500;
        background: color-mix(in srgb, var(--secondary-text-color) 15%, transparent);
        color: var(--secondary-text-color);
      }
      .detail-chart {
        background: var(--card-bg);
        border-radius: 12px;
        border: 1px solid var(--border);
        padding: 16px;
        margin-bottom: 16px;
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .detail-chart ha-chart-base {
        width: 100%;
        height: 380px;
        display: block;
      }
      .detail-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      @media (max-width: 900px) {
        .device-row,
        .device-header {
          grid-template-columns: 36px 1fr 60px 56px;
        }
        .type-cell,
        .reliability-cell,
        .device-row > :nth-child(n + 5):not(.action-cell),
        .device-header > :nth-child(n + 5):not(:last-child) {
          display: none;
        }
      }
      @media (max-width: 500px) {
        #jp-content {
          padding: 10px;
        }
        .summary {
          gap: 8px;
        }
        .summary-card {
          padding: 10px 14px;
          min-width: 70px;
        }
        .summary-card .value {
          font-size: 22px;
        }
        .summary-card .label {
          font-size: 11px;
        }
        .device-row,
        .device-header {
          grid-template-columns: 30px 1fr 48px 40px;
          padding: 8px 10px;
          gap: 4px;
        }
        .icon-cell ha-icon {
          --mdc-icon-size: 20px;
        }
        .name-cell {
          font-size: 13px;
        }
        .badge {
          font-size: 8px;
          padding: 1px 4px;
        }
        .filter-bar {
          gap: 6px;
        }
        .search-field {
          padding: 6px 10px;
        }
        .tab {
          padding: 8px 14px;
          font-size: 13px;
        }
        .shopping-summary {
          flex-wrap: wrap;
          gap: 8px;
        }
        .shopping-summary .summary-card {
          min-width: 60px;
        }
        .detail-chart {
          padding: 8px;
          min-height: 320px;
        }
        .detail-chart ha-chart-base {
          height: 300px;
        }
        .detail-actions {
          flex-wrap: wrap;
        }
      }
    `;
  }
}

customElements.define("juice-patrol-panel", JuicePatrolPanel);
