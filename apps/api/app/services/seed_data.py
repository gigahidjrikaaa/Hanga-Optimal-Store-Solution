"""
Hanga API — Seed data for Demo Mode.

Provides pre-computed, realistic DailyBriefing datasets for Warung Bu Sari
on 2026-10-10 across all 4 canonical scenarios:
- BASELINE (Standard Saturday operations)
- LEBARAN_T14 (Ramadan / Lebaran prep: bulk demand inverts recommendations)
- PAYDAY_T3 (Salary week: higher purchasing power & FMCG volume)
- RAIN_TOMORROW (Heavy rain forecast: depressed foot traffic, warm goods surge)

Each briefing carries a v1.1 `budget` block: a cash-feasible order bundle fitted
by the compute layer. LEBARAN_T14 deliberately overruns cash so the demo shows a
*visible deferral* (CASH_TIGHT) — the cash-first advisor story.

Contract: docs/briefing_spec.md §2 (v1.1)
Demo invariants: committed_idr ≤ cash_available_idr; deferred_skus always match
the recommendations carrying a CASH_TIGHT factor.
"""

from datetime import datetime
from app.schemas.briefing import (
    ActionType,
    BaselineCompare,
    Budget,
    Confidence,
    DailyBriefing,
    DataQuality,
    Factor,
    FactorKey,
    Mover,
    Movers,
    OrderDraft,
    QuantityRange,
    Recommendation,
    Risk,
    RiskType,
    Scenario,
)

DEMO_SHOP_ID = "warung-bu-sari"
DEMO_DATE_STR = "2026-10-10T06:00:00+07:00"
DEMO_DATETIME = datetime.fromisoformat(DEMO_DATE_STR)


def get_demo_briefing(scenario: Scenario, shop_id: str = DEMO_SHOP_ID) -> DailyBriefing:
    """Return a validated DailyBriefing for the requested demo scenario."""
    if scenario == Scenario.LEBARAN_T14:
        return _build_lebaran_briefing(shop_id)
    elif scenario == Scenario.PAYDAY_T3:
        return _build_payday_briefing(shop_id)
    elif scenario == Scenario.RAIN_TOMORROW:
        return _build_rain_briefing(shop_id)
    else:
        return _build_baseline_briefing(shop_id)


