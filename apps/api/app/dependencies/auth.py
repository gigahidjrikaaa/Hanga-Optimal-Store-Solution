"""
Hanga API — Authentication dependency.

Identity model:
- Live mode: the PWA signs in via Firebase Auth and sends the ID token as
  `Authorization: Bearer <token>`; this dependency verifies it server-side with
  the Firebase Admin SDK. The shop is resolved from the token's `shopId` custom
  claim (falling back to the demo shop while the product is single-shop).
- Demo mode (HANGA_DEMO_MODE=true, the default): requests without a token are
  served as the demo principal (Bu Sari). This keeps the seeded demo, local dev,
  and the test suite friction-free while exercising the same code path the live
  app uses.

Auth-error responses are deliberately generic (no user enumeration) and in
English — user-facing copy is translated in the frontend.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

logger = logging.getLogger(__name__)

# auto_error=False: missing header is not an error by itself — demo mode allows it.
_bearer = HTTPBearer(auto_error=False)

DEMO_PRINCIPAL_UID = "demo-bu-sari"
DEMO_SHOP_ID = "warung-bu-sari"


@dataclass(frozen=True)
class Principal:
    """The authenticated caller, resolved from a Firebase ID token or demo mode."""

    uid: str
    shop_id: str
    is_demo: bool = False
    email: str | None = None
    display_name: str | None = None


def get_current_principal(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> Principal:
    """
    Resolve the caller from the Authorization header.

    1. Bearer token present → verify with Firebase Admin SDK (any failure → 401).
    2. No token + demo mode → demo principal.
    3. No token + live mode → 401.
    """
    if creds is not None:
        return _principal_from_token(creds.credentials)

    if settings.demo_mode:
        return Principal(
            uid=DEMO_PRINCIPAL_UID,
            shop_id=DEMO_SHOP_ID,
            is_demo=True,
            display_name="Bu Sari",
        )

    raise HTTPException(status_code=401, detail="Authentication required")


def _principal_from_token(token: str) -> Principal:
    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth

        decoded = firebase_auth.verify_id_token(token)
    except Exception as exc:
        logger.info("ID token verification failed: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid authentication token") from exc

    return Principal(
        uid=decoded["uid"],
        shop_id=decoded.get("shopId") or DEMO_SHOP_ID,
        is_demo=False,
        email=decoded.get("email"),
        display_name=decoded.get("name"),
    )


def ensure_shop_access(principal: Principal, shop_id: str) -> None:
    """
    Authorization guard: a signed-in owner may only touch their own shop.

    Demo-mode requests bypass this while the product is single-shop.
    """
    if principal.is_demo:
        return
    if principal.shop_id != shop_id:
        raise HTTPException(status_code=403, detail="Forbidden for this shop")
