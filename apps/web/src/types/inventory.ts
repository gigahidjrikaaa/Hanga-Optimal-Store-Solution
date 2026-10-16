/**
 * Inventory Types for Hanga store management.
 */

export type InventoryStatus =
  | "CRITICAL"
  | "LOW"
  | "SAFE"
  | "OVERSTOCK"
  | "EXPIRED_RISK";

export interface InventoryItem {
  sku: string;
  name: string;
  category: string;
  unit: string;
  stock_qty: number;
  unit_cost_idr: number;
  total_value_idr: number;
  daily_velocity: number;
  days_of_coverage: number;
  safety_stock: number;
  status: InventoryStatus;
  perishable: boolean;
  shelf_days: number | null;
  pack_display?: string | null;
  supplier_ref?: string | null;
}

export interface InventoryOverview {
  shop_id: string;
  total_skus: number;
  total_inventory_value_idr: number;
  low_stock_count: number;
  waste_risk_count: number;
  safe_stock_count: number;
  items: InventoryItem[];
}
