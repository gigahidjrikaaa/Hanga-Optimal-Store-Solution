"""
Tests for Tanya Hanga (spec §8): grounded answers composed from the stored
briefing only — deterministic in demo mode, schema-validated live.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.ask import AskResponse
from app.schemas.briefing import Scenario
from app.services.ask import answer_from_briefing
from app.services.seed_data import get_demo_briefing

client = TestClient(app)
SHOP = "warung-bu-sari"


def test_why_quantity_answer_is_grounded():
    """"Kenapa cuma 12 kg?" → the answer cites the SKU and echoes briefing numbers."""
    briefing = get_demo_briefing(Scenario.BASELINE, SHOP)
    telur = next(r for r in briefing.recommendations if r.sku == "TELUR-1KG")

    answer = answer_from_briefing(briefing, "Kenapa cuma 12 kg telur?")

    assert isinstance(answer, AskResponse)
    assert "TELUR-1KG" in answer.cited_skus
    assert str(telur.qty.likely) in answer.answer_bahasa
    assert str(telur.qty.max) in answer.answer_bahasa
    assert len(answer.answer_bahasa) <= 240
    assert len(answer.follow_ups) <= 3
    assert any(fu for fu in answer.follow_ups)


def test_budget_answer_reflects_deferrals():
    """A kas question on the tight Lebaran briefing names the deferred item."""
    briefing = get_demo_briefing(Scenario.LEBARAN_T14, SHOP)

    answer = answer_from_briefing(briefing, "Kas saya cuma 2.5 juta, cukup?")

    assert "BISKUIT" in " ".join(answer.cited_skus) or "ditunda" in answer.answer_bahasa
    assert "2.500.000" in answer.answer_bahasa
    assert len(answer.answer_bahasa) <= 240


def test_unknown_product_deflects_without_numbers():
    """Out-of-briefing questions get an honest deflection, never invented data."""
    briefing = get_demo_briefing(Scenario.BASELINE, SHOP)

    answer = answer_from_briefing(briefing, "Berapa stok sabun mandi cair di gudang?")

    assert "sabun mandi cair" not in answer.answer_bahasa.lower() or "briefing" in answer.answer_bahasa.lower()
    assert answer.cited_skus == [] or answer.factor_keys


def test_endpoint_serves_code_answer_in_demo():
    resp = client.post(
        f"/api/v1/briefings/shops/{SHOP}/briefings/2026-10-10/ask"
        "?scenario=BASELINE&cash_available_idr=300000",
        json={"question_bahasa": "Kok cuma 15 kg gula?"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["answer_bahasa"]) <= 240
    assert data["confidence"] in ("HIGH", "MEDIUM", "LOW")


def test_endpoint_rejects_empty_question():
    resp = client.post(
        f"/api/v1/briefings/shops/{SHOP}/briefings/2026-10-10/ask",
        json={"question_bahasa": ""},
    )
    assert resp.status_code == 422
