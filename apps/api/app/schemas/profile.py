"""
Hanga API — Pydantic schemas for the shop profile (briefing_spec.md §6).

Written by the frontend via the cold-start interview (onboarding); the cash
answer feeds the budget block on every briefing.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ShopProfileCreate(BaseModel):
    """Payload from the onboarding interview."""

    owner_name: str = Field(..., min_length=1, max_length=80)
    shop_name: str = Field(..., min_length=1, max_length=80)
    top_items: str = Field(default="", max_length=200)
    supplier_name: str = Field(default="", max_length=80)
    cash_available_idr: int = Field(default=0, ge=0)


class ShopProfile(ShopProfileCreate):
    """Stored profile — shop-bound and timestamped."""

    model_config = {"protected_namespaces": ()}

    shop_id: str
    updated_at: datetime
