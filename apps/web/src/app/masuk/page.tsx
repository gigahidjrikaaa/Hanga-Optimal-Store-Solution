/**
 * Masuk — the entrance to the app, styled as the entrance to the shop.
 *
 * "Warung buka pagi": a dawn sky, the sun rising behind a striped awning,
 * a card that rises with the day, and — on success — the rolling shutter
 * sweeping up past the camera to reveal the briefing.
 *
 * Auth best practices honored here (see PRD §11): generic credential errors
 * (no user enumeration), length-based password guidance, show/hide toggle,
 * autocomplete attributes, inline validation, ≥48px targets.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HangaLogo } from "@/components/hanga-logo";
import { useAuth } from "@/lib/auth-context";

type Mode = "masuk" | "daftar";

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi, Bu 👋";
  if (hour < 15) return "Selamat siang, Bu 👋";
  if (hour < 19) return "Selamat sore, Bu 👋";
  return "Selamat malam, Bu 👋";
}

export default function MasukPage() {
  const router = useRouter();
  const { user, isLoading, signIn, signUp, signInWithGoogle, signInDemo } =
    useAuth();

  const [mode, setMode] = useState<Mode>("masuk");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [showShutter, setShowShutter] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  const greeting = useMemo(greetingForNow, []);
  const nextPath = useMemo(() => {
    if (typeof window === "undefined") return "/";
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") ? next : "/";
  }, []);

  const isPasswordTooShort = password.length > 0 && password.length < 8;
  const canSubmit =
    !isBusy &&
    email.includes("@") &&
    password.length >= 8 &&
    (mode === "masuk" || name.trim().length > 0);

  // Any successful sign-in (email, Google, demo) triggers the shutter reveal.
  useEffect(() => {
    if (isLoading || !user || hasNavigated) return;
    setHasNavigated(true);
    setShowShutter(true);
    // Navigate mid-sweep so the app is already behind the shutter as it lifts.
    const navTimer = setTimeout(() => router.replace(nextPath), 480);
    return () => clearTimeout(navTimer);
  }, [user, isLoading, hasNavigated, nextPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsBusy(true);
    try {
      if (mode === "masuk") {
        await signIn(email.trim(), password);
      } else {
        await signUp(name.trim(), email.trim(), password);
      }
      // Success flows through the `user` effect above.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kendala. Coba lagi.");
      setIsBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setIsBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kendala. Coba lagi.");
      setIsBusy(false);
    }
  };

  const handleDemo = () => {
    setError(null);
    signInDemo(); // sets user → shutter effect takes over
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-dvh overflow-hidden auth-sky">
      {/* Atmosphere: drifting blobs + the rising sun behind the awning */}
      <div
        className="blob w-56 h-56 -left-16 top-10"
        style={{ backgroundColor: "var(--color-brand-100)" }}
      />
      <div
        className="blob w-44 h-44 -right-10 top-40"
        style={{
          backgroundColor: "var(--color-warn-100)",
          animationDelay: "-8s",
        }}
      />
      <div
        className="auth-sun w-40 h-40 left-1/2 -translate-x-1/2 bottom-[52px]"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative flex-1 flex flex-col mx-auto w-full max-w-[480px] px-5 pt-10 pb-16">
        {/* Brand */}
        <div className="rise-in" style={{ animationDelay: "0ms" }}>
          <HangaLogo variant="full" size="md" />
        </div>

        {/* Greeting */}
        <div className="rise-in mt-8" style={{ animationDelay: "90ms" }}>
          <h1 className="text-display text-ink-900">{greeting}</h1>
          <p className="text-body text-ink-600 mt-1">
            Masuk untuk membuka briefing hari ini.
          </p>
        </div>

        {/* Card */}
        <div
          className="rise-in bg-surface mt-6 p-5 flex flex-col gap-4"
          style={{
            animationDelay: "180ms",
            borderRadius: "var(--radius-sheet)",
            boxShadow: "var(--shadow-sheet)",
          }}
        >
          {/* Mode toggle */}
          <div
            className="relative grid grid-cols-2 bg-canvas p-1"
            style={{ borderRadius: "var(--radius-badge)" }}
            role="tablist"
            aria-label="Masuk atau daftar"
          >
            <span
              aria-hidden="true"
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-surface transition-transform"
              style={{
                borderRadius: "var(--radius-badge)",
                boxShadow: "var(--shadow-card)",
                transform:
                  mode === "masuk" ? "translateX(0)" : "translateX(100%)",
                transitionDuration: "var(--duration-normal)",
              }}
            />
            {(["masuk", "daftar"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`touch-target text-body font-semibold relative z-10 transition-colors ${
                  mode === m ? "text-brand-800" : "text-ink-600"
                }`}
                style={{ borderRadius: "var(--radius-badge)", transitionDuration: "var(--duration-fast)" }}
              >
                {m === "masuk" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="px-3 py-2 text-caption text-danger-600"
              style={{
                backgroundColor: "var(--color-danger-100)",
                borderRadius: "var(--radius-chip)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "daftar" && (
              <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-caption text-ink-600">
                  Nama pemilik warung
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="touch-target w-full px-3 text-body text-ink-900 bg-canvas border border-border focus:outline-none focus:border-brand-600"
                  style={{ borderRadius: "var(--radius-chip)" }}
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-caption text-ink-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                autoFocus
                className="touch-target w-full px-3 text-body text-ink-900 bg-canvas border border-border focus:outline-none focus:border-brand-600"
                style={{ borderRadius: "var(--radius-chip)" }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-caption text-ink-600">
                  Kata sandi
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={
                    showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                  }
                  className="touch-target text-caption text-ink-600"
                >
                  {showPassword ? "🙈 Sembunyikan" : "👁️ Tampilkan"}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "masuk" ? "current-password" : "new-password"}
                className={`touch-target w-full px-3 text-body text-ink-900 bg-canvas border focus:outline-none ${
                  isPasswordTooShort
                    ? "border-warn-600"
                    : "border-border focus:border-brand-600"
                }`}
                style={{ borderRadius: "var(--radius-chip)" }}
              />
              {isPasswordTooShort && (
                <p className="text-caption text-warn-600">
                  Minimal 8 karakter — panjang lebih baik daripada rumit.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="touch-target w-full flex items-center justify-center gap-2 text-body font-semibold text-surface pressable disabled:opacity-50"
              style={{
                borderRadius: "var(--radius-card)",
                backgroundColor: "var(--color-brand-600)",
              }}
            >
              {isBusy && mode === "masuk" ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Memeriksa…
                </>
              ) : isBusy ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Menyiapkan…
                </>
              ) : mode === "masuk" ? (
                "Masuk"
              ) : (
                "Buat Akun"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-border" />
            <span className="text-caption text-neutral-400">atau</span>
            <span className="flex-1 h-px bg-border" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isBusy}
            className="touch-target w-full flex items-center justify-center gap-3 text-body font-semibold text-ink-900 bg-surface border border-border pressable disabled:opacity-50"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
              />
              <path
                fill="#FBBC05"
                d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6.1z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.2 0 11.4-2 15.4-5.6l-7.5-5.8c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.7-3.7-13.6-9l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
              />
            </svg>
            Lanjut dengan Google
          </button>

          {/* Demo */}
          <button
            type="button"
            onClick={handleDemo}
            disabled={isBusy}
            className="flex flex-col items-center justify-center gap-0.5 min-h-[56px] w-full text-body font-semibold text-brand-800 bg-brand-100/70 border border-brand-600 disabled:opacity-50"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            🧪 Coba Mode Demo
            <span className="text-caption text-ink-600 font-normal">
              Jelajahi sebagai Bu Sari, tanpa akun
            </span>
          </button>
        </div>

        {/* Footnote */}
        <p
          className="rise-in text-caption text-ink-600 text-center mt-6"
          style={{ animationDelay: "270ms" }}
        >
          Warung Anda, data Anda. Kami hanya membacanya untuk membantu Anda.
        </p>
      </div>

      {/* Storefront: the sun rises behind the awning */}
      <div className="relative" aria-hidden="true">
        <div className="awning w-full" />
        <div
          className="h-3 w-full"
          style={{ backgroundColor: "var(--color-ink-900)" }}
        />
      </div>

      {/* Success: rolling shutter sweep */}
      {showShutter && (
        <div
          className="shutter shutter-face flex items-center justify-center"
          onAnimationEnd={() => setShowShutter(false)}
        >
          <div className="text-center px-6">
            <p className="text-display text-surface" style={{ letterSpacing: "0.06em" }}>
              HANGA
            </p>
            <p className="text-body text-brand-100 mt-2">
              Warung buka — selamat bekerja, Bu. 🌅
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
