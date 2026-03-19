import { html, nothing } from "lit";

/**
 * Pure helper functions — no dependency on panel instance state.
 * Functions that need settings (like threshold) receive them as parameters.
 */

export function formatLevel(level) {
  const d = displayLevel(level);
  return d !== null ? d + "%" : "\u2014";
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
  if (level === null) return "var(--disabled-text-color)";
  const t = threshold ?? defaultThreshold;
  if (level <= t / 2) return "var(--error-color, #db4437)";
  if (level <= t * 1.25) return "var(--warning-color, #ffa726)";
  return "var(--success-color, #43a047)";
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
  return dev.dischargeRate !== null ? dev.dischargeRate + "%/d" : "\u2014";
}

export function formatTimeRemaining(dev) {
  if (isFastDischarge(dev) && dev.hoursRemaining !== null) {
    if (dev.hoursRemaining < 1) return Math.round(dev.hoursRemaining * 60) + "m";
    return dev.hoursRemaining + "h";
  }
  return dev.daysRemaining !== null ? dev.daysRemaining + "d" : "\u2014";
}

export function formatDate(isoString, includeTime = false) {
  if (!isoString) return "\u2014";
  try {
    const d = new Date(isoString);
    if (includeTime) {
      const now = new Date();
      const sameYear = d.getFullYear() === now.getFullYear();
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
      year: "numeric",
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

  if (dev.stabilityCv !== null && dev.stabilityCv > 0.05) {
    parts.push(`High reading variance (CV: ${(dev.stabilityCv * 100).toFixed(1)}%)`);
  }

  if (parts.length === 0) {
    parts.push("Battery readings show non-monotonic or inconsistent behavior");
  }

  return parts.join(". ");
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
  const color = r >= 70 ? "var(--success-color, #43a047)" : r >= 40 ? "var(--warning-color, #ffa726)" : "var(--disabled-text-color, #999)";
  return html`<span
    style="display:inline-block;font-size:11px;font-weight:500;padding:1px 6px;border-radius:8px;background:color-mix(in srgb, ${color} 15%, transparent);color:${color}"
    title="Prediction reliability: ${r}%"
    >${r}%</span
  >`;
}

export function showToast(panel, message) {
  panel.dispatchEvent(
    new CustomEvent("hass-notification", {
      bubbles: true,
      composed: true,
      detail: { message },
    })
  );
}
