/**
 * Capture — Screen 2 in design_system.md §3.
 *
 * Notebook photo upload → Firebase Storage.
 * PRD §5: Notebook photo → SKU extraction (Gemini Flash) — Wow moment #1.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CaptureCard } from "@/components/capture-card";
import { Icon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { DEMO_SHOP_ID } from "@/lib/constants";
import { useLanguage } from "@/lib/i18n/context";

// Copy arrives verbatim from translations.ts (not editable here); emoji and
// glued arrows are stripped at render and the matching <Icon> is placed
// beside the label instead (design.md: icons are stroke SVGs, never emoji).
const COPY_NOISE = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{FE0F}\u{200D}]/gu;

function cleanCopy(s: string): string {
  return s.replace(COPY_NOISE, "").replace(/\s{2,}/g, " ").trim();
}

export default function CapturePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);

  const handleCapture = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
      const response = await fetch(
        `${apiUrl}/extractions/shops/${DEMO_SHOP_ID}/extractions`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const extraction = await response.json();
        sessionStorage.setItem("current_extraction", JSON.stringify(extraction));
      }
    } catch (err) {
      console.warn("Using offline demo extraction pipeline:", err);
    } finally {
      setIsUploading(false);
      router.push("/capture/confirm");
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6 py-6 px-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-title text-ink-900">{t.capture.title}</h1>
            <p className="text-body text-muted mt-1">
              {t.capture.subtitle}
            </p>
          </div>
          <LanguageSwitcher variant="compact" />
        </div>

        <CaptureCard onCapture={handleCapture} isUploading={isUploading} />

        {/* Tips — a paper-3 well directly on the page; the capture card is the only card */}
        <div
          className="bg-paper-3 p-4 flex flex-col gap-3"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <h3 className="text-heading text-ink-900 flex items-center gap-2">
            <Icon name="lightbulb" size={18} className="shrink-0 text-brand-800" />
            <span>{cleanCopy(t.capture.tipsTitle)}</span>
          </h3>
          <ul className="flex flex-col gap-1.5">
            {t.capture.tips.map((tip, idx) => (
              <li key={idx} className="text-body text-muted flex items-start gap-2">
                <Icon name="check" size={16} className="shrink-0 text-brand-800 mt-[3px]" />
                <span>{cleanCopy(tip)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
