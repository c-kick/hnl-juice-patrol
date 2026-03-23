import { html, nothing } from "lit";
import { CSS_ERROR, CSS_WARNING, CSS_SUCCESS, CSS_DISABLED } from "./colors.js";

/**
 * Pure helper functions — no dependency on panel instance state.
 * Functions that need settings (like threshold) receive them as parameters.
 */

export function formatLevel(level) {
  const d = displayLevel(level);
  return d !== null ? d + "%" : "\u2014";
}

export function formatDaysRemaining(dev) {
  const d = dev.daysRemaining;
  if (d == null) return "\u2014";
  if (d <= 1) return Math.round(d * 24) + "h";
  return (Math.round(d * 10) / 10).toString();
}

export function displayLevel(level) {
  if (level === null) return null;
  return Math.ceil(level);
}

export function wsErrorMessage(e, feature) {
  return e?.message?.includes("unknown command")
    ? `Restart Home Assistant to enable ${feature}`
    : `${feature} failed`;
}

export function getBatteryIcon(dev) {
  if (dev.isRechargeable) {
    if (dev.level === null) return "mdi:battery-unknown";
    if (dev.level <= 10) return "mdi:battery-charging-10";
    if (dev.level <= 30) return "mdi:battery-charging-30";
    if (dev.level <= 60) return "mdi:battery-charging-60";
    if (dev.level <= 90) return "mdi:battery-charging-90";
    return "mdi:battery-charging-100";
  }
  const level = dev.level;
  if (level === null) return "mdi:battery-unknown";
  if (level <= 5) return "mdi:battery-outline";
  if (level <= 15) return "mdi:battery-10";
  if (level <= 25) return "mdi:battery-20";
  if (level <= 35) return "mdi:battery-30";
  if (level <= 45) return "mdi:battery-40";
  if (level <= 55) return "mdi:battery-50";
  if (level <= 65) return "mdi:battery-60";
  if (level <= 75) return "mdi:battery-70";
  if (level <= 85) return "mdi:battery-80";
  if (level <= 95) return "mdi:battery-90";
  return "mdi:battery";
}

export function getLevelColor(level, threshold, defaultThreshold = 20) {
  if (level === null) return CSS_DISABLED;
  const t = threshold ?? defaultThreshold;
  if (level <= t / 2) return CSS_ERROR;
  if (level <= t * 1.25) return CSS_WARNING;
  return CSS_SUCCESS;
}

export function isActivelyCharging(dev) {
  return dev.isRechargeable && (dev.chargingState === "charging" || dev.predictionStatus === "charging");
}

export function isFastDischarge(dev) {
  return dev.dischargeRateHour !== null && dev.dischargeRateHour >= 1;
}

export function predictionReason(dev) {
  const s = dev.predictionStatus;
  if (!s || s === "normal") return null;
  const labels = {
    charging: "Charging",
    flat: "Flat",
    idle: "Idle",
    noisy: "Noisy data",
    insufficient_data: "Not enough data",
    single_level: "Single level",
    insufficient_range: "Tiny range",
  };
  return labels[s] || null;
}

export function predictionReasonDetail(status) {
  const details = {
    charging: "This battery is currently charging, so no discharge prediction is generated. Once it starts discharging again, a new prediction will be calculated.",
    flat: "The battery level has been essentially flat \u2014 no significant discharge detected. This is normal for devices with very slow drain. A prediction will appear once enough change is observed.",
    idle: "This rechargeable device is not currently discharging. A discharge prediction will appear once the battery level starts dropping.",
    noisy: "The battery data is too irregular to fit a reliable trend line. This can happen with sensors that report inconsistent values. The prediction will improve as more stable readings accumulate.",
    insufficient_data: "There are not enough data points or the observation period is too short to calculate a prediction. Juice Patrol needs at least 3 readings spanning 24 hours.",
    single_level: "All recorded readings have the same battery level. This typically means the sensor reports a fixed value or hasn't changed since discovery.",
    insufficient_range: "The battery level has barely changed \u2014 the total variation is within one reporting step. More drain needs to occur before a trend can be detected.",
  };
  return details[status] || null;
}

export function formatRate(dev) {
  if (isFastDischarge(dev)) {
    return dev.dischargeRateHour !== null ? dev.dischargeRateHour + "%/h" : "\u2014";
  }
  if (dev.dischargeRate === null || dev.dischargeRate === 0) return "\u2014";
  const r = dev.dischargeRate;
  if (r < 0.01) return r.toFixed(3) + "%/d";
  if (r < 1) return r.toFixed(2) + "%/d";
  return r.toFixed(1) + "%/d";
}

