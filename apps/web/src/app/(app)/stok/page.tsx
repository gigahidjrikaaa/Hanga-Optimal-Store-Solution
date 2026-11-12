/**
 * Stok — Warung Merchandise & Stock Health Dashboard (Tier 2).
 *
 * Re-architected with an Elder-First UX:
 * - 2-Tab Focused Architecture:
 *   1. "Perlu Belanja (3)" — Instant clarity on what to restock today without noise
 *   2. "Semua Stok (18)" — Complete catalog with simple search and category filters
 * - Large, comfortable typography (minimum 14px, 18px+ for primary titles & numbers)
 * - High-contrast readable ink on clean card surfaces
 * - Generous 48px+ touch targets for effortless one-handed tapping
 * - Direct one-tap WhatsApp order drafting to suppliers
 *
 * Desain mengikuti design.md (sistem terkunci): semua warna lewat token
 * (tanpa palet mentah), ikon dari components/icons.tsx (bukan emoji),
 * severity dari pasangan token INVENTORY_STATUS_CONFIG, dan gerak hanya
 * untuk state (.pressable, .skeleton) — tanpa koreografi stagger.
 */

"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { HangaLogo } from "@/components/hanga-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Icon, type IconName } from "@/components/icons";
import { api } from "@/lib/api";
import { DEMO_SHOP_ID } from "@/lib/constants";
import { DEMO_INVENTORY } from "@/lib/demo-data";
import { formatIDR, INVENTORY_STATUS_CONFIG } from "@/lib/design-system";
import { useLanguage } from "@/lib/i18n/context";
import type { InventoryItem, InventoryOverview, InventoryStatus } from "@/types";

const CATEGORIES: { key: string; icon: IconName }[] = [
  { key: "ALL", icon: "store" },
  { key: "BAHAN_POKOK", icon: "package" },
  { key: "MINUMAN", icon: "rain" },
  { key: "SNACK", icon: "gift" },
  { key: "LAINNYA", icon: "clipboard" },
  { key: "PERAWATAN", icon: "home" },
];

// Ikon filter status mengikuti INVENTORY_STATUS_CONFIG; "Semua" tanpa ikon.
const STATUS_FILTERS: { key: string; icon: IconName | null }[] = [
  { key: "ALL", icon: null },
  { key: "CRITICAL", icon: "alert" },
  { key: "EXPIRED_RISK", icon: "clock" },
  { key: "LOW", icon: "trend-down" },
  { key: "SAFE", icon: "check-circle" },
  { key: "OVERSTOCK", icon: "package" },
];

type MainTab = "PERLU_BELANJA" | "SEMUA_BARANG";
type SortOption = "URGENCY" | "DAYS_ASC" | "VALUE_DESC" | "NAME_ASC";

/**
 * Pembersih label terjemahan (translations.ts tidak dapat diedit): buang
 * emoji dan panah tempel yang disuntikkan string ke copy; ikonnya dirender
 * terpisah di samping teks oleh komponen Icon.
 */
