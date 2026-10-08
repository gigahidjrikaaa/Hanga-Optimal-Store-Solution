"""
Tests for the shop profile endpoint (cold-start interview write side).
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
SHOP = "warung-bu-sari"


def test_profile_roundtrip():
    """PUT from the onboarding interview → GET returns it with the cash."""
    saved = client.put(
        f"/api/v1/shops/{SHOP}/profile",
        json={
            "owner_name": "Bu Sari",
            "shop_name": "Warung Berkah Jaya",
            "top_items": "Gula, Minyak, Telur",
            "supplier_name": "TOKO GROSIR JAYA",
            "cash_available_idr": 500000,
        },
    )
    assert saved.status_code == 200
    profile = saved.json()
    assert profile["shop_id"] == SHOP
    assert profile["cash_available_idr"] == 500000
    assert profile["updated_at"] is not None

    fetched = client.get(f"/api/v1/shops/{SHOP}/profile")
    assert fetched.status_code == 200
    assert fetched.json()["owner_name"] == "Bu Sari"
    assert fetched.json()["cash_available_idr"] == 500000


def test_profile_requires_owner_name():
    resp = client.put(
        f"/api/v1/shops/{SHOP}/profile",
        json={"owner_name": "", "shop_name": "X"},
    )
    assert resp.status_code == 422


def test_profile_cash_must_be_nonnegative():
    resp = client.put(
        f"/api/v1/shops/{SHOP}/profile",
        json={"owner_name": "Bu Sari", "shop_name": "X", "cash_available_idr": -1},
    )
    assert resp.status_code == 422
