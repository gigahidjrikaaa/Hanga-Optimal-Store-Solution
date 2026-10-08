"""
Hanga API — Application settings.

Loaded from environment variables with sensible defaults for local development.
On Cloud Run, these are set via the service configuration or Secret Manager.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration sourced from environment variables."""

    # --- Application ---
    app_name: str = "Hanga API"
    app_version: str = "0.1.0"
    debug: bool = False

    # --- Cloud Run / Server ---
    port: int = 8080
    host: str = "0.0.0.0"

    # --- Firebase / GCP ---
    gcp_project_id: str = ""
    firebase_storage_bucket: str = ""

    # --- Gemini / Gemma ---
    gemini_api_key: str = ""
    gemma_model: str = "gemma-3-27b-it"
    # Multimodal Gemma 4 via AI Studio free tier (confirm exact ID with
    # `client.models.list()`; override with HANGA_VISION_MODEL).
    vision_model: str = "gemma-4-27b-it"
    gemini_flash_model: str = "gemini-2.0-flash"

    # --- Demo Mode ---
    demo_mode: bool = True
    demo_date: str = "2026-10-10"
    demo_shop_id: str = "warung-bu-sari"

    # --- CORS ---
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = {
        "env_prefix": "HANGA_",
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


settings = Settings()
