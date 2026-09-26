/**
 * RiskBanner — Full-width alert for waste/stockout risks.
 *
 * Design: design_system.md §2 — RiskBanner
 * Uses warn/danger bg with icon + one sentence + affected items.
 */

import type { Risk } from "@/types";

interface RiskBannerProps {
  risks: Risk[];
}

export function RiskBanner({ risks }: RiskBannerProps) {
  if (risks.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 px-4">
      {risks.map((risk) => {
        const isDanger = risk.severity >= 2;
        return (
          <div
            key={`${risk.type}-${risk.sku}`}
            className="p-3 flex items-start gap-3"
            style={{
              borderRadius: "var(--radius-card)",
              backgroundColor: isDanger
                ? "var(--color-danger-100)"
                : "var(--color-warn-100)",
              color: isDanger
                ? "var(--color-danger-600)"
                : "var(--color-warn-600)",
            }}
          >
            <span className="text-xl" aria-hidden="true">
              {risk.type === "WASTE_RISK" ? "🗑️" : "⚠️"}
            </span>
            <div>
              <p className="text-body font-semibold">
                {risk.type === "WASTE_RISK"
                  ? `Risiko buang: ${risk.sku}`
                  : `Risiko habis: ${risk.sku}`}
              </p>
              <p className="text-caption">
                Perkiraan tanggal: {risk.window}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
