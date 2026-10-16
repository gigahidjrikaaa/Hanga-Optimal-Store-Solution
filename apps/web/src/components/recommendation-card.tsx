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
import type { Recommendation } from "@/types";

interface RecommendationCardProps {
  recommendation: Recommendation;
  scenario?: string;
  /** Opens the Tanya Hanga sheet with a grounded question about this card. */
  onAsk?: (question: string) => void;
}

export function RecommendationCard({ recommendation, scenario, onAsk }: RecommendationCardProps) {
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

  const ACTION_HINTS: Record<string, string> = {
    REORDER: "Stok menipis atau perputaran cepat — disarankan pesan ke grosir hari ini",
    PROMO: "Beri potongan diskon atau paket hemat sebelum kualitas menurun / kadaluarsa",
    HOLD: "Stok di rak masih cukup banyak — tahan belanja untuk menghemat modal kas",
    SKIP: "Penjualan melambat — lewati pemesanan untuk menghindari penumpukan modal",
  };

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
          title={ACTION_HINTS[action] ?? actionBadge.label}
          className={`text-caption px-3 py-1 w-fit font-semibold cursor-help ${actionBadge.className}`}
          style={{ borderRadius: "var(--radius-badge)" }}
        >
          {actionBadge.label}
        </span>
        <span className="text-xs text-ink-600 hidden sm:inline-block">
          {ACTION_HINTS[action]}
        </span>
      </div>

      {/* Product name — never the SKU code (design_system.md §4) */}
      <h3 className="text-heading text-ink-900">{displayName}</h3>

      {/* Quantity range and wholesale pack conversion */}
      <div className="flex flex-col gap-1">
        <p className="text-numeric text-body text-ink-900">
          {qty.min}–{qty.max} {qty.unit}{" "}
          <span className="text-ink-600 font-normal">
            · kemungkinan {qty.likely} {qty.unit}
          </span>
        </p>

        {qty.pack_display && (
          <div className="flex items-center gap-1.5 text-caption font-medium px-2 py-0.5 w-fit rounded bg-canvas text-ink-900 border border-border">
            <span>📦</span>
            <span>Standar grosir: <strong className="font-semibold">{qty.pack_display}</strong></span>
          </div>
        )}
      </div>

      {/* Estimated cost (v1.1) */}
      {est_cost_idr != null && est_cost_idr > 0 && (
        <p className="text-numeric text-caption text-ink-600">
          Estimasi modal: <span className="font-semibold text-ink-900">±{formatIDR(est_cost_idr)}</span>
        </p>
      )}

      {/* Confidence badge with explanatory title */}
      <div className="flex items-center gap-2">
        <span
          title={`Tingkat keyakinan data: ${confidenceConfig.label}`}
          className={`text-caption px-3 py-1 w-fit font-medium ${confidenceConfig.className}`}
          style={{ borderRadius: "var(--radius-badge)" }}
        >
          {confidenceConfig.label}
        </span>
      </div>

      {/* Factor chips */}
      {visibleFactors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visibleFactors.map((factor) => {
            const config = FACTOR_CONFIG[factor.key];
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
                <span aria-hidden="true">{config.icon}</span>
                {config.label}{" "}
                {/* CASH_TIGHT deferral is binary — no percentage (spec §3) */}
                {factor.key !== "CASH_TIGHT" && formatDelta(factor.weight)}
              </span>
            );
          })}
        </div>
      )}

      {/* Rationale */}
      <p className="text-body text-ink-600">{rationale_bahasa}</p>

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
          title="Tanya alasan AI merekomendasikan saran ini"
          onClick={() =>
            onAsk(
              action === "REORDER"
                ? `Kenapa pesan ${qty.likely} ${qty.unit} ${displayName}?`
                : `Kenapa ${displayName} ${ACTION_BADGES[action].label.toLowerCase()}?`
            )
          }
          className="touch-target w-fit text-caption font-semibold px-3 py-1.5 bg-canvas border border-border text-ink-600 hover:text-ink-900 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors"
          style={{ borderRadius: "var(--radius-badge)" }}
        >
          <span>🎤 Tanya Hanga</span>
          <span className="text-xs text-neutral-400 font-normal">· Tanya alasan AI</span>
        </button>
      )}

      {/* WhatsApp CTA with helper subtitle */}
      {order_draft && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <p className="text-caption text-ink-600">
            Pemasok: <strong>{order_draft.supplier_ref}</strong> · ±{formatIDR(order_draft.est_cost_idr)}
          </p>
          <a
            href={order_draft.wa_deep_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={draftOrder}
            title="Kirim draf pesanan otomatis ke WhatsApp grosir"
            className="touch-target text-body font-semibold text-center py-3 px-4 text-surface pressable flex flex-col items-center justify-center gap-0.5"
            style={{
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--color-brand-600)",
              transitionDuration: "var(--duration-fast)",
            }}
          >
            <span>💬 Pesan via WhatsApp</span>
            <span className="text-xs font-normal opacity-90">
              Format pesan tersusun otomatis rapi tanpa ketik manual
            </span>
          </a>
        </div>
      )}
    </article>
  );
}
