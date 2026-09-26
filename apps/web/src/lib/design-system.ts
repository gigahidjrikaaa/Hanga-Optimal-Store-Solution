/**
 * Hanga — Design system constants.
 *
 * Maps from data model enums to UI labels, icons, and colors.
 * All user-facing copy in Bahasa Indonesia (design_system.md §0, principle 4).
 */

import type { ActionType, Confidence, FactorKey, Scenario } from "@/types";

// ---------------------------------------------------------------------------
// Scenario labels for the ScenarioToggle
// ---------------------------------------------------------------------------

export const SCENARIO_LABELS: Record<Scenario, string> = {
  BASELINE: "Normal",
  LEBARAN_T14: "Lebaran +14 hr",
  PAYDAY_T3: "Gajian",
  RAIN_TOMORROW: "Hujan Besok",
};

// ---------------------------------------------------------------------------
// Action badge config
// ---------------------------------------------------------------------------

interface ActionBadgeConfig {
  label: string;
  className: string;
}

export const ACTION_BADGES: Record<ActionType, ActionBadgeConfig> = {
  REORDER: {
    label: "Pesan Ulang",
    className: "bg-brand-100 text-brand-800",
  },
  PROMO: {
    label: "Promo",
    className: "bg-warn-100 text-warn-600",
  },
  HOLD: {
    label: "Tahan",
    className: "bg-canvas text-ink-600",
  },
  SKIP: {
    label: "Lewati",
    className: "bg-canvas text-neutral-400",
  },
};

// ---------------------------------------------------------------------------
// Confidence badge config (design_system.md §2)
// ---------------------------------------------------------------------------

interface ConfidenceConfig {
  label: string;
  className: string;
}

export const CONFIDENCE_CONFIG: Record<Confidence, ConfidenceConfig> = {
  HIGH: { label: "Yakin", className: "confidence-high" },
  MEDIUM: { label: "Cukup yakin", className: "confidence-medium" },
  LOW: { label: "Perlu cek", className: "confidence-low" },
};

// ---------------------------------------------------------------------------
// Factor chip config (design_system.md §2)
// ---------------------------------------------------------------------------

interface FactorConfig {
  icon: string;
  label: string;
}

export const FACTOR_CONFIG: Record<FactorKey, FactorConfig> = {
  PAYDAY: { icon: "💰", label: "Gajian" },
  WEEKEND: { icon: "📅", label: "Akhir pekan" },
  RAIN: { icon: "🌧️", label: "Hujan" },
  RAIN_TOMORROW: { icon: "🌧️", label: "Hujan besok" },
  LEBARAN_T14: { icon: "🕌", label: "Lebaran +14hr" },
  LEBARAN_WEEK: { icon: "🕌", label: "Minggu Lebaran" },
  EVENT_KONDANGAN: { icon: "💒", label: "Kondangan" },
  EVENT_PASAR: { icon: "🏪", label: "Hari pasar" },
  SCHOOL_TERM: { icon: "🎒", label: "Musim sekolah" },
  TREND_UP: { icon: "📈", label: "Tren naik" },
  TREND_DOWN: { icon: "📉", label: "Tren turun" },
  WASTE_RISK: { icon: "⚠️", label: "Risiko buang" },
  LOW_DATA: { icon: "📊", label: "Data sedikit" },
};

// ---------------------------------------------------------------------------
// Bottom nav tabs (AppShell, design_system.md §2)
// ---------------------------------------------------------------------------

export interface NavTab {
  key: string;
  label: string;
  href: string;
  icon: string;
}

export const NAV_TABS: NavTab[] = [
  { key: "beranda", label: "Beranda", href: "/", icon: "🏠" },
  { key: "stok", label: "Stok", href: "/stok", icon: "📦" },
  { key: "pesanan", label: "Pesanan", href: "/pesanan", icon: "📋" },
  { key: "profil", label: "Profil", href: "/profil", icon: "👤" },
];

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Format IDR amount with thousands separator.
 * Example: 171000 → "Rp 171.000"
 */
export function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/**
 * Format a percentage delta with sign.
 * Example: 0.22 → "+22%", -0.31 → "−31%"
 */
export function formatDelta(delta: number): string {
  const pct = Math.round(delta * 100);
  const sign = pct >= 0 ? "+" : "−";
  return `${sign}${Math.abs(pct)}%`;
}
