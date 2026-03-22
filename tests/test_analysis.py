"""Tests for Juice Patrol battery analysis."""

import time

from custom_components.juice_patrol.engine.analysis import (
    AnalysisResult,
    DischargeAnomaly,
    Stability,
    _filter_outlier_cycles,
    analyze_battery,
    chemistry_from_battery_type,
    damage_score,
    detect_replacement_jumps,
    duration_fade,
    knee_risk_score,
    soh_from_cycles,
)
from custom_components.juice_patrol.engine.sessions import CompletedCycle


def _readings(levels: list[float], span_hours: float = 168.0) -> list[dict[str, float]]:
    """Generate readings from level list over the given span."""
    now = time.time()
    count = len(levels)
    if count <= 1:
        return [{"t": now, "v": levels[0]}] if levels else []
    interval = (span_hours * 3600) / (count - 1)
    return [{"t": now - (count - 1 - i) * interval, "v": v} for i, v in enumerate(levels)]


class TestStability:
    """Test stability analysis."""

    def test_insufficient_data(self):
        result = analyze_battery(_readings([90, 88, 85]))
        assert result.stability == Stability.INSUFFICIENT_DATA

    def test_stable_discharge(self):
        """Gradual monotonic discharge is stable."""
        levels = [100, 98, 96, 94, 92, 90, 88, 86, 84, 82]
        result = analyze_battery(_readings(levels))
        assert result.stability == Stability.STABLE

    def test_stable_narrow_range(self):
        """Small range readings (< 10%) are stable even if noisy."""
        levels = [95, 96, 94, 95, 93, 94, 95, 93, 94, 93]
        result = analyze_battery(_readings(levels))
        assert result.stability == Stability.STABLE

    def test_erratic_cliff_and_recovery(self):
        """Large cliff drop + recovery is erratic."""
        levels = [90, 88, 86, 5, 3, 85, 83, 81, 4, 80]
        result = analyze_battery(_readings(levels))
        assert result.stability in (Stability.ERRATIC, Stability.MODERATE)

    def test_upward_trend_nonrechargeable(self):
        """Non-rechargeable device with consistently rising levels is erratic."""
        levels = [80, 82, 84, 86, 88, 90, 92, 94, 96, 98]
        result = analyze_battery(
            _readings(levels),
            is_rechargeable_override=False,
        )
        assert result.stability == Stability.ERRATIC


