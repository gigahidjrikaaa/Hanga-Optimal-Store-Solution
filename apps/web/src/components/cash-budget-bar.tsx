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
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-brand-900">
              💵 Kas hari ini
            </span>
            <span
              title="Uang tunai di kasir yang siap dibelanjakan untuk stok hari ini"
              className="text-xs text-brand-700 bg-brand-200/80 rounded-full px-2 py-0.5 cursor-help font-bold"
            >
              ?
            </span>
          </div>
          <span className="text-numeric text-base font-extrabold text-ink-900">
            {formatIDR(effectiveCash)}
          </span>
        </div>

        <p className="text-xs text-ink-700 font-medium">
          💡 Geser slider atau ketuk nominal untuk menyesuaikan belanjaan dengan modal Anda:
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Kas cepat pilih">
          {QUICK_CHIPS.map((chip) => {
            const isActive = effectiveCash === chip;
            return (
              <button
                key={chip}
                type="button"
                disabled={disabled}
                onClick={() => onChange(chip)}
                aria-pressed={isActive}
                title={`Pilih nominal kas ${formatIDR(chip)}`}
                className={`min-h-[42px] text-sm px-3.5 py-1.5 font-bold border pressable disabled:opacity-50 touch-target ${
                  isActive
                    ? "bg-brand-600 text-surface border-brand-600 shadow-sm"
                    : "bg-surface text-ink-900 border-border hover:border-brand-600/40"
                }`}
                style={{
                  borderRadius: "var(--radius-chip)",
                  transitionDuration: "var(--duration-fast)",
                }}
              >
                {shortIDR(chip)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-1.5 py-1">
          <input
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={SLIDER_STEP}
            value={effectiveCash}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label="Atur kas hari ini"
            title="Geser untuk menyesuaikan modal kasir"
            className="w-full accent-brand-600 disabled:opacity-50 cursor-pointer h-2.5"
          />
          <div className="flex justify-between text-xs text-ink-700 font-semibold">
            <span>{shortIDR(SLIDER_MIN)}</span>
            <span>Rp 1,5jt</span>
            <span>{shortIDR(SLIDER_MAX)}</span>
          </div>
        </div>

        {/* Fit row */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-numeric text-sm text-ink-700">
            Terpakai: <strong className="text-ink-900 font-bold">{formatIDR(committed)}</strong>
          </span>
          <span
            className={`text-numeric text-sm font-extrabold ${
              overCash ? "text-danger-600" : "text-brand-800"
            }`}
          >
            Sisa Kas: {formatIDR(remaining)}
          </span>
        </div>

        <div
          className="h-2 w-full overflow-hidden"
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
          <div className="flex flex-col gap-1 pt-1 border-t border-border/50">
            <span className="text-xs text-warn-700 font-semibold flex items-center gap-1">
              <span>⏳</span> Ditunda ke jadwal besok (kas dihemat):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {budget.deferred_skus.map((sku) => (
                <span
                  key={sku}
                  title="Pesanan ini ditunda ke esok hari agar uang kas mencukupi kebutuhan pokok prioritas"
                  className="text-caption px-2 py-0.5 cursor-help font-medium"
                  style={{
                    borderRadius: "var(--radius-chip)",
                    backgroundColor: "var(--color-warn-100)",
                    color: "var(--color-warn-600)",
                  }}
                >
                  {names.get(sku) ?? sku}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-caption text-ink-600 mt-0.5">{budget.note_bahasa}</p>
      </div>
    </div>
  );
}
