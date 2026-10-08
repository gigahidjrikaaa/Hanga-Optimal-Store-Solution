# The Daily Briefing — Data Contract & Interaction Spec (v1.1)

The Daily Briefing is the product's heart: one screen Bu Sari reads in 30 seconds.
This document is the **contract** between the compute layer (B's backend on Cloud Run),
the reasoning model (Gemma 3), Firestore, and the UI (A's frontend). Freeze on Day 1.

> **v1.1 changelog (Sep 27, 2026):** added `name` + `est_cost_idr` on Recommendation;
> added the `budget` block (cash-feasible order bundle); added `CASH_TIGHT` factor key;
> documented compute rules for cash bundling, perishability risk, and cold-start
> priors; added the "Tanya Hanga" grounded-QA contract (§8). All changes are additive —
> a v1.0 consumer renders v1.1 payloads fine under the defensive-rendering rules.

## 1. Pipeline

```
Inputs                     Compute layer (Cloud Run, code)   Reasoning (Gemma 3)        Output
─────────                  ─────────────────────────────     ───────────────────        ──────
Firestore sales history →  7d MA, category totals,       →   Weighs factors, picks  →   Briefing JSON
Weather / calendar         reorder math (lead time +         actions, ranges, Bahasa    →   stored in
factors/{date}             safety stock), perishability      rationale & budget note    →   Firestore
Shop cash (v1.1)           risk, CASH-FEASIBLE bundle        (JSON only, validated)     →   rendered by UI
Scenario parameter         fitting, factor activation                                   →   asked about by
                           scores, confidence                                           Tanya Hanga (§8)
```

**Iron rule:** all arithmetic happens in code. Gemma receives pre-computed aggregates,
factor scores, **and the already-fitted budget block**; it decides *actions, ranges, and
explanations* — never raw math. Gemma can reorder a bundle's explanation but can never
make the bundle exceed the cash.

## 2. `DailyBriefing` JSON schema (v1.1)

```json
{
  "version": "1.1",
  "shop_id": "string",
  "generated_at": "2026-10-10T06:00:00+07:00",
  "scenario": "BASELINE | LEBARAN_T14 | PAYDAY_T3 | RAIN_TOMORROW",
  "headline": "string, ≤80 chars, Bahasa",
  "budget": {
    "cash_available_idr": 2500000,
    "committed_idr": 2412000,
    "remaining_idr": 88000,
    "deferred_skus": ["TEPUNG-TERIGU-1KG"],
    "note_bahasa": "Tepung ditunda ke besok: kas hari ini fokus sirup & biskuit."
  },
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
    "name": "Gula pasir 1kg",
    "est_cost_idr": 171000,
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

**v1.1 field notes**
- `recommendation.name` — product display name in Bahasa. **UI renders `name`, never
  the SKU code** (voice-and-tone rule); fall back to `sku` only if `name` is absent.
- `recommendation.est_cost_idr` — cost of the recommended `qty.likely`. Lets the card
  and the budget bar render even when `order_draft` is null (PROMO/HOLD/SKIP).
- `budget` — see §4 budget rules. `remaining_idr` may be negative in live mode
  (displayed as a warning); seeded demo data always keeps it ≥ 0.

## 3. Factor vocabulary (canonical keys)
`PAYDAY` · `WEEKEND` · `RAIN` · `RAIN_TOMORROW` · `LEBARAN_T14` · `LEBARAN_WEEK` ·
`EVENT_KONDANGAN` · `EVENT_PASAR` · `SCHOOL_TERM` · `TREND_UP` · `TREND_DOWN` ·
`WASTE_RISK` · `LOW_DATA` · `CASH_TIGHT` *(v1.1)* — Gemma may only use these keys;
the UI maps each to an icon + label.

`CASH_TIGHT` is always applied **by the compute layer** to deferred items
(`direction: "-"`), never invented by Gemma.

## 4. Rules
- **Ranges, never point estimates.** `qty.likely` renders with min–max; no fake precision.
- **Factor chips:** show only `|weight| ≥ 0.05`, max 4 per card, sorted by |weight|.
- **Confidence:** computed in code (coverage + agreement), never by the LLM.
- **Rationale:** ≤160 chars, plain Bahasa, no model jargon (never "p=0.83", "SKU-001").
- **Budget rules (v1.1):**
  - The compute layer ranks candidate REORDERs by priority score (risk severity ×
    velocity, perishables weighted up) and greedily funds them within
    `cash_available_idr`. Anything unfunded keeps `action: REORDER` but is listed in
    `budget.deferred_skus`, gets a `CASH_TIGHT` factor, and its rationale says *when*
    to order it (e.g. "besok, setelah uang penjualan masuk"). **Deferral is visible,
    never silent, and never demotes the item to SKIP.**
  - `budget.note_bahasa`: ≤120 chars, plain Bahasa, explains fit and deferrals.
  - Demo invariant: `committed_idr ≤ cash_available_idr` and `remaining_idr ≥ 0`.
  - **Cash parameter (v1.1):** the briefing endpoint accepts
    `?cash_available_idr=<int>` — the order bundle is re-fitted in pure code
    (§6.1) for any cash value, on top of authored or computed briefings.
    Deferral is always visible: every card carrying a `CASH_TIGHT` chip appears
    in `budget.deferred_skus`, and vice versa.
- **Scenario toggle** re-runs compute with scenario context injected + fresh Gemma call —
  except demo mode, where all scenarios are pre-computed and stored in Firestore.
- **Ordering:** cards sorted REORDER → PROMO → HOLD → SKIP (enforced client-side);
  max 5 cards per briefing.

## 5. Gemma call skeleton (system prompt excerpt)

```
You are the inventory advisor for a small Indonesian shop (warung).
You receive: JSON with sales aggregates, reorder math, factor scores,
and a cash-budget fit computed by code.
Rules:
- Output ONLY valid JSON matching the provided schema. No prose outside JSON.
- Use only the canonical factor keys provided.
- Ranges, not point estimates. Never invent numbers not present in inputs.
- The budget is final: you may explain deferrals (CASH_TIGHT) but never un-defer
  them or raise quantities beyond the given ranges.
- rationale_bahasa: simple Bahasa Indonesia, warm, ≤160 chars.
- Actions: REORDER / SKIP / PROMO / HOLD per sku, consistent with the math given.
```

**Validation loop:** parse → pydantic → on failure, retry once with the error appended
→ on second failure, render template briefing (pre-written, factors filled by code).

## 6. Compute layer rules (v1.1)

1. **Cash-feasible bundle.** Given candidate REORDERs with `est_cost_idr` and cash
   `C`: sort by priority score, accumulate while `committed + cost ≤ C`; the rest are
   deferred per §4. The fitted `budget` block is an *input* to the Gemma call, not an
   output of it.
2. **Perishability risk.** From `catalog/{sku}.shelf_days` and stock cover:
   `stock_cover_days < shelf_days_remaining` → `WASTE_RISK`, severity 1 if cover is
   within 1.5× shelf life, 2 within 1.0×, 3 if already past. This runs in code for
   every perishable SKU — RiskBanner content is *derived*, never authored.
3. **Cold-start prior.** If `coverage_days < 14`: synthesize the first briefing from
   catalog analogs (perishability, category velocity) instead of sales history; flag
   `LOW_DATA`; cap `confidence` at MEDIUM; say so in `data_quality.flags`. The shop's
   own data takes over automatically once coverage ≥ 14.
4. **Confidence.** Unchanged from v1.0: coverage + factor agreement, computed in code.

## 7. Firestore collections

| Path | Content | Written by |
|---|---|---|
| `shops/{shopId}` | Profile, supplier, cold-start answers, `cash_available_idr` (v1.1) | Frontend |
| `shops/{shopId}/sales/{date}` | Daily per-SKU quantities | Extraction pipeline |
| `shops/{shopId}/extractions/{id}` | Storage photo ref, raw model JSON, confirmed lines | Pipeline + ConfirmSheet |
| `shops/{shopId}/briefings/{date}_{scenario}` | Full `DailyBriefing` JSON incl. `budget` | Cloud Run agent |
| `shops/{shopId}/asks/{id}` | (v1.1, optional) Tanya Hanga question/answer logs | Cloud Run agent |
| `shops/{shopId}/orders/{id}` | Order drafts + status | Frontend |
| `catalog/{sku}` | SKU dictionary: name, unit, category, perishability, shelf days | Seeded |
| `factors/{date}` | Weather, holiday, event flags | Seeded / scheduled |

**Access pattern:** frontend listens to `briefings/{today}_{scenario}` snapshots;
Cloud Run writes with a service account; no client-side writes to briefings.

## 8. Tanya Hanga — grounded Q&A contract (v1.1)

One endpoint, one grounding rule: **an answer may only use numbers and factors present
in the stored briefing for that date + scenario.** The briefing JSON is the context
window; nothing else exists.

```
POST /api/v1/shops/{shop_id}/briefings/{briefing_date}/ask?scenario=BASELINE
{ "question_bahasa": "Kenapa cuma 12 kg telur?" }

→ 200
{
  "answer_bahasa": "Karena 12 kg cukup untuk Sabtu: perputaran cepat, sisa 4 kg di rak,
                    dan akhir pekan ramai. Kalau ramai banget, aman sampai 15 kg.",
  "cited_skus": ["TELUR-1KG"],
  "factor_keys": ["WEEKEND", "TREND_UP"],
  "confidence": "HIGH",
  "follow_ups": ["Kenapa tidak 20 kg?", "Kapan harus pesannya?"]
}
```

Rules:
- `answer_bahasa` ≤ 240 chars, plain Bahasa, warm tone; voice-out via TTS is the
  default render, transcript shown simultaneously (low-literacy friendly).
- Out-of-briefing questions get an honest deflection referencing the card
  ("Angka itu belum ada di briefing hari ini — cek kartu gula ya, Bu.") — never a
  hallucinated number.
- Implementation: Gemini (or Gemma) receives *only* the stored briefing JSON + the
  question; system prompt enforces the no-new-numbers rule; response schema-validated.
- Demo mode: pre-baked Q&A pairs per scenario served from Firestore/seed — the QA log
  collection `asks/{id}` stays optional.
- Target: typed answer < 5s, voice round-trip < 10s.

## 9. Versioning
Schema version bumps on any breaking field change; **v1.1 is additive** (new optional
fields, one new factor key, new optional endpoint). Frontend must tolerate unknown
extra fields and missing optional ones (defensive rendering).