class TestDischargeAnomaly:
    """Test discharge anomaly detection."""

    def test_normal(self):
        levels = [100, 98, 96, 94, 92, 90]
        result = analyze_battery(_readings(levels))
        assert result.discharge_anomaly == DischargeAnomaly.NORMAL

    def test_cliff_drop(self):
        """Drop >30% in one interval is a cliff."""
        levels = [90, 88, 86, 84, 82, 40]
        result = analyze_battery(_readings(levels))
        assert result.discharge_anomaly == DischargeAnomaly.CLIFF
        assert result.drop_size is not None
        assert result.drop_size > 30

    def test_normal_small_drop(self):
        """A moderate drop is not an anomaly."""
        levels = [90, 88, 86, 84, 82, 75]
        result = analyze_battery(_readings(levels))
        assert result.discharge_anomaly == DischargeAnomaly.NORMAL

    def test_gradual_cliff_multi_reading(self):
        """80 -> 55 -> 20 over 24h -> CLIFF detected (cumulative > 40)."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 90},
            {"t": now - 43200, "v": 80},
            {"t": now - 21600, "v": 55},
            {"t": now, "v": 20},
        ]
        result = analyze_battery(readings)
        assert result.discharge_anomaly == DischargeAnomaly.CLIFF

    def test_normal_drain_not_cliff(self):
        """80 -> 78 -> 76 over 24h -> NORMAL."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 90},
            {"t": now - 43200, "v": 80},
            {"t": now - 21600, "v": 78},
            {"t": now, "v": 76},
        ]
        result = analyze_battery(readings)
        assert result.discharge_anomaly == DischargeAnomaly.NORMAL

    def test_single_interval_cliff_still_works(self):
        """Single large drop > 30% still detected."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 90},
            {"t": now - 43200, "v": 88},
            {"t": now, "v": 30},
        ]
        result = analyze_battery(readings)
        assert result.discharge_anomaly == DischargeAnomaly.CLIFF

    def test_slow_multi_drop_not_cliff(self):
        """80 -> 55 -> 20 over 7 days -> NORMAL (too slow for cliff)."""
        now = time.time()
        readings = [
            {"t": now - 86400 * 14, "v": 90},
            {"t": now - 86400 * 7, "v": 80},
            {"t": now - 86400 * 4, "v": 55},
            {"t": now, "v": 20},
        ]
        result = analyze_battery(readings)
        assert result.discharge_anomaly == DischargeAnomaly.NORMAL


class TestRechargeableDetection:
    """Test rechargeable battery detection."""

    def test_manual_override_true(self):
        result = analyze_battery(
            _readings([90, 88, 86, 84, 82]),
            is_rechargeable_override=True,
        )
        assert result.is_rechargeable is True
        assert result.rechargeable_reason == "manual"

    def test_manual_override_false(self):
        result = analyze_battery(
            _readings([90, 88, 86, 84, 82]),
            is_rechargeable_override=False,
        )
        assert result.is_rechargeable is False

    def test_battery_type_not_rechargeable(self):
        """Battery type alone no longer triggers rechargeable — only manual
        override and battery_state do."""
        for btype in ("Li-ion", "NiMH", "CR2032"):
            result = analyze_battery(
                _readings([90, 88, 86, 84, 82]),
                battery_type=btype,
            )
            assert result.is_rechargeable is False

    def test_battery_state_charging(self):
        result = analyze_battery(
            _readings([90, 88, 86, 84, 82]),
            battery_state="Charging",
        )
        assert result.is_rechargeable is False

    def test_battery_state_not_charging(self):
        result = analyze_battery(
            _readings([90, 88, 86, 84, 82]),
            battery_state="Not Charging",
        )
        assert result.is_rechargeable is False

    def test_gradual_increases_not_rechargeable(self):
        """Gradual increases alone no longer trigger rechargeable —
        removed behavioral heuristic to prevent false positives from
        staircase sensors bouncing between discrete levels."""
        now = time.time()
        readings = []
        for i in range(15):
            readings.append({"t": now - (14 - i) * 7200, "v": 50 + i * 2})
        result = analyze_battery(readings)
        assert result.is_rechargeable is False

    def test_no_rechargeable_indicators(self):
        result = analyze_battery(
            _readings([90, 88, 86, 84, 82]),
            battery_type="AAA",
        )
        assert result.is_rechargeable is False
        assert result.rechargeable_reason is None


class TestReplacementDetection:
    """Test battery replacement detection in analysis."""

    def test_replacement_detected(self):
        """Large jump from low to high on non-rechargeable = replacement."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 15},
            {"t": now, "v": 100},
        ]
        result = analyze_battery(readings, low_threshold=20.0)
        assert result.replacement_detected is True
        assert result.replacement_old_level == 15
        assert result.replacement_new_level == 100

    def test_no_replacement_on_rechargeable(self):
        """Rechargeable devices don't trigger replacement."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 15},
            {"t": now, "v": 100},
        ]
        result = analyze_battery(
            readings,
            is_rechargeable_override=True,
            low_threshold=20.0,
        )
        assert result.replacement_detected is False

    def test_no_replacement_small_jump(self):
        """Small jump is not a replacement."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 50},
            {"t": now, "v": 70},
        ]
        result = analyze_battery(readings, low_threshold=20.0)
        assert result.replacement_detected is False

    def test_no_replacement_already_confirmed(self):
        """Jump after last_replaced timestamp is not flagged."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 15},
            {"t": now - 3600, "v": 100},
        ]
        result = analyze_battery(
            readings,
            last_replaced=now,  # Replaced after the readings
            low_threshold=20.0,
        )
        assert result.replacement_detected is False


class TestDetectReplacementJumps:
    """Test historical replacement jump detection."""

    def test_single_replacement(self):
        """Detect a clear replacement jump in history."""
        now = time.time()
        readings = [
            {"t": now - 86400 * 10, "v": 100},
            {"t": now - 86400 * 8, "v": 80},
            {"t": now - 86400 * 6, "v": 50},
            {"t": now - 86400 * 4, "v": 20},
            {"t": now - 86400 * 3, "v": 100},  # Replacement
            {"t": now - 86400 * 2, "v": 95},
            {"t": now, "v": 90},
        ]
        result = detect_replacement_jumps(readings, low_threshold=20.0)
        assert len(result) == 1
        assert result[0]["old_level"] == 20
        assert result[0]["new_level"] == 100

    def test_multiple_replacements(self):
        """Detect multiple replacements in longer history."""
        now = time.time()
        readings = [
            {"t": now - 86400 * 20, "v": 100},
            {"t": now - 86400 * 15, "v": 30},
            {"t": now - 86400 * 14, "v": 100},  # First replacement
            {"t": now - 86400 * 10, "v": 35},
            {"t": now - 86400 * 9, "v": 100},   # Second replacement
            {"t": now, "v": 90},
        ]
        result = detect_replacement_jumps(readings, low_threshold=20.0)
        assert len(result) == 2

    def test_excludes_known_replacements(self):
        """Already-confirmed replacements are excluded."""
        now = time.time()
        jump_ts = now - 86400 * 3
        readings = [
            {"t": now - 86400 * 4, "v": 20},
            {"t": jump_ts, "v": 100},
            {"t": now, "v": 90},
        ]
        result = detect_replacement_jumps(
            readings, low_threshold=20.0,
            known_replacements=[jump_ts],
        )
        assert len(result) == 0

    def test_excludes_denied_replacements(self):
        """User-denied replacements are excluded."""
        now = time.time()
        jump_ts = now - 86400 * 3
        readings = [
            {"t": now - 86400 * 4, "v": 20},
            {"t": jump_ts, "v": 100},
            {"t": now, "v": 90},
        ]
        result = detect_replacement_jumps(
            readings, low_threshold=20.0,
            denied_replacements=[jump_ts],
        )
        assert len(result) == 0

    def test_moderate_to_high_is_suspicious(self):
        """Jump from moderate level to high is suspicious on non-rechargeable."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 60},
            {"t": now, "v": 100},
        ]
        result = detect_replacement_jumps(readings, low_threshold=20.0)
        assert len(result) == 1  # 60→100 (+40) is suspicious

    def test_no_jump_when_small(self):
        """Small upward movement is not a replacement."""
        now = time.time()
        readings = [
            {"t": now - 86400, "v": 50},
            {"t": now, "v": 65},
        ]
        result = detect_replacement_jumps(readings, low_threshold=20.0)
        assert len(result) == 0

    def test_multi_step_ramp(self):
        """Detect replacement that calibrates over multiple readings (e.g., 54→70→100)."""
        now = time.time()
        readings = [
            {"t": now - 86400 * 5, "v": 100},
            {"t": now - 86400 * 3, "v": 54},
            {"t": now - 86400 * 3 + 3600, "v": 70},   # +16, intermediate
            {"t": now - 86400 * 3 + 7200, "v": 100},   # +46 cumulative
            {"t": now, "v": 95},
        ]
        result = detect_replacement_jumps(readings, low_threshold=20.0)
        assert len(result) == 1
        assert result[0]["old_level"] == 54
        assert result[0]["new_level"] == 100

    def test_empty_readings(self):
        """Empty or single reading returns nothing."""
        assert detect_replacement_jumps([], low_threshold=20.0) == []
        assert detect_replacement_jumps(
            [{"t": time.time(), "v": 50}], low_threshold=20.0
        ) == []


