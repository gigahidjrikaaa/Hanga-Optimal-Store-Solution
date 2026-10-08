"""
Hanga API — Pydantic schemas for order drafts.

Orders are the write-side of the WhatsApp loop (briefing_spec.md §6):
the frontend drafts an order when Bu Sari taps "Pesan via WhatsApp",
persists it, and marks it SENT after she opens the chat.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class OrderStatus(StrEnum):
    DRAFTED = "DRAFTED"
    SENT = "SENT"


class OrderItem(BaseModel):
    """One SKU line in an order draft."""

    sku: str
    name: str = Field(..., description="Product display name in Bahasa")
    qty: int = Field(..., ge=0, description="Ordered quantity (the 'likely' value)")
    unit: str
    est_cost_idr: int = Field(default=0, ge=0)


class OrderCreate(BaseModel):
    """Payload from the RecommendationCard CTA — a single-SKU draft."""

    scenario: str = Field(default="BASELINE")
    supplier_ref: str
    wa_deep_link: str
    items: list[OrderItem] = Field(..., min_length=1)


class Order(BaseModel):
    """A persisted order draft with status."""

    model_config = {"protected_namespaces": ()}

    id: str
    shop_id: str
    created_at: datetime
    scenario: str
    supplier_ref: str
    wa_deep_link: str
    items: list[OrderItem]
    est_cost_idr: int = Field(default=0, ge=0)
    status: OrderStatus = OrderStatus.DRAFTED
    sent_at: datetime | None = None


class SalesRecord(BaseModel):
    """A day of confirmed per-SKU sales (from extraction write-back)."""

    model_config = {"protected_namespaces": ()}

    date: str
    quantities: dict[str, float] = Field(default_factory=dict)
    source: str = Field(
        default="extraction", description="extraction | seed | manual"
    )
