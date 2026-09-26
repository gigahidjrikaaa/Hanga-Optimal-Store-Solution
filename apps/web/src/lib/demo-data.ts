/**
 * Client-side Demo Data Fallback for Hanga.
 *
 * Provides instant, zero-latency scenario snapshots for Warung Bu Sari
 * matching the DailyBriefing schema. Used when offline or during initial hydration.
 */

import { DailyBriefing, Scenario } from "@/types";

export const DEMO_BRIEFINGS: Record<Scenario, DailyBriefing> = {
  BASELINE: {
    version: "1.0",
    shop_id: "warung-bu-sari",
    generated_at: "2026-10-10T06:00:00+07:00",
    scenario: "BASELINE",
    headline: "Sabtu normal: gula dan telur menipis, amankan stok pagi ini.",
    movers: {
      fast: [
        { sku: "GULA-1KG", name: "Gula Pasir Gulaku 1kg", delta_7d: 0.22 },
        { sku: "TELUR-1KG", name: "Telur Ayam Negeri 1kg", delta_7d: 0.18 },
        { sku: "KOPI-KAPALAPI", name: "Kopi Kapal Api Mix 10s", delta_7d: 0.15 },
      ],
      slow: [
        { sku: "SUSU-UHT-1L", name: "Susu UHT Cokelat 1L", delta_7d: -0.31 },
        { sku: "SABUN-COLEK", name: "Sabun Colek Ekonomi 200g", delta_7d: -0.12 },
      ],
    },
    risks: [
      {
        type: "WASTE_RISK",
        sku: "SUSU-UHT-1L",
        window: "2026-10-14",
        severity: 1,
        factor_keys: ["TREND_DOWN", "LOW_DATA"],
      },
      {
        type: "STOCKOUT_RISK",
        sku: "GULA-1KG",
        window: "2026-10-11",
        severity: 2,
        factor_keys: ["WEEKEND", "TREND_UP"],
      },
    ],
    recommendations: [
      {
        action: "REORDER",
        sku: "GULA-1KG",
        qty: { min: 10, likely: 15, max: 20, unit: "kg" },
        confidence: "HIGH",
        factors: [
          { key: "WEEKEND", direction: "+", weight: 0.2, note_bahasa: "ramai akhir pekan" },
          { key: "TREND_UP", direction: "+", weight: 0.15, note_bahasa: "penjualan stabil naik" },
        ],
        rationale_bahasa: "Pesan 15 kg gula pasir: sisa 4 kg di rak, akhir pekan ramai pembeli bahan kue.",
        order_draft: {
          supplier_ref: "TOKO GROSIR JAYA",
          est_cost_idr: 210000,
          wa_deep_link:
            "https://wa.me/6281234567890?text=Halo%20Toko%20Grosir%20Jaya,%20Bu%20Sari%20mau%20pesan%20Gula%20Pasir%201kg%20sebanyak%2015%20kg.%20Mohon%20dikirim%20pagi%20ini.%20Terima%20kasih!",
        },
      },
      {
        action: "REORDER",
        sku: "TELUR-1KG",
        qty: { min: 10, likely: 12, max: 15, unit: "kg" },
        confidence: "HIGH",
        factors: [
          { key: "WEEKEND", direction: "+", weight: 0.18, note_bahasa: "sarapan akhir pekan" },
        ],
        rationale_bahasa: "Pesan 12 kg telur: perputaran cepat tiap Sabtu, hindari kehabisan siang.",
        order_draft: {
          supplier_ref: "AGEN TELUR BERKAH",
          est_cost_idr: 336000,
          wa_deep_link:
            "https://wa.me/6281298765432?text=Halo%20Agen%20Telur,%20Bu%20Sari%20pesan%20Telur%2012%20kg%20ya.%20Kirim%20segera.%20Terima%20kasih!",
        },
      },
      {
        action: "PROMO",
        sku: "SUSU-UHT-1L",
        qty: { min: 3, likely: 5, max: 8, unit: "kotak" },
        confidence: "MEDIUM",
        factors: [
          { key: "WASTE_RISK", direction: "-", weight: -0.25, note_bahasa: "kadaluarsa 4 hari lagi" },
          { key: "TREND_DOWN", direction: "-", weight: -0.14, note_bahasa: "gerak lambat" },
        ],
        rationale_bahasa: "Beri bundel diskon Rp 2.000 dengan roti: habiskan 5 kotak sebelum kadaluarsa 14 Okt.",
      },
      {
        action: "HOLD",
        sku: "MINYAK-GORENG-2L",
        qty: { min: 0, likely: 0, max: 0, unit: "pouch" },
        confidence: "MEDIUM",
        factors: [
          { key: "TREND_UP", direction: "+", weight: 0.08, note_bahasa: "stok masih cukup 6 pouch" },
        ],
        rationale_bahasa: "Tahan pesanan minyak: sisa 6 pouch cukup sampai Selasa depan.",
      },
      {
        action: "SKIP",
        sku: "SABUN-COLEK",
        qty: { min: 0, likely: 0, max: 0, unit: "bungkus" },
        confidence: "LOW",
        factors: [
          { key: "TREND_DOWN", direction: "-", weight: -0.1, note_bahasa: "stok gudang berlebih" },
        ],
        rationale_bahasa: "Lewatkan sabun colek: stok 18 bungkus masih menumpuk di rak bawah.",
      },
    ],
    baseline_compare: {
      policy: "7d_moving_avg",
      deltas: { waste_pct: -18, stockout_pct: -35 },
    },
    data_quality: {
      coverage_days: 90,
      extraction_confirmed_lines: 214,
      flags: ["SUSU-UHT-1L: penjualan menurun 3 minggu terakhir"],
    },
  },

  LEBARAN_T14: {
    version: "1.0",
    shop_id: "warung-bu-sari",
    generated_at: "2026-10-10T06:00:00+07:00",
    scenario: "LEBARAN_T14",
    headline: "Lebaran H-14: Borong sirup, biskuit & tepung! Permintaan melonjak drastis.",
    movers: {
      fast: [
        { sku: "SIRUP-MARJAN-650ML", name: "Sirup Marjan Boudoin 650ml", delta_7d: 1.45 },
        { sku: "BISKUIT-KHONG-GUAN", name: "Khong Guan Biscuit Can 650g", delta_7d: 2.1 },
        { sku: "TEPUNG-TERIGU-1KG", name: "Tepung Terigu Segitiga Biru 1kg", delta_7d: 0.88 },
      ],
      slow: [
        { sku: "MIE-INSTAN-GORENG", name: "Indomie Goreng Original", delta_7d: -0.25 },
        { sku: "SUSU-UHT-1L", name: "Susu UHT Cokelat 1L", delta_7d: -0.4 },
      ],
    },
    risks: [
      {
        type: "STOCKOUT_RISK",
        sku: "SIRUP-MARJAN-650ML",
        window: "2026-10-12",
        severity: 2,
        factor_keys: ["LEBARAN_T14", "TREND_UP"],
      },
      {
        type: "STOCKOUT_RISK",
        sku: "BISKUIT-KHONG-GUAN",
        window: "2026-10-13",
        severity: 2,
        factor_keys: ["LEBARAN_T14"],
      },
    ],
    recommendations: [
      {
        action: "REORDER",
        sku: "SIRUP-MARJAN-650ML",
        qty: { min: 24, likely: 36, max: 48, unit: "botol" },
        confidence: "HIGH",
        factors: [
          { key: "LEBARAN_T14", direction: "+", weight: 0.45, note_bahasa: "persiapan parsel & buka" },
          { key: "TREND_UP", direction: "+", weight: 0.25, note_bahasa: "borongan warga" },
        ],
        rationale_bahasa:
          "Pesan 36 botol sirup: warga mulai borong untuk parsel lebaran. Harga grosir naik minggu depan.",
        order_draft: {
          supplier_ref: "TOKO GROSIR JAYA",
          est_cost_idr: 792000,
          wa_deep_link:
            "https://wa.me/6281234567890?text=Halo%20Toko%20Grosir%20Jaya,%20Bu%20Sari%20pesan%20Sirup%20Marjan%2036%20botol%20(3%20karton)%20untuk%20persiapan%20Lebaran.%20Kirim%20hari%20ini%20ya!",
        },
      },
      {
        action: "REORDER",
        sku: "BISKUIT-KHONG-GUAN",
        qty: { min: 12, likely: 18, max: 24, unit: "kaleng" },
        confidence: "HIGH",
        factors: [
          { key: "LEBARAN_T14", direction: "+", weight: 0.5, note_bahasa: "suguhan khas lebaran" },
        ],
        rationale_bahasa:
          "Pesan 18 kaleng Khong Guan: barang cepat habis di distributor jika telat pesan sekarang.",
        order_draft: {
          supplier_ref: "TOKO GROSIR JAYA",
          est_cost_idr: 1620000,
          wa_deep_link:
            "https://wa.me/6281234567890?text=Halo%20Grosir%20Jaya,%20Bu%20Sari%20pesan%20Biskuit%20Khong%20Guan%20Kaleng%2018%20buah.%20Segera%20amankan%20stok.",
        },
      },
      {
        action: "REORDER",
        sku: "TEPUNG-TERIGU-1KG",
        qty: { min: 20, likely: 30, max: 40, unit: "kg" },
        confidence: "HIGH",
        factors: [
          { key: "LEBARAN_T14", direction: "+", weight: 0.35, note_bahasa: "pembuatan kue kering" },
        ],
        rationale_bahasa:
          "Pesan 30 kg tepung: pesanan kue nastar & kastengel warga sekitar mulai berjalan ramai.",
        order_draft: {
          supplier_ref: "TOKO GROSIR JAYA",
          est_cost_idr: 330000,
          wa_deep_link:
            "https://wa.me/6281234567890?text=Halo%20Grosir%20Jaya,%20Bu%20Sari%20pesan%20Tepung%20Terigu%20Segitiga%2030%20kg.%20Terima%20kasih.",
        },
      },
      {
        action: "HOLD",
        sku: "MIE-INSTAN-GORENG",
        qty: { min: 0, likely: 0, max: 0, unit: "dus" },
        confidence: "MEDIUM",
        factors: [
          { key: "LEBARAN_T14", direction: "-", weight: -0.2, note_bahasa: "konsumsi mie turun saat ramadan" },
        ],
        rationale_bahasa: "Tahan reorder mie instan: warga lebih banyak masak besar dan berbuka dengan nasi.",
      },
      {
        action: "SKIP",
        sku: "SUSU-UHT-1L",
        qty: { min: 0, likely: 0, max: 0, unit: "kotak" },
        confidence: "LOW",
        factors: [
          { key: "WASTE_RISK", direction: "-", weight: -0.3, note_bahasa: "fokus modal pada barang lebaran" },
        ],
        rationale_bahasa: "Jangan pesan susu UHT: alihkan seluruh modal kas harian untuk stok biskuit dan sirup.",
      },
    ],
    baseline_compare: {
      policy: "seasonal_lebaran_model",
      deltas: { waste_pct: -28, stockout_pct: -52 },
    },
    data_quality: {
      coverage_days: 90,
      extraction_confirmed_lines: 214,
      flags: ["Pola Lebaran disesuaikan siklus H-14 tahun lalu"],
    },
  },

  PAYDAY_T3: {
    version: "1.0",
    shop_id: "warung-bu-sari",
    generated_at: "2026-10-10T06:00:00+07:00",
    scenario: "PAYDAY_T3",
    headline: "Musim Gajian: Daya beli warga naik! Tambah stok beras, minyak & rokok premium.",
    movers: {
      fast: [
        { sku: "BERAS-PANDAN-5KG", name: "Beras Pandan Wangi 5kg", delta_7d: 0.48 },
        { sku: "MINYAK-GORENG-2L", name: "Minyak Bimoli 2L", delta_7d: 0.35 },
        { sku: "ROKOK-SAMP-16", name: "Sampoerna Mild 16s", delta_7d: 0.28 },
      ],
      slow: [{ sku: "IKAN-ASIN-100G", name: "Ikan Asin Teri 100g", delta_7d: -0.22 }],
    },
    risks: [
      {
        type: "STOCKOUT_RISK",
        sku: "BERAS-PANDAN-5KG",
        window: "2026-10-11",
        severity: 2,
        factor_keys: ["PAYDAY", "TREND_UP"],
      },
    ],
    recommendations: [
      {
        action: "REORDER",
        sku: "BERAS-PANDAN-5KG",
        qty: { min: 10, likely: 15, max: 20, unit: "karung" },
        confidence: "HIGH",
        factors: [
          { key: "PAYDAY", direction: "+", weight: 0.35, note_bahasa: "gajian pabrik kemarin" },
          { key: "TREND_UP", direction: "+", weight: 0.2, note_bahasa: "pembelian ukuran 5kg naik" },
        ],
        rationale_bahasa:
          "Pesan 15 karung beras 5kg: warga belanja bulanan setelah gajian, stok saat ini tersisa 2 karung.",
        order_draft: {
          supplier_ref: "AGEN BERAS MAKMUR",
          est_cost_idr: 1125000,
          wa_deep_link:
            "https://wa.me/6281211112222?text=Halo%20Agen%20Beras,%20Bu%20Sari%20pesan%20Beras%20Pandan%20Wangi%205kg%2015%20karung.%20Kirim%20pagi%20ini%20ya.",
        },
      },
      {
        action: "REORDER",
        sku: "MINYAK-GORENG-2L",
        qty: { min: 12, likely: 18, max: 24, unit: "pouch" },
        confidence: "HIGH",
        factors: [
          { key: "PAYDAY", direction: "+", weight: 0.25, note_bahasa: "beli pouch 2 liter" },
        ],
        rationale_bahasa:
          "Pesan 18 pouch minyak 2L: pasca gajian warga beralih dari minyak curah ke kemasan 2L.",
        order_draft: {
          supplier_ref: "TOKO GROSIR JAYA",
          est_cost_idr: 612000,
          wa_deep_link:
            "https://wa.me/6281234567890?text=Halo%20Grosir%20Jaya,%20Bu%20Sari%20pesan%20Minyak%20Bimoli%202L%2018%20pouch.%20Terima%20kasih.",
        },
      },
      {
        action: "HOLD",
        sku: "IKAN-ASIN-100G",
        qty: { min: 0, likely: 0, max: 0, unit: "bungkus" },
        confidence: "MEDIUM",
        factors: [
          { key: "PAYDAY", direction: "-", weight: -0.15, note_bahasa: "warga beralih ke ayam & telur" },
        ],
        rationale_bahasa: "Tahan reorder ikan asin: saat gajian warga beralih belanja daging dan telur segar.",
      },
    ],
    baseline_compare: {
      policy: "payday_cycle_model",
      deltas: { waste_pct: -12, stockout_pct: -41 },
    },
    data_quality: {
      coverage_days: 90,
      extraction_confirmed_lines: 214,
      flags: ["Siklus gajian tanggal 25-28 dan 1-3 terkonfirmasi aktif"],
    },
  },

  RAIN_TOMORROW: {
    version: "1.0",
    shop_id: "warung-bu-sari",
    generated_at: "2026-10-10T06:00:00+07:00",
    scenario: "RAIN_TOMORROW",
    headline: "Prakiraan Hujan Lebat: Siapkan mie kuah & kopi sachet, tahan stok roti basah.",
    movers: {
      fast: [
        { sku: "MIE-SOTO-AYAM", name: "Indomie Soto Mie Kuah", delta_7d: 0.62 },
        { sku: "KOPI-JAHE-SACHET", name: "Kopi Jahe KukuBima Sachet", delta_7d: 0.45 },
        { sku: "TOLAK-ANGIN", name: "Tolak Angin Cair 12s", delta_7d: 0.38 },
      ],
      slow: [
        { sku: "ES-KRIM-CONE", name: "Es Krim Wall's Cornetto", delta_7d: -0.65 },
        { sku: "ROTI-BASAH", name: "Roti Manis Sari Roti", delta_7d: -0.28 },
      ],
    },
    risks: [
      {
        type: "WASTE_RISK",
        sku: "ROTI-BASAH",
        window: "2026-10-12",
        severity: 2,
        factor_keys: ["RAIN", "WASTE_RISK"],
      },
      {
        type: "STOCKOUT_RISK",
        sku: "MIE-SOTO-AYAM",
        window: "2026-10-11",
        severity: 2,
        factor_keys: ["RAIN", "TREND_UP"],
      },
    ],
    recommendations: [
      {
        action: "REORDER",
        sku: "MIE-SOTO-AYAM",
        qty: { min: 2, likely: 3, max: 4, unit: "dus" },
        confidence: "HIGH",
        factors: [
          { key: "RAIN", direction: "+", weight: 0.38, note_bahasa: "hujan lebat seharian" },
          { key: "TREND_UP", direction: "+", weight: 0.18, note_bahasa: "konsumsi mie kuah naik" },
        ],
        rationale_bahasa: "Pesan 3 dus Indomie Soto: cuaca hujan dingin menaikkan penjualan mie kuah hingga 60%.",
        order_draft: {
          supplier_ref: "TOKO GROSIR JAYA",
          est_cost_idr: 345000,
          wa_deep_link:
            "https://wa.me/6281234567890?text=Halo%20Grosir%20Jaya,%20Bu%20Sari%20pesan%20Indomie%20Soto%20Mie%203%20dus.%20Kirim%20sebelum%20hujan%20ya.",
        },
      },
      {
        action: "REORDER",
        sku: "KOPI-JAHE-SACHET",
        qty: { min: 3, likely: 5, max: 6, unit: "renceng" },
        confidence: "HIGH",
        factors: [
          { key: "RAIN", direction: "+", weight: 0.28, note_bahasa: "minuman hangat dicari" },
        ],
        rationale_bahasa: "Pesan 5 renceng Kopi Jahe & Tolak Angin: penghangat badan laris manis saat cuaca mendung dingin.",
        order_draft: {
          supplier_ref: "TOKO GROSIR JAYA",
          est_cost_idr: 85000,
          wa_deep_link:
            "https://wa.me/6281234567890?text=Halo%20Grosir%20Jaya,%20Bu%20Sari%20tambah%20Kopi%20Jahe%205%20renceng.%20Terima%20kasih.",
        },
      },
      {
        action: "SKIP",
        sku: "ROTI-BASAH",
        qty: { min: 0, likely: 0, max: 0, unit: "buah" },
        confidence: "HIGH",
        factors: [
          { key: "RAIN", direction: "-", weight: -0.32, note_bahasa: "pengunjung jalan kaki sepi" },
          { key: "WASTE_RISK", direction: "-", weight: -0.25, note_bahasa: "cepat jamuran & basi" },
        ],
        rationale_bahasa: "Tolak kiriman sales roti hari ini: jalanan sepi saat hujan, risiko basi dan retur tinggi.",
      },
      {
        action: "HOLD",
        sku: "ES-KRIM-CONE",
        qty: { min: 0, likely: 0, max: 0, unit: "buah" },
        confidence: "MEDIUM",
        factors: [
          { key: "RAIN", direction: "-", weight: -0.4, note_bahasa: "anak-anak tidak jajan es" },
        ],
        rationale_bahasa: "Tahan restock freezer es krim: permintaan anjlok saat cuaca dingin berangin.",
      },
    ],
    baseline_compare: {
      policy: "weather_adjusted_model",
      deltas: { waste_pct: -24, stockout_pct: -31 },
    },
    data_quality: {
      coverage_days: 90,
      extraction_confirmed_lines: 214,
      flags: ["Peringatan BMKG: Hujan lebat disertai angin kencang siang hingga malam"],
    },
  },
};