def _build_baseline_briefing(shop_id: str) -> DailyBriefing:
    """BASELINE: Normal Saturday morning operations; bundle fits cash comfortably."""
    return DailyBriefing(
        version="1.1",
        shop_id=shop_id,
        generated_at=DEMO_DATETIME,
        scenario=Scenario.BASELINE,
        headline="Sabtu normal: gula dan telur menipis, amankan stok pagi ini.",
        budget=Budget(
            cash_available_idr=700000,
            committed_idr=546000,
            remaining_idr=154000,
            deferred_skus=[],
            note_bahasa="Semua pesanan prioritas muat di kas hari ini. Sisa kas aman untuk belanja besok.",
        ),
        movers=Movers(
            fast=[
                Mover(sku="GULA-1KG", name="Gula Pasir Gulaku 1kg", delta_7d=0.22),
                Mover(sku="TELUR-1KG", name="Telur Ayam Negeri 1kg", delta_7d=0.18),
                Mover(sku="KOPI-KAPALAPI", name="Kopi Kapal Api Mix 10s", delta_7d=0.15),
            ],
            slow=[
                Mover(sku="SUSU-UHT-1L", name="Susu UHT Cokelat 1L", delta_7d=-0.31),
                Mover(sku="SABUN-COLEK", name="Sabun Colek Ekonomi 200g", delta_7d=-0.12),
            ],
        ),
        risks=[
            Risk(
                type=RiskType.WASTE_RISK,
                sku="SUSU-UHT-1L",
                window="2026-10-14",
                severity=1,
                factor_keys=[FactorKey.TREND_DOWN, FactorKey.LOW_DATA],
            ),
            Risk(
                type=RiskType.STOCKOUT_RISK,
                sku="GULA-1KG",
                window="2026-10-11",
                severity=2,
                factor_keys=[FactorKey.WEEKEND, FactorKey.TREND_UP],
            ),
        ],
        recommendations=[
            Recommendation(
                action=ActionType.REORDER,
                sku="GULA-1KG",
                name="Gula Pasir Gulaku 1kg",
                est_cost_idr=210000,
                qty=QuantityRange(min=10, likely=15, max=20, unit="kg"),
                confidence=Confidence.HIGH,
                factors=[
                    Factor(key=FactorKey.WEEKEND, direction="+", weight=0.20, note_bahasa="ramai akhir pekan"),
                    Factor(key=FactorKey.TREND_UP, direction="+", weight=0.15, note_bahasa="penjualan stabil naik"),
                ],
                rationale_bahasa="Pesan 15 kg gula pasir: sisa 4 kg di rak, akhir pekan ramai pembeli bahan kue.",
                order_draft=OrderDraft(
                    supplier_ref="TOKO GROSIR JAYA",
                    est_cost_idr=210000,
                    wa_deep_link="https://wa.me/6281234567890?text=Halo%20Toko%20Grosir%20Jaya,%20Bu%20Sari%20mau%20pesan%20Gula%20Pasir%201kg%20sebanyak%2015%20kg.%20Mohon%20dikirim%20pagi%20ini.%20Terima%20kasih!",
                ),
            ),
            Recommendation(
                action=ActionType.REORDER,
                sku="TELUR-1KG",
                name="Telur Ayam Negeri 1kg",
                est_cost_idr=336000,
                qty=QuantityRange(min=10, likely=12, max=15, unit="kg"),
                confidence=Confidence.HIGH,
                factors=[
                    Factor(key=FactorKey.WEEKEND, direction="+", weight=0.18, note_bahasa="sarapan akhir pekan"),
                ],
                rationale_bahasa="Pesan 12 kg telur: perputaran cepat tiap Sabtu, hindari kehabisan siang.",
                order_draft=OrderDraft(
                    supplier_ref="AGEN TELUR BERKAH",
                    est_cost_idr=336000,
                    wa_deep_link="https://wa.me/6281298765432?text=Halo%20Agen%20Telur,%20Bu%20Sari%20pesan%20Telur%2012%20kg%20ya.%20Kirim%20segera.%20Terima%20kasih!",
                ),
            ),
            Recommendation(
                action=ActionType.PROMO,
                sku="SUSU-UHT-1L",
                name="Susu UHT Cokelat 1L",
                qty=QuantityRange(min=3, likely=5, max=8, unit="kotak"),
                confidence=Confidence.MEDIUM,
                factors=[
                    Factor(key=FactorKey.WASTE_RISK, direction="-", weight=-0.25, note_bahasa="kadaluarsa 4 hari lagi"),
                    Factor(key=FactorKey.TREND_DOWN, direction="-", weight=-0.14, note_bahasa="gerak lambat"),
                ],
                rationale_bahasa="Beri bundel diskon Rp 2.000 dengan roti: habiskan 5 kotak sebelum kadaluarsa 14 Okt.",
                order_draft=None,
            ),
            Recommendation(
                action=ActionType.HOLD,
                sku="MINYAK-GORENG-2L",
                name="Minyak Bimoli 2L",
                qty=QuantityRange(min=0, likely=0, max=0, unit="pouch"),
                confidence=Confidence.MEDIUM,
                factors=[
                    Factor(key=FactorKey.TREND_UP, direction="+", weight=0.08, note_bahasa="stok masih cukup 6 pouch"),
                ],
                rationale_bahasa="Tahan pesanan minyak: sisa 6 pouch cukup sampai Selasa depan.",
                order_draft=None,
            ),
            Recommendation(
                action=ActionType.SKIP,
                sku="SABUN-COLEK",
                name="Sabun Colek Ekonomi 200g",
                qty=QuantityRange(min=0, likely=0, max=0, unit="bungkus"),
                confidence=Confidence.LOW,
                factors=[
                    Factor(key=FactorKey.TREND_DOWN, direction="-", weight=-0.10, note_bahasa="stok gudang berlebih"),
                ],
                rationale_bahasa="Lewatkan sabun colek: stok 18 bungkus masih menumpuk di rak bawah.",
                order_draft=None,
            ),
        ],
        baseline_compare=BaselineCompare(
            policy="7d_moving_avg",
            deltas={"waste_pct": -18, "stockout_pct": -35},
        ),
        data_quality=DataQuality(
            coverage_days=90,
            extraction_confirmed_lines=214,
            flags=["SUSU-UHT-1L: penjualan menurun 3 minggu terakhir"],
        ),
    )


