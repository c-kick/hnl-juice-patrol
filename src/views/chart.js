/**
 * Detail view battery history chart (Chart.js).
 *
 * Imperative init/update/destroy — call initDetailChart(panel) after render.
 * Manages the Chart instance lifecycle on panel._detailChart.
 */

import { html } from "lit";
import {
  Chart,
  Legend,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Filler,
  Tooltip,
} from "chart.js";

import { COLOR_SUCCESS, COLOR_WARNING, COLOR_ERROR } from "../colors.js";

// Decimation is handled manually (lttb below) so we don't register the plugin.
Chart.register(Legend, LineController, LineElement, PointElement, LinearScale, Filler, Tooltip);

const CANVAS_ID = "jp-detail-chart-canvas";
const FILL_ALPHA = 0.15;

export const CHART_DEV_DEFAULTS = {
  decimationEnabled: true,
  algorithm: "lttb",
  samples: 25,
  tension: 0.5,
  borderWidth: 3,
  primaryOpacity: 1,
  rawOpacity: 0.25,
};

/**
 * Initialize or update the detail chart.
 * Destroys and recreates if the entity changed, updates data otherwise.
 */
export function initDetailChart(panel) {
  const canvas = panel.shadowRoot?.getElementById(CANVAS_ID);
  if (!canvas) return;

  const data = panel._chartData;
  if (!data || data.length === 0) {
    _destroyChart(panel);
    return;
  }

  const dev = panel._getDevice(panel._detailEntity);
  const threshold = dev?.threshold ?? panel._settingsValues?.low_threshold ?? 20;
  const s = panel._chartDevSettings ?? CHART_DEV_DEFAULTS;

  const rc = (v, fb) => _resolveColor(panel, v, fb);
  const colorOk = rc(COLOR_SUCCESS.var, COLOR_SUCCESS.fallback);
  const colorWarn = rc(COLOR_WARNING.var, COLOR_WARNING.fallback);
  const colorLow = rc(COLOR_ERROR.var, COLOR_ERROR.fallback);
  const gridColor = rc("--divider-color", "rgba(0,0,0,0.12)");
  const textColor = rc("--secondary-text-color", "#888");
  const neutralColor = _toRgba(textColor, s.rawOpacity);

  // Primary series data: LTTB-decimated when enabled, raw otherwise.
  const primaryData = s.decimationEnabled
    ? _lttb(data, s.samples)
    : data;

  // Gradient factory — called on each render so chartArea is always current.
  const makeGradient = (ctx, chartArea, alpha) =>
    _buildThresholdGradient(ctx, chartArea, threshold, colorOk, colorWarn, colorLow, alpha);

  const chartData = {
    datasets: [
      // Raw series — full data, no decimation, neutral color, rendered behind
      {
        label: "Raw",
        data,
        parsing: false,
        borderWidth: 1,
        borderColor: () => _toRgba(textColor, s.rawOpacity),
        borderDash: [4, 4],
        backgroundColor: "transparent",
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        tension: 0,
        order: 2,
      },
      // Primary series — LTTB-decimated, gradient-colored, rendered in front
      {
        label: "Decimated",
        data: primaryData,
        parsing: false,
        borderWidth: s.borderWidth,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: s.tension,
        order: 1,
        borderColor: ({ chart }) => chart.chartArea
          ? makeGradient(chart.ctx, chart.chartArea, s.primaryOpacity)
          : colorOk,
        backgroundColor: ({ chart }) => chart.chartArea
          ? makeGradient(chart.ctx, chart.chartArea, FILL_ALPHA * s.primaryOpacity)
          : _toRgba(colorOk, FILL_ALPHA * s.primaryOpacity),
      },
    ],
  };

  const options = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,
    scales: {
      x: {
        type: "linear",
        min: data[0].x,
        max: data[data.length - 1].x,
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          maxTicksLimit: 8,
          callback: _formatXTick,
        },
        border: { display: false },
      },
      y: {
        type: "linear",
        min: 0,
        max: 100,
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          stepSize: 25,
          callback: (v) => v + "%",
        },
        border: { display: false },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: textColor,
          boxWidth: 24,
          boxHeight: 2,
          padding: 12,
        },
      },
      tooltip: {
        callbacks: {
          title: (items) => _formatTooltipDate(items[0].parsed.x),
          label: (item) => `${Math.round(item.parsed.y)}%`,
        },
      },
    },
  };

  if (panel._detailChart) {
    // Directly mutate datasets so scriptable props (closures) are always picked up.
    // Replacing chart.data wholesale leaves element-level caches stale in Chart.js v4.
    const ds = panel._detailChart.data.datasets;
    ds[0].data = data;
    ds[0].borderColor = _toRgba(textColor, s.rawOpacity);
    ds[0].borderDash = [4, 4];
    ds[1].data = primaryData;
    ds[1].borderColor = ({ chart: c }) => c.chartArea
      ? makeGradient(c.ctx, c.chartArea, s.primaryOpacity) : colorOk;
    ds[1].backgroundColor = ({ chart: c }) => c.chartArea
      ? makeGradient(c.ctx, c.chartArea, FILL_ALPHA * s.primaryOpacity)
      : _toRgba(colorOk, FILL_ALPHA * s.primaryOpacity);
    ds[1].tension = s.tension;
    ds[1].borderWidth = s.borderWidth;
    panel._detailChart.options = options;
    panel._detailChart.update();
  } else {
    panel._detailChart = new Chart(canvas, { type: "line", data: chartData, options });
  }
}

