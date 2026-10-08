"""
Hanga — Model ID verifier.

Run this ONCE with a working Google AI Studio API key to confirm the exact
Gemma model IDs available to this project (see TODO.md §"BLOCKER"):

    cd apps/api
    export HANGA_GEMINI_API_KEY=...   # or set it in apps/api/.env
    python scripts/verify_models.py

Prints every Gemma (and Gemini Flash fallback) model with its exact API ID and
supported actions. Copy the multimodal Gemma 4 ID into HANGA_VISION_MODEL.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings  # noqa: E402


def main() -> None:
    if not settings.gemini_api_key:
        print("No HANGA_GEMINI_API_KEY configured — add the real key to apps/api/.env first.")
        sys.exit(1)

    from google import genai

    client = genai.Client(api_key=settings.gemini_api_key)
    print(f"Current config: reasoning={settings.gemma_model} vision={settings.vision_model}\n")

    gemma_rows, gemini_rows = [], []
    for model in client.models.list():
        name = model.name.removeprefix("models/")
        actions = ",".join(getattr(model, "supported_actions", None) or [])
        row = f"{name:40s} [{actions}]"
        if "gemma" in name.lower():
            gemma_rows.append(row)
        elif "gemini" in name.lower() and "flash" in name.lower():
            gemini_rows.append(row)

    print("Gemma models (reasoning + vision candidates):")
    for row in gemma_rows:
        print(" ", row)
    print("\nGemini Flash (fallback option):")
    for row in gemini_rows:
        print(" ", row)
    print(
        "\nNext: pick the multimodal Gemma 4 entry (vision-capable) and set\n"
        "HANGA_VISION_MODEL=<exact-id> in apps/api/.env — see TODO.md."
    )


if __name__ == "__main__":
    main()
