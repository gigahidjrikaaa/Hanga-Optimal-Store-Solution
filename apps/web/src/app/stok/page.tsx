/**
 * Stok — Placeholder page for the stock tab.
 *
 * This is a secondary screen (not part of the 5-screen demo),
 * but included for the bottom nav to work correctly.
 */

import { AppShell } from "@/components/app-shell";

export default function StokPage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-4xl mb-4">📦</p>
        <h1 className="text-title text-ink-900">Stok</h1>
        <p className="text-body text-ink-600 mt-2">
          Halaman inventaris akan tersedia segera.
        </p>
      </div>
    </AppShell>
  );
}
