/**
 * InventoryHealthBar — Executive stock health widget for the daily briefing page (Tier 1).
 *
 * Displays a high-level summary of total catalog SKUs, committed working capital,
 * critical stock alerts, and expiration risks, with direct links to the full stock dashboard.
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
        <div className="skeleton h-28 w-full rounded-2xl" />
      </div>
    );
  }

  const criticalOrLow = overview.items.filter(
    (i) => i.status === "CRITICAL" || i.status === "LOW"
  );
  const wasteRisk = overview.items.filter((i) => i.status === "EXPIRED_RISK");

  return (
    <div className="px-4">
      <div className="bg-canvas border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <div>
              <h2 className="text-body font-bold text-ink-900 leading-tight">
                Ringkasan Stok Warung
              </h2>
              <p className="text-caption text-ink-600">
                {overview.total_skus} produk aktif dipantau
              </p>
            </div>
          </div>
          <Link
            href="/stok"
            className="text-caption font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors border border-brand-200"
            title="Buka katalog lengkap dan kelola stok rak"
          >
            <span>Katalog Lengkap</span>
            <span>→</span>
          </Link>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {/* Metric 1: Total Modal Stok */}
          <div className="bg-neutral-50/80 border border-neutral-200/70 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-caption text-neutral-500 font-medium">
              Modal di Rak
            </span>
            <div className="mt-1">
              <span className="text-body font-bold text-ink-900">
                {formatIDR(overview.total_inventory_value_idr)}
              </span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {overview.total_skus} macam barang
              </p>
            </div>
          </div>

          {/* Metric 2: Kritis / Perlu Belanja */}
          <Link
            href="/stok?status=CRITICAL"
            className={`border rounded-xl p-2.5 flex flex-col justify-between transition-colors ${
              overview.low_stock_count > 0
                ? "bg-red-50/70 border-red-200 hover:bg-red-100/60"
                : "bg-neutral-50/80 border-neutral-200/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-caption text-red-700 font-medium">
                Perlu Belanja
              </span>
              <span className="text-xs">🚨</span>
            </div>
            <div className="mt-1">
              <span className="text-body font-bold text-red-800">
                {overview.low_stock_count} SKU
              </span>
              <p className="text-[11px] text-red-600 font-medium mt-0.5">
                {criticalOrLow.slice(0, 2).map((i) => i.name.split(" ")[0]).join(", ")}
                {criticalOrLow.length > 2 ? ` +${criticalOrLow.length - 2}` : ""}
              </p>
            </div>
          </Link>

          {/* Metric 3: Risiko Basi / Expired */}
          <Link
            href="/stok?status=EXPIRED_RISK"
            className={`border rounded-xl p-2.5 flex flex-col justify-between transition-colors ${
              overview.waste_risk_count > 0
                ? "bg-amber-50/70 border-amber-200 hover:bg-amber-100/60"
                : "bg-neutral-50/80 border-neutral-200/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-caption text-amber-700 font-medium">
                Risiko Basi
              </span>
              <span className="text-xs">⚠️</span>
            </div>
            <div className="mt-1">
              <span className="text-body font-bold text-amber-800">
                {overview.waste_risk_count} SKU
              </span>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                {wasteRisk.map((i) => i.name.split(" ")[0]).join(", ")}
              </p>
            </div>
          </Link>

          {/* Metric 4: Stok Aman */}
          <Link
            href="/stok?status=SAFE"
            className="bg-emerald-50/70 border border-emerald-200 hover:bg-emerald-100/60 rounded-xl p-2.5 flex flex-col justify-between transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-caption text-emerald-700 font-medium">
                Stok Aman
              </span>
              <span className="text-xs">✅</span>
            </div>
            <div className="mt-1">
              <span className="text-body font-bold text-emerald-800">
                {overview.safe_stock_count} SKU
              </span>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                Cukupi 5+ hari
              </p>
            </div>
          </Link>
        </div>

        {/* Micro-hint */}
        <div className="flex items-start gap-1.5 text-[11px] text-ink-600 bg-neutral-100/70 px-2.5 py-1.5 rounded-lg border border-neutral-200/50">
          <span>💡</span>
          <span>
            <strong>Tips Stok:</strong> Klik kartu di atas untuk filter cepat di daftar stok lengkap atau cek rekomendasi belanja otomatis di bawah.
          </span>
        </div>
      </div>
    </div>
  );
}
