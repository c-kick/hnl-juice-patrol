/**
 * Centralized color definitions for the Juice Patrol panel.
 *
 * All colors reference HA CSS custom properties with hex fallbacks so the
 * panel renders correctly on any custom theme.
 */

// ── HA theme CSS vars with fallbacks ──

export const COLOR_PRIMARY = { var: "--primary-color", fallback: "#03a9f4" };
export const COLOR_RECHARGEABLE = { var: "--info-color", fallback: "#039be5", opacity: 0.80, opacityRange: [0.25, 0.80] };
export const COLOR_SUCCESS = { var: "--success-color", fallback: "#43a047", opacity: 0.80 };
export const COLOR_WARNING = { var: "--warning-color", fallback: "#ffa726", opacity: 0.80 };
export const COLOR_ERROR = { var: "--error-color", fallback: "#db4437", opacity: 0.80 };
export const COLOR_DISABLED = { var: "--disabled-text-color", fallback: "#999" };
export const COLOR_SECONDARY_TEXT = { var: "--secondary-text-color", fallback: "#999" };
export const COLOR_PRIMARY_TEXT = { var: "--primary-text-color", fallback: "#212121" };
export const COLOR_CARD_BG = { var: "--ha-card-background", fallback: "#fff" };
export const COLOR_CARD_BG_DARK = { var: "--card-background-color", fallback: "#1e1e1e" };
export const COLOR_DIVIDER = { var: "--divider-color", fallback: "rgba(0,0,0,0.12)" };

// ── Semantic colors (inline CSS var expressions) ──

export const CSS_PRIMARY = `var(${COLOR_PRIMARY.var}, ${COLOR_PRIMARY.fallback})`;
export const CSS_RECHARGEABLE = `var(${COLOR_RECHARGEABLE.var}, ${COLOR_RECHARGEABLE.fallback})`;
export const CSS_SUCCESS = `var(${COLOR_SUCCESS.var}, ${COLOR_SUCCESS.fallback})`;
export const CSS_WARNING = `var(${COLOR_WARNING.var}, ${COLOR_WARNING.fallback})`;
export const CSS_ERROR = `var(${COLOR_ERROR.var}, ${COLOR_ERROR.fallback})`;
export const CSS_DISABLED = `var(${COLOR_DISABLED.var}, ${COLOR_DISABLED.fallback})`;
export const CSS_SECONDARY_TEXT = `var(${COLOR_SECONDARY_TEXT.var}, ${COLOR_SECONDARY_TEXT.fallback})`;
export const CSS_PRIMARY_TEXT = `var(${COLOR_PRIMARY_TEXT.var}, ${COLOR_PRIMARY_TEXT.fallback})`;

// ── Badge / label colors (hardcoded — not theme-dependent) ──

export const BADGE_REPLACED = "#FF9800";
export const BADGE_LOW = "#F44336";
export const BADGE_STALE = "#FF9800";
export const BADGE_CHARGING = "#4CAF50";
export const BADGE_AVG_LEVEL = "#2196F3";
