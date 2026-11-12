/**
 * InteractiveTutorial — Guided spotlight tour for elder merchants (Bu Sari) & hackathon evaluators.
 *
 * Features:
 * - 5-step spotlight walkthrough highlighting key elements:
 *   1. Inventory Health Bar (Stockout risks & shelf working capital)
 *   2. Scenario Simulation (Lebaran, Payday, Rain Tomorrow, Normal)
 *   3. AI Recommendation Card (Action decision, confidence, causal drivers)
 *   4. WhatsApp Wholesale Order (1-tap restock message)
 *   5. Navigation Bar (Stok, Pesanan, Profil tabs)
 * - Optional audio narration (text-to-speech) in ID / EN with rate control.
 * - Elder-friendly typography (>= 15px body, high contrast, >= 48px touch targets).
 * - localStorage persistence with replay trigger from Profil or Header.
 */

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/context";

export const TOUR_STORAGE_KEY = "hanga_tour_completed";

// Copy arrives verbatim from translations.ts (not editable here); emoji and
// glued arrows are stripped at render and the matching <Icon> is placed
// beside the label instead (design.md: icons are stroke SVGs, never emoji).
const COPY_NOISE = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{FE0F}\u{200D}]/gu;

function cleanCopy(s: string): string {
  return s.replace(COPY_NOISE, "").replace(/\s{2,}/g, " ").trim();
}

