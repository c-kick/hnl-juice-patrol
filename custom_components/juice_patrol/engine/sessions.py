"""Discharge session extraction for rechargeable batteries.

Segments a sawtooth charge/discharge history into individual discharge
sessions for multi-session analysis. Includes completed-cycle detection
for model training. No Home Assistant dependencies.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class _State(Enum):
    DISCHARGING = "discharging"
    CHARGING = "charging"


def extract_discharge_sessions(
    readings: list[dict[str, float]],
    min_drop: float = 5.0,
    noise_tol: float = 3.0,
) -> list[list[dict[str, float]]]:
    """Extract individual discharge sessions from cyclic battery readings.

    Walks readings chronologically with a state machine. In DISCHARGING
    state, tracks a running minimum; transitions to CHARGING when the
    value rises more than noise_tol above the running min. In CHARGING
    state, tracks a running maximum; transitions to DISCHARGING when the
    value drops more than noise_tol below the running max.

    Args:
        readings: List of {"t": timestamp, "v": level} dicts, sorted by time.
        min_drop: Minimum total decline (%) for a session to be kept.
        noise_tol: Tolerance for noise before triggering a state transition.

    Returns:
        List of discharge sessions, each a list of reading dicts.
    """
    if len(readings) < 3:
        return []

    state = _State.DISCHARGING
    running_min = readings[0]["v"]
    running_max = readings[0]["v"]
    current_session: list[dict[str, float]] = [readings[0]]
    sessions: list[list[dict[str, float]]] = []

    for r in readings[1:]:
        v = r["v"]

        if state == _State.DISCHARGING:
            if v < running_min:
                running_min = v
            current_session.append(r)

            if v > running_min + noise_tol:
                # Transition to charging — close the discharge session
                sessions.append(current_session)
                current_session = [r]
                state = _State.CHARGING
                running_max = v

        else:  # CHARGING
            if v > running_max:
                running_max = v

            if v < running_max - noise_tol:
                # Transition to discharging — start a new discharge session
                current_session = [r]
                state = _State.DISCHARGING
                running_min = v
            else:
                current_session.append(r)

    # Close final session if it was a discharge
    if state == _State.DISCHARGING and current_session:
        sessions.append(current_session)

    # Filter: minimum 3 readings and minimum drop
    return [
        s for s in sessions
        if len(s) >= 3 and (s[0]["v"] - s[-1]["v"]) >= min_drop
    ]


@dataclass
class CompletedCycle:
    """A discharge session that ended in a known battery replacement."""

    start_t: float       # Unix timestamp of session start
    end_t: float         # Unix timestamp of session end
    start_pct: float     # Battery level at session start
    end_pct: float       # Battery level at session end
    duration_days: float # Total duration in days
    replacement_t: float # Matched replacement timestamp


def extract_completed_cycles(
    readings: list[dict[str, float]],
    replacement_timestamps: list[float],
    tolerance_hours: float = 48.0,
    min_drop: float = 5.0,
    noise_tol: float = 3.0,
) -> list[CompletedCycle]:
    """Identify discharge sessions that ended in a battery replacement.

    Cross-references discharge sessions (from the state machine) with known
    replacement timestamps. A session is "completed" if its end timestamp is
    within tolerance_hours of a known replacement timestamp.

    Each replacement timestamp is matched to at most one session (the closest
    session end within the tolerance window).

    Args:
        readings: Full reading history [{"t": ..., "v": ...}], sorted by time.
        replacement_timestamps: Known replacement timestamps (from store).
        tolerance_hours: Maximum gap (hours) between session end and
            replacement to count as a match.
        min_drop: Minimum % drop for a session to qualify (passed through
            to extract_discharge_sessions).
        noise_tol: Noise tolerance for session extraction.

    Returns:
        List of CompletedCycle, sorted chronologically by end_t.
    """
    if not replacement_timestamps or len(readings) < 3:
        return []

    sessions = extract_discharge_sessions(
        readings, min_drop=min_drop, noise_tol=noise_tol,
    )
    if not sessions:
        return []

    tolerance_s = tolerance_hours * 3600.0
    # Sort replacements for consistent matching
    sorted_replacements = sorted(replacement_timestamps)

    # Track which replacements have been consumed (each matches at most once)
    used_replacements: set[int] = set()
    cycles: list[CompletedCycle] = []

    for session in sessions:
        end_t = session[-1]["t"]

        # Find the closest unused replacement within tolerance
        best_idx: int | None = None
        best_gap = tolerance_s + 1.0

        for i, rep_t in enumerate(sorted_replacements):
            if i in used_replacements:
                continue
            gap = abs(rep_t - end_t)
            if gap <= tolerance_s and gap < best_gap:
                best_gap = gap
                best_idx = i

        if best_idx is not None:
            used_replacements.add(best_idx)
            start_t = session[0]["t"]
            duration_days = (end_t - start_t) / 86400.0
            if duration_days > 0:
                cycles.append(CompletedCycle(
                    start_t=start_t,
                    end_t=end_t,
                    start_pct=session[0]["v"],
                    end_pct=session[-1]["v"],
                    duration_days=duration_days,
                    replacement_t=sorted_replacements[best_idx],
                ))

    cycles.sort(key=lambda c: c.end_t)
    return cycles