/** Destroy and clean up the Chart instance. */
export function destroyDetailChart(panel) {
  _destroyChart(panel);
}

/**
 * Render the dev control panel for chart settings.
 */
export function renderChartDevPanel(panel) {
  const s = panel._chartDevSettings ?? CHART_DEV_DEFAULTS;
  const rawPoints = panel._chartData?.length ?? 0;
  const decimatedPoints = s.decimationEnabled ? Math.min(s.samples, rawPoints) : rawPoints;
  const update = (key, val) => panel._updateChartDev(key, val);

  return html`
    <ha-card style="margin-bottom:16px;border:2px dashed var(--warning-color,#ffa726)">
      <ha-expansion-panel>
        <div slot="header" style="display:flex;align-items:center;gap:8px">
          <ha-icon icon="mdi:tune" style="--mdc-icon-size:18px;color:var(--warning-color,#ffa726)"></ha-icon>
          <span style="font-weight:500;color:var(--warning-color,#ffa726)">Dev: Chart Settings</span>
          <span style="margin-left:auto;font-size:12px;color:var(--secondary-text-color)">
            ${rawPoints.toLocaleString()} pts → ${decimatedPoints.toLocaleString()}
          </span>
        </div>
        <div style="padding:12px 16px;display:flex;flex-direction:column;gap:12px">

          <div style="display:flex;align-items:center;gap:12px">
            <label style="min-width:120px;font-size:13px">Decimation</label>
            <ha-switch
              .checked=${s.decimationEnabled}
              @change=${(e) => update("decimationEnabled", e.target.checked)}
            ></ha-switch>
            <span style="font-size:12px;color:var(--secondary-text-color)">
              ${s.decimationEnabled ? "on" : "off"}
            </span>
          </div>

          <div style="display:flex;align-items:center;gap:12px">
            <label style="min-width:120px;font-size:13px">Samples</label>
            <input type="range" min="1" max="500" step="1"
              .value=${String(s.samples)}
              @input=${(e) => update("samples", Number(e.target.value))}
              ?disabled=${!s.decimationEnabled}
              style="flex:1"
            />
            <span style="min-width:36px;font-size:12px;color:var(--secondary-text-color);text-align:right">
              ${s.samples}
            </span>
          </div>

          <div style="display:flex;align-items:center;gap:12px">
            <label style="min-width:120px;font-size:13px">Tension</label>
            <input type="range" min="0" max="1" step="0.05"
              .value=${String(s.tension)}
              @input=${(e) => update("tension", Number(e.target.value))}
              style="flex:1"
            />
            <span style="min-width:36px;font-size:12px;color:var(--secondary-text-color);text-align:right">
              ${s.tension.toFixed(2)}
            </span>
          </div>

          <div style="display:flex;align-items:center;gap:12px">
            <label style="min-width:120px;font-size:13px">Primary opacity</label>
            <input type="range" min="0" max="1" step="0.05"
              .value=${String(s.primaryOpacity)}
              @input=${(e) => update("primaryOpacity", Number(e.target.value))}
              style="flex:1"
            />
            <span style="min-width:36px;font-size:12px;color:var(--secondary-text-color);text-align:right">
              ${s.primaryOpacity.toFixed(2)}
            </span>
          </div>

          <div style="display:flex;align-items:center;gap:12px">
            <label style="min-width:120px;font-size:13px">Raw opacity</label>
            <input type="range" min="0" max="1" step="0.05"
              .value=${String(s.rawOpacity)}
              @input=${(e) => update("rawOpacity", Number(e.target.value))}
              style="flex:1"
            />
            <span style="min-width:36px;font-size:12px;color:var(--secondary-text-color);text-align:right">
              ${s.rawOpacity.toFixed(2)}
            </span>
          </div>

          <div style="display:flex;align-items:center;gap:12px">
            <label style="min-width:120px;font-size:13px">Border width</label>
            <input type="range" min="0.5" max="5" step="0.5"
              .value=${String(s.borderWidth)}
              @input=${(e) => update("borderWidth", Number(e.target.value))}
              style="flex:1"
            />
            <span style="min-width:36px;font-size:12px;color:var(--secondary-text-color);text-align:right">
              ${s.borderWidth}
            </span>
          </div>

        </div>
      </ha-expansion-panel>
    </ha-card>
  `;
}

