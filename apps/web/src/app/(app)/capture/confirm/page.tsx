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
import { DEMO_SHOP_ID } from "@/lib/constants";
import type { ExtractedLine } from "@/types";

// Fallback extracted lines for demonstration
const PLACEHOLDER_LINES: ExtractedLine[] = [
  { name: "Gula pasir", qty: 5, unit: "kg", matched_sku: "GULA-1KG", model_confidence: 0.95 },
  { name: "Minyak goreng", qty: 3, unit: "liter", matched_sku: "MINYAK-1L", model_confidence: 0.88 },
  { name: "Telur", qty: 2, unit: "tray", matched_sku: "TELUR-TRAY", model_confidence: 0.72 },
  { name: "Susu uht", qty: 4, unit: "kotak", matched_sku: null, model_confidence: 0.45 },
];

export default function ConfirmSheetPage() {
  const router = useRouter();
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
        <div className="px-4">
          <h1 className="text-title text-ink-900">Konfirmasi Catatan</h1>
          <p className="text-body text-ink-600 mt-1">
            Periksa dan perbaiki hasil baca AI. Baris kuning perlu dicek ulang.
          </p>
        </div>

        {/* Editable table */}
        <div className="px-4">
          <div
            className="bg-surface overflow-hidden"
            style={{
              borderRadius: "var(--radius-card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-4 py-3 border-b border-border">
              <span className="text-caption text-ink-600 font-semibold">Nama</span>
              <span className="text-caption text-ink-600 font-semibold text-right">Jumlah</span>
              <span className="text-caption text-ink-600 font-semibold text-right">Satuan</span>
            </div>

            {/* Rows */}
            {lines.map((line, index) => {
              const isLowConfidence = line.model_confidence < 0.7;
              return (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_80px_80px] gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center"
                  style={{
                    backgroundColor: isLowConfidence
                      ? "var(--color-warn-100)"
                      : undefined,
                  }}
                >
                  <input
                    type="text"
                    value={line.name}
                    onChange={(e) =>
                      handleLineChange(index, "name", e.target.value)
                    }
                    className="text-body bg-transparent text-ink-900 border-none focus:outline-none w-full"
                  />
                  <input
                    type="number"
                    value={line.qty}
                    onChange={(e) =>
                      handleLineChange(index, "qty", parseFloat(e.target.value) || 0)
                    }
                    className="text-body text-numeric bg-transparent text-ink-900 border-none focus:outline-none text-right w-full"
                  />
                  <input
                    type="text"
                    value={line.unit}
                    onChange={(e) =>
                      handleLineChange(index, "unit", e.target.value)
                    }
                    className="text-body bg-transparent text-ink-600 border-none focus:outline-none text-right w-full"
                  />
                </div>
              );
            })}
          </div>

          {/* Low confidence hint */}
          <p className="text-caption text-warn-600 mt-2">
            ⚠️ Baris kuning: kepercayaan AI rendah, mohon dicek ulang.
          </p>
        </div>

        {/* Sticky confirm button */}
        <div className="px-4 pb-4 mt-4">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="touch-target w-full text-body font-semibold py-4 text-surface transition-colors disabled:opacity-50"
            style={{
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--color-brand-600)",
              transitionDuration: "var(--duration-fast)",
            }}
          >
            {isSubmitting ? "Menyimpan..." : "✅ Konfirmasi"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