def _make_cycles(
    n: int,
    base_duration: float = 90.0,
    fade_per_cycle: float = 0.0,
    start_pct: float = 100.0,
    end_pct: float = 10.0,
) -> list[CompletedCycle]:
    """Generate n CompletedCycles with linear duration fade."""
    cycles = []
    t = 1_700_000_000.0
    for i in range(n):
        dur = base_duration * (1.0 - fade_per_cycle * i)
        dur = max(dur, 1.0)
        cycles.append(CompletedCycle(
            start_t=t,
            end_t=t + dur * 86400,
            start_pct=start_pct,
            end_pct=end_pct,
            duration_days=dur,
            replacement_t=t + dur * 86400 + 3600,
        ))
        t += (dur + 5) * 86400
    return cycles


class TestSohFromCycles:
    """Tests for soh_from_cycles()."""

    def test_returns_none_with_fewer_than_3_cycles(self):
        cycles = _make_cycles(2)
        assert soh_from_cycles(cycles) is None

    def test_healthy_battery_returns_near_100(self):
        """No fade -> SoH near 100%."""
        cycles = _make_cycles(10, base_duration=90.0, fade_per_cycle=0.0)
        soh = soh_from_cycles(cycles)
        assert soh is not None
        assert 95.0 <= soh <= 100.0

    def test_degraded_battery(self):
        """20% fade by cycle 10 -> SoH around 80%."""
        cycles = _make_cycles(10, base_duration=90.0, fade_per_cycle=0.02)
        # Last cycle duration: 90 * (1 - 0.02*9) = 73.8
        # Q0 = median(90, 88.2, 86.4) = 88.2 (normalised; same DoD cancels)
        # SoH = 73.8 / 88.2 * 100 = 83.7%
        soh = soh_from_cycles(cycles)
        assert soh is not None
        assert 75.0 <= soh <= 90.0

    def test_dead_battery(self):
        """Severe fade -> SoH near 0%."""
        cycles = _make_cycles(10, base_duration=90.0, fade_per_cycle=0.10)
        # Last cycle: 90 * (1 - 0.10*9) = 9 days
        soh = soh_from_cycles(cycles)
        assert soh is not None
        assert 0.0 <= soh <= 20.0

    def test_clamped_above_100(self):
        """Early short cycles followed by longer settled -> capped at 100."""
        cycles = _make_cycles(3, base_duration=80.0)
        # Make last cycle longer than baseline (break-in effect)
        cycles[-1] = CompletedCycle(
            start_t=cycles[-1].start_t,
            end_t=cycles[-1].start_t + 100 * 86400,
            start_pct=100.0,
            end_pct=10.0,
            duration_days=100.0,
            replacement_t=cycles[-1].replacement_t,
        )
        soh = soh_from_cycles(cycles)
        assert soh is not None
        assert soh == 100.0  # clamped, not 125%

    def test_mixed_dod_cycles(self):
        """Cycles with different DoD are normalised before comparison."""
        t = 1_700_000_000.0
        cycles = [
            # Full discharge (100->10, 90% DoD) — reference
            CompletedCycle(t, t + 90*86400, 100.0, 10.0, 90.0, t + 91*86400),
            CompletedCycle(t + 100*86400, t + 190*86400, 100.0, 10.0, 90.0, t + 191*86400),
            CompletedCycle(t + 200*86400, t + 290*86400, 100.0, 10.0, 90.0, t + 291*86400),
            # Shallow cycle (100->55, 45% DoD) — same rate, half DoD -> half duration
            CompletedCycle(t + 300*86400, t + 345*86400, 100.0, 55.0, 45.0, t + 346*86400),
        ]
        soh = soh_from_cycles(cycles)
        assert soh is not None
        # 45d / 0.45 = 100 normalised vs Q0 = 90d / 0.90 = 100 -> SoH = 100%
        assert 95.0 <= soh <= 100.0

    def test_shallow_cycles_excluded(self):
        """Cycles with DoD <= 5% are ignored."""
        t = 1_700_000_000.0
        cycles = [
            CompletedCycle(t, t + 90*86400, 100.0, 10.0, 90.0, t + 91*86400),
            CompletedCycle(t + 100*86400, t + 190*86400, 100.0, 10.0, 90.0, t + 191*86400),
            # DoD = 3% -> filtered out
            CompletedCycle(t + 200*86400, t + 201*86400, 98.0, 95.0, 1.0, t + 202*86400),
        ]
        # Only 2 valid cycles after filtering
        assert soh_from_cycles(cycles) is None

    def test_exactly_3_cycles(self):
        """Minimum viable input: 3 cycles."""
        cycles = _make_cycles(3, base_duration=90.0, fade_per_cycle=0.0)
        soh = soh_from_cycles(cycles)
        assert soh is not None
        assert soh == 100.0


