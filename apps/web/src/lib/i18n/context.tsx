"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Language,
  SCENARIO_ENGLISH_OVERRIDES,
  TRANSLATIONS,
  Translations,
} from "./translations";
import type { DailyBriefing } from "@/types";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  localizeBriefing: (briefing: DailyBriefing | null) => DailyBriefing | null;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "hanga_preferred_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("id");
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from URL search param or localStorage
  useEffect(() => {
    setIsMounted(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get("lang");
      if (urlLang === "en" || urlLang === "id") {
        setLanguageState(urlLang);
        localStorage.setItem(STORAGE_KEY, urlLang);
        document.documentElement.lang = urlLang;
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "id") {
        setLanguageState(stored);
        document.documentElement.lang = stored;
      }
    } catch {
      // safe fallback in restricted environments
    }
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch {
      // ignore
    }
  }, []);

  const t = useMemo(() => TRANSLATIONS[language], [language]);

  // Localize a daily briefing when in English mode
  const localizeBriefing = useCallback(
    (briefing: DailyBriefing | null): DailyBriefing | null => {
      if (!briefing || language === "id") return briefing;

      const override = SCENARIO_ENGLISH_OVERRIDES[briefing.scenario];
      if (!override) return briefing;

      return {
        ...briefing,
        headline: override.headline || briefing.headline,
        budget: briefing.budget
          ? {
              ...briefing.budget,
              note_bahasa: override.budgetNote || briefing.budget.note_bahasa,
            }
          : briefing.budget,
        recommendations: briefing.recommendations.map((rec) => {
          const recRationale = override.rationales[rec.sku];
          const recHint = override.hints[rec.sku];
          return {
            ...rec,
            rationale_bahasa: recRationale || rec.rationale_bahasa,
            hint_bahasa: recHint || rec.hint_bahasa,
            factors: rec.factors.map((f) => ({
              ...f,
              note_bahasa: override.factorNotes[f.key] || f.note_bahasa,
            })),
          };
        }),
      };
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      localizeBriefing,
    }),
    [language, setLanguage, t, localizeBriefing]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
