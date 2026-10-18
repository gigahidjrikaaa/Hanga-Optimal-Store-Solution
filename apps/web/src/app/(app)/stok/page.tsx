/**
 * Stok — Warung Merchandise & Stock Health Dashboard (Tier 2).
 *
 * Re-architected with an Elder-First UX:
 * - 2-Tab Focused Architecture:
 *   1. "🚨 Perlu Belanja (3)" — Instant clarity on what to restock today without noise
 *   2. "📦 Semua Barang (18)" — Complete catalog with simple search and category filters
 * - Large, comfortable typography (minimum 14px, 18px+ for primary titles & numbers)
 * - High-contrast readable ink on clean card surfaces
 * - Generous 48px+ touch targets for effortless one-handed tapping
 * - Direct one-tap WhatsApp order drafting to suppliers
 */

"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { HangaLogo } from "@/components/hanga-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { api } from "@/lib/api";
import { DEMO_SHOP_ID } from "@/lib/constants";
import { DEMO_INVENTORY } from "@/lib/demo-data";
import { formatIDR, INVENTORY_STATUS_CONFIG } from "@/lib/design-system";
import { useLanguage } from "@/lib/i18n/context";
import type { InventoryItem, InventoryOverview, InventoryStatus } from "@/types";

const CATEGORIES = [
  { key: "ALL", icon: "🧺" },
  { key: "BAHAN_POKOK", icon: "🌾" },
  { key: "MINUMAN", icon: "☕" },
  { key: "SNACK", icon: "🍪" },
  { key: "LAINNYA", icon: "📦" },
  { key: "PERAWATAN", icon: "🧼" },
];

type MainTab = "PERLU_BELANJA" | "SEMUA_BARANG";
type SortOption = "URGENCY" | "DAYS_ASC" | "VALUE_DESC" | "NAME_ASC";

