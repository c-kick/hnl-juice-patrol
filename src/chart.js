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

  const observed = allReadings
    .slice()
    .sort((a, b) => a.t - b.t)
    .filter((r, i, arr) => i === 0 || r.t > arr[i - 1].t)
    .map((r) => [r.t * 1000, r.v]);

  const chargePred = chartData.charge_prediction;
  const isCharging =
    chartData.charging_state?.toLowerCase() === "charging" ||
    chartData.prediction?.status === "charging";
  const hasChargePred = chargePred && chargePred.estimated_full_timestamp;

  // Only build a prediction line when the engine produced a real prediction.
  // Statuses like idle, flat, single_level, noisy, insufficient_data, etc.
  // should NOT show a prediction/fit line — even the historical portion.
  const noLineStatuses = new Set([
    "idle", "flat", "single_level", "insufficient_data", "insufficient_range",
    "noisy", "charging",
  ]);
  const showPredictionLine = !noLineStatuses.has(pred.status);

  let fitted = [];
  if (showPredictionLine && pred.prediction_curve && pred.prediction_curve.length >= 2) {
    // Use pre-computed curve points from the parametric model.
    // These follow the actual fitted shape (exponential, Weibull,
    // piecewise linear) instead of a single straight line.
    const shouldProject = !isCharging && pred.status === "normal";
    const nowMs = Date.now();
    // Don't project forward when the prediction is suppressed (>10yr)
    const curveHasTarget = pred.estimated_empty_timestamp &&
      (pred.estimated_empty_timestamp * 1000 - nowMs) < 3650 * 86400 * 1000;
    for (const [tMs, v] of pred.prediction_curve) {
      if ((!shouldProject || !curveHasTarget) && tMs > nowMs) break;
      fitted.push([tMs, Math.max(0, Math.min(100, v))]);
    }
  } else if (showPredictionLine && pred.slope_per_day != null && pred.intercept != null && t0 != null) {
    // Fallback: linear formula (Theil-Sen path, or no curve data)
    const fittedY = (t) => {
      const days = (t - t0) / 86400;
      return pred.slope_per_day * days + pred.intercept;
    };
    const startT = readings[0].t;
    const nowT = Date.now() / 1000;
    const shouldProject = !isCharging && pred.status === "normal";
    // Don't project forward when the prediction is suppressed (>10yr) or absent
    const hasReasonableTarget = pred.estimated_empty_timestamp &&
      (pred.estimated_empty_timestamp - nowT) < 3650 * 86400;
    const endT = shouldProject && hasReasonableTarget
      ? Math.min(pred.estimated_empty_timestamp, nowT + 365 * 86400)
      : nowT;
    for (const t of [startT, nowT, ...(shouldProject ? [endT] : [])]) {
      fitted.push([t * 1000, Math.max(0, Math.min(100, fittedY(t)))]);
    }
  }

  // ── Compute auto tMin/tMax (smart default) ──
  // Zoom to the current session (discharge or charge cycle), not the full history.
  const sessionStartMs = readings[0].t * 1000;
  const historyStartMs = observed[0]?.[0] || Date.now();
  const autoTMin = sessionStartMs < historyStartMs ? historyStartMs : sessionStartMs;
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

  // Detect charging periods for rechargeable devices.
  // A charging period is a trough-to-peak segment where the level rises by ≥10%.
  // We find local minima and maxima, then pair min→max as charging periods.
  const chargingAreas = [];
  if (chartData.is_rechargeable && allReadings.length >= 3) {
    // Find local extrema (simplified: track direction changes)
    const extrema = []; // {type: 'min'|'max', idx, t, v}
    let dir = 0; // 0=unknown, 1=rising, -1=falling
    for (let i = 1; i < allReadings.length; i++) {
      const diff = allReadings[i].v - allReadings[i - 1].v;
      if (diff > 1) {
        if (dir === -1) extrema.push({ type: "min", idx: i - 1, t: allReadings[i - 1].t, v: allReadings[i - 1].v });
        dir = 1;
      } else if (diff < -1) {
        if (dir === 1) extrema.push({ type: "max", idx: i - 1, t: allReadings[i - 1].t, v: allReadings[i - 1].v });
        dir = -1;
      }
    }
    // If currently charging and the last direction was rising, push a
    // virtual max at the last reading so the current charging zone renders.
    if (isCharging && dir === 1 && allReadings.length > 0) {
      const last = allReadings[allReadings.length - 1];
      extrema.push({ type: "max", idx: allReadings.length - 1, t: last.t, v: last.v });
    }
    // Pair consecutive min→max as charging periods (min rise of 10%)
    for (let i = 0; i < extrema.length - 1; i++) {
      if (extrema[i].type === "min" && extrema[i + 1].type === "max") {
        const rise = extrema[i + 1].v - extrema[i].v;
        if (rise >= 10) {
          chargingAreas.push([
            { xAxis: extrema[i].t * 1000 },
            { xAxis: extrema[i + 1].t * 1000 },
          ]);
        }
      }
    }
  }

  // Split observed data into normal (above threshold) and low (at/below threshold)
  // segments. Each segment shares boundary points for seamless rendering.
  const normalData = [];
  const lowData = [];
  for (let i = 0; i < observed.length; i++) {
    const [t, v] = observed[i];
    const isLow = v <= threshold;
    normalData.push(isLow ? [t, null] : [t, v]);
    lowData.push(isLow ? [t, v] : [t, null]);
    // Add boundary point at threshold crossing to connect the segments
    if (i > 0) {
      const [pt, pv] = observed[i - 1];
      const prevLow = pv <= threshold;
      if (prevLow !== isLow) {
        // Interpolate crossing point
        const ratio = (threshold - pv) / (v - pv);
        const crossT = pt + (t - pt) * ratio;
        // Insert crossing point in both series (before current point)
        normalData.splice(-1, 0, [crossT, threshold]);
        lowData.splice(-1, 0, [crossT, threshold]);
      }
    }
  }

  const showSymbol = observed.length <= 50;
  const series = [
    {
      name: "Battery Level",
      type: "line",
      data: normalData,
      smooth: false,
      symbol: showSymbol ? "circle" : "none",
      symbolSize: 4,
      connectNulls: false,
      lineStyle: { width: 2, color: colorLevel },
      itemStyle: { color: colorLevel },
      areaStyle: { color: colorLevel, opacity: 0.07 },
    },
    {
      name: "Battery Level",
      type: "line",
      data: lowData,
      smooth: false,
      symbol: showSymbol ? "circle" : "none",
      symbolSize: 4,
      connectNulls: false,
      lineStyle: { width: 2, color: colorThreshold },
      itemStyle: { color: colorThreshold },
      areaStyle: { color: colorThreshold, opacity: 0.1 },
    },
  ];

  // Charging period highlights rendered as filled area series (markArea doesn't
  // work through ha-chart-base). Each area is a 4-point polygon from 0% to 100%.
  if (chargingAreas.length > 0) {
    for (let i = 0; i < chargingAreas.length; i++) {
      const startMs = chargingAreas[i][0].xAxis;
      const endMs = chargingAreas[i][1].xAxis;
      series.push({
        name: i === 0 ? "Charging" : `Charging ${i + 1}`,
        type: "line",
        data: [[startMs, 100], [endMs, 100]],
        symbol: "none",
        lineStyle: { width: 0 },
        areaStyle: { color: "rgba(76, 175, 80, 0.18)", origin: 0 },
        silent: true,
        tooltip: { show: false },
      });
    }
  }

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

  // Shared label style for chart markers (threshold crossing, replacements, charge)
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

  // Charge prediction line (rechargeable devices currently charging)
  if (isCharging && chargePred && chargePred.segment_start_timestamp != null) {
    const segStartT = chargePred.segment_start_timestamp;
    const segStartV = chargePred.segment_start_level;
    const nowT = Date.now() / 1000;
    const currentLevel = chartData.level;
    const isHistoryBased = chargePred.status === "history-based";

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
      // For history-based: line from current level to projected full
      const chargeStartT = isHistoryBased ? nowT : segStartT;
      const chargePoints = isHistoryBased
        ? [[nowT * 1000, currentLevel], [endT * 1000, 100]]
        : [segStartT, nowT, endT].map(
            (t) => [t * 1000, Math.max(0, Math.min(100, fittedChargeY(t)))]
          );
      // Endpoint label for estimated full time
      const fullDate = new Date(endT * 1000);
      const fullLabel = fullDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
      const endPoint = chargePoints[chargePoints.length - 1];
      chargePoints[chargePoints.length - 1] = {
        value: endPoint,
        symbol: "diamond",
        symbolSize: 6,
        label: _markerLabel(
          `Est. full ${fullLabel}`,
          colorCharge,
        ),
      };
      series.push({
        name: "Charge prediction",
        type: "line",
        data: chargePoints,
        smooth: false,
        symbol: "none",
        lineStyle: { width: 2, type: isHistoryBased ? "dotted" : "dashed", color: colorCharge },
        itemStyle: { color: colorCharge },
      });
    }
  }

  // Compute threshold crossing point (used by threshold line, discharge line, and marker)
  // Only show crossing/empty markers when we have a real discharge prediction
  // (status "normal" means the engine produced an estimated_empty_timestamp).
  const hasActivePrediction = pred.status === "normal" && pred.estimated_empty_timestamp != null;

  // Find threshold crossing time from the curve or linear formula
  let crossingMs = null;
  if (hasActivePrediction && !isCharging) {
    if (pred.prediction_curve && pred.prediction_curve.length >= 2) {
      // Find crossing in the pre-computed curve points
      for (let i = 1; i < pred.prediction_curve.length; i++) {
        const [prevT, prevV] = pred.prediction_curve[i - 1];
        const [curT, curV] = pred.prediction_curve[i];
        if (prevV >= threshold && curV < threshold) {
          // Linear interpolation for sub-step accuracy
          const frac = (prevV - threshold) / (prevV - curV);
          crossingMs = prevT + frac * (curT - prevT);
          if (crossingMs <= Date.now()) crossingMs = null;
          break;
        }
      }
    } else if (
      pred.slope_per_day != null && pred.slope_per_day < 0 &&
      pred.intercept != null && t0 != null
    ) {
      const crossingT = t0 + ((threshold - pred.intercept) / pred.slope_per_day) * 86400;
      if (crossingT * 1000 > Date.now()) {
        crossingMs = crossingT * 1000;
      }
    }
  }

  // Ensure discharge line extends to the empty date (only for linear fallback;
  // prediction_curve already includes the full extrapolation)
  if (fitted.length > 0 && !pred.prediction_curve) {
    if (pred.slope_per_day != null && pred.intercept != null && t0 != null) {
      const fittedY = (t) => {
        const days = (t / 1000 - t0) / 86400;
        return pred.slope_per_day * days + pred.intercept;
      };
      const emptyMs = pred.estimated_empty_timestamp
        ? pred.estimated_empty_timestamp * 1000
        : null;
      const lastMs = fitted[fitted.length - 1][0];
      if (crossingMs && crossingMs > lastMs - 1 && crossingMs < (emptyMs || Infinity)) {
        fitted.push([crossingMs, Math.max(0, Math.min(100, fittedY(crossingMs)))]);
      }
      if (emptyMs && emptyMs > lastMs + 1) {
        fitted.push([emptyMs, Math.max(0, fittedY(emptyMs))]);
      }
    }
  }

  // Threshold is shown via visualMap (line turns red below threshold)
  // No separate threshold line series needed.

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

  // Replacement history + suspected replacement markers
  // Merge both into a single sorted array for unified crowding/stagger logic.
  const replacementHistory = chartData.replacement_history || [];
  const suspectedReplacements = chartData.suspected_replacements || [];
  const colorReplacement = rc("--success-color", "#4caf50");
  const colorSuspected = "#ab47bc";
  const allReplacements = [
    ...replacementHistory.map((t) => ({ ts: t * 1000, type: "confirmed" })),
    ...suspectedReplacements.map((s) => ({ ts: s.timestamp * 1000, type: "suspected" })),
  ].sort((a, b) => a.ts - b.ts);

  if (allReplacements.length > 0) {
    const xRange = (tMax || allReplacements[allReplacements.length - 1].ts) -
                   (tMin || allReplacements[0].ts);
    const crowdThreshold = xRange * 0.05;
    const staggerLevels = [100, 85, 70];
    let crowdRun = 0; // consecutive crowded markers

    for (let i = 0; i < allReplacements.length; i++) {
      const { ts, type } = allReplacements[i];
      const prevTs = i > 0 ? allReplacements[i - 1].ts : null;
      const isCrowded = prevTs != null && (ts - prevTs) < crowdThreshold;
      crowdRun = isCrowded ? crowdRun + 1 : 0;
      const labelY = staggerLevels[crowdRun % staggerLevels.length];

      const dateLabel = new Date(ts).toLocaleDateString(undefined, {
        day: "numeric", month: "short",
      });
      const isConfirmed = type === "confirmed";
      const color = isConfirmed ? colorReplacement : colorSuspected;
      const labelText = isConfirmed ? `Replaced ${dateLabel}` : `Replaced? ${dateLabel}`;
      const label = _markerLabel(labelText, color);
      label.position = "right";

      series.push({
        name: isConfirmed
          ? (i === 0 ? "Replaced" : `Replaced ${i + 1}`)
          : (i === 0 ? "Suspected" : `Suspected ${i + 1}`),
        type: "line",
        data: [
          { value: [ts, 0], symbol: "none", symbolSize: 0 },
          {
            value: [ts, labelY],
            symbol: "diamond",
            symbolSize: 6,
            label,
          },
        ],
        lineStyle: { width: 1, type: isConfirmed ? "dashed" : "dotted", color },
        itemStyle: { color },
        tooltip: { show: false },
      });
    }
  }

  const isNarrow = panel.narrow || container.clientWidth < 500;

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
        const seen = new Set();
        for (const p of params) {
          if (p.seriesName?.startsWith("Replaced") || p.seriesName === "Low battery") continue;
          if (p.value[1] == null) continue;
          if (seen.has(p.seriesName)) continue;
          seen.add(p.seriesName);
          const val =
            typeof p.value[1] === "number" ? p.value[1].toFixed(1) + "%" : "\u2014";
          h += `${p.marker} ${p.seriesName}: ${val}<br>`;
        }
        return h;
      },
    },
    legend: {
      bottom: 0,
      left: "center",
      data: ["Battery Level", "Discharge prediction"],
      textStyle: { color: colorLegend, fontSize: isNarrow ? 10 : 12 },
      itemGap: isNarrow ? 6 : 12,
      selected: {
        "Discharge prediction": !isCharging,
        "Charge prediction": isCharging,
      },
    },
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: 0,
        filterMode: "none",
        startValue: tMin,
        endValue: tMax,
      },
    ],
    grid: {
      left: isNarrow ? 4 : 12,
      right: isNarrow ? 4 : 12,
      top: 8,
      bottom: isNarrow ? 32 : 28,
      containLabel: true,
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
  // Override ha-chart-base's default height (clientWidth/2) which is too short
  // for discharge curves. Use a string value to set CSS height directly.
  chart.height = isNarrow ? "300px" : "400px";

  requestAnimationFrame(() => {
    // ha-chart-base uses separate data (series) and options properties.
    // Do NOT include series in options — it would override data via replaceMerge.
    chart.data = series;
    chart.options = option;
  });
}
