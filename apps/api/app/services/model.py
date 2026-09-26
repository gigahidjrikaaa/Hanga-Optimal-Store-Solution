"""
Hanga API — Gemma / Gemini model service.

Handles all interactions with Gemma 3 (reasoning/explanation) and
Gemini Flash (vision extraction). Implements the validation loop
from briefing_spec.md §5.

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
You receive: JSON with sales aggregates, reorder math, and factor scores.
Rules:
- Output ONLY valid JSON matching the provided schema. No prose outside JSON.
- Use only the canonical factor keys provided.
- Ranges, not point estimates. Never invent numbers not present in inputs.
- rationale_bahasa: simple Bahasa Indonesia, warm, ≤160 chars.
- Actions: REORDER / SKIP / PROMO / HOLD per sku, consistent with the math given.
"""


class ModelService:
    """
    Wrapper for Gemma 3 (reasoning) and Gemini Flash (vision) model calls.

    Uses the google-genai SDK with the Gemini API.
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
        3. On second failure, raise (caller should render template briefing)

        TODO: Implement the full Gemma call + validation loop.
        """
        prompt = f"""Given the following pre-computed sales aggregates and factor scores,
generate a DailyBriefing JSON:

{json.dumps(aggregates_json, indent=2, ensure_ascii=False)}"""

        # --- Attempt 1 ---
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
        except (json.JSONDecodeError, ValidationError) as first_error:
            logger.warning("Gemma attempt 1 failed: %s", first_error)

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
        Call Gemini Flash (multimodal) to extract line items from a notebook photo.

        TODO: Implement vision extraction with proper prompting.
        """
        raise NotImplementedError("Notebook extraction not yet implemented")
