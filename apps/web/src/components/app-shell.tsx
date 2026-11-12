/**
 * AppShell — Bottom navigation with 4 tabs.
 *
 * Design: design_system.md §2 — AppShell
 * Active tab: brand/600 icon + label. Max width 480px centered on desktop.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_TABS } from "@/lib/design-system";
import { Icon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="flex flex-1 flex-col mx-auto w-full max-w-[480px]">
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom navigation */}
      <nav
        id="tour-bottom-nav"
        aria-label="Navigasi utama"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-surface"
        style={{ boxShadow: "var(--shadow-sheet)" }}
      >
        <ul className="flex justify-around py-1">
          {NAV_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            const translatedLabel =
              tab.key === "beranda"
                ? t.nav.beranda
                : tab.key === "stok"
                ? t.nav.stok
                : tab.key === "pesanan"
                ? t.nav.pesanan
                : tab.key === "profil"
                ? t.nav.profil
                : tab.label;

            return (
              <li key={tab.key}>
                <Link
                  href={tab.href}
                  title={`Menu ${translatedLabel}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`touch-target pressable flex-col gap-0.5 px-3 py-1.5 rounded-xl ${
                    isActive ? "text-brand-600" : "text-muted"
                  }`}
                >
                  <Icon name={tab.icon} size={22} />
                  <span className="text-[11px] font-semibold leading-none">
                    {translatedLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