export function formatTimeRemaining(dev) {
  if (isFastDischarge(dev) && dev.hoursRemaining !== null) {
    if (dev.hoursRemaining < 1) return Math.round(dev.hoursRemaining * 60) + "m";
    return dev.hoursRemaining + "h";
  }
  if (dev.daysRemaining === null) return "\u2014";
  if (dev.daysRemaining > 3650) return "> 10y";
  return dev.daysRemaining + "d";
}

export function formatDate(isoString, includeTime = false) {
  if (!isoString) return "\u2014";
  try {
    const d = new Date(isoString);
    // Suppress dates more than 10 years in the future
    if (d.getTime() - Date.now() > 3650 * 86400 * 1000) return "\u2014";
    const now = new Date();
    const sameYear = d.getFullYear() === now.getFullYear();
    if (includeTime) {
      const dateOpts = sameYear
        ? { month: "short", day: "numeric" }
        : { month: "short", day: "numeric", year: "numeric" };
      return (
        d.toLocaleDateString(undefined, dateOpts) +
        " " +
        d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      );
    }
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: sameYear ? undefined : "numeric",
    });
  } catch {
    return "\u2014";
  }
}

export function parseBatteryType(str) {
  if (!str) return { count: 0, type: "" };
  const m = str.match(/^(\d+)\s*[×x]\s*(.+)$/i);
  if (m) return { count: parseInt(m[1]), type: m[2].trim() };
  return { count: 1, type: str.trim() };
}

export function formatBatteryType(type, count) {
  if (!type) return "";
  return count > 1 ? `${count}× ${type}` : type;
}

export function erraticTooltip(dev) {
  const parts = [];
  const display = displayLevel(dev.level);
  const mean = displayLevel(dev.meanLevel);

  if (mean !== null && display !== null && display > mean + 3 && !dev.isRechargeable) {
    parts.push(
      `Level is rising (${display}%) without a charge state — not expected for a non-rechargeable battery`
    );
  } else if (mean !== null && display !== null && Math.abs(display - mean) > 5) {
    parts.push(
      `Current level (${display}%) differs significantly from 7-day average (${mean}%)`
    );
  }

  if (dev.stabilityCv !== null && dev.stabilityCv > 0.05 && !dev.isRechargeable) {
    parts.push(`High reading variance (CV: ${(dev.stabilityCv * 100).toFixed(1)}%)`);
  }

  if (parts.length === 0) {
    parts.push("Battery readings show non-monotonic or inconsistent behavior");
  }

  return parts.join(". ");
}

