/**
 * RiskBanner — Full-width alert for waste/stockout risks.
 *
 * Design: design_system.md §2 — RiskBanner
 * Severity as a token pair (design.md §Surfaces): danger bg-danger-bg/text-danger,
 * warn bg-warn-bg/text-warn, with the alert icon beside the label. No entrance
 * animation: banners render settled (motion is state-only, design.md §Motion).
 */

import { Icon } from "@/components/icons";
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
            className={`p-3 flex items-start gap-3 rounded-xl ${
              isDanger ? "bg-danger-bg text-danger" : "bg-warn-bg text-warn"
            }`}
          >
            <Icon
              name={risk.type === "WASTE_RISK" ? "alert" : "alert-circle"}
              size={22}
              className="shrink-0"
            />
            <div className="min-w-0">
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
