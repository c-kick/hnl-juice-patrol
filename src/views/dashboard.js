import { html, nothing } from "lit";
import { getLevelColor, getDeviceSubText, displayLevel } from "../helpers.js";
import { resolveColor } from "../chart-utils.js";
import {
  COLOR_PRIMARY, COLOR_RECHARGEABLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_ERROR,
  COLOR_DISABLED, COLOR_SECONDARY_TEXT, COLOR_PRIMARY_TEXT, COLOR_CARD_BG,
  CSS_SUCCESS, CSS_WARNING, CSS_ERROR, CSS_RECHARGEABLE, CSS_PRIMARY,
} from "../colors.js";

// ── Pure computation (testable, no DOM) ──

/** Level buckets for fleet/type composition charts. */
const LEVEL_BUCKETS = [
  { key: "critical", min: 0, max: 10, label: "0\u201310%", color: COLOR_ERROR },
  { key: "warning", min: 11, max: 50, label: "10\u201350%", color: COLOR_WARNING },
  { key: "healthy", min: 51, max: 100, label: "50\u2013100%", color: COLOR_SUCCESS },
];

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
 * Get the 5 devices with the lowest battery, sorted ascending.
 * Only includes non-rechargeable devices with a known level.
 */
function getLowestBatteryEntities(entities) {
  return entities
    .filter(e => e.level != null && !e.isRechargeable && !e.isStale)
    .sort((a, b) => a.level - b.level)
    .slice(0, 5);
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
      const m = e.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);
      typeKey = m ? m[1].trim() : (e.batteryType || "Unknown");
    }

    if (!typeMap[typeKey]) {
      typeMap[typeKey] = { type: typeKey, devices: [], isRechargeable: typeKey === "Rechargeable" };
    }
    typeMap[typeKey].devices.push(e);
  }

  const types = Object.values(typeMap).sort((a, b) => b.devices.length - a.devices.length);

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


// ── Render functions ──

/**
 * Render the dashboard overview.
 */
export function renderDashboard(panel) {
  const entities = panel._entities || [];

  const fleet = computeFleetComposition(entities);
  panel._fleetData = fleet;
  const lowestBattery = getLowestBatteryEntities(entities);
  const healthByType = computeHealthByType(entities);
  panel._healthByTypeData = healthByType;
  const scores = computeFleetScores(entities);

  return html`
    <div class="jp-dashboard">
      ${renderOverview(fleet, scores)}
      <div class="db-bottom-row">
        ${renderLowestBatteryTable(panel, lowestBattery)}
        ${renderHealthByType(healthByType)}
      </div>
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

  if (panel._fleetData) {
    _initStackedBar(panel, "jp-fleet-chart", _buildFleetSeries(panel), "_fleetChartEl", true);
  }

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
 * Resolve a CSS custom property to a concrete color value.
 */
function _resolveColor(panel, varName, fallback) {
  const v = getComputedStyle(panel).getPropertyValue(varName).trim();
  return v || fallback;
}

function _initStackedBar(panel, containerId, { categories, series, total, xMax, clickHandler }, cacheKey, showLegend) {
  const container = panel.shadowRoot?.getElementById(containerId);
  if (!container) return;

  const rc = (v, fb) => _resolveColor(panel, v, fb);
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

function _buildFleetSeries(panel) {
  const fleet = panel._fleetData;
  const rc = (v, fb) => _resolveColor(panel, v, fb);
  const colorText = rc(COLOR_PRIMARY_TEXT.var, COLOR_PRIMARY_TEXT.fallback);

  const categories = [
    ...LEVEL_BUCKETS.map(b => ({
      name: b.label,
      value: fleet.buckets[b.key],
      color: rc(b.color.var, b.color.fallback),
      opacity: b.color.opacity,
      levelMin: b.min, levelMax: b.max,
    })),
    { name: "Rechargeable", value: fleet.rechargeable, color: rc(COLOR_RECHARGEABLE.var, COLOR_RECHARGEABLE.fallback), opacity: COLOR_RECHARGEABLE.opacity, filter: "rechargeable" },
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

function _buildTypeSeries(panel, typeData, xMax) {
  const rc = (v, fb) => _resolveColor(panel, v, fb);
  const colorText = rc(COLOR_PRIMARY_TEXT.var, COLOR_PRIMARY_TEXT.fallback);

  const n = LEVEL_BUCKETS.length;
  const categories = LEVEL_BUCKETS.map((b, i) => {
    const count = typeData.buckets[b.key];
    const color = typeData.isRechargeable
      ? rc(COLOR_RECHARGEABLE.var, COLOR_RECHARGEABLE.fallback)
      : rc(b.color.var, b.color.fallback);
    const [oMin, oMax] = COLOR_RECHARGEABLE.opacityRange;
    const opacity = typeData.isRechargeable
      ? oMin + (i / (n - 1)) * (oMax - oMin)
      : b.color.opacity;
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


// ── Lowest Battery table ──

function renderLowestBatteryTable(panel, lowestBattery) {
  if (!lowestBattery.length) {
    return html`
      <ha-card>
        <div class="db-card-header">
          <span class="db-card-title">Lowest Battery</span>
          <span class="jp-badge neutral">No devices</span>
        </div>
        <div class="empty-state" style="padding:24px">No battery devices found.</div>
      </ha-card>
    `;
  }

  return html`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Lowest Battery</span>
      </div>
      <div class="card-content" style="padding-top:0">
        <table class="att-table">
          <thead><tr><th>Device</th><th>Level</th><th>Type</th></tr></thead>
          <tbody>
            ${lowestBattery.map(e => {
              const lvl = displayLevel(e.level);
              const color = getLevelColor(e.level, e.threshold ?? 20);
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
                  <td class="dim">${e.batteryType || "\u2014"}</td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    </ha-card>
  `;
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
              <span class="th-type" style="color:${t.isRechargeable ? CSS_RECHARGEABLE : CSS_PRIMARY}">${t.type}</span>
              <div id="jp-type-chart-${_slugify(t.type)}" class="th-chart-container"></div>
              <span class="th-count">${t.devices.length}</span>
            </div>
          `)}
        </div>
      </div>
    </ha-card>
  `;
}
