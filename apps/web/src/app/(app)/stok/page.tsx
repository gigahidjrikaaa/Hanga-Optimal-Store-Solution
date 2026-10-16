/**
 * Stok — Inventory Catalog & Stock Health Dashboard (Tier 2).
 *
 * Full production-ready inventory dashboard for Warung Bu Sari:
 * - Search by product name / SKU
 * - Category filter tabs
 * - Status filter pills (Critical, Low, Safe, Overstock, Expired Risk)
 * - Days of coverage indicators (Stok / Penjualan Harian)
 * - Wholesale pack sizes and supplier links
 * - Direct WhatsApp restock shortcuts (auto-drafts to /pesanan)
 * - Micro-hints on cards and buttons per design guidelines
 */

"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { HangaLogo } from "@/components/hanga-logo";
import { api } from "@/lib/api";
import { DEMO_SHOP_ID } from "@/lib/constants";
import { DEMO_INVENTORY } from "@/lib/demo-data";
import { formatIDR, INVENTORY_STATUS_CONFIG } from "@/lib/design-system";
import type { InventoryItem, InventoryOverview, InventoryStatus } from "@/types";

const CATEGORIES = [
  { key: "ALL", label: "Semua Kategori", icon: "🧺" },
  { key: "BAHAN_POKOK", label: "Bahan Pokok", icon: "🌾" },
  { key: "MINUMAN", label: "Minuman", icon: "☕" },
  { key: "SNACK", label: "Camilan / Roti", icon: "🍪" },
  { key: "LAINNYA", label: "Lainnya & Rokok", icon: "📦" },
  { key: "PERAWATAN", label: "Perawatan & Rumah", icon: "🧼" },
];

type SortOption = "URGENCY" | "DAYS_ASC" | "VALUE_DESC" | "NAME_ASC";

