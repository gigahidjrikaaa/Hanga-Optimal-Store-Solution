/**
 * RecommendationCard — The core briefing card.
 *
 * Design: design_system.md §2 — RecommendationCard
 * Layout: action badge → product name → qty range → confidence → factors → rationale → CTA
 * Cards sorted: REORDER → PROMO → HOLD → SKIP; max 5 per briefing.
 */

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
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
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
  } = recommendation;
  const actionBadge = ACTION_BADGES[action];
  const confidenceConfig = CONFIDENCE_CONFIG[confidence];
  const displayName = name ?? sku;

  // Only show factors with |weight| >= 0.05, max 4, sorted by |weight| (spec §4)
  const visibleFactors = factors
    .filter((f) => Math.abs(f.weight) >= 0.05)
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 4);

  return (
    <article
      className="bg-surface p-4 flex flex-col gap-3"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Action badge */}
      <span
        className={`text-caption px-3 py-1 w-fit font-semibold ${actionBadge.className}`}
        style={{ borderRadius: "var(--radius-badge)" }}
      >
        {actionBadge.label}
      </span>

      {/* Product name — never the SKU code (design_system.md §4) */}
      <h3 className="text-heading text-ink-900">{displayName}</h3>

      {/* Quantity range */}
      <p className="text-numeric text-body text-ink-900">
        {qty.min}–{qty.max} {qty.unit}{" "}
        <span className="text-ink-600 font-normal">
          · kemungkinan {qty.likely} {qty.unit}
        </span>
      </p>

      {/* Estimated cost (v1.1) */}
      {est_cost_idr != null && est_cost_idr > 0 && (
        <p className="text-numeric text-caption text-ink-600">
          ±{formatIDR(est_cost_idr)}
        </p>
      )}

      {/* Confidence badge */}
      <span
        className={`text-caption px-3 py-1 w-fit font-medium ${confidenceConfig.className}`}
        style={{ borderRadius: "var(--radius-badge)" }}
      >
        {confidenceConfig.label}
      </span>

      {/* Factor chips */}
      {visibleFactors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visibleFactors.map((factor) => {
            const config = FACTOR_CONFIG[factor.key];
            const isPositive = factor.direction === "+";
            return (
              <span
                key={factor.key}
                className="text-caption px-2 py-1 inline-flex items-center gap-1"
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

      {/* WhatsApp CTA */}
      {order_draft && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <p className="text-caption text-ink-600">
            {order_draft.supplier_ref} · {formatIDR(order_draft.est_cost_idr)}
          </p>
          <a
            href={order_draft.wa_deep_link}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target text-body font-semibold text-center py-3 px-4 text-surface transition-colors"
            style={{
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--color-brand-600)",
              transitionDuration: "var(--duration-fast)",
            }}
          >
            💬 Pesan via WhatsApp
          </a>
        </div>
      )}
    </article>
  );
}
