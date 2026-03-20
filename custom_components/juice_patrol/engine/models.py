"""Per-device-class model aggregation and caching.

Collects fitted parameters from completed discharge cycles to build
class-level priors for prediction. No Home Assistant dependencies.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .utils import median as _median


# Maximum completed cycles stored per device (oldest evicted)
MAX_CYCLES_PER_DEVICE = 10


@dataclass
class ClassPrior:
    """Aggregated model parameters for a device class.

    Derived from completed cycles across devices sharing the same
    battery_type (e.g. all CR2032 devices).
    """

    model_name: str                    # most common model type
    median_params: dict[str, float]    # median of each parameter
    iqr_params: dict[str, float]       # IQR of each parameter
    median_duration_days: float        # median total cycle duration
    iqr_duration_days: float           # IQR of cycle durations
    cycle_count: int                   # number of contributing cycles


def _iqr(values: list[float]) -> float:
    """Compute interquartile range."""
    if len(values) < 4:
        if len(values) < 2:
            return 0.0
        return max(values) - min(values)
    s = sorted(values)
    n = len(s)
    q1 = s[n // 4]
    q3 = s[3 * n // 4]
    return q3 - q1


@dataclass
class _ClassData:
    """Internal accumulator for a device class."""

    cycles: list[dict] = field(default_factory=list)


class DeviceClassModels:
    """In-memory cache of per-class model aggregates.

    Populated during coordinator startup from stored completed cycles.
    Updated when new cycles are detected.
    """

    def __init__(self) -> None:
        """Initialize empty cache."""
        # Keyed by battery_type (str) or entity_id as fallback
        self._classes: dict[str, _ClassData] = {}
        # Map entity_id → class key for fast lookup
        self._entity_class: dict[str, str] = {}

    def _class_key(self, battery_type: str | None, entity_id: str) -> str:
        """Determine the class key for an entity."""
        if battery_type:
            return f"type:{battery_type}"
        return f"entity:{entity_id}"

    def register_entity(
        self, entity_id: str, battery_type: str | None,
    ) -> None:
        """Register an entity's class mapping."""
        key = self._class_key(battery_type, entity_id)
        self._entity_class[entity_id] = key
        if key not in self._classes:
            self._classes[key] = _ClassData()

    def load_cycles(
        self,
        entity_id: str,
        battery_type: str | None,
        cycles: list[dict],
    ) -> None:
        """Load stored completed cycles for an entity (called at startup).

        Args:
            entity_id: The entity these cycles belong to.
            battery_type: Battery type for class grouping.
            cycles: List of cycle dicts from store (each has model, params,
                    duration_days, etc.).
        """
        key = self._class_key(battery_type, entity_id)
        self._entity_class[entity_id] = key
        if key not in self._classes:
            self._classes[key] = _ClassData()
        self._classes[key].cycles.extend(cycles)

    def update_from_cycle(
        self,
        entity_id: str,
        battery_type: str | None,
        model_name: str,
        params: dict[str, float],
        duration_days: float,
    ) -> dict:
        """Add a new completed cycle's fit to the class model.

        Args:
            entity_id: Entity that completed the cycle.
            battery_type: Battery type for class grouping.
            model_name: Fitted model name (e.g. "exponential").
            params: Fitted model parameters.
            duration_days: Total cycle duration in days.

        Returns:
            The cycle dict that was stored (for persistence in the store).
        """
        key = self._class_key(battery_type, entity_id)
        self._entity_class[entity_id] = key
        if key not in self._classes:
            self._classes[key] = _ClassData()

        cycle = {
            "model": model_name,
            "params": {k: round(v, 6) for k, v in params.items()},
            "duration_days": round(duration_days, 2),
        }
        self._classes[key].cycles.append(cycle)
        return cycle

    def get_class_prior(
        self, battery_type: str | None, entity_id: str,
    ) -> ClassPrior | None:
        """Return aggregated prior for the device class, or None.

        Requires at least 1 completed cycle in the class to return a prior.
        """
        key = self._class_key(battery_type, entity_id)
        data = self._classes.get(key)
        if not data or not data.cycles:
            return None

        cycles = data.cycles

        # Collect durations
        durations = [c["duration_days"] for c in cycles if "duration_days" in c]
        if not durations:
            return None

        # Find the most common model type
        model_counts: dict[str, int] = {}
        for c in cycles:
            m = c.get("model", "unknown")
            model_counts[m] = model_counts.get(m, 0) + 1
        best_model = max(model_counts, key=model_counts.get)  # type: ignore[arg-type]

        # Aggregate parameters from cycles using the dominant model
        matching = [c for c in cycles if c.get("model") == best_model]
        if not matching:
            matching = cycles

        # Collect all parameter names
        all_param_keys: set[str] = set()
        for c in matching:
            all_param_keys.update(c.get("params", {}).keys())

        median_params: dict[str, float] = {}
        iqr_params: dict[str, float] = {}
        for pk in all_param_keys:
            vals = [
                c["params"][pk] for c in matching
                if pk in c.get("params", {})
            ]
            if vals:
                median_params[pk] = _median(vals)
                iqr_params[pk] = _iqr(vals)

        return ClassPrior(
            model_name=best_model,
            median_params=median_params,
            iqr_params=iqr_params,
            median_duration_days=_median(durations),
            iqr_duration_days=_iqr(durations),
            cycle_count=len(cycles),
        )

    def get_class_key_for_entity(self, entity_id: str) -> str | None:
        """Return the class key for an entity, or None if unregistered."""
        return self._entity_class.get(entity_id)

    @property
    def class_count(self) -> int:
        """Number of registered device classes."""
        return len(self._classes)

    @property
    def total_cycles(self) -> int:
        """Total number of cycles across all classes."""
        return sum(len(d.cycles) for d in self._classes.values())
