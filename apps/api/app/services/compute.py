"""
Hanga API — Compute layer.

All arithmetic lives here (briefing_spec.md §1 iron rule): 7-day moving
averages, reorder math, factor activation, perishability risk, and the
cash-feasible bundle fit. Gemma receives this module's output as pre-computed
aggregates and only decides actions-in-context, ranges, and Bahasa
explanations — never math.

Two entry points:
- `compute_outputs(snapshot)` — full derivation from a ShopSnapshot (live path).
- `refit_budget(briefing, cash)` — re-fits an existing briefing's bundle to a
  new cash amount in pure code; powers the demo cash slider on top of the
  authored scenario snapshots.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, timedelta

from app.schemas.briefing import (
    ActionType,
    BaselineCompare,
    Budget,
    Confidence,
    DailyBriefing,
    DataQuality,
    Factor,
    FactorKey,
    Mover,
    Movers,
    OrderDraft,
    QuantityRange,
    Recommendation,
    Risk,
    RiskType,
    Scenario,
)

# --- Reorder policy constants -------------------------------------------------
LEAD_TIME_DAYS = 1  # grosir delivers same/next day via WhatsApp
# Warungs restock 2–3x/week but buy staples a week+ at a time; the target shelf
# cover for an order is ~8 days including the lead time.
TARGET_COVER_DAYS = 8
FAST_DELTA = 0.10  # |7d delta| threshold for movers
CHIP_FLOOR = 0.05  # factor chips below this weight are hidden (spec §4)
CASH_TIGHT_WEIGHT = -0.32
CASH_TIGHT_NOTE = "kas hari ini sudah terpakai"
MAX_RECOMMENDATIONS = 5  # spec §4


@dataclass(frozen=True)
class CatalogEntry:
    """A SKU in the shop's catalog (mirrors `catalog/{sku}` in Firestore)."""

    sku: str
    name: str
    unit: str
    unit_cost_idr: int
    category: str = "LAINNYA"
    perishable: bool = False
    shelf_days: int | None = None
    festive: bool = False  # LEBARAN-sensitive (sirup, biskuit, tepung kue)
    rain_boom: bool = False  # hot drinks / noodles on rainy days
    payday_boom: bool = False  # staples & premium items after payday


@dataclass
class ShopSnapshot:
    """Everything the compute layer needs — no Firestore, no LLM, no clock."""

    shop_id: str
    today: date
    sales: dict[date, dict[str, float]]  # per-day per-SKU quantities
    catalog: dict[str, CatalogEntry]
    stock_units: dict[str, float]
    cash_available_idr: int
    scenario: Scenario = Scenario.BASELINE
    confirmed_lines: int = 0
    synthetic: bool = False  # history came from the generator, not Firestore


@dataclass
class ComputeResult:
    """Template briefing (code-only copy) + aggregates for the Gemma call."""

    briefing: DailyBriefing
    aggregates: dict = field(default_factory=dict)


def is_payday_window(day: date) -> bool:
    """Two payroll waves around warungs: the 25th–month-end and the 1st–3rd."""
    return day.day >= 25 or day.day <= 3


def is_weekend(day: date) -> bool:
    return day.weekday() >= 5  # Saturday/Sunday


def calendar_multiplier(day: date) -> float:
    """Known calendar lift for a day (weekday + payday) — used to adjust deltas."""
    mult = 1.0
    if is_weekend(day):
        mult *= 1.35
    if is_payday_window(day):
        mult *= 1.4
    return mult


# Rain hurts these even though they are not short-shelf perishables (frozen,
# impulse buys on foot).
_RAIN_DIP_SKUS = {"ES-KRIM-CONE", "ROTI-BASAH"}


