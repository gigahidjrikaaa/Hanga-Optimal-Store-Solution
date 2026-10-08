/**
 * Hanga — TypeScript types for Tanya Hanga (spec §8).
 *
 * Mirrors apps/api/app/schemas/ask.py.
 */

import type { Confidence, FactorKey } from "./briefing";

export interface AskRequest {
  question_bahasa: string;
}

export interface AskResponse {
  answer_bahasa: string;
  cited_skus: string[];
  factor_keys: FactorKey[];
  confidence: Confidence;
  follow_ups: string[];
}
