"""
Hanga API — Orders router.

Persists WhatsApp order drafts (briefing_spec.md §6: shops/{shopId}/orders/{id}).
Demo mode keeps orders in memory; live mode writes Firestore with an in-memory
fallback so the demo loop never breaks.
"""

import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies.auth import Principal, ensure_shop_access, get_current_principal
from app.schemas.order import Order, OrderCreate, OrderStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders")

# In-memory demo store, newest last. Survives for the process lifetime only.
_DEMO_ORDERS: dict[str, Order] = {}


@router.post(
    "/shops/{shop_id}/orders",
    response_model=Order,
    status_code=201,
    summary="Draft an order (WhatsApp CTA)",
)
async def create_order(
    shop_id: str,
    body: OrderCreate,
    principal: Principal = Depends(get_current_principal),
) -> Order:
    """Persist an order draft when the owner taps 'Pesan via WhatsApp'."""
    ensure_shop_access(principal, shop_id)

    order = Order(
        id=f"ORD-{uuid.uuid4().hex[:8]}",
        shop_id=shop_id,
        created_at=datetime.now(),
        scenario=body.scenario,
        supplier_ref=body.supplier_ref,
        wa_deep_link=body.wa_deep_link,
        items=body.items,
        est_cost_idr=sum(item.est_cost_idr for item in body.items),
        status=OrderStatus.DRAFTED,
    )

    _DEMO_ORDERS[order.id] = order
    if not _demo_mode():
        try:
            from app.services.firestore import FirestoreService

            await FirestoreService().save_order(order)
            return order
        except Exception as exc:
            logger.warning("Firestore order save failed (%s); kept in memory", exc)
    return order


@router.get(
    "/shops/{shop_id}/orders",
    response_model=list[Order],
    summary="List order drafts (newest first)",
)
async def list_orders(
    shop_id: str,
    limit: int = 20,
    principal: Principal = Depends(get_current_principal),
) -> list[Order]:
    ensure_shop_access(principal, shop_id)

    if not _demo_mode():
        try:
            from app.services.firestore import FirestoreService

            orders = await FirestoreService().get_orders(shop_id, limit=limit)
            if orders:
                return orders
        except Exception as exc:
            logger.warning("Firestore order list failed (%s); using memory", exc)

    orders = [o for o in _DEMO_ORDERS.values() if o.shop_id == shop_id]
    orders.sort(key=lambda o: o.created_at, reverse=True)
    return orders[:limit]


@router.put(
    "/shops/{shop_id}/orders/{order_id}/sent",
    response_model=Order,
    summary="Mark an order as sent via WhatsApp",
)
async def mark_order_sent(
    shop_id: str,
    order_id: str,
    principal: Principal = Depends(get_current_principal),
) -> Order:
    ensure_shop_access(principal, shop_id)

    order = _DEMO_ORDERS.get(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = OrderStatus.SENT
    order.sent_at = datetime.now()
    _DEMO_ORDERS[order_id] = order

    if not _demo_mode():
        try:
            from app.services.firestore import FirestoreService

            await FirestoreService().update_order_status(
                shop_id, order_id, OrderStatus.SENT
            )
        except Exception as exc:
            logger.warning("Firestore order status update failed (%s)", exc)
    return order


def _demo_mode() -> bool:
    from app.config import settings

    return settings.demo_mode