def _scenario_multiplier(entry: CatalogEntry, scenario: Scenario) -> float:
    """Forward-looking demand adjustment for the active scenario."""
    if scenario == Scenario.LEBARAN_T14:
        if entry.festive:
            return 5.0
        if entry.sku == "MIE-INSTAN-GORENG":
            return 0.7
        if entry.sku == "SUSU-UHT-1L":
            return 0.8
    elif scenario == Scenario.PAYDAY_T3:
        if entry.payday_boom:
            return 1.5
        if entry.sku == "IKAN-ASIN-100G":
            return 0.7
    elif scenario == Scenario.RAIN_TOMORROW:
        if entry.rain_boom:
            return 1.8
        if entry.sku in _RAIN_DIP_SKUS:
            return 0.6
    return 1.0


def _per_sku_stats(
    snapshot: ShopSnapshot,
) -> dict[str, dict]:
    """
    7d moving average, calendar-adjusted delta, and stock cover per SKU.

    `delta_7d` compares calendar-adjusted daily averages (weekday/payday lift
    divided out), so a payday-heavy previous week doesn't read as a sales drop.
    `avg_daily` stays raw — it represents real forward demand.
    """
    days = sorted(snapshot.sales)
    last7 = days[-7:]
    prev7 = days[-14:-7]

    def adj_avg(window: list[date], sku: str) -> float:
        vals = [
            snapshot.sales[d].get(sku, 0.0) / calendar_multiplier(d)
            for d in window
        ]
        return sum(vals) / max(len(vals), 1)

    stats: dict[str, dict] = {}
    for sku, entry in snapshot.catalog.items():
        qty_7d = sum(snapshot.sales[d].get(sku, 0.0) for d in last7)
        avg_daily = qty_7d / max(len(last7), 1)
        avg7 = adj_avg(last7, sku)
        avg_prev = adj_avg(prev7, sku)
        delta = (avg7 - avg_prev) / avg_prev if avg_prev > 0 else 0.0
        stock = float(snapshot.stock_units.get(sku, 0.0))
        cover = stock / avg_daily if avg_daily > 0 else 0.0
        stats[sku] = {
            "entry": entry,
            "qty_7d": qty_7d,
            "delta_7d": delta,
            "avg_daily": avg_daily,
            "stock": stock,
            "cover_days": cover,
            "obs_days": sum(1 for d in days if snapshot.sales[d].get(sku, 0) > 0),
        }
    return stats


def _active_factors(
    entry: CatalogEntry,
    stats_row: dict,
    snapshot: ShopSnapshot,
) -> list[Factor]:
    """Factor activation for one SKU — bounded, canonical keys only (spec §3)."""
    factors: list[Factor] = []
    if stats_row["delta_7d"] >= FAST_DELTA:
        factors.append(Factor(key=FactorKey.TREND_UP, direction="+", weight=0.15,
                              note_bahasa="penjualan 7 hari naik"))
    elif stats_row["delta_7d"] <= -FAST_DELTA:
        factors.append(Factor(key=FactorKey.TREND_DOWN, direction="-", weight=-0.15,
                              note_bahasa="penjualan 7 hari turun"))
    if is_weekend(snapshot.today):
        factors.append(Factor(key=FactorKey.WEEKEND, direction="+", weight=0.15,
                              note_bahasa="ramai akhir pekan"))
    if is_payday_window(snapshot.today):
        weight = 0.20 if entry.payday_boom else 0.10
        factors.append(Factor(key=FactorKey.PAYDAY, direction="+", weight=weight,
                              note_bahasa="musim gajian"))
    if snapshot.scenario == Scenario.LEBARAN_T14 and entry.festive:
        factors.append(Factor(key=FactorKey.LEBARAN_T14, direction="+", weight=0.45,
                              note_bahasa="persiapan lebaran"))
    elif snapshot.scenario == Scenario.RAIN_TOMORROW:
        if entry.rain_boom:
            factors.append(Factor(key=FactorKey.RAIN_TOMORROW, direction="+", weight=0.35,
                                  note_bahasa="hujan besok, barang hangat dicari"))
        elif entry.sku in _RAIN_DIP_SKUS:
            factors.append(Factor(key=FactorKey.RAIN_TOMORROW, direction="-", weight=-0.30,
                                  note_bahasa="hujan, pengunjung turun"))
    if stats_row["obs_days"] < 14:
        factors.append(Factor(key=FactorKey.LOW_DATA, direction="-", weight=-0.10,
                              note_bahasa="data masih sedikit"))
    return factors


