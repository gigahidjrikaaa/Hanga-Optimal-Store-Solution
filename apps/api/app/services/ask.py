"""
Hanga API — Tanya Hanga answer service (briefing_spec.md §8).

Two paths, same contract:
- Code answers (default, demo mode): match the question against the stored
  briefing and compose the answer from its numbers — zero model calls, fully
  deterministic on stage.
- Gemma (live mode): the model receives ONLY the briefing JSON + the question
  with the grounding system prompt; output is schema-validated with one retry;
  any failure falls back to the code answer. The briefing is the context
  window — nothing else exists.
"""

from __future__ import annotations

import json
import logging

from pydantic import ValidationError

from app.schemas.ask import ASK_SYSTEM_PROMPT, AskResponse
from app.schemas.briefing import Confidence, DailyBriefing, FactorKey, Recommendation

logger = logging.getLogger(__name__)

ANSWER_MAX = 240

_FOLLOWUPS_BY_CONTEXT = {
    "qty": ["Kenapa tidak {max} {unit}?", "Kapan harus pesannya?", "Bagaimana kas hari ini?"],
    "budget": ["Masih cukup untuk pesan lagi?", "Apa yang ditunda besok?", "Kapan kas masuk lagi?"],
    "general": ["Barang apa yang paling perlu dipesan?", "Bagaimana kas hari ini?", "Apa risikonya?"],
}


def _idr(amount: int) -> str:
    return f"Rp {amount:,}".replace(",", ".")


def _clamp(text: str, limit: int = ANSWER_MAX) -> str:
    if len(text) <= limit:
        return text
    cut = text[: limit - 1]
    if " " in cut:
        cut = cut.rsplit(" ", 1)[0]
    return cut.rstrip(",.;:") + "…"


def _find_target(briefing: DailyBriefing, question: str) -> Recommendation | None:
    """Match the question against SKU codes and product-name words."""
    q = question.lower()
    for rec in briefing.recommendations:
        code = rec.sku.lower().replace("-", " ")
        if code in q or rec.sku.lower() in q:
            return rec
        name = (rec.name or rec.sku).lower().replace("-", " ")
        words = [w for w in name.split() if len(w) > 3 and not w.isdigit()]
        if words and any(w in q for w in words):
            return rec
    return None


def _factor_notes(rec: Recommendation) -> str:
    notes = [
        f"{f.note_bahasa}"
        for f in sorted(rec.factors, key=lambda f: abs(f.weight), reverse=True)
        if f.key != FactorKey.CASH_TIGHT
    ][:2]
    return ", ".join(notes)


def answer_from_briefing(briefing: DailyBriefing, question: str) -> AskResponse:
    """Deterministic, code-only answer composed strictly from briefing content."""
    q = question.lower()
    target = _find_target(briefing, question)
    budget = briefing.budget
    followups = _FOLLOWUPS_BY_CONTEXT["general"]

    if target is not None and ("kenapa tidak" in q or "kenapa cuma" in q or "kok cuma" in q):
        answer = (
            f"Kisarannya {target.qty.min}–{target.qty.max} {target.qty.unit}, "
            f"kemungkinan {target.qty.likely} {target.qty.unit} — cukup untuk "
            f"permintaan minggu ini. Kalau ramai, aman sampai {target.qty.max} "
            f"{target.qty.unit}. {_factor_notes(target)}."
        )
        followups = _FOLLOWUPS_BY_CONTEXT["qty"]

    elif target is not None and "kapan" in q:
        risk = next((r for r in briefing.risks if r.sku == target.sku), None)
        timing = f"Stok diperkirakan menipis sekitar {risk.window.isoformat()}. " if risk else ""
        answer = f"Pesannya hari ini ya, Bu. {timing}{target.rationale_bahasa}"
        followups = _FOLLOWUPS_BY_CONTEXT["qty"]

    elif target is not None:
        notes = _factor_notes(target)
        answer = f"{target.rationale_bahasa}" + (f" Faktor: {notes}." if notes else "")

    elif any(k in q for k in ("kas", "modal", "uang", "budget")) and budget is not None:
        if budget.deferred_skus:
            names = ", ".join(budget.deferred_skus[:2]).replace("-", " ").title()
            answer = (
                f"Kas hari ini {_idr(budget.cash_available_idr)}, terpakai "
                f"{_idr(budget.committed_idr)}. {names} ditunda besok, sisa "
                f"{_idr(budget.remaining_idr)} aman di kas."
            )
        else:
            answer = (
                f"Kas hari ini {_idr(budget.cash_available_idr)} — semua pesanan "
                f"prioritas muat, sisa {_idr(budget.remaining_idr)} untuk belanja besok."
            )
        followups = _FOLLOWUPS_BY_CONTEXT["budget"]

    else:
        fast = ", ".join(
            (m.name or m.sku).split()[0] for m in briefing.movers.fast[:2]
        )
        answer = (
            f"Briefing hari ini: {briefing.headline} "
            + (f"Yang laris: {fast}. " if fast else "")
            + "Coba tanya barang tertentu, misal: kenapa pesan gula?"
        )
        followups = _FOLLOWUPS_BY_CONTEXT["general"]

    cited = [target.sku] if target else list(budget.deferred_skus[:1]) if budget else []
    factor_keys = [f.key for f in target.factors] if target else []
    return AskResponse(
        answer_bahasa=_clamp(answer),
        cited_skus=cited,
        factor_keys=factor_keys,
        confidence=target.confidence if target is not None else Confidence.MEDIUM,
        follow_ups=[
            fu.format(
                max=target.qty.max if target else 20,
                unit=target.qty.unit if target else "kg",
            )
            for fu in followups
        ][:3],
    )


async def answer_with_model(briefing: DailyBriefing, question: str) -> AskResponse:
    """
    Live path: Gemma answers from the briefing JSON only. One retry on
    validation failure; falls back to the deterministic code answer.
    """
    try:
        from google import genai

        from app.config import settings

        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = (
            f"Briefing JSON:\n{json.dumps(briefing.model_dump(mode='json'), ensure_ascii=False)}\n\n"
            f"Pertanyaan Bu Sari: {question}"
        )

        first_error: Exception | None = None
        for attempt in range(2):
            response = await client.aio.models.generate_content(
                model=settings.gemma_model,
                contents=prompt + (
                    "" if attempt == 0
                    else f"\n\nOutput sebelumnya tidak valid: {first_error}. Perbaiki."
                ),
                config=genai.types.GenerateContentConfig(
                    system_instruction=ASK_SYSTEM_PROMPT,
                    temperature=0.3 if attempt == 0 else 0.1,
                    response_mime_type="application/json",
                ),
            )
            try:
                parsed = json.loads(response.text)
                answer = AskResponse.model_validate(parsed)
                return answer.model_copy(
                    update={"answer_bahasa": _clamp(answer.answer_bahasa)}
                )
            except (json.JSONDecodeError, ValidationError) as exc:
                first_error = exc
                logger.warning("Ask attempt %d failed: %s", attempt + 1, exc)
    except Exception as exc:
        logger.warning("Live ask unavailable (%s); using code answer", exc)

    return answer_from_briefing(briefing, question)
