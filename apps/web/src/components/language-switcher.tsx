"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/context";
import { Icon } from "@/components/icons";

interface LanguageSwitcherProps {
  variant?: "compact" | "full";
  className?: string;
}

export function LanguageSwitcher({
  variant = "compact",
  className = "",
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  if (variant === "full") {
    return (
      <div className={`flex flex-col gap-2.5 ${className}`}>
        {/* Indonesian Option */}
        <button
          type="button"
          onClick={() => setLanguage("id")}
          aria-pressed={language === "id"}
          className={`min-h-[52px] p-3.5 rounded-xl border text-left flex items-center justify-between pressable ${
            language === "id"
              ? "bg-brand-100 border-brand-600"
              : "bg-surface border-border text-ink-2"
          }`}
          style={{ borderWidth: language === "id" ? 2 : 1 }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              aria-hidden="true"
              className="w-9 h-9 shrink-0 rounded-full bg-paper-3 text-ink-2 flex items-center justify-center text-xs font-semibold"
            >
              ID
            </span>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-ink-900 block">
                Bahasa Indonesia
              </span>
              <span className="text-xs text-muted block">
                Implementasi nyata warung Bu Sari (mental model kelontong)
              </span>
            </div>
          </div>
          {language === "id" && (
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
              <Icon name="check" size={14} />
            </span>
          )}
        </button>

        {/* English Option */}
        <button
          type="button"
          onClick={() => setLanguage("en")}
          aria-pressed={language === "en"}
          className={`min-h-[52px] p-3.5 rounded-xl border text-left flex items-center justify-between pressable ${
            language === "en"
              ? "bg-brand-100 border-brand-600"
              : "bg-surface border-border text-ink-2"
          }`}
          style={{ borderWidth: language === "en" ? 2 : 1 }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              aria-hidden="true"
              className="w-9 h-9 shrink-0 rounded-full bg-paper-3 text-ink-2 flex items-center justify-center text-xs font-semibold"
            >
              EN
            </span>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-ink-900 block">
                English
              </span>
              <span className="text-xs text-muted block">
                For international hackathon presentation &amp; judges evaluation
              </span>
            </div>
          </div>
          {language === "en" && (
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
              <Icon name="check" size={14} />
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
      className={`inline-flex items-center p-1 bg-paper-3 rounded-xl gap-0.5 border border-border shrink-0 ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage("id")}
        aria-pressed={language === "id"}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold pressable flex items-center gap-1 min-h-[32px] ${
          language === "id"
            ? "bg-surface text-ink-900"
            : "text-muted hover:text-ink-900"
        }`}
        style={{ boxShadow: language === "id" ? "var(--shadow-card)" : "none" }}
        title="Ganti ke Bahasa Indonesia"
      >
        <span>ID</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold pressable flex items-center gap-1 min-h-[32px] ${
          language === "en"
            ? "bg-surface text-ink-900"
            : "text-muted hover:text-ink-900"
        }`}
        style={{ boxShadow: language === "en" ? "var(--shadow-card)" : "none" }}
        title="Switch to English"
      >
        <span>EN</span>
      </button>
    </div>
  );
}