def _confidence_for(coverage_days: int, obs_days: int) -> Confidence:
    """Computed in code (spec §4): coverage + per-SKU observation count."""
    if coverage_days < 14 or obs_days < 14:
        return Confidence.LOW
    if coverage_days < 45:
        return Confidence.MEDIUM
    return Confidence.HIGH


def compute_outputs(snapshot: ShopSnapshot) -> ComputeResult:
    """Derive movers, risks, reorder candidates, and the cash-fitted bundle."""
    stats = _per_sku_stats(snapshot)
    coverage_days = len(snapshot.sales)
    today = snapshot.today

    # --- Movers -----------------------------------------------------------
    fast, slow = [], []
    for sku, row in stats.items():
        if abs(row["delta_7d"]) < FAST_DELTA:
            continue
        mover = Mover(sku=sku, name=row["entry"].name, delta_7d=round(row["delta_7d"], 2))
        (fast if row["delta_7d"] > 0 else slow).append(mover)
    fast.sort(key=lambda m: -m.delta_7d)
    slow.sort(key=lambda m: m.delta_7d)

    # --- Risks ------------------------------------------------------------
    risks: list[Risk] = []
    for sku, row in stats.items():
        entry: CatalogEntry = row["entry"]
        if row["avg_daily"] > 0 and row["cover_days"] < TARGET_COVER_DAYS - 1:
            severity = 3 if row["cover_days"] < 1 else 2 if row["cover_days"] < 1.5 else 1
            window = today + timedelta(days=max(int(math.ceil(row["cover_days"])), 1))
            risk_factors = [FactorKey.WEEKEND] if is_weekend(today) else []
            if snapshot.scenario == Scenario.RAIN_TOMORROW and entry.rain_boom:
                risk_factors.append(FactorKey.RAIN_TOMORROW)
            risks.append(Risk(type=RiskType.STOCKOUT_RISK, sku=sku, window=window,
                              severity=severity, factor_keys=risk_factors))
        if entry.perishable and entry.shelf_days and row["avg_daily"] > 0:
            sell_days = row["stock"] / row["avg_daily"]
            if sell_days > entry.shelf_days:
                ratio = sell_days / entry.shelf_days
                severity = 1 if ratio <= 1.25 else 2 if ratio <= 1.6 else 3
                risks.append(Risk(type=RiskType.WASTE_RISK, sku=sku,
                                  window=today + timedelta(days=entry.shelf_days),
                                  severity=severity,
                                  factor_keys=[FactorKey.WASTE_RISK]))
    risks.sort(key=lambda r: -r.severity)
    risks = risks[:4]

    # --- Reorder candidates -------------------------------------------------
    max_avg = max((row["avg_daily"] for row in stats.values()), default=0.0) or 1.0
    candidates: list[dict] = []
    for sku, row in stats.items():
        entry: CatalogEntry = row["entry"]
        eff_daily = row["avg_daily"] * _scenario_multiplier(entry, snapshot.scenario)
        factors = _active_factors(entry, row, snapshot)
        factor_pull = sum(f.weight for f in factors)

        if eff_daily <= 0:
            continue
        cover_eff = row["stock"] / eff_daily if eff_daily > 0 else 0.0
        target_qty = eff_daily * TARGET_COVER_DAYS
        needed = target_qty - row["stock"]
        urgency = max(0.0, min(1.0, 1 - cover_eff / TARGET_COVER_DAYS))
        velocity_norm = min(row["avg_daily"] / max_avg, 1.0)
        priority = urgency * (0.6 + 0.4 * velocity_norm) \
            + (0.25 if entry.perishable else 0.0) + max(factor_pull, 0.0)

        if needed >= 1:
            likely = int(math.ceil(needed))
            candidates.append({
                "entry": entry, "row": row, "factors": factors,
                "priority": priority, "likely": likely,
                "min": max(1, int(math.ceil(needed * 0.75))),
                "max": int(math.ceil(needed * 1.3)),
                "est_cost": likely * entry.unit_cost_idr,
                "cover": cover_eff,
            })
        elif cover_eff >= 5 and row["avg_daily"] >= 0.2:
            candidates.append({
                "entry": entry, "row": row, "factors": factors,
                "priority": priority - 1.0, "hold": True,
                "cover": cover_eff,
            })

    candidates.sort(key=lambda c: -c["priority"])

    # --- Cash-feasible bundle (greedy by priority, code-only — spec §6.1) ---
    committed = 0
    funded: list[Recommendation] = []
    deferred: list[dict] = []
    for cand in candidates:
        if cand.get("hold"):
            continue
        if committed + cand["est_cost"] <= snapshot.cash_available_idr and len(funded) < 4:
            committed += cand["est_cost"]
            funded.append(_funded_recommendation(cand, snapshot, coverage_days))
        else:
            deferred.append(cand)

    signals = [_hold_recommendation(c) for c in candidates if c.get("hold")][:1]

    # Deferred cards: as many as the 5-card cap allows, highest priority first.
    # budget.deferred_skus stays in lockstep with the visible CASH_TIGHT cards.
    deferred_slots = max(0, MAX_RECOMMENDATIONS - len(funded) - len(signals))
    deferred_cards = deferred[:deferred_slots]

    recommendations = funded
    recommendations.extend(_deferred_recommendation(c, coverage_days) for c in deferred_cards)
    recommendations.extend(signals)
    recommendations = recommendations[:MAX_RECOMMENDATIONS]

    budget = Budget(
        cash_available_idr=snapshot.cash_available_idr,
        committed_idr=committed,
        remaining_idr=snapshot.cash_available_idr - committed,
        deferred_skus=[c["entry"].sku for c in deferred_cards],
        note_bahasa=(
            f"{len(deferred)} pesanan ditunda besok: kas hari ini untuk barang prioritas."
            if deferred
            else "Semua pesanan prioritas muat di kas hari ini. Sisa kas aman."
        ),
    )

    headline = _headline(funded, deferred, snapshot.scenario)

    flags: list[str] = []
    if snapshot.synthetic:
        flags.append("Riwayat dari generator sintetis — belum ada data foto buku")
    low_data = [sku for sku, row in stats.items() if row["obs_days"] < 14]
    for sku in low_data[:3]:
        flags.append(f"{sku}: observasi < 14 hari")

    briefing = DailyBriefing(
        version="1.1",
        shop_id=snapshot.shop_id,
        generated_at=today.isoformat() + "T06:00:00+07:00",
        scenario=snapshot.scenario,
        headline=headline,
        budget=budget,
        movers=Movers(fast=fast[:5], slow=slow[:5]),
        risks=risks,
        recommendations=recommendations,
        baseline_compare=BaselineCompare(
            policy="7d_moving_avg",
            deltas={},  # filled by the policy backtest (P1, not yet built)
        ),
        data_quality=DataQuality(
            coverage_days=coverage_days,
            extraction_confirmed_lines=snapshot.confirmed_lines,
            flags=flags,
        ),
    )

    aggregates = {
        "shop_id": snapshot.shop_id,
        "date": today.isoformat(),
        "scenario": snapshot.scenario.value,
        "coverage_days": coverage_days,
        "budget": budget.model_dump(mode="json"),
        "factors_today": _factor_context(snapshot),
        "skus": [
            {
                "sku": sku,
                "name": row["entry"].name,
                "unit": row["entry"].unit,
                "avg_daily_7d": round(row["avg_daily"], 2),
                "delta_7d": round(row["delta_7d"], 2),
                "stock": row["stock"],
                "cover_days": round(row["cover_days"], 1),
                "unit_cost_idr": row["entry"].unit_cost_idr,
                "perishable": row["entry"].perishable,
                "shelf_days": row["entry"].shelf_days,
            }
            for sku, row in stats.items()
        ],
    }
    return ComputeResult(briefing=briefing, aggregates=aggregates)


