import { html, nothing } from "lit";
import { getLevelColor, formatRate, getDeviceSubText, displayLevel } from "../helpers.js";
import { resolveColor } from "../chart.js";
import {
  COLOR_PRIMARY, COLOR_INFO, COLOR_SUCCESS, COLOR_WARNING, COLOR_ERROR,
  COLOR_DISABLED, COLOR_SECONDARY_TEXT, COLOR_PRIMARY_TEXT, COLOR_CARD_BG,
  CSS_SUCCESS, CSS_WARNING, CSS_ERROR, CSS_INFO, CSS_PRIMARY,
} from "../colors.js";

// ── Pure computation (testable, no DOM) ──

/** Level buckets for fleet/type composition charts. */
const LEVEL_BUCKETS = [
  { key: "critical", min: 0, max: 10, label: "0–10%", colorVar: "--error-color", mix: "80%" },
  { key: "warning", min: 11, max: 50, label: "10–50%", colorVar: "--warning-color", mix: "80%" },
  { key: "healthy", min: 51, max: 100, label: "50–100%", colorVar: "--success-color", mix: "80%" },
];

/** Anomaly description lookup keyed by `anomaly|stability` combo. */
const ANOMALY_DESCRIPTIONS = {
  "cliff|stable": "Non-linear discharge curve. Battery likely to fail abruptly once it crosses the knee threshold — prediction unreliable.",
  "cliff|moderate": "Non-linear discharge curve with moderate noise. Expect sudden failure once the cliff threshold is reached.",
  "cliff|erratic": "Cliff-drop discharge pattern combined with erratic readings. Both the timing and threshold of failure are unpredictable.",
  "rapid|stable": "Discharge rate is significantly elevated for this device type. Likely hardware defect or excessive polling/advertising interval.",
  "rapid|moderate": "Rapid drain with moderate sensor noise. Investigate hardware or radio environment.",
  "rapid|erratic": "Rapid drain combined with erratic readings. Possible intermittent connectivity issue compounding a hardware problem.",
  "normal|erratic": "Readings fluctuate irregularly. Possible intermittent ZHA connectivity or faulty voltage ADC on device.",
  "normal|moderate": "Slightly irregular readings but within tolerance. May stabilize with more data.",
};

function getAnomalyDescription(anomaly, stability) {
  return ANOMALY_DESCRIPTIONS[`${anomaly}|${stability}`]
    || ANOMALY_DESCRIPTIONS[`${anomaly}|stable`]
    || "Unusual behavior detected. Check device connectivity and battery contact.";
}

function getAnomalyBadge(anomaly, stability) {
  if (anomaly === "cliff") return { label: "CLIFF DROP", cls: "error" };
  if (anomaly === "rapid" && stability === "erratic") return { label: "RAPID + NOISY", cls: "warning" };
  if (anomaly === "rapid") return { label: "RAPID", cls: "warning" };
  if (stability === "erratic") return { label: "ERRATIC", cls: "warning" };
  return { label: "ANOMALY", cls: "warning" };
}

/**
 * Compute fleet composition buckets including stale and unavailable.
 */
function computeFleetComposition(entities) {
  const buckets = {};
  for (const b of LEVEL_BUCKETS) buckets[b.key] = 0;
  let rechargeable = 0;
  let stale = 0;
  let unavailable = 0;
  let total = 0;

  for (const e of entities) {
    total++;
    if (e.level == null) {
      unavailable++;
      continue;
    }
    if (e.isStale) {
      stale++;
      continue;
    }
    if (e.isRechargeable) {
      rechargeable++;
      continue;
    }
    const lvl = Math.ceil(e.level);
    for (const b of LEVEL_BUCKETS) {
      if (lvl >= b.min && lvl <= b.max) {
        buckets[b.key]++;
        break;
      }
    }
  }
  return { buckets, rechargeable, stale, unavailable, total };
}

/**
 * Get the 5 devices with the shortest remaining life, sorted ascending.
 * Only includes non-rechargeable devices with a known daysRemaining.
 */
function getAttentionEntities(entities) {
  return entities
    .filter(e => e.level != null && !e.isRechargeable && e.daysRemaining != null)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 5);
}

/**
 * Select top "most wanted" devices — worst offenders that deserve detailed cards.
 * Prioritizes: rapid drain with replacements > cliff drops > lowest battery.
 */
