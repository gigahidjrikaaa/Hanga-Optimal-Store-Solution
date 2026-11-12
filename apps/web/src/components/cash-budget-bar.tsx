/**
 * CashBudgetBar — the product's signature object (design.md §Motion, §6).
 *
 * The cash-first advisor's input + fit display (v1.1). Two rows: "Kas hari
 * ini" input (quick chips + slider) and the fit row (Terpakai · Sisa + fit
 * bar: brand fill on the paper-3 track) plus deferred mini-chips in warn
 * tones. Changing cash re-fetches the briefing with `cash_available_idr`;
 * the bundle is re-fitted server-side in pure code (briefing_spec.md §6.1).
 *
 * Surfaces: one card (bg-surface, hairline border, rounded-xl); wells and
 * chips inside are paper-3 and borderless; the danger border appears only
 * when the bundle overruns the cash. Numbers settle via useCountUp (§1).
 */

"use client";

import { formatIDR } from "@/lib/design-system";
import { Icon } from "@/components/icons";
import { useCountUp } from "@/lib/use-count-up";
import { useLanguage } from "@/lib/i18n/context";
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
  const { language } = useLanguage();
  const budget = briefing.budget;
  // Numbers settle instead of jumping when the bundle re-fits (§1 Numeric).
  // Hooks stay above any early return.
  const committed = useCountUp(budget?.committed_idr ?? 0);
  const remaining = useCountUp(budget?.remaining_idr ?? 0);
  if (!budget) return null;

  const effectiveCash = cash ?? budget.cash_available_idr;
  const fitPct = budget.cash_available_idr
    ? Math.min(100, Math.round((budget.committed_idr / budget.cash_available_idr) * 100))
    : 0;
  const overCash = budget.remaining_idr < 0;

  const names = new Map<string, string>();
  for (const rec of briefing.recommendations) {
    names.set(rec.sku, rec.name ?? rec.sku);
  }

  return (
    <div className="px-4">
      <div
        className="p-4 flex flex-col gap-3 bg-surface border rounded-xl"
        style={{
          borderColor: overCash ? "var(--color-danger)" : "var(--color-border)",
          opacity: disabled ? 0.6 : 1,
          transition: "opacity var(--dur-short) var(--ease-out)",
        }}
      >
        {/* Input row: cash chips + slider */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon name="banknote" size={18} className="shrink-0 text-brand-800" />
            <span className="text-heading text-ink-900 truncate">
              {language === "id" ? "Kas hari ini" : "Purchasing Cash"}
            </span>
            <span
              title={
                language === "id"
                  ? "Uang tunai di kasir yang siap dibelanjakan untuk stok hari ini"
                  : "Available cash on hand allocated for inventory restock today"
              }
              className="text-caption text-muted bg-paper-3 rounded-full px-2 py-0.5 cursor-help shrink-0"
            >
              ?
            </span>
          </div>
          <span className="text-numeric text-lg font-semibold text-ink-900 shrink-0">
            {formatIDR(effectiveCash)}
          </span>
        </div>

        <p className="text-caption text-muted flex items-start gap-1.5">
          <Icon name="lightbulb" size={14} className="shrink-0" />
          <span>
            {language === "id"
              ? "Geser slider atau ketuk nominal untuk menyesuaikan belanjaan dengan modal Anda:"
              : "Adjust the slider or tap chips to fit reorders within your available cash:"}
          </span>
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
                title={`${language === "id" ? "Pilih nominal kas" : "Select cash amount"} ${formatIDR(chip)}`}
                className="touch-target text-sm font-semibold px-3.5 py-1.5 pressable disabled:opacity-50"
                style={{
                  borderRadius: "var(--radius-chip)",
                  ...(isActive
                    ? {
                        backgroundColor: "var(--color-brand-600)",
                        color: "var(--color-accent-ink)",
                      }
                    : {
                        backgroundColor: "var(--color-paper-3)",
                        color: "var(--color-ink-900)",
                      }),
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
            title={language === "id" ? "Geser untuk menyesuaikan modal kasir" : "Drag to adjust working cash"}
            className="w-full accent-brand-600 disabled:opacity-50 cursor-pointer h-2.5"
          />
          <div className="flex justify-between text-caption text-muted">
            <span>{shortIDR(SLIDER_MIN)}</span>
            <span>Rp 1,5jt</span>
            <span>{shortIDR(SLIDER_MAX)}</span>
          </div>
        </div>

        {/* Fit row */}
        <div className="flex items-center justify-between gap-2 pt-1 min-w-0">
          <span className="text-numeric text-sm text-muted min-w-0 truncate">
            {language === "id" ? "Terpakai: " : "Committed: "}
            <span className="text-ink-900 font-semibold">{formatIDR(committed)}</span>
          </span>
          <span
            className={`text-numeric text-sm font-semibold shrink-0 ${
              overCash ? "text-danger" : "text-brand-800"
            }`}
          >
            {language === "id" ? "Sisa Kas: " : "Remaining: "}
            {formatIDR(remaining)}
          </span>
        </div>

        {/* The signature fit bar: brand fill on the paper-3 track */}
        <div
          className="h-2 w-full overflow-hidden bg-paper-3 rounded-full"
          role="progressbar"
          aria-valuenow={fitPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Porsi kas terpakai"
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${fitPct}%`,
              backgroundColor: overCash
                ? "var(--color-danger-fill)"
                : "var(--color-brand-600)",
              transition: "width var(--dur-short) var(--ease-out)",
            }}
          />
        </div>

        {budget.deferred_skus.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
            <span className="text-caption text-warn flex items-center gap-1.5">
              <Icon name="clock" size={14} className="shrink-0" />
              {language === "id"
                ? "Ditunda ke jadwal besok (kas dihemat):"
                : "Deferred to tomorrow (saving cash):"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {budget.deferred_skus.map((sku) => (
                <span
                  key={sku}
                  title={
                    language === "id"
                      ? "Pesanan ini ditunda ke esok hari agar uang kas mencukupi kebutuhan pokok prioritas"
                      : "Order deferred to tomorrow so cash remains sufficient for urgent staples"
                  }
                  className="text-caption px-2 py-0.5 cursor-help font-semibold bg-warn-bg text-warn rounded-lg"
                >
                  {names.get(sku) ?? sku}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-caption text-muted">{budget.note_bahasa}</p>
      </div>
    </div>
  );
}
