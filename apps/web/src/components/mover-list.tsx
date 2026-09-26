/**
 * MoverList — Fast/slow movers with delta indicators.
 *
 * Design: design_system.md §2 — MoverList
 * Rows: product name + delta % (green/red). Max 5 rows.
 */

import { formatDelta } from "@/lib/design-system";
import type { Mover } from "@/types";

interface MoverListProps {
  title: string;
  movers: Mover[];
  type: "fast" | "slow";
}

export function MoverList({ title, movers, type }: MoverListProps) {
  if (movers.length === 0) return null;

  return (
    <div className="px-4">
      <h3 className="text-heading text-ink-900 mb-2">{title}</h3>
      <ul
        className="bg-surface divide-y divide-border"
        style={{
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {movers.slice(0, 5).map((mover) => (
          <li
            key={mover.sku}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="text-body text-ink-900">{mover.name}</span>
            <span
              className="text-numeric text-body font-semibold"
              style={{
                color:
                  type === "fast"
                    ? "var(--color-brand-600)"
                    : "var(--color-danger-600)",
              }}
            >
              {formatDelta(mover.delta_7d)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
