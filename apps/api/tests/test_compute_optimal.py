"""
Unit tests for the optimal inventory features:
- Wholesale pack sizing & MOQ
- Stochastic safety stock based on demand variance
- Bounded Knapsack step-down allocation
- Contextual operational hints
"""

from datetime import date
import pytest

from app.schemas.briefing import ActionType, FactorKey
from app.services.compute import (
    CatalogEntry,
    ShopSnapshot,
    compute_outputs,
    refit_budget,
)
from app.services.synthetic import build_shop_snapshot

DEMO_DAY = date(2026, 10, 10)


def test_wholesale_pack_sizing_and_moq():
    """Items with pack_size > 1 must snap to integer pack multiples and display wholesale units."""
    catalog = {
        "INDOMIE-DUS": CatalogEntry(
            sku="INDOMIE-DUS",
            name="Indomie Goreng",
            unit="bungkus",
            unit_cost_idr=3000,
            pack_unit="karton",
            pack_size=40.0,
            moq=1,
            target_service_level=0.95,
        )
    }
    # Sales: 10 bungkus per day, stock: 15 bungkus.
    # Target 8 days = 80 bungkus + safety stock, needed = ~70 bungkus.
    # In packs of 40: needs 2 karton = 80 bungkus.
    sales = {DEMO_DAY - date.resolution * i: {"INDOMIE-DUS": 10.0} for i in range(1, 15)}
    stock = {"INDOMIE-DUS": 15.0}

    snapshot = ShopSnapshot(
        shop_id="test-shop",
        today=DEMO_DAY,
        sales=sales,
        catalog=catalog,
        stock_units=stock,
        cash_available_idr=1_000_000,
    )
    briefing = compute_outputs(snapshot).briefing
    reorders = [r for r in briefing.recommendations if r.sku == "INDOMIE-DUS"]
    assert len(reorders) == 1
    rec = reorders[0]
    assert rec.qty.likely % 40 == 0
    assert rec.qty.pack_display is not None
    assert "karton" in rec.qty.pack_display
    assert rec.hint_bahasa is not None
    assert "karton" in rec.hint_bahasa


def test_knapsack_step_down_under_tight_budget():
    """When full order cannot fit into remaining cash, knapsack steps down pack count."""
    catalog = {
        "TELUR": CatalogEntry(
            sku="TELUR",
            name="Telur Ayam",
            unit="kg",
            unit_cost_idr=30000,
            pack_unit="peti",
            pack_size=5.0,  # 150,000 per peti
            moq=1,
        )
    }
    # Needed: 2 peti = 10 kg (cost = 300,000 IDR)
    # Cash available: only 200,000 IDR
    # Instead of deferring completely, should step down to 1 peti = 5 kg (cost = 150,000 IDR)
    sales = {DEMO_DAY - date.resolution * i: {"TELUR": 2.0} for i in range(1, 15)}
    stock = {"TELUR": 2.0}

    snapshot = ShopSnapshot(
        shop_id="test-shop",
        today=DEMO_DAY,
        sales=sales,
        catalog=catalog,
        stock_units=stock,
        cash_available_idr=200_000,
    )
    briefing = compute_outputs(snapshot).briefing
    reorders = [r for r in briefing.recommendations if r.sku == "TELUR"]
    assert len(reorders) == 1
    rec = reorders[0]
    # Should be funded at 1 peti (5 kg) instead of being deferred!
    assert not any(f.key == FactorKey.CASH_TIGHT for f in rec.factors)
    assert rec.qty.likely == 5
    assert briefing.budget.committed_idr == 150_000
    assert "Disesuaikan" in (rec.hint_bahasa or "")


def test_safety_stock_adjusts_for_high_variance():
    """Higher variance in daily sales produces a larger safety stock buffer."""
    # Product A: steady 5 units/day
    sales_steady = {DEMO_DAY - date.resolution * i: {"PROD-A": 5.0} for i in range(1, 15)}
    # Product B: erratic (alternating 0 and 10 units/day)
    sales_erratic = {DEMO_DAY - date.resolution * i: {"PROD-B": 10.0 if i % 2 == 0 else 0.0} for i in range(1, 15)}

    sales_merged = {}
    for d in sales_steady:
        sales_merged[d] = {"PROD-A": sales_steady[d]["PROD-A"], "PROD-B": sales_erratic[d]["PROD-B"]}

    catalog = {
        "PROD-A": CatalogEntry(sku="PROD-A", name="Steady", unit="pcs", unit_cost_idr=1000),
        "PROD-B": CatalogEntry(sku="PROD-B", name="Erratic", unit="pcs", unit_cost_idr=1000),
    }
    stock = {"PROD-A": 10.0, "PROD-B": 10.0}

    snapshot = ShopSnapshot(
        shop_id="test-shop",
        today=DEMO_DAY,
        sales=sales_merged,
        catalog=catalog,
        stock_units=stock,
        cash_available_idr=1_000_000,
    )
    result = compute_outputs(snapshot)
    recs = {r.sku: r for r in result.briefing.recommendations}
    # Erratic demand requires larger safety stock, hence higher likely order quantity
    assert recs["PROD-B"].qty.likely > recs["PROD-A"].qty.likely
