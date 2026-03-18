import { html, nothing } from "lit";
import { STYLE_SECONDARY, STYLE_SUB_TEXT, STYLE_BADGE_ROW } from "./constants.js";
import {
  getBatteryIcon, getLevelColor, formatLevel, formatRate,
  formatTimeRemaining, formatDate, isFastDischarge, isActivelyCharging,
  predictionReason, predictionReasonDetail, erraticTooltip, displayLevel,
  renderBadgeLabel, renderReliabilityBadge, getDeviceSubText,
} from "./helpers.js";

/**
 * Build ha-data-table column definitions.
 *
 * @param {Object} panel - The panel instance (for settings, menu handler)
 * @returns {Object} Column definitions keyed by column name
 */
export function buildColumns(panel) {
  const threshold = panel._settingsValues?.low_threshold ?? 20;

  return {
    icon: {
      title: "",
      type: "icon",
      moveable: false,
      showNarrow: true,
      template: (dev) => html`
        <ha-icon
          icon=${getBatteryIcon(dev)}
          style="color:${getLevelColor(dev.level, dev.threshold, threshold)}"
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
        const labels = getBadgeLabels(dev, panel);
        const subText = getDeviceSubText(dev);
        return html`
          <div style="overflow:hidden">
            <span>${dev.name || dev.sourceEntity}</span>
            ${subText
              ? html`<div style=${STYLE_SUB_TEXT}>${subText}</div>`
              : nothing}
            ${labels.length
              ? html`<div style=${STYLE_BADGE_ROW}>${labels.map(
                  (l) => renderBadgeLabel(l)
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
        const color = getLevelColor(dev.level, dev.threshold, threshold);
        return html`<span style="color:${color};font-weight:500">${formatLevel(dev.level)}</span>`;
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
      template: (dev) => html`<span style=${STYLE_SECONDARY}>${formatRate(dev)}</span>`,
    },
    daysRemaining: {
      title: "Left",
      sortable: true,
      type: "numeric",
      minWidth: "55px",
      maxWidth: "80px",
      template: (dev) => html`<span style=${STYLE_SECONDARY}>${formatTimeRemaining(dev)}</span>`,
    },
    reliability: {
      title: "Rel",
      sortable: true,
      type: "numeric",
      minWidth: "45px",
      maxWidth: "60px",
      template: (dev) => renderReliabilityBadge(dev),
    },
    predictedEmpty: {
      title: "Empty by",
      sortable: true,
      minWidth: "80px",
      maxWidth: "110px",
      template: (dev) => html`<span style=${STYLE_SECONDARY}>${dev.predictedEmpty
        ? formatDate(dev.predictedEmpty, isFastDischarge(dev))
        : "\u2014"}</span>`,
    },
    actions: {
      title: "",
      type: "overflow-menu",
      showNarrow: true,
      template: (dev) => html`
        <ha-dropdown
          @wa-select=${(e) => panel._handleMenuSelect(e, dev.sourceEntity)}
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
          ${renderDropdownItems(dev)}
        </ha-dropdown>
      `,
    },
  };
}

/**
 * Build label entries for badge chips in the device table rows.
 */
export function getBadgeLabels(dev, panel) {
  const labels = [];
  const threshold = panel._settingsValues?.low_threshold ?? 20;

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
    const t = dev.threshold ?? threshold;
    labels.push({
      label_id: "low",
      name: "LOW",
      color: "#F44336",
      description: `Battery is at ${displayLevel(dev.level)}%, below the ${t}% threshold`,
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
      description: erraticTooltip(dev),
    });
  }
  const skipReasons = dev.isRechargeable ? new Set(["flat", "charging"]) : new Set();
  if (!dev.predictedEmpty && predictionReason(dev) && !skipReasons.has(dev.predictionStatus)) {
    labels.push({
      label_id: "no-pred",
      name: `No prediction: ${predictionReason(dev)}`,
      color: "#9E9E9E",
      description: predictionReasonDetail(dev.predictionStatus) || "",
    });
  }
  if (dev.isRechargeable) {
    if (isActivelyCharging(dev)) {
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
    const dMean = displayLevel(dev.meanLevel);
    const dLevel = displayLevel(dev.level);
    if (dMean !== null && Math.abs(dMean - (dLevel ?? 0)) > 2) {
      labels.push({
        label_id: "avg",
        name: `avg ${dMean}%`,
        color: "#2196F3",
        description: `7-day average is ${dMean}% while current reading is ${dLevel ?? "?"}%`,
      });
    }
  }
  return labels;
}

/**
 * Render dropdown menu items for a device's action menu.
 */
export function renderDropdownItems(dev) {
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
