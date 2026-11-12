/**
 * RecommendationCard — The core briefing card.
 *
 * Design: design_system.md §2 — RecommendationCard
 * Layout: action badge → product name → qty range → cost → confidence → factors
 * → rationale → CTA row. Cards sorted: REORDER → PROMO → HOLD → SKIP; max 5.
 *
 * Surfaces (design.md §6): one card surface (bg-surface + hairline border,
 * rounded-xl), chips rounded-lg inside; the WhatsApp CTA is the screen's one
 * filled primary only on the first card (primary), the rest render as a
 * secondary outlined CTA with the message icon.
 *
 * Tapping the WhatsApp CTA also drafts the order via POST /orders so it shows
 * up on the Pesanan screen (fire-and-forget — the WhatsApp link must never wait).
 */

"use client";

import { api } from "@/lib/api";
import { DEMO_SHOP_ID } from "@/lib/constants";
import { Icon } from "@/components/icons";
import {
  ACTION_BADGES,
  CONFIDENCE_CONFIG,
  FACTOR_CONFIG,
  formatDelta,
  formatIDR,
} from "@/lib/design-system";
import { useLanguage } from "@/lib/i18n/context";
import type { Recommendation } from "@/types";

interface RecommendationCardProps {
  recommendation: Recommendation;
  scenario?: string;
  /** Opens the Tanya Hanga sheet with a grounded question about this card. */
  onAsk?: (question: string) => void;
  waButtonId?: string;
  /** True only for the first (REORDER) card: keeps the one filled WhatsApp CTA. */
  primary?: boolean;
}

/**
 * Bersihkan em/en dash dari string terjemahan pada batas render
 * (design.md §9: koma menggantikan dash).
 */
function cleanCopy(value: string): string {
  return value.replace(/\s*[—–]\s*/g, ", ").trim();
}

