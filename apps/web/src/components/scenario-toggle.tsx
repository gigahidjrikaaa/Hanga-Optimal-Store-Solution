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

export function ScenarioToggle({
  active,
  onSelect,
  disabled = false,
}: ScenarioToggleProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto py-2 px-4 scrollbar-none"
      role="tablist"
      aria-label="Skenario"
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
            className="text-caption whitespace-nowrap px-4 py-2 transition-colors touch-target"
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
              transitionDuration: "var(--duration-fast)",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {SCENARIO_LABELS[scenario]}
          </button>
        );
      })}
    </div>
  );
}
