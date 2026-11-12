/**
 * ConfirmSheet — Screen 3 in design_system.md §3.
 *
 * Extraction review: editable table (name, qty, unit);
 * rows with low model confidence highlighted warn/100;
 * primary CTA "Konfirmasi" sticky bottom.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { DEMO_SHOP_ID } from "@/lib/constants";
import { useLanguage } from "@/lib/i18n/context";
import type { ExtractedLine } from "@/types";

// Copy arrives verbatim from translations.ts (not editable here); emoji and
// glued arrows are stripped at render and the matching <Icon> is placed
// beside the label instead (design.md: icons are stroke SVGs, never emoji).
const COPY_NOISE = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{FE0F}\u{200D}]/gu;

function cleanCopy(s: string): string {
  return s.replace(COPY_NOISE, "").replace(/\s{2,}/g, " ").trim();
}

// Sentence case for table column heads (design.md tables) and tutorial-style
// step labels; keeps a leading "1. " ordinal if present.
function sentenceCase(s: string): string {
  const clean = cleanCopy(s);
  const m = clean.match(/^(\d+\.\s*)(.*)$/);
  if (m) {
    return m[1] + m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

// Fallback extracted lines for demonstration
const PLACEHOLDER_LINES: ExtractedLine[] = [
  { name: "Gula pasir", qty: 5, unit: "kg", matched_sku: "GULA-1KG", model_confidence: 0.95 },
  { name: "Minyak goreng", qty: 3, unit: "liter", matched_sku: "MINYAK-1L", model_confidence: 0.88 },
  { name: "Telur", qty: 2, unit: "tray", matched_sku: "TELUR-TRAY", model_confidence: 0.72 },
  { name: "Susu uht", qty: 4, unit: "kotak", matched_sku: null, model_confidence: 0.45 },
];

export default function ConfirmSheetPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [lines, setLines] = useState<ExtractedLine[]>(PLACEHOLDER_LINES);
  const [extractionId, setExtractionId] = useState<string>("demo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("current_extraction");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.lines && Array.isArray(parsed.lines)) {
          setLines(parsed.lines);
        }
        if (parsed.id) {
          setExtractionId(parsed.id);
        }
      }
    } catch {
      // Keep default placeholder lines
    }
  }, []);

  const handleLineChange = (
    index: number,
    field: keyof ExtractedLine,
    value: string | number
  ) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
      await fetch(
        `${apiUrl}/extractions/shops/${DEMO_SHOP_ID}/extractions/${extractionId}/confirm`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lines }),
        }
      );
      sessionStorage.removeItem("current_extraction");
      router.push("/");
    } catch {
      router.push("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-4 py-4">
        {/* Header */}
        <div className="px-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-title text-ink-900">{t.capture.confirmTitle}</h1>
            <p className="text-body text-muted mt-1">
              {t.capture.confirmSubtitle}
            </p>
          </div>
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Editable table — hairline row rules on bg-surface, no card chrome */}
        <div className="px-4 flex flex-col gap-3">
          <div className="bg-surface flex flex-col">
            {/* Column heads — sentence case, never wrap */}
            <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-3 border-b border-border">
              <span className="text-caption text-muted whitespace-nowrap">
                {sentenceCase(t.capture.colName)}
              </span>
              <span className="text-caption text-muted whitespace-nowrap text-right">
                {sentenceCase(t.capture.colQty)}
              </span>
              <span className="text-caption text-muted whitespace-nowrap text-right">
                {sentenceCase(t.capture.colUnit)}
              </span>
            </div>

            {/* Rows */}
            {lines.map((line, index) => {
              const isLowConfidence = line.model_confidence < 0.7;
              return (
                <div
                  key={index}
                  className={`grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-2.5 border-b border-border last:border-b-0 items-center ${
                    isLowConfidence ? "bg-warn-bg" : ""
                  }`}
                >
                  <input
                    type="text"
                    value={line.name}
                    onChange={(e) =>
                      handleLineChange(index, "name", e.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-muted bg-transparent px-2.5 text-body text-ink-900"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={line.qty}
                    onChange={(e) =>
                      handleLineChange(index, "qty", parseFloat(e.target.value) || 0)
                    }
                    className="h-10 w-full rounded-lg border border-muted bg-transparent px-2.5 text-body text-numeric text-right text-ink-900"
                  />
                  <input
                    type="text"
                    value={line.unit}
                    onChange={(e) =>
                      handleLineChange(index, "unit", e.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-muted bg-transparent px-2.5 text-body text-right text-ink-2"
                  />
                </div>
              );
            })}
          </div>

          {/* Low confidence hint */}
          <p className="self-start inline-flex items-start gap-2 rounded-lg bg-warn-bg text-warn px-3 py-2 text-body">
            <Icon name="alert-circle" size={18} className="shrink-0" />
            <span>{cleanCopy(t.capture.yellowWarning)}</span>
          </p>
        </div>

        {/* Sticky confirm button — the screen's one filled primary */}
        <div className="px-4 pb-4 mt-4">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="touch-target pressable w-full flex items-center justify-center gap-2 text-body font-semibold py-4 transition-colors disabled:opacity-50"
            style={{
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--color-brand-600)",
              color: "var(--color-accent-ink)",
            }}
          >
            <Icon name="check" size={18} className="shrink-0" />
            <span>
              {isSubmitting ? t.capture.savingBtn : cleanCopy(t.capture.confirmBtn)}
            </span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
