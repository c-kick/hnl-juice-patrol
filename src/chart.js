/**
 * Chart initialization and ECharts series computation.
 *
 * Extracted from the main panel class. All functions receive the panel
 * instance (`panel`) to access shadow DOM, theme colors, and chart state.
 */

/**
 * Resolve a CSS custom property to a concrete color value for ECharts canvas.
 * Falls back to the provided default if the variable is unset or empty.
 */
export function resolveColor(element, varName, fallback) {
  const v = getComputedStyle(element).getPropertyValue(varName).trim();
  return v || fallback;
}

/**
 * Initialize or update the ECharts chart inside the panel's shadow DOM.
 *
 * @param {LitElement} panel - The panel instance (for shadowRoot, _hass, _chartEl, _chartRange)
 * @param {Object} chartData - Chart data from the WS API (readings, prediction, etc.)
 */
export async function initChart(panel, chartData) {
  const container = panel.shadowRoot.getElementById("jp-chart");
  if (!container || !chartData || !chartData.readings || chartData.readings.length === 0)
    return;

  if (!customElements.get("ha-chart-base")) {
    try {
      await window.loadCardHelpers?.();
      await new Promise((r) => setTimeout(r, 100));
    } catch (e) {
      console.warn("Juice Patrol: loadCardHelpers failed", e);
    }
  }

  if (!customElements.get("ha-chart-base")) {
    container.innerHTML = '<div class="empty-state">Chart component not available</div>';
    return;
  }

  const rc = (v, fb) => resolveColor(panel, v, fb);

  // Resolve HA theme colors to concrete values — ECharts renders to canvas
  // and cannot resolve CSS custom properties.
  const colorLevel = rc("--primary-color", "#03a9f4");
  const colorPredicted = rc("--warning-color", "#ffa726");
  const colorThreshold = rc("--error-color", "#db4437");
  const colorCharge = rc("--success-color", "#4caf50");
  const colorNowLine = rc("--secondary-text-color", "#999");
  const colorAxis = rc("--secondary-text-color", "#999");
  const colorGrid = rc("--divider-color", "rgba(0,0,0,0.12)");
  const colorTooltipBg = rc("--ha-card-background", rc("--card-background-color", "#fff"));
  const colorTooltipText = rc("--primary-text-color", "#212121");
  const colorLegend = rc("--primary-text-color", "#212121");

  const readings = chartData.readings;
  const allReadings = chartData.all_readings || readings;
  const pred = chartData.prediction;
  const threshold = chartData.threshold;
  // t0 for the regression formula: use the prediction's own reference point,
  // falling back to first_reading_timestamp for single-session predictions
  // that predate the t0 field.
  const t0 = pred.t0 ?? chartData.first_reading_timestamp;

  const observed = allReadings.map((r) => [r.t * 1000, r.v]);

  const chargePred = chartData.charge_prediction;
  const isCharging =
    chartData.charging_state?.toLowerCase() === "charging" ||
    chartData.prediction?.status === "charging";
  const hasChargePred = chargePred && chargePred.estimated_full_timestamp;

  const fitted = [];
  if (pred.slope_per_day != null && pred.intercept != null && t0 != null) {
    const fittedY = (t) => {
      const days = (t - t0) / 86400;
      return pred.slope_per_day * days + pred.intercept;
    };
    const startT = readings[0].t;
    const nowT = Date.now() / 1000;
    // Truncate discharge line at now when:
    // - charging, or
    // - no real discharge prediction (flat, noisy, insufficient_data, etc.)
    // Only project into the future when status is "normal" with an empty date.
    const shouldProject = !isCharging && pred.status === "normal";
    const endT = shouldProject
      ? (pred.estimated_empty_timestamp
        ? Math.min(pred.estimated_empty_timestamp, nowT + 365 * 86400)
        : nowT + 30 * 86400)
      : nowT;
    for (const t of [startT, nowT, ...(shouldProject ? [endT] : [])]) {
      fitted.push([t * 1000, Math.max(0, Math.min(100, fittedY(t)))]);
    }
  }

  // ── Compute auto tMin/tMax (smart default) ──
  const autoTMin = observed[0]?.[0] || Date.now();
  const nowMs = Date.now();
  let autoTMax;
  if (isCharging && chargePred && chargePred.segment_start_timestamp != null) {
    const segStartV = chargePred.segment_start_level;
    const currentLevel = chartData.level;
    const slopeH = hasChargePred
      ? chargePred.slope_per_hour
      : (currentLevel > segStartV && (nowMs / 1000 - chargePred.segment_start_timestamp) > 0)
        ? (currentLevel - segStartV) / ((nowMs / 1000 - chargePred.segment_start_timestamp) / 3600)
        : 0;
    if (slopeH > 0) {
      const fullT = hasChargePred
        ? chargePred.estimated_full_timestamp * 1000
        : nowMs + ((100 - currentLevel) / slopeH) * 3600000;
      const pad = (fullT - autoTMin) * 0.1;
      autoTMax = fullT + pad;
    } else {
      autoTMax = nowMs + (nowMs - autoTMin) * 0.2;
    }
  } else if (isCharging) {
    autoTMax = nowMs + (nowMs - autoTMin) * 0.2;
  } else {
    autoTMax = fitted.length
      ? fitted[fitted.length - 1][0]
      : observed[observed.length - 1]?.[0] || nowMs;
  }

  // ── Apply chart range ──
  const rangeDurations = {
    "1d": 1 * 86400000,
    "1w": 7 * 86400000,
    "1m": 30 * 86400000,
    "3m": 90 * 86400000,
    "6m": 180 * 86400000,
    "1y": 365 * 86400000,
  };
  let tMin, tMax;
  const range = panel._chartRange || "auto";
  if (range === "auto") {
    tMin = autoTMin;
    tMax = autoTMax;
  } else if (range === "all") {
    // Show everything: earliest reading to predicted empty (or furthest prediction)
    const earliestMs = allReadings.length ? allReadings[0].t * 1000 : autoTMin;
    const emptyMs = pred.estimated_empty_timestamp
      ? pred.estimated_empty_timestamp * 1000
      : null;
    const latestPred = fitted.length ? fitted[fitted.length - 1][0] : nowMs;
    tMin = Math.min(earliestMs, autoTMin);
    tMax = Math.max(latestPred, emptyMs || 0, autoTMax);
  } else {
    const dur = rangeDurations[range] || 30 * 86400000;
    tMin = nowMs - dur;
    const predEnd = fitted.length ? fitted[fitted.length - 1][0] : nowMs;
    tMax = Math.max(nowMs + dur, predEnd);
  }

  const series = [
    {
      name: "Battery Level",
      type: "line",
      data: observed,
      smooth: false,
      symbol: observed.length > 50 ? "none" : "circle",
      symbolSize: 4,
      lineStyle: { width: 2, color: colorLevel },
      itemStyle: { color: colorLevel },
      areaStyle: { color: colorLevel, opacity: 0.07 },
    },
  ];

  if (fitted.length > 0) {
    series.push({
      name: "Discharge prediction",
      type: "line",
      data: fitted,
      smooth: false,
      symbol: "none",
      lineStyle: { width: 2, type: "dashed", color: colorPredicted },
      itemStyle: { color: colorPredicted },
    });
  }

  // Charge prediction line (rechargeable devices currently charging)
  if (isCharging && chargePred && chargePred.segment_start_timestamp != null) {
    const segStartT = chargePred.segment_start_timestamp;
    const segStartV = chargePred.segment_start_level;
    const nowT = Date.now() / 1000;
    const currentLevel = chartData.level;

    // Use engine prediction if available, otherwise compute from observed rise
    let slopePerHour = hasChargePred ? chargePred.slope_per_hour : null;
    if ((slopePerHour == null || slopePerHour <= 0) && currentLevel > segStartV) {
      const elapsedHours = (nowT - segStartT) / 3600;
      if (elapsedHours > 0) {
        slopePerHour = (currentLevel - segStartV) / elapsedHours;
      }
    }

    if (slopePerHour > 0) {
      const hoursToFull = (100 - currentLevel) / slopePerHour;
      const endT = hasChargePred
        ? chargePred.estimated_full_timestamp
        : nowT + hoursToFull * 3600;
      const fittedChargeY = (t) => {
        const hours = (t - segStartT) / 3600;
        return slopePerHour * hours + segStartV;
      };
      const chargePoints = [segStartT, nowT, endT].map(
        (t) => [t * 1000, Math.max(0, Math.min(100, fittedChargeY(t)))]
      );
      series.push({
        name: "Charge prediction",
        type: "line",
        data: chargePoints,
        smooth: false,
        symbol: "none",
        lineStyle: { width: 2, type: "dashed", color: colorCharge },
        itemStyle: { color: colorCharge },
      });
    }
  }

  // Compute threshold crossing point (used by threshold line, discharge line, and marker)
  // Only show crossing/empty markers when we have a real discharge prediction
  // (status "normal" means the engine produced an estimated_empty_timestamp).
  const hasActivePrediction = pred.status === "normal" && pred.estimated_empty_timestamp != null;

  // Shared label style for chart markers (threshold crossing, replacements)
  const _markerLabel = (text, color) => ({
    show: true,
    formatter: text,
    position: "left",
    fontSize: 10,
    color,
    distance: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 3,
    padding: [3, 6],
  });

  let crossingMs = null;
  if (
    hasActivePrediction &&
    pred.slope_per_day != null && pred.slope_per_day < 0 &&
    pred.intercept != null && t0 != null && !isCharging
  ) {
    const crossingT = t0 + ((threshold - pred.intercept) / pred.slope_per_day) * 86400;
    if (crossingT * 1000 > Date.now()) {
      crossingMs = crossingT * 1000;
    }
  }

  // Ensure discharge line extends to both the crossing point and the empty date
  if (fitted.length > 0 && pred.slope_per_day != null && pred.intercept != null && t0 != null) {
    const fittedY = (t) => {
      const days = (t / 1000 - t0) / 86400;
      return pred.slope_per_day * days + pred.intercept;
    };
    const emptyMs = pred.estimated_empty_timestamp
      ? pred.estimated_empty_timestamp * 1000
      : null;
    const lastMs = fitted[fitted.length - 1][0];
    // Add crossing point if it's between existing points
    if (crossingMs && crossingMs > lastMs - 1 && crossingMs < (emptyMs || Infinity)) {
      fitted.push([crossingMs, Math.max(0, Math.min(100, fittedY(crossingMs)))]);
    }
    // Extend to predicted empty if not already there
    if (emptyMs && emptyMs > lastMs + 1) {
      fitted.push([emptyMs, Math.max(0, fittedY(emptyMs))]);
    }
  }

  // Threshold line spans from earliest data to at least the crossing point
  const thresholdMin = observed[0]?.[0] || tMin;
  const thresholdMax = Math.max(
    fitted.length ? fitted[fitted.length - 1][0] : tMax,
    crossingMs || 0,
    tMax,
  );
  series.push({
    name: "Threshold",
    type: "line",
    data: [
      [thresholdMin, threshold],
      [thresholdMax, threshold],
    ],
    symbol: "none",
    lineStyle: { width: 1, type: "dotted", color: colorThreshold },
    itemStyle: { color: colorThreshold },
  });

  // Threshold crossing vertical marker
  if (crossingMs) {
    const crossingDate = new Date(crossingMs);
    const hoursUntilCrossing = (crossingMs - Date.now()) / 3600000;
    const crossingLabel = hoursUntilCrossing <= 48
      ? crossingDate.toLocaleString(undefined, {
          day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
        })
      : crossingDate.toLocaleDateString(undefined, {
          day: "numeric", month: "short", year: "numeric",
        });
    series.push({
      name: "Low battery",
      type: "line",
      data: [
        { value: [crossingMs, 0], symbol: "none", symbolSize: 0 },
        {
          value: [crossingMs, threshold],
          symbol: "diamond",
          symbolSize: 6,
          label: _markerLabel(`Low ${crossingLabel}`, colorThreshold),
        },
      ],
      lineStyle: { width: 1, type: "dotted", color: colorThreshold },
      itemStyle: { color: colorThreshold },
      tooltip: { show: false },
    });
  }

  // Replacement history vertical markers
  const replacementHistory = chartData.replacement_history || [];
  if (replacementHistory.length > 0) {
    const colorReplacement = rc("--success-color", "#4caf50");
    for (let i = 0; i < replacementHistory.length; i++) {
      const ts = replacementHistory[i] * 1000;
      const dateLabel = new Date(ts).toLocaleDateString(undefined, {
        day: "numeric", month: "short",
      });
      series.push({
        name: i === 0 ? "Replaced" : `Replaced ${i + 1}`,
        type: "line",
        data: [
          { value: [ts, 0], symbol: "none", symbolSize: 0 },
          {
            value: [ts, 100],
            symbol: "diamond",
            symbolSize: 6,
            label: _markerLabel(`Replaced ${dateLabel}`, colorReplacement),
          },
        ],
        lineStyle: { width: 1, type: "dashed", color: colorReplacement },
        itemStyle: { color: colorReplacement },
        tooltip: { show: false },
      });
    }
  }

  // Suspected replacement markers (amber, dotted)
  const suspectedReplacements = chartData.suspected_replacements || [];
  if (suspectedReplacements.length > 0) {
    const colorSuspected = rc("--warning-color", "#ff9800");
    for (let i = 0; i < suspectedReplacements.length; i++) {
      const ts = suspectedReplacements[i].timestamp * 1000;
      const dateLabel = new Date(ts).toLocaleDateString(undefined, {
        day: "numeric", month: "short",
      });
      series.push({
        name: i === 0 ? "Suspected" : `Suspected ${i + 1}`,
        type: "line",
        data: [
          { value: [ts, 0], symbol: "none", symbolSize: 0 },
          {
            value: [ts, 100],
            symbol: "diamond",
            symbolSize: 6,
            label: _markerLabel(`Replaced? ${dateLabel}`, colorSuspected),
          },
        ],
        lineStyle: { width: 1, type: "dotted", color: colorSuspected },
        itemStyle: { color: colorSuspected },
        tooltip: { show: false },
      });
    }
  }

  const isNarrow = container.clientWidth < 500;

  const option = {
    xAxis: {
      type: "time",
      axisLabel: { color: colorAxis, fontSize: isNarrow ? 10 : 12 },
      axisLine: { lineStyle: { color: colorGrid } },
      splitLine: { lineStyle: { color: colorGrid } },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { formatter: "{value}%", color: colorAxis },
      axisLine: { lineStyle: { color: colorGrid } },
      splitLine: { lineStyle: { color: colorGrid } },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: colorTooltipBg,
      borderColor: colorGrid,
      textStyle: { color: colorTooltipText },
      formatter: (params) => {
        if (!params || params.length === 0) return "";
        const date = new Date(params[0].value[0]);
        const dateStr =
          date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }) +
          " " +
          date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
        let h = `<b>${dateStr}</b><br>`;
        for (const p of params) {
          if (p.seriesName?.startsWith("Replaced") || p.seriesName === "Low battery") continue;
          const val =
            typeof p.value[1] === "number" ? p.value[1].toFixed(1) + "%" : "\u2014";
          h += `${p.marker} ${p.seriesName}: ${val}<br>`;
        }
        return h;
      },
    },
    legend: {
      show: true,
      bottom: 0,
      data: series.filter((s) => !s.name?.startsWith("Replaced") && s.name !== "Low battery").map((s) => s.name).filter((v, i, a) => a.indexOf(v) === i),
      textStyle: { color: colorLegend, fontSize: isNarrow ? 10 : 11 },
      itemWidth: isNarrow ? 12 : 16,
      itemHeight: isNarrow ? 8 : 10,
      itemGap: isNarrow ? 6 : 8,
      padding: [4, 0, 0, 0],
      selected: {
        "Discharge prediction": !isCharging,
        "Charge prediction": isCharging,
      },
    },
    dataZoom: [
      {
        type: "slider",
        xAxisIndex: 0,
        filterMode: "none",
        startValue: tMin,
        endValue: tMax,
        bottom: isNarrow ? 30 : 24,
        height: isNarrow ? 18 : 22,
        borderColor: colorGrid,
        fillerColor: "rgba(100,150,200,0.15)",
        handleStyle: { color: colorLevel },
        dataBackground: {
          lineStyle: { color: colorLevel, opacity: 0.3 },
          areaStyle: { color: colorLevel, opacity: 0.05 },
        },
        textStyle: { color: colorAxis, fontSize: 10 },
      },
      {
        type: "inside",
        xAxisIndex: 0,
        filterMode: "none",
      },
    ],
    grid: {
      left: isNarrow ? 40 : 50,
      right: isNarrow ? 10 : 20,
      top: 20,
      bottom: isNarrow ? 82 : 72,
      containLabel: false,
    },
  };

  // Reuse existing chart element to preserve user zoom/pan state;
  // only create a new one on first render.
  let chart = panel._chartEl;
  if (!chart || !container.contains(chart)) {
    chart = document.createElement("ha-chart-base");
    container.innerHTML = "";
    container.appendChild(chart);
    panel._chartEl = chart;
  }
  chart.hass = panel._hass;

  requestAnimationFrame(() => {
    // ha-chart-base uses separate data (series) and options properties.
    // Do NOT include series in options — it would override data via replaceMerge.
    chart.data = series;
    chart.options = option;
  });
}
