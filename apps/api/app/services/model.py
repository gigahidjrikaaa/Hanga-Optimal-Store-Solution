"""
Hanga API — Gemma model service.

Handles all interactions with Gemma models via the Gemini API: Gemma for
briefing reasoning/explanation and the multimodal Gemma 4 for notebook photo
extraction (free tier from Google AI Studio — see HANGA_VISION_MODEL in
.env.example; confirm the exact model ID with `client.models.list()`).
Implements the validation loop from briefing_spec.md §5.

Iron rule: all arithmetic happens in code. Gemma receives pre-computed
aggregates and factor scores; it decides actions, ranges, and explanations.
"""

from __future__ import annotations

import json
import logging

from google import genai
from pydantic import ValidationError

from app.config import settings
from app.schemas.briefing import DailyBriefing

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# System prompt (briefing_spec.md §5)
# ---------------------------------------------------------------------------

GEMMA_SYSTEM_PROMPT = """\
You are the inventory advisor for a small Indonesian shop (warung).
You receive: JSON with sales aggregates, reorder math, factor scores,
and a cash-budget fit computed by code.
Rules:
- Output ONLY valid JSON matching the provided schema. No prose outside JSON.
- Use only the canonical factor keys provided.
- Ranges, not point estimates. Never invent numbers not present in inputs.
- The budget is final: you may explain deferrals (CASH_TIGHT) but never un-defer
  them or raise quantities beyond the given ranges.
- rationale_bahasa: simple Bahasa Indonesia, warm, ≤160 chars.
- Actions: REORDER / SKIP / PROMO / HOLD per sku, consistent with the math given.
"""

EXTRACTION_SYSTEM_PROMPT = """\
You read handwritten sales notebooks from a small Indonesian shop (warung).
Extract every product line you can read.
Rules:
- Output ONLY valid JSON: {"lines": [{"name": str, "qty": number, "unit": str}]}.
- "name": product name as written (Bahasa Indonesia). "unit": kg, gram, liter,
  pcs, bungkus, tray, renceng, dus, kotak, botol, or as written.
- Skip totals, dates, and non-product lines. If a quantity is unreadable, use 0.
- Do not invent lines you cannot see.
"""


class ModelService:
    """
    Wrapper for Gemma (briefing reasoning) and Gemma 4 vision (extraction).

    Uses the google-genai SDK with the Gemini API (AI Studio free tier).
    """

    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.gemini_api_key)

    async def generate_briefing(
        self, aggregates_json: dict
    ) -> DailyBriefing:
        """
        Call Gemma with pre-computed aggregates and validate the output.

        Validation loop (briefing_spec.md §5):
        1. Parse response → Pydantic
        2. On failure, retry once with the error appended
        3. On second failure, raise (caller renders the template briefing)
        """
        prompt = f"""Given the following pre-computed sales aggregates and factor scores,
generate a DailyBriefing JSON:

{json.dumps(aggregates_json, indent=2, ensure_ascii=False)}"""

        # --- Attempt 1 ---
        first_error: Exception | None = None
        response = await self._client.aio.models.generate_content(
            model=settings.gemma_model,
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=GEMMA_SYSTEM_PROMPT,
                temperature=0.3,
                response_mime_type="application/json",
            ),
        )

        try:
            parsed = json.loads(response.text)
            return DailyBriefing.model_validate(parsed)
        except (json.JSONDecodeError, ValidationError) as exc:
            first_error = exc
            logger.warning("Gemma attempt 1 failed: %s", exc)

        # --- Attempt 2 (retry with error appended) ---
        retry_prompt = f"""{prompt}

Your previous output was invalid. Error:
{first_error}

Please fix and output ONLY valid JSON."""

        response = await self._client.aio.models.generate_content(
            model=settings.gemma_model,
            contents=retry_prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=GEMMA_SYSTEM_PROMPT,
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )

        try:
            parsed = json.loads(response.text)
            return DailyBriefing.model_validate(parsed)
        except (json.JSONDecodeError, ValidationError) as second_error:
            logger.error("Gemma attempt 2 failed: %s", second_error)
            raise ValueError(
                "Gemma failed to produce valid JSON after 2 attempts. "
                "Falling back to template briefing."
            ) from second_error

    async def extract_notebook(self, image_bytes: bytes) -> dict:
        """
        Extract product lines from a notebook photo with multimodal Gemma 4
        (free tier). Returns {"lines": [...]} parsed from model JSON; the
        router validates each line against ExtractedLine.
        """
        prompt = (
            "Baca halaman buku catatan penjualan warung ini. "
            "Ekstrak setiap baris produk ke JSON."
        )
        contents = [
            prompt,
            genai.types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
        ]

        first_error: Exception | None = None
        response = await self._client.aio.models.generate_content(
            model=settings.vision_model,
            contents=contents,
            config=genai.types.GenerateContentConfig(
                system_instruction=EXTRACTION_SYSTEM_PROMPT,
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )

        try:
            return self._validate_extraction(response.text)
        except (json.JSONDecodeError, ValidationError, KeyError, TypeError) as exc:
            first_error = exc
            logger.warning("Extraction attempt 1 failed: %s", exc)

        retry_contents = [
            f"{prompt}\n\nYour previous output was invalid. Error: {first_error}\n"
            "Fix it and output ONLY valid JSON.",
            genai.types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
        ]
        response = await self._client.aio.models.generate_content(
            model=settings.vision_model,
            contents=retry_contents,
            config=genai.types.GenerateContentConfig(
                system_instruction=EXTRACTION_SYSTEM_PROMPT,
                temperature=0.0,
                response_mime_type="application/json",
            ),
        )

        try:
            return self._validate_extraction(response.text)
        except (json.JSONDecodeError, ValidationError, KeyError, TypeError) as second_error:
            logger.error("Extraction attempt 2 failed: %s", second_error)
            raise ValueError(
                "Notebook extraction failed validation after 2 attempts."
            ) from second_error

    @staticmethod
    def _validate_extraction(text: str) -> dict:
        parsed = json.loads(text)
        if not isinstance(parsed, dict) or not isinstance(parsed.get("lines"), list):
            raise ValueError("Extraction JSON must be {\"lines\": [...]}")
        return parsed
