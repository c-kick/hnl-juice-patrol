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
 * Show the battery type dialog (preset selection, custom input, autodetect, rechargeable toggle).
 */
export function showBatteryTypeDialog(panel, entityId, currentType) {
  // Close any existing dialogs
  panel.shadowRoot
    .querySelectorAll("ha-dialog")
    .forEach((el) => { el.open = false; el.remove(); });

  const dev = panel._getDevice(entityId);
  const current = currentType || dev?.batteryType || "";
  const parsed = parseBatteryType(current);
  const presets = ["CR2032", "CR2450", "CR123A", "AA", "AAA", "Li-ion", "Built-in"];

  let badges = [];
  let lockedType = null;
  if (current && presets.includes(parsed.type)) {
    for (let i = 0; i < parsed.count; i++) badges.push(parsed.type);
    lockedType = parsed.type;
  }

  let rechargeable = dev?.isRechargeable || false;
  let rechargeableChanged = false;

  // TODO(chemistry-override): rebuild frontend bundle with `npm run build`
  // after merging this branch — the bundled juice_patrol_panel.js does not
  // include these changes yet.
  const chemistryPresets = ["alkaline", "lithium_primary", "NMC", "NiMH"];
  const chemistryLabels = { alkaline: "Alkaline", lithium_primary: "Lithium", NMC: "Li-ion", NiMH: "NiMH" };
  let chemistryOverride = dev?.chemistryOverride || null;
  let chemistryChanged = false;

  const dialog = document.createElement("ha-dialog");
  dialog.open = true;
  dialog.headerTitle = "Set battery type";
  panel.shadowRoot.appendChild(dialog);

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
      <ha-expansion-panel outlined style="margin: 8px 0">
        <span slot="header">Advanced</span>
        <div style="padding: 8px 0">
          <div style="font-size:0.9em; font-weight:500; margin-bottom:6px">Chemistry override</div>
          <div class="jp-dialog-presets jp-chem-presets">
            ${chemistryPresets.map((c) => {
              const active = chemistryOverride === c;
              return `<button class="jp-preset jp-chem-chip${active ? " active" : ""}"
                data-chem="${c}">${chemistryLabels[c]}</button>`;
            }).join("")}
          </div>
          <div style="font-size:0.8em; color:var(--secondary-text-color); margin-top:6px">
            Changes the prediction model used for this device. Leave unset to use
            the default for this battery type.
          </div>
          <div class="jp-chem-warning" style="display:${chemistryOverride ? "block" : "none"};
            font-size:0.8em; color:var(--warning-color, #ff9800); margin-top:4px">
            Overriding chemistry will affect prediction accuracy if incorrect.
          </div>
        </div>
      </ha-expansion-panel>
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

    body.querySelectorAll(".jp-preset[data-type]:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () => {
        const t = btn.dataset.type;
        lockedType = t;
        badges.push(t);
        const input = body.querySelector(".jp-dialog-input");
        if (input) input.value = "";
        renderDialog();
      });
    });

    // Chemistry override chips — toggle on/off
    body.querySelectorAll(".jp-chem-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const c = btn.dataset.chem;
        chemistryOverride = chemistryOverride === c ? null : c;
        chemistryChanged = true;
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
          }
          renderDialog();
          if (!presets.includes(p.type)) {
            const input = body.querySelector(".jp-dialog-input");
            if (input) input.value = result.battery_type;
          }
          showToast(panel, `Detected: ${result.battery_type} (${result.source})`);
        } else {
          showToast(panel, "Could not auto-detect battery type");
          if (btn) {
            btn.disabled = false;
            btn.textContent = "Autodetect";
          }
        }
      } catch (e) {
        console.warn("Juice Patrol: auto-detect failed", e);
        showToast(panel, wsErrorMessage(e, "auto-detection"));
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
          val = formatBatteryType(lockedType, badges.length);
        } else if (customVal) {
          val = customVal;
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
        if (chemistryChanged) {
          try {
            await panel._hass.callWS({
              type: "juice_patrol/set_chemistry_override",
              entity_id: entityId,
              chemistry: chemistryOverride,
            });
          } catch (e) {
            showToast(panel, "Failed to update chemistry override");
          }
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
