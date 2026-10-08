# PRD — Hanga: Optimal Store Solution

> **Inventory intelligence for shops that run on paper, cash, and instinct.**

**Status:** v1.1 · **Team:** 2 (A = Product/UI, B = AI/Backend) · **Submission deadline:** Oct 18, 2026
**Theme:** Retail & Commerce — Intelligent Customer and Business Experiences
**Competition:** Google Cloud AI Builder Cup 2026 (powered by Hack2skill)

> **v1.1 changelog (Sep 27, 2026):** added competitive gap analysis (§3); cash-first
> advisor (cash-budget-feasible order bundles) as P0; "Tanya Hanga" conversational
> Q&A as P1; perishability-aware risk engine as P0; cold-start prior briefings as P1;
> owner authentication (Firebase Auth email/Google + demo bypass) as P0;
> post-hackathon roadmap (§13). Contract bumped to v1.1 in `briefing_spec.md`.

## 0. Stack (final)

| Layer | Technology |
|---|---|
| Reasoning & explanation | **Gemma 3** via Gemini API (prompts prototyped in Google AI Studio) |
| Vision extraction | **Gemma 4** (multimodal, AI Studio free tier) via Gemini API — zero-cost extraction; Gemini Flash kept as configured fallback |
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
No existing tool treats any of these three as first-class inputs.

## 2. Target user (ONE archetype)
**Bu Sari, warung kelontong owner** — Android phone, WhatsApp-native, keeps a paper
sales notebook, restocks 2–3x/week from a wholesaler via WhatsApp. One user, built deep.
Her capital is a drawer of cash, not a credit line: every ordering decision is a
"will this cash come back before I need it again?" decision.

## 3. Why Hanga is new (competitive gap)

Landscape research (Sep 2026) and where Hanga sits against it:

| What exists | What nobody ships | Hanga's answer |
|---|---|---|
| Digital ledgers (BukuWarung, Khatabook, Vyapar) digitized the *record* — but the owner types everything in | **Photo-to-data ingestion.** No shipped product reads a handwritten notebook into structured sales data | Capture → Gemini Flash extraction → ConfirmSheet (human-in-the-loop) |
| POS suites & EDC hardware (Moka, Majoo) serve the already-digitized minority | A **decision layer** for the paper-native owner — everyone digitized records, none advises | Daily Briefing: 30-second, Bahasa-first, computed in code, explained by Gemma |
| Demand-forecasting SaaS assumes digital history | **Cash-first ordering.** Cash-constrained inventory is a mature OR literature (budget-constrained newsvendor, trade credit) with **zero product implementations** | `budget` block: recommendations form a bundle that fits the cash Bu Sari actually has; overflow is deferred *visibly*, never hidden |
| Pooled micro-retail BI (Packworks Sari IQ) — analytics *about* stores | An agent that advises **one** owner in her language, on her context | Per-shop factor model: payday, Lebaran, rain, events — with visible scenario inversion |
| Static explanations, at best | **Conversational trust.** No micro-retail tool lets the owner interrogate a recommendation by voice | "Tanya Hanga": tap-to-talk follow-ups grounded strictly in the stored briefing |

**Positioning line:** digitize the record → advise the decision → speak the owner's
language. Competitors stop at step one.

**Post-hackathon trajectory (§13):** Hanga becomes the bridge that makes a warung
*machine-readable* for the agentic-commerce wave (AI procurement agents) — a position
no incumbent ledger app is built for.

## 4. Goals / Non-goals

**Goals**
- **Owner sign-in (v1.1):** Firebase Auth (email/password + Google) guarding the app, with a one-tap demo session so the seeded demo and stage flow never depend on a live project; the API verifies ID tokens and enforces shop ownership
- Notebook photo → structured sales data in under 60s (with human confirm step)
- Daily briefing the owner understands in under 30s, in Bahasa Indonesia, with visible reasoning
- One-tap restock order draft via WhatsApp deep link
- Scenario intelligence: Lebaran +14d, payday, rain — recommendations visibly invert
- **Cash-fit ordering (v1.1):** recommendations form a bundle that fits today's cash; anything that doesn't fit is deferred with a plain-Bahasa reason, never silently dropped
- **Conversational trust (v1.1):** the owner can ask "kenapa cuma 12 kg?" by voice or text and get a grounded answer from the same factor trace

**Non-goals**
- POS replacement, payments, bookkeeping
- Real wholesaler API integration (WhatsApp deep link IS the integration)
- Native app / Play Store (PWA now; TWA on roadmap)
- Multi-shop accounts (auth is per-owner; one shop per owner for now)
- Live WhatsApp Business API / push notifications (deep links only, for now)