class TestDurationFade:
    """Tests for duration_fade()."""

    def test_returns_none_fewer_than_ref_count(self):
        cycles = _make_cycles(2)
        assert duration_fade(cycles, 1) is None

    def test_no_fade_returns_1(self):
        """Constant duration -> fade ratio = 1.0."""
        cycles = _make_cycles(5, base_duration=90.0, fade_per_cycle=0.0)
        assert duration_fade(cycles, 4) == 1.0

    def test_20_pct_fade(self):
        """20% shorter duration -> fade ratio around 0.8."""
        cycles = _make_cycles(5, base_duration=90.0, fade_per_cycle=0.04)
        # Cycle 4: 90 * (1 - 0.04*4) = 90 * 0.84 = 75.6
        # Ref median (cycles 0-2): 90, 86.4, 82.8 -> median = 86.4
        # Fade = 75.6 / 86.4 = 0.875
        fade = duration_fade(cycles, 4)
        assert fade is not None
        assert 0.8 <= fade <= 0.95

    def test_index_out_of_range(self):
        cycles = _make_cycles(5)
        assert duration_fade(cycles, 5) is None
        assert duration_fade(cycles, -1) is None

    def test_shallow_ref_cycle_returns_none(self):
        """If any reference cycle has DoD <= 5%, returns None."""
        t = 1_700_000_000.0
        cycles = [
            # Shallow reference cycle
            CompletedCycle(t, t + 86400, 98.0, 95.0, 1.0, t + 2*86400),
            CompletedCycle(t + 10*86400, t + 100*86400, 100.0, 10.0, 90.0, t + 101*86400),
            CompletedCycle(t + 110*86400, t + 200*86400, 100.0, 10.0, 90.0, t + 201*86400),
            CompletedCycle(t + 210*86400, t + 300*86400, 100.0, 10.0, 90.0, t + 301*86400),
        ]
        assert duration_fade(cycles, 3) is None


