"""
Hanga API — Firestore service.

Handles all Firestore reads/writes following the data model in briefing_spec.md §6.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from google.cloud.firestore_v1 import AsyncClient
from google.cloud.firestore_v1.base_query import FieldFilter

from app.schemas.briefing import DailyBriefing, Scenario
from app.schemas.extraction import CatalogItem, Extraction
from app.schemas.order import Order, OrderStatus
from app.schemas.profile import ShopProfile


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

    # --- Shop profile --------------------------------------------------------

    async def save_profile(self, profile: ShopProfile) -> None:
        """Upsert the shop profile document (merge, keep unknown fields)."""
        doc_ref = self._db.collection("shops").document(profile.shop_id)
        await doc_ref.set(profile.model_dump(mode="json"), merge=True)

    async def get_profile(self, shop_id: str) -> ShopProfile | None:
        """Read the shop profile document."""
        doc_ref = self._db.collection("shops").document(shop_id)
        snapshot = await doc_ref.get()
        if not snapshot.exists:
            return None
        return ShopProfile.model_validate(snapshot.to_dict())

    async def get_shop(self, shop_id: str) -> dict | None:
        """Read a shop profile document (cash, supplier, cold-start answers)."""
        doc_ref = self._db.collection("shops").document(shop_id)
        snapshot = await doc_ref.get()
        if not snapshot.exists:
            return None
        return snapshot.to_dict()

    # --- Sales history ---------------------------------------------------------

    async def get_sales_history(
        self, shop_id: str, days: int = 90
    ) -> dict[date, dict[str, float]]:
        """
        Read daily per-SKU sales for the compute layer.

        Returns {date: {sku: qty}} for the most recent `days` documents.
        """
        cutoff = date.today() - timedelta(days=days)
        docs = (
            self._db.collection("shops")
            .document(shop_id)
            .collection("sales")
            .where(
                filter=FieldFilter("date", ">=", cutoff.isoformat())
            )
            .stream()
        )
        history: dict[date, dict[str, float]] = {}
        async for doc in docs:
            data = doc.to_dict() or {}
            day = date.fromisoformat(str(data.get("date", doc.id)))
            quantities = data.get("quantities", {})
            history[day] = {str(k): float(v) for k, v in quantities.items()}
        return history

    # --- Sales ---------------------------------------------------------------

    async def merge_sales(
        self, shop_id: str, sales_date: date, quantities: dict[str, float]
    ) -> None:
        """
        Additively merge per-SKU quantities into `shops/{shopId}/sales/{date}`.
        """
        doc_ref = (
            self._db.collection("shops")
            .document(shop_id)
            .collection("sales")
            .document(sales_date.isoformat())
        )
        snapshot = await doc_ref.get()
        existing: dict[str, float] = {}
        if snapshot.exists:
            data = snapshot.to_dict() or {}
            existing = {str(k): float(v) for k, v in data.get("quantities", {}).items()}
        for sku, qty in quantities.items():
            existing[sku] = existing.get(sku, 0.0) + qty
        await doc_ref.set(
            {"date": sales_date.isoformat(), "quantities": existing, "source": "extraction"}
        )

    async def get_sales(self, shop_id: str, sales_date: date) -> dict[str, float] | None:
        """Read one day's per-SKU quantities."""
        doc_ref = (
            self._db.collection("shops")
            .document(shop_id)
            .collection("sales")
            .document(sales_date.isoformat())
        )
        snapshot = await doc_ref.get()
        if not snapshot.exists:
            return None
        data = snapshot.to_dict() or {}
        return {str(k): float(v) for k, v in data.get("quantities", {}).items()}

    # --- Orders ---------------------------------------------------------------

    async def save_order(self, order: Order) -> None:
        """Write an order draft to `shops/{shopId}/orders/{id}`."""
        doc_ref = (
            self._db.collection("shops")
            .document(order.shop_id)
            .collection("orders")
            .document(order.id)
        )
        await doc_ref.set(order.model_dump(mode="json"))

    async def get_orders(self, shop_id: str, limit: int = 20) -> list[Order]:
        """Read the shop's orders, newest first."""
        docs = (
            self._db.collection("shops")
            .document(shop_id)
            .collection("orders")
            .order_by("created_at", direction="DESCENDING")
            .limit(limit)
            .stream()
        )
        orders: list[Order] = []
        async for doc in docs:
            orders.append(Order.model_validate(doc.to_dict()))
        return orders

    async def update_order_status(self, shop_id: str, order_id: str, status: OrderStatus) -> None:
        """Update an order's status (and sent_at) in place."""
        doc_ref = (
            self._db.collection("shops")
            .document(shop_id)
            .collection("orders")
            .document(order_id)
        )
        await doc_ref.set(
            {
                "status": status.value,
                "sent_at": (
                    datetime.now(timezone.utc).isoformat() if status == OrderStatus.SENT else None
                ),
            },
            merge=True,
        )

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
