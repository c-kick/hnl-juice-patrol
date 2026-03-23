/**
 * Centralized color definitions for the Juice Patrol panel.
 *
 * All colors reference HA CSS custom properties with hex fallbacks so the
 * panel renders correctly on any custom theme.
 */

// ── HA theme CSS vars with fallbacks ──
// Used by resolveColor() for ECharts canvas (which can't read CSS vars)
// and by inline style="" strings in templates.

export const COLOR_PRIMARY = { var: "--primary-color", fallback: "#03a9f4" };
export const COLOR_RECHARGEABLE = { var: "--info-color", fallback: "#039be5" };
export const COLOR_SUCCESS = { var: "--success-color", fallback: "#43a047" };
export const COLOR_WARNING = { var: "--warning-color", fallback: "#ffa726" };
export const COLOR_ERROR = { var: "--error-color", fallback: "#db4437" };
export const COLOR_DISABLED = { var: "--disabled-text-color", fallback: "#999" };
export const COLOR_SECONDARY_TEXT = { var: "--secondary-text-color", fallback: "#999" };
export const COLOR_PRIMARY_TEXT = { var: "--primary-text-color", fallback: "#212121" };
export const COLOR_CARD_BG = { var: "--ha-card-background", fallback: "#fff" };
export const COLOR_CARD_BG_DARK = { var: "--card-background-color", fallback: "#1e1e1e" };
export const COLOR_DIVIDER = { var: "--divider-color", fallback: "rgba(0,0,0,0.12)" };

// ── Semantic colors (inline CSS var expressions) ──
// For use directly in template style="" strings.

export const CSS_PRIMARY = `var(${COLOR_PRIMARY.var}, ${COLOR_PRIMARY.fallback})`;
export const CSS_RECHARGEABLE = `var(${COLOR_RECHARGEABLE.var}, ${COLOR_RECHARGEABLE.fallback})`;
export const CSS_SUCCESS = `var(${COLOR_SUCCESS.var}, ${COLOR_SUCCESS.fallback})`;
export const CSS_WARNING = `var(${COLOR_WARNING.var}, ${COLOR_WARNING.fallback})`;
export const CSS_ERROR = `var(${COLOR_ERROR.var}, ${COLOR_ERROR.fallback})`;
export const CSS_DISABLED = `var(${COLOR_DISABLED.var}, ${COLOR_DISABLED.fallback})`;
export const CSS_SECONDARY_TEXT = `var(${COLOR_SECONDARY_TEXT.var}, ${COLOR_SECONDARY_TEXT.fallback})`;
export const CSS_PRIMARY_TEXT = `var(${COLOR_PRIMARY_TEXT.var}, ${COLOR_PRIMARY_TEXT.fallback})`;

// ── Badge / label colors (hardcoded — not theme-dependent) ──
// Used inside ha-data-table shadow DOM where CSS vars from our component
// don't apply, and for ECharts where canvas can't resolve CSS vars.

export const BADGE_REPLACED = "#FF9800";
export const BADGE_LOW = "#F44336";
export const BADGE_STALE = "#FF9800";
export const BADGE_CLIFF = "#F44336";
export const BADGE_RAPID = "#F44336";
export const BADGE_ERRATIC = "#9C27B0";
export const BADGE_NO_PREDICTION = "#9E9E9E";
export const BADGE_CHARGING = "#4CAF50";
export const BADGE_AVG_LEVEL = "#2196F3";

// ── Chart-specific colors ──

export const CHART_SUSPECTED_REPLACEMENT = "#ab47bc";
