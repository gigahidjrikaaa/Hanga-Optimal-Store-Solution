/**
 * Hanga — TypeScript types for the extraction pipeline.
 *
 * Mirrors apps/api/app/schemas/extraction.py.
 */

export type ExtractionStatus =
  | "PENDING"
  | "PROCESSING"
  | "REVIEW"
  | "CONFIRMED"
  | "FAILED";

export interface ExtractedLine {
  name: string;
  qty: number;
  unit: string;
  matched_sku?: string | null;
  model_confidence: number;
}

export interface Extraction {
  id: string;
  shop_id: string;
  created_at: string; // ISO datetime
  photo_storage_path: string;
  status: ExtractionStatus;
  raw_model_json?: Record<string, unknown> | null;
  lines: ExtractedLine[];
  confirmed_at?: string | null; // ISO datetime
}

export type CatalogCategory =
  | "BAHAN_POKOK"
  | "MINUMAN"
  | "SNACK"
  | "BUMBU"
  | "PERAWATAN"
  | "LAINNYA";

export interface CatalogItem {
  sku: string;
  name: string;
  unit: string;
  category: CatalogCategory;
  perishable: boolean;
  shelf_days?: number | null;
}
