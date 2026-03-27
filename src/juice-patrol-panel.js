import { LitElement, html, css, nothing } from "lit";
import { ICON_BATTERY, ICON_SHOPPING, ICON_DASHBOARD } from "./constants.js";
import {
  formatLevel, displayLevel, wsErrorMessage, getBatteryIcon, getLevelColor,
  isActivelyCharging, formatDate, parseBatteryType, formatBatteryType,
  showToast, getDeviceSubText,
} from "./helpers.js";
import { panelStyles } from "./styles.js";
import { buildColumns } from "./columns.js";
import { renderDetailView } from "./views/detail.js";
import { renderShoppingList } from "./views/shopping.js";
import { renderDashboard, initTimelineChart } from "./views/dashboard.js";
import { initDetailChart, destroyDetailChart } from "./views/chart.js";
import { fetchDeviceHistory } from "./history.js";
import {
  showReplaceDialog, showReplaceRechargeableDialog,
  showConfirmDialog, showBatteryTypeDialog,
} from "./dialogs.js";

class JuicePatrolPanel extends LitElement {
  static get properties() {
    return {
      narrow: { type: Boolean },
      _entities: { state: true },
      _activeView: { state: true },
      _settingsOpen: { state: true },
      _settingsValues: { state: true },
      _settingsDirty: { state: true },
      _shoppingData: { state: true },
      _shoppingLoading: { state: true },
      _detailEntity: { state: true },
      _flashGeneration: { state: true },
      _refreshing: { state: true },
      _ignoredEntities: { state: true },
      _filters: { state: true },
      _dashboardLoading: { state: true },
      _chartData: { state: true },
      _chartLoading: { state: true },
    };
  }

