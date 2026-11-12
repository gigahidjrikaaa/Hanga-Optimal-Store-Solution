/**
 * MoverList — Fast/slow movers with 7-day sparklines and delta indicators.
 *
 * Design: design_system.md §2 — MoverList ("product name + 7-day sparkline +
 * delta %"). The sparkline is generated deterministically from the delta
 * (direction + magnitude) with a stable per-SKU wiggle, and renders as a
 * plain static polyline (design.md §Motion: no draw animation, stroke
 * currentColor, 1.5, non-scaling stroke).
 */

import { Icon } from "@/components/icons";
import { formatDelta } from "@/lib/design-system";
import type { Mover } from "@/types";

interface MoverListProps {
  title: string;
  movers: Mover[];
  type: "fast" | "slow";
}

/**
 * Buang emoji dari judul terjemahan pada batas render (design.md §2: ikon
 * digambar oleh icons.tsx, bukan emoji; ikon tren disisipkan di samping label).
 */
function cleanCopy(value: string): string {
  return value
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, "")
    .trim();
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

  const pointsAttr = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <svg
      width={SPARK_W}
      height={SPARK_H}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      aria-hidden="true"
      className="shrink-0"
      style={{ color: rising ? "var(--color-brand-600)" : "var(--color-danger-600)" }}
    >
      <polyline
        points={pointsAttr}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function MoverList({ title, movers, type }: MoverListProps) {
  if (movers.length === 0) return null;

  return (
    <div className="px-4">
      <h3 className="text-title text-ink-900 mb-2 flex items-center gap-2">
        <Icon name={type === "fast" ? "trend-up" : "trend-down"} size={20} className="shrink-0 text-brand-800" />
        <span className="min-w-0">{cleanCopy(title)}</span>
      </h3>
      <ul
        className="bg-surface border border-border divide-y divide-border rounded-xl overflow-hidden"
      >
        {movers.slice(0, 5).map((mover) => (
          <li
            key={mover.sku}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <span className="text-body text-ink-900 truncate min-w-0">{mover.name}</span>
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