def _factor_context(snapshot: ShopSnapshot) -> list[str]:
    """Human-readable factor context handed to Gemma with the aggregates."""
    context = []
    if is_weekend(snapshot.today):
        context.append("WEEKEND: akhir pekan, warung lebih ramai")
    if is_payday_window(snapshot.today):
        context.append("PAYDAY: jendela gajian 25-3, daya beli naik")
    if snapshot.scenario == Scenario.LEBARAN_T14:
        context.append("LEBARAN_T14: H-14 Lebaran, borongan sirup/biskuit/tepung")
    elif snapshot.scenario == Scenario.RAIN_TOMORROW:
        context.append("RAIN_TOMORROW: hujan lebat besok, pengunjung turun")
    elif snapshot.scenario == Scenario.PAYDAY_T3:
        context.append("PAYDAY_T3: 3 hari setelah gajian, belanja bulanan")
    return context


def _short_name(name: str, words: int = 3) -> str:
    return " ".join(name.split()[:words])


def _headline(
    funded: list[Recommendation], deferred: list[dict], scenario: Scenario
) -> str:
    if not funded:
        return "Stok aman hari ini — tidak ada yang perlu dipesan."
    top = funded[0]
    qty = f"{top.qty.likely} {top.qty.unit}"
    label = _short_name(top.name or top.sku)
    if scenario == Scenario.LEBARAN_T14:
        text = f"Lebaran H-14: {label} diborong warga — amankan {qty}."
    elif scenario == Scenario.PAYDAY_T3:
        text = f"Gajian: belanja warga naik — tambah {label} {qty}."
    elif scenario == Scenario.RAIN_TOMORROW:
        text = f"Hujan besok: siapkan {label} {qty}, tahan barang segar."
    else:
        text = f"{label} menipis — pesan {qty} hari ini."
    return text[:80]


