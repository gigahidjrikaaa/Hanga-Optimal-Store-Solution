"""
Hanga API — Seeded catalog for Warung Bu Sari.

The shared SKU dictionary from briefing_spec.md §6 (`catalog/{sku}`): display
names, units, grosir unit costs, perishability, and the local-context tags the
compute layer uses for factor activation. Kept in code for demo mode; in live
mode this mirrors the Firestore `catalog` collection.
"""

from app.services.compute import CatalogEntry

BU_SARI_CATALOG: list[CatalogEntry] = [
    CatalogEntry(
        sku="GULA-1KG",
        name="Gula Pasir Gulaku 1kg",
        unit="kg",
        unit_cost_idr=14000,
        category="BAHAN_POKOK",
        payday_boom=True,
    ),
    CatalogEntry(
        sku="TELUR-1KG",
        name="Telur Ayam Negeri 1kg",
        unit="kg",
        unit_cost_idr=28000,
        category="BAHAN_POKOK",
        perishable=True,
        shelf_days=21,
        payday_boom=True,
    ),
    CatalogEntry(
        sku="KOPI-KAPALAPI",
        name="Kopi Kapal Api Mix 10s",
        unit="renceng",
        unit_cost_idr=12000,
        category="MINUMAN",
    ),
    CatalogEntry(
        sku="SUSU-UHT-1L",
        name="Susu UHT Cokelat 1L",
        unit="kotak",
        unit_cost_idr=18000,
        category="MINUMAN",
        payday_boom=True,
    ),
    CatalogEntry(
        sku="MINYAK-GORENG-2L",
        name="Minyak Bimoli 2L",
        unit="pouch",
        unit_cost_idr=34000,
        category="BAHAN_POKOK",
        payday_boom=True,
    ),
    CatalogEntry(
        sku="SABUN-COLEK",
        name="Sabun Colek Ekonomi 200g",
        unit="bungkus",
        unit_cost_idr=3000,
        category="PERAWATAN",
    ),
    CatalogEntry(
        sku="BERAS-PANDAN-5KG",
        name="Beras Pandan Wangi 5kg",
        unit="karung",
        unit_cost_idr=75000,
        category="BAHAN_POKOK",
        payday_boom=True,
    ),
    CatalogEntry(
        sku="ROKOK-SAMP-16",
        name="Sampoerna Mild 16s",
        unit="bungkus",
        unit_cost_idr=33500,
        category="LAINNYA",
        payday_boom=True,
    ),
    CatalogEntry(
        sku="IKAN-ASIN-100G",
        name="Ikan Asin Teri 100g",
        unit="bungkus",
        unit_cost_idr=5000,
        category="BAHAN_POKOK",
        perishable=True,
        shelf_days=90,
    ),
    CatalogEntry(
        sku="MIE-INSTAN-GORENG",
        name="Indomie Goreng Original",
        unit="dus",
        unit_cost_idr=130000,
        category="BAHAN_POKOK",
    ),
    CatalogEntry(
        sku="SIRUP-MARJAN-650ML",
        name="Sirup Marjan Boudoin 650ml",
        unit="botol",
        unit_cost_idr=22000,
        category="MINUMAN",
        festive=True,
    ),
    CatalogEntry(
        sku="BISKUIT-KHONG-GUAN",
        name="Khong Guan Biscuit Can 650g",
        unit="kaleng",
        unit_cost_idr=90000,
        category="SNACK",
        festive=True,
    ),
    CatalogEntry(
        sku="TEPUNG-TERIGU-1KG",
        name="Tepung Terigu Segitiga Biru 1kg",
        unit="kg",
        unit_cost_idr=11000,
        category="BAHAN_POKOK",
        festive=True,
        payday_boom=True,
    ),
    CatalogEntry(
        sku="MIE-SOTO-AYAM",
        name="Indomie Soto Mie Kuah",
        unit="dus",
        unit_cost_idr=115000,
        category="BAHAN_POKOK",
        rain_boom=True,
    ),
    CatalogEntry(
        sku="KOPI-JAHE-SACHET",
        name="Kopi Jahe KukuBima Sachet",
        unit="renceng",
        unit_cost_idr=17000,
        category="MINUMAN",
        rain_boom=True,
    ),
    CatalogEntry(
        sku="TOLAK-ANGIN",
        name="Tolak Angin Cair 12s",
        unit="kotak",
        unit_cost_idr=25000,
        category="LAINNYA",
        rain_boom=True,
    ),
    CatalogEntry(
        sku="ES-KRIM-CONE",
        name="Es Krim Wall's Cornetto",
        unit="buah",
        unit_cost_idr=11000,
        category="SNACK",
        perishable=True,
        shelf_days=60,
    ),
    CatalogEntry(
        sku="ROTI-BASAH",
        name="Roti Manis Sari Roti",
        unit="buah",
        unit_cost_idr=2500,
        category="SNACK",
        perishable=True,
        shelf_days=4,
    ),
]

# Stock on hand today (units), from Bu Sari's last shelf count.
BU_SARI_STOCK: dict[str, float] = {
    "GULA-1KG": 4,
    "TELUR-1KG": 3,
    "KOPI-KAPALAPI": 14,
    "SUSU-UHT-1L": 9,
    "MINYAK-GORENG-2L": 6,
    "SABUN-COLEK": 18,
    "BERAS-PANDAN-5KG": 2,
    "ROKOK-SAMP-16": 12,
    "IKAN-ASIN-100G": 7,
    "MIE-INSTAN-GORENG": 1.2,  # dus
    "SIRUP-MARJAN-650ML": 5,
    "BISKUIT-KHONG-GUAN": 3,
    "TEPUNG-TERIGU-1KG": 8,
    "MIE-SOTO-AYAM": 0.5,  # dus
    "KOPI-JAHE-SACHET": 6,
    "TOLAK-ANGIN": 4,
    "ES-KRIM-CONE": 11,
    "ROTI-BASAH": 14,
}
