/**
 * Hanga — TypeScript types for the DailyBriefing JSON contract.
 *
 * These types mirror the Pydantic schemas in apps/api/app/schemas/briefing.py
 * and the contract in docs/briefing_spec.md §2.
 */

// ---------------------------------------------------------------------------
// Enums / Unions
// ---------------------------------------------------------------------------

export type Scenario = "BASELINE" | "LEBARAN_T14" | "PAYDAY_T3" | "RAIN_TOMORROW";

export type ActionType = "REORDER" | "SKIP" | "PROMO" | "HOLD";

export type RiskType = "WASTE_RISK" | "STOCKOUT_RISK";

export type FactorKey =
  | "PAYDAY"
  | "WEEKEND"
  | "RAIN"
  | "RAIN_TOMORROW"
  | "LEBARAN_T14"
  | "LEBARAN_WEEK"
  | "EVENT_KONDANGAN"
  | "EVENT_PASAR"
  | "SCHOOL_TERM"
  | "TREND_UP"
  | "TREND_DOWN"
  | "WASTE_RISK"
  | "LOW_DATA"
  | "CASH_TIGHT";

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

// ---------------------------------------------------------------------------
// Sub-types
// ---------------------------------------------------------------------------

export interface Mover {
  sku: string;
  name: string;
  delta_7d: number;
}

export interface Movers {
  fast: Mover[];
  slow: Mover[];
}

export interface Risk {
  type: RiskType;
  sku: string;
  window: string; // ISO date string
  severity: number; // 1–3
  factor_keys: FactorKey[];
}

export interface Factor {
  key: FactorKey;
  direction: "+" | "-";
  weight: number;
  note_bahasa: string;
}

export interface QuantityRange {
  min: number;
  likely: number;
  max: number;
  unit: string;
}

export interface OrderDraft {
  supplier_ref: string;
  est_cost_idr: number;
  wa_deep_link: string;
}

export interface Recommendation {
  action: ActionType;
  sku: string;
  /** Product display name in Bahasa; UI renders this, never the SKU code (v1.1). */
  name?: string | null;
  /** Cost of the recommended qty.likely; renders even without order_draft (v1.1). */
  est_cost_idr?: number | null;
  qty: QuantityRange;
  confidence: Confidence;
  factors: Factor[];
  rationale_bahasa: string;
  order_draft?: OrderDraft | null;
}

/**
 * Cash-budget fit for this briefing's order bundle (v1.1).
 * Fitted entirely by the compute layer; Gemma only explains it.
 */
export interface Budget {
  cash_available_idr: number;
  committed_idr: number;
  remaining_idr: number; // may be negative in live mode
  deferred_skus: string[];
  note_bahasa: string;
}

export interface BaselineCompare {
  policy: string;
  deltas: Record<string, number>;
}

export interface DataQuality {
  coverage_days: number;
  extraction_confirmed_lines: number;
  flags: string[];
}

// ---------------------------------------------------------------------------
// Root type
// ---------------------------------------------------------------------------

export interface DailyBriefing {
  version: string;
  shop_id: string;
  generated_at: string; // ISO datetime string
  scenario: Scenario;
  headline: string;
  budget?: Budget | null; // v1.1
  movers: Movers;
  risks: Risk[];
  recommendations: Recommendation[];
  baseline_compare?: BaselineCompare | null;
  data_quality?: DataQuality | null;
}