class TestDamageScore:
    """Tests for Miner's rule damage accumulation."""

    def test_lfp_3_cycles_80pct_dod(self):
        """3 LFP cycles at 80% DoD -> D = 3 / N_fail(0.8)."""
        cycles = _make_cycles(3, start_pct=100.0, end_pct=20.0)
        d = damage_score(cycles, "LFP")
        assert d is not None
        # N_fail(80% DoD) = 2000 * (0.8)^(-1.0) = 2500
        # D = 3 / 2500 = 0.0012
        expected = 3.0 / 2500.0
        assert abs(d - expected) < 1e-6
        # SoH_cycling = (1 - D) * 100 = 99.88%
        soh_cycling = max(0, 1 - d) * 100
        assert 99.5 < soh_cycling < 100.0

    def test_nmc_full_dod(self):
        """NMC at 100% DoD accumulates faster."""
        cycles = _make_cycles(10, start_pct=100.0, end_pct=0.0)
        d = damage_score(cycles, "NMC")
        assert d is not None
        # N_fail(100%) = 1000 * 1.0^(-1.2) = 1000
        # D = 10 / 1000 = 0.01
        expected = 10.0 / 1000.0
        assert abs(d - expected) < 1e-6

    def test_nimh_50pct_dod(self):
        """NiMH at 50% DoD."""
        cycles = _make_cycles(5, start_pct=100.0, end_pct=50.0)
        d = damage_score(cycles, "NiMH")
        assert d is not None
        # N_fail(50%) = 500 * (0.5)^(-1.5) = 500 * 2.828... = 1414.2
        n_fail = 500.0 * (0.5 ** -1.5)
        expected = 5.0 / n_fail
        assert abs(d - expected) < 1e-6

    def test_skips_shallow_cycles(self):
        """Cycles with DoD < 5% are ignored."""
        t = 1_700_000_000.0
        cycles = [
            CompletedCycle(t, t + 86400, 98.0, 95.0, 1.0, t + 2*86400),
            CompletedCycle(t + 10*86400, t + 20*86400, 50.0, 48.0, 10.0, t + 21*86400),
        ]
        assert damage_score(cycles, "LFP") is None

    def test_unknown_chemistry_uses_nmc(self):
        """Unknown chemistry defaults to NMC params."""
        cycles = _make_cycles(1, start_pct=100.0, end_pct=0.0)
        d_unknown = damage_score(cycles, "unknown")
        d_nmc = damage_score(cycles, "NMC")
        assert d_unknown == d_nmc

    def test_empty_cycles(self):
        assert damage_score([], "LFP") is None

    def test_mixed_dod_accumulates(self):
        """Cycles with different DoD each contribute their own damage."""
        t = 1_700_000_000.0
        cycles = [
            CompletedCycle(t, t + 90*86400, 100.0, 0.0, 90.0, t + 91*86400),       # 100% DoD
            CompletedCycle(t + 100*86400, t + 145*86400, 100.0, 50.0, 45.0, t + 146*86400),  # 50% DoD
        ]
        d = damage_score(cycles, "NMC")
        assert d is not None
        # D = 1/N_fail(1.0) + 1/N_fail(0.5)
        # N_fail(1.0) = 1000 * 1.0^(-1.2) = 1000
        # N_fail(0.5) = 1000 * 0.5^(-1.2) = 1000 * 2.2974 = 2297.4
        n1 = 1000.0
        n2 = 1000.0 * (0.5 ** -1.2)
        expected = 1.0 / n1 + 1.0 / n2
        assert abs(d - expected) < 1e-6


class TestChemistryFromBatteryType:
    """Tests for battery_type string -> chemistry mapping."""

    def test_none_returns_unknown(self):
        assert chemistry_from_battery_type(None) == "unknown"

    def test_empty_returns_unknown(self):
        assert chemistry_from_battery_type("") == "unknown"

    def test_primary_cells_return_chemistry(self):
        """Product strings like CR2032, AA, AAA map to primary chemistries."""
        assert chemistry_from_battery_type("CR2032") == "coin_cell"
        assert chemistry_from_battery_type("AA") == "alkaline"
        assert chemistry_from_battery_type("AAA") == "alkaline"
        assert chemistry_from_battery_type("2× AAA") == "alkaline"
        assert chemistry_from_battery_type("CR123A") == "lithium_primary"

    def test_primary_cell_variants(self):
        """Extended primary cell substring matching."""
        # Coin cells
        for bt in ("CR2025", "CR2016", "CR2430", "CR2450", "CR1632", "CR1220"):
            assert chemistry_from_battery_type(bt) == "coin_cell"
        # Lithium primary
        for bt in ("L91", "FR6", "FR03", "CR17345", "Lithium AA", "Lithium AAA"):
            assert chemistry_from_battery_type(bt) == "lithium_primary"
        # Alkaline
        for bt in ("C battery", "D battery", "9V", "PP3"):
            assert chemistry_from_battery_type(bt) == "alkaline"

    def test_li_ion_variants(self):
        for bt in ("Li-ion", "Lithium-Ion", "li-ion 3.7V 6800mAh", "LIPO", "Li-Po"):
            assert chemistry_from_battery_type(bt) == "NMC"

    def test_lfp_variants(self):
        for bt in ("LiFePO4", "LFP", "lifepo4 3.2V"):
            assert chemistry_from_battery_type(bt) == "LFP"

    def test_nimh_variants(self):
        for bt in ("NiMH", "Ni-MH", "nickel metal hydride"):
            assert chemistry_from_battery_type(bt) == "NiMH"

    def test_lco_variants(self):
        for bt in ("LCO", "lithium cobalt"):
            assert chemistry_from_battery_type(bt) == "LCO"

    def test_quantity_prefix_stripped(self):
        assert chemistry_from_battery_type("2\u00d7 Li-ion") == "NMC"
        assert chemistry_from_battery_type("4\u00d7 NiMH") == "NiMH"


