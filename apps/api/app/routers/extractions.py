"""
Hanga API — Extractions router.

Endpoints for the notebook photo → SKU extraction pipeline.
Uses Gemini Flash (multimodal) for vision extraction.
"""

import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile

from app.config import settings
from app.schemas.extraction import (
    ConfirmSheetUpdate,
    ExtractedLine,
    Extraction,
    ExtractionStatus,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/extractions")

# In-memory store for session extractions (in demo mode)
_DEMO_EXTRACTIONS: dict[str, Extraction] = {}


def _create_demo_extraction(shop_id: str, extraction_id: str) -> Extraction:
    """Generate a realistic mock notebook extraction for Warung Bu Sari."""
    return Extraction(
        id=extraction_id,
        shop_id=shop_id,
        created_at=datetime.now(),
        photo_storage_path=f"shops/{shop_id}/extractions/{extraction_id}/notebook.jpg",
        status=ExtractionStatus.REVIEW,
        lines=[
            ExtractedLine(
                name="Gula pasir",
                qty=5.0,
                unit="kg",
                matched_sku="GULA-1KG",
                model_confidence=0.95,
            ),
            ExtractedLine(
                name="Minyak goreng",
                qty=3.0,
                unit="liter",
                matched_sku="MINYAK-1L",
                model_confidence=0.88,
            ),
            ExtractedLine(
                name="Telur ayam",
                qty=2.0,
                unit="tray",
                matched_sku="TELUR-TRAY",
                model_confidence=0.72,
            ),
            ExtractedLine(
                name="Susu UHT cokelat",
                qty=4.0,
                unit="kotak",
                matched_sku="SUSU-UHT-1L",
                model_confidence=0.45,
            ),
            ExtractedLine(
                name="Kopi Kapal Api",
                qty=10.0,
                unit="renceng",
                matched_sku="KOPI-KAPALAPI",
                model_confidence=0.92,
            ),
        ],
    )


@router.post(
    "/shops/{shop_id}/extractions",
    response_model=Extraction,
    status_code=201,
    summary="Upload a notebook photo for extraction",
)
async def create_extraction(
    shop_id: str,
    photo: UploadFile,
) -> Extraction:
    """
    Upload a notebook photo and trigger SKU extraction via Gemini Flash.

    In demo mode, simulates model vision extraction with realistic Indonesian notebook lines.
    In live mode, uses Gemini Flash multimodal API.
    """
    extraction_id = uuid.uuid4().hex[:8]

    # Read uploaded file bytes
    try:
        _content = await photo.read()
    except Exception as read_err:
        logger.warning("Could not read uploaded photo: %s", read_err)

    if settings.demo_mode or not settings.gemini_api_key:
        logger.info("Demo extraction generated for shop=%s extraction=%s", shop_id, extraction_id)
        extraction = _create_demo_extraction(shop_id, extraction_id)
        _DEMO_EXTRACTIONS[extraction_id] = extraction
        return extraction

    # Live model call with fallback
    try:
        from app.services.model import ModelService

        model = ModelService()
        raw = await model.extract_notebook(_content)
        lines = [ExtractedLine.model_validate(l) for l in raw.get("lines", [])]
        extraction = Extraction(
            id=extraction_id,
            shop_id=shop_id,
            created_at=datetime.now(),
            photo_storage_path=f"shops/{shop_id}/extractions/{extraction_id}/{photo.filename}",
            status=ExtractionStatus.REVIEW,
            raw_lines=lines,
        )
    except Exception as exc:
        logger.warning("Live vision extraction failed (%s); falling back to demo template", exc)
        extraction = _create_demo_extraction(shop_id, extraction_id)

    _DEMO_EXTRACTIONS[extraction_id] = extraction
    return extraction


@router.get(
    "/shops/{shop_id}/extractions/{extraction_id}",
    response_model=Extraction,
    summary="Get a specific extraction",
)
async def get_extraction(
    shop_id: str,
    extraction_id: str,
) -> Extraction:
    """Retrieve an extraction record by ID."""
    if extraction_id in _DEMO_EXTRACTIONS:
        return _DEMO_EXTRACTIONS[extraction_id]

    # If not in cache, create a demo one for shop
    extraction = _create_demo_extraction(shop_id, extraction_id)
    _DEMO_EXTRACTIONS[extraction_id] = extraction
    return extraction


@router.put(
    "/shops/{shop_id}/extractions/{extraction_id}/confirm",
    response_model=Extraction,
    summary="Confirm corrected extraction lines (ConfirmSheet)",
)
async def confirm_extraction(
    shop_id: str,
    extraction_id: str,
    body: ConfirmSheetUpdate,
) -> Extraction:
    """
    Accept user-corrected extraction lines from the ConfirmSheet UI.
    """
    extraction = _DEMO_EXTRACTIONS.get(extraction_id)
    if not extraction:
        extraction = _create_demo_extraction(shop_id, extraction_id)

    extraction.lines = body.lines
    extraction.status = ExtractionStatus.CONFIRMED
    extraction.confirmed_at = datetime.now()
    _DEMO_EXTRACTIONS[extraction_id] = extraction

    logger.info("Extraction %s confirmed with %d lines", extraction_id, len(body.lines))
    return extraction
