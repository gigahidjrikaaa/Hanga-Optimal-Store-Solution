# PRD — Hanga: Optimal Store Solution

> **Inventory intelligence for shops that run on paper, cash, and instinct.**

**Status:** v1.0 · **Team:** 2 (A = Product/UI, B = AI/Backend) · **Submission deadline:** Oct 18, 2026
**Theme:** Retail & Commerce — Intelligent Customer and Business Experiences
**Competition:** Google Cloud AI Builder Cup 2026 (powered by Hack2skill)

## 0. Stack (final)

| Layer | Technology |
|---|---|
| Reasoning & explanation | **Gemma 3** via Gemini API (prompts prototyped in Google AI Studio) |
| Vision extraction | **Gemini Flash** (multimodal) via Gemini API |
| Frontend | Next.js PWA → **Firebase App Hosting** |
| Agent backend | **Cloud Run** (container: compute layer + model calls) |
| Database | **Firestore** (native mode) |
| Media | **Firebase Storage** (notebook photos, voice clips) |
| Notifications | WhatsApp deep links (no API dependency) |

**Deployment targets comply with hackathon rules:** all compute on Google Cloud;
frontend served via Firebase; models limited to Gemini/Gemma family.

## 1. Problem
Indonesia's ~65M MSMEs run inventory on paper notebooks and instinct. They overstock
perishables (cash wasted) and understock fast-movers (sales lost). Generic forecasting
tools fail because (a) there is no digital data to learn from, (b) demand is driven by
local context — payday cycles, Ramadan/Lebaran, rain, neighborhood events — that generic
models ignore, and (c) the binding constraint is cash and shelf life, not "demand."

## 2. Target user (ONE archetype)
**Bu Sari, warung kelontong owner** — Android phone, WhatsApp-native, keeps a paper
sales notebook, restocks 2–3x/week from a wholesaler via WhatsApp. One user, built deep.

## 3. Goals / Non-goals

**Goals**
- Notebook photo → structured sales data in under 60s (with human confirm step)
- Daily briefing the owner understands in under 30s, in Bahasa Indonesia, with visible reasoning
- One-tap restock order draft via WhatsApp deep link
- Scenario intelligence: Lebaran +14d, payday, rain — recommendations visibly invert

**Non-goals**
- POS replacement, payments, bookkeeping
- Real wholesaler API integration (WhatsApp deep link IS the integration)
- Native app / Play Store (PWA now; TWA on roadmap)
- Multi-shop accounts, real multi-user auth

## 4. User stories (P0)
1. As Bu Sari, I photograph my sales notebook and confirm the extracted items, so my data exists without a POS.
2. As Bu Sari, I open the app each morning and see a 30-second briefing: what's moving, what's at risk, what to order.
3. As Bu Sari, I see *why* the app recommends an order (payday, rain, event) so I can trust or override it.
4. As Bu Sari, I tap once to draft a WhatsApp order to my wholesaler with items and quantities filled in.
5. As Bu Sari, I flip "Lebaran +14 hari" and see recommendations invert, so I can plan the season.

## 5. Features

| Priority | Feature | Demo arc |
|---|---|---|
| P0 | Cold-start interview (voice/tap, 2 min) | Establishes shop profile |
| P0 | Notebook photo → SKU extraction (Gemini Flash) + ConfirmSheet | Wow moment #1 |
| P0 | Daily Briefing screen (movers, risks, recommendations, factor trace) | Core product |
| P0 | Restock order draft → WhatsApp deep link | Closing the loop |
| P0 | Scenario toggle (BASELINE / LEBARAN_T14 / PAYDAY_T3 / RAIN_TOMORROW) | Wow moment #2 |
| P0 | Seeded fallback demo mode (pre-computed briefings in Firestore) | Demo insurance |
| P1 | Baseline comparison (agent vs 7-day moving average) | Technical merit |
| P1 | Extraction accuracy page (F1 on hand-labeled set) | Credibility |
| P1 | PWA: add-to-home-screen, offline cache of last briefing | Resilience story |
| P2 | Shelf photo stock count; Javanese honorifics; supplier price check | Roadmap slide |

## 6. Demo metrics (what "working" means)
- Extraction: confirm-time < 60s for a 20-line notebook page; SKU F1 ≥ 0.85 on labeled set
- Briefing: generated < 15s end-to-end; scenario re-render < 8s (pre-computed in demo mode)
- Decision quality (30-day policy backtest vs baseline, synthetic): waste −20%, stockouts −40% (targets)
- Demo reproducibility: 100% via seeded mode; zero live-API dependency on stage

## 7. Judging alignment

| Criterion (weight) | How we score it |
|---|---|
| Technical Merit & Gen AI (40%) | Hybrid architecture: code computes aggregates, Gemma reasons & explains; extraction pipeline with schema validation + retry; baseline comparison; policy backtest |
| Problem Alignment & Impact (25%) | Paper-notebook reality; 65M MSMEs; measured waste/stockout deltas in simulation |
| Innovation & Creativity (25%) | Notebook-to-data ingestion; scenario intelligence; local-context factor model global tools lack |
| UX & Solution Design (10%) | 30-second briefing, Bahasa-first, low-literacy friendly, one-hand reach |

## 8. Firestore data model (summary)

```
shops/{shopId}                     profile, supplier ref, cold-start answers
shops/{shopId}/sales/{date}        daily per-SKU quantities (from extraction)
shops/{shopId}/extractions/{id}    photo ref, raw OCR JSON, confirmed lines, confidence
shops/{shopId}/briefings/{date}    DailyBriefing JSON per scenario (see 02-briefing-spec)
shops/{shopId}/orders/{id}         order drafts, status (DRAFTED/SENT)
catalog/{sku}                      shared SKU dictionary (name, unit, category, perishability)
factors/{date}                     holiday/event/weather factor records
```

## 9. Timeline
- **W1 (Sep 29–Oct 5):** contracts frozen, walking skeleton deployed, extraction prototype on 5 real photos, synthetic data generator v1. ⚠️ Lock team registration before **Oct 11**.
- **W2 (Oct 6–12):** real pipelines, agent tools, scenario toggle, WhatsApp deep link. Feature-complete-ish Oct 12.
- **W3 (Oct 13–18):** **feature freeze Oct 15**. Video, deck, README, rehearsals, deploy hardening. Submit **Oct 18**.

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Gemma JSON output unreliable | Pydantic validation + 1 retry with error appended; template-briefing fallback |
| Vision accuracy poor on handwriting | Test Gemma 3 vs Gemini Flash on 20 labeled photos week 1; pick winner; ConfirmSheet absorbs errors |
| API quota exhaustion during judging | Fixtures + seeded mode; never call live APIs on stage |
| Camera/API fails live | Fallback mode one toggle away (3s long-press on logo) |
| Scope creep | Kanban discipline: demo-critical cards only |

## 11. Rule compliance (self-check)
- ✅ Models: Gemma 3 + Gemini Flash — both explicitly allowed
- ✅ Deployment: Firebase + Cloud Run — mandated targets
- ✅ Fresh build within hackathon window; one team, one theme
- ✅ Materials in English; deck as PDF; 3-min video; public GitHub repo