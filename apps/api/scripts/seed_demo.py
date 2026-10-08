"""
Hanga — Demo Firestore seeding script.

Populates a real Firebase project with everything the demo and the live
compute path need:

  catalog/{sku}                          — Bu Sari's SKU dictionary
  factors/{date}                         — weekend/payday/rain flags
  shops/{shopId}                         — profile + cash_available_idr
  shops/{shopId}/sales/{date}            — 90 days of synthetic history
  shops/{shopId}/briefings/{date}_{scen} — the 4 authored scenario snapshots

Usage (from apps/api, with GOOGLE_APPLICATION_CREDENTIALS pointing at a
service-account JSON and the project set via env or flag):

  python scripts/seed_demo.py --project your-project-id
  python scripts/seed_demo.py --dry-run          # validate, write nothing
  python scripts/seed_demo.py --skip-sales       # briefings/catalog only
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from dataclasses import asdict
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings  # noqa: E402
from app.schemas.briefing import Scenario  # noqa: E402
from app.services.catalog_data import BU_SARI_CATALOG  # noqa: E402
from app.services.compute import calendar_multiplier  # noqa: E402
from app.services.seed_data import get_demo_briefing  # noqa: E402
from app.services.synthetic import generate_sales_history  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed Firestore for the Hanga demo")
    parser.add_argument("--project", default=settings.gcp_project_id or None)
    parser.add_argument("--shop", default=settings.demo_shop_id)
    parser.add_argument("--days", type=int, default=90, help="Sales history days")
    parser.add_argument("--skip-sales", action="store_true", help="Skip sales seeding")
    parser.add_argument("--dry-run", action="store_true", help="Validate, write nothing")
    return parser.parse_args()


def factor_keys_for(day: date) -> list[str]:
    keys: list[str] = []
    if calendar_multiplier(day) > 1.0:
        if day.weekday() >= 5:
            keys.append("WEEKEND")
        if day.day >= 25 or day.day <= 3:
            keys.append("PAYDAY")
    return keys


async def main() -> None:
    args = parse_args()
    if not args.dry_run and not args.project:
        print("ERROR: --project or HANGA_GCP_PROJECT_ID required (unless --dry-run)")
        sys.exit(1)

    demo_day = date.fromisoformat(settings.demo_date)

    # --- Build payloads ---------------------------------------------------
    catalog_docs = {e.sku: asdict(e) for e in BU_SARI_CATALOG}

    factor_docs: dict[str, dict] = {}
    for offset in range(args.days):
        day = demo_day - timedelta(days=offset)
        factor_docs[day.isoformat()] = {
            "date": day.isoformat(),
            "keys": factor_keys_for(day),
            **(
                {"note": "BMKG: hujan lebat disertai angin kencang"}
                if day == demo_day
                else {}
            ),
        }

    briefing_docs: dict[str, dict] = {}
    for scenario in Scenario:
        briefing = get_demo_briefing(scenario, args.shop)
        doc_id = f"{demo_day.isoformat()}_{scenario.value}"
        briefing_docs[doc_id] = briefing.model_dump(mode="json")

    shop_doc = {
        "shop_id": args.shop,
        "name": "Warung Berkah Jaya",
        "owner": "Bu Sari",
        "type": "Kelontong",
        "area": "Pasar Minggu, Jakarta Selatan",
        "supplier": {"name": "TOKO GROSIR JAYA", "wa": "6281234567890"},
        "cash_available_idr": 700000,
    }

    sales_docs: dict[str, dict] = {}
    if not args.skip_sales:
        history = generate_sales_history(demo_day, days=args.days)
        for day, quantities in history.items():
            sales_docs[day.isoformat()] = {
                "date": day.isoformat(),
                "quantities": quantities,
                "source": "seed",
            }

    print(
        f"Seed plan: shop=1 catalog={len(catalog_docs)} factors={len(factor_docs)} "
        f"briefings={len(briefing_docs)} sales={len(sales_docs)} (shop={args.shop})"
    )

    if args.dry_run:
        print("Dry run — payloads validated, nothing written.")
        return

    # --- Write ------------------------------------------------------------
    import firebase_admin
    from firebase_admin import firestore

    firebase_admin.initialize_app(
        options={"projectId": args.project, "storageBucket": settings.firebase_storage_bucket}
    )
    db = firestore.client()
    batch_limit = 400

    def write_in_batches(path: str, docs: dict[str, dict]) -> int:
        count = 0
        batch = db.batch()
        for doc_id, payload in docs.items():
            batch.set(db.collection(path).document(doc_id), payload)
            count += 1
            if count % batch_limit == 0:
                batch.commit()
                batch = db.batch()
        batch.commit()
        return count

    shop = db.collection("shops").document(args.shop)
    shop.set(shop_doc)
    n_sales = 0
    if sales_docs:
        batch = db.batch()
        for doc_id, payload in sales_docs.items():
            batch.set(shop.collection("sales").document(doc_id), payload)
            n_sales += 1
            if n_sales % batch_limit == 0:
                batch.commit()
                batch = db.batch()
        batch.commit()

    batch = db.batch()
    for doc_id, payload in briefing_docs.items():
        batch.set(shop.collection("briefings").document(doc_id), payload)
    batch.commit()

    n_catalog = write_in_batches("catalog", catalog_docs)
    n_factors = write_in_batches("factors", factor_docs)

    print(f"Done: shop=1 catalog={n_catalog} factors={n_factors} sales={n_sales} briefings={len(briefing_docs)}")


if __name__ == "__main__":
    asyncio.run(main())
