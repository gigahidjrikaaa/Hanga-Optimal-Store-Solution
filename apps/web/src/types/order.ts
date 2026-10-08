/**
 * Hanga — TypeScript types for order drafts and sales records.
 *
 * Mirrors apps/api/app/schemas/order.py (briefing_spec.md §6 write side).
 */

export type OrderStatus = "DRAFTED" | "SENT";

export interface OrderItem {
  sku: string;
  name: string;
  qty: number;
  unit: string;
  est_cost_idr: number;
}

export interface Order {
  id: string;
  shop_id: string;
  created_at: string; // ISO datetime
  scenario: string;
  supplier_ref: string;
  wa_deep_link: string;
  items: OrderItem[];
  est_cost_idr: number;
  status: OrderStatus;
  sent_at?: string | null;
}

export interface SalesRecord {
  date: string;
  quantities: Record<string, number>;
  source: "extraction" | "seed" | "manual";
}