def _build_lebaran_briefing(shop_id: str) -> DailyBriefing:
    """LEBARAN_T14: bulk demand surges past available cash — one item deferred visibly."""
    return DailyBriefing(
        version="1.1",
        shop_id=shop_id,
        generated_at=DEMO_DATETIME,
        scenario=Scenario.LEBARAN_T14,
        headline="Lebaran H-14: Borong sirup, biskuit & tepung! Permintaan melonjak drastis.",
        budget=Budget(
            cash_available_idr=2500000,
            committed_idr=2412000,
            remaining_idr=88000,
            deferred_skus=["TEPUNG-TERIGU-1KG"],
            note_bahasa="Kas hari ini fokus sirup & biskuit. Tepung dipesan besok pagi setelah uang masuk.",
        ),
        movers=Movers(
            fast=[
                Mover(sku="SIRUP-MARJAN-650ML", name="Sirup Marjan Boudoin 650ml", delta_7d=1.45),
                Mover(sku="BISKUIT-KHONG-GUAN", name="Khong Guan Biscuit Can 650g", delta_7d=2.10),
                Mover(sku="TEPUNG-TERIGU-1KG", name="Tepung Terigu Segitiga Biru 1kg", delta_7d=0.88),
            ],
            slow=[
                Mover(sku="MIE-INSTAN-GORENG", name="Indomie Goreng Original", delta_7d=-0.25),
                Mover(sku="SUSU-UHT-1L", name="Susu UHT Cokelat 1L", delta_7d=-0.40),
            ],
        ),
        risks=[
            Risk(
                type=RiskType.STOCKOUT_RISK,
                sku="SIRUP-MARJAN-650ML",
                window="2026-10-12",
                severity=2,
                factor_keys=[FactorKey.LEBARAN_T14, FactorKey.TREND_UP],
            ),
            Risk(
                type=RiskType.STOCKOUT_RISK,
                sku="BISKUIT-KHONG-GUAN",
                window="2026-10-13",
                severity=2,
                factor_keys=[FactorKey.LEBARAN_T14],
            ),
        ],
        recommendations=[
            Recommendation(
                action=ActionType.REORDER,
                sku="SIRUP-MARJAN-650ML",
                name="Sirup Marjan Boudoin 650ml",
                est_cost_idr=792000,
                qty=QuantityRange(min=24, likely=36, max=48, unit="botol"),
                confidence=Confidence.HIGH,
                factors=[
                    Factor(key=FactorKey.LEBARAN_T14, direction="+", weight=0.45, note_bahasa="persiapan parsel & buka"),
                    Factor(key=FactorKey.TREND_UP, direction="+", weight=0.25, note_bahasa="borongan warga"),
                ],
                rationale_bahasa="Pesan 36 botol sirup: warga mulai borong untuk parsel lebaran. Harga grosir naik minggu depan.",
                order_draft=OrderDraft(
                    supplier_ref="TOKO GROSIR JAYA",
                    est_cost_idr=792000,
                    wa_deep_link="https://wa.me/6281234567890?text=Halo%20Toko%20Grosir%20Jaya,%20Bu%20Sari%20pesan%20Sirup%20Marjan%2036%20botol%20(3%20karton)%20untuk%20persiapan%20Lebaran.%20Kirim%20hari%20ini%20ya!",
                ),
            ),
            Recommendation(
                action=ActionType.REORDER,
                sku="BISKUIT-KHONG-GUAN",
                name="Khong Guan Biscuit Can 650g",
                est_cost_idr=1620000,
                qty=QuantityRange(min=12, likely=18, max=24, unit="kaleng"),
                confidence=Confidence.HIGH,
                factors=[
                    Factor(key=FactorKey.LEBARAN_T14, direction="+", weight=0.50, note_bahasa="suguhan khas lebaran"),
                ],
                rationale_bahasa="Pesan 18 kaleng Khong Guan: barang cepat habis di distributor jika telat pesan sekarang.",
                order_draft=OrderDraft(
                    supplier_ref="TOKO GROSIR JAYA",
                    est_cost_idr=1620000,
                    wa_deep_link="https://wa.me/6281234567890?text=Halo%20Grosir%20Jaya,%20Bu%20Sari%20pesan%20Biskuit%20Khong%20Guan%20Kaleng%2018%20buah.%20Segera%20amankan%20stok.",
                ),
            ),
            Recommendation(
                action=ActionType.REORDER,
                sku="TEPUNG-TERIGU-1KG",
                name="Tepung Terigu Segitiga Biru 1kg",
                est_cost_idr=330000,
                qty=QuantityRange(min=20, likely=30, max=40, unit="kg"),
                confidence=Confidence.MEDIUM,
                factors=[
                    Factor(key=FactorKey.LEBARAN_T14, direction="+", weight=0.35, note_bahasa="pembuatan kue kering"),
                    Factor(key=FactorKey.CASH_TIGHT, direction="-", weight=-0.32, note_bahasa="kas hari ini sudah terpakai"),
                ],
                rationale_bahasa="Pesan 30 kg tepung besok pagi: kas hari ini dipakai sirup & biskuit dulu, pesanan kue warga tetap jalan.",
                order_draft=OrderDraft(
                    supplier_ref="TOKO GROSIR JAYA",
                    est_cost_idr=330000,
                    wa_deep_link="https://wa.me/6281234567890?text=Halo%20Grosir%20Jaya,%20Bu%20Sari%20pesan%20Tepung%20Terigu%20Segitiga%2030%20kg%20besok%20pagi.%20Terima%20kasih.",
                ),
            ),
            Recommendation(
                action=ActionType.HOLD,
                sku="MIE-INSTAN-GORENG",
                name="Indomie Goreng Original",
                qty=QuantityRange(min=0, likely=0, max=0, unit="dus"),
                confidence=Confidence.MEDIUM,
                factors=[
                    Factor(key=FactorKey.LEBARAN_T14, direction="-", weight=-0.20, note_bahasa="konsumsi mie turun saat ramadan"),
                ],
                rationale_bahasa="Tahan reorder mie instan: warga lebih banyak masak besar dan berbuka dengan nasi.",
                order_draft=None,
            ),
            Recommendation(
                action=ActionType.SKIP,
                sku="SUSU-UHT-1L",
                name="Susu UHT Cokelat 1L",
                qty=QuantityRange(min=0, likely=0, max=0, unit="kotak"),
                confidence=Confidence.LOW,
                factors=[
                    Factor(key=FactorKey.WASTE_RISK, direction="-", weight=-0.30, note_bahasa="fokus modal pada barang lebaran"),
                ],
                rationale_bahasa="Jangan pesan susu UHT: alihkan seluruh modal kas harian untuk stok biskuit dan sirup.",
                order_draft=None,
            ),
        ],
        baseline_compare=BaselineCompare(
            policy="seasonal_lebaran_model",
            deltas={"waste_pct": -28, "stockout_pct": -52},
        ),
        data_quality=DataQuality(
            coverage_days=90,
            extraction_confirmed_lines=214,
            flags=["Pola Lebaran disesuaikan siklus H-14 tahun lalu"],
        ),
    )


