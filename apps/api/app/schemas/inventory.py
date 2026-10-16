"""
Inventory schemas for Hanga store management.
"""

from pydantic import BaseModel, Field


class InventoryItem(BaseModel):
    sku: str
    name: str
    category: str
    unit: str
    stock_qty: float
    unit_cost_idr: int
    total_value_idr: int
    daily_velocity: float
    days_of_coverage: float
    safety_stock: float
    status: str = Field(description="CRITICAL, LOW, SAFE, OVERSTOCK, or EXPIRED_RISK")
    perishable: bool = False
    shelf_days: int | None = None
    pack_display: str | None = None
    supplier_ref: str | None = None


class InventoryOverview(BaseModel):
    shop_id: str
    total_skus: int
    total_inventory_value_idr: int
    low_stock_count: int
    waste_risk_count: int
    safe_stock_count: int
    items: list[InventoryItem]
