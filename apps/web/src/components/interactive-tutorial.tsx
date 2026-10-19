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
import { useLanguage } from "@/lib/i18n/context";

export const TOUR_STORAGE_KEY = "hanga_tour_completed";

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
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-prompt-title"
      >
        <div
          className="bg-surface w-full max-w-[420px] rounded-2xl p-6 shadow-2xl border border-brand-500/20 flex flex-col gap-4 text-center rise-in"
          style={{ borderRadius: "var(--radius-sheet)" }}
        >
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-800 mx-auto flex items-center justify-center text-3xl shadow-sm border border-brand-600/30">
            💡
          </div>

          <div>
            <h2
              id="tour-prompt-title"
              className="text-title text-ink-900 font-bold"
            >
              {t.tutorial.welcomeTitle}
            </h2>
            <p className="text-body text-ink-600 mt-2 leading-relaxed">
              {t.tutorial.welcomeDesc}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleStartFromPrompt}
              className="touch-target w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-body shadow-md transition-all active:scale-98"
            >
              {t.tutorial.startBtn}
            </button>

            <button
              type="button"
              onClick={handleDismissPrompt}
              className="touch-target w-full py-3 px-4 rounded-xl text-ink-600 hover:bg-neutral-100 font-semibold text-caption transition-colors"
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
      {/* Dark overlay backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={handleComplete}
      />

      {/* Spotlight cutout / halo */}
      {targetRect && (
        <div
          className="absolute pointer-events-none transition-all duration-300 ease-out z-[105]"
          style={{
            top: Math.max(0, targetRect.top - 8),
            left: Math.max(0, targetRect.left - 8),
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: "16px",
            boxShadow: "0 0 0 9999px rgba(10, 15, 30, 0.72)",
            border: "3px solid #10b981",
            outline: "2px solid rgba(255, 255, 255, 0.8)",
          }}
        >
          {/* Animated pulse beacon */}
          <span className="absolute -top-3 -right-3 flex h-7 w-7">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-7 w-7 bg-brand-600 text-white text-xs font-bold items-center justify-center border-2 border-white shadow-md">
              {currentStep + 1}
            </span>
          </span>
        </div>
      )}

      {/* Floating Tour Guide Dialog Card */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[460px] z-[110] transition-all duration-300 ease-out ${
          isTargetInBottomHalf ? "top-5" : "bottom-20"
        }`}
      >
        <div
          className="bg-surface rounded-2xl p-5 shadow-2xl border-2 border-brand-500/30 flex flex-col gap-3.5 backdrop-blur-md"
          style={{
            borderRadius: "var(--radius-sheet)",
            boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Header with counter and audio button */}
          <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-caption font-bold">
                {t.tutorial.stepCounter
                  .replace("{current}", String(currentStep + 1))
                  .replace("{total}", String(TOUR_STEPS.length))}
              </span>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5 ml-1">
                {TOUR_STEPS.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentStep
                        ? "w-5 bg-brand-600"
                        : idx < currentStep
                        ? "w-2 bg-brand-400"
                        : "w-2 bg-neutral-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Voice narration button */}
              <button
                type="button"
                onClick={handleToggleSpeech}
                title={isSpeaking ? t.tutorial.stopListenBtn : t.tutorial.listenBtn}
                className={`px-2.5 py-1 rounded-lg text-caption font-semibold flex items-center gap-1 transition-colors min-h-[36px] ${
                  isSpeaking
                    ? "bg-rose-100 text-rose-700 animate-pulse border border-rose-300"
                    : "bg-canvas text-ink-700 hover:bg-neutral-200 border border-border"
                }`}
              >
                <span>{isSpeaking ? "⏹️" : "🔊"}</span>
                <span className="text-xs">
                  {isSpeaking ? t.tutorial.stopListenBtn : t.tutorial.listenBtn}
                </span>
              </button>

              {/* Skip button */}
              <button
                type="button"
                onClick={handleComplete}
                title={t.tutorial.skipBtn}
                className="text-ink-600 hover:text-ink-900 text-caption font-semibold px-2 py-1 min-h-[36px]"
              >
                {t.tutorial.skipBtn}
              </button>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-heading text-ink-900 font-bold flex items-center gap-2">
              {stepContent.title}
            </h3>
            <p className="text-body text-ink-700 mt-1.5 leading-relaxed text-[15px]">
              {stepContent.desc}
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`touch-target px-4 py-2.5 rounded-xl border border-border text-body font-semibold transition-colors ${
                currentStep === 0
                  ? "opacity-0 pointer-events-none"
                  : "bg-surface hover:bg-canvas text-ink-700"
              }`}
            >
              {t.tutorial.prevBtn}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="touch-target flex-1 py-3 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-body font-bold shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5"
            >
              <span>{isLastStep ? t.tutorial.finishBtn : t.tutorial.nextBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
