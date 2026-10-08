"""
Hanga API — Shop profile router.

Upsert/read of shops/{shopId} (briefing_spec.md §6), written by the
cold-start interview. Demo mode keeps profiles in memory; live mode writes
Firestore with an in-memory fallback.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends

from app.dependencies.auth import Principal, ensure_shop_access, get_current_principal
from app.schemas.profile import ShopProfile, ShopProfileCreate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shops")

# Demo-mode in-memory profiles.
_DEMO_PROFILES: dict[str, ShopProfile] = {}


@router.put(
    "/{shop_id}/profile",
    response_model=ShopProfile,
    summary="Save the shop profile (cold-start interview)",
)
async def save_profile(
    shop_id: str,
    body: ShopProfileCreate,
    principal: Principal = Depends(get_current_principal),
) -> ShopProfile:
    ensure_shop_access(principal, shop_id)

    profile = ShopProfile(
        **body.model_dump(),
        shop_id=shop_id,
        updated_at=datetime.now(),
    )
    _DEMO_PROFILES[shop_id] = profile

    if not _demo_mode():
        try:
            from app.services.firestore import FirestoreService

            await FirestoreService().save_profile(profile)
        except Exception as exc:
            logger.warning("Firestore profile save failed (%s); kept in memory", exc)
    return profile


@router.get(
    "/{shop_id}/profile",
    response_model=ShopProfile | None,
    summary="Read the shop profile",
)
async def get_profile(
    shop_id: str,
    principal: Principal = Depends(get_current_principal),
) -> ShopProfile | None:
    ensure_shop_access(principal, shop_id)

    if not _demo_mode():
        try:
            from app.services.firestore import FirestoreService

            stored = await FirestoreService().get_profile(shop_id)
            if stored is not None:
                return stored
        except Exception as exc:
            logger.warning("Firestore profile read failed (%s); using memory", exc)

    return _DEMO_PROFILES.get(shop_id)


def _demo_mode() -> bool:
    from app.config import settings

    return settings.demo_mode