export function RecommendationCard({ recommendation, scenario, onAsk, waButtonId, primary }: RecommendationCardProps) {
  const { t, language } = useLanguage();
  const {
    action,
    sku,
    name,
    est_cost_idr,
    qty,
    confidence,
    factors,
    rationale_bahasa,
    order_draft,
    hint_bahasa,
  } = recommendation;
  const actionBadge = ACTION_BADGES[action];
  const confidenceConfig = CONFIDENCE_CONFIG[confidence];
  const displayName = name ?? sku;

  const actionLabel = t.cards.actionLabels[action] ?? actionBadge.label;
  const actionHint = cleanCopy(t.cards.actionHints[action] ?? actionBadge.label);
  const confidenceLabel = t.cards.confidenceLabels[confidence] ?? confidenceConfig.label;

  // Only show factors with |weight| >= 0.05, max 4, sorted by |weight| (spec §4)
  const visibleFactors = factors
    .filter((f) => Math.abs(f.weight) >= 0.05)
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 4);

  // Draft the order server-side when the owner taps the WhatsApp CTA —
  // fire-and-forget so opening the chat is never delayed.
  const draftOrder = () => {
    if (!order_draft) return;
    api
      .post(`/orders/shops/${DEMO_SHOP_ID}/orders`, {
        scenario: scenario ?? "BASELINE",
        supplier_ref: order_draft.supplier_ref,
        wa_deep_link: order_draft.wa_deep_link,
        items: [
          {
            sku,
            name: displayName,
            qty: qty.likely,
            unit: qty.unit,
            est_cost_idr: est_cost_idr ?? order_draft.est_cost_idr,
          },
        ],
      })
      .catch(() => {
        // Offline/demo fallback: the WhatsApp link still opens.
      });
  };

  return (
    <article className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
      {/* Action badge + confidence on one row (was two stacked tiny rows) */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span
          title={actionHint}
          className={`text-caption px-3 py-1 w-fit font-semibold cursor-help rounded-lg ${actionBadge.className}`}
        >
          {actionLabel}
        </span>
        <span
          title={`${language === "id" ? "Tingkat keyakinan data: " : "Confidence level: "}${confidenceLabel}`}
          className={`text-caption px-3 py-1 w-fit font-semibold rounded-lg shrink-0 ${confidenceConfig.className}`}
        >
          {confidenceLabel}
        </span>
      </div>

      {/* Product name — never the SKU code (design_system.md §4) */}
      <h3 className="text-heading text-ink-900">{displayName}</h3>

      {/* Quantity range — the card's decision number, set largest
          ("10 s/d 20 kg", design.md §9); confidence hint rides inline */}
      <div className="flex flex-col gap-1">
        <p className="text-numeric text-lg font-semibold text-ink-900">
          {qty.min} s/d {qty.max} {qty.unit}{" "}
          <span className="text-muted font-normal text-body">
            · {language === "id" ? "kemungkinan" : "likely"} {qty.likely} {qty.unit}
          </span>
        </p>

        {qty.pack_display && (
          <div className="flex items-center gap-1.5 text-caption font-semibold px-2 py-1 w-fit rounded-lg bg-canvas text-ink-900 border border-border">
            <Icon name="package" size={14} className="shrink-0" />
            <span>
              {language === "id" ? "Standar grosir: " : "Wholesale pack: "}
              <span className="font-semibold">{qty.pack_display}</span>
            </span>
          </div>
        )}
      </div>

      {/* Estimated cost (v1.1) — the money line reads second-strongest */}
      {est_cost_idr != null && est_cost_idr > 0 && (
        <p className="text-numeric text-body text-muted">
          {language === "id" ? "Estimasi modal: " : "Estimated capital: "}
          <span className="font-semibold text-ink-900">±{formatIDR(est_cost_idr)}</span>
        </p>
      )}

      {/* Factor chips */}
      {visibleFactors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visibleFactors.map((factor) => {
            const config = FACTOR_CONFIG[factor.key];
            const factorLabel = t.cards.factorLabels[factor.key] ?? config?.label ?? factor.key;
            const isPositive = factor.direction === "+";
            return (
              <span
                key={factor.key}
                title={cleanCopy(factor.note_bahasa)}
                className={`text-caption px-2 py-1 inline-flex items-center gap-1 cursor-help rounded-lg ${
                  isPositive ? "bg-brand-100 text-brand-800" : "bg-warn-bg text-warn"
                }`}
              >
                <Icon name={config?.icon ?? "chart"} size={14} className="shrink-0" />
                <span>
                  {factorLabel}{" "}
                  {/* CASH_TIGHT deferral is binary — no percentage (spec §3) */}
                  {factor.key !== "CASH_TIGHT" && formatDelta(factor.weight)}
                </span>
              </span>
            );
          })}
        </div>
      )}

      {/* Rationale */}
      <p className="text-body text-muted">{rationale_bahasa}</p>

      {/* Operational Hint Callout */}
      {hint_bahasa && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-warn-bg">
          <span className="flex items-center gap-1 font-semibold text-warn shrink-0 text-caption">
            <Icon name="lightbulb" size={14} className="shrink-0" />
            Tips:
          </span>
          <span className="text-caption text-ink-2">{hint_bahasa}</span>
        </div>
      )}

      {/* Tanya Hanga chip — grounded follow-up about this card */}
      {onAsk && (
        <button
          type="button"
          title={language === "id" ? "Tanya alasan AI merekomendasikan saran ini" : "Ask AI why this was recommended"}
          onClick={() =>
            onAsk(
              action === "REORDER"
                ? (language === "id"
                    ? `Kenapa pesan ${qty.likely} ${qty.unit} ${displayName}?`
                    : `Why reorder ${qty.likely} ${qty.unit} of ${displayName}?`)
                : (language === "id"
                    ? `Kenapa ${displayName} ${actionLabel.toLowerCase()}?`
                    : `Why is ${displayName} marked as ${actionLabel.toLowerCase()}?`)
            )
          }
          className="touch-target w-fit text-caption font-semibold px-3 py-1.5 bg-paper-3 text-muted hover:text-ink-900 flex items-center gap-1.5 pressable"
          style={{ borderRadius: "var(--radius-chip)" }}
        >
          <Icon name="mic" size={14} className="shrink-0" />
          <span>{language === "id" ? "Tanya Hanga" : "Ask Hanga"}</span>
          <span className="text-xs font-normal text-neutral-400">
            · {language === "id" ? "Tanya alasan AI" : "Ask AI reasoning"}
          </span>
        </button>
      )}

      {/* WhatsApp CTA with helper subtitle. The first card keeps the screen's
          one filled primary; every other card renders secondary outlined. */}
      {order_draft && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <p className="text-caption text-muted">
            {language === "id" ? "Pemasok: " : "Supplier: "}
            <span className="font-semibold text-ink-900">{order_draft.supplier_ref}</span> · ±{formatIDR(order_draft.est_cost_idr)}
          </p>
          <a
            id={waButtonId}
            href={order_draft.wa_deep_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={draftOrder}
            title={language === "id" ? "Kirim draf pesanan otomatis ke WhatsApp grosir" : "Send automated reorder to wholesaler WhatsApp"}
            className={
              primary
                ? "touch-target text-body font-semibold text-center py-3 px-4 pressable flex flex-col items-center justify-center gap-0.5 bg-brand-600"
                : "touch-target text-body font-semibold text-center py-3 px-4 pressable flex flex-col items-center justify-center gap-0.5 bg-surface border border-border text-brand-800"
            }
            style={{
              borderRadius: "var(--radius-card)",
              ...(primary ? { color: "var(--color-accent-ink)" } : {}),
            }}
          >
            <span className="flex items-center gap-2">
              <Icon name="message" size={18} className="shrink-0" />
              {t.cards.orderWa}
            </span>
            <span className="text-xs font-normal">
              {language === "id"
                ? "Format pesan tersusun otomatis rapi tanpa ketik manual"
                : "Pre-filled reorder message formatted automatically"}
            </span>
          </a>
        </div>
      )}
    </article>
  );
}