function StokDashboard() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") as InventoryStatus | null;

  const [overview, setOverview] = useState<InventoryOverview>(DEMO_INVENTORY);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus ?? "ALL");
  const [sortBy, setSortBy] = useState<SortOption>("URGENCY");
  const [orderedSku, setOrderedSku] = useState<string | null>(null);

  // Load inventory data
  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<InventoryOverview>(`/inventory/shops/${DEMO_SHOP_ID}`);
      setOverview(data);
    } catch {
      setOverview(DEMO_INVENTORY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Sync status if URL query changes
  useEffect(() => {
    if (initialStatus) {
      setSelectedStatus(initialStatus);
    }
  }, [initialStatus]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return overview.items
      .filter((item) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchSku = item.sku.toLowerCase().includes(q);
          if (!matchName && !matchSku) return false;
        }

        // Category filter
        if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
          return false;
        }

        // Status filter
        if (selectedStatus !== "ALL") {
          if (selectedStatus === "CRITICAL_OR_LOW") {
            if (item.status !== "CRITICAL" && item.status !== "LOW") return false;
          } else if (item.status !== selectedStatus) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "URGENCY") {
          const priority: Record<InventoryStatus, number> = {
            CRITICAL: 0,
            EXPIRED_RISK: 1,
            LOW: 2,
            SAFE: 3,
            OVERSTOCK: 4,
          };
          return priority[a.status] - priority[b.status];
        }
        if (sortBy === "DAYS_ASC") {
          return a.days_of_coverage - b.days_of_coverage;
        }
        if (sortBy === "VALUE_DESC") {
          return b.total_value_idr - a.total_value_idr;
        }
        if (sortBy === "NAME_ASC") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [overview.items, searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Handle Quick Reorder drafting to orders API + WhatsApp
  const handleQuickReorder = (item: InventoryItem) => {
    setOrderedSku(item.sku);
    setTimeout(() => setOrderedSku(null), 3000);

    // Draft order via API in background
    api
      .post("/orders", {
        shop_id: DEMO_SHOP_ID,
        sku: item.sku,
        name: item.name,
        qty: item.safety_stock * 2 > 0 ? Math.ceil(item.safety_stock * 2) : 10,
        unit: item.unit,
        supplier_ref: item.supplier_ref ?? "TOKO GROSIR JAYA",
        est_cost_idr: item.unit_cost_idr * (item.safety_stock * 2 > 0 ? Math.ceil(item.safety_stock * 2) : 10),
        status: "DRAFTED",
      })
      .catch(() => {});

    // Open WhatsApp deep link
    const text = encodeURIComponent(
      `Halo ${item.supplier_ref ?? "Toko Grosir"}, Bu Sari mau pesan ${item.name} (${item.pack_display ?? item.unit}). Mohon konfirmasi stok dan pengiriman ya. Terima kasih!`
    );
    window.open(`https://wa.me/6281234567890?text=${text}`, "_blank");
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-4 py-4">
        {/* Top Branding & Header */}
        <div className="px-4 flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <HangaLogo variant="icon" size="sm" />
            <div>
              <span className="text-body font-bold text-ink-900 block leading-tight">
                Katalog & Stok
              </span>
              <span className="text-[11px] text-ink-600 block">
                Warung Bu Sari · Terpantau Realtime
              </span>
            </div>
          </div>
          <Link
            href="/"
            className="text-caption font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 transition-colors flex items-center gap-1"
            title="Kembali ke Briefing Harian"
          >
            <span>← Briefing</span>
          </Link>
        </div>

        {/* Executive Header & Description */}
        <div className="px-4">
          <h1 className="text-display text-ink-900">Inventaris Toko</h1>
          <p className="text-caption text-ink-600 mt-1">
            Pantau ketersediaan barang di rak, sisa hari pemakaian, dan status restock grosir.
          </p>
        </div>

        {/* Quick KPI Stat Chips (Clickable Filters) */}
        <div className="px-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setSelectedStatus("ALL")}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedStatus === "ALL"
                  ? "bg-brand-50 border-brand-500 ring-2 ring-brand-300"
                  : "bg-canvas border-border/80 hover:bg-neutral-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-caption text-neutral-500 font-medium">Total SKU</span>
                <span className="text-sm">📦</span>
              </div>
              <p className="text-heading font-bold text-ink-900 mt-1">{overview.total_skus}</p>
              <p className="text-[11px] text-ink-600">{formatIDR(overview.total_inventory_value_idr)} modal</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === "CRITICAL" ? "ALL" : "CRITICAL")}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedStatus === "CRITICAL"
                  ? "bg-red-100 border-red-500 ring-2 ring-red-300"
                  : "bg-red-50/60 border-red-200 hover:bg-red-100/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-caption text-red-700 font-medium">Stok Kritis</span>
                <span className="text-sm">🚨</span>
              </div>
              <p className="text-heading font-bold text-red-800 mt-1">
                {overview.low_stock_count} SKU
              </p>
              <p className="text-[11px] text-red-600 font-medium">&lt; 2 hari habis</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === "EXPIRED_RISK" ? "ALL" : "EXPIRED_RISK")}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedStatus === "EXPIRED_RISK"
                  ? "bg-amber-100 border-amber-500 ring-2 ring-amber-300"
                  : "bg-amber-50/60 border-amber-200 hover:bg-amber-100/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-caption text-amber-700 font-medium">Risiko Basi</span>
                <span className="text-sm">⚠️</span>
              </div>
              <p className="text-heading font-bold text-amber-800 mt-1">
                {overview.waste_risk_count} SKU
              </p>
              <p className="text-[11px] text-amber-600 font-medium">Perlu promo cepat</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === "SAFE" ? "ALL" : "SAFE")}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedStatus === "SAFE"
                  ? "bg-emerald-100 border-emerald-500 ring-2 ring-emerald-300"
                  : "bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-caption text-emerald-700 font-medium">Stok Aman</span>
                <span className="text-sm">✅</span>
              </div>
              <p className="text-heading font-bold text-emerald-800 mt-1">
                {overview.safe_stock_count} SKU
              </p>
              <p className="text-[11px] text-emerald-600">Cukup &gt; 5 hari</p>
            </button>
          </div>
        </div>

        {/* Search Bar & Micro Hint */}
        <div className="px-4 flex flex-col gap-2">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-600 text-base">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari barang atau SKU (misal: Telur, Gula, Indomie)..."
              className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-border/80 rounded-xl text-body text-ink-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-neutral-400 hover:text-ink-600 bg-neutral-100 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 px-1">
            💡 <strong>Petunjuk:</strong> Ketik nama produk untuk menyaring stok secara otomatis.
          </p>
        </div>

        {/* Category Filter Pills (Horizontal Scroll) */}
        <div className="px-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-caption font-semibold flex items-center gap-1.5 transition-all ${
                  selectedCategory === cat.key
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-neutral-100 text-ink-600 hover:bg-neutral-200"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter & Sort Row */}
        <div className="px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-caption">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-neutral-500 font-medium">Status:</span>
            {[
              { key: "ALL", label: "Semua" },
              { key: "CRITICAL", label: "🚨 Kritis" },
              { key: "EXPIRED_RISK", label: "⚠️ Basi" },
              { key: "LOW", label: "📉 Menipis" },
              { key: "SAFE", label: "✅ Aman" },
              { key: "OVERSTOCK", label: "📦 Menumpuk" },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setSelectedStatus(st.key)}
                className={`px-2.5 py-1 rounded-lg text-caption font-medium transition-colors ${
                  selectedStatus === st.key
                    ? "bg-brand-100 text-brand-900 border border-brand-500 font-semibold"
                    : "bg-neutral-100/80 text-ink-600 hover:bg-neutral-200/80 border border-transparent"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-neutral-500 font-medium whitespace-nowrap">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-canvas border border-border/80 text-ink-900 text-caption rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="URGENCY">Tingkat Urgensi</option>
              <option value="DAYS_ASC">Sisa Hari (Paling Cepat Habis)</option>
              <option value="VALUE_DESC">Modal Tertinggi</option>
              <option value="NAME_ASC">Nama (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Product Cards List */}
        <div className="px-4 flex flex-col gap-3">
          {filteredItems.length === 0 ? (
            <div className="bg-canvas border border-border/80 rounded-2xl p-8 text-center flex flex-col items-center">
              <span className="text-4xl mb-2">🔍</span>
              <h3 className="text-heading text-ink-900 font-bold">Tidak ada produk yang cocok</h3>
              <p className="text-body text-ink-600 mt-1 max-w-xs">
                Coba ubah kata kunci pencarian atau reset filter kategori dan status.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("ALL");
                  setSelectedStatus("ALL");
                }}
                className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-caption font-semibold shadow hover:bg-brand-700 transition-colors"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const statusCfg = INVENTORY_STATUS_CONFIG[item.status];
              const isUrgent = item.status === "CRITICAL" || item.status === "LOW";
              const isExpiredRisk = item.status === "EXPIRED_RISK";

              return (
                <div
                  key={item.sku}
                  className={`bg-canvas border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${
                    isUrgent
                      ? "border-red-300 ring-1 ring-red-200"
                      : isExpiredRisk
                      ? "border-amber-300 ring-1 ring-amber-200"
                      : "border-border/80"
                  }`}
                >
                  {/* Card Header: Product Name + Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        {item.perishable && (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                            Mudah Basi ({item.shelf_days ? `${item.shelf_days} hr` : "Rentan"})
                          </span>
                        )}
                      </div>
                      <h3 className="text-heading font-bold text-ink-900 mt-1">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        SKU: {item.sku} {item.pack_display ? `· ${item.pack_display}` : ""}
                      </p>
                    </div>

                    <span
                      className={`text-caption font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1 ${statusCfg.badgeClass}`}
                    >
                      <span>{statusCfg.icon}</span>
                      <span>{statusCfg.shortLabel}</span>
                    </span>
                  </div>

                  {/* Stock Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/50 bg-neutral-50/60 p-2.5 rounded-xl">
                    {/* Metric 1: Sisa Stok */}
                    <div>
                      <span className="text-[11px] text-neutral-500 block">Stok Saat Ini</span>
                      <span className="text-body font-bold text-ink-900">
                        {item.stock_qty} {item.unit}
                      </span>
                    </div>

                    {/* Metric 2: Hari Bertahan */}
                    <div>
                      <span className="text-[11px] text-neutral-500 block">Bertahan</span>
                      <span
                        className={`text-body font-bold ${
                          item.days_of_coverage <= 2
                            ? "text-red-700"
                            : item.days_of_coverage <= 4
                            ? "text-amber-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {item.days_of_coverage} hari
                      </span>
                    </div>

                    {/* Metric 3: Penjualan Harian */}
                    <div>
                      <span className="text-[11px] text-neutral-500 block">Perputaran</span>
                      <span className="text-body font-bold text-ink-900">
                        ~{item.daily_velocity} {item.unit}/hr
                      </span>
                    </div>

                    {/* Metric 4: Nilai Modal */}
                    <div>
                      <span className="text-[11px] text-neutral-500 block">Nilai di Rak</span>
                      <span className="text-body font-bold text-ink-900">
                        {formatIDR(item.total_value_idr)}
                      </span>
                    </div>
                  </div>

                  {/* Coverage Visual Meter */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                      <span>Ketahanan Stok (Safety Target: {item.safety_stock} {item.unit})</span>
                      <span className="font-semibold">{item.days_of_coverage} Hari Pemakaian</span>
                    </div>
                    <div className="w-full bg-neutral-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.days_of_coverage <= 2
                            ? "bg-red-500"
                            : item.days_of_coverage <= 4
                            ? "bg-amber-500"
                            : item.days_of_coverage >= 20
                            ? "bg-slate-400"
                            : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(8, (item.days_of_coverage / 14) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Supplier & Action Row */}
                  <div className="mt-3 pt-3 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-[11px] text-neutral-600">
                      <span>Pemasok: </span>
                      <strong className="text-ink-800">{item.supplier_ref ?? "TOKO GROSIR JAYA"}</strong>
                      <span className="text-neutral-400 ml-1">· Rp {item.unit_cost_idr.toLocaleString("id-ID")}/{item.unit}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUrgent ? (
                        <button
                          type="button"
                          onClick={() => handleQuickReorder(item)}
                          className="w-full sm:w-auto px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-caption rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                          title="Klik untuk kirim pesan pesanan WhatsApp ke pemasok dan catat ke riwayat"
                        >
                          <span>💬</span>
                          <span>{orderedSku === item.sku ? "✓ Pesanan Dicatat" : "Pesan Grosir"}</span>
                        </button>
                      ) : isExpiredRisk ? (
                        <Link
                          href={`/?scenario=BASELINE#rec-${item.sku}`}
                          className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-caption rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                          title="Lihat saran promosi dan bundel diskon"
                        >
                          <span>🏷️</span>
                          <span>Beri Promo</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickReorder(item)}
                          className="w-full sm:w-auto px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-ink-700 font-medium text-caption rounded-lg transition-colors flex items-center justify-center gap-1"
                          title="Kirim pesan WhatsApp pemesanan ke pemasok"
                        >
                          <span>💬</span>
                          <span>Kontak Grosir</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Context Micro-Hint */}
                  <div className="mt-2 text-[11px] text-ink-600 bg-neutral-50 px-2 py-1 rounded border border-neutral-200/50">
                    {isUrgent && (
                      <span>
                        💡 <strong>Peringatan Habis:</strong> Sisa stok {item.stock_qty} {item.unit} berada di bawah batas aman ({item.safety_stock} {item.unit}). Segera pesan agar rak tidak kosong.
                      </span>
                    )}
                    {isExpiredRisk && (
                      <span>
                        💡 <strong>Peringatan Basi:</strong> Produk mudah rusak dengan kecepatan jual melambat. Buat paket hemat atau diskon agar terjual sebelum lewat batas waktu.
                      </span>
                    )}
                    {!isUrgent && !isExpiredRisk && item.status === "OVERSTOCK" && (
                      <span>
                        💡 <strong>Stok Menumpuk:</strong> Sisa stok cukup untuk {item.days_of_coverage} hari. Tahan pembelian ulang agar modal tidak mengendap di rak.
                      </span>
                    )}
                    {!isUrgent && !isExpiredRisk && item.status === "SAFE" && (
                      <span>
                        💡 <strong>Stok Sehat:</strong> Ketersediaan seimbang dengan rata-rata penjualan harian warung.
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Educational Footnote */}
        <div className="px-4 py-4 text-center">
          <p className="text-[11px] text-neutral-400">
            📊 Data inventaris diperbarui otomatis dari foto buku catatan belanja dan perputaran kas harian warung.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

export default function StokPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-4 flex flex-col gap-3">
            <div className="skeleton h-12 w-1/2" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-64 w-full" />
          </div>
        </AppShell>
      }
    >
      <StokDashboard />
    </Suspense>
  );
}
