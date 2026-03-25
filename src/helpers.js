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
  return dev.isRechargeable && dev.chargingState === "charging";
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

export function formatDate(isoString, includeTime = false) {
  if (!isoString) return "\u2014";
  try {
    const d = new Date(isoString);
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
