"""
Hanga API — Health check endpoint.

Cloud Run uses this to verify the container is alive and ready to serve.
"""

from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/healthz")
async def healthz() -> dict[str, str]:
    """Liveness probe — returns 200 if the process is running."""
    return {"status": "ok", "version": settings.app_version}


@router.get("/readyz")
async def readyz() -> dict[str, str]:
    """
    Readiness probe — returns 200 when all dependencies are reachable.

    TODO: Add Firestore connectivity check.
    """
    return {"status": "ready"}
