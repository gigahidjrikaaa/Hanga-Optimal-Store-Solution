"""
Hanga API — Deterministic synthetic sales history.

Generates ~90 days of plausible per-SKU sales for Warung Bu Sari with local
context baked in (weekend rushes, payday windows, rainy spells, SKU-specific
trends). Fully seeded: the same date + seed always produce the same history,
so demos are reproducible and the compute layer is unit-testable without
Firestore.

In live mode the compute layer prefers the shop's real `sales/{date}`
documents; this generator is the fallback when a shop has no history yet.
"""

from __future__ import annotations

import random
from datetime import date, timedelta

from app.services.catalog_data import BU_SARI_CATALOG, BU_SARI_STOCK
from app.services.compute import CatalogEntry, ShopSnapshot, is_payday_window, is_weekend

# Average units sold per day, calibrated so 7d moving averages and reorder
# math land near the authored demo quantities (e.g. ~15 kg gula orders).
BASE_DAILY: dict[str, float] = {
    "GULA-1KG": 1.6,
    "TELUR-1KG": 1.4,
    "KOPI-KAPALAPI": 2.2,
    "SUSU-UHT-1L": 0.8,
    "MINYAK-GORENG-2L": 0.5,
    "SABUN-COLEK": 0.3,
    "BERAS-PANDAN-5KG": 0.45,
    "ROKOK-SAMP-16": 1.5,
    "IKAN-ASIN-100G": 0.6,
    "MIE-INSTAN-GORENG": 0.35,
    "SIRUP-MARJAN-650ML": 0.5,
    "BISKUIT-KHONG-GUAN": 0.4,
    "TEPUNG-TERIGU-1KG": 0.9,
    "MIE-SOTO-AYAM": 0.15,
    "KOPI-JAHE-SACHET": 0.8,
    "TOLAK-ANGIN": 0.3,
    "ES-KRIM-CONE": 0.8,
    "ROTI-BASAH": 3.0,
}

# SKUs with a visible 7-day trend (multiplier applied across the window).
TREND_MULTIPLIER: dict[str, float] = {
    "GULA-1KG": 1.15,
    "TELUR-1KG": 1.12,
    "KOPI-KAPALAPI": 1.10,
    "SUSU-UHT-1L": 0.78,
    "SABUN-COLEK": 0.90,
}


def generate_sales_history(
    end_date: date,
    days: int = 90,
    seed: int = 42,
    catalog: list[CatalogEntry] | None = None,
) -> dict[date, dict[str, float]]:
    """Deterministic daily per-SKU sales ending on `end_date` (inclusive)."""
    catalog = catalog or BU_SARI_CATALOG
    rng = random.Random(seed)
    # A handful of rainy stretches across the window (foot traffic dips).
    rain_days: set[date] = set()
    for _ in range(6):
        start = end_date - timedelta(days=rng.randint(1, days - 3))
        for offset in range(rng.randint(1, 3)):
            rain_days.add(start - timedelta(days=offset))

    history: dict[date, dict[str, float]] = {}
    for offset in range(days - 1, -1, -1):
        day = end_date - timedelta(days=offset)
        day_mult = 1.0
        if is_weekend(day):
            day_mult *= 1.35
        if is_payday_window(day):
            day_mult *= 1.4
        if day in rain_days:
            day_mult *= 0.75

        day_sales: dict[str, float] = {}
        for entry in catalog:
            base = BASE_DAILY.get(entry.sku, 0.3)
            # Trend SKUs surge over the most recent 7 days so the computed
            # delta_7d (last-7 vs previous-7) crosses the movers threshold —
            # the way a genuine week-over-week trend shows up.
            trend = TREND_MULTIPLIER.get(entry.sku, 1.0) if offset < 7 else 1.0
            if day in rain_days:
                # Rain: hot drinks/noodles spike, fresh impulse items drop.
                if entry.rain_boom:
                    trend *= 1.6
                elif entry.perishable and entry.shelf_days is not None and entry.shelf_days <= 7:
                    trend *= 0.6
            noise = rng.uniform(0.85, 1.15)
            qty = base * day_mult * trend * noise
            day_sales[entry.sku] = round(qty, 1)
        history[day] = day_sales
    return history


def build_shop_snapshot(
    shop_id: str,
    today: date,
    cash_available_idr: int,
    scenario: str = "BASELINE",
    sales: dict[date, dict[str, float]] | None = None,
) -> ShopSnapshot:
    """Assemble a ShopSnapshot from the seeded catalog (+ synthetic history by default)."""
    from app.schemas.briefing import Scenario

    return ShopSnapshot(
        shop_id=shop_id,
        today=today,
        sales=sales if sales is not None else generate_sales_history(today),
        catalog={e.sku: e for e in BU_SARI_CATALOG},
        stock_units=dict(BU_SARI_STOCK),
        cash_available_idr=cash_available_idr,
        scenario=Scenario(scenario),
        confirmed_lines=214,
    )
