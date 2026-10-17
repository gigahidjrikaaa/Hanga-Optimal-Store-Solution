/**
 * ScenarioToggle — Horizontal segmented chips.
 *
 * Design: design_system.md §2 — ScenarioToggle
 * Active chip: info/600 fill, white text.
 * Data source: Firestore `briefings/{date}_{scenario}` snapshot per chip.
 */

"use client";

import { SCENARIO_LABELS } from "@/lib/design-system";
import type { Scenario } from "@/types";

interface ScenarioToggleProps {
  active: Scenario;
  onSelect: (scenario: Scenario) => void;
  disabled?: boolean;
}

const SCENARIOS: Scenario[] = [
  "BASELINE",
  "LEBARAN_T14",
  "PAYDAY_T3",
  "RAIN_TOMORROW",
];

const SCENARIO_HINTS: Record<Scenario, string> = {
  BASELINE: "Hari biasa: Keseimbangan stok normal, amankan bahan pokok yang menipis.",
  LEBARAN_T14: "Simulasi H-14 Lebaran: Lonjakan pembelian sirup, biskuit kaleng, dan bahan kue parcel.",
  PAYDAY_T3: "Simulasi Musim Gajian: Daya beli warga meningkat, prioritas tambah beras, minyak, dan susu.",
  RAIN_TOMORROW: "Simulasi Hujan Besok: Pengunjung berkurang, kurangi stok basah & perbanyak mie/kopi seduh.",
};

export function ScenarioToggle({
  active,
  onSelect,
  disabled = false,
}: ScenarioToggleProps) {
  return (
    <div className="flex flex-col gap-1.5 px-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-neutral-500 tracking-wide uppercase">
          Situasi Warung Hari Ini:
        </span>
      </div>
      <div
        className="flex gap-2 overflow-x-auto py-1 scrollbar-none"
        role="tablist"
        aria-label="Situasi Warung"
      >
        {SCENARIOS.map((scenario) => {
          const isActive = scenario === active;
          return (
            <button
              key={scenario}
              role="tab"
              aria-selected={isActive}
              disabled={disabled}
              onClick={() => onSelect(scenario)}
              title={SCENARIO_HINTS[scenario]}
              className="text-caption whitespace-nowrap px-4 py-2 touch-target pressable"
              style={{
                borderRadius: "var(--radius-chip)",
                backgroundColor: isActive
                  ? "var(--color-info-600)"
                  : "var(--color-surface)",
                color: isActive
                  ? "white"
                  : "var(--color-ink-600)",
                border: isActive
                  ? "none"
                  : "1px solid var(--color-border)",
                transitionDuration: "var(--duration-normal)",
                transitionTimingFunction: "var(--ease-spring)",
                transform: isActive ? "scale(1.04)" : "scale(1)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {SCENARIO_LABELS[scenario]}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-ink-600 flex items-center gap-1.5 px-1">
        <span>💡</span>
        <span>{SCENARIO_HINTS[active]}</span>
      </p>
    </div>
  );
}
