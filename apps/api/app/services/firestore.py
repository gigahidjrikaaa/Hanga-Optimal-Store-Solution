"""
Hanga API — Firestore service.

Handles all Firestore reads/writes following the data model in briefing_spec.md §6.
"""

from __future__ import annotations

from datetime import date

from google.cloud.firestore_v1 import AsyncClient

from app.schemas.briefing import DailyBriefing, Scenario
from app.schemas.extraction import CatalogItem, Extraction


class FirestoreService:
    """
    Async Firestore client wrapper.

    Collections:
    - shops/{shopId}                         — Profile, supplier, cold-start answers
    - shops/{shopId}/sales/{date}            — Daily per-SKU quantities
    - shops/{shopId}/extractions/{id}        — Photo ref, raw model JSON, confirmed lines
    - shops/{shopId}/briefings/{date}_{scen} — Full DailyBriefing JSON
    - shops/{shopId}/orders/{id}             — Order drafts + status
    - catalog/{sku}                          — SKU dictionary
    - factors/{date}                         — Weather, holiday, event flags
    """

    def __init__(self) -> None:
        self._db = AsyncClient()

    # --- Briefings -----------------------------------------------------------

    async def get_briefing(
        self, shop_id: str, briefing_date: date, scenario: Scenario
    ) -> DailyBriefing | None:
        """
        Read a briefing document from Firestore.

        Path: shops/{shopId}/briefings/{date}_{scenario}
        """
        doc_id = f"{briefing_date.isoformat()}_{scenario.value}"
        doc_ref = self._db.collection("shops").document(shop_id).collection("briefings").document(doc_id)
        snapshot = await doc_ref.get()
        if not snapshot.exists:
            return None
        return DailyBriefing.model_validate(snapshot.to_dict())

    async def save_briefing(self, briefing: DailyBriefing) -> None:
        """
        Write a briefing document to Firestore.

        Path: shops/{shopId}/briefings/{date}_{scenario}
        """
        briefing_date = briefing.generated_at.date().isoformat()
        doc_id = f"{briefing_date}_{briefing.scenario.value}"
        doc_ref = (
            self._db.collection("shops")
            .document(briefing.shop_id)
            .collection("briefings")
            .document(doc_id)
        )
        await doc_ref.set(briefing.model_dump(mode="json"))

    # --- Extractions ---------------------------------------------------------

    async def save_extraction(self, extraction: Extraction) -> None:
        """Write an extraction record to Firestore."""
        doc_ref = (
            self._db.collection("shops")
            .document(extraction.shop_id)
            .collection("extractions")
            .document(extraction.id)
        )
        await doc_ref.set(extraction.model_dump(mode="json"))

    async def get_extraction(
        self, shop_id: str, extraction_id: str
    ) -> Extraction | None:
        """Read an extraction record from Firestore."""
        doc_ref = (
            self._db.collection("shops")
            .document(shop_id)
            .collection("extractions")
            .document(extraction_id)
        )
        snapshot = await doc_ref.get()
        if not snapshot.exists:
            return None
        return Extraction.model_validate(snapshot.to_dict())

    # --- Catalog -------------------------------------------------------------

    async def get_catalog(self) -> list[CatalogItem]:
        """Read the full SKU catalog."""
        docs = self._db.collection("catalog").stream()
        items: list[CatalogItem] = []
        async for doc in docs:
            items.append(CatalogItem.model_validate(doc.to_dict()))
        return items

    # --- Factors -------------------------------------------------------------

    async def get_factors(self, factor_date: date) -> dict | None:
        """Read factor flags for a given date."""
        doc_ref = self._db.collection("factors").document(factor_date.isoformat())
        snapshot = await doc_ref.get()
        if not snapshot.exists:
            return None
        return snapshot.to_dict()
