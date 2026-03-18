"""Discharge session extraction for rechargeable batteries.

Segments a sawtooth charge/discharge history into individual discharge
sessions for multi-session analysis. No Home Assistant dependencies.
"""

from __future__ import annotations

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
