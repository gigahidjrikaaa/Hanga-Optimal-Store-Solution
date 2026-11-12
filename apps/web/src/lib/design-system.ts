/**
 * Hanga — Design system constants.
 *
 * Maps from data model enums to UI labels, icons, and colors.
 * All user-facing copy in Bahasa Indonesia (design_system.md §0, principle 4).
 * Icons come from components/icons.tsx (one stroke library); colours are
 * design.md tokens — never raw Tailwind palette classes.
 */

import type { ActionType, Confidence, FactorKey, Scenario } from "@/types";
import type { IconName } from "@/components/icons";

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
    className: "bg-warn-bg text-warn",
  },
  HOLD: {
    label: "Tahan",
    className: "bg-paper-3 text-ink-2",
  },
  SKIP: {
    label: "Lewati",
    className: "bg-paper-3 text-neutral-400",
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
  icon: IconName;
  label: string;
}

export const FACTOR_CONFIG: Record<FactorKey, FactorConfig> = {
  PAYDAY: { icon: "banknote", label: "Gajian" },
  WEEKEND: { icon: "calendar", label: "Akhir pekan" },
  RAIN: { icon: "rain", label: "Hujan" },
  RAIN_TOMORROW: { icon: "rain", label: "Hujan besok" },
  LEBARAN_T14: { icon: "moon", label: "Lebaran +14hr" },
  LEBARAN_WEEK: { icon: "moon", label: "Minggu Lebaran" },
  EVENT_KONDANGAN: { icon: "gift", label: "Kondangan" },
  EVENT_PASAR: { icon: "store", label: "Hari pasar" },
  SCHOOL_TERM: { icon: "school", label: "Musim sekolah" },
  TREND_UP: { icon: "trend-up", label: "Tren naik" },
  TREND_DOWN: { icon: "trend-down", label: "Tren turun" },
  WASTE_RISK: { icon: "alert", label: "Risiko buang" },
  LOW_DATA: { icon: "chart", label: "Data sedikit" },
  CASH_TIGHT: { icon: "wallet", label: "Kas terbatas" },
};

// ---------------------------------------------------------------------------
// Bottom nav tabs (AppShell, design_system.md §2)
// ---------------------------------------------------------------------------

export interface NavTab {
  key: string;
  label: string;
  href: string;
  icon: IconName;
}

export const NAV_TABS: NavTab[] = [
  { key: "beranda", label: "Beranda", href: "/", icon: "home" },
  { key: "stok", label: "Stok", href: "/stok", icon: "package" },
  { key: "pesanan", label: "Pesanan", href: "/pesanan", icon: "clipboard" },
  { key: "profil", label: "Profil", href: "/profil", icon: "user" },
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

// ---------------------------------------------------------------------------
// Inventory status badge config
// ---------------------------------------------------------------------------

export const INVENTORY_STATUS_CONFIG = {
  CRITICAL: {
    label: "Mau Habis! Perlu Belanja",
    shortLabel: "Mau Habis",
    badgeClass: "bg-danger-bg text-danger",
    pillClass: "bg-danger-fill text-white",
    icon: "alert",
  },
  EXPIRED_RISK: {
    label: "Risiko Basi / Rusak",
    shortLabel: "Risiko Basi",
    badgeClass: "bg-warn-bg text-warn",
    pillClass: "bg-warn text-white",
    icon: "clock",
  },
  LOW: {
    label: "Stok Menipis",
    shortLabel: "Menipis",
    badgeClass: "bg-warn-bg text-warn",
    pillClass: "bg-warn text-white",
    icon: "trend-down",
  },
  SAFE: {
    label: "Stok Masih Aman",
    shortLabel: "Aman",
    badgeClass: "bg-brand-100 text-brand-800",
    pillClass: "bg-brand-600 text-white",
    icon: "check-circle",
  },
  OVERSTOCK: {
    label: "Stok Menumpuk",
    shortLabel: "Menumpuk",
    badgeClass: "bg-paper-3 text-ink-2",
    pillClass: "bg-muted text-white",
    icon: "package",
  },
} as const;
