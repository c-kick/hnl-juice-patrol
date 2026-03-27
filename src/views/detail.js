import { html, nothing } from "lit";
import { ICON_CHECK, ICON_CLOSE, ICON_MAGNIFY, ICON_RESTORE } from "../constants.js";
import {
  getLevelColor, formatLevel, formatDate, getDeviceSubText,
} from "../helpers.js";
import { CSS_SUCCESS, CSS_WARNING, CSS_ERROR, CSS_SECONDARY_TEXT } from "../colors.js";

const CHART_CANVAS_ID = "jp-detail-chart-canvas";

/**
 * Render the full detail view for a single device.
 */
export function renderDetailView(panel) {
  const entityId = panel._detailEntity;
  const dev = panel._getDevice(entityId);
  if (!dev) {
    return html`<div class="empty-state">Device not found</div>`;
  }

  return html`
    ${renderHeroCard(panel, dev)}
    ${renderHistoryChart(panel)}
    ${renderReplacementHistory(panel, dev)}
  `;
}

// ── History Chart ──────────────────────────────────────────────────────────

function renderHistoryChart(panel) {
  return html`
    <ha-card style="margin-bottom:16px">
      ${panel._chartLoading ? html`
        <div class="loading-state">
          <ha-spinner></ha-spinner>
        </div>
      ` : panel._chartData && panel._chartData.length > 0 ? html`
        <div style="padding:16px 16px 8px">
          <div style="height:200px;position:relative">
            <canvas id="${CHART_CANVAS_ID}"></canvas>
          </div>
        </div>
      ` : html`
        <div class="empty-state">No history available</div>
      `}
    </ha-card>
  `;
}

// ── Hero Card ──────────────────────────────────────────────────────────────

function renderHeroCard(panel, dev) {
  const entityId = panel._detailEntity;
  const levelColor = getLevelColor(dev.level, dev.threshold);
  const subText = getDeviceSubText(dev);

  const bigNumber = formatLevel(dev.level);
  const unitLabel = "battery level";
  const barPct = dev.level != null ? Math.max(0, Math.min(100, Math.ceil(dev.level))) : 0;
  const barRightText = formatLevel(dev.level);
  const barRightColor = levelColor;

  return html`
    <ha-card style="container-type:inline-size;container-name:hero;margin-bottom:16px">
      <div class="hero-row">
        <div class="hero-left">
          <div class="hero-big" style="color:${levelColor}">${bigNumber}</div>
          <div class="hero-unit">${unitLabel}</div>
        </div>
        <div class="hero-right">
          <div class="hero-name-row">
            <div class="hero-name">${dev.name || dev.sourceEntity}</div>
            <ha-icon-button
              .path=${"M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"}
              style="--mdc-icon-button-size:32px;--mdc-icon-size:20px;color:${CSS_SECONDARY_TEXT}"
              title="More info"
              @click=${() => {
                panel.dispatchEvent(
                  new CustomEvent("hass-more-info", {
                    bubbles: true,
                    composed: true,
                    detail: { entityId },
                  })
                );
              }}
            ></ha-icon-button>
          </div>
          ${subText ? html`<div class="hero-sub">${subText}</div>` : nothing}
          <div class="hero-bar-row">
            <div class="hero-bar">
              <div class="hero-bar-fill" style="width:${barPct}%;background:${levelColor}"></div>
            </div>
            <div class="hero-bar-pct" style="color:${barRightColor}">${barRightText}</div>
          </div>
        </div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-label">Battery Type</div>
          <div class="hero-stat-val">${dev.batteryType || "\u2014"}</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">Status</div>
          <div class="hero-stat-val">${dev.isStale ? "Stale" : dev.isLow ? "Low" : dev.isRechargeable && dev.chargingState ? dev.chargingState === "charging" ? "Charging" : dev.chargingState === "discharging" || dev.chargingState === "not_charging" ? "Discharging" : dev.chargingState === "full" ? "Full" : "OK" : "OK"}</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">Rechargeable</div>
          <div class="hero-stat-val">${dev.isRechargeable ? "Yes" : "No"}</div>
        </div>
        ${dev.lastReplaced ? html`
        <div class="hero-stat">
          <div class="hero-stat-label">Last Replaced</div>
          <div class="hero-stat-val">${formatDate(dev.lastReplaced * 1000, true)}</div>
        </div>
        ` : nothing}
      </div>
    </ha-card>
  `;
}

// ── Replacement History ──────────────────────────────────────────────────

function renderReplacementHistory(panel, dev) {
  const entityId = panel._detailEntity;
  if (!entityId) return nothing;

  // Build replacement entries from the device's replacement history stored in coordinator data
  // We only have confirmed replacements here (no chart data, no suspected ones)
  const devData = panel._getDevice(entityId);
  if (!devData || !devData.lastReplaced) return nothing;

  // We don't have replacement_history directly on the frontend dev object,
  // so just show the last replaced date as a simple card
  return html`
    <ha-card style="margin-bottom:16px">
      <ha-expansion-panel>
        <div slot="header" style="display:flex;align-items:center;gap:8px;width:100%">
          <ha-icon icon="mdi:history" style="--mdc-icon-size:20px;color:${CSS_SECONDARY_TEXT}"></ha-icon>
          <span style="flex:1;font-weight:500">Battery Replacement</span>
        </div>
        <div class="expansion-content" style="padding:16px">
          <p style="margin:0;color:var(--secondary-text-color)">
            Last replaced: ${formatDate(dev.lastReplaced * 1000, true)}
          </p>
        </div>
      </ha-expansion-panel>
    </ha-card>
  `;
}
