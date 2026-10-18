/**
 * InventoryHealthBar — Elder-friendly stock summary card for Beranda (Tier 1).
 *
 * Designed for immediate glanceability (30-second morning briefing):
 * - Large, high-contrast readable text (min 14px)
 * - Highlights immediately if any items are running low
 * - 44px+ touch-friendly CTA directly opening the urgent restock list
 */

"use client";

import Link from "next/link";
import { formatIDR } from "@/lib/design-system";
import type { InventoryOverview } from "@/types";

interface InventoryHealthBarProps {
  overview: InventoryOverview;
  isLoading?: boolean;
}

export function InventoryHealthBar({ overview, isLoading }: InventoryHealthBarProps) {
  if (isLoading) {
    return (
      <div className="px-4">
        <div className="skeleton h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const criticalOrLow = overview.items.filter(
    (i) => i.status === "CRITICAL" || i.status === "LOW"
  );
  const urgentNames = criticalOrLow.map((i) => i.name.split(" ")[0]).join(", ");

  return (
    <div className="px-4">
      <div className="bg-canvas border border-border rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        {/* Header Summary */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" role="img" aria-label="Warung">
              🏪
            </span>
            <div>
              <h2 className="text-base font-bold text-ink-900 leading-tight">
                Stok & Dagangan Warung
              </h2>
              <p className="text-sm text-ink-600 mt-0.5">
                {overview.total_skus} macam barang · Uang di rak:{" "}
                <span className="font-semibold text-ink-900">
                  {formatIDR(overview.total_inventory_value_idr)}
                </span>
              </p>
            </div>
          </div>
          <Link
            href="/stok?tab=semua"
            className="text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-xl transition-colors border border-brand-200 whitespace-nowrap min-h-[44px] flex items-center justify-center touch-target"
            title="Buka daftar seluruh stok barang warung"
          >
            Semua Stok →
          </Link>
        </div>

        {/* Urgent Action Highlight Box (If any items need restocking) */}
        {overview.low_stock_count > 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <span className="text-xl" role="img" aria-label="Peringatan">
                🚨
              </span>
              <div>
                <p className="text-sm font-bold text-red-900">
                  Ada {overview.low_stock_count} barang yang mau habis!
                </p>
                <p className="text-sm text-red-700 mt-0.5">
                  {urgentNames} sisa di bawah 2 hari penjualan.
                </p>
              </div>
            </div>

            <Link
              href="/stok?tab=perlu-belanja"
              className="min-h-[44px] px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all text-center touch-target"
            >
              <span>Lihat & Pesan ({overview.low_stock_count})</span>
              <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
            <span className="text-xl">✅</span>
            <p className="text-sm font-semibold text-emerald-900">
              Semua barang di rak masih aman untuk 5+ hari ke depan.
            </p>
          </div>
        )}

        {/* Quick Filter Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-sm">
          <Link
            href="/stok?tab=perlu-belanja"
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors font-medium ${
              overview.low_stock_count > 0
                ? "bg-red-100/70 border-red-300 text-red-800 hover:bg-red-200/70"
                : "bg-surface border-border text-ink-600"
            }`}
          >
            <span>🚨</span>
            <span>{overview.low_stock_count} Mau Habis</span>
          </Link>

          <Link
            href="/stok?tab=semua&status=EXPIRED_RISK"
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors font-medium ${
              overview.waste_risk_count > 0
                ? "bg-amber-100/70 border-amber-300 text-amber-800 hover:bg-amber-200/70"
                : "bg-surface border-border text-ink-600"
            }`}
          >
            <span>⚠️</span>
            <span>{overview.waste_risk_count} Risiko Basi</span>
          </Link>

          <Link
            href="/stok?tab=semua&status=SAFE"
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl border bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors font-medium"
          >
            <span>✅</span>
            <span>{overview.safe_stock_count} Masih Aman</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
