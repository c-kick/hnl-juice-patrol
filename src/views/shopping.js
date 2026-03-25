import { html, nothing } from "lit";
import { formatLevel, getLevelColor } from "../helpers.js";

/**
 * Render the shopping list view.
 */
export function renderShoppingList(panel) {
  if (panel._shoppingLoading) {
    return html`<div class="devices">
      <div class="empty-state">Loading shopping list...</div>
    </div>`;
  }
  if (!panel._shoppingData || !panel._shoppingData.groups) {
    return html`<div class="devices">
      <div class="empty-state">
        No shopping data available. Click refresh to load.
      </div>
    </div>`;
  }

  const { groups, total_needed } = panel._shoppingData;
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
      ${groups.map((group) => renderShoppingGroup(panel, group))}
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

/**
 * Render a single shopping group (expansion panel with device list).
 */
function renderShoppingGroup(panel, group) {
  const isUnknown = group.battery_type === "Unknown";
  const icon = isUnknown ? "mdi:help-circle-outline" : "mdi:battery";
  const isExpanded = !!panel._expandedGroups[group.battery_type];
  const countText = `${group.battery_count} batter${group.battery_count !== 1 ? "ies" : "y"} in ${group.device_count} device${group.device_count !== 1 ? "s" : ""}${group.needs_replacement > 0 ? ` \u2014 ${group.needs_replacement} need${group.needs_replacement !== 1 ? "" : "s"} replacement` : ""}`;

  return html`
    <ha-expansion-panel
      outlined
      .expanded=${isExpanded}
      @expanded-changed=${(e) => {
        const next = { ...panel._expandedGroups };
        if (e.detail.expanded) { next[group.battery_type] = true; }
        else { delete next[group.battery_type]; }
        panel._expandedGroups = next;
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
          const levelColor = getLevelColor(d.level, null);
          const needsIt = d.is_low;
          const countLabel = d.battery_count > 1 ? ` (${d.battery_count}\u00d7)` : "";
          return html`
            <div class="shopping-device ${needsIt ? "needs-replacement" : ""}">
              <span class="shopping-device-name"
                >${d.device_name}${countLabel}</span
              >
              <span class="shopping-device-level" style="color:${levelColor}">
                ${formatLevel(d.level)}
              </span>
            </div>
          `;
        })}
      </div>
    </ha-expansion-panel>
  `;
}
