"""
Hanga API — Pydantic schemas for the DailyBriefing JSON contract.

These schemas are the single source of truth shared between the compute layer,
the Gemma validation loop, and the frontend. They mirror the v1 contract in
docs/briefing_spec.md exactly.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums (canonical keys from the briefing spec §3 & §4)
# ---------------------------------------------------------------------------


class Scenario(StrEnum):
    """Supported scenario types for the briefing."""

    BASELINE = "BASELINE"
    LEBARAN_T14 = "LEBARAN_T14"
    PAYDAY_T3 = "PAYDAY_T3"
    RAIN_TOMORROW = "RAIN_TOMORROW"


class ActionType(StrEnum):
    """Recommendation action types."""

    REORDER = "REORDER"
    SKIP = "SKIP"
    PROMO = "PROMO"
    HOLD = "HOLD"


class RiskType(StrEnum):
    """Risk classification types."""

    WASTE_RISK = "WASTE_RISK"
    STOCKOUT_RISK = "STOCKOUT_RISK"


class FactorKey(StrEnum):
    """Canonical factor vocabulary — Gemma may only use these keys."""

    PAYDAY = "PAYDAY"
    WEEKEND = "WEEKEND"
    RAIN = "RAIN"
    LEBARAN_T14 = "LEBARAN_T14"
    LEBARAN_WEEK = "LEBARAN_WEEK"
    EVENT_KONDANGAN = "EVENT_KONDANGAN"
    EVENT_PASAR = "EVENT_PASAR"
    SCHOOL_TERM = "SCHOOL_TERM"
    TREND_UP = "TREND_UP"
    TREND_DOWN = "TREND_DOWN"
    WASTE_RISK = "WASTE_RISK"
    LOW_DATA = "LOW_DATA"
    RAIN_TOMORROW = "RAIN_TOMORROW"


class Confidence(StrEnum):
    """Confidence level — computed in code, never by the LLM."""

    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


# ---------------------------------------------------------------------------
# Sub-schemas
# ---------------------------------------------------------------------------


class Mover(BaseModel):
    """A product with significant 7-day sales delta."""

    sku: str = Field(..., description="SKU identifier, e.g. 'GULA-1KG'")
    name: str = Field(..., description="Human-readable product name in Bahasa")
    delta_7d: float = Field(..., description="7-day sales change as a decimal (0.22 = +22%)")


class Movers(BaseModel):
    """Fast-moving and slow-moving product lists."""

    fast: list[Mover] = Field(default_factory=list, max_length=5)
    slow: list[Mover] = Field(default_factory=list, max_length=5)


class Risk(BaseModel):
    """A waste or stockout risk alert."""

    type: RiskType
    sku: str
    window: date = Field(..., description="Projected risk date")
    severity: int = Field(..., ge=1, le=3, description="1 = low, 3 = critical")
    factor_keys: list[FactorKey] = Field(default_factory=list)


class Factor(BaseModel):
    """A contributing factor with direction and weight."""

    key: FactorKey
    direction: Literal["+", "-"]
    weight: float = Field(..., description="Signed weight, e.g. 0.18 or -0.10")
    note_bahasa: str = Field(
        ..., max_length=80, description="Short Bahasa explanation of the factor"
    )


class QuantityRange(BaseModel):
    """Min/likely/max quantity range — never point estimates."""

    min: int = Field(..., ge=0)
    likely: int = Field(..., ge=0)
    max: int = Field(..., ge=0)
    unit: str = Field(..., description="Unit of measure, e.g. 'kg', 'tray', 'pcs'")


class OrderDraft(BaseModel):
    """Pre-filled order draft for WhatsApp deep link."""

    supplier_ref: str = Field(..., description="Supplier name for display")
    est_cost_idr: int = Field(..., ge=0, description="Estimated cost in IDR")
    wa_deep_link: str = Field(..., description="WhatsApp deep link URL with pre-filled message")


class Recommendation(BaseModel):
    """A single recommendation card — the core unit of the briefing."""

    action: ActionType
    sku: str
    qty: QuantityRange
    confidence: Confidence
    factors: list[Factor] = Field(default_factory=list, max_length=4)
    rationale_bahasa: str = Field(
        ...,
        max_length=160,
        description="Plain Bahasa rationale, ≤160 chars, no model jargon",
    )
    order_draft: OrderDraft | None = None


class BaselineCompare(BaseModel):
    """Comparison deltas vs the naive baseline policy."""

    policy: str = Field(default="7d_moving_avg", description="Baseline policy name")
    deltas: dict[str, float] = Field(
        default_factory=dict,
        description="Improvement deltas, e.g. {'waste_pct': -18, 'stockout_pct': -35}",
    )


class DataQuality(BaseModel):
    """Data quality indicators for transparency."""

    coverage_days: int = Field(..., ge=0)
    extraction_confirmed_lines: int = Field(..., ge=0)
    flags: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Root schema
# ---------------------------------------------------------------------------


class DailyBriefing(BaseModel):
    """
    The complete DailyBriefing JSON schema (v1).

    This is the contract between the Cloud Run compute layer, Gemma,
    Firestore, and the frontend UI. See docs/briefing_spec.md §2.
    """

    version: str = Field(default="1.0", description="Schema version")
    shop_id: str
    generated_at: datetime
    scenario: Scenario
    headline: str = Field(..., max_length=80, description="Bahasa headline, ≤80 chars")
    movers: Movers
    risks: list[Risk] = Field(default_factory=list)
    recommendations: list[Recommendation] = Field(default_factory=list, max_length=5)
    baseline_compare: BaselineCompare | None = None
    data_quality: DataQuality | None = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "version": "1.0",
                    "shop_id": "warung-bu-sari",
                    "generated_at": "2026-10-10T06:00:00+07:00",
                    "scenario": "BASELINE",
                    "headline": "Gula dan minyak laris — pertimbangkan pesan ulang hari ini",
                    "movers": {
                        "fast": [{"sku": "GULA-1KG", "name": "Gula pasir 1kg", "delta_7d": 0.22}],
                        "slow": [
                            {"sku": "SUSU-UHT-1L", "name": "Susu UHT 1L", "delta_7d": -0.31}
                        ],
                    },
                    "risks": [],
                    "recommendations": [],
                }
            ]
        }
    }
