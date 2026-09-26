"""
Hanga API — FastAPI application entry point.

Configures CORS, mounts routers, and sets up lifespan events
for Firebase Admin SDK initialization.
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import briefings, extractions, health

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Initialize Firebase Admin SDK on startup if configured, clean up on shutdown."""
    initialized = False
    try:
        import firebase_admin

        if settings.gcp_project_id:
            cred = firebase_admin.credentials.ApplicationDefault()
            firebase_admin.initialize_app(
                cred,
                {
                    "projectId": settings.gcp_project_id,
                    "storageBucket": settings.firebase_storage_bucket,
                },
            )
            initialized = True
            logger.info("Firebase Admin initialized for project %s", settings.gcp_project_id)
        else:
            logger.info("Firebase Admin skipped: GCP_PROJECT_ID not set (Demo mode)")
    except Exception as exc:
        logger.info("Firebase Admin skipped: %s", exc)

    yield

    if initialized:
        try:
            import firebase_admin

            firebase_admin.delete_app(firebase_admin.get_app())
        except Exception:
            pass


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Inventory intelligence backend for Indonesian warung owners.",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(health.router, tags=["Health"])
app.include_router(briefings.router, prefix="/api/v1", tags=["Briefings"])
app.include_router(extractions.router, prefix="/api/v1", tags=["Extractions"])
