"""
Tests for the authentication dependency and shop-access guard.

Demo mode (the default) must keep serving the seeded demo principal without a
token; live mode must reject unauthenticated and tampered requests.
"""

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app

client = TestClient(app)


def test_demo_mode_allows_request_without_token():
    """Default demo mode: no Authorization header → demo principal serves the briefing."""
    resp = client.get("/api/v1/briefings/shops/warung-bu-sari/briefings/2026-10-10?scenario=BASELINE")
    assert resp.status_code == 200
    assert resp.json()["shop_id"] == "warung-bu-sari"


def test_live_mode_rejects_missing_token(monkeypatch):
    """Live mode (demo off): no Authorization header → 401, generic message."""
    monkeypatch.setattr(settings, "demo_mode", False)
    resp = client.get("/api/v1/briefings/shops/warung-bu-sari/briefings/2026-10-10")
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Authentication required"


def test_live_mode_rejects_invalid_token(monkeypatch):
    """Live mode: a garbage bearer token must fail verification → 401."""
    monkeypatch.setattr(settings, "demo_mode", False)
    resp = client.get(
        "/api/v1/briefings/shops/warung-bu-sari/briefings/2026-10-10",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert resp.status_code == 401
    # Generic message — no detail leaks about *why* verification failed
    assert resp.json()["detail"] == "Invalid authentication token"


def test_demo_shop_access_allows_demo_shop():
    """Demo principal may access the demo shop end-to-end (extraction confirm)."""
    created = client.post(
        "/api/v1/extractions/shops/warung-bu-sari/extractions",
        files={"photo": ("notebook.jpg", b"fake-image-bytes", "image/jpeg")},
    )
    assert created.status_code == 201
    extraction_id = created.json()["id"]

    confirmed = client.put(
        f"/api/v1/extractions/shops/warung-bu-sari/extractions/{extraction_id}/confirm",
        json={
            "lines": [
                {"name": "Gula pasir", "qty": 5, "unit": "kg", "matched_sku": "GULA-1KG"}
            ]
        },
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "CONFIRMED"
