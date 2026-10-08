/**
 * Hanga — shared frontend constants.
 *
 * The demo shop id and pinned demo date (design_system.md §5: DEMO_DATE pins
 * all dates). NEXT_PUBLIC_DEMO_DATE overrides for rehearsal runs.
 */

export const DEMO_SHOP_ID = "warung-bu-sari";

export const DEMO_DATE =
  process.env.NEXT_PUBLIC_DEMO_DATE ?? "2026-10-10";
