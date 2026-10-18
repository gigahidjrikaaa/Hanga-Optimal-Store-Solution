/**
 * ScenarioToggle — Horizontal segmented chips.
 *
 * Design: design_system.md §2 — ScenarioToggle
 * Active chip: info/600 fill, white text.
 * Data source: Firestore `briefings/{date}_{scenario}` snapshot per chip.
 */

"use client";

import { useLanguage } from "@/lib/i18n/context";
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
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-1.5 px-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-600 tracking-wide uppercase">
          {t.briefing.situationTitle}
        </span>
      </div>
      <div
        className="flex gap-2 overflow-x-auto py-1 scrollbar-none"
        role="tablist"
        aria-label={t.briefing.situationTitle}
      >
        {SCENARIOS.map((scenario) => {
          const isActive = scenario === active;
          const scenarioConfig = t.scenarios[scenario] ?? {
            label: scenario,
            hint: "",
          };

          return (
            <button
              key={scenario}
              role="tab"
              aria-selected={isActive}
              disabled={disabled}
              onClick={() => onSelect(scenario)}
              title={scenarioConfig.hint}
              className="text-sm font-semibold whitespace-nowrap px-4 py-2.5 min-h-[44px] shrink-0 touch-target pressable"
              style={{
                borderRadius: "var(--radius-chip)",
                backgroundColor: isActive
                  ? "var(--color-info-600)"
                  : "var(--color-surface)",
                color: isActive
                  ? "white"
                  : "var(--color-ink-900)",
                border: isActive
                  ? "none"
                  : "1px solid var(--color-border)",
                transitionDuration: "var(--duration-normal)",
                transitionTimingFunction: "var(--ease-spring)",
                transform: isActive ? "scale(1.03)" : "scale(1)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {scenarioConfig.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-ink-700 font-medium flex items-center gap-1.5 px-1">
        <span>💡</span>
        <span>{t.scenarios[active]?.hint ?? ""}</span>
      </p>
    </div>
  );
}
