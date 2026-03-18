import { html, nothing } from "lit";
import { ICON_CHECK, ICON_CLOSE, CHART_RANGES } from "../constants.js";
import {
  getBatteryIcon, getLevelColor, formatLevel, formatRate,
  formatTimeRemaining, formatDate, isFastDischarge,
  predictionReasonDetail, renderReliabilityBadge, getDeviceSubText,
} from "../helpers.js";

/**
 * Render the full detail view for a single device.
 */
export function renderDetailView(panel) {
  const entityId = panel._detailEntity;
  const dev = panel._getDevice(entityId);
  if (!dev) {
    // Device disappeared — updated() will close the detail view
    return html`<div class="empty-state">Device not found</div>`;
  }

  const subText = getDeviceSubText(dev);
  return html`
    <div class="detail-header">
      <ha-icon
        icon=${getBatteryIcon(dev)}
        style="color:${getLevelColor(dev.level, dev.threshold)};--mdc-icon-size:40px"
      ></ha-icon>
      <div>
        <h1>${dev.name || dev.sourceEntity}</h1>
        ${subText ? html`<div class="detail-header-sub">${subText}</div>` : nothing}
      </div>
    </div>
    ${renderDetailMeta(panel, dev)}
    ${renderDetailChart(panel)}
    ${renderDetailActions(panel)}
  `;
}

/**
 * Render the metadata grid for a device.
 */
function renderDetailMeta(panel, dev) {
  const cd = panel._chartData;
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

  const levelColor = getLevelColor(dev.level, dev.threshold);

  return html`
    <div class="detail-meta">
      <div class="detail-meta-grid">
        <div class="detail-meta-item">
          <div class="detail-meta-label">Current Level</div>
          <div class="detail-meta-value" style="color:${levelColor}">
            ${formatLevel(dev.level)}
          </div>
        </div>
        <div class="detail-meta-item">
          <div class="detail-meta-label">Battery Type</div>
          <div class="detail-meta-value">${dev.batteryType || "\u2014"}</div>
        </div>
        <div class="detail-meta-item">
          <div class="detail-meta-label">Discharge Rate</div>
          <div class="detail-meta-value">${formatRate(dev)}</div>
        </div>
        <div class="detail-meta-item">
          <div class="detail-meta-label">Time Remaining</div>
          <div class="detail-meta-value">${formatTimeRemaining(dev)}</div>
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
              <div class="detail-meta-value">${renderReliabilityBadge(dev)}</div>
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
                ${formatDate(cd.charge_prediction.estimated_full_timestamp * 1000, true)}
              </div>
            </div>`
          : dev.predictedEmpty
          ? html`<div class="detail-meta-item">
              <div class="detail-meta-label">Predicted Empty</div>
              <div class="detail-meta-value">
                ${formatDate(dev.predictedEmpty, isFastDischarge(dev))}
              </div>
            </div>`
          : nothing}
        ${dev.lastCalculated
          ? html`<div class="detail-meta-item">
              <div class="detail-meta-label">Last Calculated</div>
              <div class="detail-meta-value">
                ${formatDate(dev.lastCalculated * 1000, true)}
              </div>
            </div>`
          : nothing}
      </div>
      ${!dev.predictedEmpty && pred.status && pred.status !== "normal"
        && !(pred.status === "charging" && cd?.charge_prediction?.segment_start_timestamp != null)
        ? html`<div class="detail-reason">
            <ha-icon icon="mdi:information-outline" style="--mdc-icon-size:18px; color:var(--secondary-text-color); flex-shrink:0"></ha-icon>
            <div>
              <strong>Why is there no prediction?</strong>
              <div class="detail-reason-text">${predictionReasonDetail(pred.status) || "Unknown reason."}</div>
            </div>
          </div>`
        : nothing}
    </div>
  `;
}

/**
 * Render the chart container with range pills and stale notice.
 */
function renderDetailChart(panel) {
  if (panel._chartLoading) {
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
    panel._chartData && panel._chartData.readings && panel._chartData.readings.length > 0;
  if (!hasReadings) {
    return html`
      <div class="detail-chart" id="jp-chart">
        <div class="empty-state">Not enough data yet to display a chart.</div>
      </div>
    `;
  }
  return html`
    <div class="chart-range-bar">
      ${CHART_RANGES.map(
        (r) => html`
          <button
            class="range-pill ${panel._chartRange === r.key ? "active" : ""}"
            @click=${() => { panel._chartRange = r.key; }}
          >${r.label}</button>
        `
      )}
    </div>
    ${panel._chartStale
      ? html`<div class="chart-stale-notice" @click=${() => panel._loadChartData(panel._detailEntity)}>
          <ha-icon icon="mdi:refresh" style="--mdc-icon-size:16px"></ha-icon>
          Data updated \u2014 tap to refresh
        </div>`
      : nothing}
    <div class="detail-chart" id="jp-chart"></div>
  `;
}

/**
 * Render the actions section (replacement history, action buttons).
 */
function renderDetailActions(panel) {
  const entityId = panel._detailEntity;
  if (!entityId) return nothing;
  const dev = panel._getDevice(entityId);
  const cd = panel._chartData;
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
              <span>${formatDate(ts * 1000, true)}</span>
            </div>
          `)}
          ${suspectedReplacements.map((s) => html`
            <div class="replacement-history-item suspected">
              <ha-icon icon="mdi:help-circle-outline" style="--mdc-icon-size:16px; color:var(--warning-color, #ff9800)"></ha-icon>
              <span style="flex:1">${formatDate(s.timestamp * 1000, true)}
                <span style="color:var(--secondary-text-color); font-size:0.85em"> — suspected (${Math.round(s.old_level)}% → ${Math.round(s.new_level)}%)</span>
              </span>
              <ha-icon-button
                .path=${ICON_CHECK}
                style="--mdc-icon-button-size:28px; color:var(--success-color, #4caf50)"
                @click=${() => panel._confirmSuspectedReplacement(entityId, s.timestamp)}
              ></ha-icon-button>
              <ha-icon-button
                .path=${ICON_CLOSE}
                style="--mdc-icon-button-size:28px; color:var(--error-color, #f44336)"
                @click=${() => panel._denySuspectedReplacement(entityId, s.timestamp)}
              ></ha-icon-button>
            </div>
          `)}
        </div>
      </div>
    ` : nothing}
    <div class="detail-actions">
      <ha-button
        @click=${() => {
          panel.dispatchEvent(
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
        @click=${() => panel._markReplaced(entityId)}
      >
        <ha-icon slot="start" icon="mdi:battery-sync"></ha-icon>
        Mark as replaced
      </ha-button>
      ${dev?.lastReplaced ? html`
      <ha-button variant="danger"
        @click=${() => panel._undoReplacement(entityId)}
      >
        <ha-icon slot="start" icon="mdi:undo"></ha-icon>
        Undo replacement
      </ha-button>` : nothing}
      <ha-button
        @click=${async () => {
          await panel._recalculate(entityId);
          setTimeout(() => panel._loadChartData(entityId), 500);
        }}
      >
        <ha-icon slot="start" icon="mdi:calculator-variant"></ha-icon>
        Recalculate
      </ha-button>
      <ha-button
        @click=${() => panel._setBatteryType(entityId, dev?.batteryType)}
      >
        <ha-icon slot="start" icon="mdi:battery-heart-variant"></ha-icon>
        Set battery type
      </ha-button>
      <ha-button
        @click=${() => panel._ignoreDevice(entityId)}
      >
        <ha-icon slot="start" icon="mdi:eye-off"></ha-icon>
        Ignore device
      </ha-button>
    </div>
  `;
}
