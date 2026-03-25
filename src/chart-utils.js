/**
 * Resolve a CSS custom property to a concrete color value.
 * Falls back to the provided default if the variable is unset or empty.
 */
export function resolveColor(element, varName, fallback) {
  const v = getComputedStyle(element).getPropertyValue(varName).trim();
  return v || fallback;
}
