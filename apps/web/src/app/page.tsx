/**
 * Beranda (Briefing) — Screen 4 in design_system.md §3.
 *
 * The daily briefing screen: headline, ScenarioToggle, RiskBanner,
 * RecommendationCards, MoverList, baseline footnote.
 *
 * This is the core product screen Bu Sari reads every morning in 30 seconds.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { HangaLogo } from "@/components/hanga-logo";
import { ScenarioToggle } from "@/components/scenario-toggle";
import { RiskBanner } from "@/components/risk-banner";
import { RecommendationCard } from "@/components/recommendation-card";
import { MoverList } from "@/components/mover-list";
import { api } from "@/lib/api";
import { formatIDR } from "@/lib/design-system";
import { DEMO_BRIEFINGS } from "@/lib/demo-data";
import type { DailyBriefing, Scenario } from "@/types";

export default function BerandaPage() {
  const [activeScenario, setActiveScenario] = useState<Scenario>("BASELINE");
  const [briefing, setBriefing] = useState<DailyBriefing | null>(
    DEMO_BRIEFINGS.BASELINE
  );
  const [isLoading, setIsLoading] = useState(false);

  const loadBriefing = useCallback(async (scenario: Scenario) => {
    setIsLoading(true);
    try {
      const data = await api.get<DailyBriefing>(
        `/briefings/shops/warung-bu-sari/briefings/2026-10-10?scenario=${scenario}`
      );
      setBriefing(data);
    } catch {
      // Fallback seamlessly to validated client scenario dataset
      setBriefing(DEMO_BRIEFINGS[scenario] ?? DEMO_BRIEFINGS.BASELINE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBriefing(activeScenario);
  }, [activeScenario, loadBriefing]);

  return (
    <AppShell>
      <div className="flex flex-col gap-4 py-4">
        {/* Top Branding & Greeting Bar */}
        <div className="px-4 flex items-center justify-between border-b border-border/60 pb-3">
          <HangaLogo variant="full" size="sm" />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-100/70 text-brand-800 text-caption font-semibold">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
            <span>Stok Aktif</span>
          </div>
        </div>

        {/* Greeting & Headline */}
        <div className="px-4">
          <p className="text-caption text-ink-600">Selamat pagi, Bu Sari 👋</p>
          {briefing ? (
            <h1 className="text-display text-ink-900 mt-1">
              {briefing.headline}
            </h1>
          ) : (
            <h1 className="text-display text-ink-900 mt-1">
              Briefing Hari Ini
            </h1>
          )}
        </div>

        {/* Scenario toggle */}
        <ScenarioToggle
          active={activeScenario}
          onSelect={setActiveScenario}
          disabled={isLoading}
        />

        {/* Cash budget fit (v1.1) */}
        {briefing && !isLoading && briefing.budget && (
          <div className="px-4">
            <div
              className="bg-brand-100/70 p-3 flex flex-col gap-1"
              style={{ borderRadius: "var(--radius-card)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-caption font-semibold text-brand-800">
                  💵 Kas hari ini {formatIDR(briefing.budget.cash_available_idr)}
                </span>
                <span className="text-numeric text-caption text-ink-600">
                  Terpakai {formatIDR(briefing.budget.committed_idr)} · Sisa{" "}
                  {formatIDR(briefing.budget.remaining_idr)}
                </span>
              </div>
              {briefing.budget.deferred_skus.length > 0 && (
                <span className="text-caption text-warn-600">
                  ⏳ Ditunda besok: {briefing.budget.deferred_skus.join(", ")}
                </span>
              )}
              <span className="text-caption text-ink-600">
                {briefing.budget.note_bahasa}
              </span>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-3 px-4">
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-48 w-full" />
            <div className="skeleton h-48 w-full" />
          </div>
        )}

        {/* Briefing content */}
        {briefing && !isLoading && (
          <>
            {/* Risk banners */}
            <RiskBanner risks={briefing.risks} />

            {/* Recommendation cards (sorted: REORDER → PROMO → HOLD → SKIP) */}
            <div className="flex flex-col gap-3 px-4">
              {briefing.recommendations.map((rec) => (
                <RecommendationCard
                  key={`${rec.action}-${rec.sku}`}
                  recommendation={rec}
                />
              ))}
            </div>

            {/* Movers */}
            <MoverList
              title="📈 Barang Laris"
              movers={briefing.movers.fast}
              type="fast"
            />
            <MoverList
              title="📉 Barang Lambat"
              movers={briefing.movers.slow}
              type="slow"
            />

            {/* Baseline comparison footnote */}
            {briefing.baseline_compare && (
              <div className="px-4">
                <p className="text-caption text-ink-600">
                  Dibandingkan kebijakan rata-rata 7 hari: buang{" "}
                  {briefing.baseline_compare.deltas.waste_pct}%, habis stok{" "}
                  {briefing.baseline_compare.deltas.stockout_pct}%
                </p>
              </div>
            )}

            {/* Data quality footnote */}
            {briefing.data_quality && (
              <div className="px-4 pb-4">
                <p className="text-caption text-neutral-400">
                  Data: {briefing.data_quality.coverage_days} hari ·{" "}
                  {briefing.data_quality.extraction_confirmed_lines} baris dikonfirmasi
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!briefing && !isLoading && (
          <div className="px-4 py-12 text-center">
            <p className="text-4xl mb-4">📊</p>
            <h2 className="text-heading text-ink-900">Belum ada briefing</h2>
            <p className="text-body text-ink-600 mt-2">
              Foto buku catatan terlebih dahulu untuk mendapatkan rekomendasi
              harian.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