def _make_cycles_from_durations(
    durations: list[float],
    start_pct: float = 100.0,
    end_pct: float = 10.0,
) -> list[CompletedCycle]:
    """Generate CompletedCycles from an explicit list of durations (days)."""
    cycles = []
    t = 1_700_000_000.0
    for dur in durations:
        cycles.append(CompletedCycle(
            start_t=t,
            end_t=t + dur * 86400,
            start_pct=start_pct,
            end_pct=end_pct,
            duration_days=dur,
            replacement_t=t + dur * 86400 + 3600,
        ))
        t += (dur + 5) * 86400
    return cycles


class TestKneeRiskScore:
    """Tests for knee-point risk detection across completed cycles."""

    def test_flat_duration_score_zero(self):
        """Flat duration series → d² = 0 everywhere → score 0."""
        cycles = _make_cycles_from_durations([10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0])
        score = knee_risk_score(cycles, "NMC")
        assert score is not None
        assert score == 0.0

    def test_accelerating_decline_nmc(self):
        """Strongly accelerating fade on NMC → score clamped to 1.0."""
        # Δ:   -0.2, -0.3, -0.4, -0.5, -0.6, -0.7
        # Δ²:  -0.1, -0.1, -0.1, -0.1, -0.1  → mean last 3 = -0.1
        # -0.1 / -0.03 = 3.33 → clamped to 1.0
        durations = [10.0, 9.8, 9.5, 9.1, 8.6, 8.0, 7.3]
        cycles = _make_cycles_from_durations(durations)
        score = knee_risk_score(cycles, "NMC")
        assert score == 1.0

    def test_borderline_nmc(self):
        """Mild acceleration on NMC → score between 0 and 1."""
        # Δ:   -0.1, -0.12, -0.14, -0.16, -0.18, -0.20
        # Δ²:  -0.02, -0.02, -0.02, -0.02, -0.02  → mean = -0.02
        # -0.02 / -0.03 = 0.667
        durations = [10.0, 9.9, 9.78, 9.64, 9.48, 9.3, 9.1]
        cycles = _make_cycles_from_durations(durations)
        score = knee_risk_score(cycles, "NMC")
        assert score is not None
        assert 0.5 < score < 0.8

    def test_too_few_cycles_returns_none(self):
        """Fewer than 5 usable cycles → None."""
        cycles = _make_cycles_from_durations([10.0, 9.5, 9.0, 8.5])
        assert knee_risk_score(cycles, "NMC") is None

    def test_lfp_more_sensitive(self):
        """Same acceleration scores higher on LFP (tighter threshold)."""
        durations = [10.0, 9.9, 9.78, 9.64, 9.48, 9.3, 9.1]
        cycles = _make_cycles_from_durations(durations)
        nmc_score = knee_risk_score(cycles, "NMC")
        lfp_score = knee_risk_score(cycles, "LFP")
        assert lfp_score is not None and nmc_score is not None
        assert lfp_score > nmc_score

    def test_improving_duration_score_zero(self):
        """Durations getting longer (positive Δ) → no knee risk."""
        durations = [10.0, 10.2, 10.5, 10.9, 11.4, 12.0, 12.7]
        cycles = _make_cycles_from_durations(durations)
        score = knee_risk_score(cycles, "NMC")
        assert score == 0.0

    def test_shallow_cycles_excluded(self):
        """Cycles with DoD ≤ 5% are filtered; too few valid → None."""
        durations = [10.0, 9.0, 8.0, 7.0, 6.0]
        cycles = _make_cycles_from_durations(durations, start_pct=50.0, end_pct=48.0)
        assert knee_risk_score(cycles, "NMC") is None

    def test_unknown_chemistry_uses_lfp_threshold(self):
        """Unknown chemistry uses conservative LFP threshold."""
        durations = [10.0, 9.9, 9.78, 9.64, 9.48, 9.3, 9.1]
        cycles = _make_cycles_from_durations(durations)
        unknown_score = knee_risk_score(cycles, "unknown")
        lfp_score = knee_risk_score(cycles, "LFP")
        assert unknown_score == lfp_score