// Sentence case for step labels (design.md: no uppercase/tracking on heads);
// keeps a leading "1. " ordinal if present.
function sentenceCase(s: string): string {
  const clean = cleanCopy(s);
  const m = clean.match(/^(\d+\.\s*)(.*)$/);
  if (m) {
    return m[1] + m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

// Solid scrim per design.md: no glass, no backdrop-blur; an overlay alpha
// is allowed for scrims.
const SCRIM = "color-mix(in srgb, var(--color-ink) 55%, transparent)";

interface InteractiveTutorialProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

interface StepConfig {
  targetId: string;
  titleKey: "healthBar" | "scenario" | "recommendation" | "whatsapp" | "navigation";
}

const TOUR_STEPS: StepConfig[] = [
  { targetId: "tour-health-bar", titleKey: "healthBar" },
  { targetId: "tour-scenario-toggle", titleKey: "scenario" },
  { targetId: "tour-recommendation-card", titleKey: "recommendation" },
  { targetId: "tour-order-wa", titleKey: "whatsapp" },
  { targetId: "tour-bottom-nav", titleKey: "navigation" },
];

export function InteractiveTutorial({
  forceOpen = false,
  onClose,
}: InteractiveTutorialProps) {
  const { t, language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-prompt on first visit if not yet completed
  useEffect(() => {
    if (forceOpen) {
      setIsActive(true);
      setShowPrompt(false);
      setCurrentStep(0);
      return;
    }

    if (typeof window !== "undefined") {
      const completed = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!completed) {
        // Small delay so page renders nicely before offering tour
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [forceOpen]);

  // Listen for custom event from Profile or other buttons
  useEffect(() => {
    const handleStartTour = () => {
      setIsActive(true);
      setShowPrompt(false);
      setCurrentStep(0);
    };

    window.addEventListener("start-hanga-tour", handleStartTour);
    return () => window.removeEventListener("start-hanga-tour", handleStartTour);
  }, []);

  // Stop speech when tutorial closes
  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Update target bounding box and smooth-scroll to element
  const updateSpotlight = useCallback(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    const el = document.getElementById(step.targetId);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      }, 350);
    } else {
      setTargetRect(null);
    }
  }, [isActive, currentStep]);

  useEffect(() => {
    if (isActive) {
      updateSpotlight();
      stopSpeech();
    }
  }, [isActive, currentStep, updateSpotlight, stopSpeech]);

  // Recalculate on window resize or scroll
  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => {
      const step = TOUR_STEPS[currentStep];
      if (!step) return;
      const el = document.getElementById(step.targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
    };
  }, [isActive, currentStep]);

  // Text to speech narration
  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    const step = TOUR_STEPS[currentStep];
    const stepContent = t.tutorial.steps[step.titleKey];
    const textToSpeak = `${stepContent.title}. ${stepContent.desc}`;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === "id" ? "id-ID" : "en-US";
    utterance.rate = 0.92; // Slightly measured rate for clarity
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechRef.current = utterance;

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleNext = () => {
    stopSpeech();
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    stopSpeech();
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    stopSpeech();
    setIsActive(false);
    setShowPrompt(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    onClose?.();
  };

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    onClose?.();
  };

  const handleStartFromPrompt = () => {
    setShowPrompt(false);
    setIsActive(true);
    setCurrentStep(0);
  };

  if (!mounted) return null;

  // Welcome prompt invitation modal
  if (showPrompt && !isActive) {
    return createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ backgroundColor: SCRIM }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-prompt-title"
      >
        <div
          className="bg-surface w-full max-w-[420px] rounded-xl border border-border p-6 flex flex-col gap-4 text-center"
          style={{
            boxShadow: "var(--shadow-card)",
            animation: "page-enter 260ms var(--ease-out) both",
          }}
        >
          <div className="w-16 h-16 rounded-full bg-brand-100 mx-auto flex items-center justify-center">
            <Icon name="lightbulb" size={28} className="shrink-0 text-brand-800" />
          </div>

          <div>
            <h2
              id="tour-prompt-title"
              className="text-title text-ink-900"
            >
              {cleanCopy(t.tutorial.welcomeTitle)}
            </h2>
            <p className="text-body text-muted mt-2 leading-relaxed">
              {t.tutorial.welcomeDesc}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleStartFromPrompt}
              className="touch-target pressable w-full py-3.5 px-4 rounded-xl bg-brand-600 text-body font-semibold"
              style={{ color: "var(--color-accent-ink)" }}
            >
              {cleanCopy(t.tutorial.startBtn)}
            </button>

            <button
              type="button"
              onClick={handleDismissPrompt}
              className="touch-target pressable w-full py-3 px-4 rounded-xl text-brand-800 font-semibold text-body transition-colors hover:bg-paper-3"
            >
              {t.tutorial.laterBtn}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (!isActive) return null;

  const currentStepData = TOUR_STEPS[currentStep];
  const stepContent = t.tutorial.steps[currentStepData.titleKey];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // If target element is in lower half of screen, place dialog card at top so it never covers target
  const isTargetInBottomHalf = targetRect
    ? targetRect.top > (typeof window !== "undefined" ? window.innerHeight * 0.52 : 400)
    : false;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Tour"
    >
      {/* Solid scrim — no glass, no backdrop-blur */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: SCRIM }}
        onClick={handleComplete}
      />

      {/* Spotlight cutout / halo — targeting logic unchanged, painted with tokens */}
      {targetRect && (
        <div
          className="absolute pointer-events-none z-[105]"
          style={{
            top: Math.max(0, targetRect.top - 8),
            left: Math.max(0, targetRect.left - 8),
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: "16px",
            boxShadow: `0 0 0 9999px ${SCRIM}`,
            border: "3px solid var(--color-brand-600)",
            outline: "2px solid color-mix(in srgb, var(--color-accent-ink) 80%, transparent)",
          }}
        >
          {/* Step beacon */}
          <span
            className="absolute -top-3 -right-3 inline-flex rounded-full h-7 w-7 bg-brand-600 items-center justify-center border-2"
            style={{
              borderColor: "var(--color-accent-ink)",
              color: "var(--color-accent-ink)",
            }}
          >
            <span className="text-caption">{currentStep + 1}</span>
          </span>
        </div>
      )}

      {/* Floating Tour Guide Dialog Card */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[460px] z-[110] ${
          isTargetInBottomHalf ? "top-5" : "bottom-20"
        }`}
      >
        <div
          className="bg-surface rounded-xl border border-border p-5 flex flex-col gap-3.5"
          style={{
            boxShadow: "var(--shadow-card)",
            animation: "page-enter 260ms var(--ease-out) both",
          }}
        >
          {/* Header with counter, progress track and audio button */}
          <div className="flex items-center justify-between gap-3 border-b border-border pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-1 rounded-full bg-brand-100 text-brand-800 text-caption whitespace-nowrap">
                {cleanCopy(t.tutorial.stepCounter)
                  .replace("{current}", String(currentStep + 1))
                  .replace("{total}", String(TOUR_STEPS.length))}
              </span>

              {/* Slim progress track */}
              <div className="h-1.5 rounded-full bg-paper-3 overflow-hidden flex-1 min-w-[48px]">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{
                    width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Voice narration button */}
              <button
                type="button"
                onClick={handleToggleSpeech}
                title={isSpeaking ? t.tutorial.stopListenBtn : t.tutorial.listenBtn}
                className={`touch-target pressable px-2.5 py-1 rounded-lg text-caption flex items-center gap-1.5 ${
                  isSpeaking
                    ? "bg-brand-100 text-brand-800"
                    : "bg-canvas text-ink-2 border border-border"
                }`}
              >
                <Icon
                  name={isSpeaking ? "x" : "mic"}
                  size={14}
                  className="shrink-0"
                />
                <span>
                  {cleanCopy(isSpeaking ? t.tutorial.stopListenBtn : t.tutorial.listenBtn)}
                </span>
              </button>

              {/* Skip button */}
              <button
                type="button"
                onClick={handleComplete}
                title={t.tutorial.skipBtn}
                className="touch-target pressable text-brand-800 text-caption px-2 py-1"
              >
                {t.tutorial.skipBtn}
              </button>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-heading text-ink-900">
              {sentenceCase(stepContent.title)}
            </h3>
            <p className="text-[15px] text-muted mt-1.5 leading-relaxed">
              {stepContent.desc}
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`touch-target pressable px-4 py-2.5 rounded-xl border border-border text-body font-semibold transition-colors ${
                currentStep === 0
                  ? "opacity-0 pointer-events-none"
                  : "bg-surface text-ink-2 hover:bg-paper-3"
              }`}
            >
              {cleanCopy(t.tutorial.prevBtn)}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="touch-target pressable flex-1 py-3 px-5 rounded-xl bg-brand-600 text-body font-semibold flex items-center justify-center gap-1.5"
              style={{ color: "var(--color-accent-ink)" }}
            >
              <span>{cleanCopy(isLastStep ? t.tutorial.finishBtn : t.tutorial.nextBtn)}</span>
              {!isLastStep && (
                <Icon name="arrow-right" size={16} className="shrink-0" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
