import { parseBatteryType, formatBatteryType, wsErrorMessage, showToast } from "./helpers.js";

/**
 * Show the replace-battery dialog (non-rechargeable variant).
 */
export function showReplaceDialog(panel, entityId) {
  showReplaceDialogImpl(panel, entityId, {
    title: "Mark battery as replaced?",
    preamble: `
      <p style="margin-top:0">This tells Juice Patrol that you swapped the batteries.
      A replacement marker will be added to the timeline. All history is preserved
      for life expectancy tracking.</p>
      <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">
      This can be undone later if needed.</p>`,
  });
}

/**
 * Show the replace-battery dialog (rechargeable variant).
 */
export function showReplaceRechargeableDialog(panel, entityId) {
  showReplaceDialogImpl(panel, entityId, {
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

function showReplaceDialogImpl(panel, entityId, { title, preamble }) {
  const dialog = document.createElement("ha-dialog");
  dialog.open = true;
  dialog.headerTitle = title;
  panel.shadowRoot.appendChild(dialog);

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
    panel._doMarkReplaced(entityId, timestamp);
  });
}

/**
 * Show a generic confirmation dialog.
 */
export function showConfirmDialog(panel, { title, bodyHtml, onConfirm, confirmLabel, confirmVariant }) {
  const dialog = document.createElement("ha-dialog");
  dialog.open = true;
  dialog.headerTitle = title;
  panel.shadowRoot.appendChild(dialog);

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

/**
 * Show the battery type dialog (preset selection, custom popover, autodetect, rechargeable toggle).
 */
export function showBatteryTypeDialog(panel, entityId, currentType) {
  // Close any existing dialogs
  panel.shadowRoot
    .querySelectorAll("ha-dialog")
    .forEach((el) => { el.open = false; el.remove(); });

  const dev = panel._getDevice(entityId);
  const current = currentType || dev?.batteryType || "";
  const parsed = parseBatteryType(current);
  const presets = ["CR2032", "CR2450", "CR123A", "AA", "AAA"];
  const customSuggestions = ["18650", "LR44", "CR1632", "CR1616", "CR2025", "9V"];

  let badges = [];
  let lockedType = null;
  const isCustomType = current && !presets.includes(parsed.type) && parsed.type;
  if (current && presets.includes(parsed.type)) {
    for (let i = 0; i < parsed.count; i++) badges.push(parsed.type);
    lockedType = parsed.type;
  } else if (isCustomType) {
    for (let i = 0; i < parsed.count; i++) badges.push(parsed.type);
    lockedType = parsed.type;
  }

  let rechargeable = dev?.isRechargeable || false;
  let rechargeableChanged = false;
  // Stash battery state so toggling rechargeable on/off doesn't lose it
  let stashedBadges = null;
  let stashedLockedType = null;


  let popoverOpen = false;
  let customInputValue = "";
  let detecting = false;

  const dialog = document.createElement("ha-dialog");
  dialog.open = true;
  dialog.headerTitle = "Set battery type";
  panel.shadowRoot.appendChild(dialog);

  // Overflow menu in dialog header — wrapper holds both button and dropdown
  const overflowWrap = document.createElement("div");
  overflowWrap.slot = "headerActionItems";
  overflowWrap.style.position = "relative";
  const overflowBtn = document.createElement("ha-icon-button");
  const overflowIcon = document.createElement("ha-icon");
  overflowIcon.icon = "mdi:dots-vertical";
  overflowBtn.appendChild(overflowIcon);
  overflowWrap.appendChild(overflowBtn);

  let overflowMenuOpen = false;
  const overflowMenu = document.createElement("div");
  overflowMenu.className = "jp-overflow-menu";
  overflowMenu.style.display = "none";
  overflowMenu.innerHTML = `
    <button class="jp-overflow-menu-item">
      <ha-icon icon="mdi:information-outline" style="--mdc-icon-size:18px; color:var(--secondary-text-color)"></ha-icon>
      Information
    </button>
  `;
  overflowWrap.appendChild(overflowMenu);
  dialog.appendChild(overflowWrap);

  overflowBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    overflowMenuOpen = !overflowMenuOpen;
    overflowMenu.style.display = overflowMenuOpen ? "block" : "none";
  });
  overflowMenu.querySelector(".jp-overflow-menu-item").addEventListener("click", () => {
    overflowMenuOpen = false;
    overflowMenu.style.display = "none";
    closeDialog();
    // Fire after dialog cleanup so HA's event listener isn't blocked
    panel.dispatchEvent(new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId },
    }));
  });
  document.addEventListener("mousedown", (e) => {
    // Use composedPath() — e.target is retargeted across shadow DOM boundaries,
    // so .contains(e.target) always fails for elements inside a shadow root.
    const path = e.composedPath();
    if (overflowMenuOpen && !path.includes(overflowMenu) && !path.includes(overflowBtn)) {
      overflowMenuOpen = false;
      overflowMenu.style.display = "none";
    }
  });

  const closeDialog = () => {
    document.removeEventListener("mousedown", outsideClickHandler);
    dialog.open = false;
    dialog.remove();
  };

  const esc = (s) => {
    if (!s) return "";
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  };

  // Track whether badges came from a preset or custom type
  const isPresetLocked = () => lockedType !== null && presets.includes(lockedType);
  const isCustomLocked = () => lockedType !== null && !presets.includes(lockedType);

  const body = document.createElement("div");
  dialog.appendChild(body);

  // Outside-click handler for custom popover
  const outsideClickHandler = (e) => {
    if (!popoverOpen) return;
    const popover = body.querySelector(".jp-custom-popover");
    const trigger = body.querySelector(".jp-custom-trigger");
    const path = e.composedPath();
    if (popover && !path.includes(popover) && trigger && !path.includes(trigger)) {
      popoverOpen = false;
      renderDialog();
    }
  };
  document.addEventListener("mousedown", outsideClickHandler);

  const renderDialog = () => {
    const hasCustomCommitted = badges.length > 0 && !presets.includes(badges[0]);
    const showUnknown = badges.length === 0;

    const badgeHtml = badges.length > 0
      ? badges
          .map((b, i) =>
            `<span class="jp-badge-chip" data-idx="${i}" title="Click to remove">${esc(b)} \u2715</span>`
          )
          .join("")
      : `<span class="jp-unknown-chip">
           <ha-icon icon="mdi:battery" style="--mdc-icon-size:14px"></ha-icon>
           Unknown
         </span>`;

    const countBadgeHtml = badges.length > 0
      ? `<span class="jp-count-badge">${badges.length}</span>`
      : "";

    const popoverHtml = popoverOpen
      ? `<div class="jp-custom-popover">
           <div class="jp-custom-popover-input">
             <div style="color:var(--primary-color); font-size:11px; font-weight:500; margin-bottom:4px">Custom type</div>
             <input type="text" class="jp-custom-input" placeholder="e.g. 18650, LR44\u2026"
                    value="${esc(customInputValue)}">
             <div style="height:2px; background:var(--primary-color); border-radius:1px; margin-top:4px"></div>
           </div>
           ${customSuggestions.map((s) =>
             `<button class="jp-custom-suggestion" data-suggestion="${esc(s)}">
                <ha-icon icon="mdi:battery" style="--mdc-icon-size:16px; color:var(--secondary-text-color)"></ha-icon>
                ${esc(s)}
              </button>`
           ).join("")}
         </div>`
      : "";

    body.innerHTML = `
      <div class="jp-dialog-desc">${esc(dev?.name || entityId)}</div>

      <div class="jp-rechargeable-section">
        <ha-switch class="jp-rechargeable-sw" ${rechargeable ? "checked" : ""}></ha-switch>
        <div class="jp-rechargeable-labels">
          <div style="font-size:14px; font-weight:500">Rechargeable device</div>
          <div style="font-size:12px; color:var(--secondary-text-color); margin-top:2px">
            Device with an internal, non-removable rechargeable battery</div>
        </div>
      </div>

      <hr style="border:none; border-top:1px solid var(--divider-color); margin:12px 0">

      <div class="jp-batteries-section${rechargeable ? " jp-disabled-overlay" : ""}">
        <div class="jp-batteries-heading">
          <span style="font-size:14px; font-weight:500">Batteries</span>
          ${countBadgeHtml}
        </div>
        <div style="font-size:12px; color:var(--secondary-text-color); margin-bottom:10px; line-height:16px">
          Select the type of battery used by this device. Click the type again to add more &mdash; one click per battery in the device.
        </div>

        <div class="jp-badge-field">
          <div class="jp-badge-field-chips">${badgeHtml}</div>
          <ha-icon-button class="jp-autodetect-btn${detecting ? " spinning" : ""}"
            title="Autodetect battery type" ${detecting ? "disabled" : ""}>
            <ha-icon icon="mdi:auto-fix"></ha-icon>
          </ha-icon-button>
        </div>

        <div class="jp-dialog-presets" style="position:relative">
          ${presets.map((t) => {
            const disabled = (lockedType !== null && t !== lockedType) || hasCustomCommitted;
            const active = t === lockedType;
            return `<button class="jp-preset${disabled ? " disabled" : ""}${active ? " active" : ""}"
              data-type="${t}" ${disabled ? "disabled" : ""}>${t}</button>`;
          }).join("")}
          <button class="jp-custom-trigger${isPresetLocked() ? " disabled" : ""}${popoverOpen ? " active" : ""}"
            ${isPresetLocked() ? "disabled" : ""}>
            <span style="font-size:15px; line-height:1">+</span> Custom type\u2026
          </button>
          ${popoverHtml}
        </div>
      </div>

      <div class="jp-dialog-actions">
        <ha-button variant="neutral" class="jp-dialog-clear">Clear</ha-button>
        <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>
        <ha-button class="jp-dialog-save">Save</ha-button>
      </div>
    `;
    bindDialogEvents();
  };

  const bindDialogEvents = () => {
    // Badge removal
    body.querySelectorAll(".jp-badge-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        if (rechargeable) return;
        badges.splice(parseInt(chip.dataset.idx), 1);
        if (badges.length === 0) lockedType = null;
        renderDialog();
      });
    });

    // Preset buttons
    body.querySelectorAll(".jp-preset[data-type]:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (rechargeable) return;
        const t = btn.dataset.type;
        lockedType = t;
        badges.push(t);
        renderDialog();
      });
    });

    // Rechargeable toggle
    const sw = body.querySelector(".jp-rechargeable-sw");
    if (sw) {
      sw.addEventListener("change", () => {
        rechargeable = sw.checked;
        rechargeableChanged = true;
        if (rechargeable) {
          // Stash current battery state before disabling
          stashedBadges = [...badges];
          stashedLockedType = lockedType;
          popoverOpen = false;
          customInputValue = "";
        } else if (stashedBadges) {
          // Restore stashed battery state
          badges = stashedBadges;
          lockedType = stashedLockedType;
          stashedBadges = null;
          stashedLockedType = null;
        }
        renderDialog();
      });
    }

    // Autodetect button
    body.querySelector(".jp-autodetect-btn")?.addEventListener("click", async () => {
      if (detecting || rechargeable) return;
      detecting = true;
      renderDialog();
      try {
        const result = await panel._hass.callWS({
          type: "juice_patrol/detect_battery_type",
          entity_id: entityId,
        });
        if (result.battery_type) {
          const p = parseBatteryType(result.battery_type);
          badges = [];
          lockedType = null;
          if (presets.includes(p.type)) {
            for (let i = 0; i < p.count; i++) badges.push(p.type);
            lockedType = p.type;
          } else {
            for (let i = 0; i < p.count; i++) badges.push(p.type);
            lockedType = p.type;
          }
          showToast(panel, `Detected: ${result.battery_type} (${result.source})`);
        } else {
          showToast(panel, "Could not auto-detect battery type");
        }
      } catch (e) {
        console.warn("Juice Patrol: auto-detect failed", e);
        showToast(panel, wsErrorMessage(e, "auto-detection"));
      }
      detecting = false;
      renderDialog();
    });

    // Custom type trigger
    body.querySelector(".jp-custom-trigger:not([disabled])")?.addEventListener("click", () => {
      if (rechargeable) return;
      popoverOpen = !popoverOpen;
      renderDialog();
      if (popoverOpen) {
        requestAnimationFrame(() => {
          body.querySelector(".jp-custom-input")?.focus();
        });
      }
    });

    // Custom popover input
    const customInput = body.querySelector(".jp-custom-input");
    if (customInput) {
      customInput.addEventListener("input", (e) => {
        customInputValue = e.target.value;
      });
      customInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && customInputValue.trim()) {
          badges = [customInputValue.trim()];
          lockedType = customInputValue.trim();
          popoverOpen = false;
          customInputValue = "";
          renderDialog();
        }
        if (e.key === "Escape") {
          popoverOpen = false;
          renderDialog();
        }
      });
    }

    // Custom suggestion buttons
    body.querySelectorAll(".jp-custom-suggestion").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.dataset.suggestion;
        badges = [val];
        lockedType = val;
        popoverOpen = false;
        customInputValue = "";
        renderDialog();
      });
    });

    // Dialog events
    dialog.addEventListener("closed", closeDialog);
    body.querySelector(".jp-dialog-cancel")?.addEventListener("click", closeDialog);

    body.querySelector(".jp-dialog-clear")?.addEventListener("click", () => {
      badges = [];
      lockedType = null;
      popoverOpen = false;
      customInputValue = "";
      renderDialog();
    });

    body.querySelector(".jp-dialog-save")?.addEventListener("click", async () => {
      let val;
      if (badges.length > 0) {
        val = formatBatteryType(lockedType, badges.length);
      } else {
        val = null;
      }
      closeDialog();
      const typeChanged = val !== (current || null);
      if (rechargeableChanged) {
        try {
          await panel._hass.callWS({
            type: "juice_patrol/set_rechargeable",
            entity_id: entityId,
            is_rechargeable: rechargeable,
          });
        } catch (e) {
          showToast(panel, "Failed to update rechargeable state");
        }
      }
      if (typeChanged) {
        await panel._saveBatteryType(entityId, val);
      }
    });
  };

  renderDialog();
}