class TestCompletedCycleFromDict:
    """Tests for CompletedCycle.from_dict()."""

    def test_round_trip(self):
        """A cycle dict with all fields reconstructs correctly."""
        d = {
            "start_t": 1700000000.0,
            "end_t": 1700086400.0,
            "start_pct": 100.0,
            "end_pct": 10.0,
            "duration_days": 1.0,
            "replacement_t": 1700090000.0,
        }
        c = CompletedCycle.from_dict(d)
        assert c is not None
        assert c.start_t == 1700000000.0
        assert c.end_t == 1700086400.0
        assert c.start_pct == 100.0
        assert c.end_pct == 10.0
        assert c.duration_days == 1.0
        assert c.replacement_t == 1700090000.0

    def test_missing_replacement_t_uses_end_t(self):
        """Stored cycles from before replacement_t was added still work."""
        d = {
            "start_t": 1700000000.0,
            "end_t": 1700086400.0,
            "start_pct": 100.0,
            "end_pct": 10.0,
            "duration_days": 1.0,
        }
        c = CompletedCycle.from_dict(d)
        assert c is not None
        assert c.replacement_t == d["end_t"]

    def test_missing_required_field_returns_none(self):
        """Missing a required field returns None."""
        d = {"start_t": 1700000000.0, "end_t": 1700086400.0}
        assert CompletedCycle.from_dict(d) is None


class TestHealthMetricsWiring:
    """Test the coordinator-level health metric computation logic.

    Exercises the same computation that _async_build_entity_data performs:
    reconstruct cycles from dicts, compute soh/damage/knee metrics.
    """

    @staticmethod
    def _compute_health_metrics(
        cycle_dicts: list[dict],
        is_rechargeable: bool,
        battery_type: str | None = None,
    ) -> dict:
        """Replicate the coordinator's health metric computation."""
        soh_val = None
        dmg = None
        soh_cycling_val = None
        knee_val = None
        cycle_count = 0

        if is_rechargeable and cycle_dicts:
            cycles = [
                c for c in (CompletedCycle.from_dict(d) for d in cycle_dicts)
                if c is not None
            ]
            cycle_count = len(cycles)
            chem = chemistry_from_battery_type(battery_type)
            soh_val = soh_from_cycles(cycles)
            dmg = damage_score(cycles, chem)
            soh_cycling_val = (
                round(max(0.0, 1.0 - dmg) * 100, 1)
                if dmg is not None else None
            )
            knee_val = knee_risk_score(cycles, chem)

        return {
            "soh": soh_val,
            "damage_score": dmg,
            "soh_cycling": soh_cycling_val,
            "knee_risk": knee_val,
            "cycle_count": cycle_count,
        }

    def _cycle_dicts(self, n: int, fade: float = 0.0) -> list[dict]:
        """Generate n cycle dicts with optional duration fade."""
        cycles = _make_cycles(n, base_duration=90.0, fade_per_cycle=fade)
        return [
            {
                "start_t": c.start_t,
                "end_t": c.end_t,
                "start_pct": c.start_pct,
                "end_pct": c.end_pct,
                "duration_days": c.duration_days,
                "replacement_t": c.replacement_t,
            }
            for c in cycles
        ]

    def test_rechargeable_with_sufficient_cycles(self):
        """Rechargeable device with >=3 cycles gets all metrics."""
        dicts = self._cycle_dicts(10, fade=0.01)
        result = self._compute_health_metrics(dicts, is_rechargeable=True, battery_type="Li-ion")
        assert result["soh"] is not None
        assert result["damage_score"] is not None
        assert result["soh_cycling"] is not None
        assert result["knee_risk"] is not None
        assert result["cycle_count"] == 10
        # SoH should be < 100 with fade
        assert result["soh"] < 100.0
        # soh_cycling should be near 100 (low damage for 10 cycles)
        assert result["soh_cycling"] > 95.0

    def test_non_rechargeable_returns_none(self):
        """Non-rechargeable device gets None for all health metrics."""
        dicts = self._cycle_dicts(10)
        result = self._compute_health_metrics(dicts, is_rechargeable=False)
        assert result["soh"] is None
        assert result["damage_score"] is None
        assert result["soh_cycling"] is None
        assert result["knee_risk"] is None
        assert result["cycle_count"] == 0

    def test_rechargeable_fewer_than_3_cycles(self):
        """Rechargeable with <3 cycles: soh/knee None, damage may be present."""
        dicts = self._cycle_dicts(2)
        result = self._compute_health_metrics(dicts, is_rechargeable=True)
        assert result["cycle_count"] == 2
        assert result["soh"] is None
        # damage_score can still compute with 1+ valid cycle
        # knee_risk needs 5+ cycles
        assert result["knee_risk"] is None


