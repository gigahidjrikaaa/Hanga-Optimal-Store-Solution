"""
Hanga API — Briefings router.

Endpoints for generating and retrieving DailyBriefings.
The compute layer does all arithmetic; Gemma handles reasoning/explanation.
"""

import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import settings
from app.dependencies.auth import Principal, ensure_shop_access, get_current_principal
from app.schemas.ask import AskRequest, AskResponse
from app.schemas.briefing import DailyBriefing, Scenario
from app.services.ask import answer_from_briefing, answer_with_model
from app.services.compute import refit_budget
from app.services.seed_data import get_demo_briefing

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/briefings")


@router.get(
    "/shops/{shop_id}/briefings/{briefing_date}",
    response_model=DailyBriefing,
    summary="Get a briefing for a specific date, scenario, and cash budget",
)
async def get_briefing(
    shop_id: str,
    briefing_date: date,
    scenario: Scenario = Query(default=Scenario.BASELINE),
    cash_available_idr: int | None = Query(default=None, ge=0),
    principal: Principal = Depends(get_current_principal),
) -> DailyBriefing:
    """
    Retrieve a briefing, re-fitted to the caller's cash budget.

    In demo mode, returns validated scenario snapshots; when
    `cash_available_idr` differs from the snapshot's base budget, the order
    bundle is re-fitted in pure code (spec §6.1): greedy priority fill, visible
    deferrals with CASH_TIGHT. In live mode, reads from Firestore.
    """
    ensure_shop_access(principal, shop_id)

    if settings.demo_mode:
        logger.info(
            "Serving demo briefing for shop=%s scenario=%s cash=%s (principal=%s)",
            shop_id,
            scenario.value,
            cash_available_idr,
            principal.uid,
        )
        briefing = get_demo_briefing(scenario, shop_id)
        if cash_available_idr is not None:
            briefing = refit_budget(briefing, cash_available_idr)
        return briefing

    try:
        from app.services.firestore import FirestoreService

        fs = FirestoreService()
        stored = await fs.get_briefing(shop_id, briefing_date, scenario)
        if stored:
            if cash_available_idr is not None:
                stored = refit_budget(stored, cash_available_idr)
            return stored
    except Exception as exc:
        logger.warning("Firestore lookup failed (%s); falling back to template", exc)

    # Fallback to seeded scenario template
    briefing = get_demo_briefing(scenario, shop_id)
    if cash_available_idr is not None:
        briefing = refit_budget(briefing, cash_available_idr)
    return briefing


@router.post(
    "/shops/{shop_id}/briefings/{briefing_date}/ask",
    response_model=AskResponse,
    summary="Tanya Hanga — ask a grounded question about this briefing",
)
async def ask_briefing(
    shop_id: str,
    briefing_date: date,
    body: AskRequest,
    scenario: Scenario = Query(default=Scenario.BASELINE),
    cash_available_idr: int | None = Query(default=None, ge=0),
    principal: Principal = Depends(get_current_principal),
) -> AskResponse:
    """
    Tanya Hanga (spec §8): the briefing JSON is the only context window.

    Demo mode answers in code from the stored briefing (deterministic, no
    model calls). Live mode calls Gemma with the grounding system prompt and
    falls back to the code answer on any failure.
    """
    ensure_shop_access(principal, shop_id)

    # The answer must reflect the budget the owner is currently looking at.
    if settings.demo_mode:
        briefing = get_demo_briefing(scenario, shop_id)
    else:
        briefing = None
        try:
            from app.services.firestore import FirestoreService

            briefing = await FirestoreService().get_briefing(
                shop_id, briefing_date, scenario
            )
        except Exception as exc:
            logger.warning("Firestore briefing for ask failed (%s)", exc)
        if briefing is None:
            briefing = get_demo_briefing(scenario, shop_id)

    if cash_available_idr is not None:
        briefing = refit_budget(briefing, cash_available_idr)

    if settings.demo_mode:
        return answer_from_briefing(briefing, body.question_bahasa)

    return await answer_with_model(briefing, body.question_bahasa)


@router.post(
    "/shops/{shop_id}/briefings/generate",
    response_model=DailyBriefing,
    summary="Generate a new briefing",
)
async def generate_briefing(
    shop_id: str,
    scenario: Scenario = Query(default=Scenario.BASELINE),
    principal: Principal = Depends(get_current_principal),
) -> DailyBriefing:
    """
    Trigger briefing generation: compute aggregates → Gemma reasoning → store.

    The compute layer (spec §6) derives aggregates, reorder math, factor
    activation, risks, and the cash-fitted bundle in code; Gemma only adds
    actions-in-context and Bahasa explanations, validated against the schema
    with one retry. On any model failure the code-only template briefing is
    served instead.
    """
    ensure_shop_access(principal, shop_id)

    if settings.demo_mode:
        return get_demo_briefing(scenario, shop_id)

    try:
        from app.services.compute import compute_outputs
        from app.services.firestore import FirestoreService
        from app.services.model import ModelService
        from app.services.synthetic import build_shop_snapshot

        # Snapshot: real sales history from Firestore, synthetic fallback when
        # the shop has none yet (cold start).
        snapshot = build_shop_snapshot(
            shop_id=shop_id,
            today=date.today(),
            cash_available_idr=0,
            scenario=scenario.value,
        )
        try:
            fs = FirestoreService()
            sales = await fs.get_sales_history(shop_id, days=90)
            if sales:
                snapshot.sales = sales
                snapshot.synthetic = False
            shop_doc = await fs.get_shop(shop_id)
            if shop_doc and shop_doc.get("cash_available_idr") is not None:
                snapshot.cash_available_idr = int(shop_doc["cash_available_idr"])
        except Exception as fs_err:
            logger.warning("Firestore snapshot unavailable (%s); using synthetic", fs_err)

        result = compute_outputs(snapshot)

        model_service = ModelService()
        try:
            briefing = await model_service.generate_briefing(result.aggregates)
        except Exception as gemma_err:
            logger.warning("Gemma failed (%s); serving code-only template", gemma_err)
            briefing = result.briefing

        try:
            fs = FirestoreService()
            await fs.save_briefing(briefing)
        except Exception as fs_err:
            logger.warning("Could not persist generated briefing to Firestore: %s", fs_err)

        return briefing
    except Exception as exc:
        logger.warning("Live generation failed (%s); falling back to demo template", exc)
        return get_demo_briefing(scenario, shop_id)

