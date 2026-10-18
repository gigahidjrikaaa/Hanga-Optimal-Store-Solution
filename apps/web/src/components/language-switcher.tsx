"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/context";

interface LanguageSwitcherProps {
  variant?: "compact" | "full";
  className?: string;
}

export function LanguageSwitcher({
  variant = "compact",
  className = "",
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();

  if (variant === "full") {
    return (
      <div className={`flex flex-col gap-2.5 ${className}`}>
        {/* Indonesian Option */}
        <button
          type="button"
          onClick={() => setLanguage("id")}
          className={`min-h-[52px] p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
            language === "id"
              ? "bg-brand-50 border-2 border-brand-600 shadow-xs"
              : "bg-surface border-neutral-300 hover:bg-neutral-50 text-ink-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇮🇩</span>
            <div>
              <span className="text-sm font-bold text-ink-900 block">
                Bahasa Indonesia
              </span>
              <span className="text-xs text-ink-600 block">
                Implementasi nyata warung Bu Sari (mental model kelontong)
              </span>
            </div>
          </div>
          {language === "id" && (
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              ✓
            </span>
          )}
        </button>

        {/* English Option */}
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`min-h-[52px] p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
            language === "en"
              ? "bg-brand-50 border-2 border-brand-600 shadow-xs"
              : "bg-surface border-neutral-300 hover:bg-neutral-50 text-ink-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇬🇧</span>
            <div>
              <span className="text-sm font-bold text-ink-900 block">
                English
              </span>
              <span className="text-xs text-ink-600 block">
                For international hackathon presentation & judges evaluation
              </span>
            </div>
          </div>
          {language === "en" && (
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              ✓
            </span>
          )}
        </button>
      </div>
    );
  }

  // Compact Header Toggle Pill
  return (
    <div
      role="group"
      aria-label="Language Switcher"
      className={`inline-flex items-center p-1 bg-neutral-200/80 rounded-xl gap-0.5 border border-neutral-300/80 shrink-0 ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage("id")}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 min-h-[32px] ${
          language === "id"
            ? "bg-white text-ink-900 shadow-sm"
            : "text-ink-600 hover:text-ink-900"
        }`}
        title="Ganti ke Bahasa Indonesia"
      >
        <span>🇮🇩</span>
        <span>ID</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 min-h-[32px] ${
          language === "en"
            ? "bg-white text-ink-900 shadow-sm"
            : "text-ink-600 hover:text-ink-900"
        }`}
        title="Switch to English"
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
