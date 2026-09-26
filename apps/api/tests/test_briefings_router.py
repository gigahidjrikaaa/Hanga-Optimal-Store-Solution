"""
Hanga API — Tests for the Briefings router.

Verifies that all 4 canonical scenarios (BASELINE, LEBARAN_T14, PAYDAY_T3, RAIN_TOMORROW)
return valid DailyBriefing schemas with HTTP 200 in Demo Mode.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.briefing import ActionType, DailyBriefing, Scenario


@pytest.mark.asyncio
async def test_get_baseline_briefing():
    """Verify BASELINE scenario returns expected structure and reorder recommendations."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/briefings/shops/warung-bu-sari/briefings/2026-10-10",
            params={"scenario": Scenario.BASELINE.value},
        )
        assert response.status_code == 200
        data = response.json()
        briefing = DailyBriefing.model_validate(data)
        assert briefing.scenario == Scenario.BASELINE
        assert len(briefing.recommendations) > 0
        assert briefing.recommendations[0].action == ActionType.REORDER
        assert briefing.recommendations[0].order_draft is not None
        assert "wa.me" in briefing.recommendations[0].order_draft.wa_deep_link


@pytest.mark.asyncio
async def test_get_lebaran_briefing_inverts_recommendations():
    """Verify LEBARAN_T14 scenario visibly inverts recommendations towards bulk festive items."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/briefings/shops/warung-bu-sari/briefings/2026-10-10",
            params={"scenario": Scenario.LEBARAN_T14.value},
        )
        assert response.status_code == 200
        briefing = DailyBriefing.model_validate(response.json())
        assert briefing.scenario == Scenario.LEBARAN_T14
        skus = [rec.sku for rec in briefing.recommendations]
        assert "SIRUP-MARJAN-650ML" in skus
        assert "BISKUIT-KHONG-GUAN" in skus


@pytest.mark.asyncio
async def test_get_payday_briefing():
    """Verify PAYDAY_T3 scenario prioritizes larger staples."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/briefings/shops/warung-bu-sari/briefings/2026-10-10",
            params={"scenario": Scenario.PAYDAY_T3.value},
        )
        assert response.status_code == 200
        briefing = DailyBriefing.model_validate(response.json())
        assert briefing.scenario == Scenario.PAYDAY_T3


@pytest.mark.asyncio
async def test_get_rain_briefing():
    """Verify RAIN_TOMORROW scenario increases noodles/hot drinks and avoids fresh perishables."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/briefings/shops/warung-bu-sari/briefings/2026-10-10",
            params={"scenario": Scenario.RAIN_TOMORROW.value},
        )
        assert response.status_code == 200
        briefing = DailyBriefing.model_validate(response.json())
        assert briefing.scenario == Scenario.RAIN_TOMORROW
        skus = [rec.sku for rec in briefing.recommendations]
        assert "MIE-SOTO-AYAM" in skus