function getMostWanted(entities, dashboardData) {
  const replData = dashboardData?.replacement_data || {};
  const candidates = [];

  for (const e of entities) {
    if (e.level == null || e.isRechargeable) continue;
    let score = 0;
    const rd = replData[e.sourceEntity];
    const replCount = rd?.replacement_history?.length ?? 0;

    // High drain rate
    if (e.dischargeRate != null && Math.abs(e.dischargeRate) > 5) score += 30;
    else if (e.dischargeRate != null && Math.abs(e.dischargeRate) > 1) score += 15;

    // Low battery
    if (e.isLow) score += 25;
    else if (e.level < 40) score += 10;

    // Anomalies
    if (e.anomaly === "cliff") score += 20;
    if (e.anomaly === "rapid") score += 25;
    if (e.stability === "erratic") score += 15;

    // Frequent replacements
    if (replCount >= 3) score += 30;
    else if (replCount >= 2) score += 15;

    // Short remaining
    if (e.daysRemaining != null && e.daysRemaining <= 7) score += 20;
    else if (e.daysRemaining != null && e.daysRemaining <= 30) score += 10;

    if (score > 0) {
      candidates.push({ entity: e, score, replCount, replData: rd });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 3);
}

/**
 * Compute health-by-battery-type data.
 */
function computeHealthByType(entities) {
  const typeMap = {};

  for (const e of entities) {
    if (e.level == null) continue;
    let typeKey;
    if (e.isRechargeable) {
      typeKey = "Rechargeable";
    } else {
      // Normalize: "2× CR2032" → "CR2032"
      const m = e.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);
      typeKey = m ? m[1].trim() : (e.batteryType || "Unknown");
    }

    if (!typeMap[typeKey]) {
      typeMap[typeKey] = { type: typeKey, devices: [], isRechargeable: typeKey === "Rechargeable" };
    }
    typeMap[typeKey].devices.push(e);
  }

  // Sort by device count descending
  const types = Object.values(typeMap).sort((a, b) => b.devices.length - a.devices.length);

  // For each type, compute level distribution buckets
  for (const t of types) {
    t.buckets = {};
    for (const b of LEVEL_BUCKETS) t.buckets[b.key] = 0;
    for (const d of t.devices) {
      const lvl = Math.ceil(d.level);
      for (const b of LEVEL_BUCKETS) {
        if (lvl >= b.min && lvl <= b.max) {
          t.buckets[b.key]++;
          break;
        }
      }
    }
  }

  return types;
}

/**
 * Compute fleet health scores.
 */
function computeFleetScores(entities) {
  let aboveThreshold = 0, totalDisposable = 0, levelSum = 0, levelCount = 0;

  for (const e of entities) {
    if (e.level == null) continue;
    if (!e.isRechargeable) {
      totalDisposable++;
      levelSum += e.level;
      levelCount++;
      if (!e.isLow) aboveThreshold++;
    }
  }

  const readiness = totalDisposable > 0
    ? Math.round((aboveThreshold / totalDisposable) * 100)
    : 100;
  const avgLevel = levelCount > 0 ? Math.round(levelSum / levelCount) : 0;

  return { readiness, aboveThreshold, totalDisposable, avgLevel };
}

/**
 * Compute replacement stats for a device.
 */
function computeReplacementStats(history) {
  if (!history || history.length < 2) {
    return { count: history?.length ?? 0, intervals: [], avgDays: null, accelerating: false };
  }
  const sorted = [...history].sort((a, b) => a - b);
  const intervals = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push((sorted[i] - sorted[i - 1]) / 86400);
  }
  const avgDays = Math.round(intervals.reduce((s, v) => s + v, 0) / intervals.length);
  const lastInterval = intervals[intervals.length - 1];
  const priorAvg = intervals.length > 1
    ? intervals.slice(0, -1).reduce((s, v) => s + v, 0) / (intervals.length - 1)
    : avgDays;
  const accelerating = intervals.length >= 2 && lastInterval < priorAvg * 0.5;
  return { count: sorted.length, intervals, avgDays, accelerating };
}


// ── Render functions ──

/**
 * Render the dashboard overview.
 */