  constructor() {
    super();
    this._hass = null;
    this._panel = null;
    this._hassInitialized = false;
    this._entities = [];
    this._entityList = [];
    this._entityHash = "";
    this._activeView = "devices";
    this._settingsOpen = false;
    this._settingsValues = {};
    this._settingsDirty = false;
    this._shoppingData = null;
    this._shoppingLoading = false;
    this._detailEntity = null;
    this._flashGeneration = 0;
    this._ignoredEntities = null;
    this._filters = { status: { value: ["active", "low"] } };
    this._dashboardLoading = false;
    this._chartData = null;
    this._chartLoading = false;
    this._detailChart = null;
    this._sorting = { column: "level", direction: "asc" };
    this._flashCleanupTimer = null;
    this._refreshTimer = null;
    this._entityMap = new Map();
    this._prevLevels = new Map();
    this._recentlyChanged = new Map();
    this._cachedColumns = null;
    this._refreshing = false;
    this._expandedGroups = {};
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
        if (this._activeView === "shopping") {
          this._loadShoppingList();
        }
        if (this._activeView === "dashboard") {
          if (!this._shoppingData) this._loadShoppingList();
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
    this._detachScrollTracker();
  }

  firstUpdated() {
    this._syncViewFromUrl();
    // Deep-link support: ?entity=sensor.xxx opens detail directly
    const params = new URLSearchParams(window.location.search);
    const deepLink = params.get("entity");
    if (deepLink) {
      this._highlightEntity = deepLink;
    }
  }

  _syncViewFromUrl() {
    const path = window.location.pathname;
    // Detail path: /juice-patrol/detail/sensor.xxx
    const detailPrefix = `${this._basePath}/detail/`;
    if (path.startsWith(detailPrefix)) {
      const entityId = decodeURIComponent(path.slice(detailPrefix.length));
      if (entityId && entityId !== this._detailEntity) {
        this._detailEntity = entityId;
      }
      this._activeView = "detail";
      return;
    }
    // Dashboard path (also the default landing page)
    if (path === this._basePath || path === `${this._basePath}/`
        || path === `${this._basePath}/dashboard` || path === `${this._basePath}/dashboard/`) {
      if (this._activeView === "detail") {
        this._detailEntity = null;
      }
      if (this._activeView !== "dashboard") {
        this._activeView = "dashboard";
        if (!this._shoppingData) this._loadShoppingList();
      }
      this._entities = this._entityList;
      return;
    }
    // Shopping list path
    if (path === `${this._basePath}/shopping` || path === `${this._basePath}/shopping/`) {
      if (this._activeView === "detail") {
        this._detailEntity = null;
      }
      if (this._activeView !== "shopping") {
        this._activeView = "shopping";
        this._loadShoppingList();
      }
      this._entities = this._entityList;
      return;
    }
    // Devices view (explicit path or fallback for unknown paths)
    if (this._activeView === "detail") {
      this._detailEntity = null;
    }
    this._activeView = "devices";
    this._entities = this._entityList;
  }

  updated(changed) {
    // Init fleet/type charts when dashboard is active
    if (this._activeView === "detail" && !this._chartLoading &&
        this._chartData && changed.has("_chartData")) {
      requestAnimationFrame(() => initDetailChart(this));
    }
    if (this._activeView === "dashboard" && this._fleetData &&
        (changed.has("_entities") || changed.has("_activeView"))) {
      // Always reinit when the view changed (DOM containers are fresh).
      // For data-only updates, hash to avoid unnecessary redraws.
      const viewChanged = changed.has("_activeView");
      const fleetHash = JSON.stringify(this._fleetData) + JSON.stringify(
        (this._healthByTypeData || []).map(t => ({ type: t.type, n: t.devices.length, b: t.buckets }))
      );
      if (viewChanged || fleetHash !== this._lastFleetHash) {
        this._lastFleetHash = fleetHash;
        requestAnimationFrame(() => initTimelineChart(this));
      }
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
    if (changed.has("_activeView")) {
      if (this._activeView === "devices") {
        this._attachScrollTracker();
      } else {
        this._detachScrollTracker();
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

    // On a direct URL load the detail view is set by _syncViewFromUrl before
    // hass/entities are available. Trigger the history fetch once entities arrive.
    if (this._activeView === "detail" && this._detailEntity &&
        this._chartData === null && !this._chartLoading &&
        this._entityMap.get(this._detailEntity)) {
      this._loadDetailHistory(this._detailEntity);
    }

    if (isFirstLoad) {
      this._loadConfig();
      this._loadIgnored();
    }
  }

  _updateEntities() {
    if (!this._hass) return;
    const states = this._hass.states;
    const devices = new Map();

    // Collect all juice_patrol sensor/binary_sensor entities
    for (const [entityId, state] of Object.entries(states)) {
      const attrs = state.attributes || {};
      const sourceEntity = attrs.source_entity;
      if (!sourceEntity) continue;
      if (entityId.includes("lowest_battery") || entityId.includes("attention_needed")) continue;

      const domain = entityId.split(".")[0];
      const deviceClass = attrs.device_class;
      const isBatteryLevel = domain === "sensor" && deviceClass === "battery";
      const isBatteryLow = domain === "binary_sensor" && deviceClass === "battery";
      const isStale = domain === "binary_sensor" && deviceClass === "problem";
      if (!isBatteryLevel && !isBatteryLow && !isStale) continue;

      if (!devices.has(sourceEntity)) {
        devices.set(sourceEntity, {
          sourceEntity,
          name: attrs.source_name || sourceEntity,
          level: null,
          isLow: false,
          isStale: false,
          batteryType: null,
          batteryTypeSource: null,
          threshold: null,
          lastReplaced: null,
          isRechargeable: false,
          rechargeableReason: null,
          chargingState: null,
          manufacturer: null,
          model: null,
          platform: null,
          _searchText: "",
          _statusFilter: "active",
        });
      }
      const dev = devices.get(sourceEntity);

      // Extract data from each sensor type
      if (isBatteryLevel) {
        const val = parseFloat(state.state);
        dev.level = isNaN(val) ? null : val;
        dev.batteryType = attrs.battery_type || null;
        dev.batteryTypeSource = attrs.battery_type_source || null;
        dev.threshold = attrs.threshold != null ? parseFloat(attrs.threshold) : null;
        dev.lastReplaced = attrs.last_replaced ?? null;
        dev.isRechargeable = attrs.is_rechargeable ?? false;
        dev.rechargeableReason = attrs.rechargeable_reason ?? null;
        dev.chargingState = attrs.charging_state ? attrs.charging_state.toLowerCase() : null;
        dev.manufacturer = attrs.manufacturer ?? null;
        dev.model = attrs.model ?? null;
        dev.platform = attrs.platform ?? null;
      } else if (isBatteryLow) {
        dev.isLow = state.state === "on";
      } else if (isStale) {
        dev.isStale = state.state === "on";
      }
    }

    // Build search text and status filter, detect flashes
    const ignored = this._ignoredEntities ? new Set(this._ignoredEntities) : null;
    const list = [];
    let hasFlash = false;

    for (const [sourceEntity, dev] of devices) {
      if (ignored && ignored.has(sourceEntity)) continue;

      // Build search text
      const parts = [dev.name, sourceEntity, dev.batteryType, dev.manufacturer, dev.model, dev.platform];
      dev._searchText = parts.filter(Boolean).join(" ").toLowerCase();

      // Sort key: null levels go to bottom (999 in asc, -1 in desc)
      dev._levelSort = dev.level !== null ? dev.level : 999;

      // Status filter
      if (dev.level === null || (states[sourceEntity]?.state === "unavailable")) {
        dev._statusFilter = "unavailable";
      } else if (dev.isStale) {
        dev._statusFilter = "stale";
      } else if (dev.isLow) {
        dev._statusFilter = "low";
      } else {
        dev._statusFilter = "active";
      }

      // Flash detection
      const prevLevel = this._prevLevels.get(sourceEntity);
      if (prevLevel !== undefined && dev.level !== null && dev.level !== prevLevel) {
        this._recentlyChanged.set(sourceEntity, Date.now());
        hasFlash = true;
      }
      if (dev.level !== null) {
        this._prevLevels.set(sourceEntity, dev.level);
      }

      list.push(dev);
    }

    if (hasFlash) {
      this._flashGeneration++;
      if (this._flashCleanupTimer) clearTimeout(this._flashCleanupTimer);
      this._flashCleanupTimer = setTimeout(() => {
        this._recentlyChanged.clear();
        this._flashGeneration++;
        this._flashCleanupTimer = null;
      }, 3000);
    }

    this._entityList = list;
    this._entityHash = list.map((d) => `${d.sourceEntity}:${d.level}:${d.isLow}:${d.isStale}:${d.chargingState}:${d.batteryType}`).join("|");
  }

  _getFilteredEntities() {
    const statusValues = this._filters.status?.value || [];
    const batteryValues = this._filters.battery?.value || [];
    const typeValues = this._filters.batteryType?.value || [];
    const levelRange = this._filters.levelRange?.value;
    const hasLevelRange = levelRange && (levelRange.min != null || levelRange.max != null);
    if (statusValues.length === 0 && batteryValues.length === 0 && typeValues.length === 0 && !hasLevelRange) return this._entities;
    return this._entities.filter((d) => {
      if (statusValues.length > 0 && !statusValues.includes(d._statusFilter)) return false;
      if (batteryValues.length > 0) {
        const type = d.isRechargeable ? "rechargeable" : "disposable";
        if (!batteryValues.includes(type)) return false;
      }
      if (typeValues.length > 0) {
        const normType = d.isRechargeable
          ? "Rechargeable"
          : (() => {
              const m = d.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);
              return m ? m[1].trim() : (d.batteryType || "Unknown");
            })();
        if (!typeValues.includes(normType)) return false;
      }
      if (hasLevelRange) {
        if (d.level == null) return false;
        const lvl = Math.ceil(d.level);
        if (levelRange.min != null && lvl < levelRange.min) return false;
        if (levelRange.max != null && lvl > levelRange.max) return false;
      }
      return true;
    });
  }

  /**
   * Navigate to Devices tab with a battery type filter pre-applied.
   * Called from the dashboard's "Health by Battery Type" section.
   */
  _navigateToDevicesWithTypeFilter(typeName) {
    this._filters = { batteryType: { value: [typeName] } };
    window.history.pushState(null, "", `${this._basePath}/devices`);
    this._syncViewFromUrl();
  }

  /**
   * Navigate to Devices tab with a level range filter pre-applied.
   * Called from the dashboard's Fleet Composition chart.
   */
  _navigateToDevicesWithLevelFilter(min, max, extraFilters) {
    const filters = { levelRange: { value: { min, max } }, ...extraFilters };
    this._filters = filters;
    window.history.pushState(null, "", `${this._basePath}/devices`);
    this._syncViewFromUrl();
  }

  // ── Helpers (thin wrappers that delegate to imported functions) ──

  _getDevice(entityId) {
    return this._entityMap.get(entityId);
  }

  _formatLevel(level) {
    return formatLevel(level);
  }

  _showToast(message, action) {
    showToast(this, message, action);
  }

  _applyDeepLinkHighlight() {
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
      };
    } catch (e) {
      console.warn("Juice Patrol: failed to load config", e);
    }
  }

  async _saveSettings() {
    if (!this._hass || !this._configEntry) return;
    try {
      await this._hass.callWS({
        type: "juice_patrol/update_settings",
        ...this._settingsValues,
      });
      this._settingsDirty = false;
      this._settingsOpen = false;
      this._invalidateColumns();
      this._showToast("Settings saved");
    } catch (e) {
      this._showToast("Failed to save settings");
    }
  }

  async _markReplaced(entityId) {
    const dev = this._getDevice(entityId);
    if (dev?.isRechargeable) {
      showReplaceRechargeableDialog(this, entityId);
      return;
    }
    showReplaceDialog(this, entityId);
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
    } catch (e) {
      this._showToast("Failed to mark as replaced");
    }
  }

