"""
Hanga API — Inventory router.

Provides store inventory status, stock on hand, coverage days, and stock health KPIs.
"""

import logging
from fastapi import APIRouter, Depends

from app.dependencies.auth import Principal, ensure_shop_access, get_current_principal
from app.schemas.inventory import InventoryOverview
from app.services.seed_data import build_inventory_overview

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/inventory")


@router.get(
    "/shops/{shop_id}",
    response_model=InventoryOverview,
    summary="Get shop inventory overview and stock levels",
)
async def get_inventory(
    shop_id: str,
    principal: Principal = Depends(get_current_principal),
) -> InventoryOverview:
    """Read full inventory status, stock health, and catalog for the shop."""
    ensure_shop_access(principal, shop_id)
    return build_inventory_overview(shop_id)
