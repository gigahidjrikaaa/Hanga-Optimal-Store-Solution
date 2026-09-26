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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col mx-auto w-full max-w-[480px]">
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-surface border-t border-border"
        style={{ boxShadow: "var(--shadow-sheet)" }}
      >
        <ul className="flex justify-around py-2">
          {NAV_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <li key={tab.key}>
                <Link
                  href={tab.href}
                  className={`touch-target flex flex-col items-center gap-1 px-3 transition-colors`}
                  style={{
                    color: isActive
                      ? "var(--color-brand-600)"
                      : "var(--color-ink-600)",
                    transitionDuration: "var(--duration-fast)",
                  }}
                >
                  <span className="text-xl" role="img" aria-hidden="true">
                    {tab.icon}
                  </span>
                  <span className="text-caption">{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