## 5. User stories (P0)
1. As Bu Sari, I photograph my sales notebook and confirm the extracted items, so my data exists without a POS.
2. As Bu Sari, I open the app each morning and see a 30-second briefing: what's moving, what's at risk, what to order.
3. As Bu Sari, I see *why* the app recommends an order (payday, rain, event) so I can trust or override it.
4. As Bu Sari, I tap once to draft a WhatsApp order to my wholesaler with items and quantities filled in.
5. As Bu Sari, I flip "Lebaran +14 hari" and see recommendations invert, so I can plan the season.
6. **(v1.1)** As Bu Sari, I set today's cash (or say it) and the briefing shows which orders fit, what it leaves me, and what to postpone until cash comes in — so I never order more than my drawer can pay for.
7. **(v1.1)** As Bu Sari, I press "Tanya" on a card and ask why the quantity is what it is, by voice, and hear a plain-Bahasa answer grounded in the same numbers on screen.
8. **(v1.1)** As Bu Sari, I sign in once with my email or Google (or one tap in demo mode), and only I can see my shop's data.

## 6. Features

| Priority | Feature | Demo arc |
|---|---|---|
| P0 | **Owner auth (v1.1):** /masuk screen — Firebase Auth email/Google, animated "warung buka pagi" scene with rolling-shutter success; FastAPI verifies Bearer ID tokens + shop-ownership guard; one-tap demo session bypass | Trust from the first screen |
| P0 | Cold-start interview (voice/tap, 2 min) — now captures today's available cash | Establishes shop profile + budget |
| P0 | Notebook photo → SKU extraction (Gemini Flash) + ConfirmSheet | Wow moment #1 |
| P0 | Daily Briefing screen (movers, risks, recommendations, factor trace) | Core product |
| P0 | **CashBudgetBar + budget-feasible order bundle** (`budget` block, deferred items with CASH_TIGHT chip) | **Wow moment #3** — drag cash down, watch the plan re-prioritize honestly |
| P0 | Restock order draft → WhatsApp deep link | Closing the loop |
| P0 | **Perishability-aware risk engine** (WASTE_RISK derived from `shelf_days` × stock cover in code) | RiskBanner becomes *computed*, not authored — proves the "code computes, Gemma explains" architecture |
| P0 | Scenario toggle (BASELINE / LEBARAN_T14 / PAYDAY_T3 / RAIN_TOMORROW) | Wow moment #2 |
| P0 | Seeded fallback demo mode (pre-computed briefings in Firestore + client bundle) | Demo insurance |
| P1 | **Tanya Hanga** — grounded voice/text Q&A per recommendation card | Trust through dialogue; low-literacy story made real |
| P1 | **Cold-start prior briefing** — catalog-analog briefings when `coverage_days < 14`, flagged LOW_DATA | Empty state becomes a demo moment |
| P1 | Baseline comparison (agent vs 7-day moving average) | Technical merit |
| P1 | Extraction accuracy page (F1 on hand-labeled set) | Credibility |
| P1 | PWA: add-to-home-screen, offline cache of last briefing | Resilience story |
| P2 | Shelf photo stock count; Javanese honorifics; supplier price check | Roadmap slide |

**Sequencing note (feature freeze Oct 15):** cash-budget bundle and perishability
engine are small compute-layer additions that make existing screens *derived* — do
them first. Tanya Hanga reuses the stored briefing as grounding context; build after
the compute layer is stable.

## 7. Demo metrics (what "working" means)
- Extraction: confirm-time < 60s for a 20-line notebook page; SKU F1 ≥ 0.85 on labeled set
- Briefing: generated < 15s end-to-end; scenario re-render < 8s (pre-computed in demo mode)
- **Budget (v1.1):** cash slider re-render < 8s (pre-computed); invariant — in every seeded scenario, `committed_idr ≤ cash_available_idr` and every deferred SKU appears in `budget.deferred_skus` with a visible reason
- **Tanya Hanga (v1.1):** typed answer < 5s; voice round-trip < 10s; 100% of answers cite only numbers present in the stored briefing (grounded-QA invariant, spot-checked in rehearsal)
- Decision quality (30-day policy backtest vs baseline, synthetic): waste −20%, stockouts −40% (targets); **cash: zero infeasible orders recommended (by construction)**
- Demo reproducibility: 100% via seeded mode; zero live-API dependency on stage

## 8. Judging alignment

