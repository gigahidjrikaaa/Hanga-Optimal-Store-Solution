/**
 * Onboarding / Cold-start — Screen 1 in design_system.md §3.
 *
 * Voice-or-tap 4-question interview to establish shop profile.
 * PRD §5 feature: Cold-start interview (voice/tap, 2 min).
 */

"use client";

import { useState } from "react";
import { HangaLogo } from "@/components/hanga-logo";

interface OnboardingStep {
  question: string;
  placeholder: string;
  type: "text" | "select";
  options?: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    question: "Siapa nama Bu/Pak pemilik warung?",
    placeholder: "contoh: Bu Sari",
    type: "text",
  },
  {
    question: "Apa nama warung Anda?",
    placeholder: "contoh: Warung Berkah Jaya",
    type: "text",
  },
  {
    question: "Barang apa yang paling sering dijual?",
    placeholder: "contoh: Gula, Minyak, Telur, Susu",
    type: "text",
  },
  {
    question: "Dari siapa biasanya Anda belanja stok?",
    placeholder: "contoh: Toko Grosir Jaya",
    type: "text",
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(
    new Array(ONBOARDING_STEPS.length).fill("")
  );

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      // TODO: Save profile to Firestore and navigate to Beranda
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleChange = (value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentStep] = value;
      return next;
    });
  };

  return (
    <div className="flex flex-1 flex-col mx-auto w-full max-w-[480px] min-h-dvh">
      {/* Progress bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: "var(--color-brand-100)" }}
      >
        <div
          className="h-full transition-all"
          style={{
            width: `${progress}%`,
            backgroundColor: "var(--color-brand-600)",
            transitionDuration: "var(--duration-normal)",
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 gap-8">
        {/* Brand header */}
        <div className="flex items-center justify-between">
          <HangaLogo variant="full" size="sm" />
          <span className="text-caption text-ink-600 font-medium">
            Langkah {currentStep + 1} dari {ONBOARDING_STEPS.length}
          </span>
        </div>

        {/* Question */}
        <h1 className="text-display text-ink-900">{step.question}</h1>

        {/* Input */}
        <input
          type="text"
          value={answers[currentStep]}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={step.placeholder}
          className="text-title py-3 px-4 bg-surface border border-border text-ink-900 placeholder:text-neutral-400 focus:outline-none focus:border-brand-600 transition-colors"
          style={{
            borderRadius: "var(--radius-card)",
            transitionDuration: "var(--duration-fast)",
          }}
          autoFocus
        />
      </div>

      {/* Bottom navigation */}
      <div className="px-6 pb-8 flex gap-3">
        {currentStep > 0 && (
          <button
            onClick={handleBack}
            className="touch-target text-body font-semibold py-3 px-6 border border-border text-ink-600 transition-colors"
            style={{
              borderRadius: "var(--radius-card)",
              transitionDuration: "var(--duration-fast)",
            }}
          >
            Kembali
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!answers[currentStep].trim()}
          className="touch-target flex-1 text-body font-semibold py-3 px-6 text-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--color-brand-600)",
            transitionDuration: "var(--duration-fast)",
          }}
        >
          {isLastStep ? "Mulai ✨" : "Lanjut"}
        </button>
      </div>
    </div>
  );
}
