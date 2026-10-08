/**
 * Tanya Hanga — grounded voice Q&A sheet (design_system.md §2, v1.1).
 *
 * Listening state uses the browser's Web Speech API (id-ID) and answers are
 * read aloud via speechSynthesis — zero live-API dependency on stage. A text
 * fallback is ALWAYS visible (venue-noise insurance). Answers come from the
 * /ask endpoint, grounded strictly in the stored briefing.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { DEMO_DATE, DEMO_SHOP_ID } from "@/lib/constants";
import { FACTOR_CONFIG } from "@/lib/design-system";
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
  /** Prefilled question (e.g. from a card's 🎤 chip). */
  seedQuestion?: string;
  scenario: string;
  /** Current cash so budget answers match what the owner sees. */
  cash: number | null;
}

export function AskSheet({ open, onClose, seedQuestion, scenario, cash }: AskSheetProps) {
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
      utterance.lang = "id-ID";
      utterance.rate = 0.95;
      utterance.onend = () => setState((s) => (s === "speaking" ? "idle" : s));
      window.speechSynthesis.speak(utterance);
      setState("speaking");
    },
    [muted]
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
        setError("Tanya Hanga belum bisa menjawab. Coba lagi ya, Bu.");
        setState("error");
      }
    },
    [cash, scenario, speak]
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
      setError("Suara belum didukung di peramban ini — ketik saja ya, Bu.");
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
      setError("Tidak bisa mendengar dengan jelas — ketik saja ya, Bu.");
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
        className="absolute inset-0 bg-ink-900/40"
      />

      <div
        className="relative bg-surface px-4 pt-4 pb-6 flex flex-col gap-3 max-w-[480px] w-full mx-auto"
        style={{
          borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0",
          boxShadow: "var(--shadow-sheet)",
        }}
      >
        {/* Sheet header */}
        <div className="flex items-center justify-between">
          <h2 className="text-heading text-ink-900">🎤 Tanya Hanga</h2>
          <div className="flex items-center gap-1">
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
              className="touch-target text-caption text-ink-600"
            >
              {muted ? "🔇" : "🔊"}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="touch-target text-caption text-ink-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Listening / thinking / error states */}
        {state === "listening" && (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="flex gap-1.5 items-end h-8" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-1.5 bg-brand-600 rounded-full animate-pulse"
                  style={{ height: `${12 + (i % 3) * 10}px`, animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
            <p className="text-body text-ink-600">Hanga mendengarkan…</p>
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
            className="text-caption px-3 py-2 text-warn-600"
            style={{ backgroundColor: "var(--color-warn-100)", borderRadius: "var(--radius-chip)" }}
          >
            {error}
          </p>
        )}

        {/* Answer */}
        {answer && state !== "listening" && (
          <div
            className="p-3 flex flex-col gap-2 pop-in"
            style={{ backgroundColor: "var(--color-brand-100)", borderRadius: "var(--radius-card)" }}
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
                className="text-caption px-2.5 py-1 bg-canvas border border-border text-ink-600"
                style={{ borderRadius: "var(--radius-badge)" }}
              >
                {fu}
              </button>
            ))}
          </div>
        )}

        {/* Always-visible text fallback + mic */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(question);
          }}
          className="flex items-center gap-2 pt-1"
        >
          <button
            type="button"
            onClick={startListening}
            disabled={busy}
            aria-label="Tanya dengan suara"
            className="touch-target text-xl bg-brand-100 text-brand-800 disabled:opacity-50"
            style={{ borderRadius: "var(--radius-badge)" }}
          >
            🎙️
          </button>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Contoh: kenapa pesan gula 15 kg?"
            className="touch-target flex-1 px-3 text-body text-ink-900 bg-canvas border border-border focus:outline-none focus:border-brand-600"
            style={{ borderRadius: "var(--radius-chip)" }}
          />
          <button
            type="submit"
            disabled={busy || question.trim().length < 2}
            className="touch-target px-4 text-body font-semibold text-surface bg-brand-600 disabled:opacity-50"
            style={{ borderRadius: "var(--radius-chip)" }}
          >
            Tanya
          </button>
        </form>
      </div>
    </div>
  );
}

function FactorChipInline({ factorKey }: { factorKey: FactorKey }) {
  const config = FACTOR_CONFIG[factorKey];
  return (
    <span
      className="text-caption px-2 py-0.5 bg-surface text-ink-600"
      style={{ borderRadius: "var(--radius-chip)" }}
    >
      <span aria-hidden="true">{config.icon}</span> {config.label}
    </span>
  );
}
