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
import { CashBudgetBar } from "@/components/cash-budget-bar";
import { AskSheet } from "@/components/ask-hanga";
import { RiskBanner } from "@/components/risk-banner";
import { RecommendationCard } from "@/components/recommendation-card";
import { MoverList } from "@/components/mover-list";
import { api } from "@/lib/api";
import { DEMO_DATE, DEMO_SHOP_ID } from "@/lib/constants";
import { DEMO_BRIEFINGS } from "@/lib/demo-data";
import type { ActionType, DailyBriefing, Scenario } from "@/types";

// Spec §4 card ordering (client-side enforced).
const CARD_ORDER: ActionType[] = ["REORDER", "PROMO", "HOLD", "SKIP"];

export default function BerandaPage() {
  const [activeScenario, setActiveScenario] = useState<Scenario>("BASELINE");
  const [cash, setCash] = useState<number | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(
    DEMO_BRIEFINGS.BASELINE
  );
  const [isLoading, setIsLoading] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [askSeed, setAskSeed] = useState<string | undefined>(undefined);

  const openAsk = useCallback((question?: string) => {
    setAskSeed(question);
    setAskOpen(true);
  }, []);

  const loadBriefing = useCallback(
    async (scenario: Scenario, cashIdr: number | null) => {
      setIsLoading(true);
      try {
        const cashParam = cashIdr !== null ? `&cash_available_idr=${cashIdr}` : "";
        const data = await api.get<DailyBriefing>(
          `/briefings/shops/${DEMO_SHOP_ID}/briefings/${DEMO_DATE}?scenario=${scenario}${cashParam}`
        );
        setBriefing(data);
      } catch {
        // Fallback seamlessly to validated client scenario dataset
        // (offline path: budget stays at the snapshot's base fit).
        setBriefing(DEMO_BRIEFINGS[scenario] ?? DEMO_BRIEFINGS.BASELINE);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadBriefing(activeScenario, cash);
  }, [activeScenario, cash, loadBriefing]);

  // Prefill today's cash from the cold-start interview (localStorage mirror).
  useEffect(() => {
    const stored = localStorage.getItem("hanga_cash_today");
    if (stored) {
      const parsed = Number.parseInt(stored, 10);
      if (Number.isFinite(parsed) && parsed > 0) setCash(parsed);
    }
  }, []);

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

        {/* Cash budget bar — input + live bundle refit (v1.1) */}
        {briefing && !isLoading && briefing.budget && (
          <CashBudgetBar
            briefing={briefing}
            cash={cash}
            onChange={setCash}
            disabled={isLoading}
          />
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

            {/* Recommendation cards, spec §4 order: REORDER → PROMO → HOLD → SKIP.
                Staggered rise-in (globals.css §9) — 70ms per card. */}
            <div className="flex flex-col gap-3 px-4">
              {[...briefing.recommendations]
                .sort(
                  (a, b) =>
                    CARD_ORDER.indexOf(a.action) - CARD_ORDER.indexOf(b.action)
                )
                .map((rec, index) => (
                  <div
                    key={`${rec.action}-${rec.sku}`}
                    className="rise-in"
                    style={{ animationDelay: `${120 + index * 70}ms` }}
                  >
                    <RecommendationCard
                      recommendation={rec}
                      scenario={briefing.scenario}
                      onAsk={(question) => openAsk(question)}
                    />
                  </div>
                ))}
            </div>

            {/* Tanya Hanga — general ask */}
            <div className="px-4">
              <button
                type="button"
                onClick={() => openAsk()}
                className="touch-target w-full py-3 px-4 text-body font-semibold text-brand-800 bg-brand-100/70 border border-brand-600/40"
                style={{ borderRadius: "var(--radius-card)" }}
              >
                🎤 Tanya Hanga — tanya apa saja soal briefing ini
              </button>
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

            {/* Baseline comparison footnote (hidden until the backtest fills deltas) */}
            {briefing.baseline_compare &&
              briefing.baseline_compare.deltas.waste_pct != null &&
              briefing.baseline_compare.deltas.stockout_pct != null && (
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
            <p className="text-4xl mb-4 float-soft">📊</p>
            <h2 className="text-heading text-ink-900">Belum ada briefing</h2>
            <p className="text-body text-ink-600 mt-2">
              Foto buku catatan terlebih dahulu untuk mendapatkan rekomendasi
              harian.
            </p>
          </div>
        )}
      </div>

      {/* Tanya Hanga — grounded voice Q&A sheet (v1.1) */}
      <AskSheet
        open={askOpen}
        onClose={() => setAskOpen(false)}
        seedQuestion={askSeed}
        scenario={activeScenario}
        cash={cash}
      />
    </AppShell>
  );
}
