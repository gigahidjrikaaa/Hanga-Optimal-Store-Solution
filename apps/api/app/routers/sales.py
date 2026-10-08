"""
Hanga API — Sales router.

Read access to daily per-SKU sales records, so the write-back from confirmed
extractions is inspectable (and unit-testable) in demo mode.
"""

from datetime import date

from fastapi import APIRouter, Depends

from app.dependencies.auth import Principal, ensure_shop_access, get_current_principal
from app.schemas.order import SalesRecord
from app.services import sales as sales_service

router = APIRouter(prefix="/sales")


@router.get(
    "/shops/{shop_id}/sales/{sales_date}",
    response_model=SalesRecord | None,
    summary="Get recorded sales for one day",
)
async def get_sales(
    shop_id: str,
    sales_date: date,
    principal: Principal = Depends(get_current_principal),
) -> SalesRecord | None:
    ensure_shop_access(principal, shop_id)

    if _demo_mode():
        found = sales_service.get_demo_sales(shop_id, sales_date)
        if not found:
            return None
        day = next(iter(found))
        return SalesRecord(date=day.isoformat(), quantities=found[day], source="extraction")

    try:
        from app.services.firestore import FirestoreService

        doc = await FirestoreService().get_sales(shop_id, sales_date)
        if doc is None:
            return None
        return SalesRecord(date=sales_date.isoformat(), quantities=doc, source="extraction")
    except Exception:
        return None


def _demo_mode() -> bool:
    from app.config import settings

    return settings.demo_mode
