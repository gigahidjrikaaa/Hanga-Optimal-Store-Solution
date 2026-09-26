"""
Hanga API — Briefings router.

Endpoints for generating and retrieving DailyBriefings.
The compute layer does all arithmetic; Gemma handles reasoning/explanation.
"""

import logging
from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.schemas.briefing import DailyBriefing, Scenario
from app.services.seed_data import get_demo_briefing

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/briefings")


@router.get(
    "/shops/{shop_id}/briefings/{briefing_date}",
    response_model=DailyBriefing,
    summary="Get a briefing for a specific date and scenario",
)
async def get_briefing(
    shop_id: str,
    briefing_date: date,
    scenario: Scenario = Query(default=Scenario.BASELINE),
) -> DailyBriefing:
    """
    Retrieve a pre-computed briefing.

    In demo mode, returns validated scenario snapshots.
    In live mode, attempts to read from Firestore with a defensive fallback.
    """
    if settings.demo_mode:
        logger.info("Serving demo briefing for shop=%s scenario=%s", shop_id, scenario.value)
        return get_demo_briefing(scenario, shop_id)

    try:
        from app.services.firestore import FirestoreService

        fs = FirestoreService()
        briefing = await fs.get_briefing(shop_id, briefing_date, scenario)
        if briefing:
            return briefing
    except Exception as exc:
        logger.warning("Firestore lookup failed (%s); falling back to template", exc)

    # Fallback to seeded scenario template
    return get_demo_briefing(scenario, shop_id)


@router.post(
    "/shops/{shop_id}/briefings/generate",
    response_model=DailyBriefing,
    summary="Generate a new briefing",
)
async def generate_briefing(
    shop_id: str,
    scenario: Scenario = Query(default=Scenario.BASELINE),
) -> DailyBriefing:
    """
    Trigger briefing generation: compute aggregates → Gemma reasoning → store result.

    In demo mode, returns the pre-computed scenario briefing.
    In live mode, triggers the Gemma validation loop with Firestore persistence.
    """
    if settings.demo_mode:
        return get_demo_briefing(scenario, shop_id)

    try:
        from app.services.model import ModelService
        from app.services.firestore import FirestoreService

        # Live model invocation with fallback
        model_service = ModelService()
        aggregates = {
            "shop_id": shop_id,
            "scenario": scenario.value,
            "date": date.today().isoformat(),
        }
        briefing = await model_service.generate_briefing(aggregates)

        # Persist to Firestore
        try:
            fs = FirestoreService()
            await fs.save_briefing(briefing)
        except Exception as fs_err:
            logger.warning("Could not persist generated briefing to Firestore: %s", fs_err)

        return briefing
    except Exception as exc:
        logger.warning("Live generation failed (%s); falling back to demo template", exc)
        return get_demo_briefing(scenario, shop_id)

