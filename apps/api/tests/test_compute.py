"""
Tests for the compute layer: aggregates, reorder math, cash-bundle fitting,
perishability risk, and the refit path that powers the demo cash slider.
"""

from datetime import date, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.briefing import ActionType, FactorKey, RiskType, Scenario
from app.services.catalog_data import BU_SARI_CATALOG, BU_SARI_STOCK
from app.services.compute import (
    ShopSnapshot,
    compute_outputs,
    refit_budget,
)
from app.services.seed_data import get_demo_briefing
from app.services.synthetic import build_shop_snapshot, generate_sales_history

DEMO_DAY = date(2026, 10, 10)
FESTIVE = {"SIRUP-MARJAN-650ML", "BISKUIT-KHONG-GUAN", "TEPUNG-TERIGU-1KG"}


def test_synthetic_history_deterministic():
    a = generate_sales_history(DEMO_DAY)
    b = generate_sales_history(DEMO_DAY)
    assert a == b
    assert len(a) == 90


def test_compute_budget_invariant():
    """The bundle must always fit the cash; deferred list must match CASH_TIGHT cards."""
    snapshot = build_shop_snapshot("warung-bu-sari", DEMO_DAY, 700000)
    briefing = compute_outputs(snapshot).briefing

    assert briefing.budget is not None
    assert briefing.budget.committed_idr <= briefing.budget.cash_available_idr
    assert briefing.budget.remaining_idr == (
        briefing.budget.cash_available_idr - briefing.budget.committed_idr
    )
    cash_tight_skus = {
        r.sku
        for r in briefing.recommendations
        if any(f.key == FactorKey.CASH_TIGHT for f in r.factors)
    }
    assert cash_tight_skus == set(briefing.budget.deferred_skus)
    assert len(briefing.recommendations) <= 5


def test_compute_lebaran_inverts_to_festive_bundle():
    """LEBARAN_T14 must push festive SKUs into the funded bundle."""
    base = compute_outputs(
        build_shop_snapshot("warung-bu-sari", DEMO_DAY, 700000, "BASELINE")
    ).briefing
    lebaran = compute_outputs(
        build_shop_snapshot("warung-bu-sari", DEMO_DAY, 2500000, "LEBARAN_T14")
    ).briefing

    lebaran_skus = [r.sku for r in lebaran.recommendations if r.action == ActionType.REORDER]
    funded_festive = set(lebaran_skus) & FESTIVE
    assert len(funded_festive) >= 2, f"expected festive SKUs funded, got {lebaran_skus}"

    base_festive = {r.sku for r in base.recommendations} & FESTIVE
    assert len(funded_festive) > len(base_festive)


def test_refit_tight_cash_defers_visibly():
    """Rp 1.5jt cannot fund the full Lebaran bundle — the overflow is deferred."""
    base = get_demo_briefing(Scenario.LEBARAN_T14, "warung-bu-sari")
    refit = refit_budget(base, 1_500_000)

    assert refit.budget.cash_available_idr == 1_500_000
    assert refit.budget.committed_idr <= 1_500_000
    assert refit.budget.remaining_idr == 1_500_000 - refit.budget.committed_idr
    assert "BISKUIT-KHONG-GUAN" in refit.budget.deferred_skus

    deferred_rec = next(r for r in refit.recommendations if r.sku == "BISKUIT-KHONG-GUAN")
    assert any(f.key == FactorKey.CASH_TIGHT for f in deferred_rec.factors)
    assert deferred_rec.action == ActionType.REORDER  # never demoted, only deferred
    assert "besok" in deferred_rec.rationale_bahasa


def test_refit_loose_cash_restores_deferred():
    """With ample cash, the authored Lebaran deferral (tepung) is restored."""
    base = get_demo_briefing(Scenario.LEBARAN_T14, "warung-bu-sari")
    refit = refit_budget(base, 10_000_000)

    assert refit.budget.deferred_skus == []
    assert refit.budget.committed_idr == 2_742_000  # sirup + biskuit + tepung
    tepung = next(r for r in refit.recommendations if r.sku == "TEPUNG-TERIGU-1KG")
    assert not any(f.key == FactorKey.CASH_TIGHT for f in tepung.factors)
    assert "besok" not in tepung.rationale_bahasa


def test_refit_same_cash_is_noop():
    base = get_demo_briefing(Scenario.BASELINE, "warung-bu-sari")
    assert refit_budget(base, base.budget.cash_available_idr) is base


def test_waste_risk_derived_from_shelf_life():
    """Perishable stock that outlives its shelf days must raise WASTE_RISK."""
    snapshot = build_shop_snapshot("warung-bu-sari", DEMO_DAY, 700000)
    snapshot.stock_units["ROTI-BASAH"] = 40  # ~13 days of stock, shelf = 4 days
    briefing = compute_outputs(snapshot).briefing

    waste = [r for r in briefing.risks if r.type == RiskType.WASTE_RISK]
    roti = next((r for r in waste if r.sku == "ROTI-BASAH"), None)
    assert roti is not None
    assert roti.severity >= 2
    assert roti.window == DEMO_DAY + timedelta(days=4)


def test_router_serves_refit_budget_for_cash_param():
    """GET with cash_available_idr re-fits the authored snapshot in pure code."""

    async def call():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            tight = await client.get(
                "/api/v1/briefings/shops/warung-bu-sari/briefings/2026-10-10",
                params={"scenario": "LEBARAN_T14", "cash_available_idr": 1_500_000},
            )
            base = await client.get(
                "/api/v1/briefings/shops/warung-bu-sari/briefings/2026-10-10",
                params={"scenario": "LEBARAN_T14"},
            )
        return tight, base

    import asyncio

    tight, base = asyncio.run(call())

    assert tight.status_code == 200
    assert base.status_code == 200
    tight_data = tight.json()
    base_data = base.json()

    assert base_data["budget"]["cash_available_idr"] == 2_500_000
    assert tight_data["budget"]["cash_available_idr"] == 1_500_000
    assert tight_data["budget"]["committed_idr"] <= 1_500_000
    # The bundle composition visibly changes: at 1.5jt the biskuit (1.62jt)
    # cannot fund, while the cheaper tepung does — the authored deferral flips.
    assert "BISKUIT-KHONG-GUAN" in tight_data["budget"]["deferred_skus"]
    assert "TEPUNG-TERIGU-1KG" not in tight_data["budget"]["deferred_skus"]
    assert tight_data["budget"]["deferred_skus"] != base_data["budget"]["deferred_skus"]
