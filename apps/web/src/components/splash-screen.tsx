/**
 * SplashScreen — the full "warung buka pagi" opening moment.
 *
 * Shown while auth state hydrates (ProtectedRoute): dawn sky, drifting
 * blobs, the sun rising behind the awning, the breathing logo, and an
 * indeterminate sweep bar. Fades out once the session resolves.
 */

"use client";

import { HangaLogo } from "@/components/hanga-logo";

interface SplashScreenProps {
  fading?: boolean;
}

export function SplashScreen({ fading = false }: SplashScreenProps) {
  return (
    <div
      aria-live="polite"
      aria-busy={!fading}
      aria-label="Memuat Hanga"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden auth-sky"
      style={{
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
        transition: "opacity 350ms var(--ease-out)",
      }}
    >
      {/* Atmosphere */}
      <div
        className="blob w-56 h-56 -left-16 top-16"
        style={{ backgroundColor: "var(--color-brand-100)" }}
      />
      <div
        className="blob w-44 h-44 -right-10 bottom-32"
        style={{ backgroundColor: "var(--color-warn-100)", animationDelay: "-8s" }}
      />
      <div
        className="auth-sun w-36 h-36 left-1/2 -translate-x-1/2 bottom-[92px]"
        aria-hidden="true"
      />

      {/* Brand */}
      <div className="relative flex flex-col items-center gap-3 animate-logo-breathe">
        <HangaLogo variant="full" size="lg" />
        <p className="text-body text-ink-600">Warung pintar, modal aman.</p>
      </div>

      {/* Progress */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-40">
        <div
          className="h-1.5 sweep-bar w-full"
          style={{
            borderRadius: "var(--radius-badge)",
            backgroundColor: "var(--color-brand-100)",
          }}
        />
        <p className="text-caption text-ink-600 text-center mt-2">
          Membuka warung…
        </p>
      </div>

      {/* Storefront */}
      <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
        <div className="awning w-full" />
        <div
          className="h-3 w-full"
          style={{ backgroundColor: "var(--color-ink-900)" }}
        />
      </div>
    </div>
  );
}
