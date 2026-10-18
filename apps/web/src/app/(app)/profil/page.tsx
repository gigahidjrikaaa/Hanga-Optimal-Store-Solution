/**
 * Profil — Screen for Shop Profile and System Settings.
 *
 * Displays Bu Sari's shop profile, primary wholesaler contacts,
 * and demo mode status per PRD §2.
 */

"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { HangaLogo } from "@/components/hanga-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/context";

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
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <HangaLogo variant="compact" size="sm" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <span className="text-caption font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
              {t.profil.demoBadge}
            </span>
          </div>
        </div>

        {/* Profile Card */}
        <div
          className="bg-surface p-5 flex items-center gap-4 border border-border"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-2xl shrink-0 border-2 border-brand-600/30">
            👩‍💼
          </div>
          <div className="flex flex-col">
            <h2 className="text-heading text-ink-900 font-bold">
              {user?.displayName ?? "Bu Sari"}
            </h2>
            <p className="text-body text-ink-600">Warung Berkah Jaya</p>
            <p className="text-caption text-neutral-400 mt-0.5">
              {user?.isDemo
                ? t.profil.demoSessionNote
                : (user?.email ?? t.profil.realOwnerNote)}
            </p>
          </div>
        </div>

        {/* Language Selection Card */}
        <div
          className="bg-surface p-4 flex flex-col gap-3 border border-border"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div>
            <h3 className="text-heading text-ink-900 font-semibold flex items-center gap-2">
              <span>🌐</span> {t.profil.langSectionTitle}
            </h3>
            <p className="text-caption text-ink-600 mt-1">
              {t.profil.langSectionDesc}
            </p>
          </div>
          <LanguageSwitcher variant="full" />
        </div>

        {/* Supplier / Wholesaler Section */}
        <div
          className="bg-surface p-4 flex flex-col gap-3 border border-border"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-heading text-ink-900 font-semibold flex items-center gap-2">
              <span>🏪</span> {t.profil.supplierSectionTitle}
            </h3>
            <span className="text-caption text-brand-600 font-bold">
              {t.profil.activeBadge}
            </span>
          </div>

          <div className="p-3 bg-canvas rounded-lg border border-border/70 flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink-900 text-body">
                Toko Grosir Jaya
              </p>
              <p className="text-caption text-ink-600">WhatsApp: +62 812-3456-7890</p>
            </div>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp Toko Grosir Jaya"
              className="touch-target px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-caption font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>💬</span> {t.profil.contactBtn}
            </a>
          </div>

          <div className="p-3 bg-canvas rounded-lg border border-border/70 flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink-900 text-body">
                Agen Telur Berkah
              </p>
              <p className="text-caption text-ink-600">WhatsApp: +62 812-9876-5432</p>
            </div>
            <a
              href="https://wa.me/6281298765432"
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp Agen Telur Berkah"
              className="touch-target px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-caption font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>💬</span> {t.profil.contactBtn}
            </a>
          </div>
        </div>

        {/* AI & Competition Badge */}
        <div
          className="bg-gradient-to-br from-brand-100/60 to-surface p-4 flex flex-col gap-2 border border-brand-600/20"
          style={{
            borderRadius: "var(--radius-card)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <span className="text-heading text-brand-800 font-bold">
              {t.profil.competitionBadge}
            </span>
          </div>
          <p className="text-caption text-ink-600">
            {t.profil.competitionDesc}
          </p>
        </div>

        {/* Cold Start Redo */}
        <div className="pt-2 flex flex-col gap-3">
          <a
            href="/onboarding"
            title="Atur ulang profil toko, barang terlaris, dan modal kas awal"
            className="touch-target w-full py-3 px-4 rounded-xl border border-border bg-surface hover:bg-canvas text-ink-900 font-semibold text-body flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>🔄</span> {t.profil.coldStartBtn}
          </a>

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Keluar dari sesi warung ini"
            className="touch-target w-full py-3 px-4 rounded-xl border border-danger-600/30 bg-surface hover:bg-danger-100 text-danger-600 font-semibold text-body flex items-center justify-center gap-2 transition-colors"
          >
            <span>🚪</span> {t.profil.signOutBtn}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