class TestHealthMetricsRobustness:
    """Test that health metrics are robust against real-world HA sensor noise."""

    def test_outlier_duration_does_not_skew_soh(self):
        """A single 10× outlier in 8 healthy cycles should not skew SoH."""
        durations = [90.0, 89.0, 91.0, 900.0, 88.0, 90.0, 89.0, 91.0]
        cycles = _make_cycles_from_durations(durations)
        soh = soh_from_cycles(cycles)
        assert soh is not None
        # Without filtering, Q₀ could be skewed or current estimate wrong.
        # With filtering, the 900-day outlier is removed and SoH ≈ 100%.
        assert 90.0 <= soh <= 100.0

    def test_short_cycle_excluded(self):
        """Cycles with duration_days < 1.0 (false replacement) are excluded."""
        t = 1_700_000_000.0
        cycles = [
            # 3 real cycles
            CompletedCycle(t, t + 90*86400, 100.0, 10.0, 90.0, t + 91*86400),
            CompletedCycle(t + 100*86400, t + 190*86400, 100.0, 10.0, 90.0, t + 191*86400),
            CompletedCycle(t + 200*86400, t + 290*86400, 100.0, 10.0, 90.0, t + 291*86400),
            # False replacement: device rebooted, produced a 0.1-day "cycle"
            CompletedCycle(t + 300*86400, t + 300*86400 + 8640, 100.0, 10.0, 0.1, t + 301*86400),
            # Another real cycle
            CompletedCycle(t + 310*86400, t + 400*86400, 100.0, 10.0, 90.0, t + 401*86400),
        ]
        soh = soh_from_cycles(cycles)
        assert soh is not None
        # The 0.1-day cycle is gated out by _dod_normalised_duration;
        # remaining 4 cycles are healthy → SoH ≈ 100%
        assert 95.0 <= soh <= 100.0

    def test_knee_noise_floor_flat_with_jitter(self):
        """A flat duration series with sub-threshold Δ² should not produce a score.

        NMC noise floor = 30% of threshold (0.03) = 0.009.
        Alternating ±0.002 jitter on normalised durations produces
        Δ² ≈ ±0.004, which is below the 0.009 floor.
        """
        # Alternating +0.002 / -0.002 on 10-day base (normalised = ÷0.9 ≈ 11.1)
        # Δ = [-0.004, +0.004, -0.004, ...] → Δ² ≈ ±0.009 (right at boundary)
        # Use smaller jitter to stay clearly below:
        durations = [10.0, 10.001, 9.999, 10.001, 9.999, 10.001, 9.999, 10.0]
        cycles = _make_cycles_from_durations(durations)
        score = knee_risk_score(cycles, "NMC")
        assert score is not None
        assert score == 0.0

    def test_insufficient_data_after_filtering_falls_back(self):
        """If filtering removes too many cycles, return unfiltered result."""
        # 5 cycles where 3 are "outliers" relative to the others —
        # filtering would leave only 2, so it falls back to all 5.
        durations = [10.0, 100.0, 10.0, 100.0, 10.0]
        cycles = _make_cycles_from_durations(durations)
        # _filter_outlier_cycles should return the original list
        filtered = _filter_outlier_cycles(cycles)
        assert len(filtered) == len(cycles)
        # soh_from_cycles should still produce a result (not None)
        soh = soh_from_cycles(cycles)
        assert soh is not None

    def test_outlier_filter_preserves_order(self):
        """Filtered list preserves original cycle order."""
        durations = [90.0, 89.0, 91.0, 900.0, 88.0, 90.0, 89.0, 91.0]
        cycles = _make_cycles_from_durations(durations)
        filtered = _filter_outlier_cycles(cycles)
        # The 900-day outlier (index 3) should be removed
        assert len(filtered) == 7
        # Verify chronological order preserved
        for i in range(1, len(filtered)):
            assert filtered[i].start_t > filtered[i - 1].start_t

    def test_damage_score_unaffected_by_outlier_duration(self):
        """damage_score is DoD-based — outlier durations don't change the result."""
        base_cycles = _make_cycles(5, base_duration=90.0, start_pct=100.0, end_pct=10.0)
        # Insert an outlier-duration cycle with the same DoD
        t = base_cycles[-1].end_t + 10 * 86400
        outlier = CompletedCycle(t, t + 900*86400, 100.0, 10.0, 900.0, t + 901*86400)
        cycles_with_outlier = list(base_cycles) + [outlier]

        d_base = damage_score(base_cycles, "NMC")
        d_with = damage_score(cycles_with_outlier, "NMC")
        assert d_base is not None and d_with is not None
        # Adding one more cycle with same DoD adds exactly 1/N_fail more damage
        n_fail = 1000.0 * (0.9 ** -1.2)  # 90% DoD
        assert abs(d_with - d_base - 1.0 / n_fail) < 1e-6
