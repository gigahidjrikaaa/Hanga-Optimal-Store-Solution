/**
 * MoverList — Fast/slow movers with 7-day sparklines and delta indicators.
 *
 * Design: design_system.md §2 — MoverList ("product name + 7-day sparkline +
 * delta %"). The sparkline is generated deterministically from the delta
 * (direction + magnitude) with a stable per-SKU wiggle, and draws itself in
 * via the .sparkline-path stroke animation (globals.css §9). Rows stagger in.
 */

import { formatDelta } from "@/lib/design-system";
import type { Mover } from "@/types";

interface MoverListProps {
  title: string;
  movers: Mover[];
  type: "fast" | "slow";
}

const SPARK_W = 64;
const SPARK_H = 20;
const SPARK_POINTS = 8;

function Sparkline({ delta, seed }: { delta: number; seed: string }) {
  const rising = delta >= 0;
  // Magnitude 0..1 — bigger deltas draw steeper lines.
  const mag = Math.min(1, Math.abs(delta) * 2.5);
  const dir = rising ? -1 : 1; // SVG y grows downward

  const points = Array.from({ length: SPARK_POINTS }, (_, i) => {
    const t = i / (SPARK_POINTS - 1);
    // Stable per-SKU wiggle so identical deltas still look organic.
    const wiggle = Math.sin(i * 2.7 + seed.length * 1.3 + seed.charCodeAt(0)) * 1.4;
    const y =
      SPARK_H / 2 +
      dir * (t - 0.5) * 2 * (SPARK_H / 2 - 3) * (0.4 + 0.6 * mag) +
      wiggle;
    const x = (i * SPARK_W) / (SPARK_POINTS - 1);
    return [
      x,
      Math.max(2, Math.min(SPARK_H - 2, y)),
    ] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  return (
    <svg
      width={SPARK_W}
      height={SPARK_H}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d={path}
        fill="none"
        stroke={rising ? "var(--color-brand-600)" : "var(--color-danger-600)"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sparkline-path"
        style={{ animationDelay: `${120}ms` }}
      />
    </svg>
  );
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
        {movers.slice(0, 5).map((mover, index) => (
          <li
            key={mover.sku}
            className="flex items-center justify-between gap-3 px-4 py-3 rise-in"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <span className="text-body text-ink-900 truncate">{mover.name}</span>
            <span className="flex items-center gap-3 shrink-0">
              <Sparkline delta={mover.delta_7d} seed={mover.sku} />
              <span
                className="text-numeric text-body font-semibold w-12 text-right"
                style={{
                  color:
                    type === "fast"
                      ? "var(--color-brand-600)"
                      : "var(--color-danger-600)",
                }}
              >
                {formatDelta(mover.delta_7d)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
