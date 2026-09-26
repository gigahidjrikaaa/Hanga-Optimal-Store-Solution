"""
Test DailyBriefing schema validation.

Ensures the Pydantic models correctly validate and reject data
matching the contract in briefing_spec.md §2.
"""

from datetime import date, datetime, timezone

import pytest

from app.schemas.briefing import (
    ActionType,
    Confidence,
    DailyBriefing,
    Factor,
    FactorKey,
    Movers,
    Mover,
    OrderDraft,
    QuantityRange,
    Recommendation,
    Scenario,
)


def _make_briefing(**overrides) -> dict:
    """Create a valid briefing dict with optional overrides."""
    base = {
        "version": "1.0",
        "shop_id": "warung-bu-sari",
        "generated_at": "2026-10-10T06:00:00+07:00",
        "scenario": "BASELINE",
        "headline": "Gula dan minyak laris — pertimbangkan pesan ulang hari ini",
        "movers": {
            "fast": [{"sku": "GULA-1KG", "name": "Gula pasir 1kg", "delta_7d": 0.22}],
            "slow": [{"sku": "SUSU-UHT-1L", "name": "Susu UHT 1L", "delta_7d": -0.31}],
        },
        "risks": [],
        "recommendations": [],
    }
    base.update(overrides)
    return base


class TestDailyBriefingSchema:
    """Tests for the DailyBriefing Pydantic model."""

    def test_valid_minimal_briefing(self) -> None:
        """A minimal valid briefing should parse without errors."""
        data = _make_briefing()
        briefing = DailyBriefing.model_validate(data)
        assert briefing.shop_id == "warung-bu-sari"
        assert briefing.scenario == Scenario.BASELINE
        assert len(briefing.movers.fast) == 1

    def test_valid_full_briefing_with_recommendation(self) -> None:
        """A fully populated briefing with recommendations should parse."""
        data = _make_briefing(
            recommendations=[
                {
                    "action": "REORDER",
                    "sku": "GULA-1KG",
                    "qty": {"min": 8, "likely": 12, "max": 15, "unit": "kg"},
                    "confidence": "HIGH",
                    "factors": [
                        {
                            "key": "PAYDAY",
                            "direction": "+",
                            "weight": 0.18,
                            "note_bahasa": "gajian 28 Okt",
                        }
                    ],
                    "rationale_bahasa": "Pesan 12 kg gula: gajian menaikkan permintaan.",
                    "order_draft": {
                        "supplier_ref": "TOKO GROSIR JAYA",
                        "est_cost_idr": 171000,
                        "wa_deep_link": "https://wa.me/62812xxxx?text=...",
                    },
                }
            ]
        )
        briefing = DailyBriefing.model_validate(data)
        assert len(briefing.recommendations) == 1
        rec = briefing.recommendations[0]
        assert rec.action == ActionType.REORDER
        assert rec.confidence == Confidence.HIGH
        assert rec.qty.likely == 12

    def test_headline_max_length(self) -> None:
        """Headline exceeding 80 chars should be rejected."""
        data = _make_briefing(headline="x" * 81)
        with pytest.raises(Exception):
            DailyBriefing.model_validate(data)

    def test_invalid_scenario(self) -> None:
        """An unknown scenario string should be rejected."""
        data = _make_briefing(scenario="INVALID_SCENARIO")
        with pytest.raises(Exception):
            DailyBriefing.model_validate(data)

    def test_invalid_factor_key(self) -> None:
        """A factor key not in the canonical vocabulary should be rejected."""
        data = _make_briefing(
            recommendations=[
                {
                    "action": "REORDER",
                    "sku": "GULA-1KG",
                    "qty": {"min": 8, "likely": 12, "max": 15, "unit": "kg"},
                    "confidence": "HIGH",
                    "factors": [
                        {
                            "key": "NOT_A_REAL_FACTOR",
                            "direction": "+",
                            "weight": 0.18,
                            "note_bahasa": "test",
                        }
                    ],
                    "rationale_bahasa": "Test rationale.",
                }
            ]
        )
        with pytest.raises(Exception):
            DailyBriefing.model_validate(data)

    def test_max_five_recommendations(self) -> None:
        """More than 5 recommendation cards should be rejected (briefing spec §4)."""
        rec_template = {
            "action": "HOLD",
            "sku": "TEST",
            "qty": {"min": 1, "likely": 2, "max": 3, "unit": "pcs"},
            "confidence": "LOW",
            "factors": [],
            "rationale_bahasa": "Test.",
        }
        data = _make_briefing(recommendations=[rec_template] * 6)
        with pytest.raises(Exception):
            DailyBriefing.model_validate(data)
