"""Juice Patrol prediction and analysis engine.

Pure-logic core with no Home Assistant dependencies.
"""

from .analysis import (
    AnalysisResult,
    DischargeAnomaly,
    Stability,
    analyze_battery,
    chemistry_from_battery_type,
    damage_score,
    detect_replacement_jumps,
    knee_risk_score,
    soh_from_cycles,
)
from .compress import compress, sdt_compress
from .curve_fit import CurveFitResult, extrapolate_to_threshold, fit_discharge_curve
from .predictions import (
    ChargePredictionResult,
    Confidence,
    PredictionResult,
    PredictionStatus,
    compute_reliability,
    extract_charging_segment,
    predict_charge,
    predict_discharge,
    predict_discharge_multisession,
)
from .models import ClassPrior, DeviceClassModels
from .primary import (
    PrimaryCycle,
    PrimaryPredictionResult,
    ShapePrior,
    isolate_primary_cycles,
    learn_discharge_shape,
    predict_primary,
)
from .smooth import cycle_relative_smooth, rolling_median
from .sessions import CompletedCycle, extract_completed_cycles, extract_discharge_sessions
from .utils import detect_step_size

__all__ = [
    "AnalysisResult",
    "ChargePredictionResult",
    "Confidence",
    "CurveFitResult",
    "DischargeAnomaly",
    "PredictionResult",
    "PredictionStatus",
    "Stability",
    "analyze_battery",
    "chemistry_from_battery_type",
    "ClassPrior",
    "CompletedCycle",
    "damage_score",
    "compress",
    "compute_reliability",
    "detect_replacement_jumps",
    "detect_step_size",
    "DeviceClassModels",
    "extract_charging_segment",
    "extract_completed_cycles",
    "extract_discharge_sessions",
    "extrapolate_to_threshold",
    "knee_risk_score",
    "fit_discharge_curve",
    "predict_charge",
    "predict_discharge",
    "predict_discharge_multisession",
    "cycle_relative_smooth",
    "isolate_primary_cycles",
    "learn_discharge_shape",
    "predict_primary",
    "PrimaryCycle",
    "PrimaryPredictionResult",
    "sdt_compress",
    "ShapePrior",
    "soh_from_cycles",
]