function _destroyChart(panel) {
  if (panel._detailChart) {
    panel._detailChart.destroy();
    panel._detailChart = null;
  }
}

/**
 * Largest-Triangle-Three-Buckets downsampling.
 * Returns a new array of at most `threshold` points preserving visual shape.
 */
function _lttb(data, threshold) {
  const n = data.length;
  if (threshold >= n || threshold <= 2) return data;

  const sampled = new Array(threshold);
  const every = (n - 2) / (threshold - 2);
  let a = 0;
  sampled[0] = data[0];

  for (let i = 0; i < threshold - 2; i++) {
    // Average of next bucket
    const avgRangeStart = Math.floor((i + 1) * every) + 1;
    const avgRangeEnd = Math.min(Math.floor((i + 2) * every) + 1, n);
    let avgX = 0, avgY = 0;
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j].x;
      avgY += data[j].y;
    }
    const len = avgRangeEnd - avgRangeStart;
    avgX /= len;
    avgY /= len;

    // Point with largest triangle area in current bucket
    const rangeStart = Math.floor(i * every) + 1;
    const rangeEnd = Math.floor((i + 1) * every) + 1;
    const { x: ax, y: ay } = data[a];
    let maxArea = -1, nextA = rangeStart;
    for (let j = rangeStart; j < rangeEnd; j++) {
      const area = Math.abs(
        (ax - avgX) * (data[j].y - ay) - (ax - data[j].x) * (avgY - ay)
      ) * 0.5;
      if (area > maxArea) { maxArea = area; nextA = j; }
    }

    sampled[i + 1] = data[nextA];
    a = nextA;
  }

  sampled[threshold - 1] = data[n - 1];
  return sampled;
}

/**
 * Build a vertical canvas gradient with three sharp zones:
 *   0% – threshold:                          red   (colorLow)
 *   threshold – threshold+(100-threshold)/3: orange (colorWarn)
 *   above:                                   green  (colorOk)
 */
function _buildThresholdGradient(ctx, chartArea, threshold, colorOk, colorWarn, colorLow, alpha) {
  const { top, bottom } = chartArea;
  const gradient = ctx.createLinearGradient(0, top, 0, bottom);

  const orangeStart = threshold + (100 - threshold) / 3;
  const orangeFrac = (100 - orangeStart) / 100;
  const threshFrac  = (100 - threshold)  / 100;

  const ok   = _toRgba(colorOk,   alpha);
  const warn = _toRgba(colorWarn, alpha);
  const low  = _toRgba(colorLow,  alpha);

  gradient.addColorStop(0,           ok);
  gradient.addColorStop(orangeFrac,  ok);
  gradient.addColorStop(orangeFrac,  warn);
  gradient.addColorStop(threshFrac,  warn);
  gradient.addColorStop(threshFrac,  low);
  gradient.addColorStop(1,           low);

  return gradient;
}

/** Convert any CSS color (rgb/rgba/hex) to rgba with the given alpha (0–1). */
function _toRgba(color, alpha) {
  if (color.startsWith("rgba(")) {
    return color.replace(/,\s*[\d.]+\)$/, `, ${alpha})`);
  }
  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  }
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return color;
}

function _resolveColor(panel, varName, fallback) {
  const v = getComputedStyle(panel).getPropertyValue(varName).trim();
  return v || fallback;
}

function _formatXTick(value) {
  const d = new Date(value);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function _formatTooltipDate(value) {
  const d = new Date(value);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