export function confidenceTooltip(pred, chartData) {
  if (!pred) return "";
  const conf = pred.confidence;
  const r2 = pred.r_squared;
  const points = pred.data_points_used;
  const chemistry = chartData?.chemistry;

  if (conf === "history-based") {
    return "Estimated from previous charging cycles. The time-to-full estimate will become more accurate as more charging data is collected during this session.";
  }

  // Total history timespan from chart readings
  const readings = chartData?.readings;
  const totalSpanDays = readings?.length >= 2
    ? (readings[readings.length - 1].t - readings[0].t) / 86400
    : null;

  // Regression window from t0
  const regSpanDays = pred.t0 ? (Date.now() / 1000 - pred.t0) / 86400 : null;

  // Did regime-change detection narrow the window?
  const isNarrowed = totalSpanDays != null && regSpanDays != null
    && totalSpanDays > regSpanDays * 2;

  if (conf === "high") {
    const parts = ["Good trend fit (R\u00b2 > 0.8), 7+ days of data, 10+ readings"];
    if (isNarrowed) {
      parts.push(`Based on recent trend (${_fmtDays(regSpanDays)}) after a rate change was detected in ${_fmtDays(totalSpanDays)} of history`);
    }
    return parts.join(". ");
  }

  // Explain what's limiting confidence — replicate engine downgrade checks
  const factors = [];
  if (r2 != null && r2 <= 0.8) {
    factors.push(`trend fit is ${r2 <= 0.3 ? "weak" : "moderate"} (R\u00b2 ${r2.toFixed(2)})`);
  }
  if (regSpanDays != null && regSpanDays < 7 && !isNarrowed) {
    factors.push(`only ${_fmtDays(regSpanDays)} of data (need 7d+)`);
  }
  if (points != null && points < 10) {
    factors.push(`only ${points} readings (need 10+)`);
  }

  // Stuck-near-cliff: last readings clustered at a low level (Zigbee cliff signature)
  if (readings?.length >= 5) {
    const tail = readings.slice(-5).map(r => r.v);
    const lo = Math.min(...tail);
    const hi = Math.max(...tail);
    const med = tail.slice().sort((a, b) => a - b)[2];
    if (hi - lo <= 1.0 && med <= 30) {
      const daysRem = pred.estimated_days_remaining;
      if (daysRem != null && daysRem < 1.0) {
        // Battery is confirmed dead — stuck-near-cliff is expected, not a penalty
        factors.push(`battery flatlined at ${Math.round(med)}% \u2014 confirmed depleted`);
      } else {
        factors.push(`battery stuck at ${Math.round(med)}% \u2014 readings have flatlined near end-of-life`);
      }
    }
  }

  // Flat-curve chemistry cap: coin_cell/lithium_primary capped at medium
  const flatCurve = chemistry === "coin_cell" || chemistry === "lithium_primary";
  if (flatCurve && conf === "medium" && r2 != null && r2 > 0.75
    && regSpanDays != null && regSpanDays >= 7 && points != null && points >= 10) {
    factors.push(`flat-curve battery chemistry (${chemistry === "coin_cell" ? "coin cell" : "lithium primary"}) caps confidence at medium due to coarse SoC steps`);
  }

  const label = conf === "medium" ? "Medium" : conf === "low" ? "Low" : "Insufficient";
  const reason = factors.length ? `: ${factors.join(". ")}` : "";

  if (isNarrowed) {
    return `${label} confidence${reason}. A rate change was detected \u2014 prediction uses the recent ${_fmtDays(regSpanDays)} trend from ${_fmtDays(totalSpanDays)} of history.`;
  }

  if (conf === "insufficient_data") {
    return "Insufficient data: not enough readings or trend too weak to make a prediction";
  }

  if (factors.length) {
    return `${label} confidence: ${factors.join(". ")}.`;
  }

  return `${label} confidence`;
}

function _fmtDays(d) {
  if (d < 1) return `${Math.round(d * 24)}h`;
  if (d < 30) return `${d.toFixed(1)}d`;
  return `${Math.round(d / 30)}mo`;
}

export function getDeviceSubText(dev) {
  const parts = [];
  const nameLC = (dev.name || "").toLowerCase();
  if (dev.manufacturer && !nameLC.includes(dev.manufacturer.toLowerCase())) {
    parts.push(dev.manufacturer);
  }
  if (dev.model && !nameLC.includes(dev.model.toLowerCase())) {
    parts.push(dev.model);
  }
  let sub = parts.join(" ");
  if (sub && dev.platform) {
    sub += ` \u00b7 ${dev.platform}`;
  } else if (!sub && dev.platform) {
    sub = dev.platform;
  }
  return sub || null;
}

export function renderBadgeLabel(l) {
  return html`
    <span title=${l.description || ""} style="display:inline-flex;align-items:center;gap:2px;font-size:11px;font-weight:500;padding:1px 8px;border-radius:10px;white-space:nowrap;background:color-mix(in srgb, ${l.color} 20%, transparent);color:${l.color}">
      ${l.icon ? html`<ha-icon icon=${l.icon} style="--mdc-icon-size:14px"></ha-icon>` : nothing}
      ${l.name}
    </span>
  `;
}

export function renderReliabilityBadge(dev) {
  const r = dev.reliability;
  const hasTimePrediction = dev.daysRemaining !== null || dev.hoursRemaining !== null;
  if (r === null || r === undefined || !hasTimePrediction) return "\u2014";
  const color = r >= 70 ? CSS_SUCCESS : r >= 40 ? CSS_WARNING : CSS_DISABLED;
  return html`<span
    style="display:inline-block;font-size:11px;font-weight:500;padding:1px 6px;border-radius:8px;background:color-mix(in srgb, ${color} 15%, transparent);color:${color}"
    title="Prediction reliability: ${r}%"
    >${r}%</span
  >`;
}

export function showToast(panel, message, action) {
  const detail = { message };
  if (action) {
    detail.action = action;
    detail.duration = 8000;
  }
  panel.dispatchEvent(
    new CustomEvent("hass-notification", {
      bubbles: true,
      composed: true,
      detail,
    })
  );
}
