"""
Hanga API — Pydantic schemas for Tanya Hanga (grounded Q&A, spec §8).

One grounding rule: an answer may only use numbers and factors present in the
stored briefing for that date + scenario. Out-of-briefing questions get an
honest deflection — never a hallucinated number.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.briefing import Confidence, FactorKey


class AskRequest(BaseModel):
    """A follow-up question about the current briefing."""

    question_bahasa: str = Field(..., min_length=2, max_length=200)


class AskResponse(BaseModel):
    """A grounded answer — every number traces back to the briefing JSON."""

    answer_bahasa: str = Field(..., max_length=240)
    cited_skus: list[str] = Field(default_factory=list)
    factor_keys: list[FactorKey] = Field(default_factory=list)
    confidence: Confidence = Confidence.MEDIUM
    follow_ups: list[str] = Field(default_factory=list, max_length=3)


ASK_SYSTEM_PROMPT = """\
You answer follow-up questions from a small Indonesian shop owner (warung)
about TODAY's briefing. You receive ONLY the briefing JSON and her question.
Rules:
- Grounding: use ONLY numbers, SKUs, and factors present in the briefing.
  Never compute new numbers, never invent products, never estimate.
- If the question is about something not in the briefing, deflect honestly:
  "Angka itu belum ada di briefing hari ini — cek kartu {sku} ya, Bu."
- answer_bahasa: simple Bahasa Indonesia, warm, respectful (Bu/Pak), ≤240 chars.
- factor_keys: only canonical keys from the briefing.
- follow_ups: up to 3 short suggested follow-up questions in Bahasa.
- Output ONLY valid JSON.
"""
