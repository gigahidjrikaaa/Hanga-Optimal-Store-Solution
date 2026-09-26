# The Daily Briefing — Data Contract & Interaction Spec (v1.0)

The Daily Briefing is the product's heart: one screen Bu Sari reads in 30 seconds.
This document is the **contract** between the compute layer (B's backend on Cloud Run),
the reasoning model (Gemma 3), Firestore, and the UI (A's frontend). Freeze on Day 1.

## 1. Pipeline

```
Inputs                     Compute layer (Cloud Run, code)   Reasoning (Gemma 3)        Output
─────────                  ─────────────────────────────     ───────────────────        ──────
Firestore sales history →  7d MA, category totals,       →   Weighs factors, picks  →   Briefing JSON
Weather / calendar         reorder math (lead time +         actions, writes Bahasa   →   stored in
factors/{date}             safety stock), factor             rationale & ranges         Firestore
Scenario parameter         activation scores                 (JSON only, validated)   →   rendered by UI
```

**Iron rule:** all arithmetic happens in code. Gemma receives pre-computed aggregates
and factor scores; it decides *actions, ranges, and explanations* — never raw math.

## 2. `DailyBriefing` JSON schema (v1)

```json
{
  "version": "1.0",
  "shop_id": "string",
  "generated_at": "2026-10-10T06:00:00+07:00",
  "scenario": "BASELINE | LEBARAN_T14 | PAYDAY_T3 | RAIN_TOMORROW",
  "headline": "string, ≤80 chars, Bahasa",
  "movers": {
    "fast": [{ "sku": "GULA-1KG", "name": "Gula pasir 1kg", "delta_7d": 0.22 }],
    "slow": [{ "sku": "SUSU-UHT-1L", "name": "Susu UHT 1L", "delta_7d": -0.31 }]
  },
  "risks": [{
    "type": "WASTE_RISK | STOCKOUT_RISK",
    "sku": "TELUR-TRAY",
    "window": "2026-10-12",
    "severity": 1,
    "factor_keys": ["RAIN_TOMORROW", "WEEKEND"]
  }],
  "recommendations": [{
    "action": "REORDER | SKIP | PROMO | HOLD",
    "sku": "GULA-1KG",
    "qty": { "min": 8, "likely": 12, "max": 15, "unit": "kg" },
    "confidence": "HIGH | MEDIUM | LOW",
    "factors": [
      { "key": "PAYDAY", "direction": "+", "weight": 0.18, "note_bahasa": "gajian 28 Okt" },
      { "key": "RAIN_TOMORROW", "direction": "-", "weight": -0.10, "note_bahasa": "hujan, pengunjung turun" }
    ],
    "rationale_bahasa": "Pesan 12 kg gula: gajian 28 Okt menaikkan permintaan, meski hujan besok sedikit menekan.",
    "order_draft": {
      "supplier_ref": "TOKO GROSIR JAYA",
      "est_cost_idr": 171000,
      "wa_deep_link": "https://wa.me/62812xxxx?text=..."
    }
  }],
  "baseline_compare": {
    "policy": "7d_moving_avg",
    "deltas": { "waste_pct": -18, "stockout_pct": -35 }
  },
  "data_quality": {
    "coverage_days": 90,
    "extraction_confirmed_lines": 214,
    "flags": ["SUSU-UHT-1L: only 11 observations"]
  }
}
```

## 3. Factor vocabulary (canonical keys)
`PAYDAY` · `WEEKEND` · `RAIN` · `LEBARAN_T14` · `LEBARAN_WEEK` · `EVENT_KONDANGAN`
· `EVENT_PASAR` · `SCHOOL_TERM` · `TREND_UP` · `TREND_DOWN` · `WASTE_RISK` ·
`LOW_DATA` — Gemma may only use these keys; the UI maps each to an icon + label.

## 4. Rules
- **Ranges, never point estimates.** `qty.likely` renders with min–max; no fake precision.
- **Factor chips:** show only `|weight| ≥ 0.05`, max 4 per card, sorted by |weight|.
- **Confidence:** computed in code (coverage + agreement), never by the LLM.
- **Rationale:** ≤160 chars, plain Bahasa, no model jargon (never "p=0.83", "SKU-001").
- **Scenario toggle** re-runs compute with scenario context injected + fresh Gemma call —
  except demo mode, where all scenarios are pre-computed and stored in Firestore.
- **Ordering:** cards sorted REORDER → PROMO → HOLD → SKIP; max 5 cards per briefing.

## 5. Gemma call skeleton (system prompt excerpt)

```
You are the inventory advisor for a small Indonesian shop (warung).
You receive: JSON with sales aggregates, reorder math, and factor scores.
Rules:
- Output ONLY valid JSON matching the provided schema. No prose outside JSON.
- Use only the canonical factor keys provided.
- Ranges, not point estimates. Never invent numbers not present in inputs.
- rationale_bahasa: simple Bahasa Indonesia, warm, ≤160 chars.
- Actions: REORDER / SKIP / PROMO / HOLD per sku, consistent with the math given.
```

**Validation loop:** parse → pydantic → on failure, retry once with the error appended
→ on second failure, render template briefing (pre-written, factors filled by code).

## 6. Firestore collections

| Path | Content | Written by |
|---|---|---|
| `shops/{shopId}` | Profile, supplier, cold-start answers | Frontend |
| `shops/{shopId}/sales/{date}` | Daily per-SKU quantities | Extraction pipeline |
| `shops/{shopId}/extractions/{id}` | Storage photo ref, raw model JSON, confirmed lines | Pipeline + ConfirmSheet |
| `shops/{shopId}/briefings/{date}_{scenario}` | Full `DailyBriefing` JSON | Cloud Run agent |
| `shops/{shopId}/orders/{id}` | Order drafts + status | Frontend |
| `catalog/{sku}` | SKU dictionary: name, unit, category, perishability, shelf days | Seeded |
| `factors/{date}` | Weather, holiday, event flags | Seeded / scheduled |

**Access pattern:** frontend listens to `briefings/{today}_{scenario}` snapshots;
Cloud Run writes with a service account; no client-side writes to briefings.

## 7. Versioning
Schema version bumps on any breaking field change. Frontend must tolerate unknown
extra fields and missing optional ones (defensive rendering).