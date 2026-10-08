/**
 * CashBudgetBar — the cash-first advisor's input + fit display (v1.1).
 *
 * Design: design_system.md §2. Two rows: "Kas hari ini" input (quick chips +
 * slider) and the fit row (Terpakai · Sisa + deferred mini-chips). Changing
 * cash re-fetches the briefing with `cash_available_idr`; the bundle is
 * re-fitted server-side in pure code (briefing_spec.md §6.1).
 */

"use client";

import { formatIDR } from "@/lib/design-system";
import { useCountUp } from "@/lib/use-count-up";
import type { DailyBriefing } from "@/types";

interface CashBudgetBarProps {
  briefing: DailyBriefing;
  /** Selected cash; null means "use the briefing's own budget". */
  cash: number | null;
  onChange: (cash: number) => void;
  disabled?: boolean;
}

const QUICK_CHIPS = [100000, 300000, 500000, 1000000, 2000000];
const SLIDER_MIN = 100000;
const SLIDER_MAX = 3000000;
const SLIDER_STEP = 50000;

function shortIDR(amount: number): string {
  if (amount >= 1000000) {
    const jt = amount / 1000000;
    return `${jt % 1 === 0 ? jt : jt.toFixed(1)}jt`;
  }
  return `${Math.round(amount / 1000)}rb`;
}

export function CashBudgetBar({ briefing, cash, onChange, disabled }: CashBudgetBarProps) {
  const budget = briefing.budget;
  if (!budget) return null;

  const effectiveCash = cash ?? budget.cash_available_idr;
  const fitPct = budget.cash_available_idr
    ? Math.min(100, Math.round((budget.committed_idr / budget.cash_available_idr) * 100))
    : 0;
  const overCash = budget.remaining_idr < 0;
  // Numbers settle instead of jumping when the bundle re-fits (§1 Numeric).
  const committed = useCountUp(budget.committed_idr);
  const remaining = useCountUp(budget.remaining_idr);

  const names = new Map<string, string>();
  for (const rec of briefing.recommendations) {
    names.set(rec.sku, rec.name ?? rec.sku);
  }

  return (
    <div className="px-4">
      <div
        className={`p-3 flex flex-col gap-2 border ${
          overCash ? "border-danger-600/40" : "border-brand-600/20"
        }`}
        style={{
          borderRadius: "var(--radius-card)",
          backgroundColor: overCash ? "var(--color-danger-100)" : "var(--color-brand-100)",
          opacity: disabled ? 0.6 : 1,
          transition: "opacity var(--duration-fast) var(--ease-out)",
        }}
      >
        {/* Input row: cash chips + slider */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption font-semibold text-brand-800">
            💵 Kas hari ini
          </span>
          <span className="text-numeric text-caption text-ink-900">
            {formatIDR(effectiveCash)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Kas cepat pilih">
          {QUICK_CHIPS.map((chip) => {
            const isActive = effectiveCash === chip;
            return (
              <button
                key={chip}
                type="button"
                disabled={disabled}
                onClick={() => onChange(chip)}
                aria-pressed={isActive}
                className={`text-caption px-2.5 py-1 font-semibold border pressable disabled:opacity-50 ${
                  isActive
                    ? "bg-brand-600 text-surface border-brand-600"
                    : "bg-surface text-ink-600 border-border"
                }`}
                style={{
                  borderRadius: "var(--radius-badge)",
                  transitionDuration: "var(--duration-fast)",
                }}
              >
                {shortIDR(chip)}
              </button>
            );
          })}
        </div>

        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={SLIDER_STEP}
          value={effectiveCash}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Atur kas hari ini"
          className="w-full accent-brand-600 disabled:opacity-50"
        />

        {/* Fit row */}
        <div className="flex items-center justify-between">
          <span className="text-numeric text-caption text-ink-600">
            Terpakai {formatIDR(committed)}
          </span>
          <span
            className={`text-numeric text-caption font-semibold ${
              overCash ? "text-danger-600" : "text-brand-800"
            }`}
          >
            Sisa {formatIDR(remaining)}
          </span>
        </div>

        <div
          className="h-1.5 w-full overflow-hidden"
          style={{ backgroundColor: "var(--color-border)", borderRadius: "9999px" }}
          role="progressbar"
          aria-valuenow={fitPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Porsi kas terpakai"
        >
          <div
            className="h-full"
            style={{
              width: `${fitPct}%`,
              backgroundColor: overCash
                ? "var(--color-danger-600)"
                : "var(--color-brand-600)",
              transition: "width var(--duration-normal) var(--ease-out)",
            }}
          />
        </div>

        {budget.deferred_skus.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {budget.deferred_skus.map((sku) => (
              <span
                key={sku}
                className="text-caption px-2 py-0.5"
                style={{
                  borderRadius: "var(--radius-chip)",
                  backgroundColor: "var(--color-warn-100)",
                  color: "var(--color-warn-600)",
                }}
              >
                ⏳ {names.get(sku) ?? sku} — besok
              </span>
            ))}
          </div>
        )}

        <span className="text-caption text-ink-600">{budget.note_bahasa}</span>
      </div>
    </div>
  );
}
