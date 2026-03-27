/**
 * Detail view battery history chart (Chart.js).
 *
 * Imperative init/update/destroy — call initDetailChart(panel) after render.
 * Manages the Chart instance lifecycle on panel._detailChart.
 */

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Filler,
  Tooltip,
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, Filler, Tooltip);

const CANVAS_ID = "jp-detail-chart-canvas";

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

  const levelColor = _resolveColor(panel, "--state-sensor-battery-color", "#4caf50");
  const gridColor = _resolveColor(panel, "--divider-color", "rgba(0,0,0,0.12)");
  const textColor = _resolveColor(panel, "--secondary-text-color", "#888");

  const chartData = {
    datasets: [{
      data,
      borderColor: levelColor,
      backgroundColor: levelColor + "26",  // 15% opacity fill
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: true,
      tension: 0.4,  // cubic interpolation
    }],
  };

  const options = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,  // data is already {x, y}
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
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => _formatTooltipDate(items[0].parsed.x),
          label: (item) => `${Math.round(item.parsed.y)}%`,
        },
      },
    },
  };

  if (panel._detailChart) {
    panel._detailChart.data = chartData;
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

function _destroyChart(panel) {
  if (panel._detailChart) {
    panel._detailChart.destroy();
    panel._detailChart = null;
  }
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
