"""
Hanga API — Sales write-back service.

Turns confirmed extraction lines into daily per-SKU sales records
(briefing_spec.md §6: shops/{shopId}/sales/{date}). Demo mode keeps an
in-memory store (queryable via the sales endpoint, mergeable into the
compute snapshot); live mode writes Firestore additively.
"""

from __future__ import annotations

import logging
from datetime import date

from app.config import settings
from app.schemas.extraction import ExtractedLine

logger = logging.getLogger(__name__)

# Demo-mode in-memory sales: {shop_id: {date: {sku: qty}}}
_DEMO_SALES: dict[str, dict[date, dict[str, float]]] = {}


async def record_confirmed_sales(
    shop_id: str, lines: list[ExtractedLine], sales_date: date
) -> dict[str, float]:
    """
    Merge confirmed extraction lines into the shop's sales history.

    Only lines with a matched SKU map to sales; unmatched lines are counted
    later via data-quality flags. Returns the quantities recorded.
    """
    quantities: dict[str, float] = {}
    for line in lines:
        if line.matched_sku and line.qty > 0:
            quantities[line.matched_sku] = quantities.get(line.matched_sku, 0.0) + line.qty

    if not quantities:
        return {}

    if settings.demo_mode:
        shop_sales = _DEMO_SALES.setdefault(shop_id, {})
        existing = shop_sales.get(sales_date, {})
        for sku, qty in quantities.items():
            existing[sku] = existing.get(sku, 0.0) + qty
        shop_sales[sales_date] = existing
        logger.info(
            "Demo sales recorded shop=%s date=%s skus=%s", shop_id, sales_date, list(quantities)
        )
        return quantities

    try:
        from app.services.firestore import FirestoreService

        await FirestoreService().merge_sales(shop_id, sales_date, quantities)
    except Exception as exc:
        logger.warning("Firestore sales write failed (%s); demo store only", exc)
    return quantities


def get_demo_sales(shop_id: str, sales_date: date | None = None) -> dict[date, dict[str, float]]:
    """Read the in-memory demo sales (all dates, or one day)."""
    shop_sales = _DEMO_SALES.get(shop_id, {})
    if sales_date is None:
        return dict(shop_sales)
    if sales_date in shop_sales:
        return {sales_date: shop_sales[sales_date]}
    return {}