def _build_payday_briefing(shop_id: str) -> DailyBriefing:
    """PAYDAY_T3: higher basket size; bundle fits post-payday cash comfortably."""
    return DailyBriefing(
        version="1.1",
        shop_id=shop_id,
        generated_at=DEMO_DATETIME,
        scenario=Scenario.PAYDAY_T3,
        headline="Musim Gajian: Daya beli warga naik! Tambah stok beras, minyak & rokok premium.",
        budget=Budget(
            cash_available_idr=2000000,
            committed_idr=1737000,
            remaining_idr=263000,
            deferred_skus=[],
            note_bahasa="Semua pesanan muat; sisa kas masih aman untuk belanja harian.",
        ),
        movers=Movers(
            fast=[
                Mover(sku="BERAS-PANDAN-5KG", name="Beras Pandan Wangi 5kg", delta_7d=0.48),
                Mover(sku="MINYAK-GORENG-2L", name="Minyak Bimoli 2L", delta_7d=0.35),
                Mover(sku="ROKOK-SAMP-16", name="Sampoerna Mild 16s", delta_7d=0.28),
            ],
            slow=[
                Mover(sku="IKAN-ASIN-100G", name="Ikan Asin Teri 100g", delta_7d=-0.22),
            ],
        ),
        risks=[
            Risk(
                type=RiskType.STOCKOUT_RISK,
                sku="BERAS-PANDAN-5KG",
                window="2026-10-11",
                severity=2,
                factor_keys=[FactorKey.PAYDAY, FactorKey.TREND_UP],
            ),
        ],
        recommendations=[
            Recommendation(
                action=ActionType.REORDER,
                sku="BERAS-PANDAN-5KG",
                name="Beras Pandan Wangi 5kg",
                est_cost_idr=1125000,
                qty=QuantityRange(min=10, likely=15, max=20, unit="karung"),
                confidence=Confidence.HIGH,
                factors=[
                    Factor(key=FactorKey.PAYDAY, direction="+", weight=0.35, note_bahasa="gajian pabrik kemarin"),
                    Factor(key=FactorKey.TREND_UP, direction="+", weight=0.20, note_bahasa="pembelian ukuran 5kg naik"),
                ],
                rationale_bahasa="Pesan 15 karung beras 5kg: warga belanja bulanan setelah gajian, stok saat ini tersisa 2 karung.",
                order_draft=OrderDraft(
                    supplier_ref="AGEN BERAS MAKMUR",
                    est_cost_idr=1125000,
                    wa_deep_link="https://wa.me/6281211112222?text=Halo%20Agen%20Beras,%20Bu%20Sari%20pesan%20Beras%20Pandan%20Wangi%205kg%2015%20karung.%20Kirim%20pagi%20ini%20ya.",
                ),
            ),
            Recommendation(
                action=ActionType.REORDER,
                sku="MINYAK-GORENG-2L",
                name="Minyak Bimoli 2L",
                est_cost_idr=612000,
                qty=QuantityRange(min=12, likely=18, max=24, unit="pouch"),
                confidence=Confidence.HIGH,
                factors=[
                    Factor(key=FactorKey.PAYDAY, direction="+", weight=0.25, note_bahasa="beli pouch 2 liter"),
                ],
                rationale_bahasa="Pesan 18 pouch minyak 2L: pasca gajian warga beralih dari minyak curah ke kemasan 2L.",
                order_draft=OrderDraft(
                    supplier_ref="TOKO GROSIR JAYA",
                    est_cost_idr=612000,
                    wa_deep_link="https://wa.me/6281234567890?text=Halo%20Grosir%20Jaya,%20Bu%20Sari%20pesan%20Minyak%20Bimoli%202L%2018%20pouch.%20Terima%20kasih.",
                ),
            ),
            Recommendation(
                action=ActionType.HOLD,
                sku="IKAN-ASIN-100G",
                name="Ikan Asin Teri 100g",
                qty=QuantityRange(min=0, likely=0, max=0, unit="bungkus"),
                confidence=Confidence.MEDIUM,
                factors=[
                    Factor(key=FactorKey.PAYDAY, direction="-", weight=-0.15, note_bahasa="warga beralih ke ayam & telur"),
                ],
                rationale_bahasa="Tahan reorder ikan asin: saat gajian warga beralih belanja daging dan telur segar.",
                order_draft=None,
            ),
        ],
        baseline_compare=BaselineCompare(
            policy="payday_cycle_model",
            deltas={"waste_pct": -12, "stockout_pct": -41},
        ),
        data_quality=DataQuality(
            coverage_days=90,
            extraction_confirmed_lines=214,
            flags=["Siklus gajian tanggal 25-28 dan 1-3 terkonfirmasi aktif"],
        ),
    )


