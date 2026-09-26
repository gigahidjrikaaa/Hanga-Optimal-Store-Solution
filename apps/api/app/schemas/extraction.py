"""
Hanga API — Pydantic schemas for extraction pipeline.

Covers notebook photo extraction, ConfirmSheet data, and catalog SKUs.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class ExtractionStatus(StrEnum):
    """Processing status for a notebook extraction."""

    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    REVIEW = "REVIEW"
    CONFIRMED = "CONFIRMED"
    FAILED = "FAILED"


class ExtractedLine(BaseModel):
    """A single line item extracted from a notebook photo."""

    model_config = {"protected_namespaces": ()}

    name: str = Field(..., description="Product name as read from the notebook")
    qty: float = Field(..., ge=0, description="Quantity value")
    unit: str = Field(..., description="Unit of measure, e.g. 'kg', 'bungkus', 'butir'")
    matched_sku: str | None = Field(
        default=None, description="Matched SKU from catalog, if resolved"
    )
    model_confidence: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Model confidence score for this line"
    )


class Extraction(BaseModel):
    """A complete notebook extraction record."""

    id: str = Field(..., description="Extraction document ID")
    shop_id: str
    created_at: datetime
    photo_storage_path: str = Field(..., description="Firebase Storage path to the photo")
    status: ExtractionStatus = ExtractionStatus.PENDING
    raw_model_json: dict | None = Field(
        default=None, description="Raw JSON output from Gemini Flash"
    )
    lines: list[ExtractedLine] = Field(default_factory=list)
    confirmed_at: datetime | None = None


class ConfirmSheetUpdate(BaseModel):
    """Payload from the ConfirmSheet UI — user-corrected extraction lines."""

    lines: list[ExtractedLine] = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Catalog
# ---------------------------------------------------------------------------


class CatalogCategory(StrEnum):
    """Product categories for the SKU catalog."""

    BAHAN_POKOK = "BAHAN_POKOK"
    MINUMAN = "MINUMAN"
    SNACK = "SNACK"
    BUMBU = "BUMBU"
    PERAWATAN = "PERAWATAN"
    LAINNYA = "LAINNYA"


class CatalogItem(BaseModel):
    """A SKU entry in the shared catalog."""

    sku: str = Field(..., description="Unique SKU code, e.g. 'GULA-1KG'")
    name: str = Field(..., description="Product display name in Bahasa")
    unit: str = Field(..., description="Default unit of measure")
    category: CatalogCategory
    perishable: bool = Field(default=False, description="Whether the item is perishable")
    shelf_days: int | None = Field(
        default=None, ge=1, description="Shelf life in days, if perishable"
    )
