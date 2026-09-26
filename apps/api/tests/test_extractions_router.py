"""
Hanga API — Tests for the Extractions router.

Verifies notebook photo upload, mock/demo vision extraction, and ConfirmSheet updates.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.extraction import ExtractionStatus


@pytest.mark.asyncio
async def test_create_and_confirm_extraction():
    """Verify photo upload → extraction generation → confirm update pipeline."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Upload dummy photo
        dummy_image = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb"
        response = await client.post(
            "/api/v1/extractions/shops/warung-bu-sari/extractions",
            files={"photo": ("notebook.jpg", dummy_image, "image/jpeg")},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == ExtractionStatus.REVIEW.value
        assert len(data["lines"]) >= 4
        extraction_id = data["id"]

        # 2. Get extraction
        get_res = await client.get(
            f"/api/v1/extractions/shops/warung-bu-sari/extractions/{extraction_id}"
        )
        assert get_res.status_code == 200
        assert get_res.json()["id"] == extraction_id

        # 3. Confirm extraction
        confirm_body = {
            "lines": [
                {
                    "matched_sku": "GULA-1KG",
                    "name": "Gula pasir",
                    "qty": 6.0,
                    "unit": "kg",
                    "model_confidence": 0.95,
                }
            ]
        }
        confirm_res = await client.put(
            f"/api/v1/extractions/shops/warung-bu-sari/extractions/{extraction_id}/confirm",
            json=confirm_body,
        )
        assert confirm_res.status_code == 200
        confirmed_data = confirm_res.json()
        assert confirmed_data["status"] == ExtractionStatus.CONFIRMED.value
        assert len(confirmed_data["lines"]) == 1
        assert confirmed_data["lines"][0]["qty"] == 6.0