def _funded_recommendation(
    cand: dict, snapshot: ShopSnapshot, coverage_days: int
) -> Recommendation:
    entry: CatalogEntry = cand["entry"]
    return Recommendation(
        action=ActionType.REORDER,
        sku=entry.sku,
        name=entry.name,
        est_cost_idr=cand["est_cost"],
        qty=QuantityRange(min=cand["min"], likely=cand["likely"],
                          max=cand["max"], unit=entry.unit),
        confidence=_confidence_for(coverage_days, cand["row"]["obs_days"]),
        factors=cand["factors"],
        rationale_bahasa=(
            f"Sisa stok ±{max(int(cand['cover']), 0)} hari. "
            f"Pesan {cand['likely']} {entry.unit} sekarang agar tidak kehabisan."
        )[:160],
        order_draft=OrderDraft(
            supplier_ref="TOKO GROSIR JAYA",
            est_cost_idr=cand["est_cost"],
            wa_deep_link=(
                f"https://wa.me/6281234567890?text="
                f"Halo%20Toko%20Grosir%20Jaya,%20pesan%20"
                f"{entry.name.replace(' ', '%20')}%20{cand['likely']}%20{entry.unit}."
            ),
        ),
    )


def _deferred_recommendation(cand: dict, coverage_days: int) -> Recommendation:
    entry: CatalogEntry = cand["entry"]
    factors = list(cand["factors"])
    cash_tight = Factor(key=FactorKey.CASH_TIGHT, direction="-",
                        weight=CASH_TIGHT_WEIGHT, note_bahasa=CASH_TIGHT_NOTE)
    if len(factors) >= 4:
        factors[-1] = cash_tight
    else:
        factors.append(cash_tight)
    confidence = _confidence_for(coverage_days, cand["row"]["obs_days"])
    if confidence == Confidence.HIGH:
        confidence = Confidence.MEDIUM
    return Recommendation(
        action=ActionType.REORDER,
        sku=entry.sku,
        name=entry.name,
        est_cost_idr=cand["est_cost"],
        qty=QuantityRange(min=cand["min"], likely=cand["likely"],
                          max=cand["max"], unit=entry.unit),
        confidence=confidence,
        factors=factors,
        rationale_bahasa=(
            f"Kas hari ini dipakai pesanan prioritas. "
            f"Pesan {cand['likely']} {entry.unit} besok pagi setelah uang masuk."
        )[:160],
        order_draft=None,
    )


