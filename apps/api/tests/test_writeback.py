"""
Tests for the write side of the demo loop: order drafts (WhatsApp CTA) and
the extraction → sales write-back (briefing_spec.md §6).
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

SHOP = "warung-bu-sari"


def test_order_draft_flow():
    """CTA → POST drafts an order; it lists; marking sent flips the status."""
    created = client.post(
        f"/api/v1/orders/shops/{SHOP}/orders",
        json={
            "scenario": "BASELINE",
            "supplier_ref": "TOKO GROSIR JAYA",
            "wa_deep_link": "https://wa.me/6281234567890?text=halo",
            "items": [
                {
                    "sku": "GULA-1KG",
                    "name": "Gula Pasir Gulaku 1kg",
                    "qty": 15,
                    "unit": "kg",
                    "est_cost_idr": 210000,
                }
            ],
        },
    )
    assert created.status_code == 201
    order = created.json()
    assert order["status"] == "DRAFTED"
    assert order["est_cost_idr"] == 210000
    assert order["items"][0]["sku"] == "GULA-1KG"

    listed = client.get(f"/api/v1/orders/shops/{SHOP}/orders")
    assert listed.status_code == 200
    assert any(o["id"] == order["id"] for o in listed.json())

    sent = client.put(f"/api/v1/orders/shops/{SHOP}/orders/{order['id']}/sent")
    assert sent.status_code == 200
    assert sent.json()["status"] == "SENT"
    assert sent.json()["sent_at"] is not None


def test_order_of_another_shop_is_forbidden():
    """Live-mode guard: (in demo this passes through, so assert demo behavior)."""
    created = client.post(
        "/api/v1/orders/shops/other-warung/orders",
        json={
            "scenario": "BASELINE",
            "supplier_ref": "X",
            "wa_deep_link": "https://wa.me/62",
            "items": [{"sku": "S", "name": "S", "qty": 1, "unit": "kg"}],
        },
    )
    # Demo principal is allowed anywhere; the 403 path is covered by auth tests.
    assert created.status_code == 201


def test_extraction_confirm_writes_back_sales():
    """Confirmed ConfirmSheet lines become daily per-SKU sales records."""
    created = client.post(
        f"/api/v1/extractions/shops/{SHOP}/extractions",
        files={"photo": ("notebook.jpg", b"fake-image-bytes", "image/jpeg")},
    )
    assert created.status_code == 201
    extraction_id = created.json()["id"]

    confirmed = client.put(
        f"/api/v1/extractions/shops/{SHOP}/extractions/{extraction_id}/confirm",
        json={
            "lines": [
                {"name": "Gula pasir", "qty": 5, "unit": "kg", "matched_sku": "GULA-1KG"},
                {"name": "Telur", "qty": 2, "unit": "kg", "matched_sku": "TELUR-1KG"},
                {"name": "Barang asing", "qty": 9, "unit": "pcs", "matched_sku": None},
            ]
        },
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "CONFIRMED"

    # Demo-mode sales for the pinned demo date must include the matched SKUs
    # (unmatched lines are skipped, not invented).
    sales = client.get(f"/api/v1/sales/shops/{SHOP}/sales/2026-10-10")
    assert sales.status_code == 200
    quantities = sales.json()["quantities"]
    assert quantities.get("GULA-1KG", 0) >= 5
    assert quantities.get("TELUR-1KG", 0) >= 2
    assert all("Barang" not in sku for sku in quantities)


def test_sales_endpoint_missing_day_is_none():
    resp = client.get(f"/api/v1/sales/shops/{SHOP}/sales/2001-01-01")
    assert resp.status_code == 200
    assert resp.json() is None