function cleanLabel(value: string): string {
  return value
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}

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
              <span className="text-heading text-ink-900 block leading-tight">
                {t.stok.headerTitle}
              </span>
              <span className="text-caption text-muted block">
                {t.stok.headerSubtitle}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <Link
              href="/"
              className="text-sm font-semibold text-brand-800 bg-brand-100 border border-border px-3.5 py-2 rounded-lg transition-colors pressable flex items-center gap-1 min-h-[44px] touch-target"
              title={t.stok.backBriefing}
            >
              <span>{cleanLabel(t.stok.backBriefing)}</span>
            </Link>
          </div>
        </div>

        {/* Primary Page Title */}
        <div className="px-4">
          <h1 className="text-title text-ink-900">
            {t.stok.pageTitle}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t.stok.pageSubtitle}
          </p>
        </div>

        {/* PRIMARY 2-TAB SEGMENTED CONTROLLER (sumur paper-3, pil aktif bg-surface + shadow kartu) */}
        <div className="px-4">
          <div className="grid grid-cols-2 p-1.5 bg-paper-3 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("PERLU_BELANJA")}
              className={`min-h-[48px] py-2.5 px-3 rounded-lg font-semibold text-sm transition-colors pressable flex items-center justify-center gap-2 touch-target ${
                activeTab === "PERLU_BELANJA"
                  ? "bg-surface text-ink-900 shadow-[var(--shadow-card)]"
                  : "text-muted hover:text-ink-900"
              }`}
            >
              <Icon name="alert" size={18} className="shrink-0" aria-hidden="true" />
              <span>{cleanLabel(t.stok.tabPerluBelanja)} ({urgentItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("SEMUA_BARANG")}
              className={`min-h-[48px] py-2.5 px-3 rounded-lg font-semibold text-sm transition-colors pressable flex items-center justify-center gap-2 touch-target ${
                activeTab === "SEMUA_BARANG"
                  ? "bg-surface text-ink-900 shadow-[var(--shadow-card)]"
                  : "text-muted hover:text-ink-900"
              }`}
            >
              <Icon name="package" size={18} className="shrink-0" aria-hidden="true" />
              <span>{cleanLabel(t.stok.tabSemuaStok)} ({overview.total_skus})</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PERLU BELANJA (Action-First, Low Cognitive Load)                   */}
        {/* ========================================================================= */}
        {activeTab === "PERLU_BELANJA" && (
          <div className="px-4 flex flex-col gap-3">
            <div className="bg-danger-bg rounded-xl p-3.5 flex items-start gap-2.5">
              <Icon name="alert" size={20} className="shrink-0 text-danger mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-heading text-ink-900">
                  {t.stok.priorityBannerTitle}
                </h2>
                <p className="text-sm text-ink-2 mt-0.5">
                  {t.stok.priorityBannerDesc.replace("{count}", String(urgentItems.length))}
                </p>
              </div>
            </div>

            {urgentItems.map((item, cardIndex) => {
              const statusCfg = INVENTORY_STATUS_CONFIG[item.status];
              const isCritical = item.status === "CRITICAL";
              return (
                <div
                  key={item.sku}
                  className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3.5"
                  style={
                    isCritical
                      ? { borderColor: "var(--color-danger-bg)" }
                      : undefined
                  }
                >
                  {/* Nama & status pill dari config — eyebrow merah dihapus,
                      severity kini hanya lewat pill dan tint border tipis */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-heading text-ink-900 leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-caption text-muted mt-0.5">
                        {item.pack_display ?? item.unit}
                      </p>
                    </div>
                    <span
                      className={`text-caption px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1 ${statusCfg.pillClass}`}
                    >
                      <Icon name={statusCfg.icon} size={14} className="shrink-0" aria-hidden="true" />
                      <span>{t.stok.statuses[item.status] ?? statusCfg.shortLabel}</span>
                    </span>
                  </div>

                  {/* Sisa & Cukup Buat (sumur paper-3, angka besar kontras) */}
                  <div className="grid grid-cols-2 gap-2 bg-paper-3 rounded-lg p-3">
                    <div>
                      <span className="text-caption text-muted block">
                        {t.stok.inShelf}
                      </span>
                      <span className="text-heading text-ink-900 block mt-0.5 num">
                        {item.stock_qty} {item.unit}
                      </span>
                    </div>

                    <div>
                      <span className="text-caption text-muted block">
                        {t.stok.coverage}
                      </span>
                      <span
                        className={`text-heading block mt-0.5 num ${
                          isCritical ? "text-danger" : "text-ink-2"
                        }`}
                      >
                        {item.days_of_coverage} {language === "id" ? "hari lagi" : "days left"}
                      </span>
                    </div>
                  </div>

                  {/* Supplier & Price Info */}
                  <div className="text-sm text-ink-2 flex items-center justify-between border-t border-border pt-2.5">
                    <span>
                      {t.stok.supplier}: <span className="font-semibold">{item.supplier_ref ?? (language === "id" ? "Toko Grosir" : "Wholesaler")}</span>
                    </span>
                    <span className="font-semibold text-ink-900">
                      {language === "id" ? "Modal: " : "Cost: "} {formatIDR(item.unit_cost_idr)}/{item.unit}
                    </span>
                  </div>

                  {/* Big Generous WhatsApp CTA (Min 48px Height):
                      kartu pertama = satu-satunya tombol primary terisi layar ini (brand, bukan merah);
                      kartu lain = sekunder garis luar */}
                  <button
                    type="button"
                    onClick={() => handleQuickReorder(item)}
                    className={`w-full min-h-[48px] py-3 px-4 font-semibold text-base rounded-xl flex items-center justify-center gap-2 transition-colors pressable touch-target ${
                      cardIndex === 0
                        ? "bg-brand-600 text-white hover:bg-brand-800"
                        : "bg-surface text-brand-800 border border-border"
                    }`}
                  >
                    <Icon
                      name={orderedSku === item.sku ? "check" : "message"}
                      size={20}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      {orderedSku === item.sku
                        ? cleanLabel(t.stok.orderLogged)
                        : t.stok.quickOrderWa.replace("{name}", item.name.split(" ")[0])}
                    </span>
                  </button>
                </div>
              );
            })}

            {/* Switch to Full Catalog Footer Link */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setActiveTab("SEMUA_BARANG")}
                className="inline-flex items-center justify-center gap-1.5 mx-auto text-sm font-semibold text-brand-800 underline py-2 min-h-[44px] touch-target pressable"
              >
                <span>{cleanLabel(t.stok.viewAllLink.replace("{count}", String(overview.total_skus)))}</span>
                <Icon name="arrow-right" size={16} className="shrink-0" aria-hidden="true" />
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
              <Icon
                name="eye"
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 shrink-0"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.stok.searchPlaceholder}
                className="w-full pl-11 pr-10 py-3 min-h-[48px] bg-surface border border-border rounded-xl text-base text-ink-900 placeholder:text-neutral-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-ink-2 w-10 h-10 flex items-center justify-center touch-target pressable"
                >
                  <Icon name="x" size={16} className="shrink-0" aria-hidden="true" />
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
                    className={`min-h-[44px] shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors pressable ${
                      selectedCategory === cat.key
                        ? "bg-brand-600 text-white"
                        : "bg-surface border border-border text-ink-2 hover:bg-paper-3"
                    }`}
                  >
                    <Icon name={cat.icon} size={16} className="shrink-0" aria-hidden="true" />
                    <span>{categoryLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full scroll-smooth text-sm">
              <span className="text-muted mr-0.5 shrink-0">{t.common.status}:</span>
              {STATUS_FILTERS.map((st) => {
                const statusLabel = t.stok.statuses[st.key] ?? st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setSelectedStatus(st.key)}
                    className={`min-h-[44px] shrink-0 whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors pressable ${
                      selectedStatus === st.key
                        ? "bg-brand-100 text-brand-800 border border-brand-600"
                        : "bg-surface border border-border text-ink-2 hover:bg-paper-3"
                    }`}
                  >
                    {st.icon && (
                      <Icon name={st.icon} size={14} className="shrink-0" aria-hidden="true" />
                    )}
                    <span>{statusLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center justify-between text-sm py-1">
              <span className="text-muted">
                {t.stok.displayCount.replace("{count}", String(allFilteredItems.length))}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-muted">{t.stok.sortLabel}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-surface border border-border text-ink-900 text-sm rounded-lg px-2.5 py-1.5 min-h-[40px] focus:outline-none"
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
              <div className="bg-surface border border-border rounded-xl p-8 text-center flex flex-col items-center">
                <Icon name="eye" size={32} className="shrink-0 text-muted float-soft mb-2" aria-hidden="true" />
                <h3 className="text-heading text-ink-900">{t.stok.emptyTitle}</h3>
                <p className="text-sm text-ink-2 mt-1">
                  {t.stok.emptyDesc}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("ALL");
                    setSelectedStatus("ALL");
                  }}
                  className="mt-4 min-h-[44px] px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-800 transition-colors pressable"
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
                    className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-caption text-ink-2 bg-paper-3 px-2 py-0.5 rounded">
                            {t.stok.categories[item.category] ?? item.category.replace("_", " ")}
                          </span>
                          {item.perishable && (
                            <span className="text-caption bg-warn-bg text-warn px-2 py-0.5 rounded">
                              {t.stok.perishable}
                            </span>
                          )}
                        </div>
                        <h3 className="text-heading text-ink-900 mt-1">
                          {item.name}
                        </h3>
                        <p className="text-caption text-muted mt-0.5">
                          {item.pack_display
                            ? `${t.stok.wholesalePack}: ${item.pack_display}`
                            : `${t.common.unit}: ${item.unit}`}
                        </p>
                      </div>

                      <span
                        className={`text-caption px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1 ${statusCfg.badgeClass}`}
                      >
                        <Icon name={statusCfg.icon} size={14} className="shrink-0" aria-hidden="true" />
                        <span>{t.stok.statuses[item.status] ?? statusCfg.shortLabel}</span>
                      </span>
                    </div>

                    {/* Stock & Coverage Row (sumur paper-3 tanpa border) */}
                    <div className="grid grid-cols-3 gap-2 bg-paper-3 rounded-lg p-2.5 text-center">
                      <div>
                        <span className="text-caption text-muted block">{t.stok.inShelf}</span>
                        <span className="text-sm font-semibold text-ink-900 block mt-0.5 num">
                          {item.stock_qty} {item.unit}
                        </span>
                      </div>

                      <div>
                        <span className="text-caption text-muted block">{t.stok.coverage}</span>
                        <span
                          className={`text-sm font-semibold block mt-0.5 num ${
                            item.days_of_coverage <= 2
                              ? "text-danger"
                              : item.days_of_coverage <= 4
                              ? "text-warn"
                              : "text-ink-900"
                          }`}
                        >
                          {item.days_of_coverage} {t.common.days}
                        </span>
                      </div>

                      <div>
                        <span className="text-caption text-muted block">{t.stok.shelfValue}</span>
                        <span className="text-sm font-semibold text-ink-900 block mt-0.5 num">
                          {formatIDR(item.total_value_idr)}
                        </span>
                      </div>
                    </div>

                    {/* Supplier & Action */}
                    <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5 text-sm">
                      <span className="text-caption text-muted">
                        {t.stok.supplier}: <span className="font-semibold">{item.supplier_ref ?? (language === "id" ? "Toko Grosir" : "Wholesaler")}</span>
                      </span>

                      {isUrgent ? (
                        <button
                          type="button"
                          onClick={() => handleQuickReorder(item)}
                          className="min-h-[42px] px-3.5 py-1.5 bg-surface text-brand-800 border border-border font-semibold text-sm rounded-lg flex items-center gap-1.5 pressable touch-target"
                        >
                          <Icon
                            name={orderedSku === item.sku ? "check" : "message"}
                            size={16}
                            className="shrink-0"
                            aria-hidden="true"
                          />
                          <span>{orderedSku === item.sku ? cleanLabel(t.stok.orderLogged) : (language === "id" ? "Pesan WA" : "Reorder WA")}</span>
                        </button>
                      ) : isExpiredRisk ? (
                        <Link
                          href={`/?scenario=BASELINE#rec-${item.sku}`}
                          className="min-h-[42px] px-3.5 py-1.5 bg-surface text-brand-800 border border-border font-semibold text-sm rounded-lg flex items-center gap-1.5 pressable touch-target"
                        >
                          <Icon name="gift" size={16} className="shrink-0" aria-hidden="true" />
                          <span>{t.stok.givePromo}</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickReorder(item)}
                          className="min-h-[42px] px-3.5 py-1.5 bg-surface text-brand-800 border border-border font-semibold text-sm rounded-lg flex items-center gap-1.5 pressable touch-target"
                        >
                          <Icon name="message" size={16} className="shrink-0" aria-hidden="true" />
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
          <p className="text-caption text-neutral-400 flex items-center justify-center gap-1.5">
            <Icon name="chart" size={14} className="shrink-0" aria-hidden="true" />
            <span>{t.stok.footerNote}</span>
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