def _hold_recommendation(cand: dict) -> Recommendation:
    entry: CatalogEntry = cand["entry"]
    return Recommendation(
        action=ActionType.HOLD,
        sku=entry.sku,
        name=entry.name,
        qty=QuantityRange(min=0, likely=0, max=0, unit=entry.unit),
        confidence=Confidence.MEDIUM,
        factors=cand["factors"],
        rationale_bahasa=(
            f"Stok {entry.name} masih cukup ±{int(cand['cover'])} hari — "
            f"tahan pesanan dulu."
        )[:160],
        order_draft=None,
    )


# ---------------------------------------------------------------------------
# Cash re-fitting — powers the demo slider on any briefing (authored or computed)
# ---------------------------------------------------------------------------

def _cost_of(rec: Recommendation) -> int:
    if rec.est_cost_idr is not None:
        return rec.est_cost_idr
    if rec.order_draft is not None:
        return rec.order_draft.est_cost_idr
    return 0


def _with_cash_tight(rec: Recommendation) -> None:
    chip = Factor(key=FactorKey.CASH_TIGHT, direction="-",
                  weight=CASH_TIGHT_WEIGHT, note_bahasa=CASH_TIGHT_NOTE)
    if any(f.key == FactorKey.CASH_TIGHT for f in rec.factors):
        return
    if len(rec.factors) >= 4:
        rec.factors[-1] = chip
    else:
        rec.factors.append(chip)


def _without_cash_tight(rec: Recommendation) -> None:
    rec.factors = [f for f in rec.factors if f.key != FactorKey.CASH_TIGHT]


def refit_budget(briefing: DailyBriefing, cash: int) -> DailyBriefing:
    """
    Re-fit the briefing's order bundle to a new cash amount — pure code.

    Walks the REORDER cards in priority order, funds greedily while
    `committed + cost <= cash`, and visibly defers the rest (CASH_TIGHT chip,
    deferred rationale, HIGH→MEDIUM confidence). Previously-deferred items that
    now fit are restored with funded copy. Never drops a needed reorder.
    """
    if briefing.budget is None or cash == briefing.budget.cash_available_idr:
        return briefing

    refit = briefing.model_copy(deep=True)
    reorders = [r for r in refit.recommendations if r.action == ActionType.REORDER]
    others = [r for r in refit.recommendations if r.action != ActionType.REORDER]

    committed = 0
    deferred_skus: list[str] = []
    for rec in reorders:
        cost = _cost_of(rec)
        was_deferred = any(f.key == FactorKey.CASH_TIGHT for f in rec.factors)
        if committed + cost <= cash:
            committed += cost
            if was_deferred:
                _without_cash_tight(rec)
                rec.rationale_bahasa = (
                    f"Pesan {rec.qty.likely} {rec.qty.unit} sekarang: "
                    f"kas cukup dan {rec.name or rec.sku} sedang dicari."
                )[:160]
                if rec.confidence == Confidence.LOW:
                    rec.confidence = Confidence.MEDIUM
        else:
            deferred_skus.append(rec.sku)
            if not was_deferred:
                _with_cash_tight(rec)
                rec.rationale_bahasa = (
                    f"Kas hari ini dipakai pesanan prioritas. "
                    f"Pesan {rec.qty.likely} {rec.qty.unit} besok pagi setelah uang masuk."
                )[:160]
                if rec.confidence == Confidence.HIGH:
                    rec.confidence = Confidence.MEDIUM

    refit.budget = Budget(
        cash_available_idr=cash,
        committed_idr=committed,
        remaining_idr=cash - committed,
        deferred_skus=deferred_skus,
        note_bahasa=(
            f"{len(deferred_skus)} pesanan ditunda besok: kas hari ini untuk barang prioritas."
            if deferred_skus
            else "Semua pesanan prioritas muat di kas hari ini. Sisa kas aman."
        ),
    )
    refit.recommendations = reorders + others
    return refit