def _build_rain_briefing(shop_id: str) -> DailyBriefing:
    """RAIN_TOMORROW: foot traffic down, warm goods surge; small bundle fits cash."""
    return DailyBriefing(
        version="1.1",
        shop_id=shop_id,
        generated_at=DEMO_DATETIME,
        scenario=Scenario.RAIN_TOMORROW,
        headline="Prakiraan Hujan Lebat: Siapkan mie kuah & kopi sachet, tahan stok roti basah.",
        budget=Budget(
            cash_available_idr=500000,
            committed_idr=430000,
            remaining_idr=70000,
            deferred_skus=[],
            note_bahasa="Pesanan anti-hujan muat di kas. Lewatkan roti agar modal tidak nyangkut.",
        ),
        movers=Movers(
            fast=[
                Mover(sku="MIE-SOTO-AYAM", name="Indomie Soto Mie Kuah", delta_7d=0.62),
                Mover(sku="KOPI-JAHE-SACHET", name="Kopi Jahe KukuBima Sachet", delta_7d=0.45),
                Mover(sku="TOLAK-ANGIN", name="Tolak Angin Cair 12s", delta_7d=0.38),
            ],
            slow=[
                Mover(sku="ES-KRIM-CONE", name="Es Krim Wall's Cornetto", delta_7d=-0.65),
                Mover(sku="ROTI-BASAH", name="Roti Manis Sari Roti", delta_7d=-0.28),
            ],
        ),
        risks=[
            Risk(
                type=RiskType.WASTE_RISK,
                sku="ROTI-BASAH",
                window="2026-10-12",
                severity=2,
                factor_keys=[FactorKey.RAIN, FactorKey.WASTE_RISK],
            ),
            Risk(
                type=RiskType.STOCKOUT_RISK,
                sku="MIE-SOTO-AYAM",
                window="2026-10-11",
                severity=2,
                factor_keys=[FactorKey.RAIN, FactorKey.TREND_UP],
            ),
        ],
        recommendations=[
            Recommendation(
                action=ActionType.REORDER,
                sku="MIE-SOTO-AYAM",
                name="Indomie Soto Mie Kuah",
                est_cost_idr=345000,
                qty=QuantityRange(min=2, likely=3, max=4, unit="dus"),
                confidence=Confidence.HIGH,
                factors=[
                    Factor(key=FactorKey.RAIN, direction="+", weight=0.38, note_bahasa="hujan lebat seharian"),
                    Factor(key=FactorKey.TREND_UP, direction="+", weight=0.18, note_bahasa="konsumsi mie kuah naik"),
                ],
                rationale_bahasa="Pesan 3 dus Indomie Soto: cuaca hujan dingin menaikkan penjualan mie kuah hingga 60%.",
                order_draft=OrderDraft(
                    supplier_ref="TOKO GROSIR JAYA",
                    est_cost_idr=345000,
                    wa_deep_link="https://wa.me/6281234567890?text=Halo%20Grosir%20Jaya,%20Bu%20Sari%20pesan%20Indomie%20Soto%20Mie%203%20dus.%20Kirim%20sebelum%20hujan%20ya.",
                ),
            ),
            Recommendation(
                action=ActionType.REORDER,
                sku="KOPI-JAHE-SACHET",
                name="Kopi Jahe KukuBima Sachet",
                est_cost_idr=85000,
                qty=QuantityRange(min=3, likely=5, max=6, unit="renceng"),
                confidence=Confidence.HIGH,
                factors=[
                    Factor(key=FactorKey.RAIN, direction="+", weight=0.28, note_bahasa="minuman hangat dicari"),
                ],
                rationale_bahasa="Pesan 5 renceng Kopi Jahe & Tolak Angin: penghangat badan laris manis saat cuaca mendung dingin.",
                order_draft=OrderDraft(
                    supplier_ref="TOKO GROSIR JAYA",
                    est_cost_idr=85000,
                    wa_deep_link="https://wa.me/6281234567890?text=Halo%20Grosir%20Jaya,%20Bu%20Sari%20tambah%20Kopi%20Jahe%205%20renceng.%20Terima%20kasih.",
                ),
            ),
            Recommendation(
                action=ActionType.SKIP,
                sku="ROTI-BASAH",
                name="Roti Manis Sari Roti",
                qty=QuantityRange(min=0, likely=0, max=0, unit="buah"),
                confidence=Confidence.HIGH,
                factors=[
                    Factor(key=FactorKey.RAIN, direction="-", weight=-0.32, note_bahasa="pengunjung jalan kaki sepi"),
                    Factor(key=FactorKey.WASTE_RISK, direction="-", weight=-0.25, note_bahasa="cepat jamuran & basi"),
                ],
                rationale_bahasa="Tolak kiriman sales roti hari ini: jalanan sepi saat hujan, risiko basi dan retur tinggi.",
                order_draft=None,
            ),
            Recommendation(
                action=ActionType.HOLD,
                sku="ES-KRIM-CONE",
                name="Es Krim Wall's Cornetto",
                qty=QuantityRange(min=0, likely=0, max=0, unit="buah"),
                confidence=Confidence.MEDIUM,
                factors=[
                    Factor(key=FactorKey.RAIN, direction="-", weight=-0.40, note_bahasa="anak-anak tidak jajan es"),
                ],
                rationale_bahasa="Tahan restock freezer es krim: permintaan anjlok saat cuaca dingin berangin.",
                order_draft=None,
            ),
        ],
        baseline_compare=BaselineCompare(
            policy="weather_adjusted_model",
            deltas={"waste_pct": -24, "stockout_pct": -31},
        ),
        data_quality=DataQuality(
            coverage_days=90,
            extraction_confirmed_lines=214,
            flags=["Peringatan BMKG: Hujan lebat disertai angin kencang siang hingga malam"],
        ),
    )
