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
import { LanguageSwitcher } from "@/components/language-switcher";
import { DEMO_SHOP_ID } from "@/lib/constants";
import { useLanguage } from "@/lib/i18n/context";

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
            <p className="text-body text-ink-600 mt-1">
              {t.capture.subtitle}
            </p>
          </div>
          <LanguageSwitcher variant="compact" />
        </div>

        <CaptureCard onCapture={handleCapture} isUploading={isUploading} />

        {/* Tips */}
        <div
          className="bg-surface p-4 flex flex-col gap-3"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <h3 className="text-heading text-ink-900">{t.capture.tipsTitle}</h3>
          <ul className="text-body text-ink-600 list-disc pl-5 flex flex-col gap-1">
            {t.capture.tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
