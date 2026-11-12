/**
 * InventoryHealthBar — Elder-friendly stock summary card for Beranda (Tier 1).
 *
 * Designed for immediate glanceability (30-second morning briefing):
 * - Large, high-contrast readable text (min 14px)
 * - Highlights immediately if any items are running low
 * - 48px touch-friendly CTAs directly opening the urgent restock list
 *
 * Surfaces and severity follow design.md: one card (bg-surface + hairline
 * border, rounded-xl), chips rounded-lg with token pairs (danger/warn/brand),
 * status pills wrap (never clip at 390px), icons from icons.tsx beside labels.
 */

"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { formatIDR } from "@/lib/design-system";
import { useLanguage } from "@/lib/i18n/context";
import type { InventoryOverview } from "@/types";

interface InventoryHealthBarProps {
  overview: InventoryOverview;
  isLoading?: boolean;
}

export function InventoryHealthBar({ overview, isLoading }: InventoryHealthBarProps) {
  const { t, language } = useLanguage();

  if (isLoading) {
    return (
      <div className="px-4">
        <div className="skeleton h-24 w-full rounded-xl" />
      </div>
    );
  }

  const criticalOrLow = overview.items.filter(
    (i) => i.status === "CRITICAL" || i.status === "LOW"
  );
  const urgentNames = criticalOrLow.map((i) => i.name.split(" ")[0]).join(", ");

  return (
    <div className="px-4">
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
        {/* Header Summary */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center shrink-0">
              <Icon name="store" size={22} className="shrink-0" />
            </span>
            <div className="min-w-0">
              <h2 className="text-heading text-ink-900 leading-tight">
                {t.inventorySummary.title}
              </h2>
              <p className="text-sm text-muted mt-0.5">
                {language === "id"
                  ? `${overview.total_skus} macam barang · Uang di rak: `
                  : `${overview.total_skus} total SKUs · Shelf capital: `}
                <span className="font-semibold text-ink-900">
                  {formatIDR(overview.total_inventory_value_idr)}
                </span>
              </p>
            </div>
          </div>
          <Link
            href="/stok?tab=semua"
            className="touch-target text-caption text-brand-800 bg-brand-100 px-3 py-1 rounded-lg pressable shrink-0 flex items-center justify-center gap-1"
            title={language === "id" ? "Buka daftar seluruh stok barang warung" : "View all store inventory"}
          >
            <span>{t.inventorySummary.seeAll.replace(/\s*→\s*$/, "")}</span>
            <span aria-hidden="true" className="shrink-0">
              <Icon name="arrow-right" size={14} className="shrink-0" />
            </span>
          </Link>
        </div>

        {/* Urgent Action Highlight Box (If any items need restocking) */}
        {overview.low_stock_count > 0 ? (
          <div className="bg-danger-bg rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <Icon name="alert" size={20} className="shrink-0 text-danger" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-danger">
                  {language === "id"
                    ? `Ada ${overview.low_stock_count} barang yang mau habis!`
                    : `${overview.low_stock_count} items running out soon!`}
                </p>
                <p className="text-sm text-danger mt-0.5">
                  {language === "id"
                    ? `${urgentNames} sisa di bawah 2 hari penjualan.`
                    : `${urgentNames} have less than 2 days of sales coverage.`}
                </p>
              </div>
            </div>

            <Link
              href="/stok?tab=perlu-belanja"
              className="touch-target px-4 py-2 bg-surface border border-border text-danger font-semibold text-sm rounded-lg pressable flex items-center justify-center gap-1.5 text-center shrink-0"
            >
              <span>
                {language === "id"
                  ? `Lihat & Pesan (${overview.low_stock_count})`
                  : `Review & Order (${overview.low_stock_count})`}
              </span>
              <span aria-hidden="true" className="shrink-0">
                <Icon name="arrow-right" size={14} className="shrink-0" />
              </span>
            </Link>
          </div>
        ) : (
          <div className="bg-brand-100 rounded-xl p-3 flex items-center gap-2">
            <Icon name="check-circle" size={20} className="shrink-0 text-brand-800" />
            <p className="text-sm font-semibold text-brand-800">
              {language === "id"
                ? "Semua barang di rak masih aman untuk 5+ hari ke depan."
                : "All items on shelf are well stocked for the next 5+ days."}
            </p>
          </div>
        )}

        {/* Quick Filter Status Pills — wrap, never clip (design.md §7) */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/stok?tab=perlu-belanja"
            className={`touch-target px-3.5 py-1.5 rounded-lg border flex items-center gap-1.5 font-semibold shrink-0 pressable ${
              overview.low_stock_count > 0
                ? "bg-danger-bg text-danger"
                : "bg-surface text-muted"
            }`}
            style={{
              borderColor:
                overview.low_stock_count > 0
                  ? "var(--color-danger-bg)"
                  : "var(--color-border)",
            }}
          >
            <Icon name="alert" size={14} className="shrink-0" />
            <span>
              {language === "id"
                ? `${overview.low_stock_count} Mau Habis`
                : `${overview.low_stock_count} Stockout Risk`}
            </span>
          </Link>

          <Link
            href="/stok?tab=semua&status=EXPIRED_RISK"
            className={`touch-target px-3.5 py-1.5 rounded-lg border flex items-center gap-1.5 font-semibold shrink-0 pressable ${
              overview.waste_risk_count > 0
                ? "bg-warn-bg text-warn"
                : "bg-surface text-muted"
            }`}
            style={{
              borderColor:
                overview.waste_risk_count > 0
                  ? "var(--color-warn-bg)"
                  : "var(--color-border)",
            }}
          >
            <Icon name="clock" size={14} className="shrink-0" />
            <span>
              {language === "id"
                ? `${overview.waste_risk_count} Risiko Basi`
                : `${overview.waste_risk_count} Perish Risk`}
            </span>
          </Link>

          <Link
            href="/stok?tab=semua&status=SAFE"
            className="touch-target px-3.5 py-1.5 rounded-lg border bg-brand-100 text-brand-800 flex items-center gap-1.5 font-semibold shrink-0 pressable"
            style={{ borderColor: "var(--color-brand-100)" }}
          >
            <Icon name="check-circle" size={14} className="shrink-0" />
            <span>
              {language === "id"
                ? `${overview.safe_stock_count} Masih Aman`
                : `${overview.safe_stock_count} Safe`}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
