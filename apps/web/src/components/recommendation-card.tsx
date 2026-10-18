/**
 * RecommendationCard — The core briefing card.
 *
 * Design: design_system.md §2 — RecommendationCard
 * Layout: action badge → product name → qty range → cost → confidence → factors
 * → rationale → CTA row. Cards sorted: REORDER → PROMO → HOLD → SKIP; max 5.
 *
 * Tapping the WhatsApp CTA also drafts the order via POST /orders so it shows
 * up on the Pesanan screen (fire-and-forget — the WhatsApp link must never wait).
 */

"use client";

import { api } from "@/lib/api";
import { DEMO_SHOP_ID } from "@/lib/constants";
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
}

export function RecommendationCard({ recommendation, scenario, onAsk }: RecommendationCardProps) {
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
  const actionHint = t.cards.actionHints[action] ?? actionBadge.label;
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
    <article
      className="bg-surface p-4 flex flex-col gap-3"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Action badge with accessibility title hint */}
      <div className="flex items-center justify-between">
        <span
          title={actionHint}
          className={`text-caption px-3 py-1 w-fit font-semibold cursor-help ${actionBadge.className}`}
          style={{ borderRadius: "var(--radius-badge)" }}
        >
          {actionLabel}
        </span>
        <span className="text-xs text-ink-600 hidden sm:inline-block">
          {actionHint}
        </span>
      </div>

      {/* Product name — never the SKU code (design_system.md §4) */}
      <h3 className="text-heading text-ink-900">{displayName}</h3>

      {/* Quantity range and wholesale pack conversion */}
      <div className="flex flex-col gap-1">
        <p className="text-numeric text-body text-ink-900">
          {qty.min}–{qty.max} {qty.unit}{" "}
          <span className="text-ink-600 font-normal">
            · {language === "id" ? "kemungkinan" : "likely"} {qty.likely} {qty.unit}
          </span>
        </p>

        {qty.pack_display && (
          <div className="flex items-center gap-1.5 text-caption font-medium px-2 py-0.5 w-fit rounded bg-canvas text-ink-900 border border-border">
            <span>📦</span>
            <span>
              {language === "id" ? "Standar grosir: " : "Wholesale pack: "}
              <strong className="font-semibold">{qty.pack_display}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Estimated cost (v1.1) */}
      {est_cost_idr != null && est_cost_idr > 0 && (
        <p className="text-numeric text-caption text-ink-600">
          {language === "id" ? "Estimasi modal: " : "Estimated capital: "}
          <span className="font-semibold text-ink-900">±{formatIDR(est_cost_idr)}</span>
        </p>
      )}

      {/* Confidence badge with explanatory title */}
      <div className="flex items-center gap-2">
        <span
          title={`${language === "id" ? "Tingkat keyakinan data: " : "Confidence level: "}${confidenceLabel}`}
          className={`text-caption px-3 py-1 w-fit font-medium ${confidenceConfig.className}`}
          style={{ borderRadius: "var(--radius-badge)" }}
        >
          {confidenceLabel}
        </span>
      </div>

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
                title={factor.note_bahasa}
                className="text-caption px-2 py-1 inline-flex items-center gap-1 cursor-help"
                style={{
                  borderRadius: "var(--radius-chip)",
                  backgroundColor: isPositive
                    ? "var(--color-brand-100)"
                    : "var(--color-warn-100)",
                  color: isPositive
                    ? "var(--color-brand-800)"
                    : "var(--color-warn-600)",
                }}
              >
                <span aria-hidden="true">{config?.icon ?? "📌"}</span>
                {factorLabel}{" "}
                {/* CASH_TIGHT deferral is binary — no percentage (spec §3) */}
                {factor.key !== "CASH_TIGHT" && formatDelta(factor.weight)}
              </span>
            );
          })}
        </div>
      )}

      {/* Rationale */}
      <p className="text-body text-ink-600 leading-relaxed">{rationale_bahasa}</p>

      {/* Operational Hint Callout */}
      {hint_bahasa && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-ink-900 text-caption">
          <span className="text-amber-600 font-bold shrink-0">💡 Tips:</span>
          <span className="text-ink-600 leading-relaxed">{hint_bahasa}</span>
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
          className="touch-target w-fit text-caption font-semibold px-3 py-1.5 bg-canvas border border-border text-ink-600 hover:text-ink-900 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors"
          style={{ borderRadius: "var(--radius-badge)" }}
        >
          <span>🎤 {language === "id" ? "Tanya Hanga" : "Ask Hanga"}</span>
          <span className="text-xs text-neutral-400 font-normal">
            · {language === "id" ? "Tanya alasan AI" : "Ask AI reasoning"}
          </span>
        </button>
      )}

      {/* WhatsApp CTA with helper subtitle */}
      {order_draft && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <p className="text-caption text-ink-600">
            {language === "id" ? "Pemasok: " : "Supplier: "}
            <strong>{order_draft.supplier_ref}</strong> · ±{formatIDR(order_draft.est_cost_idr)}
          </p>
          <a
            href={order_draft.wa_deep_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={draftOrder}
            title={language === "id" ? "Kirim draf pesanan otomatis ke WhatsApp grosir" : "Send automated reorder to wholesaler WhatsApp"}
            className="touch-target text-body font-semibold text-center py-3 px-4 text-surface pressable flex flex-col items-center justify-center gap-0.5"
            style={{
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--color-brand-600)",
              transitionDuration: "var(--duration-fast)",
            }}
          >
            <span>💬 {t.cards.orderWa}</span>
            <span className="text-xs font-normal opacity-90">
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
