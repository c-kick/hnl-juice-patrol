import { html, nothing } from "lit";
import { ICON_CHECK, ICON_CLOSE, ICON_MAGNIFY, ICON_RESTORE, CHART_RANGES } from "../constants.js";
import {
  getLevelColor, formatLevel, formatRate, formatDaysRemaining,
  formatTimeRemaining, formatDate, isFastDischarge,
  predictionReasonDetail, getDeviceSubText, confidenceTooltip,
} from "../helpers.js";
import { CSS_SUCCESS, CSS_WARNING, CSS_ERROR, CSS_SECONDARY_TEXT, CSS_DISABLED } from "../colors.js";

const CHEMISTRY_LABELS = {
  alkaline: "Alkaline",
  lithium_primary: "Lithium (primary)",
  coin_cell: "Lithium (coin cell)",
  NMC: "Li-ion (NMC)",
  LFP: "LiFePO4 (LFP)",
  NiMH: "NiMH",
  LCO: "Li-ion (LCO)",
  unknown: "Unknown",
};

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

  return html`
    ${renderHeroCard(panel, dev)}
    ${renderPredictionReason(panel, dev)}
    ${renderChartCard(panel)}
    ${renderPredictionDetails(panel, dev)}
    ${renderReplacementHistory(panel)}
  `;
}

// ── Hero Card ──────────────────────────────────────────────────────────────