  _undoReplacement(entityId) {
    showConfirmDialog(this, {
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
    } catch (e) {
      this._showToast("Failed to undo replacement");
    }
  }

  _undoReplacementAt(entityId, timestamp) {
    const date = new Date(timestamp * 1000).toLocaleDateString();
    showConfirmDialog(this, {
      title: "Remove replacement?",
      bodyHtml: `<p style="margin-top:0">Remove the replacement marker from <strong>${date}</strong>? Battery history is never deleted.</p>`,
      confirmLabel: "Remove",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await this._hass.callWS({
            type: "juice_patrol/undo_replacement",
            entity_id: entityId,
            timestamp,
          });
          this._showToast("Replacement removed");
        } catch (e) {
          this._showToast("Failed to remove replacement");
        }
      },
    });
  }


  _confirmRefresh() {
    showConfirmDialog(this, {
      title: "Force refresh",
      bodyHtml: `
        <p>Juice Patrol automatically updates whenever a battery level changes and runs a full scan every hour.</p>
        <p>A manual refresh clears all cached data and re-evaluates every device from scratch. This is only needed if:</p>
        <ul style="margin:8px 0;padding-left:20px">
          <li>You changed a battery type or threshold and want immediate results</li>
          <li>Data seems stale or incorrect after a HA restart</li>
          <li>You imported historical recorder data</li>
        </ul>
        <p style="color:var(--secondary-text-color);font-size:13px">This may take a moment depending on the number of devices.</p>
      `,
      confirmLabel: "Refresh now",
      onConfirm: () => this._refresh(),
    });
  }

  async _refresh() {
    if (this._refreshing) return;
    this._refreshing = true;
    try {
      await this._hass.callWS({ type: "juice_patrol/refresh" });
      this._showToast("Data refreshed");
      // Reload view-specific data after refresh completes
      if (this._activeView === "shopping") {
        setTimeout(() => this._loadShoppingList(), 500);
      } else if (this._activeView === "dashboard") {
        setTimeout(() => this._loadShoppingList(), 500);
      }
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
      this._ignoredEntities = result.ignored || [];
    } catch (e) {
      console.warn("Juice Patrol: failed to load ignored", e);
    }
  }

  async _ignoreDevice(entityId) {
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
      // Retry once — on mobile apps the WS may not be ready yet
      if (!this._shoppingRetried) {
        this._shoppingRetried = true;
        this._shoppingLoading = false;
        setTimeout(() => {
          this._shoppingRetried = false;
          this._loadShoppingList();
        }, 1000);
        return;
      }
      this._shoppingRetried = false;
      console.error("Juice Patrol: failed to load shopping list", e);
      this._shoppingData = null;
    }
    this._shoppingLoading = false;
  }


  async _saveBatteryType(entityId, type) {
    try {
      await this._hass.callWS({
        type: "juice_patrol/set_battery_type",
        entity_id: entityId,
        battery_type: type || "",
      });
      this._showToast(type ? `Battery type set to ${type}` : "Battery type cleared");
    } catch (e) {
      this._showToast("Failed to set battery type");
    }
  }

  // ── Navigation ──

  _openDetail(entityId) {
    // Save scroll position to current history entry before pushing detail
    this._saveScrollPosition();
    destroyDetailChart(this);
    this._chartData = null;
    this._detailEntity = entityId;
    this._activeView = "detail";
    const detailUrl = `${this._basePath}/detail/${encodeURIComponent(entityId)}`;
    history.pushState({ view: "detail", entityId }, "", detailUrl);
    this._loadDetailHistory(entityId);
  }

  _closeDetail() {
    destroyDetailChart(this);
    this._chartData = null;
    history.back();
  }

  async _loadDetailHistory(entityId) {
    const dev = this._getDevice(entityId);
    if (!dev?.sourceEntity) return;
    this._chartLoading = true;
    try {
      this._chartData = await fetchDeviceHistory(this._hass, dev.sourceEntity);
    } catch (_) {
      this._chartData = [];
    } finally {
      this._chartLoading = false;
    }
  }

  /** Find the .scroller element inside the data table's shadow DOM. */
  _getScroller() {
    const dt = this.shadowRoot?.querySelector("hass-tabs-subpage-data-table");
    const haDataTable = dt?.shadowRoot?.querySelector("ha-data-table");
    return haDataTable?.shadowRoot?.querySelector(".scroller") || null;
  }

  /** Save current scroll position into history.state. */
  _saveScrollPosition() {
    const scroller = this._getScroller();
    if (scroller) {
      const state = { ...(history.state || {}), scrollPosition: scroller.scrollTop };
      history.replaceState(state, "");
    }
  }

  /** Attach throttled scroll listener to save position as user scrolls. */
  _attachScrollTracker() {
    if (this._scrollTracker) return;
    // The data table's shadow DOM chain may not be ready immediately.
    // Poll briefly until the scroller element appears.
    let attempts = 0;
    const tryAttach = () => {
      const scroller = this._getScroller();
      if (!scroller) {
        if (++attempts < 20) requestAnimationFrame(tryAttach);
        return;
      }
      if (this._scrollTracker) return; // guard against race

      let ticking = false;
      this._scrollTracker = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            this._saveScrollPosition();
            ticking = false;
          });
        }
      };
      scroller.addEventListener("scroll", this._scrollTracker, { passive: true });
      this._scrollTrackerTarget = scroller;

      // Restore scroll position from history.state once content is tall enough
      const pos = history.state?.scrollPosition;
      if (pos > 0) {
        let restoreAttempts = 0;
        const tryRestore = () => {
          if (scroller.scrollHeight > scroller.clientHeight + pos) {
            scroller.scrollTop = pos;
          } else if (++restoreAttempts < 30) {
            requestAnimationFrame(tryRestore);
          }
        };
        requestAnimationFrame(tryRestore);
      }
    };
    requestAnimationFrame(tryAttach);
  }

  /** Remove scroll listener. */
  _detachScrollTracker() {
    if (this._scrollTracker && this._scrollTrackerTarget) {
      this._scrollTrackerTarget.removeEventListener("scroll", this._scrollTracker);
      this._scrollTracker = null;
      this._scrollTrackerTarget = null;
    }
  }

  // ── Action handlers ──

  _toggleSettings() {
    this._settingsOpen = !this._settingsOpen;
    if (this._settingsOpen) {
      this._settingsDirty = false;
      this._loadConfig();
    }
  }

  _handleSettingInput(e) {
    const key = e.target.dataset.key;
    this._settingsValues = { ...this._settingsValues, [key]: parseFloat(e.target.value) };
    this._settingsDirty = true;
  }

  _cancelSettings() {
    this._settingsOpen = false;
    this._loadConfig();
  }

  _handleMenuSelect(e, entityId) {
    const action = e.detail?.item?.value;
    if (!action || !entityId) return;
    const dev = this._getDevice(entityId);
    if (action === "detail") {
      this._openDetail(entityId);
    } else if (action === "replace") {
      this._markReplaced(entityId);
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

  _handleSortingChanged(e) {
    this._sorting = e.detail;
  }

  _setBatteryType(entityId, currentType) {
    showBatteryTypeDialog(this, entityId, currentType);
  }

  /** Invalidate cached columns (call when settings change). */
  _invalidateColumns() {
    this._cachedColumns = null;
  }

  // ── Render ──

  get _tabs() {
    const base = this._basePath;
    return [
      { path: `${base}/dashboard`, name: "Dashboard", iconPath: ICON_DASHBOARD },
      { path: `${base}/devices`, name: "Devices", iconPath: ICON_BATTERY },
      { path: `${base}/shopping`, name: "Shopping List", iconPath: ICON_SHOPPING },
    ];
  }

  get _route() {
    const view = this._activeView === "detail" ? "devices" : this._activeView;
    return { path: `/${view}`, prefix: this._basePath };
  }

  /** Toolbar icons shared between both layout variants. */
  _renderToolbarIcons() {
    if (this._activeView === "detail") {
      return this._renderDetailToolbarIcons();
    }
    return html`
      <div slot="toolbar-icon" style="display:flex">
        <ha-icon-button
          id="refreshBtn"
          class=${this._refreshing ? "spinning" : ""}
          title="Force refresh"
          .disabled=${this._refreshing}
          @click=${this._confirmRefresh}
        >
          <ha-icon icon="mdi:refresh"></ha-icon>
        </ha-icon-button>
      </div>
    `;
  }

  _renderDetailToolbarIcons() {
    const entityId = this._detailEntity;
    const dev = this._getDevice(entityId);
    return html`
      <div slot="toolbar-icon" style="display:flex">
        <ha-dropdown
          @wa-select=${(e) => {
            const action = e.detail?.item?.value;
            if (!action || !entityId) return;
            if (action === "replace") {
              this._markReplaced(entityId);
            } else if (action === "type") {
              this._setBatteryType(entityId, dev?.batteryType);
            } else if (action === "ignore") {
              this._ignoreDevice(entityId);
            }
          }}
        >
          <ha-icon-button slot="trigger">
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </ha-icon-button>
          <ha-dropdown-item value="replace">
            <ha-icon slot="icon" icon="mdi:battery-sync"></ha-icon>
            Mark as replaced
          </ha-dropdown-item>
          <ha-dropdown-item value="type">
            <ha-icon slot="icon" icon="mdi:battery-heart-variant"></ha-icon>
            Set battery type
          </ha-dropdown-item>
          <wa-divider></wa-divider>
          <ha-dropdown-item value="ignore">
            <ha-icon slot="icon" icon="mdi:eye-off"></ha-icon>
            Ignore device
          </ha-dropdown-item>
        </ha-dropdown>
      </div>
    `;
  }

  /** Count of active filters for badge display. */
  get _activeFilterCount() {
    const DEFAULT_STATUS = ["active", "low"];
    return Object.entries(this._filters).filter(([group, f]) => {
      if (group === "levelRange") {
        return f.value && (f.value.min != null || f.value.max != null);
      }
      if (!Array.isArray(f.value) || !f.value.length) return false;
      if (
        group === "status" &&
        f.value.length === DEFAULT_STATUS.length &&
        f.value.every((v) => DEFAULT_STATUS.includes(v))
      )
        return false;
      return true;
    }).length;
  }

  /** Column definitions for ha-data-table. */
  get _columns() {
    if (this._cachedColumns) return this._cachedColumns;
    this._cachedColumns = buildColumns(this);
    return this._cachedColumns;
  }

  render() {
    if (!this._hass) return html`<div class="loading">Loading...</div>`;

    // Devices view uses hass-tabs-subpage-data-table for native filter pane
    if (this._activeView === "devices") {
      return this._renderDevicesView();
    }

    // Dashboard, Detail, and Shopping views use hass-tabs-subpage
    const inDetail = this._activeView === "detail";
    const isDashboard = this._activeView === "dashboard";
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
          ? html`<div id="jp-content">${renderDetailView(this)}</div>`
          : isDashboard
            ? html`<div class="jp-padded">${renderDashboard(this)}</div>`
            : html`<div class="jp-padded">${renderShoppingList(this)}</div>`}
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
        .initialSorting=${this._sorting}
        has-filters
        .filters=${this._activeFilterCount}
        @row-click=${this._handleRowClick}
        @sorting-changed=${this._handleSortingChanged}
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
                @change=${(e) => this._toggleFilter("status", s.value, e.target.checked)}
              ></ha-checkbox>
              <ha-icon icon=${s.icon} style="--mdc-icon-size:18px"></ha-icon>
              <span>${s.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
      <ha-expansion-panel slot="filter-pane" outlined header="Battery">
        <ha-icon slot="leading-icon" icon="mdi:battery" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${[
            { value: "disposable", label: "Disposable", icon: "mdi:battery" },
            { value: "rechargeable", label: "Rechargeable", icon: "mdi:battery-charging" },
          ].map((b) => html`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${(this._filters.battery?.value || []).includes(b.value)}
                @change=${(e) => this._toggleFilter("battery", b.value, e.target.checked)}
              ></ha-checkbox>
              <ha-icon icon=${b.icon} style="--mdc-icon-size:18px"></ha-icon>
              <span>${b.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
      ${this._renderBatteryTypeFilterPane()}
      ${this._renderLevelRangeFilterPane()}
    `;
  }

  _renderBatteryTypeFilterPane() {
    // Compute unique battery types from entities
    const typeSet = new Map();
    for (const e of this._entities || []) {
      if (e.level == null) continue;
      let typeKey;
      if (e.isRechargeable) {
        typeKey = "Rechargeable";
      } else {
        const m = e.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);
        typeKey = m ? m[1].trim() : (e.batteryType || "Unknown");
      }
      typeSet.set(typeKey, (typeSet.get(typeKey) || 0) + 1);
    }
    // Sort by count descending
    const types = [...typeSet.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ value: name, label: `${name} (${count})` }));

    if (types.length === 0) return nothing;

    const typeValues = this._filters.batteryType?.value || [];
    return html`
      <ha-expansion-panel slot="filter-pane" outlined
        .expanded=${typeValues.length > 0}
        header="Battery Type">
        <ha-icon slot="leading-icon" icon="mdi:battery-heart-variant" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${types.map((t) => html`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${typeValues.includes(t.value)}
                @change=${(e) => this._toggleFilter("batteryType", t.value, e.target.checked)}
              ></ha-checkbox>
              <span>${t.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
    `;
  }

  _renderLevelRangeFilterPane() {
    const range = this._filters.levelRange?.value;
    const hasRange = range && (range.min != null || range.max != null);
    const minVal = range?.min ?? 0;
    const maxVal = range?.max ?? 100;
    return html`
      <ha-expansion-panel slot="filter-pane" outlined
        .expanded=${hasRange}
        header="Battery Level">
        <ha-icon slot="leading-icon" icon="mdi:gauge" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-level-range">
          <div class="jp-level-slider-row">
            <span class="jp-level-label">Min</span>
            <ha-slider
              .min=${0} .max=${100} .step=${1}
              .value=${minVal}
              pin
              @change=${(e) => {
                const v = parseInt(e.target.value, 10);
                this._setLevelRange(v === 0 ? null : v, range?.max ?? null);
              }}
            ></ha-slider>
            <span class="jp-level-value">${minVal}%</span>
          </div>
          <div class="jp-level-slider-row">
            <span class="jp-level-label">Max</span>
            <ha-slider
              .min=${0} .max=${100} .step=${1}
              .value=${maxVal}
              pin
              @change=${(e) => {
                const v = parseInt(e.target.value, 10);
                this._setLevelRange(range?.min ?? null, v === 100 ? null : v);
              }}
            ></ha-slider>
            <span class="jp-level-value">${maxVal}%</span>
          </div>
          ${hasRange ? html`
            <div style="padding:0 16px 8px;text-align:right">
              <ha-button @click=${() => this._setLevelRange(null, null)}>
                Clear
              </ha-button>
            </div>
          ` : nothing}
        </div>
      </ha-expansion-panel>
    `;
  }

  _setLevelRange(min, max) {
    if (min == null && max == null) {
      const { levelRange: _, ...rest } = this._filters;
      this._filters = { ...rest };
    } else {
      this._filters = { ...this._filters, levelRange: { value: { min, max } } };
    }
  }

  _toggleFilter(group, value, checked) {
    const current = this._filters[group]?.value || [];
    const next = checked
      ? [...current, value]
      : current.filter((s) => s !== value);
    this._filters = { ...this._filters, [group]: { value: next } };
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
      <ha-settings-row narrow>
        <span slot="heading">${label}</span>
        <span slot="description">${desc}</span>
        <ha-textfield
          type="number"
          .value=${String(value)}
          min=${min}
          max=${max}
          suffix=${unit}
          data-key=${key}
          @input=${this._handleSettingInput}
        ></ha-textfield>
      </ha-settings-row>
    `;
  }

  static get styles() {
    return panelStyles;
  }
}

customElements.define("juice-patrol-panel", JuicePatrolPanel);
