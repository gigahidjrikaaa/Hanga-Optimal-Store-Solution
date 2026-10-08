/**
 * Onboarding / Cold-start — Screen 1 in design_system.md §3.
 *
 * Tap-to-answer interview establishing the shop profile. The final question —
 * "Berapa kas yang bisa dipakai belanja hari ini?" (v1.1) — feeds the
 * CashBudgetBar. On finish the profile is saved via PUT /shops/{id}/profile
 * (fire-and-forget; the app works offline) and mirrored to localStorage so
 * Beranda prefills today's cash.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HangaLogo } from "@/components/hanga-logo";
import { api } from "@/lib/api";
import { DEMO_SHOP_ID } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";

interface OnboardingStep {
  question: string;
  placeholder: string;
  type: "text" | "cash";
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
  {
    question: "Berapa kas yang bisa dipakai belanja hari ini?",
    placeholder: "contoh: 500000",
    type: "cash",
  },
];

const CASH_CHIPS = [100000, 300000, 500000, 1000000, 2000000];

function shortIDR(amount: number): string {
  if (amount >= 1000000) {
    const jt = amount / 1000000;
    return `${jt % 1 === 0 ? jt : jt.toFixed(1)}jt`;
  }
  return `${Math.round(amount / 1000)}rb`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => {
    const initial = new Array(ONBOARDING_STEPS.length).fill("");
    initial[0] = user?.displayName ?? "";
    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      void handleFinish();
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleFinish = async () => {
    setIsSaving(true);
    const cash = Number.parseInt(answers[4], 10) || 0;
    const profile = {
      owner_name: answers[0] || "Bu Sari",
      shop_name: answers[1] || "Warung Berkah Jaya",
      top_items: answers[2],
      supplier_name: answers[3],
      cash_available_idr: cash,
    };

    // Mirror locally so Beranda prefills today's cash even offline.
    try {
      localStorage.setItem("hanga_profile", JSON.stringify(profile));
      if (cash > 0) localStorage.setItem("hanga_cash_today", String(cash));
    } catch {
      // Private mode: skip the mirror, keep going.
    }

    // Persist server-side — fire-and-forget, navigation never waits.
    api
      .put(`/shops/${DEMO_SHOP_ID}/profile`, profile)
      .catch(() => {
        // Offline/demo fallback: localStorage mirror above.
      })
      .finally(() => {
        router.replace("/");
      });
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

  const canProceed =
    step.type === "cash" || answers[currentStep].trim().length > 0;

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
        {step.type === "cash" ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {CASH_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChange(String(chip))}
                  className={`touch-target px-4 text-body font-semibold border transition-colors ${
                    answers[currentStep] === String(chip)
                      ? "bg-brand-600 border-brand-600 text-surface"
                      : "bg-surface border-border text-ink-600"
                  }`}
                  style={{ borderRadius: "var(--radius-badge)" }}
                >
                  {shortIDR(chip)}
                </button>
              ))}
            </div>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={answers[currentStep]}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={step.placeholder}
              className="text-title py-3 px-4 bg-surface border border-border text-ink-900 text-numeric placeholder:text-neutral-400 focus:outline-none focus:border-brand-600 transition-colors"
              style={{
                borderRadius: "var(--radius-card)",
                transitionDuration: "var(--duration-fast)",
              }}
              autoFocus
            />
            <p className="text-caption text-ink-600">
              Dipakai Hanga agar rekomendasi tidak melebihi kas hari ini. Bisa
              diubah kapan saja di Beranda.
            </p>
          </div>
        ) : (
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
        )}
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
          disabled={!canProceed || isSaving}
          className="touch-target flex-1 text-body font-semibold py-3 px-6 text-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--color-brand-600)",
            transitionDuration: "var(--duration-fast)",
          }}
        >
          {isSaving ? "Menyimpan…" : isLastStep ? "Mulai ✨" : "Lanjut"}
        </button>
      </div>
    </div>
  );
}