function renderHeroCard(panel, dev) {
  const entityId = panel._detailEntity;
  const hasPrediction = dev.predictedEmpty != null;
  const levelColor = getLevelColor(dev.level, dev.threshold);
  const subText = getDeviceSubText(dev);

  const bigNumber = hasPrediction ? formatDaysRemaining(dev) : formatLevel(dev.level);
  const unitLabel = hasPrediction
    ? (dev.daysRemaining != null && dev.daysRemaining <= 1 ? "remaining" : "days remaining")
    : "battery level";
  const barPct = dev.level != null ? Math.max(0, Math.min(100, Math.ceil(dev.level))) : 0;
  const barRightText = formatLevel(dev.level);
  const barRightColor = levelColor;

  // Stats strip
  const cd = panel._chartData;
  const pred = cd?.prediction || {};
  const chargePred = cd?.charge_prediction;

  const statusTexts = {
    normal: "Normal",
    charging: "Charging",
    flat: "Flat",
    idle: "Idle",
    noisy: "Noisy",
    insufficient_data: "Insufficient data",
    single_level: "Single level",
    insufficient_range: "Insufficient range",
  };

  // Detect depleted
  const isDepleted = pred.status === "normal"
    && pred.estimated_days_remaining != null
    && pred.estimated_days_remaining <= 0;

  const statusText = isDepleted ? "Depleted" : (statusTexts[pred.status] || pred.status || "\u2014");

  const emptyByText = chargePred?.estimated_full_timestamp
    ? formatDate(chargePred.estimated_full_timestamp * 1000, true)
    : dev.predictedEmpty
    ? formatDate(dev.predictedEmpty, isFastDischarge(dev))
    : isDepleted && pred.estimated_empty_timestamp
    ? formatDate(pred.estimated_empty_timestamp * 1000, true)
    : "\u2014";

  const emptyByLabel = chargePred?.estimated_full_timestamp ? "Full by" : isDepleted ? "Reached empty" : "Empty by";

  const confRaw = chargePred?.confidence || pred.confidence;
  const CONF_LABELS = { high: "High", medium: "Medium", low: "Low", insufficient_data: "Insufficient", "history-based": "History" };
  const confText = confRaw ? (CONF_LABELS[confRaw] || confRaw) : "\u2014";

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
          <div class="hero-stat-label">Rate</div>
          <div class="hero-stat-val">${formatRate(dev)}</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">${emptyByLabel}</div>
          <div class="hero-stat-val">${emptyByText}</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">Status</div>
          <div class="hero-stat-val">${statusText}</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">Confidence</div>
          <div class="hero-stat-val" title="${confidenceTooltip(chargePred || pred, cd)}">
            <span class="confidence-dot ${chargePred?.confidence || pred.confidence || ""}"></span>${confText}
          </div>
        </div>
      </div>
    </ha-card>
  `;
}

// ── Prediction Reason Box ──────────────────────────────────────────────────

function renderPredictionReason(panel, dev) {
  const cd = panel._chartData;
  const pred = cd?.prediction || {};
  const chargePred = cd?.charge_prediction;
  const isHistoryBased = chargePred?.status === "history-based";

  // Detect depleted
  const isDepleted = pred.status === "normal"
    && pred.estimated_days_remaining != null
    && pred.estimated_days_remaining <= 0;

  if (isDepleted) {
    const entityId = panel._detailEntity;
    return html`<ha-alert alert-type="error" title="Battery depleted" style="display:block;margin-bottom:16px">
      This battery has reached 0% and needs replacement.
      <ha-button variant="danger" appearance="outlined" slot="action" style="white-space:nowrap;min-width:max-content" @click=${() => panel._markReplaced(entityId)}>
        Mark as replaced
      </ha-button>
    </ha-alert>`;
  }

  if (!dev.predictedEmpty && pred.status && pred.status !== "normal"
    && !(pred.status === "charging" && cd?.charge_prediction?.segment_start_timestamp != null && !isHistoryBased)) {
    return html`<ha-alert alert-type="info" title="${isHistoryBased ? "Charge estimate based on history" : "Why is there no prediction?"}" style="display:block;margin-bottom:16px">
      ${isHistoryBased
        ? "Currently charging. The estimated time to full is based on previous charging cycles since no live charging data is available yet. Once the battery starts reporting increased levels, the estimate will be based on actual charging data."
        : (predictionReasonDetail(pred.status) || "Unknown reason.")}
    </ha-alert>`;
  }

  return nothing;
}

// ── Chart Card ─────────────────────────────────────────────────────────────

function renderChartCard(panel) {
  if (panel._chartLoading) {
    return html`
      <ha-card style="margin-bottom:16px">
        <div class="chart-card-header">
          <div class="chart-card-title">Discharge History</div>
        </div>
        <div class="detail-chart" id="jp-chart" style="border:none;border-radius:0;margin:0 16px 16px">
          <div class="loading-state">
            <ha-spinner size="small"></ha-spinner>
            <div>Loading chart data\u2026</div>
          </div>
        </div>
      </ha-card>
    `;
  }

  const hasReadings =
    panel._chartData && panel._chartData.readings && panel._chartData.readings.length > 0;
  if (!hasReadings) {
    return html`
      <ha-card style="margin-bottom:16px">
        <div class="chart-card-header">
          <div class="chart-card-title">Discharge History</div>
        </div>
        <div class="detail-chart" id="jp-chart" style="border:none;border-radius:0;margin:0 16px 16px">
          <div class="empty-state">Not enough data yet to display a chart.</div>
        </div>
      </ha-card>
    `;
  }

  return html`
    <ha-card style="margin-bottom:16px">
      <div class="chart-card-header">
        <div class="chart-card-title">Discharge History</div>
        <div class="chart-range-bar" style="margin-bottom:0">
          ${CHART_RANGES.map(
            (r) => html`
              <button
                class="range-pill ${panel._chartRange === r.key ? "active" : ""}"
                @click=${() => { panel._chartZoomTarget = null; panel._chartRange = r.key; }}
              >${r.label}</button>
            `
          )}
        </div>
      </div>
      ${panel._chartStale
        ? html`<div class="chart-stale-notice" style="margin:0 16px 8px" @click=${() => panel._loadChartData(panel._detailEntity)}>
            <ha-icon icon="mdi:refresh" style="--mdc-icon-size:16px"></ha-icon>
            Data updated \u2014 tap to refresh
          </div>`
        : nothing}
      <div class="detail-chart" id="jp-chart" style="border:none;border-radius:0;margin:0 16px 16px"></div>
    </ha-card>
  `;
}

// ── Prediction Details (expansion panel) ───────────────────────────────────

function renderPredictionDetails(panel, dev) {
  const cd = panel._chartData;
  const pred = cd?.prediction || {};
  const chargePred = cd?.charge_prediction;

  // Badge text for the header
  const confidence = chargePred?.confidence || pred.confidence;
  const CONFIDENCE_LABELS = {
    high: "High confidence",
    medium: "Medium confidence",
    low: "Low confidence",
    insufficient_data: "Insufficient data",
    "history-based": "History-based",
  };
  const badgeText = confidence
    ? (CONFIDENCE_LABELS[confidence] || `${confidence} confidence`)
    : pred.status === "insufficient_data" ? "Insufficient data" : pred.status || "\u2014";

  const badgeClass = confidence === "high" ? "success"
    : confidence === "medium" ? "warning"
    : confidence === "low" ? "error"
    : "neutral";

  return html`
    <ha-card style="margin-bottom:16px">
      <ha-expansion-panel>
        <div slot="header" style="display:flex;align-items:center;gap:8px;width:100%">
          <ha-icon icon="mdi:chart-line" style="--mdc-icon-size:20px;color:${CSS_SECONDARY_TEXT}"></ha-icon>
          <span style="flex:1;font-weight:500">Prediction Details</span>
          <span class="jp-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="hero-stats">
          ${confidence ? html`
            <div class="hero-stat" title="${confidenceTooltip(chargePred || pred, cd)}">
              <div class="hero-stat-label">Confidence</div>
              <div class="hero-stat-val">
                <span class="confidence-dot ${confidence}"></span>${CONFIDENCE_LABELS[confidence]?.replace(" confidence", "") || confidence}
              </div>
            </div>
          ` : nothing}
          ${pred.r_squared != null ? html`
            <div class="hero-stat" title="How well the trend line fits the data. 1.0 = perfect fit, 0.0 = no pattern. Above 0.7 is good, below 0.3 means data is too scattered.">
              <div class="hero-stat-label">R\u00b2</div>
              <div class="hero-stat-val">${pred.r_squared.toFixed(3)}</div>
            </div>
          ` : nothing}
          ${pred.reliability != null ? (() => {
            const r = dev.reliability;
            const hasTime = dev.daysRemaining !== null || dev.hoursRemaining !== null;
            if (r == null || !hasTime) return nothing;
            const rColor = r >= 70 ? "high" : r >= 40 ? "medium" : "low";
            return html`
              <div class="hero-stat" title="Prediction reliability: ${r}%. Based on how consistent the discharge pattern has been across recent observations.">
                <div class="hero-stat-label">Reliability</div>
                <div class="hero-stat-val">
                  <span class="confidence-dot ${rColor}"></span>${r}%
                </div>
              </div>`;
          })() : nothing}
          <div class="hero-stat">
            <div class="hero-stat-label">Data Points</div>
            <div class="hero-stat-val">
              ${pred.data_points_used > 0 ? pred.data_points_used : (cd?.readings?.length ?? "\u2014")}${cd?.session_count ? html` <span style="color:${CSS_SECONDARY_TEXT};font-size:0.85em">(${cd.session_count} session${cd.session_count !== 1 ? "s" : ""})</span>` : nothing}
            </div>
          </div>
          ${dev.lastCalculated ? html`
            <div class="hero-stat">
              <div class="hero-stat-label">Last Calculated</div>
              <div class="hero-stat-val">${formatDate(dev.lastCalculated * 1000, true)}</div>
            </div>
          ` : nothing}
          ${cd?.chemistry ? html`
            <div class="hero-stat">
              <div class="hero-stat-label">Chemistry</div>
              <div class="hero-stat-val">${CHEMISTRY_LABELS[cd.chemistry] || cd.chemistry}</div>
            </div>
          ` : nothing}
          ${chargePred?.estimated_full_timestamp ? html`
            <div class="hero-stat">
              <div class="hero-stat-label">Predicted Full</div>
              <div class="hero-stat-val">${formatDate(chargePred.estimated_full_timestamp * 1000, true)}</div>
            </div>
          ` : dev.predictedEmpty ? html`
            <div class="hero-stat">
              <div class="hero-stat-label">Predicted Empty</div>
              <div class="hero-stat-val">${formatDate(dev.predictedEmpty, isFastDischarge(dev))}</div>
            </div>
          ` : nothing}
        </div>
      </ha-expansion-panel>
    </ha-card>
  `;
}

// ── Replacement History (expansion panel) ──────────────────────────────────

function renderReplacementHistory(panel) {
  const entityId = panel._detailEntity;
  if (!entityId) return nothing;
  const cd = panel._chartData;
  const replacementHistory = cd?.replacement_history || [];
  const suspectedReplacements = cd?.suspected_replacements || [];

  const entries = [
    ...[...replacementHistory].map((ts) => ({ type: "confirmed", timestamp: ts })),
    ...suspectedReplacements.map((s) => ({ type: "suspected", timestamp: s.timestamp, old_level: s.old_level, new_level: s.new_level })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  if (entries.length === 0) return nothing;

  const confirmedCount = entries.filter((e) => e.type === "confirmed").length;
  const suspectedCount = entries.filter((e) => e.type === "suspected").length;

  const tooltipParts = [];
  if (confirmedCount) tooltipParts.push(`${confirmedCount} battery replacement${confirmedCount !== 1 ? "s" : ""}`);
  if (suspectedCount) tooltipParts.push(`${suspectedCount} suspected replacement${suspectedCount !== 1 ? "s" : ""} found in history`);
  const tooltip = tooltipParts.join(", ") + " \u2014 click to expand";

  return html`
    <ha-card style="margin-bottom:16px">
      <ha-expansion-panel>
        <div slot="header" style="display:flex;align-items:center;gap:8px;width:100%" title="${tooltip}">
          <ha-icon icon="mdi:history" style="--mdc-icon-size:20px;color:${CSS_SECONDARY_TEXT}"></ha-icon>
          <span style="flex:1;font-weight:500">Replacement History</span>
          ${confirmedCount ? html`<span class="jp-badge neutral">${confirmedCount}</span>` : nothing}
          ${suspectedCount ? html`
            ${confirmedCount ? html`<span style="color:${CSS_SECONDARY_TEXT};font-size:12px">+</span>` : nothing}
            <span class="jp-badge warning">${suspectedCount}</span>
          ` : nothing}
        </div>
        <div class="expansion-content"><div class="replacement-table">
        <div class="replacement-table-header">
          <span>Date</span>
          <span>Type</span>
          <span></span>
        </div>
        ${entries.map((e) => html`
          <div class="replacement-table-row ${e.type}">
            <span>${formatDate(e.timestamp * 1000, true)}</span>
            <span>
              ${e.type === "confirmed" ? html`
                <ha-icon icon="mdi:battery-sync" style="--mdc-icon-size:16px;color:${CSS_SUCCESS}"></ha-icon>
                Replaced
              ` : html`
                <ha-icon icon="mdi:help-circle-outline" style="--mdc-icon-size:16px;color:${CSS_WARNING}"></ha-icon>
                Suspected (${Math.round(e.old_level)}% \u2192 ${Math.round(e.new_level)}%)
              `}
            </span>
            <span>
              ${e.type === "suspected" ? html`
                <ha-icon-button
                  .path=${ICON_MAGNIFY}
                  style="--mdc-icon-button-size:28px;color:${CSS_SECONDARY_TEXT}"
                  title="Show on chart"
                  @click=${() => panel._zoomToTimestamp(e.timestamp)}
                ></ha-icon-button>
                <ha-icon-button
                  .path=${ICON_CHECK}
                  style="--mdc-icon-button-size:28px;color:${CSS_SUCCESS}"
                  title="Confirm replacement"
                  @click=${() => panel._confirmSuspectedReplacement(entityId, e.timestamp)}
                ></ha-icon-button>
                <ha-icon-button
                  .path=${ICON_CLOSE}
                  style="--mdc-icon-button-size:28px;color:${CSS_ERROR}"
                  title="Not a replacement"
                  @click=${() => panel._denySuspectedReplacement(entityId, e.timestamp)}
                ></ha-icon-button>
              ` : html`
                <ha-icon-button
                  .path=${ICON_CLOSE}
                  style="--mdc-icon-button-size:28px;color:${CSS_SECONDARY_TEXT}"
                  title="Remove this replacement"
                  @click=${() => panel._undoReplacementAt(entityId, e.timestamp)}
                ></ha-icon-button>
              `}
            </span>
          </div>
        `)}
      </div></div>
      ${renderDismissedSuggestions(panel, entityId, cd)}
      </ha-expansion-panel>
    </ha-card>
  `;
}

function renderDismissedSuggestions(panel, entityId, cd) {
  const denied = cd?.denied_replacements || [];
  if (denied.length === 0) return nothing;

  return html`
    <ha-expansion-panel style="margin:0 8px 8px">
      <div slot="header" style="display:flex;align-items:center;gap:8px;width:100%">
        <ha-icon icon="mdi:eye-off-outline" style="--mdc-icon-size:18px;color:${CSS_SECONDARY_TEXT}"></ha-icon>
        <span style="flex:1;font-weight:400;font-size:13px">Dismissed suggestions</span>
        <span class="jp-badge neutral" style="font-size:11px">${denied.length}</span>
      </div>
      <div class="expansion-content"><div class="replacement-table">
        ${denied
          .slice()
          .sort((a, b) => b - a)
          .map((ts) => html`
            <div class="replacement-table-row denied">
              <span>${formatDate(ts * 1000, true)}</span>
              <span style="color:${CSS_SECONDARY_TEXT};font-size:13px">
                <ha-icon icon="mdi:eye-off-outline" style="--mdc-icon-size:16px;color:${CSS_SECONDARY_TEXT}"></ha-icon>
                Dismissed
              </span>
              <span>
                <ha-icon-button
                  .path=${ICON_MAGNIFY}
                  style="--mdc-icon-button-size:28px;color:${CSS_SECONDARY_TEXT}"
                  title="Show on chart"
                  @click=${() => panel._zoomToTimestamp(ts)}
                ></ha-icon-button>
                <ha-icon-button
                  .path=${ICON_RESTORE}
                  style="--mdc-icon-button-size:28px;color:${CSS_SECONDARY_TEXT}"
                  title="Restore suggestion"
                  @click=${() => panel._restoreDeniedReplacement(entityId, ts)}
                ></ha-icon-button>
              </span>
            </div>
          `)}
      </div></div>
    </ha-expansion-panel>
  `;
}
