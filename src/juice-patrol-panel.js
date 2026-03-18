import { LitElement, html, css, nothing } from "lit";

// Inline style constants for column templates that render inside ha-data-table's
// shadow DOM (where LitElement static styles cannot reach).
const STYLE_SECONDARY = "font-size:13px;color:var(--secondary-text-color)";
const STYLE_SUB_TEXT = "font-size:11px;color:var(--secondary-text-color);opacity:0.7;margin-top:1px";
const STYLE_BADGE_ROW = "display:flex;flex-wrap:wrap;gap:4px;margin-top:4px";

// Tabs are defined dynamically in the getter below (need basePath)

class JuicePatrolPanel extends LitElement {
  static get properties() {
    return {
      narrow: { type: Boolean },
      _entities: { state: true },
      _activeView: { state: true },
      _settingsOpen: { state: true },
      _settingsDirty: { state: true },
      _settingsValues: { state: true },
      _configEntry: { state: true },
      _detailEntity: { state: true },
      _chartData: { state: true },
      _chartLoading: { state: true },
      _chartStale: { state: true },
      _shoppingData: { state: true },
      _shoppingLoading: { state: true },
      _refreshing: { state: true },
      _flashGeneration: { state: true },
      _expandedGroups: { state: true },
      _ignoredEntities: { state: true },
      _chartRange: { state: true },
      _filters: { state: true },
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
    this._prevLevels = new Map();
    this._recentlyChanged = new Map();
    this._activeView = "devices";
    this._shoppingData = null;
    this._shoppingLoading = false;
    this._refreshing = false;
    this._expandedGroups = {};
    this._highlightEntity = null;
    this._highlightApplied = false;
    this._highlightAttempts = 0;
    this._detailEntity = null;
    this._chartData = null;
    this._chartLoading = false;
    this._chartStale = false;
    this._chartLastLevel = null;
    this._flashGeneration = 0;
    this._ignoredEntities = null;
    this._chartRange = "auto";
    this._filters = { status: { value: ["active", "low"] } };
    this._flashCleanupTimer = null;
    this._refreshTimer = null;
    this._entityMap = new Map();
  }

  set hass(hass) {
    const prevConnection = this._hass?.connection;
    this._hass = hass;
    const isFirstLoad = !this._hassInitialized;
    // Detect WS reconnection: HA replaces the connection object after a drop.
    // Treat it like a first load to re-fetch config and rebuild state.
    const connectionChanged = !isFirstLoad && hass?.connection && hass.connection !== prevConnection;
    this._processHassUpdate(isFirstLoad || connectionChanged);
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
    // hass-tabs-subpage uses navigate() which fires location-changed
    this._locationChangedHandler = () => {
      this._syncViewFromUrl();
    };
    window.addEventListener("location-changed", this._locationChangedHandler);
    // Recover from background/idle: when the tab regains visibility,
    // re-process hass to rebuild entity state and reload chart if needed.
    this._visibilityHandler = () => {
      if (document.visibilityState === "visible" && this._hass) {
        this._processHassUpdate(false);
        if (this._activeView === "detail" && this._detailEntity) {
          // Only reload chart if data is stale (>5 min) or missing
          const staleMs = 5 * 60 * 1000;
          const age = this._chartData?.last_calculated
            ? Date.now() - this._chartData.last_calculated * 1000
            : Infinity;
          this._chartLoading = false;
          if (age > staleMs) {
            this._loadChartData(this._detailEntity);
          }
        }
      }
    };
    document.addEventListener("visibilitychange", this._visibilityHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    for (const t of ["_flashCleanupTimer", "_refreshTimer"]) {
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
    if (this._locationChangedHandler) {
      window.removeEventListener("location-changed", this._locationChangedHandler);
      this._locationChangedHandler = null;
    }
    if (this._visibilityHandler) {
      document.removeEventListener("visibilitychange", this._visibilityHandler);
      this._visibilityHandler = null;
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
    // Shopping list path
    if (path === `${this._basePath}/shopping` || path === `${this._basePath}/shopping/`) {
      if (this._activeView === "detail") {
        this._detailEntity = null;
        this._chartData = null;
        this._chartEl = null;
      }
      if (this._activeView !== "shopping") {
        this._activeView = "shopping";
        this._loadShoppingList();
      }
      this._entities = this._entityList;
      return;
    }
    // Any other path → devices view
    if (this._activeView === "detail") {
      this._detailEntity = null;
      this._chartData = null;
      this._chartEl = null;
    }
    this._activeView = "devices";
    this._entities = this._entityList;
  }

  updated(changed) {
    if ((changed.has("_chartData") || changed.has("_chartRange")) && this._chartData) {
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

    // Only assign _entities (trigger re-render) when data actually changed
    if (newHash !== prevHash) {
      this._entityMap = new Map(this._entityList.map((d) => [d.sourceEntity, d]));
      // In detail view, update the map silently (for _getDevice()) but don't
      // assign _entities — it's a reactive property that triggers a full Lit
      // re-render, which causes visible flashing of the detail/chart view.
      // The stale _entities list will be refreshed when returning to devices view.
      if (this._activeView !== "detail") {
        this._entities = this._entityList;
      }
    }

    if (isFirstLoad) {
      this._loadConfig();
      this._loadIgnored();
    }

    // When in detail view and the entity level changes from a background
    // coordinator update, show a stale notice instead of redrawing the chart
    // — avoids annoying mid-view redraws from hourly scans or erratic sensors.
    if (this._activeView === "detail" && this._detailEntity && !this._chartLoading) {
      const dev = this._getDevice(this._detailEntity);
      if (dev && dev.level !== this._chartLastLevel) {
        this._chartStale = true;
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

    if (flashChanged) {
      this._flashGeneration = (this._flashGeneration || 0) + 1;
    }
    // Schedule cleanup after animation completes (timer handles expiry)
    if (this._recentlyChanged.size > 0 && !this._flashCleanupTimer) {
      this._flashCleanupTimer = setTimeout(() => {
        this._flashCleanupTimer = null;
        this._recentlyChanged.clear();
        this._flashGeneration = (this._flashGeneration || 0) + 1;
      }, 3000);
    }

    // Build computed fields for ha-data-table
    for (const dev of devices.values()) {
      dev._searchText = [
        dev.name, dev.sourceEntity, dev.batteryType,
        dev.manufacturer, dev.model, dev.platform,
      ].filter(Boolean).join(" ").toLowerCase();
      // Status for filtering
      dev._status = dev.level === null ? "unavailable"
        : dev.isStale ? "stale"
        : dev.isLow ? "low"
        : "active";
    }

    // Store unsorted list
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

  _getFilteredEntities() {
    let list = this._entities;
    const statusFilter = this._filters.status?.value;
    if (statusFilter?.length) {
      list = list.filter((d) => statusFilter.includes(d._status));
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
    return dev.isRechargeable && (dev.chargingState === "charging" || dev.predictionStatus === "charging");
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
    // Deep-link highlight: open the device detail directly
    if (!this._highlightEntity || this._highlightApplied) return;
    this._highlightApplied = true;
    this._openDetail(this._highlightEntity);
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
      this._invalidateColumns();
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

  async _doMarkReplaced(entityId, timestamp) {
    try {
      const wsMsg = {
        type: "juice_patrol/mark_replaced",
        entity_id: entityId,
      };
      if (timestamp != null) wsMsg.timestamp = timestamp;
      await this._hass.callWS(wsMsg);
      this._showToast("Battery marked as replaced");
      if (this._detailEntity === entityId) {
        setTimeout(() => this._loadChartData(entityId), 500);
      }
    } catch (e) {
      this._showToast("Failed to mark as replaced");
    }
  }

  _showReplaceRechargeableDialog(entityId) {
    this._showReplaceDialogImpl(entityId, {
      title: "Replace rechargeable battery?",
      preamble: `
        <p style="margin-top:0">This device is marked as <strong>rechargeable</strong>, which means
        Juice Patrol expects its battery level to gradually rise and fall as it
        charges and discharges. Charging is detected automatically \u2014 you don't
        need to do anything when you plug it in.</p>
        <p><strong>"Mark as replaced"</strong> is for when you physically swap the
        battery pack itself (e.g. a worn-out cell that no longer holds charge).</p>
        <p>If you just recharged the device, you can ignore this \u2014 Juice Patrol
        already handles that.</p>`,
    });
  }

  _showReplaceDialog(entityId) {
    this._showReplaceDialogImpl(entityId, {
      title: "Mark battery as replaced?",
      preamble: `
        <p style="margin-top:0">This tells Juice Patrol that you swapped the batteries.
        A replacement marker will be added to the timeline. All history is preserved
        for life expectancy tracking.</p>
        <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">
        This can be undone later if needed.</p>`,
    });
  }

  _showReplaceDialogImpl(entityId, { title, preamble }) {
    const dialog = document.createElement("ha-dialog");
    dialog.open = true;
    dialog.headerTitle = title;
    this.shadowRoot.appendChild(dialog);

    const closeDialog = () => { dialog.open = false; dialog.remove(); };

    const body = document.createElement("div");
    body.innerHTML = `
      ${preamble}
      <ha-expansion-panel outlined style="margin: 8px 0">
        <span slot="header">Advanced: set custom date</span>
        <div style="padding: 8px 0">
          <p style="margin-top:0; color:var(--secondary-text-color); font-size:0.9em">
            Register a past battery replacement by selecting the date and time it occurred.</p>
          <input type="datetime-local" class="jp-datetime-input"
            style="width:100%; padding:8px; border:1px solid var(--divider-color, #ddd);
                   border-radius:4px; background:var(--card-background-color, #fff);
                   color:var(--primary-text-color); font-size:14px; box-sizing:border-box" />
        </div>
      </ha-expansion-panel>
      <div class="jp-dialog-actions">
        <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>
        <ha-button class="jp-dialog-confirm">Mark as replaced</ha-button>
      </div>
    `;
    dialog.appendChild(body);

    body.querySelector(".jp-dialog-cancel").addEventListener("click", closeDialog);
    body.querySelector(".jp-dialog-confirm").addEventListener("click", () => {
      const dtInput = body.querySelector(".jp-datetime-input");
      let timestamp;
      if (dtInput && dtInput.value) {
        timestamp = new Date(dtInput.value).getTime() / 1000;
      }
      closeDialog();
      this._doMarkReplaced(entityId, timestamp);
    });
  }

  _showConfirmDialog({ title, bodyHtml, onConfirm, confirmLabel, confirmVariant }) {
    const dialog = document.createElement("ha-dialog");
    dialog.open = true;
    dialog.headerTitle = title;
    this.shadowRoot.appendChild(dialog);

    const closeDialog = () => { dialog.open = false; dialog.remove(); };

    const body = document.createElement("div");
    body.innerHTML = `
      ${bodyHtml}
      <div class="jp-dialog-actions">
        <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>
        <ha-button class="jp-dialog-confirm" ${confirmVariant ? `variant="${confirmVariant}"` : ""}>${confirmLabel || "Confirm"}</ha-button>
      </div>
    `;
    dialog.appendChild(body);

    body.querySelector(".jp-dialog-cancel").addEventListener("click", closeDialog);
    body.querySelector(".jp-dialog-confirm").addEventListener("click", () => {
      closeDialog();
      onConfirm();
    });
  }

  _undoReplacement(entityId) {
    this._showConfirmDialog({
      title: "Undo battery replacement?",
      bodyHtml: `
        <p style="margin-top:0">This will remove the most recent replacement marker
        from the timeline. Battery history is never deleted.</p>
        <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">
        You can always re-add it later if needed.</p>`,
      confirmLabel: "Undo replacement",
      confirmVariant: "danger",
      onConfirm: () => this._doUndoReplacement(entityId),
    });
  }

  async _doUndoReplacement(entityId) {
    try {
      await this._hass.callWS({
        type: "juice_patrol/undo_replacement",
        entity_id: entityId,
      });
      this._showToast("Replacement undone");
      // Reload chart data to remove the replacement marker
      if (this._detailEntity === entityId) {
        setTimeout(() => this._loadChartData(entityId), 500);
      }
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

  async _confirmSuspectedReplacement(entityId, timestamp) {
    try {
      await this._hass.callWS({
        type: "juice_patrol/mark_replaced",
        entity_id: entityId,
        timestamp,
      });
      this._showToast("Replacement confirmed");
      if (this._detailEntity === entityId) {
        setTimeout(() => this._loadChartData(entityId), 500);
      }
    } catch (e) {
      this._showToast("Failed to confirm replacement");
    }
  }

  async _denySuspectedReplacement(entityId, timestamp) {
    try {
      await this._hass.callWS({
        type: "juice_patrol/deny_replacement",
        entity_id: entityId,
        timestamp,
      });
      this._showToast("Suggestion dismissed");
      if (this._detailEntity === entityId) {
        setTimeout(() => this._loadChartData(entityId), 500);
      }
    } catch (e) {
      this._showToast("Failed to dismiss suggestion");
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
    // Keep existing _chartData visible while loading — don't flash to empty
    try {
      const data = await this._hass.callWS({
        type: "juice_patrol/get_entity_chart",
        entity_id: entityId,
      });
      this._chartLastLevel = data?.level ?? null;
      this._chartData = data;
      this._chartStale = false;
    } catch (e) {
      console.error("Juice Patrol: failed to load chart data", e);
      this._showToast(this._wsErrorMessage(e, "chart view"));
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
    this._chartStale = false;
    this._chartLastLevel = null;
    this._chartRange = "auto";
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

  _handleRowClick(e) {
    const entityId = e.detail?.id;
    if (entityId) this._openDetail(entityId);
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
    const allReadings = chartData.all_readings || readings;
    const pred = chartData.prediction;
    const threshold = chartData.threshold;
    // t0 for the regression formula: use the prediction's own reference point,
    // falling back to first_reading_timestamp for single-session predictions
    // that predate the t0 field.
    const t0 = pred.t0 ?? chartData.first_reading_timestamp;

    const observed = allReadings.map((r) => [r.t * 1000, r.v]);

    const chargePred = chartData.charge_prediction;
    const isCharging =
      chartData.charging_state?.toLowerCase() === "charging" ||
      chartData.prediction?.status === "charging";
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

    // ── Compute auto tMin/tMax (smart default) ──
    const autoTMin = observed[0]?.[0] || Date.now();
    const nowMs = Date.now();
    let autoTMax;
    if (isCharging && chargePred && chargePred.segment_start_timestamp != null) {
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
        const pad = (fullT - autoTMin) * 0.1;
        autoTMax = fullT + pad;
      } else {
        autoTMax = nowMs + (nowMs - autoTMin) * 0.2;
      }
    } else if (isCharging) {
      autoTMax = nowMs + (nowMs - autoTMin) * 0.2;
    } else {
      autoTMax = fitted.length
        ? fitted[fitted.length - 1][0]
        : observed[observed.length - 1]?.[0] || nowMs;
    }

    // ── Apply chart range ──
    const rangeDurations = {
      "1d": 1 * 86400000,
      "1w": 7 * 86400000,
      "1m": 30 * 86400000,
      "3m": 90 * 86400000,
      "6m": 180 * 86400000,
      "1y": 365 * 86400000,
    };
    let tMin, tMax;
    const range = this._chartRange || "auto";
    if (range === "auto") {
      tMin = autoTMin;
      tMax = autoTMax;
    } else if (range === "all") {
      // Show everything: earliest reading to predicted empty (or furthest prediction)
      const earliestMs = allReadings.length ? allReadings[0].t * 1000 : autoTMin;
      const emptyMs = pred.estimated_empty_timestamp
        ? pred.estimated_empty_timestamp * 1000
        : null;
      const latestPred = fitted.length ? fitted[fitted.length - 1][0] : nowMs;
      tMin = Math.min(earliestMs, autoTMin);
      tMax = Math.max(latestPred, emptyMs || 0, autoTMax);
    } else {
      const dur = rangeDurations[range] || 30 * 86400000;
      tMin = nowMs - dur;
      const predEnd = fitted.length ? fitted[fitted.length - 1][0] : nowMs;
      tMax = Math.max(nowMs + dur, predEnd);
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

    // Compute threshold crossing point (used by threshold line, discharge line, and marker)
    // Shared label style for chart markers (threshold crossing, replacements)
    const _markerLabel = (text, color) => ({
      show: true,
      formatter: text,
      position: "left",
      fontSize: 10,
      color,
      distance: 6,
      backgroundColor: "rgba(0,0,0,0.6)",
      borderRadius: 3,
      padding: [3, 6],
    });

    let crossingMs = null;
    if (
      pred.slope_per_day != null && pred.slope_per_day < 0 &&
      pred.intercept != null && t0 != null && !isCharging
    ) {
      const crossingT = t0 + ((threshold - pred.intercept) / pred.slope_per_day) * 86400;
      if (crossingT * 1000 > Date.now()) {
        crossingMs = crossingT * 1000;
      }
    }

    // Ensure discharge line extends to both the crossing point and the empty date
    if (fitted.length > 0 && pred.slope_per_day != null && pred.intercept != null && t0 != null) {
      const fittedY = (t) => {
        const days = (t / 1000 - t0) / 86400;
        return pred.slope_per_day * days + pred.intercept;
      };
      const emptyMs = pred.estimated_empty_timestamp
        ? pred.estimated_empty_timestamp * 1000
        : null;
      const lastMs = fitted[fitted.length - 1][0];
      // Add crossing point if it's between existing points
      if (crossingMs && crossingMs > lastMs - 1 && crossingMs < (emptyMs || Infinity)) {
        fitted.push([crossingMs, Math.max(0, Math.min(100, fittedY(crossingMs)))]);
      }
      // Extend to predicted empty if not already there
      if (emptyMs && emptyMs > lastMs + 1) {
        fitted.push([emptyMs, Math.max(0, fittedY(emptyMs))]);
      }
    }

    // Threshold line spans from earliest data to at least the crossing point
    const thresholdMin = observed[0]?.[0] || tMin;
    const thresholdMax = Math.max(
      fitted.length ? fitted[fitted.length - 1][0] : tMax,
      crossingMs || 0,
      tMax,
    );
    series.push({
      name: "Threshold",
      type: "line",
      data: [
        [thresholdMin, threshold],
        [thresholdMax, threshold],
      ],
      symbol: "none",
      lineStyle: { width: 1, type: "dotted", color: colorThreshold },
      itemStyle: { color: colorThreshold },
    });

    // Threshold crossing vertical marker
    if (crossingMs) {
      const crossingDate = new Date(crossingMs);
      const hoursUntilCrossing = (crossingMs - Date.now()) / 3600000;
      const crossingLabel = hoursUntilCrossing <= 48
        ? crossingDate.toLocaleString(undefined, {
            day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
          })
        : crossingDate.toLocaleDateString(undefined, {
            day: "numeric", month: "short", year: "numeric",
          });
      series.push({
        name: "Low battery",
        type: "line",
        data: [
          { value: [crossingMs, 0], symbol: "none", symbolSize: 0 },
          {
            value: [crossingMs, threshold],
            symbol: "diamond",
            symbolSize: 6,
            label: _markerLabel(`Low ${crossingLabel}`, colorThreshold),
          },
        ],
        lineStyle: { width: 1, type: "dotted", color: colorThreshold },
        itemStyle: { color: colorThreshold },
        tooltip: { show: false },
      });
    }

    // Replacement history vertical markers
    const replacementHistory = chartData.replacement_history || [];
    if (replacementHistory.length > 0) {
      const colorReplacement = this._resolveColor("--success-color", "#4caf50");
      for (let i = 0; i < replacementHistory.length; i++) {
        const ts = replacementHistory[i] * 1000;
        const dateLabel = new Date(ts).toLocaleDateString(undefined, {
          day: "numeric", month: "short",
        });
        series.push({
          name: i === 0 ? "Replaced" : `Replaced ${i + 1}`,
          type: "line",
          data: [
            { value: [ts, 0], symbol: "none", symbolSize: 0 },
            {
              value: [ts, 100],
              symbol: "diamond",
              symbolSize: 6,
              label: _markerLabel(`Replaced ${dateLabel}`, colorReplacement),
            },
          ],
          lineStyle: { width: 1, type: "dashed", color: colorReplacement },
          itemStyle: { color: colorReplacement },
          tooltip: { show: false },
        });
      }
    }

    // Suspected replacement markers (amber, dotted)
    const suspectedReplacements = chartData.suspected_replacements || [];
    if (suspectedReplacements.length > 0) {
      const colorSuspected = this._resolveColor("--warning-color", "#ff9800");
      for (let i = 0; i < suspectedReplacements.length; i++) {
        const ts = suspectedReplacements[i].timestamp * 1000;
        const dateLabel = new Date(ts).toLocaleDateString(undefined, {
          day: "numeric", month: "short",
        });
        series.push({
          name: i === 0 ? "Suspected" : `Suspected ${i + 1}`,
          type: "line",
          data: [
            { value: [ts, 0], symbol: "none", symbolSize: 0 },
            {
              value: [ts, 100],
              symbol: "diamond",
              symbolSize: 6,
              label: _markerLabel(`Replaced? ${dateLabel}`, colorSuspected),
            },
          ],
          lineStyle: { width: 1, type: "dotted", color: colorSuspected },
          itemStyle: { color: colorSuspected },
          tooltip: { show: false },
        });
      }
    }

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
            if (p.seriesName?.startsWith("Replaced") || p.seriesName === "Low battery") continue;
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
        data: series.filter((s) => !s.name?.startsWith("Replaced") && s.name !== "Low battery").map((s) => s.name).filter((v, i, a) => a.indexOf(v) === i),
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
      dataZoom: [
        {
          type: "slider",
          xAxisIndex: 0,
          filterMode: "none",
          startValue: tMin,
          endValue: tMax,
          bottom: isNarrow ? 30 : 24,
          height: isNarrow ? 18 : 22,
          borderColor: colorGrid,
          fillerColor: "rgba(100,150,200,0.15)",
          handleStyle: { color: colorLevel },
          dataBackground: {
            lineStyle: { color: colorLevel, opacity: 0.3 },
            areaStyle: { color: colorLevel, opacity: 0.05 },
          },
          textStyle: { color: colorAxis, fontSize: 10 },
        },
        {
          type: "inside",
          xAxisIndex: 0,
          filterMode: "none",
        },
      ],
      grid: {
        left: isNarrow ? 40 : 50,
        right: isNarrow ? 10 : 20,
        top: 20,
        bottom: isNarrow ? 82 : 72,
        containLabel: false,
      },
    };

    // Reuse existing chart element to preserve user zoom/pan state;
    // only create a new one on first render.
    let chart = this._chartEl;
    if (!chart || !container.contains(chart)) {
      chart = document.createElement("ha-chart-base");
      container.innerHTML = "";
      container.appendChild(chart);
      this._chartEl = chart;
    }
    chart.hass = this._hass;

    requestAnimationFrame(() => {
      // ha-chart-base uses separate data (series) and options properties.
      // Do NOT include series in options — it would override data via replaceMerge.
      chart.data = series;
      chart.options = option;
    });
  }

  // ── Render ──

  get _tabs() {
    const base = this._basePath;
    return [
      { path: `${base}/devices`, name: "Devices", iconPath: "M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z" },
      { path: `${base}/shopping`, name: "Shopping List", iconPath: "M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22C15.89,22 15,21.1 15,20C15,18.89 15.89,18 17,18M1,2H4.27L5.21,4H20A1,1 0 0,1 21,5C21,5.17 20.95,5.34 20.88,5.5L17.3,11.97C16.96,12.58 16.3,13 15.55,13H8.1L7.2,14.63L7.17,14.75A0.25,0.25 0 0,0 7.42,15H19V17H7C5.89,17 5,16.1 5,15C5,14.65 5.09,14.32 5.24,14.04L6.6,11.59L3,4H1V2M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22C5.89,22 5,21.1 5,20C5,18.89 5.89,18 7,18M16,11L18.78,6H6.14L8.5,11H16Z" },
    ];
  }

  get _route() {
    const view = this._activeView === "detail" ? "devices" : this._activeView;
    return { path: `/${view}`, prefix: this._basePath };
  }

  /** Toolbar icons shared between both layout variants. */
  _renderToolbarIcons() {
    return html`
      <div slot="toolbar-icon" style="display:flex">
        <ha-icon-button
          id="refreshBtn"
          class=${this._refreshing ? "spinning" : ""}
          title="Re-fetch all battery data and recalculate predictions"
          .disabled=${this._refreshing}
          @click=${this._refresh}
        >
          <ha-icon icon="mdi:refresh"></ha-icon>
        </ha-icon-button>
        <ha-icon-button
          title="Settings"
          @click=${this._toggleSettings}
        >
          <ha-icon icon="mdi:cog"></ha-icon>
        </ha-icon-button>
      </div>
    `;
  }

  /** Count of active filters for badge display. */
  get _activeFilterCount() {
    return Object.values(this._filters).filter((f) =>
      Array.isArray(f.value) ? f.value.length : f.value
    ).length;
  }

  render() {
    if (!this._hass) return html`<div class="loading">Loading...</div>`;

    // Devices view uses hass-tabs-subpage-data-table for native filter pane
    if (this._activeView === "devices") {
      return this._renderDevicesView();
    }

    // Detail + Shopping views use hass-tabs-subpage
    const inDetail = this._activeView === "detail";
    return html`
      <hass-tabs-subpage
        .hass=${this._hass}
        .narrow=${this.narrow}
        .tabs=${this._tabs}
        .route=${this._route}
        ?main-page=${!inDetail}
        .backCallback=${inDetail ? () => this._closeDetail() : undefined}
      >
        ${this._renderToolbarIcons()}
        ${inDetail
          ? html`<div id="jp-content">${this._renderDetailView()}</div>`
          : html`<div class="jp-padded">${this._renderShoppingList()}</div>`}
      </hass-tabs-subpage>
    `;
  }

  _renderDevicesView() {
    const filtered = this._getFilteredEntities();

    return html`
      <hass-tabs-subpage-data-table
        .hass=${this._hass}
        .narrow=${this.narrow}
        .tabs=${this._tabs}
        .route=${this._route}
        main-page
        .columns=${this._columns}
        .data=${filtered}
        .id=${"sourceEntity"}
        .searchLabel=${"Search " + filtered.length + " devices"}
        .noDataText=${"No devices match the current filter."}
        clickable
        .initialSorting=${{ column: "level", direction: "asc" }}
        has-filters
        .filters=${this._activeFilterCount}
        @row-click=${this._handleRowClick}
        @clear-filter=${this._clearFilters}
      >
        ${this._renderToolbarIcons()}
        ${this._renderFilterPane()}
      </hass-tabs-subpage-data-table>
    `;
  }

  _renderFilterPane() {
    const statusValues = this._filters.status?.value || [];
    const statuses = [
      { value: "active", label: "Active", icon: "mdi:check-circle" },
      { value: "low", label: "Low battery", icon: "mdi:battery-alert" },
      { value: "stale", label: "Stale", icon: "mdi:clock-alert-outline" },
      { value: "unavailable", label: "Unavailable", icon: "mdi:help-circle-outline" },
    ];
    return html`
      <ha-expansion-panel slot="filter-pane" outlined expanded header="Status">
        <ha-icon slot="leading-icon" icon="mdi:list-status" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${statuses.map((s) => html`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${statusValues.includes(s.value)}
                @change=${(e) => this._toggleStatusFilter(s.value, e.target.checked)}
              ></ha-checkbox>
              <ha-icon icon=${s.icon} style="--mdc-icon-size:18px"></ha-icon>
              <span>${s.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
    `;
  }

  _toggleStatusFilter(status, checked) {
    const current = this._filters.status?.value || [];
    const next = checked
      ? [...current, status]
      : current.filter((s) => s !== status);
    this._filters = { ...this._filters, status: { value: next } };
  }

  _clearFilters() {
    this._filters = {};
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

  /** Column definitions for ha-data-table. */
  get _columns() {
    if (this._cachedColumns) return this._cachedColumns;
    this._cachedColumns = {
      icon: {
        title: "",
        type: "icon",
        moveable: false,
        showNarrow: true,
        template: (dev) => html`
          <ha-icon
            icon=${this._getBatteryIcon(dev)}
            style="color:${this._getLevelColor(dev.level, dev.threshold)}"
          ></ha-icon>
        `,
      },
      name: {
        title: "Device",
        main: true,
        sortable: true,
        filterable: true,
        filterKey: "_searchText",
        direction: "asc",
        flex: 3,
        showNarrow: true,
        template: (dev) => {
          const labels = this._getBadgeLabels(dev);
          const subText = this._getDeviceSubText(dev);
          return html`
            <div style="overflow:hidden">
              <span>${dev.name || dev.sourceEntity}</span>
              ${subText
                ? html`<div style=${STYLE_SUB_TEXT}>${subText}</div>`
                : nothing}
              ${labels.length
                ? html`<div style=${STYLE_BADGE_ROW}>${labels.map(
                    (l) => this._renderBadgeLabel(l)
                  )}</div>`
                : nothing}
            </div>
          `;
        },
      },
      level: {
        title: "Level",
        sortable: true,
        type: "numeric",
        minWidth: "70px",
        maxWidth: "90px",
        showNarrow: true,
        template: (dev) => {
          const color = this._getLevelColor(dev.level, dev.threshold);
          return html`<span style="color:${color};font-weight:500">${this._formatLevel(dev.level)}</span>`;
        },
      },
      batteryType: {
        title: "Type",
        sortable: true,
        minWidth: "60px",
        maxWidth: "90px",
        template: (dev) => html`<span
          style="font-size:12px;color:var(--secondary-text-color)"
          title=${dev.batteryTypeSource ? `Source: ${dev.batteryTypeSource}` : ""}
        >${dev.batteryType || "\u2014"}</span>`,
      },
      dischargeRate: {
        title: "Rate",
        sortable: true,
        type: "numeric",
        minWidth: "70px",
        maxWidth: "100px",
        template: (dev) => html`<span style=${STYLE_SECONDARY}>${this._formatRate(dev)}</span>`,
      },
      daysRemaining: {
        title: "Left",
        sortable: true,
        type: "numeric",
        minWidth: "55px",
        maxWidth: "80px",
        template: (dev) => html`<span style=${STYLE_SECONDARY}>${this._formatTimeRemaining(dev)}</span>`,
      },
      reliability: {
        title: "Rel",
        sortable: true,
        type: "numeric",
        minWidth: "45px",
        maxWidth: "60px",
        template: (dev) => this._renderReliabilityBadge(dev),
      },
      predictedEmpty: {
        title: "Empty by",
        sortable: true,
        minWidth: "80px",
        maxWidth: "110px",
        template: (dev) => html`<span style=${STYLE_SECONDARY}>${dev.predictedEmpty
          ? this._formatDate(dev.predictedEmpty, this._isFastDischarge(dev))
          : "\u2014"}</span>`,
      },
      actions: {
        title: "",
        type: "overflow-menu",
        showNarrow: true,
        template: (dev) => html`
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
        `,
      },
    };
    return this._cachedColumns;
  }

  /** Invalidate cached columns (call when settings change). */
  _invalidateColumns() {
    this._cachedColumns = null;
  }

  /** Build label entries for ha-data-table-labels (native HA badge chips). */
  _getBadgeLabels(dev) {
    const labels = [];
    if (dev.replacementPending) {
      labels.push({
        label_id: "replaced",
        name: dev.isRechargeable ? "RECHARGED?" : "REPLACED?",
        color: "#FF9800",
        description: dev.isRechargeable
          ? "Battery level jumped significantly \u2014 normal recharge cycle?"
          : "Battery level jumped significantly \u2014 was the battery replaced?",
      });
    }
    if (dev.isLow) {
      const t = dev.threshold ?? this._settingsValues.low_threshold ?? 20;
      labels.push({
        label_id: "low",
        name: "LOW",
        color: "#F44336",
        description: `Battery is at ${this._displayLevel(dev.level)}%, below the ${t}% threshold`,
      });
    }
    if (dev.isStale) {
      labels.push({
        label_id: "stale",
        name: "STALE",
        color: "#FF9800",
        description: "No battery reading received within the stale timeout period",
      });
    }
    if (dev.anomaly === "cliff") {
      labels.push({
        label_id: "cliff",
        name: "CLIFF DROP",
        color: "#F44336",
        description: `Sudden drop of ${dev.dropSize ?? "?"}% in a single reading interval`,
      });
    } else if (dev.anomaly === "rapid") {
      labels.push({
        label_id: "rapid",
        name: "RAPID",
        color: "#F44336",
        description: `Discharge rate significantly higher than average \u2014 ${dev.dropSize ?? "?"}% drop`,
      });
    }
    if (dev.stability === "erratic") {
      labels.push({
        label_id: "erratic",
        name: "ERRATIC",
        color: "#9C27B0",
        description: this._erraticTooltip(dev),
      });
    }
    const skipReasons = dev.isRechargeable ? new Set(["flat", "charging"]) : new Set();
    if (!dev.predictedEmpty && this._predictionReason(dev) && !skipReasons.has(dev.predictionStatus)) {
      labels.push({
        label_id: "no-pred",
        name: `No prediction: ${this._predictionReason(dev)}`,
        color: "#9E9E9E",
        description: this._predictionReasonDetail(dev.predictionStatus) || "",
      });
    }
    if (dev.isRechargeable) {
      if (this._isActivelyCharging(dev)) {
        labels.push({
          label_id: "charging",
          name: "Charging",
          icon: "mdi:battery-charging",
          color: "#4CAF50",
          description: "Currently charging",
        });
      } else {
        labels.push({
          label_id: "rechargeable",
          name: "Rechargeable",
          icon: "mdi:power-plug-battery",
          color: "#4CAF50",
          description: `Rechargeable: ${dev.rechargeableReason || "detected"}`,
        });
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
        labels.push({
          label_id: "avg",
          name: `avg ${displayMean}%`,
          color: "#2196F3",
          description: `7-day average is ${displayMean}% while current reading is ${displayLevel ?? "?"}%`,
        });
      }
    }
    return labels;
  }

  /** Returns subtitle string (manufacturer, model, platform) or null. */
  _getDeviceSubText(dev) {
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
    return sub || null;
  }

  /** Renders a single badge label chip (inline styles for ha-data-table shadow DOM). */
  _renderBadgeLabel(l) {
    return html`
      <span title=${l.description || ""} style="display:inline-flex;align-items:center;gap:2px;font-size:11px;font-weight:500;padding:1px 8px;border-radius:10px;white-space:nowrap;background:color-mix(in srgb, ${l.color} 20%, transparent);color:${l.color}">
        ${l.icon ? html`<ha-icon icon=${l.icon} style="--mdc-icon-size:14px"></ha-icon>` : nothing}
        ${l.name}
      </span>
    `;
  }

  _renderReliabilityBadge(dev) {
    const r = dev.reliability;
    const hasTimePrediction = dev.daysRemaining !== null || dev.hoursRemaining !== null;
    if (r === null || r === undefined || !hasTimePrediction) return "\u2014";
    const color = r >= 70 ? "var(--success-color, #43a047)" : r >= 40 ? "var(--warning-color, #ffa726)" : "var(--disabled-text-color, #999)";
    return html`<span
      style="display:inline-block;font-size:11px;font-weight:500;padding:1px 6px;border-radius:8px;background:color-mix(in srgb, ${color} 15%, transparent);color:${color}"
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

    const subText = this._getDeviceSubText(dev);
    return html`
      <div class="detail-header">
        <ha-icon
          icon=${this._getBatteryIcon(dev)}
          style="color:${this._getLevelColor(dev.level, dev.threshold)};--mdc-icon-size:40px"
        ></ha-icon>
        <div>
          <h1>${dev.name || dev.sourceEntity}</h1>
          ${subText ? html`<div class="detail-header-sub">${subText}</div>` : nothing}
        </div>
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
              ${pred.data_points_used ?? (cd?.readings?.length ?? "\u2014")}${cd?.session_count ? html` <span style="color:var(--secondary-text-color); font-size:0.85em">(${cd.session_count} session${cd.session_count !== 1 ? "s" : ""})</span>` : nothing}
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
          && !(pred.status === "charging" && cd?.charge_prediction?.estimated_full_timestamp)
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
    const ranges = [
      { key: "auto", label: "Auto" },
      { key: "1d", label: "1D" },
      { key: "1w", label: "1W" },
      { key: "1m", label: "1M" },
      { key: "3m", label: "3M" },
      { key: "6m", label: "6M" },
      { key: "1y", label: "1Y" },
      { key: "all", label: "All" },
    ];
    return html`
      <div class="chart-range-bar">
        ${ranges.map(
          (r) => html`
            <button
              class="range-pill ${this._chartRange === r.key ? "active" : ""}"
              @click=${() => { this._chartRange = r.key; }}
            >${r.label}</button>
          `
        )}
      </div>
      ${this._chartStale
        ? html`<div class="chart-stale-notice" @click=${() => this._loadChartData(this._detailEntity)}>
            <ha-icon icon="mdi:refresh" style="--mdc-icon-size:16px"></ha-icon>
            Data updated \u2014 tap to refresh
          </div>`
        : nothing}
      <div class="detail-chart" id="jp-chart"></div>
    `;
  }

  _renderDetailActions() {
    const entityId = this._detailEntity;
    if (!entityId) return nothing;
    const dev = this._getDevice(entityId);
    const cd = this._chartData;
    const replacementHistory = cd?.replacement_history || [];

    const suspectedReplacements = cd?.suspected_replacements || [];

    return html`
      ${replacementHistory.length > 0 || suspectedReplacements.length > 0 ? html`
        <div class="replacement-history">
          <div class="detail-meta-label" style="margin-bottom: 4px">Replacement History</div>
          <div class="replacement-history-list">
            ${[...replacementHistory].reverse().map((ts) => html`
              <div class="replacement-history-item">
                <ha-icon icon="mdi:battery-sync" style="--mdc-icon-size:16px; color:var(--secondary-text-color)"></ha-icon>
                <span>${this._formatDate(ts * 1000, true)}</span>
              </div>
            `)}
            ${suspectedReplacements.map((s) => html`
              <div class="replacement-history-item suspected">
                <ha-icon icon="mdi:help-circle-outline" style="--mdc-icon-size:16px; color:var(--warning-color, #ff9800)"></ha-icon>
                <span style="flex:1">${this._formatDate(s.timestamp * 1000, true)}
                  <span style="color:var(--secondary-text-color); font-size:0.85em"> — suspected (${Math.round(s.old_level)}% → ${Math.round(s.new_level)}%)</span>
                </span>
                <ha-icon-button
                  .path=${"M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"}
                  style="--mdc-icon-button-size:28px; color:var(--success-color, #4caf50)"
                  @click=${() => this._confirmSuspectedReplacement(entityId, s.timestamp)}
                ></ha-icon-button>
                <ha-icon-button
                  .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"}
                  style="--mdc-icon-button-size:28px; color:var(--error-color, #f44336)"
                  @click=${() => this._denySuspectedReplacement(entityId, s.timestamp)}
                ></ha-icon-button>
              </div>
            `)}
          </div>
        </div>
      ` : nothing}
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
      /* Toolbar is provided by hass-tabs-subpage */
      ha-icon-button[slot="toolbar-icon"] {
        color: var(--sidebar-icon-color);
      }
      #jp-content,
      .jp-padded {
        padding: 16px;
      }
      .detail-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      }
      .detail-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        line-height: 1.2;
      }
      .detail-header-sub {
        font-size: 14px;
        color: var(--secondary-text-color);
        margin-top: 2px;
      }
      .summary-card {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 16px 20px;
        min-width: 120px;
        border: 1px solid var(--border);
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
      hass-tabs-subpage-data-table {
        --data-table-row-height: 60px;
        --ha-dropdown-font-size: 14px;
      }
      .jp-filter-list {
        display: flex;
        flex-direction: column;
        padding: 4px 0;
      }
      .jp-filter-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 16px;
        cursor: pointer;
        font-size: 14px;
      }
      .jp-filter-item:hover {
        background: var(--secondary-background-color);
      }
      .devices {
        background: var(--card-bg);
        border-radius: 12px;
        border: 1px solid var(--border);
        overflow: hidden;
      }
      .confidence-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        margin-right: 4px;
        vertical-align: middle;
      }
      .confidence-dot.high { background: var(--success-color); }
      .confidence-dot.medium { background: var(--warning-color); }
      .confidence-dot.low { background: var(--error-color); }
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
      .chart-range-bar {
        display: flex;
        gap: 4px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
      .range-pill {
        border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
        background: transparent;
        color: var(--primary-text-color);
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        font-family: inherit;
        line-height: 1.4;
      }
      .range-pill:hover {
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
        border-color: var(--primary-color);
      }
      .range-pill.active {
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
        border-color: var(--primary-color);
      }
      .chart-stale-notice {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        margin-bottom: 8px;
        border-radius: 8px;
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
        color: var(--primary-color);
        font-size: 13px;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .chart-stale-notice:hover {
        background: color-mix(in srgb, var(--primary-color) 18%, transparent);
      }
      .detail-chart {
        background: var(--card-bg);
        border-radius: 12px;
        border: 1px solid var(--border);
        padding: 16px;
        margin-bottom: 16px;
        min-height: 430px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .detail-chart ha-chart-base {
        width: 100%;
        height: 410px;
        display: block;
      }
      .replacement-history {
        padding: 12px 16px;
      }
      .replacement-history-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .replacement-history-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9em;
        color: var(--primary-text-color);
      }
      .replacement-history-item.suspected {
        padding: 4px 0;
        border-top: 1px dashed var(--divider-color, #e0e0e0);
      }
      .detail-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      @media (max-width: 500px) {
        #jp-content,
        .jp-padded {
          padding: 10px;
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
        .shopping-summary {
          flex-wrap: wrap;
          gap: 8px;
        }
        .shopping-summary .summary-card {
          min-width: 60px;
        }
        .detail-chart {
          padding: 8px;
          min-height: 350px;
        }
        .detail-chart ha-chart-base {
          height: 330px;
        }
        .range-pill {
          padding: 3px 9px;
          font-size: 11px;
        }
        .detail-actions {
          flex-wrap: wrap;
        }
      }
    `;
  }
}

customElements.define("juice-patrol-panel", JuicePatrolPanel);