export function renderDashboard(panel) {
  const entities = panel._entities || [];

  const fleet = computeFleetComposition(entities);
  panel._fleetData = fleet;
  const attention = getAttentionEntities(entities);
  const mostWanted = getMostWanted(entities, panel._dashboardData);
  const healthByType = computeHealthByType(entities);
  panel._healthByTypeData = healthByType;
  const scores = computeFleetScores(entities);

  return html`
    <div class="jp-dashboard">
      ${renderOverview(fleet, scores)}
      <div class="db-bottom-row">
        ${renderAttentionTable(panel, attention)}
        ${renderHealthByType(healthByType)}
      </div>
      ${mostWanted.length ? html`
        <div class="db-card-header" style="padding:0;border:none">
          <span class="db-card-title">Requires Attention</span>
          <span class="jp-badge warning">${mostWanted.length} device${mostWanted.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="db-mid-row">
          ${mostWanted.map(w => renderWantedCard(panel, w))}
        </div>
      ` : nothing}
    </div>
  `;
}

/**
 * Initialize all ECharts after dashboard render.
 */
export async function initFleetChart(panel) {
  if (!customElements.get("ha-chart-base")) {
    try {
      await window.loadCardHelpers?.();
      await new Promise(r => setTimeout(r, 100));
    } catch (_) { /* ignore */ }
  }
  if (!customElements.get("ha-chart-base")) return;

  // Fleet composition chart
  if (panel._fleetData) {
    _initStackedBar(panel, "jp-fleet-chart", _buildFleetSeries(panel), "_fleetChartEl", true);
  }

  // Health by type charts — all share the same xMax so bar widths are comparable
  const typeData = panel._healthByTypeData;
  if (typeData && typeData.length) {
    const typeXMax = Math.max(...typeData.map(t => t.devices.length));
    for (const t of typeData) {
      _initStackedBar(panel, `jp-type-chart-${_slugify(t.type)}`, _buildTypeSeries(panel, t, typeXMax), `_typeChart_${_slugify(t.type)}`, false);
    }
  }
}

function _slugify(s) {
  return s.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

/**
 * Shared: init a horizontal stacked bar chart in a container.
 */
function _initStackedBar(panel, containerId, { categories, series, total, xMax, clickHandler }, cacheKey, showLegend) {
  const container = panel.shadowRoot?.getElementById(containerId);
  if (!container) return;

  const rc = (v, fb) => resolveColor(panel, v, fb);
  const colorSecondary = rc(COLOR_SECONDARY_TEXT.var, COLOR_SECONDARY_TEXT.fallback);
  const colorBg = rc(COLOR_CARD_BG.var, rc("--card-background-color", COLOR_CARD_BG.fallback));
  const colorText = rc(COLOR_PRIMARY_TEXT.var, COLOR_PRIMARY_TEXT.fallback);

  const option = {
    xAxis: { type: "value", show: false, max: xMax || "dataMax" },
    yAxis: { type: "category", show: false, data: [""] },
    legend: showLegend ? {
      show: true,
      bottom: 0,
      left: "center",
      textStyle: { color: colorSecondary, fontSize: 11 },
      itemWidth: 10, itemHeight: 10, itemGap: 14,
      icon: "roundRect",
      selectedMode: true,
    } : { show: false },
    tooltip: {
      trigger: "item",
      backgroundColor: colorBg,
      borderColor: rc("--divider-color", "rgba(0,0,0,0.12)"),
      textStyle: { color: colorText, fontSize: 12 },
      formatter: (params) => `${params.seriesName}: ${params.value} device${params.value !== 1 ? "s" : ""}`,
    },
    grid: {
      left: 8, right: 8,
      top: 6,
      bottom: showLegend ? 40 : 6,
      containLabel: false,
    },
  };

  let chart = panel[cacheKey];
  if (!chart || !container.contains(chart)) {
    chart = document.createElement("ha-chart-base");
    container.innerHTML = "";
    container.appendChild(chart);
    panel[cacheKey] = chart;
  }
  chart.hass = panel._hass;
  const height = showLegend ? "90px" : "32px";
  chart.height = height;
  chart.style.height = height;
  chart.style.display = "block";
  chart.style.cursor = "pointer";

  if (!chart._jpClickBound && clickHandler) {
    chart.addEventListener("chart-click", (e) => {
      const name = e.detail?.seriesName;
      if (!name) return;
      const cat = categories.find(c => c.name === name);
      if (cat) clickHandler(cat);
    });
    chart._jpClickBound = true;
  }

  requestAnimationFrame(() => {
    chart.data = series;
    chart.options = option;
  });
}

/**
 * Build series data for the fleet composition chart.
 */
function _buildFleetSeries(panel) {
  const fleet = panel._fleetData;
  const rc = (v, fb) => resolveColor(panel, v, fb);
  const colorText = rc(COLOR_PRIMARY_TEXT.var, COLOR_PRIMARY_TEXT.fallback);

  const categories = [
    ...LEVEL_BUCKETS.map(b => ({
      name: b.label,
      value: fleet.buckets[b.key],
      color: rc(b.colorVar, COLOR_DISABLED.fallback),
      opacity: parseFloat(b.mix) / 100,
      levelMin: b.min, levelMax: b.max,
    })),
    { name: "Rechargeable", value: fleet.rechargeable, color: rc(COLOR_INFO.var, COLOR_INFO.fallback), opacity: 0.55, filter: "rechargeable" },
    { name: "Stale", value: fleet.stale, color: rc(COLOR_DISABLED.var, COLOR_DISABLED.fallback), opacity: 0.5, filter: "stale" },
    { name: "Unavailable", value: fleet.unavailable, color: rc(COLOR_DISABLED.var, COLOR_DISABLED.fallback), opacity: 0.3, filter: "unavailable" },
  ];

  const series = categories.map(cat => ({
    name: cat.name,
    type: "bar",
    stack: "fleet",
    data: [cat.value],
    itemStyle: { color: cat.color, opacity: cat.opacity, borderRadius: 0 },
    barWidth: "60%",
    label: {
      show: cat.value > 0,
      position: "inside",
      formatter: `${cat.value}`,
      fontSize: 11, fontWeight: 500, color: colorText,
    },
    emphasis: { focus: "series" },
  }));

  const clickHandler = (cat) => {
    if (cat.levelMin != null) {
      panel._navigateToDevicesWithLevelFilter(cat.levelMin, cat.levelMax);
    } else if (cat.filter === "rechargeable") {
      panel._navigateToDevicesWithLevelFilter(null, null, { battery: { value: ["rechargeable"] } });
    } else if (cat.filter === "stale") {
      panel._navigateToDevicesWithLevelFilter(null, null, { status: { value: ["stale"] } });
    } else if (cat.filter === "unavailable") {
      panel._navigateToDevicesWithLevelFilter(null, null, { status: { value: ["unavailable"] } });
    }
  };

  return { categories, series, total: fleet.total, clickHandler };
}

/**
 * Build series data for a single battery type health chart.
 */
function _buildTypeSeries(panel, typeData, xMax) {
  const rc = (v, fb) => resolveColor(panel, v, fb);
  const colorText = rc(COLOR_PRIMARY_TEXT.var, COLOR_PRIMARY_TEXT.fallback);

  const categories = LEVEL_BUCKETS.map(b => {
    const count = typeData.buckets[b.key];
    const color = typeData.isRechargeable
      ? rc(COLOR_INFO.var, COLOR_INFO.fallback)
      : rc(b.colorVar, COLOR_DISABLED.fallback);
    const opacity = typeData.isRechargeable
      ? 0.25 + (b.min / 100) * 0.35
      : parseFloat(b.mix) / 100;
    return {
      name: b.label, value: count, color, opacity,
      levelMin: b.min, levelMax: b.max,
    };
  }).filter(c => c.value > 0);

  const series = categories.map(cat => ({
    name: cat.name,
    type: "bar",
    stack: "type",
    data: [cat.value],
    itemStyle: { color: cat.color, opacity: cat.opacity, borderRadius: 0 },
    barWidth: "80%",
    label: {
      show: cat.value > 0,
      position: "inside",
      formatter: `${cat.value}`,
      fontSize: 10, fontWeight: 500, color: colorText,
    },
    emphasis: { focus: "series" },
  }));

  const clickHandler = (cat) => {
    // Navigate with both level range AND battery type filter
    panel._navigateToDevicesWithLevelFilter(cat.levelMin, cat.levelMax, {
      batteryType: { value: [typeData.type] },
    });
  };

  return { categories, series, total: typeData.devices.length, xMax, clickHandler };
}

// Keep export name for panel's updated() hook
export const initTimelineChart = initFleetChart;


// ── Overview card: fleet chart + readiness + avg level ──

function renderOverview(fleet, scores) {
  const readinessColor = scores.readiness >= 80 ? CSS_SUCCESS
    : scores.readiness >= 50 ? CSS_WARNING : CSS_ERROR;

  return html`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Overview</span>
        <span class="jp-badge neutral">${fleet.total} devices</span>
      </div>
      <div id="jp-fleet-chart" style="padding:4px 8px"></div>
      <div class="db-overview-stats">
        <div class="db-stat">
          <span class="db-stat-value" style="color:${readinessColor}">${scores.readiness}%</span>
          <span class="db-stat-label">Fleet Readiness</span>
          <span class="db-stat-sub">${scores.aboveThreshold} of ${scores.totalDisposable} disposable above threshold</span>
        </div>
        <div class="db-stat">
          <span class="db-stat-value" style="color:${
            scores.avgLevel <= 10 ? CSS_ERROR
              : scores.avgLevel <= 50 ? CSS_WARNING
              : CSS_SUCCESS
          }">${scores.avgLevel}%</span>
          <span class="db-stat-label">Average Level</span>
          <span class="db-stat-sub">Across all disposable devices</span>
        </div>
      </div>
    </ha-card>
  `;
}


// ── Attention table (shortest life remaining) ──

function renderAttentionTable(panel, attention) {
  if (!attention.length) {
    return html`
      <ha-card>
        <div class="db-card-header">
          <span class="db-card-title">Shortest Life Remaining</span>
          <span class="jp-badge neutral">No predictions yet</span>
        </div>
        <div class="empty-state" style="padding:24px">No devices have discharge predictions yet.</div>
      </ha-card>
    `;
  }

  return html`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Shortest Life Remaining</span>
      </div>
      <div class="card-content" style="padding-top:0">
        <table class="att-table">
          <thead><tr><th>Device</th><th>Level</th><th>Remaining</th></tr></thead>
          <tbody>
            ${attention.map(e => {
              const lvl = displayLevel(e.level);
              const color = getLevelColor(e.level, e.threshold ?? 20);
              const left = e.daysRemaining <= 1
                ? Math.round(e.daysRemaining * 24) + "h"
                : Math.round(e.daysRemaining * 10) / 10 + "d";
              return html`
                <tr class="att-row" @click=${() => panel._openDetail(e.sourceEntity)}>
                  <td class="name-cell">${e.name}</td>
                  <td>
                    <div class="level-indicator">
                      <span style="color:${color};font-weight:500">${lvl}%</span>
                      <div class="level-bar">
                        <div class="level-bar-fill" style="width:${lvl}%;background:${color}"></div>
                      </div>
                    </div>
                  </td>
                  <td class="dim">${left}</td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    </ha-card>
  `;
}


// ── Most Wanted cards ──

function renderWantedCard(panel, { entity: e, replCount, replData }) {
  const color = getLevelColor(e.level, e.threshold ?? 20);
  const lvl = displayLevel(e.level);
  const subText = getDeviceSubText(e);

  // Stats grid
  const rateText = e.dischargeRate != null ? formatRate(e) : "—";
  const remainText = e.daysRemaining != null
    ? (e.daysRemaining <= 1 ? Math.round(e.daysRemaining * 24) + " hours" : Math.round(e.daysRemaining * 10) / 10 + " days")
    : (e.hoursRemaining != null ? e.hoursRemaining + " hours" : "Unknown");
  const remainColor = e.daysRemaining != null && e.daysRemaining <= 7
    ? CSS_ERROR : "";

  // Replacement stats
  let replText = replCount > 0 ? `${replCount}×` : "0";
  const replHistory = replData?.replacement_history || [];
  if (replHistory.length >= 2) {
    const stats = computeReplacementStats(replHistory);
    if (stats.avgDays) {
      const months = Math.round((Date.now() / 1000 - replHistory[0]) / (86400 * 30));
      replText = `${replCount}× in ${months}mo`;
    }
  }
  const replColor = replCount >= 3 ? CSS_ERROR
    : replCount >= 2 ? CSS_WARNING : "";

  // Reliability
  const reliabilityText = e.reliability != null ? `${e.reliability}%` : "—";

  // Badges
  const badges = [];
  if (e.isLow) badges.push({ label: "LOW", cls: "error" });
  if (e.anomaly === "cliff") badges.push({ label: "CLIFF DROP", cls: "error" });
  if (e.anomaly === "rapid") badges.push({ label: "RAPID", cls: "error" });
  if (e.stability === "erratic") badges.push({ label: "ERRATIC", cls: "warning" });
  if (e.predictionStatus === "flat") badges.push({ label: "FLAT", cls: "neutral" });
  if (e.predictionStatus === "normal" && !e.isLow && e.anomaly !== "rapid")
    badges.push({ label: "NORMAL DISCHARGE", cls: "neutral" });

  // Verdict
  const verdict = buildVerdict(e, replCount, replHistory);

  const threshold = e.threshold ?? 20;

  return html`
    <ha-card class="wanted-card" @click=${() => panel._openDetail(e.sourceEntity)}>
      <div class="wanted-top">
        <div class="wanted-identity">
          <div class="wanted-name">${e.name}</div>
          ${subText ? html`<div class="wanted-sub">${subText}</div>` : nothing}
        </div>
        <div class="wanted-level" style="color:${color}">${lvl}%</div>
      </div>
      <div class="wanted-stats">
        <div class="ws"><div class="ws-label">Battery</div><div class="ws-value">${e.batteryType || "Unknown"}</div></div>
        <div class="ws"><div class="ws-label">Remaining</div><div class="ws-value" style="color:${remainColor}">${remainText}</div></div>
        <div class="ws"><div class="ws-label">Drain Rate</div><div class="ws-value">${rateText}</div></div>
        <div class="ws"><div class="ws-label">Replacements</div><div class="ws-value" style="color:${replColor}">${replText}</div></div>
        <div class="ws"><div class="ws-label">Reliability</div><div class="ws-value">${reliabilityText}</div></div>
        <div class="ws"><div class="ws-label">Anomaly</div><div class="ws-value"${
          e.anomaly && e.anomaly !== "normal"
            ? ` style="color:${CSS_ERROR}"`
            : ""
        }>${e.anomaly === "cliff" ? "Cliff Drop" : e.anomaly === "rapid" ? "Rapid" : e.stability === "erratic" ? "Erratic" : "None"}</div></div>
      </div>
      <div class="wanted-gauge">
        <div class="gauge-label">Battery Level</div>
        <div class="gauge-track">
          <div class="gauge-fill" style="width:${lvl}%;background:${
            lvl <= threshold
              ? CSS_ERROR
              : `linear-gradient(90deg, ${CSS_ERROR}, ${color})`
          }"></div>
          <div class="gauge-threshold" style="left:${threshold}%"></div>
        </div>
        <div class="gauge-axis"><span>0%</span><span>threshold</span><span>100%</span></div>
      </div>
      ${badges.length ? html`
        <div class="wanted-badges">
          ${badges.map(b => html`<span class="jp-badge ${b.cls}">${b.label}</span>`)}
        </div>
      ` : nothing}
      <div class="wanted-verdict">
        <strong>Verdict:</strong> ${verdict}
      </div>
    </ha-card>
  `;
}

function buildVerdict(e, replCount, replHistory) {
  if (e.anomaly === "cliff") {
    return "Non-linear cliff discharge. Reports stable level until abrupt collapse. Actual remaining life unpredictable — could be days or weeks. Prediction model unreliable for this device.";
  }
  if (e.anomaly === "rapid" && replCount >= 3) {
    const stats = computeReplacementStats(replHistory);
    const battType = e.batteryType || "battery";
    const accel = stats.accelerating ? " with shrinking intervals" : "";
    return `Eating batteries at an alarming rate. ${replCount} ${battType} cells consumed${accel}. Either the device's radio advertising interval is too aggressive or the hardware is defective.`;
  }
  if (e.anomaly === "rapid") {
    return "Discharge rate is significantly elevated. Investigate hardware, radio environment, or excessive polling interval.";
  }
  if (e.isLow && e.daysRemaining != null) {
    const battType = e.batteryType || "battery";
    return `At end-of-life. ${battType} replacement needed soon. ${e.daysRemaining <= 1 ? "Less than a day remaining." : `Predicted empty in ${Math.round(e.daysRemaining)} days.`}`;
  }
  if (e.isLow) {
    return "Battery is below the low threshold. Replacement recommended.";
  }
  if (e.stability === "erratic") {
    return "Readings fluctuate irregularly. Possible intermittent connectivity or faulty voltage ADC.";
  }
  if (e.daysRemaining != null && e.daysRemaining <= 7) {
    return `Predicted to die within ${Math.round(e.daysRemaining)} days. Replace soon.`;
  }
  return "Warrants monitoring — review the detail chart for discharge pattern.";
}


// ── Health by Battery Type (ECharts per row) ──

function renderHealthByType(types) {
  return html`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Health by Battery Type</span>
        <span class="jp-badge primary">${types.length} type${types.length !== 1 ? "s" : ""}</span>
      </div>
      <div class="card-content">
        <div class="type-health-list">
          ${types.map(t => html`
            <div class="type-health-row">
              <span class="th-type" style="color:${t.isRechargeable ? CSS_INFO : CSS_PRIMARY}">${t.type}</span>
              <div id="jp-type-chart-${_slugify(t.type)}" class="th-chart-container"></div>
              <span class="th-count">${t.devices.length}</span>
            </div>
          `)}
        </div>
      </div>
    </ha-card>
  `;
}
