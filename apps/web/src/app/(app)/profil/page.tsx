/**
 * Profil — Screen for Shop Profile and System Settings.
 *
 * Displays Bu Sari's shop profile, primary wholesaler contacts,
 * and demo mode status per PRD §2.
 *
 * Design notes (Hallmark v2 redesign): cards are bg-surface rounded-xl
 * with a hairline border only (one of border or shadow); the avatar is a
 * brand-100 circle with the stroke user icon (never an emoji); the AI
 * Builder Cup 2026 block is a flat brand-100 tint (no gradient); the
 * tour button is the screen's single filled primary CTA, WhatsApp
 * contacts are secondary outlined, and "Keluar dari Sesi" is a danger
 * outlined action with the logout icon; emoji and the em dash injected
 * by translations.ts are stripped at the render boundary (cleanCopy).
 */

"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { HangaLogo } from "@/components/hanga-logo";
import { Icon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/context";

/**
 * Pembersih string terjemahan (translations.ts tidak dapat diedit): buang
 * emoji dan panah tempel, lalu ganti em/en dash dengan koma agar copy hanya
 * memakai koma, titik, titik dua, dan tanda kurung. Ikonnya dirender
 * terpisah di samping teks oleh komponen Icon.
 */
function cleanCopy(value: string): string {
  return value
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu,
      ""
    )
    .replace(/\s*[\u2014\u2013]\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function ProfilPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/masuk");
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-5 py-5 px-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <HangaLogo variant="compact" size="sm" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <span className="text-caption font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
              {t.profil.demoBadge}
            </span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-surface p-5 flex items-center gap-4 border border-border rounded-xl">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 shrink-0">
            <Icon name="user" size={28} className="shrink-0" aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-heading text-ink-900">
              {user?.displayName ?? "Bu Sari"}
            </h2>
            <p className="text-body text-muted">Warung Berkah Jaya</p>
            <p className="text-caption text-neutral-400 mt-0.5 min-w-0">
              {user?.isDemo
                ? cleanCopy(t.profil.demoSessionNote)
                : (user?.email ?? t.profil.realOwnerNote)}
            </p>
          </div>
        </div>

        {/* Language Selection Card */}
        <div className="bg-surface p-4 flex flex-col gap-3 border border-border rounded-xl">
          <div>
            <h3 className="text-heading text-ink-900 flex items-center gap-2">
              <Icon name="globe" size={20} className="shrink-0 text-brand-800" aria-hidden="true" />
              {t.profil.langSectionTitle}
            </h3>
            <p className="text-caption text-muted mt-1">
              {t.profil.langSectionDesc}
            </p>
          </div>
          <LanguageSwitcher variant="full" />
        </div>

        {/* In-App Tutorial Replay Card */}
        <div className="bg-surface p-4 flex flex-col gap-3 border border-border rounded-xl">
          <div>
            <h3 className="text-heading text-ink-900 flex items-center gap-2">
              <Icon name="lightbulb" size={20} className="shrink-0 text-brand-800" aria-hidden="true" />
              {t.tutorial.replayTourBtn}
            </h3>
            <p className="text-caption text-muted mt-1">
              {t.tutorial.replayTourDesc}
            </p>
          </div>
          {/* Satu-satunya CTA primary terisi di layar ini */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("hanga_tour_completed");
              }
              router.push("/?tour=true");
            }}
            className="touch-target w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-800 text-white font-semibold text-body flex items-center justify-center gap-2 transition-colors pressable"
          >
            <Icon name="play" size={20} className="shrink-0" aria-hidden="true" />
            {cleanCopy(t.tutorial.startBtn)}
          </button>
        </div>

        {/* Supplier / Wholesaler Section */}
        <div className="bg-surface p-4 flex flex-col gap-3 border border-border rounded-xl">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-heading text-ink-900 flex items-center gap-2">
              <Icon name="store" size={20} className="shrink-0 text-brand-800" aria-hidden="true" />
              {t.profil.supplierSectionTitle}
            </h3>
            <span className="text-caption text-brand-800 font-semibold shrink-0">
              {t.profil.activeBadge}
            </span>
          </div>

          <div className="p-3 bg-canvas rounded-lg border border-border flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-ink-900 text-body">
                Toko Grosir Jaya
              </p>
              <p className="text-caption text-muted">WhatsApp: +62 812-3456-7890</p>
            </div>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp Toko Grosir Jaya"
              className="touch-target shrink-0 px-3 py-1.5 rounded-lg bg-surface border border-border text-brand-800 text-caption font-semibold flex items-center gap-1.5 transition-colors pressable"
            >
              <Icon name="message" size={16} className="shrink-0" aria-hidden="true" />
              {t.profil.contactBtn}
            </a>
          </div>

          <div className="p-3 bg-canvas rounded-lg border border-border flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-ink-900 text-body">
                Agen Telur Berkah
              </p>
              <p className="text-caption text-muted">WhatsApp: +62 812-9876-5432</p>
            </div>
            <a
              href="https://wa.me/6281298765432"
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp Agen Telur Berkah"
              className="touch-target shrink-0 px-3 py-1.5 rounded-lg bg-surface border border-border text-brand-800 text-caption font-semibold flex items-center gap-1.5 transition-colors pressable"
            >
              <Icon name="message" size={16} className="shrink-0" aria-hidden="true" />
              {t.profil.contactBtn}
            </a>
          </div>
        </div>

        {/* AI & Competition Badge */}
        <div className="bg-brand-100 p-4 flex flex-col gap-2 rounded-xl">
          <div className="flex items-center gap-2">
            <Icon name="gift" size={22} className="shrink-0 text-brand-800" aria-hidden="true" />
            <span className="text-heading text-brand-800">
              {t.profil.competitionBadge}
            </span>
          </div>
          <p className="text-caption text-ink-2">
            {t.profil.competitionDesc}
          </p>
        </div>

        {/* Cold Start Redo */}
        <div className="pt-2 flex flex-col gap-3">
          <a
            href="/onboarding"
            title="Atur ulang profil toko, barang terlaris, dan modal kas awal"
            className="touch-target w-full py-3 px-4 rounded-xl border border-border bg-surface hover:bg-canvas text-ink-900 font-semibold text-body flex items-center justify-center gap-2 transition-colors pressable"
          >
            <Icon name="refresh" size={20} className="shrink-0" aria-hidden="true" />
            {t.profil.coldStartBtn}
          </a>

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Keluar dari sesi warung ini"
            className="touch-target w-full py-3 px-4 rounded-xl border border-danger bg-surface hover:bg-danger-bg text-danger font-semibold text-body flex items-center justify-center gap-2 transition-colors pressable"
          >
            <Icon name="logout" size={20} className="shrink-0" aria-hidden="true" />
            {t.profil.signOutBtn}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
