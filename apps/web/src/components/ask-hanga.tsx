/**
 * Tanya Hanga — grounded voice Q&A sheet (design_system.md §2, v1.1).
 *
 * Listening state uses the browser's Web Speech API (id-ID) and answers are
 * read aloud via speechSynthesis — zero live-API dependency on stage. A text
 * fallback is ALWAYS visible (venue-noise insurance). Answers come from the
 * /ask endpoint, grounded strictly in the stored briefing.
 *
 * Icons come from icons.tsx beside text labels (never icon-only); motion is
 * state-only: the listening halo is the .scanning load state, the thinking
 * state is the skeleton shimmer.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { DEMO_DATE, DEMO_SHOP_ID } from "@/lib/constants";
import { Icon } from "@/components/icons";
import { FACTOR_CONFIG } from "@/lib/design-system";
import { useLanguage } from "@/lib/i18n/context";
import type { AskResponse, FactorKey } from "@/types";

type AskState = "idle" | "listening" | "thinking" | "speaking" | "error";

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

interface AskSheetProps {
  open: boolean;
  onClose: () => void;
  /** Prefilled question (e.g. from a card's mic chip). */
  seedQuestion?: string;
  scenario: string;
  /** Current cash so budget answers match what the owner sees. */
  cash: number | null;
}

