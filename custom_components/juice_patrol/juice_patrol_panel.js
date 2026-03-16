class JuicePatrolPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._styleInjected = false;
    this._hass = null;
    this._entities = [];
    this._configEntry = null;
    this._settingsOpen = false;
    this._settingsDirty = false;
    this._settingsValues = {};
    this._prevEntityHash = "";
    this._sortCol = "level";
    this._sortAsc = true;
    this._userSorted = false; // True after user clicks a column header
    this._prevLevels = new Map(); // entity -> level (for change detection)
    this._recentlyChanged = new Map(); // entity -> timestamp of last change
    this._activeView = "devices"; // "devices" | "shopping"
    this._shoppingData = null;
    this._shoppingLoading = false;
    this._refreshing = false;
    this._expandedGroups = new Set(); // track expanded shopping groups by battery_type
    this._filterText = ""; // text search filter
    this._filterCategory = null; // "low" | "stale" | "unavailable" | "pending" | "anomaly" | null
  }

  disconnectedCallback() {
    if (this._flashCleanupTimer) {
      clearTimeout(this._flashCleanupTimer);
      this._flashCleanupTimer = null;
    }
  }

  set hass(hass) {
    const firstLoad = !this._hass;
    this._hass = hass;
    this._updateEntities();
    if (!this._settingsOpen) {
      // Only re-render if entity data actually changed
      const hash = this._computeHash();
      if (hash !== this._prevEntityHash) {
        this._prevEntityHash = hash;
        this._render();
      }
    }
    if (firstLoad) this._loadConfig();
  }

  _computeHash() {
    // Quick hash of entity states to avoid unnecessary re-renders
    const changed = this._recentlyChanged.size > 0 ? [...this._recentlyChanged.keys()].join(",") : "";
    return this._entities.map(d =>
      `${d.sourceEntity}:${d.level}:${d.isLow}:${d.isStale}:${d.stability}:${d.replacementPending}:${d.batteryType}`
    ).join("|") + "|!" + changed + "|v=" + this._activeView + "|f=" + this._filterText + "|c=" + this._filterCategory;
  }

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
      this._render();
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
      this._render();
      this._showToast("Settings saved");
    } catch (e) {
      console.error("Juice Patrol: failed to save settings", e);
      this._showToast("Failed to save settings");
    }
  }

  async _markReplaced(entityId) {
    try {
      await this._hass.callWS({ type: "juice_patrol/mark_replaced", entity_id: entityId });
      this._showToast("Battery marked as replaced");
    } catch (e) {
      this._showToast("Failed to mark replacement");
    }
  }

  async _confirmReplacement(entityId) {
    try {
      await this._hass.callWS({ type: "juice_patrol/confirm_replacement", entity_id: entityId });
      this._showToast("Replacement confirmed");
    } catch (e) {
      this._showToast("Failed to confirm");
    }
  }

  async _refresh() {
    if (this._refreshing) return;
    this._refreshing = true;
    this._showToast("Refreshing...");
    try {
      await this._hass.callWS({ type: "juice_patrol/refresh" });
    } catch (e) {
      this._showToast("Refresh failed");
    }
    setTimeout(() => { this._refreshing = false; }, 2000);
  }

  async _loadShoppingList() {
    if (!this._hass) return;
    this._shoppingLoading = true;
    try {
      this._shoppingData = await this._hass.callWS({ type: "juice_patrol/get_shopping_list" });
    } catch (e) {
      console.error("Juice Patrol: failed to load shopping list", e);
      this._shoppingData = null;
    }
    this._shoppingLoading = false;
    this._prevEntityHash = "";
    this._render();
  }

  _parseBatteryType(str) {
    // Parse "2× CR2032" or "3× AA" back into {count, type}
    if (!str) return { count: 0, type: "" };
    const m = str.match(/^(\d+)\s*[×x]\s*(.+)$/i);
    if (m) return { count: parseInt(m[1]), type: m[2].trim() };
    return { count: 1, type: str.trim() };
  }

  _formatBatteryType(type, count) {
    if (!type) return "";
    return count > 1 ? `${count}× ${type}` : type;
  }

  async _setBatteryType(entityId, currentType) {
    this._closeOverlays();
    const dev = this._entities.find(d => d.sourceEntity === entityId);
    const current = currentType || dev?.batteryType || "";
    const parsed = this._parseBatteryType(current);
    const presets = ["CR2032","CR2450","CR123A","AA","AAA","Li-ion","Built-in"];

    // State: selected badges (array of type strings, e.g. ["AA", "AA"])
    let badges = [];
    let lockedType = null; // Once a preset is chosen, lock to that type
    if (current && presets.includes(parsed.type)) {
      for (let i = 0; i < parsed.count; i++) badges.push(parsed.type);
      lockedType = parsed.type;
    }

    // Rechargeable state: null = auto-detect, true/false = manual override
    // Read from the device's store state (is_rechargeable attribute reflects the override or auto-detected value)
    let rechargeable = dev?.isRechargeable || false;
    let rechargeableChanged = false;

    const dialog = document.createElement("div");
    dialog.className = "jp-dialog-overlay";
    this.shadowRoot.appendChild(dialog);

    const renderDialog = () => {
      const badgeHtml = badges.length > 0
        ? badges.map((b, i) =>
          `<span class="jp-badge-chip" data-idx="${i}" title="Click to remove">${this._esc(b)} ✕</span>`
        ).join("")
        : '<span class="jp-badge-placeholder">Click a battery type below, or type a custom value</span>';

      dialog.innerHTML = `
        <div class="jp-dialog">
          <div class="jp-dialog-title">Set battery type</div>
          <div class="jp-dialog-body">
            <div class="jp-dialog-desc">${this._esc(dev?.name || entityId)}</div>
            <div class="jp-badge-field">${badgeHtml}</div>
            <div class="jp-dialog-presets">
              ${presets.map(t => {
                const disabled = lockedType !== null && t !== lockedType;
                return `<button class="jp-preset${disabled ? ' disabled' : ''}${t === lockedType ? ' active' : ''}"
                  data-type="${t}" ${disabled ? 'disabled' : ''}>${t}</button>`;
              }).join("")}
            </div>
            <div class="jp-dialog-or">or type a custom value:</div>
            <input type="text" class="jp-dialog-input" placeholder="e.g. 18650, LR44, custom..."
                   value="${badges.length === 0 && !presets.includes(parsed.type) ? this._esc(current) : ''}">
            <button class="btn btn-secondary jp-autodetect" style="margin-top:8px;width:100%">
              <ha-icon icon="mdi:auto-fix" style="--mdc-icon-size:16px;vertical-align:middle;margin-right:4px"></ha-icon>
              Autodetect
            </button>
            <label class="jp-rechargeable-toggle">
              <input type="checkbox" class="jp-rechargeable-cb" ${rechargeable ? 'checked' : ''}>
              <ha-icon icon="mdi:power-plug-battery" style="--mdc-icon-size:16px"></ha-icon>
              Rechargeable battery
            </label>
          </div>
          <div class="jp-dialog-actions">
            <button class="btn btn-secondary jp-dialog-clear">Clear</button>
            <button class="btn btn-secondary jp-dialog-cancel">Cancel</button>
            <button class="btn btn-primary jp-dialog-save">Save</button>
          </div>
        </div>
      `;
      bindDialogEvents();
    };

    const bindDialogEvents = () => {
      // Badge removal
      dialog.querySelectorAll(".jp-badge-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          badges.splice(parseInt(chip.dataset.idx), 1);
          if (badges.length === 0) lockedType = null;
          renderDialog();
        });
      });

      // Preset clicks
      dialog.querySelectorAll(".jp-preset:not([disabled])").forEach(btn => {
        btn.addEventListener("click", () => {
          const t = btn.dataset.type;
          lockedType = t;
          badges.push(t);
          // Clear custom input when using presets
          const input = dialog.querySelector(".jp-dialog-input");
          if (input) input.value = "";
          renderDialog();
        });
      });

      // Autodetect
      dialog.querySelector(".jp-autodetect")?.addEventListener("click", async () => {
        const btn = dialog.querySelector(".jp-autodetect");
        if (btn) { btn.disabled = true; btn.textContent = "Detecting..."; }
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
            // If it was a non-preset type, fill the custom input
            if (!presets.includes(p.type)) {
              const input = dialog.querySelector(".jp-dialog-input");
              if (input) input.value = result.battery_type;
            }
            this._showToast(`Detected: ${result.battery_type} (${result.source})`);
          } else {
            this._showToast("Could not auto-detect battery type");
            if (btn) { btn.disabled = false; btn.textContent = "Autodetect"; }
          }
        } catch (e) {
          console.warn("Juice Patrol: auto-detect failed", e);
          const msg = e?.message?.includes("unknown command")
            ? "Restart Home Assistant to enable auto-detection"
            : "Auto-detection failed";
          this._showToast(msg);
          if (btn) { btn.disabled = false; }
          // Restore button content with icon
          if (btn) btn.innerHTML = '<ha-icon icon="mdi:auto-fix" style="--mdc-icon-size:16px;vertical-align:middle;margin-right:4px"></ha-icon> Autodetect';
        }
      });

      // Rechargeable toggle
      dialog.querySelector(".jp-rechargeable-cb")?.addEventListener("change", (e) => {
        rechargeable = e.target.checked;
        rechargeableChanged = true;
      });

      // Overlay + cancel + clear
      dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.remove(); });
      dialog.querySelector(".jp-dialog-cancel")?.addEventListener("click", () => dialog.remove());
      dialog.querySelector(".jp-dialog-clear")?.addEventListener("click", () => {
        badges = [];
        lockedType = null;
        const input = dialog.querySelector(".jp-dialog-input");
        if (input) input.value = "";
        renderDialog();
      });

      // Save
      dialog.querySelector(".jp-dialog-save")?.addEventListener("click", async () => {
        let val;
        const customInput = dialog.querySelector(".jp-dialog-input");
        const customVal = customInput?.value?.trim();
        if (badges.length > 0) {
          val = this._formatBatteryType(lockedType, badges.length);
        } else if (customVal) {
          val = customVal;
        } else {
          val = null;
        }
        dialog.remove();
        const typeChanged = val !== (current || null);
        // Save rechargeable first (no refresh), then type (triggers refresh)
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

      // Enter/Escape on custom input
      const input = dialog.querySelector(".jp-dialog-input");
      input?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") dialog.querySelector(".jp-dialog-save")?.click();
        if (e.key === "Escape") dialog.remove();
      });
    };

    renderDialog();
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

  _esc(s) {
    if (!s) return "";
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  _showToast(message) {
    this.dispatchEvent(new CustomEvent("hass-notification", {
      bubbles: true, composed: true, detail: { message },
    }));
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
      const hasSuffix = entityId.includes("_discharge_rate") ||
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
          // New fields
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
          reliability: null,
          platform: null,
          dischargeRateHour: null,
          hoursRemaining: null,
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
        dev.dischargeRate = state.state !== "unknown" && state.state !== "unavailable"
          ? parseFloat(state.state) : null;
        // Analysis data is on discharge_rate attributes
        dev.stability = attrs.stability || null;
        dev.stabilityCv = attrs.stability_cv ?? null;
        dev.meanLevel = attrs.mean_level ?? null;
        dev.anomaly = attrs.discharge_anomaly || null;
        dev.dropSize = attrs.drop_size ?? null;
        dev.isRechargeable = attrs.is_rechargeable || false;
        dev.rechargeableReason = attrs.rechargeable_reason || null;
        dev.replacementPending = attrs.replacement_pending || false;
        dev.batteryType = attrs.battery_type || null;
        dev.batteryTypeSource = attrs.battery_type_source || null;
        dev.platform = attrs.platform || null;
        dev.dischargeRateHour = attrs.discharge_rate_hour ?? null;
      } else if (entityId.includes("_days_remaining")) {
        dev.daysRemaining = state.state !== "unknown" && state.state !== "unavailable"
          ? parseFloat(state.state) : null;
        dev.confidence = attrs.confidence || null;
        dev.reliability = attrs.reliability ?? null;
        dev.hoursRemaining = attrs.hours_remaining ?? null;
      } else if (entityId.includes("_predicted_empty")) {
        dev.predictedEmpty = state.state !== "unknown" && state.state !== "unavailable"
          ? state.state : null;
      } else if (entityId.includes("_battery_low")) {
        dev.isLow = state.state === "on";
        dev.threshold = attrs.threshold;
      } else if (entityId.includes("_stale")) {
        dev.isStale = state.state === "on";
      }
    }

    // Recompute isLow from actual level (JP entity state may lag behind source)
    const globalThreshold = this._settingsValues.low_threshold ?? 20;
    const now = Date.now();
    for (const dev of devices.values()) {
      if (dev.level !== null) {
        const t = dev.threshold ?? globalThreshold;
        dev.isLow = dev.level <= t;
      }
      // Track level changes for flash animation (compare rounded levels)
      const roundedLevel = dev.level !== null ? Math.ceil(dev.level) : null;
      const prevLevel = this._prevLevels.get(dev.sourceEntity);
      if (prevLevel !== undefined && roundedLevel !== null && roundedLevel !== prevLevel) {
        this._recentlyChanged.set(dev.sourceEntity, {
          ts: now,
          dir: roundedLevel > prevLevel ? "up" : "down",
        });
      }
      if (roundedLevel !== null) {
        this._prevLevels.set(dev.sourceEntity, roundedLevel);
      }
    }

    // Expire old change markers (older than 3s)
    for (const [key, entry] of this._recentlyChanged) {
      if (now - entry.ts > 3000) this._recentlyChanged.delete(key);
    }
    // Schedule cleanup after animation completes to stop re-render cycle
    if (this._recentlyChanged.size > 0 && !this._flashCleanupTimer) {
      this._flashCleanupTimer = setTimeout(() => {
        this._flashCleanupTimer = null;
        this._recentlyChanged.clear();
        this._prevEntityHash = ""; // Force re-render to remove animation class
      }, 3000);
    }

    this._entities = this._sortEntities([...devices.values()]);
  }

  _sortEntities(list) {
    const col = this._sortCol;
    const asc = this._sortAsc;
    const dir = asc ? 1 : -1;

    return list.sort((a, b) => {
      // Only group attention items to top on the default sort
      if (!this._userSorted) {
        const aAtt = a.replacementPending || a.isLow || a.isStale ||
          (a.anomaly && a.anomaly !== "normal");
        const bAtt = b.replacementPending || b.isLow || b.isStale ||
          (b.anomaly && b.anomaly !== "normal");
        if (aAtt !== bAtt) return aAtt ? -1 : 1;
      }

      const av = this._getSortValue(a, col);
      const bv = this._getSortValue(b, col);
      if (av === bv) return 0;
      // Nulls always sort to bottom
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av < bv ? -1 : 1) * dir;
    });
  }

  _getSortValue(dev, col) {
    switch (col) {
      case "name": return (dev.name || dev.sourceEntity).toLowerCase();
      case "level": return dev.level;
      case "type": return (dev.batteryType || "").toLowerCase() || null;
      case "rate": return dev.dischargeRate;
      case "days": return dev.daysRemaining;
      case "reliability": return dev.reliability;
      case "empty": return dev.predictedEmpty;
      default: return dev.level;
    }
  }

  _getFilteredEntities() {
    let list = this._entities;
    // Category filter (from summary card click)
    const cat = this._filterCategory;
    if (cat === "low") list = list.filter(d => d.isLow);
    else if (cat === "stale") list = list.filter(d => d.isStale);
    else if (cat === "unavailable") list = list.filter(d => d.level === null);
    else if (cat === "pending") list = list.filter(d => d.replacementPending);
    else if (cat === "anomaly") list = list.filter(d => d.anomaly && d.anomaly !== "normal");

    // Text search filter
    const q = this._filterText.toLowerCase().trim();
    if (q) {
      list = list.filter(d => {
        const name = (d.name || d.sourceEntity).toLowerCase();
        const type = (d.batteryType || "").toLowerCase();
        const plat = (d.platform || "").toLowerCase();
        const entity = d.sourceEntity.toLowerCase();
        return name.includes(q) || type.includes(q) || plat.includes(q) || entity.includes(q);
      });
    }
    return list;
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

  _formatDate(isoString) {
    if (!isoString) return "\u2014";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch { return "\u2014"; }
  }

  _renderBadges(dev) {
    let badges = "";
    if (dev.replacementPending) {
      badges += `<span class="badge replaced" title="Battery level jumped significantly — was the battery replaced?">REPLACED?</span>`;
    }
    if (dev.isLow) {
      const t = dev.threshold ?? this._settingsValues.low_threshold ?? 20;
      badges += `<span class="badge low" title="Battery is at ${this._displayLevel(dev.level)}%, below the ${t}% threshold">LOW</span>`;
    }
    if (dev.isStale) {
      badges += `<span class="badge stale" title="No battery reading received within the stale timeout period">STALE</span>`;
    }
    if (dev.anomaly === "cliff") {
      badges += `<span class="badge cliff" title="Sudden drop of ${dev.dropSize ?? '?'}% in a single reading interval — possible sensor glitch or failing battery">CLIFF DROP</span>`;
    } else if (dev.anomaly === "rapid") {
      badges += `<span class="badge rapid" title="Discharge rate is significantly higher than recent average — ${dev.dropSize ?? '?'}% drop detected">RAPID</span>`;
    }
    if (dev.stability === "erratic") {
      badges += `<span class="badge erratic" title="${this._erraticTooltip(dev)}">ERRATIC</span>`;
    }
    if (dev.isRechargeable) {
      badges += `<span class="badge rechargeable" title="Rechargeable: ${this._esc(dev.rechargeableReason) || 'detected'}"><ha-icon icon="mdi:power-plug-battery" style="--mdc-icon-size:14px"></ha-icon></span>`;
    }
    if (dev.meanLevel !== null && dev.stability && dev.stability !== "stable" && dev.stability !== "insufficient_data") {
      const displayMean = this._displayLevel(dev.meanLevel);
      const displayLevel = this._displayLevel(dev.level);
      if (displayMean !== null && Math.abs(displayMean - (displayLevel ?? 0)) > 2) {
        badges += `<span class="badge avg" title="7-day average is ${displayMean}% while current reading is ${displayLevel ?? '?'}%">avg ${displayMean}%</span>`;
      }
    }
    return badges;
  }

  _erraticTooltip(dev) {
    const parts = [];
    const display = this._displayLevel(dev.level);
    const mean = this._displayLevel(dev.meanLevel);

    if (mean !== null && display !== null && display > mean + 3 && !dev.isRechargeable) {
      parts.push(`Level is rising (${display}%) without a charge state — not expected for a non-rechargeable battery`);
    } else if (mean !== null && display !== null && Math.abs(display - mean) > 5) {
      parts.push(`Current level (${display}%) differs significantly from 7-day average (${mean}%)`);
    }

    if (dev.stabilityCv !== null && dev.stabilityCv > 0.05) {
      parts.push(`High reading variance (CV: ${(dev.stabilityCv * 100).toFixed(1)}%)`);
    }

    if (parts.length === 0) {
      parts.push("Battery readings show non-monotonic or inconsistent behavior");
    }

    return parts.join(". ");
  }

  _displayLevel(level) {
    // Round up so 0.5% shows as 1%, not 0%
    if (level === null) return null;
    return Math.ceil(level);
  }

  _isFastDischarge(dev) {
    // A device is "fast discharge" if its hourly rate is meaningful (>1%/hr)
    return dev.dischargeRateHour !== null && dev.dischargeRateHour >= 1;
  }

  _formatRate(dev) {
    if (this._isFastDischarge(dev)) {
      return dev.dischargeRateHour !== null ? dev.dischargeRateHour + '%/h' : '\u2014';
    }
    return dev.dischargeRate !== null ? dev.dischargeRate + '%/d' : '\u2014';
  }

  _formatTimeRemaining(dev) {
    if (this._isFastDischarge(dev) && dev.hoursRemaining !== null) {
      if (dev.hoursRemaining < 1) return Math.round(dev.hoursRemaining * 60) + 'm';
      return dev.hoursRemaining + 'h';
    }
    return dev.daysRemaining !== null ? dev.daysRemaining + 'd' : '\u2014';
  }

  _renderLevelCell(dev) {
    const color = this._getLevelColor(dev.level, dev.threshold);
    const display = this._displayLevel(dev.level);
    const text = display !== null ? display + "%" : "\u2014";
    return `<div class="level-cell" style="color:${color}">${text}</div>`;
  }

  _renderReliabilityBadge(dev) {
    const r = dev.reliability;
    // Only show reliability when there's an active time-remaining prediction
    const hasTimePrediction = dev.daysRemaining !== null || dev.hoursRemaining !== null;
    if (r === null || r === undefined || !hasTimePrediction) return '\u2014';
    let cls;
    if (r >= 70) cls = 'high';
    else if (r >= 40) cls = 'medium';
    else cls = 'low';
    return `<span class="reliability-badge ${cls}" title="Prediction reliability: ${r}%">${r}%</span>`;
  }

  _renderShoppingList() {
    if (this._shoppingLoading) {
      return `<div class="devices"><div class="empty-state">Loading shopping list...</div></div>`;
    }
    if (!this._shoppingData || !this._shoppingData.groups) {
      return `<div class="devices"><div class="empty-state">No shopping data available. Click refresh to load.</div></div>`;
    }
    const { groups, total_needed } = this._shoppingData;
    if (groups.length === 0) {
      return `<div class="devices"><div class="empty-state">No battery devices found.</div></div>`;
    }
    let html = `<div class="shopping-summary">
      <div class="summary-card">
        <div class="value" style="color:${total_needed > 0 ? 'var(--warning-color)' : 'var(--success-color)'}">${total_needed}</div>
        <div class="label">Batteries needed</div>
      </div>
      ${groups.filter(g => g.needs_replacement > 0 && g.battery_type !== "Unknown").map(g =>
        `<div class="summary-card shopping-need-card">
          <div class="value">${g.needs_replacement}</div>
          <div class="label">${this._esc(g.battery_type)}</div>
        </div>`
      ).join('')}
    </div><div class="shopping-groups">`;

    for (const group of groups) {
      const isUnknown = group.battery_type === "Unknown";
      const icon = isUnknown ? "mdi:help-circle-outline" : "mdi:battery";
      const isExpanded = this._expandedGroups.has(group.battery_type);
      html += `
        <div class="shopping-group${isExpanded ? ' expanded' : ''}">
          <div class="shopping-group-header" data-type="${this._esc(group.battery_type)}">
            <ha-icon icon="${icon}" style="--mdc-icon-size:20px;color:var(--secondary-text-color)"></ha-icon>
            <span class="shopping-type">${this._esc(group.battery_type)}</span>
            ${group.needs_replacement > 0 ? `<span class="shopping-need-badge">${group.needs_replacement}\u00d7</span>` : ''}
            <span class="shopping-count">${group.battery_count} batter${group.battery_count !== 1 ? 'ies' : 'y'} in ${group.device_count} device${group.device_count !== 1 ? 's' : ''}${group.needs_replacement > 0 ? ` \u2014 ${group.needs_replacement} need${group.needs_replacement !== 1 ? '' : 's'} replacement` : ''}</span>
            <ha-icon icon="mdi:chevron-down" class="shopping-expand-icon" style="--mdc-icon-size:20px;color:var(--secondary-text-color)"></ha-icon>
          </div>
          <div class="shopping-devices" style="display:${isExpanded ? 'block' : 'none'}">
            ${group.devices.map(d => {
              const levelColor = this._getLevelColor(d.level, null);
              const display = this._displayLevel(d.level);
              const needsIt = d.is_low || (d.days_remaining !== null && d.days_remaining <= (this._settingsValues.prediction_horizon ?? 7));
              const countLabel = d.battery_count > 1 ? ` (${d.battery_count}\u00d7)` : '';
              return `<div class="shopping-device ${needsIt ? 'needs-replacement' : ''}">
                <span class="shopping-device-name">${this._esc(d.device_name)}${countLabel}</span>
                <span class="shopping-device-level" style="color:${levelColor}">${display !== null ? display + '%' : '\u2014'}</span>
                <span class="shopping-device-days">${d.days_remaining !== null ? d.days_remaining + 'd' : '\u2014'}</span>
              </div>`;
            }).join('')}
          </div>
        </div>`;
    }
    html += `</div>`;
    if (groups.some(g => g.battery_type === "Unknown")) {
      html += `<div class="shopping-hint">
        <ha-icon icon="mdi:information-outline" style="--mdc-icon-size:16px"></ha-icon>
        Devices with unknown battery type can be configured from the Devices tab.
      </div>`;
    }
    return html;
  }

  _render() {
    if (!this._hass) return;

    // Find summary entity dynamically (entity ID may vary)
    const summary = Object.values(this._hass.states).find(
      s => s.entity_id.includes("attention_needed") && s.attributes.monitored_devices !== undefined
    );
    const totalDevices = this._entities.length;
    // Count from actual entity data (more reliable than summary entity)
    const lowCount = this._entities.filter(d => d.isLow).length;
    const staleCount = this._entities.filter(d => d.isStale).length;
    const unavailableCount = this._entities.filter(d => d.level === null).length;
    const pendingCount = this._entities.filter(d => d.replacementPending).length;
    const anomalyCount = this._entities.filter(d => d.anomaly && d.anomaly !== "normal").length;

    const opts = this._settingsValues;
    const hasConfig = this._configEntry !== null;

    // Inject styles once; re-renders only update the content container
    if (!this._styleInjected) {
      this._styleInjected = true;
      const style = document.createElement("style");
      style.textContent = `
        :host {
          display: block;
          padding: 16px;
          font-family: var(--primary-font-family, Roboto, sans-serif);
          color: var(--primary-text-color);
          background: var(--primary-background-color);
          --card-bg: var(--ha-card-background, var(--card-background-color, #fff));
          --border: var(--divider-color, rgba(0,0,0,.12));
        }
        .header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 400; flex: 1; }
        .settings-toggle {
          background: none; border: none; cursor: pointer;
          color: var(--secondary-text-color); padding: 8px; border-radius: 50%;
          display: flex; align-items: center;
        }
        .settings-toggle:hover { background: var(--secondary-background-color); color: var(--primary-text-color); }
        .summary { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
        .summary-card {
          background: var(--card-bg); border-radius: 12px;
          padding: 16px 20px; min-width: 120px; border: 1px solid var(--border);
        }
        .summary-card.clickable { cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; }
        .summary-card.clickable:hover { border-color: var(--primary-color); }
        .summary-card.active-filter { border-color: var(--primary-color); box-shadow: 0 0 0 1px var(--primary-color); }

        /* Filter bar */
        .filter-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .search-field {
          display: flex; align-items: center; gap: 8px; flex: 1;
          padding: 8px 12px; border: 1px solid var(--border); border-radius: 10px;
          background: var(--card-bg);
        }
        .search-field:focus-within { border-color: var(--primary-color); }
        .search-field input {
          flex: 1; border: none; background: none; outline: none;
          font-size: 14px; color: var(--primary-text-color);
          font-family: inherit;
        }
        .search-field input::placeholder { color: var(--secondary-text-color); }
        .search-clear {
          background: none; border: none; cursor: pointer; padding: 2px;
          color: var(--secondary-text-color); display: flex; align-items: center;
          border-radius: 50%;
        }
        .search-clear:hover { color: var(--primary-text-color); background: var(--secondary-background-color); }
        .filter-chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 6px 10px; border: 1px solid var(--primary-color);
          border-radius: 16px; background: color-mix(in srgb, var(--primary-color) 10%, transparent);
          color: var(--primary-color); font-size: 12px; font-weight: 500;
          cursor: pointer; white-space: nowrap; font-family: inherit;
        }
        .filter-chip:hover { background: color-mix(in srgb, var(--primary-color) 20%, transparent); }
        .summary-card .value { font-size: 28px; font-weight: 500; }
        .summary-card .label { font-size: 13px; color: var(--secondary-text-color); margin-top: 2px; }
        .settings {
          background: var(--card-bg); border-radius: 12px;
          border: 1px solid var(--border); margin-bottom: 20px; overflow: hidden;
        }
        .settings-header {
          display: flex; align-items: center; padding: 14px 16px;
          font-size: 14px; font-weight: 500; border-bottom: 1px solid var(--border);
        }
        .settings-header ha-icon { --mdc-icon-size: 20px; margin-right: 8px; color: var(--secondary-text-color); }
        .settings-body { padding: 8px 0; }
        .setting-row { display: grid; grid-template-columns: 1fr 120px; align-items: center; padding: 12px 16px; gap: 16px; }
        .setting-info { display: flex; flex-direction: column; }
        .setting-label { font-size: 14px; }
        .setting-desc { font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; line-height: 1.4; }
        .setting-input { display: flex; align-items: center; gap: 6px; justify-content: flex-end; }
        .setting-input input {
          width: 64px; padding: 6px 8px; border: 1px solid var(--border); border-radius: 8px;
          background: var(--primary-background-color); color: var(--primary-text-color);
          font-size: 14px; text-align: right; outline: none;
        }
        .setting-input input:focus { border-color: var(--primary-color); }
        .setting-unit { font-size: 13px; color: var(--secondary-text-color); min-width: 28px; }
        .settings-actions { display: flex; justify-content: flex-end; padding: 8px 16px 14px; gap: 8px; }
        .btn { padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; }
        .btn-primary { background: var(--primary-color); color: var(--text-primary-color, #fff); }
        .btn-primary:disabled { opacity: 0.5; cursor: default; }
        .btn-secondary { background: var(--secondary-background-color); color: var(--primary-text-color); }
        .devices { background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border); overflow: hidden; }
        .device-row {
          display: grid; grid-template-columns: 44px 1fr 90px 70px 80px 90px 50px 100px 56px;
          align-items: center; padding: 10px 16px; gap: 6px;
          border-bottom: 1px solid var(--border); cursor: pointer;
        }
        .device-row:last-child { border-bottom: none; }
        .device-row:hover { background: var(--secondary-background-color); }
        .device-row.attention { background: color-mix(in srgb, var(--error-color, #db4437) 8%, transparent); }
        .device-row.attention:hover { background: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent); }
        .device-row.pending { background: color-mix(in srgb, var(--primary-color) 8%, transparent); }
        .device-row.pending:hover { background: color-mix(in srgb, var(--primary-color) 14%, transparent); }
        .device-header {
          display: grid; grid-template-columns: 44px 1fr 90px 70px 80px 90px 50px 100px 56px;
          padding: 10px 16px; gap: 6px; font-size: 12px; font-weight: 500;
          color: var(--secondary-text-color); text-transform: uppercase;
          letter-spacing: 0.5px; border-bottom: 2px solid var(--border);
        }
        .icon-cell { display: flex; align-items: center; justify-content: center; }
        .icon-cell ha-icon { --mdc-icon-size: 24px; }
        .name-cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
        .name-sub { font-size: 11px; color: var(--secondary-text-color); margin-top: 1px; }
        .badge {
          display: inline-block; font-size: 9px; padding: 1px 5px; border-radius: 4px;
          margin-left: 4px; font-weight: 500; vertical-align: middle;
        }
        .badge.low { background: color-mix(in srgb, var(--error-color) 20%, transparent); color: var(--error-color); }
        .badge.stale { background: color-mix(in srgb, var(--warning-color) 20%, transparent); color: var(--warning-color); }
        .badge.replaced { background: color-mix(in srgb, var(--primary-color) 20%, transparent); color: var(--primary-color); }
        .badge.cliff, .badge.rapid { background: color-mix(in srgb, var(--error-color) 15%, transparent); color: var(--error-color); }
        .badge.erratic { background: color-mix(in srgb, var(--warning-color) 15%, transparent); color: var(--warning-color); }
        .badge.rechargeable { background: color-mix(in srgb, var(--success-color, #43a047) 15%, transparent); color: var(--success-color, #43a047); padding: 2px 5px; display: inline-flex; align-items: center; }
        .badge.avg { background: color-mix(in srgb, var(--info-color, #039be5) 15%, transparent); color: var(--info-color, #039be5); }
        .level-cell { font-size: 14px; font-weight: 500; text-align: left; }
        .data-cell { font-size: 13px; color: var(--secondary-text-color); text-align: right; }
        .action-cell { display: flex; justify-content: center; }
        .action-btn {
          background: none; border: 1px solid var(--border); border-radius: 6px;
          cursor: pointer; padding: 4px 6px; color: var(--secondary-text-color);
          display: flex; align-items: center;
        }
        .action-btn:hover { background: var(--secondary-background-color); color: var(--primary-text-color); }
        .action-btn.confirm { border-color: var(--primary-color); color: var(--primary-color); }
        .confidence-dot {
          display: inline-block; width: 6px; height: 6px; border-radius: 50%;
          margin-right: 4px; vertical-align: middle;
        }
        .confidence-dot.high { background: var(--success-color); }
        .confidence-dot.medium { background: var(--warning-color); }
        .confidence-dot.low { background: var(--error-color); }
        .sort-header {
          cursor: pointer; user-select: none; display: flex;
          align-items: center; gap: 2px; justify-content: flex-end;
        }
        .sort-header:first-of-type { justify-content: flex-start; }
        .sort-header:hover { color: var(--primary-text-color); }
        .sort-header.active { color: var(--primary-color); }
        .sort-arrow { font-size: 10px; }
        .type-cell { font-size: 12px; color: var(--secondary-text-color); text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .empty-state { padding: 40px; text-align: center; color: var(--secondary-text-color); }

        /* Action menu dropdown */
        .jp-menu-overlay {
          position: fixed; inset: 0; z-index: 10;
        }
        .jp-menu {
          position: fixed; z-index: 11;
          background: var(--primary-background-color, #fff); border: 1px solid var(--border);
          border-radius: 12px; padding: 6px 0; min-width: 220px;
          box-shadow: 0 4px 16px rgba(0,0,0,.25);
        }
        .jp-menu-item {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 10px 16px; border: none; background: none;
          cursor: pointer; font-size: 14px; color: var(--primary-text-color);
          text-align: left; font-family: inherit;
        }
        .jp-menu-item:hover { background: var(--secondary-background-color); }
        .jp-menu-item ha-icon { color: var(--secondary-text-color); }

        /* Dialog overlay */
        .jp-dialog-overlay {
          position: fixed; inset: 0; z-index: 20;
          background: rgba(0,0,0,.4); display: flex;
          align-items: center; justify-content: center;
        }
        .jp-dialog {
          background: var(--card-bg); border-radius: 16px;
          padding: 24px; min-width: 340px; max-width: 90vw;
          box-shadow: 0 8px 32px rgba(0,0,0,.25);
        }
        .jp-dialog-title { font-size: 18px; font-weight: 500; margin-bottom: 16px; }
        .jp-dialog-desc { font-size: 13px; color: var(--secondary-text-color); margin-bottom: 12px; }
        .jp-dialog-input {
          width: 100%; padding: 10px 12px; border: 1px solid var(--border);
          border-radius: 8px; background: var(--primary-background-color);
          color: var(--primary-text-color); font-size: 14px;
          outline: none; box-sizing: border-box;
        }
        .jp-dialog-input:focus { border-color: var(--primary-color); }
        .jp-dialog-presets {
          display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px;
        }
        .jp-preset {
          padding: 4px 10px; border: 1px solid var(--border); border-radius: 16px;
          background: var(--secondary-background-color); color: var(--primary-text-color);
          font-size: 12px; cursor: pointer; font-family: inherit;
        }
        .jp-preset:hover:not([disabled]) { border-color: var(--primary-color); color: var(--primary-color); }
        .jp-preset.active { border-color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 15%, transparent); color: var(--primary-color); }
        .jp-preset.disabled { opacity: 0.35; cursor: default; }
        .jp-badge-field {
          display: flex; flex-wrap: wrap; gap: 6px; min-height: 40px;
          padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px;
          background: var(--primary-background-color); align-items: center;
          margin-bottom: 12px;
        }
        .jp-badge-chip {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 4px 10px; border-radius: 16px; font-size: 13px; font-weight: 500;
          background: color-mix(in srgb, var(--primary-color) 15%, transparent);
          color: var(--primary-color); cursor: pointer; user-select: none;
          border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
        }
        .jp-badge-chip:hover { background: color-mix(in srgb, var(--error-color) 15%, transparent); color: var(--error-color); border-color: color-mix(in srgb, var(--error-color) 30%, transparent); }
        .jp-badge-placeholder { color: var(--secondary-text-color); font-size: 13px; font-style: italic; }
        .jp-dialog-or { font-size: 12px; color: var(--secondary-text-color); margin: 12px 0 6px; text-align: center; }
        .jp-rechargeable-toggle {
          display: flex; align-items: center; gap: 8px; margin-top: 12px;
          padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;
          cursor: pointer; font-size: 14px; user-select: none;
        }
        .jp-rechargeable-toggle:hover { border-color: var(--primary-color); }
        .jp-rechargeable-toggle ha-icon { color: var(--secondary-text-color); }
        .jp-rechargeable-toggle:has(input:checked) { border-color: var(--success-color, #43a047); background: color-mix(in srgb, var(--success-color, #43a047) 8%, transparent); }
        .jp-rechargeable-toggle:has(input:checked) ha-icon { color: var(--success-color, #43a047); }
        .jp-dialog-actions {
          display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px;
        }
        /* Flash animation for recently updated rows */
        @keyframes jp-flash-up {
          0% { background: color-mix(in srgb, var(--success-color, #43a047) 25%, transparent); }
          100% { background: transparent; }
        }
        @keyframes jp-flash-down {
          0% { background: color-mix(in srgb, var(--warning-color, #ffa726) 25%, transparent); }
          100% { background: transparent; }
        }
        @keyframes jp-flash-up-attention {
          0% { background: color-mix(in srgb, var(--success-color, #43a047) 25%, transparent); }
          100% { background: color-mix(in srgb, var(--error-color, #db4437) 8%, transparent); }
        }
        @keyframes jp-flash-down-attention {
          0% { background: color-mix(in srgb, var(--warning-color, #ffa726) 25%, transparent); }
          100% { background: color-mix(in srgb, var(--error-color, #db4437) 8%, transparent); }
        }
        .device-row.just-updated-up { animation: jp-flash-up 2.5s ease-out; }
        .device-row.just-updated-down { animation: jp-flash-down 2.5s ease-out; }
        .device-row.attention.just-updated-up { animation: jp-flash-up-attention 2.5s ease-out; }
        .device-row.attention.just-updated-down { animation: jp-flash-down-attention 2.5s ease-out; }

        /* Reliability badge */
        .reliability-cell { text-align: center !important; }
        .reliability-badge {
          display: inline-block; font-size: 11px; font-weight: 500;
          padding: 1px 6px; border-radius: 8px;
        }
        .reliability-badge.high { background: color-mix(in srgb, var(--success-color, #43a047) 15%, transparent); color: var(--success-color, #43a047); }
        .reliability-badge.medium { background: color-mix(in srgb, var(--warning-color, #ffa726) 15%, transparent); color: var(--warning-color, #ffa726); }
        .reliability-badge.low { background: color-mix(in srgb, var(--disabled-text-color, #999) 15%, transparent); color: var(--disabled-text-color, #999); }

        /* Tab bar */
        .tab-bar {
          display: flex; gap: 0; margin-bottom: 16px;
          border-bottom: 2px solid var(--border);
        }
        .tab {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 20px; border: none; background: none;
          cursor: pointer; font-size: 14px; font-weight: 500;
          color: var(--secondary-text-color); border-bottom: 2px solid transparent;
          margin-bottom: -2px; font-family: inherit;
        }
        .tab:hover { color: var(--primary-text-color); }
        .tab.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }

        /* Shopping list */
        .shopping-summary { display: flex; gap: 16px; margin-bottom: 16px; }
        .shopping-groups { display: flex; flex-direction: column; gap: 8px; }
        .shopping-group {
          background: var(--card-bg); border-radius: 12px;
          border: 1px solid var(--border); overflow: hidden;
        }
        .shopping-group-header {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px; cursor: pointer; user-select: none;
        }
        .shopping-group-header:hover { background: var(--secondary-background-color); }
        .shopping-type { font-size: 16px; font-weight: 500; }
        .shopping-count { flex: 1; font-size: 13px; color: var(--secondary-text-color); }
        .shopping-expand-icon { transition: transform 0.2s; }
        .shopping-group.expanded .shopping-expand-icon { transform: rotate(180deg); }
        .shopping-devices { padding: 0 16px 8px; }
        .shopping-device {
          display: grid; grid-template-columns: 1fr 60px 60px;
          padding: 8px 0; border-top: 1px solid var(--border);
          font-size: 13px; align-items: center;
        }
        .shopping-device.needs-replacement { color: var(--error-color); }
        .shopping-device-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .shopping-device-level { text-align: right; font-weight: 500; }
        .shopping-device-days { text-align: right; color: var(--secondary-text-color); }
        .shopping-need-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 28px; height: 24px; padding: 0 6px;
          border-radius: 12px; font-size: 12px; font-weight: 600;
          background: color-mix(in srgb, var(--error-color, #db4437) 15%, transparent);
          color: var(--error-color, #db4437);
        }
        .shopping-need-card { min-width: 80px; text-align: center; }
        .shopping-need-card .value { font-size: 22px; }
        .shopping-need-card .label { font-size: 11px; }
        .shopping-hint {
          display: flex; align-items: center; gap: 8px;
          margin-top: 12px; padding: 12px 16px;
          background: color-mix(in srgb, var(--info-color, #039be5) 10%, transparent);
          border-radius: 8px; font-size: 13px; color: var(--secondary-text-color);
        }

        @media (max-width: 900px) {
          .device-row, .device-header { grid-template-columns: 36px 1fr 60px 56px; }
          .type-cell, .reliability-cell,
          .device-row > :nth-child(n+5):not(.action-cell),
          .device-header > :nth-child(n+5):not(:last-child) { display: none; }
        }
      `;
      this.shadowRoot.appendChild(style);
      this._container = document.createElement("div");
      this._container.id = "jp-content";
      this.shadowRoot.appendChild(this._container);
    }

    this._container.innerHTML = `
      <div class="header">
        <ha-icon icon="mdi:battery-heart" style="--mdc-icon-size:28px"></ha-icon>
        <h1>Juice Patrol</h1>
        <button class="settings-toggle" id="refreshBtn" title="Refresh (invalidate cache)" ${this._refreshing ? 'disabled' : ''}>
          <ha-icon icon="mdi:refresh" style="--mdc-icon-size:22px"></ha-icon>
        </button>
        <button class="settings-toggle" id="toggleSettings" title="Settings">
          <ha-icon icon="mdi:cog" style="--mdc-icon-size:22px"></ha-icon>
        </button>
      </div>

      <div class="summary">
        <div class="summary-card clickable ${this._filterCategory === null ? 'active-filter' : ''}" data-filter="">
          <div class="value">${totalDevices}</div>
          <div class="label">Monitored</div>
        </div>
        <div class="summary-card clickable ${this._filterCategory === 'low' ? 'active-filter' : ''}" data-filter="low">
          <div class="value" style="color:${lowCount > 0 ? 'var(--error-color)' : 'inherit'}">${lowCount}</div>
          <div class="label">Low battery</div>
        </div>
        <div class="summary-card clickable ${this._filterCategory === 'stale' ? 'active-filter' : ''}" data-filter="stale">
          <div class="value" style="color:${staleCount > 0 ? 'var(--warning-color)' : 'inherit'}">${staleCount}</div>
          <div class="label">Stale</div>
        </div>
        ${unavailableCount > 0 ? `<div class="summary-card clickable ${this._filterCategory === 'unavailable' ? 'active-filter' : ''}" data-filter="unavailable">
          <div class="value" style="color:var(--disabled-text-color)">${unavailableCount}</div>
          <div class="label">Unavailable</div>
        </div>` : ''}
        ${pendingCount > 0 ? `<div class="summary-card clickable ${this._filterCategory === 'pending' ? 'active-filter' : ''}" data-filter="pending">
          <div class="value" style="color:var(--primary-color)">${pendingCount}</div>
          <div class="label">Replaced?</div>
        </div>` : ''}
        ${anomalyCount > 0 ? `<div class="summary-card clickable ${this._filterCategory === 'anomaly' ? 'active-filter' : ''}" data-filter="anomaly">
          <div class="value" style="color:var(--error-color)">${anomalyCount}</div>
          <div class="label">Anomaly</div>
        </div>` : ''}
      </div>

      ${this._settingsOpen && hasConfig ? `
        <div class="settings">
          <div class="settings-header"><ha-icon icon="mdi:cog"></ha-icon> Settings</div>
          <div class="settings-body">
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Low battery threshold</div>
                <div class="setting-desc">Devices below this level trigger a <code>juice_patrol_battery_low</code> event.</div>
              </div>
              <div class="setting-input">
                <input type="number" min="1" max="99" data-key="low_threshold" value="${opts.low_threshold ?? 20}">
                <span class="setting-unit">%</span>
              </div>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Stale device timeout</div>
                <div class="setting-desc">Devices not reporting within this period are marked stale.</div>
              </div>
              <div class="setting-input">
                <input type="number" min="1" max="720" data-key="stale_timeout" value="${opts.stale_timeout ?? 48}">
                <span class="setting-unit">hrs</span>
              </div>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Prediction alert horizon</div>
                <div class="setting-desc">Alert when a device is predicted to die within this many days.</div>
              </div>
              <div class="setting-input">
                <input type="number" min="1" max="90" data-key="prediction_horizon" value="${opts.prediction_horizon ?? 7}">
                <span class="setting-unit">days</span>
              </div>
            </div>
          </div>
          <div class="settings-actions">
            <button class="btn btn-secondary" id="cancelSettings">Cancel</button>
            <button class="btn btn-primary" id="saveSettings" ${!this._settingsDirty ? 'disabled' : ''}>Save</button>
          </div>
        </div>
      ` : ''}

      <div class="filter-bar">
        <div class="search-field">
          <ha-icon icon="mdi:magnify" style="--mdc-icon-size:20px;color:var(--secondary-text-color)"></ha-icon>
          <input type="text" id="searchInput" placeholder="Filter devices..." value="${this._esc(this._filterText)}">
          ${this._filterText ? `<button class="search-clear" id="clearSearch" title="Clear search">
            <ha-icon icon="mdi:close" style="--mdc-icon-size:16px"></ha-icon>
          </button>` : ''}
        </div>
        ${this._filterCategory ? `<button class="filter-chip" id="clearFilter">
          <ha-icon icon="mdi:filter-remove" style="--mdc-icon-size:14px"></ha-icon>
          ${this._filterCategory === 'low' ? 'Low battery' : this._filterCategory === 'stale' ? 'Stale' : this._filterCategory === 'unavailable' ? 'Unavailable' : this._filterCategory === 'pending' ? 'Replaced?' : 'Anomaly'}
          <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
        </button>` : ''}
      </div>

      <div class="tab-bar">
        <button class="tab ${this._activeView === 'devices' ? 'active' : ''}" data-view="devices">
          <ha-icon icon="mdi:battery-heart-variant" style="--mdc-icon-size:18px"></ha-icon> Devices
        </button>
        <button class="tab ${this._activeView === 'shopping' ? 'active' : ''}" data-view="shopping">
          <ha-icon icon="mdi:cart-outline" style="--mdc-icon-size:18px"></ha-icon> Shopping List
        </button>
      </div>

      ${this._activeView === 'shopping' ? this._renderShoppingList() : (() => {
        const filtered = this._getFilteredEntities();
        return `
      <div class="devices">
        ${filtered.length === 0 ? `
          <div class="empty-state">${this._entities.length === 0 ? 'No battery devices discovered yet.' : 'No devices match the current filter.'}</div>
        ` : `
          <div class="device-header">
            <div></div>
            <div class="sort-header ${this._sortCol === 'name' ? 'active' : ''}" data-sort="name" style="justify-content:flex-start">
              Device${this._sortCol === 'name' ? `<span class="sort-arrow">${this._sortAsc ? '\u25B2' : '\u25BC'}</span>` : ''}
            </div>
            <div class="sort-header ${this._sortCol === 'level' ? 'active' : ''}" data-sort="level" style="justify-content:flex-start">
              Level${this._sortCol === 'level' ? `<span class="sort-arrow">${this._sortAsc ? '\u25B2' : '\u25BC'}</span>` : ''}
            </div>
            <div class="sort-header ${this._sortCol === 'type' ? 'active' : ''}" data-sort="type" style="justify-content:flex-start">
              Type${this._sortCol === 'type' ? `<span class="sort-arrow">${this._sortAsc ? '\u25B2' : '\u25BC'}</span>` : ''}
            </div>
            <div class="sort-header ${this._sortCol === 'rate' ? 'active' : ''}" data-sort="rate">
              Rate${this._sortCol === 'rate' ? `<span class="sort-arrow">${this._sortAsc ? '\u25B2' : '\u25BC'}</span>` : ''}
            </div>
            <div class="sort-header ${this._sortCol === 'days' ? 'active' : ''}" data-sort="days">
              Days left${this._sortCol === 'days' ? `<span class="sort-arrow">${this._sortAsc ? '\u25B2' : '\u25BC'}</span>` : ''}
            </div>
            <div class="sort-header ${this._sortCol === 'reliability' ? 'active' : ''}" data-sort="reliability" title="Prediction reliability score (0-100%)">
              Rel${this._sortCol === 'reliability' ? `<span class="sort-arrow">${this._sortAsc ? '\u25B2' : '\u25BC'}</span>` : ''}
            </div>
            <div class="sort-header ${this._sortCol === 'empty' ? 'active' : ''}" data-sort="empty">
              Empty by${this._sortCol === 'empty' ? `<span class="sort-arrow">${this._sortAsc ? '\u25B2' : '\u25BC'}</span>` : ''}
            </div>
            <div></div>
          </div>
          ${filtered.map(dev => {
            const changeEntry = this._recentlyChanged.get(dev.sourceEntity);
            let rowClass = dev.replacementPending ? 'pending' :
              (dev.isLow || dev.isStale || (dev.anomaly && dev.anomaly !== 'normal')) ? 'attention' : '';
            if (changeEntry) rowClass += changeEntry.dir === 'up' ? ' just-updated-up' : ' just-updated-down';
            return `
            <div class="device-row ${rowClass}" data-entity="${dev.sourceEntity}">
              <div class="icon-cell">
                <ha-icon icon="${this._getBatteryIcon(dev)}"
                         style="color:${this._getLevelColor(dev.level, dev.threshold)}"></ha-icon>
              </div>
              <div class="name-cell">
                <div>${this._esc(dev.name || dev.sourceEntity)}${this._renderBadges(dev)}</div>
                ${dev.platform ? `<div class="name-sub">${this._esc(dev.platform)}</div>` : ''}
              </div>
              ${this._renderLevelCell(dev)}
              <div class="type-cell" ${dev.batteryTypeSource ? `title="Source: ${this._esc(dev.batteryTypeSource)}"` : ''}>${this._esc(dev.batteryType) || '\u2014'}</div>
              <div class="data-cell">${this._formatRate(dev)}</div>
              <div class="data-cell">${this._formatTimeRemaining(dev)}</div>
              <div class="data-cell reliability-cell">${this._renderReliabilityBadge(dev)}</div>
              <div class="data-cell">${this._formatDate(dev.predictedEmpty)}</div>
              <div class="action-cell">
                ${dev.replacementPending
                  ? `<button class="action-btn confirm" data-action="confirm" data-source="${dev.sourceEntity}" title="Confirm replacement">
                       <ha-icon icon="mdi:check" style="--mdc-icon-size:16px"></ha-icon>
                     </button>`
                  : `<button class="action-btn" data-action="menu" data-source="${dev.sourceEntity}" title="Actions">
                       <ha-icon icon="mdi:dots-vertical" style="--mdc-icon-size:16px"></ha-icon>
                     </button>`
                }
              </div>
            </div>`;
          }).join('')}
        `}
      </div>`;
      })()}
    `;

    this._bindEvents();
  }

  _bindEvents() {
    // Refresh button
    this.shadowRoot.getElementById('refreshBtn')?.addEventListener('click', () => this._refresh());

    // Tab bar
    this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.dataset.view;
        if (view === this._activeView) return;
        this._activeView = view;
        if (view === 'shopping' && !this._shoppingData) {
          this._loadShoppingList();
          return;
        }
        this._prevEntityHash = "";
        this._render();
      });
    });

    // Shopping list expand/collapse
    this.shadowRoot.querySelectorAll('.shopping-group-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const type = hdr.dataset.type;
        const group = hdr.parentElement;
        const devices = group.querySelector('.shopping-devices');
        if (devices) {
          const expanded = devices.style.display !== 'none';
          devices.style.display = expanded ? 'none' : 'block';
          group.classList.toggle('expanded', !expanded);
          // Persist state so re-renders preserve it
          if (expanded) {
            this._expandedGroups.delete(type);
          } else {
            this._expandedGroups.add(type);
          }
        }
      });
    });

    // Summary card category filters
    this.shadowRoot.querySelectorAll('.summary-card.clickable').forEach(card => {
      card.addEventListener('click', () => {
        const cat = card.dataset.filter || null;
        this._filterCategory = (this._filterCategory === cat) ? null : cat;
        this._activeView = "devices"; // switch to devices view when filtering
        this._prevEntityHash = "";
        this._render();
        // Re-focus search if it had text
        if (this._filterText) {
          const input = this.shadowRoot.getElementById('searchInput');
          if (input) { input.focus(); input.selectionStart = input.value.length; }
        }
      });
    });

    // Search input
    const searchInput = this.shadowRoot.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this._filterText = searchInput.value;
        this._prevEntityHash = "";
        this._render();
        // Re-focus and restore cursor
        const el = this.shadowRoot.getElementById('searchInput');
        if (el) { el.focus(); el.selectionStart = el.value.length; }
      });
    }
    this.shadowRoot.getElementById('clearSearch')?.addEventListener('click', () => {
      this._filterText = "";
      this._prevEntityHash = "";
      this._render();
    });
    this.shadowRoot.getElementById('clearFilter')?.addEventListener('click', () => {
      this._filterCategory = null;
      this._prevEntityHash = "";
      this._render();
    });

    this.shadowRoot.getElementById('toggleSettings')?.addEventListener('click', () => {
      this._settingsOpen = !this._settingsOpen;
      if (this._settingsOpen) {
        this._settingsDirty = false;
        this._loadConfig();
      } else {
        this._render();
      }
    });

    this.shadowRoot.querySelectorAll('.setting-input input').forEach(input => {
      input.addEventListener('input', () => {
        this._settingsValues[input.dataset.key] = input.value;
        this._settingsDirty = true;
        const saveBtn = this.shadowRoot.getElementById('saveSettings');
        if (saveBtn) saveBtn.disabled = false;
      });
    });

    this.shadowRoot.getElementById('saveSettings')?.addEventListener('click', () => this._saveSettings());
    this.shadowRoot.getElementById('cancelSettings')?.addEventListener('click', () => {
      this._settingsOpen = false;
      this._settingsDirty = false;
      this._render();
    });

    // Sort headers
    this.shadowRoot.querySelectorAll('.sort-header').forEach(hdr => {
      hdr.addEventListener('click', (e) => {
        e.stopPropagation();
        const col = hdr.dataset.sort;
        if (this._sortCol === col) {
          this._sortAsc = !this._sortAsc;
        } else {
          this._sortCol = col;
          this._sortAsc = true;
        }
        this._userSorted = true;
        this._entities = this._sortEntities(this._entities);
        this._prevEntityHash = ""; // Force re-render
        this._render();
      });
    });

    // Action buttons
    this.shadowRoot.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const source = btn.dataset.source;
        if (action === "confirm") {
          this._confirmReplacement(source);
        } else if (action === "menu") {
          this._showActionMenu(btn, source);
        }
      });
    });

    // Row click
    this.shadowRoot.querySelectorAll('.device-row').forEach(row => {
      row.addEventListener('click', () => {
        const entityId = row.dataset.entity;
        if (entityId) {
          this.dispatchEvent(new CustomEvent('hass-more-info', {
            bubbles: true, composed: true, detail: { entityId },
          }));
        }
      });
    });
  }

  _showActionMenu(anchor, sourceEntity) {
    this._closeOverlays();
    const dev = this._entities.find(d => d.sourceEntity === sourceEntity);
    const rect = anchor.getBoundingClientRect();
    const hostRect = this.shadowRoot.host.getBoundingClientRect();

    const menu = document.createElement("div");
    menu.className = "jp-menu-overlay";
    menu.innerHTML = `
      <div class="jp-menu" style="top:${rect.bottom + 4}px; right:${window.innerWidth - rect.right}px;">
        <button class="jp-menu-item" data-action="replace">
          <ha-icon icon="mdi:battery-sync" style="--mdc-icon-size:18px"></ha-icon>
          Mark as replaced
        </button>
        <button class="jp-menu-item" data-action="type">
          <ha-icon icon="mdi:battery-heart-variant" style="--mdc-icon-size:18px"></ha-icon>
          Set battery type${dev?.batteryType ? ` (${this._esc(dev.batteryType)})` : ''}
        </button>
      </div>
    `;
    this.shadowRoot.appendChild(menu);

    // Close on outside click
    menu.addEventListener("click", (e) => {
      if (e.target === menu) menu.remove();
    });

    menu.querySelectorAll(".jp-menu-item").forEach(item => {
      item.addEventListener("click", async () => {
        menu.remove();
        const action = item.dataset.action;
        if (action === "replace") {
          this._markReplaced(sourceEntity);
        } else if (action === "type") {
          this._setBatteryType(sourceEntity, dev?.batteryType);
        }
      });
    });
  }

  _closeOverlays() {
    this.shadowRoot.querySelectorAll(".jp-menu-overlay, .jp-dialog-overlay").forEach(el => el.remove());
  }
}

customElements.define("juice-patrol-panel", JuicePatrolPanel);
