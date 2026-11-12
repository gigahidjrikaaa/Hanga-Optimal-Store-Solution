/**
 * ScenarioToggle — Horizontal segmented chips.
 *
 * Design: design_system.md §2 — ScenarioToggle
 * Active chip: brand fill, white text (selection is the accent's job,
 * design.md §Controls). Labels are sentence case, untracked (design.md §Type);
 * the hint line carries the lightbulb icon beside the label.
 * Chips wrap instead of scrolling sideways so nothing clips on desktop.
 * Data source: Firestore `briefings/{date}_{scenario}` snapshot per chip.
 */

"use client";

import { Icon } from "@/components/icons";
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
        <span className="text-caption text-muted">
          {t.briefing.situationTitle}
        </span>
      </div>
      <div
        className="flex flex-wrap gap-2 py-1"
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
              className="text-sm font-semibold whitespace-nowrap px-4 py-2 touch-target pressable"
              style={{
                borderRadius: "var(--radius-chip)",
                backgroundColor: isActive
                  ? "var(--color-brand-600)"
                  : "var(--color-surface)",
                color: isActive
                  ? "var(--color-accent-ink)"
                  : "var(--color-ink-900)",
                border: isActive
                  ? "none"
                  : "1px solid var(--color-border)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {scenarioConfig.label}
            </button>
          );
        })}
      </div>
      <p className="text-caption text-muted flex items-start gap-1.5 px-1">
        <Icon name="lightbulb" size={14} className="shrink-0" />
        <span>{t.scenarios[active]?.hint ?? ""}</span>
      </p>
    </div>
  );
}
