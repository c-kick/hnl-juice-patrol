"""Juice Patrol prediction and analysis engine.

Pure-logic core with no Home Assistant dependencies.
"""

from .analysis import (
    AnalysisResult,
    DischargeAnomaly,
    Stability,
    analyze_battery,
)
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
from .sessions import extract_discharge_sessions
from .utils import detect_step_size

__all__ = [
    "AnalysisResult",
    "ChargePredictionResult",
    "Confidence",
    "DischargeAnomaly",
    "PredictionResult",
    "PredictionStatus",
    "Stability",
    "analyze_battery",
    "compute_reliability",
    "detect_step_size",
    "extract_charging_segment",
    "extract_discharge_sessions",
    "predict_charge",
    "predict_discharge",
    "predict_discharge_multisession",
]
