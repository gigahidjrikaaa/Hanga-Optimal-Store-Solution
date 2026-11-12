/**
 * CaptureCard — Notebook photo upload trigger.
 *
 * Design: design_system.md §2 — CaptureCard
 * States: default → capturing → uploading (progress).
 */

"use client";

import { Icon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/context";

// Copy arrives verbatim from translations.ts (not editable here); emoji and
// glued arrows are stripped at render and the matching <Icon> is placed
// beside the label instead (design.md: icons are stroke SVGs, never emoji).
const COPY_NOISE = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{FE0F}\u{200D}]/gu;

function cleanCopy(s: string): string {
  return s.replace(COPY_NOISE, "").replace(/\s{2,}/g, " ").trim();
}

const PHOTO_TIPS_ID = [
  "Pastikan nama barang dan angka penjualan jelas",
  "Arahkan kamera tegak lurus dari atas kertas",
  "Pencahayaan terang dan hindari bayangan tangan",
];

const PHOTO_TIPS_EN = [
  "Ensure item names and sale numbers are clear",
  "Hold camera perpendicular directly above paper",
  "Bright lighting, avoid cast shadows",
];

interface CaptureCardProps {
  onCapture: (file: File) => void;
  isUploading?: boolean;
}

export function CaptureCard({ onCapture, isUploading = false }: CaptureCardProps) {
  const { t, language } = useLanguage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  return (
    <div
      className="bg-surface p-6 flex flex-col items-center gap-4 text-center"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Camera well — brand-100 circle, camera icon in brand-800 */}
      <div
        className={`w-16 h-16 flex items-center justify-center rounded-full bg-brand-100 ${
          isUploading ? "scanning" : ""
        }`}
      >
        <Icon name="camera" size={28} className="shrink-0 text-brand-800" />
      </div>

      <div>
        <h3 className="text-heading text-ink-900">{t.capture.cardTitle}</h3>
        <p className="text-body text-muted mt-1">
          {t.capture.cardSubtitle}
        </p>
      </div>

      {/* Photo tips — paper-3 well, lightbulb icon + text-body items */}
      <div className="bg-paper-3 p-3 rounded-lg text-left flex flex-col gap-1.5 w-full max-w-xs">
        <span className="text-caption text-ink-900 flex items-center gap-1.5">
          <Icon name="lightbulb" size={16} className="shrink-0 text-brand-800" />
          {language === "id" ? "Tips foto catatan penjualan:" : "Ledger capture tips:"}
        </span>
        <ul className="flex flex-col gap-1">
          {(language === "id" ? PHOTO_TIPS_ID : PHOTO_TIPS_EN).map((tip, idx) => (
            <li key={idx} className="text-body text-muted flex items-start gap-1.5">
              <Icon name="check" size={14} className="shrink-0 text-brand-800 mt-[3px]" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {isUploading ? (
        <div className="w-full flex flex-col gap-2">
          <div
            className="h-2 sweep-bar w-full rounded-full bg-brand-100"
            role="progressbar"
            aria-label="Mengunggah foto"
          />
          <p className="text-caption text-muted text-center">
            {cleanCopy(t.capture.uploading)}
          </p>
        </div>
      ) : (
        <label
          title={language === "id" ? "Buka kamera atau pilih foto buku catatan" : "Open camera or upload notebook photo"}
          className="touch-target pressable text-body font-semibold py-3 px-6 cursor-pointer"
          style={{
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--color-brand-600)",
            color: "var(--color-accent-ink)",
          }}
        >
          {t.capture.takePhotoBtn}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}
