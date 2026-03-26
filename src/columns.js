import { html } from "lit";
import { STYLE_SECONDARY, STYLE_SUB_TEXT, STYLE_BADGE_ROW } from "./constants.js";
import {
  getBatteryIcon, getLevelColor, formatLevel, isActivelyCharging,
  displayLevel, renderBadgeLabel, getDeviceSubText,
} from "./helpers.js";
import {
  BADGE_LOW, BADGE_STALE, BADGE_CHARGING, BADGE_AVG_LEVEL,
} from "./colors.js";

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
      valueColumn: "_levelSort",
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
    actions: {
      title: "",
      type: "overflow-menu",
      showNarrow: true,
      template: (dev) => html`
        <ha-dropdown
          @wa-select=${(e) => {
            e.stopPropagation();
            panel._handleMenuSelect(e, dev.sourceEntity);
          }}
          @click=${(e) => e.stopPropagation()}
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

  if (dev.isLow) {
    const t = dev.threshold ?? threshold;
    labels.push({
      label_id: "low",
      name: "LOW",
      color: BADGE_LOW,
      description: `Battery is at ${displayLevel(dev.level)}%, below the ${t}% threshold`,
    });
  }
  if (dev.isStale) {
    labels.push({
      label_id: "stale",
      name: "STALE",
      color: BADGE_STALE,
      description: "No battery reading received within the stale timeout period",
    });
  }
  if (dev.isRechargeable && isActivelyCharging(dev)) {
    labels.push({
      label_id: "charging",
      name: "Charging",
      icon: "mdi:battery-charging",
      color: BADGE_CHARGING,
      description: "Currently charging",
    });
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
    <ha-dropdown-item value="replace">
      <ha-icon slot="icon" icon="mdi:battery-sync"></ha-icon>
      Mark as replaced
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
