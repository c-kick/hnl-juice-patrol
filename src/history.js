/**
 * Battery history fetching.
 *
 * Decoupled from any view — call from detail, dashboard, or wherever needed.
 *
 * Uses recorder/statistics_during_period (hourly mean aggregates).
 * Response format verified: { start: ms, end: ms, mean: float }
 * start_time is required by the API — use epoch to get all available history.
 */

const EPOCH = "1970-01-01T00:00:00Z";

/**
 * Fetch all available battery level history for a source entity.
 *
 * Primary: recorder/statistics_during_period (hourly mean aggregates).
 *   Response format verified: { start: ms, end: ms, mean: float }
 *   Requires state_class on the entity — not all sensors have it.
 *
 * Fallback: history/history_during_period (raw significant state changes).
 *   Response format verified: { s: string, lu: float (seconds) }
 *   Used for entities without long-term statistics (e.g. iOS companion app).
 *
 * @param {Object} hass - The hass object.
 * @param {string} sourceEntityId - The original battery sensor entity ID.
 * @returns {Promise<Array<{x: number, y: number}>>} Points sorted oldest-first.
 *   x = timestamp in ms, y = battery level (0–100).
 */
export async function fetchDeviceHistory(hass, sourceEntityId) {
  // Primary: long-term statistics (hourly aggregates, fast and clean)
  const statsResult = await hass.callWS({
    type: "recorder/statistics_during_period",
    start_time: EPOCH,
    statistic_ids: [sourceEntityId],
    period: "hour",
    types: ["mean"],
  });

  const stats = statsResult?.[sourceEntityId];
  if (Array.isArray(stats) && stats.length > 0) {
    return stats
      .filter((s) => s.mean != null)
      .map((s) => ({ x: s.start, y: s.mean }));
  }

  // Fallback: raw state history for entities without long-term statistics
  const histResult = await hass.callWS({
    type: "history/history_during_period",
    start_time: EPOCH,
    entity_ids: [sourceEntityId],
    significant_changes_only: true,
    no_attributes: true,
    minimal_response: true,
  });

  const states = histResult?.[sourceEntityId];
  if (!Array.isArray(states) || states.length === 0) return [];

  return states
    .filter((s) => s.s !== "unavailable" && s.s !== "unknown" && s.s != null)
    .map((s) => {
      const y = parseFloat(s.s);
      return isNaN(y) ? null : { x: Math.round(s.lu * 1000), y };
    })
    .filter(Boolean);
}