export function AskSheet({ open, onClose, seedQuestion, scenario, cash }: AskSheetProps) {
  const { t, language } = useLanguage();
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<AskState>("idle");
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const askedSeed = useRef<string | null>(null);

  const speak = useCallback(
    (text: string) => {
      if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "id" ? "id-ID" : "en-US";
      utterance.rate = 0.95;
      utterance.onend = () => setState((s) => (s === "speaking" ? "idle" : s));
      window.speechSynthesis.speak(utterance);
      setState("speaking");
    },
    [muted, language]
  );

  const ask = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length < 2) return;
      setState("thinking");
      setError(null);
      setAnswer(null);
      try {
        const cashParam = cash !== null ? `&cash_available_idr=${cash}` : "";
        const response = await api.post<AskResponse>(
          `/briefings/shops/${DEMO_SHOP_ID}/briefings/${DEMO_DATE}/ask?scenario=${scenario}${cashParam}`,
          { question_bahasa: trimmed }
        );
        setAnswer(response);
        speak(response.answer_bahasa);
        setState("idle");
      } catch {
        setError(t.askHanga.errorNote);
        setState("error");
      }
    },
    [cash, scenario, speak, t.askHanga.errorNote]
  );

  // Auto-ask the seeded card question once per open.
  useEffect(() => {
    if (open && seedQuestion && askedSeed.current !== seedQuestion) {
      askedSeed.current = seedQuestion;
      setQuestion(seedQuestion);
      void ask(seedQuestion);
    }
    if (!open) {
      askedSeed.current = null;
      setQuestion("");
      setAnswer(null);
      setState("idle");
      setError(null);
      recognitionRef.current?.stop();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedQuestion]);

  const startListening = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setError("Suara belum didukung di peramban ini, ketik saja ya, Bu.");
      setState("error");
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "id-ID";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setQuestion(transcript);
      setState("idle");
      void ask(transcript);
    };
    recognition.onerror = () => {
      setError("Tidak bisa mendengar dengan jelas, ketik saja ya, Bu.");
      setState("error");
    };
    recognition.onend = () => setState((s) => (s === "listening" ? "idle" : s));
    recognitionRef.current = recognition;
    setError(null);
    setState("listening");
    recognition.start();
  };

  if (!open) return null;

  const busy = state === "thinking";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Tanya Hanga">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0"
        style={{ backgroundColor: "color-mix(in srgb, var(--color-ink) 40%, transparent)" }}
      />

      <div
        className="relative bg-surface px-4 pt-4 pb-6 flex flex-col gap-3 max-w-[480px] w-full mx-auto"
        style={{
          borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0",
          boxShadow: "var(--shadow-sheet)",
        }}
      >
        {/* Sheet header */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <h2 className="text-heading text-ink-900 flex items-center gap-2 min-w-0">
            <Icon name="message" size={20} className="shrink-0 text-brand-800" />
            <span className="truncate">Tanya Hanga</span>
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMuted((m) => {
                  if (!m && typeof window !== "undefined") window.speechSynthesis?.cancel();
                  return !m;
                });
              }}
              aria-pressed={muted}
              aria-label={muted ? "Aktifkan suara" : "Bisukan suara"}
              className="touch-target text-caption text-ink-2 bg-paper-3 rounded-lg pressable"
            >
              <span className="flex items-center gap-1 px-1.5">
                <Icon name={muted ? "eye-off" : "eye"} size={16} className="shrink-0" />
                {muted ? "Senyap" : "Suara"}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="touch-target text-caption text-ink-2 bg-paper-3 rounded-lg pressable"
            >
              <span className="flex items-center gap-1 px-1.5">
                <Icon name="x" size={16} className="shrink-0" />
                Tutup
              </span>
            </button>
          </div>
        </div>

        {/* Listening / thinking / error states */}
        {state === "listening" && (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center scanning">
              <Icon name="mic" size={26} className="shrink-0" />
            </div>
            <p className="text-body text-muted">Hanga mendengarkan…</p>
          </div>
        )}
        {busy && (
          <div className="flex flex-col gap-2 py-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="text-caption px-3 py-2 text-warn bg-warn-bg rounded-lg"
          >
            {error}
          </p>
        )}

        {/* Starter suggestion chips when idle & no question yet */}
        {!answer && state === "idle" && (
          <div className="flex flex-col gap-2 py-1">
            <p className="text-caption text-muted flex items-center gap-1.5">
              <Icon name="lightbulb" size={14} className="shrink-0" />
              {t.askHanga.popularQuestions}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                t.askHanga.sample1,
                t.askHanga.sample2,
                t.askHanga.sample3,
              ].map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => {
                    setQuestion(starter);
                    void ask(starter);
                  }}
                  className="text-caption px-2.5 py-1.5 bg-paper-3 text-ink-2 rounded-full pressable text-left"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Answer */}
        {answer && state !== "listening" && (
          <div
            className="p-3 flex flex-col gap-2 bg-brand-100 rounded-xl"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            <p className="text-body text-ink-900">{answer.answer_bahasa}</p>
            {answer.factor_keys.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {answer.factor_keys.slice(0, 3).map((key) => (
                  <FactorChipInline key={key} factorKey={key} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Follow-ups */}
        {answer && answer.follow_ups.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {answer.follow_ups.map((fu) => (
              <button
                key={fu}
                type="button"
                onClick={() => {
                  setQuestion(fu);
                  void ask(fu);
                }}
                className="text-caption px-2.5 py-1.5 bg-surface border border-border text-muted pressable"
                style={{ borderRadius: "var(--radius-chip)" }}
              >
                {fu}
              </button>
            ))}
          </div>
        )}

        {/* Always-visible text fallback + mic */}
        <div className="flex flex-col gap-1.5 pt-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(question);
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={startListening}
              disabled={busy}
              aria-label={t.askHanga.voiceBtn}
              title={language === "id" ? "Tekan untuk bicara langsung via mikrofon" : "Tap to speak directly via microphone"}
              className="touch-target bg-brand-100 text-brand-800 disabled:opacity-50 pressable shrink-0"
              style={{ borderRadius: "var(--radius-chip)" }}
            >
              <span className="flex items-center gap-1 px-2.5">
                <Icon name="mic" size={18} className="shrink-0" />
                <span className="text-caption font-semibold">{t.askHanga.voiceBtn}</span>
              </span>
            </button>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t.askHanga.placeholder}
              aria-label={t.askHanga.title}
              className="touch-target flex-1 min-w-0 px-3 text-body text-ink-900 bg-canvas border border-border"
              style={{ borderRadius: "var(--radius-chip)" }}
            />
            <button
              type="submit"
              disabled={busy || question.trim().length < 2}
              title={t.askHanga.sendBtn}
              className="touch-target px-4 py-2 text-body font-semibold bg-brand-600 disabled:opacity-50 pressable shrink-0"
              style={{
                borderRadius: "var(--radius-chip)",
                color: "var(--color-accent-ink)",
              }}
            >
              <span className="flex items-center gap-1.5">
                <Icon name="send" size={16} className="shrink-0" />
                {t.askHanga.sendBtn}
              </span>
            </button>
          </form>
          <p className="text-caption text-muted text-center flex items-center justify-center gap-1.5">
            <Icon name="mic" size={14} className="shrink-0" />
            <span>
              {language === "id"
                ? "Tekan mikrofon untuk bicara atau ketik pertanyaan langsung dalam Bahasa Indonesia"
                : "Tap the microphone to speak or type your question in English"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function FactorChipInline({ factorKey }: { factorKey: FactorKey }) {
  const config = FACTOR_CONFIG[factorKey];
  return (
    <span
      className="text-caption px-2 py-0.5 bg-surface text-ink-2 inline-flex items-center gap-1"
      style={{ borderRadius: "var(--radius-chip)" }}
    >
      <Icon name={config.icon} size={14} className="shrink-0" />
      {config.label}
    </span>
  );
}