function StokDashboard() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const urlStatus = searchParams.get("status") as InventoryStatus | null;

  // Active primary tab
  const [activeTab, setActiveTab] = useState<MainTab>(
    urlTab === "semua" ? "SEMUA_BARANG" : "PERLU_BELANJA"
  );

  const [overview, setOverview] = useState<InventoryOverview>(DEMO_INVENTORY);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>(urlStatus ?? "ALL");
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

  // Sync tab and status if URL query changes
  useEffect(() => {
    if (urlTab === "semua") {
      setActiveTab("SEMUA_BARANG");
    } else if (urlTab === "perlu-belanja") {
      setActiveTab("PERLU_BELANJA");
    }
    if (urlStatus) {
      setSelectedStatus(urlStatus);
      setActiveTab("SEMUA_BARANG");
    }
  }, [urlTab, urlStatus]);

  // Urgent items needing replenishment (< 2.5 days or CRITICAL / LOW)
  const urgentItems = useMemo(() => {
    return overview.items.filter(
      (item) => item.status === "CRITICAL" || item.status === "LOW"
    );
  }, [overview.items]);

  // Filter and sort items for the "Semua Barang" catalog tab
  const allFilteredItems = useMemo(() => {
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
    setTimeout(() => setOrderedSku(null), 3500);

    // Draft order via API in background so it appears on /pesanan
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

    // Open WhatsApp deep link with conversational Bahasa
    const text = encodeURIComponent(
      `Halo ${item.supplier_ref ?? "Toko Grosir"}, Bu Sari mau pesan ${item.name} (${item.pack_display ?? item.unit}). Mohon dikirim pagi ini ya. Terima kasih!`
    );
    window.open(`https://wa.me/6281234567890?text=${text}`, "_blank");
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-4 py-4 max-w-lg mx-auto w-full">
        {/* Top Header Bar */}
        <div className="px-4 flex items-center justify-between border-b border-border pb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <HangaLogo variant="icon" size="sm" />
            <div>
              <span className="text-base font-bold text-ink-900 block leading-tight">
                {t.stok.headerTitle}
              </span>
              <span className="text-xs text-ink-600 block">
                {t.stok.headerSubtitle}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <Link
              href="/"
              className="text-sm font-bold text-brand-800 bg-brand-50 hover:bg-brand-100 px-3.5 py-2 rounded-xl border border-brand-200 transition-colors flex items-center gap-1 min-h-[44px] touch-target"
              title={t.stok.backBriefing}
            >
              <span>{t.stok.backBriefing}</span>
            </Link>
          </div>
        </div>

        {/* Primary Page Title */}
        <div className="px-4">
          <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight">
            {t.stok.pageTitle}
          </h1>
          <p className="text-sm text-ink-600 mt-1">
            {t.stok.pageSubtitle}
          </p>
        </div>

        {/* PRIMARY 2-TAB SEGMENTED CONTROLLER (Elder-Friendly, Big Touch Targets) */}
        <div className="px-4">
          <div className="grid grid-cols-2 p-1.5 bg-neutral-200/70 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("PERLU_BELANJA")}
              className={`min-h-[48px] py-2.5 px-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 touch-target ${
                activeTab === "PERLU_BELANJA"
                  ? "bg-white text-red-700 shadow-sm border border-red-200"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              <span>{t.stok.tabPerluBelanja} ({urgentItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("SEMUA_BARANG")}
              className={`min-h-[48px] py-2.5 px-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 touch-target ${
                activeTab === "SEMUA_BARANG"
                  ? "bg-white text-ink-900 shadow-sm border border-neutral-300"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              <span>{t.stok.tabSemuaStok} ({overview.total_skus})</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PERLU BELANJA (Action-First, Low Cognitive Load)                   */}
        {/* ========================================================================= */}
        {activeTab === "PERLU_BELANJA" && (
          <div className="px-4 flex flex-col gap-3">
            <div className="bg-red-50/80 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5">
              <span className="text-2xl">🚨</span>
              <div>
                <h2 className="text-base font-bold text-red-950">
                  {t.stok.priorityBannerTitle}
                </h2>
                <p className="text-sm text-red-800 mt-0.5">
                  {t.stok.priorityBannerDesc.replace("{count}", String(urgentItems.length))}
                </p>
              </div>
            </div>

            {urgentItems.map((item) => (
              <div
                key={item.sku}
                className="bg-surface border-2 border-red-300 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5"
              >
                {/* Title & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-md uppercase tracking-wide">
                      {language === "id" ? "Mau Habis!" : "Stockout Risk!"}
                    </span>
                    <h3 className="text-lg font-extrabold text-ink-900 mt-1.5 leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-sm font-semibold text-neutral-600 mt-0.5">
                      {item.pack_display ?? item.unit}
                    </p>
                  </div>
                  <span className="text-2xl">🚨</span>
                </div>

                {/* Sisa & Cukup Buat (Large, High Contrast Numbers) */}
                <div className="grid grid-cols-2 gap-2 bg-red-50/50 border border-red-100 rounded-xl p-3">
                  <div>
                    <span className="text-xs text-neutral-500 font-medium block">
                      {t.stok.inShelf}
                    </span>
                    <span className="text-lg font-black text-ink-900 block mt-0.5">
                      {item.stock_qty} {item.unit}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-neutral-500 font-medium block">
                      {t.stok.coverage}
                    </span>
                    <span className="text-lg font-black text-red-700 block mt-0.5">
                      {item.days_of_coverage} {language === "id" ? "hari lagi" : "days left"}
                    </span>
                  </div>
                </div>

                {/* Supplier & Price Info */}
                <div className="text-sm text-ink-700 flex items-center justify-between border-t border-border pt-2.5">
                  <span>
                    {t.stok.supplier}: <strong>{item.supplier_ref ?? (language === "id" ? "Toko Grosir" : "Wholesaler")}</strong>
                  </span>
                  <span className="font-semibold text-ink-900">
                    {language === "id" ? "Modal: " : "Cost: "} {formatIDR(item.unit_cost_idr)}/{item.unit}
                  </span>
                </div>

                {/* Big Generous WhatsApp CTA (Min 48px Height) */}
                <button
                  type="button"
                  onClick={() => handleQuickReorder(item)}
                  className="w-full min-h-[50px] py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-base rounded-xl shadow flex items-center justify-center gap-2 transition-transform active:scale-[0.98] touch-target"
                >
                  <span className="text-xl">💬</span>
                  <span>
                    {orderedSku === item.sku
                      ? t.stok.orderLogged
                      : t.stok.quickOrderWa.replace("{name}", item.name.split(" ")[0])}
                  </span>
                </button>
              </div>
            ))}

            {/* Switch to Full Catalog Footer Link */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setActiveTab("SEMUA_BARANG")}
                className="text-sm font-bold text-brand-700 hover:text-brand-900 underline py-2 min-h-[44px] touch-target"
              >
                {t.stok.viewAllLink.replace("{count}", String(overview.total_skus))}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SEMUA BARANG (Complete Catalog with Simple Search & Filters)       */}
        {/* ========================================================================= */}
        {activeTab === "SEMUA_BARANG" && (
          <div className="px-4 flex flex-col gap-3">
            {/* Simple Search Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.stok.searchPlaceholder}
                className="w-full pl-11 pr-10 py-3 min-h-[48px] bg-surface border border-neutral-300 rounded-xl text-base text-ink-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-ink-600 w-8 h-8 flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Pills (Horizontal Scroll) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full scroll-smooth">
              {CATEGORIES.map((cat) => {
                const categoryLabel = t.stok.categories[cat.key] ?? cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`min-h-[44px] shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                      selectedCategory === cat.key
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-surface border border-neutral-300 text-ink-800 hover:bg-neutral-100"
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span>{categoryLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full scroll-smooth text-sm">
              <span className="text-neutral-500 font-semibold mr-0.5 shrink-0">{t.common.status}:</span>
              {[
                { key: "ALL", icon: "" },
                { key: "CRITICAL", icon: "🚨 " },
                { key: "EXPIRED_RISK", icon: "⚠️ " },
                { key: "LOW", icon: "📉 " },
                { key: "SAFE", icon: "✅ " },
                { key: "OVERSTOCK", icon: "📦 " },
              ].map((st) => {
                const statusLabel = `${st.icon}${t.stok.statuses[st.key] ?? st.key}`;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setSelectedStatus(st.key)}
                    className={`min-h-[42px] shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                      selectedStatus === st.key
                        ? "bg-brand-100 text-brand-900 border-2 border-brand-600 shadow-xs"
                        : "bg-surface border border-neutral-300 text-ink-700 hover:bg-neutral-100 font-medium"
                    }`}
                  >
                    {statusLabel}
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center justify-between text-sm py-1">
              <span className="text-neutral-600 font-medium">
                {t.stok.displayCount.replace("{count}", String(allFilteredItems.length))}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">{t.stok.sortLabel}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-surface border border-neutral-300 text-ink-900 text-sm font-medium rounded-lg px-2.5 py-1.5 min-h-[40px] focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="URGENCY">{t.stok.sortUrgency}</option>
                  <option value="DAYS_ASC">{t.stok.sortDays}</option>
                  <option value="VALUE_DESC">{t.stok.sortCost}</option>
                  <option value="NAME_ASC">{t.stok.sortName}</option>
                </select>
              </div>
            </div>

            {/* Catalog Items List */}
            {allFilteredItems.length === 0 ? (
              <div className="bg-surface border border-neutral-300 rounded-2xl p-8 text-center flex flex-col items-center">
                <span className="text-4xl mb-2">🔍</span>
                <h3 className="text-base font-bold text-ink-900">{t.stok.emptyTitle}</h3>
                <p className="text-sm text-ink-600 mt-1">
                  {t.stok.emptyDesc}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("ALL");
                    setSelectedStatus("ALL");
                  }}
                  className="mt-4 min-h-[44px] px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold shadow hover:bg-brand-700"
                >
                  {t.stok.showAllBtn}
                </button>
              </div>
            ) : (
              allFilteredItems.map((item) => {
                const statusCfg = INVENTORY_STATUS_CONFIG[item.status];
                const isUrgent = item.status === "CRITICAL" || item.status === "LOW";
                const isExpiredRisk = item.status === "EXPIRED_RISK";

                return (
                  <div
                    key={item.sku}
                    className={`bg-surface border rounded-2xl p-4 shadow-sm flex flex-col gap-3 ${
                      isUrgent
                        ? "border-2 border-red-300 ring-1 ring-red-100"
                        : isExpiredRisk
                        ? "border-2 border-amber-300 ring-1 ring-amber-100"
                        : "border-border"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                            {t.stok.categories[item.category] ?? item.category.replace("_", " ")}
                          </span>
                          {item.perishable && (
                            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                              {t.stok.perishable}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-ink-900 mt-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {item.pack_display
                            ? `${t.stok.wholesalePack}: ${item.pack_display}`
                            : `${t.common.unit}: ${item.unit}`}
                        </p>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1 ${statusCfg.badgeClass}`}
                      >
                        <span>{statusCfg.icon}</span>
                        <span>{t.stok.statuses[item.status] ?? statusCfg.shortLabel}</span>
                      </span>
                    </div>

                    {/* Stock & Coverage Row */}
                    <div className="grid grid-cols-3 gap-2 bg-neutral-50 border border-neutral-200/80 rounded-xl p-2.5 text-center">
                      <div>
                        <span className="text-xs text-neutral-500 block">{t.stok.inShelf}</span>
                        <span className="text-sm font-bold text-ink-900 block mt-0.5">
                          {item.stock_qty} {item.unit}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs text-neutral-500 block">{t.stok.coverage}</span>
                        <span
                          className={`text-sm font-bold block mt-0.5 ${
                            item.days_of_coverage <= 2
                              ? "text-red-700 font-extrabold"
                              : item.days_of_coverage <= 4
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {item.days_of_coverage} {t.common.days}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs text-neutral-500 block">{t.stok.shelfValue}</span>
                        <span className="text-sm font-bold text-ink-900 block mt-0.5">
                          {formatIDR(item.total_value_idr)}
                        </span>
                      </div>
                    </div>

                    {/* Supplier & Action */}
                    <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5 text-sm">
                      <span className="text-xs text-neutral-600">
                        {t.stok.supplier}: <strong>{item.supplier_ref ?? (language === "id" ? "Toko Grosir" : "Wholesaler")}</strong>
                      </span>

                      {isUrgent ? (
                        <button
                          type="button"
                          onClick={() => handleQuickReorder(item)}
                          className="min-h-[42px] px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl flex items-center gap-1.5 shadow-sm touch-target"
                        >
                          <span>💬</span>
                          <span>{orderedSku === item.sku ? t.stok.orderLogged : (language === "id" ? "Pesan WA" : "Reorder WA")}</span>
                        </button>
                      ) : isExpiredRisk ? (
                        <Link
                          href={`/?scenario=BASELINE#rec-${item.sku}`}
                          className="min-h-[42px] px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl flex items-center gap-1.5 shadow-sm touch-target"
                        >
                          <span>🏷️</span>
                          <span>{t.stok.givePromo}</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickReorder(item)}
                          className="min-h-[42px] px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-ink-800 font-semibold text-sm rounded-xl flex items-center gap-1 border border-neutral-300 touch-target"
                        >
                          <span>💬</span>
                          <span>{t.stok.contactBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Bottom Reassurance Footnote */}
        <div className="px-4 py-4 text-center">
          <p className="text-xs text-neutral-400">
            📊 {t.stok.footerNote}
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