| Criterion (weight) | How we score it |
|---|---|
| Technical Merit & Gen AI (40%) | Hybrid architecture: code computes aggregates, reorder math, **cash-feasible bundling and perishability risk**, Gemma reasons & explains; extraction pipeline with schema validation + retry; **grounded conversational QA over the stored briefing**; baseline comparison; policy backtest |
| Problem Alignment & Impact (25%) | Paper-notebook reality; 65M MSMEs; **cash-drawer economics honored, not ignored**; measured waste/stockout deltas in simulation |
| Innovation & Creativity (25%) | Notebook-to-data ingestion (unshipped anywhere); **cash-first advisor (OR literature, zero product implementations)**; scenario intelligence from local context; conversational trust |
| UX & Solution Design (10%) | 30-second briefing, Bahasa-first, low-literacy friendly (voice Q&A), one-hand reach |

## 9. Firestore data model (summary)

```
shops/{shopId}                     profile, supplier ref, owner_uid (v1.1 — Firebase UID),
                                   cold-start answers, cash_available_idr (v1.1 — today's spendable cash)
shops/{shopId}/sales/{date}        daily per-SKU quantities (from extraction)
shops/{shopId}/extractions/{id}    photo ref, raw OCR JSON, confirmed lines, confidence
shops/{shopId}/briefings/{date}    DailyBriefing JSON per scenario, incl. budget block
shops/{shopId}/asks/{id}           (v1.1, optional) Tanya Hanga Q&A logs for offline analysis
shops/{shopId}/orders/{id}         order drafts, status (DRAFTED/SENT)
catalog/{sku}                      shared SKU dictionary (name, unit, category, perishability, shelf_days)
factors/{date}                     holiday/event/weather factor records
```

## 10. Timeline
- **W1 (Sep 29–Oct 5):** contracts frozen (**v1.1 done Sep 27**), walking skeleton deployed, extraction prototype on 5 real photos, synthetic data generator v1. ⚠️ Lock team registration before **Oct 11**.
- **W2 (Oct 6–12):** real pipelines, compute layer (aggregates, reorder math, **cash bundle, perishability risk**), scenario toggle, WhatsApp deep link, Tanya Hanga. Feature-complete-ish Oct 12.
- **W3 (Oct 13–18):** **feature freeze Oct 15**. Video, deck, README, rehearsals, deploy hardening. Submit **Oct 18**.

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Gemma JSON output unreliable | Pydantic validation + 1 retry with error appended; template-briefing fallback |
| Vision accuracy poor on handwriting | **Gemma 4 (free tier) on 20 labeled photos week 1**; confirm the exact model ID via `client.models.list()`; ConfirmSheet absorbs errors; Gemini Flash is the configured fallback (`HANGA_VISION_MODEL`) |
| API quota exhaustion during judging | Fixtures + seeded mode; never call live APIs on stage |
| Camera/API fails live | Fallback mode one toggle away (3s long-press on logo) |
| **Venue noise breaks voice demo (v1.1)** | Tanya Hanga always shows a text-input fallback; rehearse both paths |
| **Auth blocker on stage (v1.1)** | One-tap demo session is always on the /masuk screen; API demo bypass (`HANGA_DEMO_MODE`) is default-on; rehearse the live Firebase path separately |
| **Budget numbers inconsistent on stage (v1.1)** | Seeded invariants (`committed ≤ cash`, deferred lists match) covered by tests; budget arithmetic lives in code, never in Gemma |
| Scope creep | Kanban discipline: demo-critical cards only; v1.1 additions sized ≤ 3 dev-days each |

## 12. Rule compliance (self-check)
- ✅ Models: Gemma 3 (reasoning) + Gemma 4 (vision, free tier) — Gemini/Gemma family as required; Gemini Flash configured as fallback
- ✅ Deployment: Firebase + Cloud Run — mandated targets
- ✅ Fresh build within hackathon window; one team, one theme
- ✅ Materials in English; deck as PDF; 3-min video; public GitHub repo

## 13. Roadmap (post-hackathon — one deck slide)
1. **Community priors:** pooled analog forecasting across shops (the technique behind zero-shot forecasting, implemented with Gemini/Gemma + Firestore aggregates) — day-one advice for every new warung.
2. **Agentic-commerce bridge:** Hanga's confirmed catalog + stock state becomes a machine-readable profile so the shop can transact with the AI procurement agents now legally established and moving into B2B ordering. The warung, agent-ready.
3. **WhatsApp-native briefing push:** morning briefing delivered as a chat (deep links only), answers come back as replies — the app becomes optional.
4. **Trust-calibration study:** measure whether factor chips + Tanya Hanga change override rates and outcomes; publish the method as a credibility artifact.
5. **TWA on Play Store; Javanese honorifics; supplier price check.**
