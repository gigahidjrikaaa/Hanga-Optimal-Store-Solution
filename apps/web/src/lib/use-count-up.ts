/**
 * useCountUp — animated numeric transitions (design_system.md §1, Numeric).
 *
 * Eases a number toward its target with a cubic ease-out, so IDR amounts and
 * percentages "settle" instead of jumping. Respects prefers-reduced-motion by
 * snapping straight to the target.
 */

"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, durationMs = 500): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = fromRef.current;

    if (reduce || from === target) {
      fromRef.current = target;
      setValue(target);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, durationMs]);

  return value;
}
