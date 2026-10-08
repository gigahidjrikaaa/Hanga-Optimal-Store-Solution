# Hanga — TODO

Working checklist for the run-up to feature freeze (**Oct 15**) and submission
(**Oct 18**). PRD: `docs/prd_hanga.md` §10 timeline.

## 🔑 BLOCKER — live model calls need a real key + confirmed model IDs

The Gemma 4 **vision model ID has not been confirmed**. Code defaults to
`gemma-4-27b-it` but this is a guess — do not deploy extraction against it
before verifying.

1. [ ] Get a real **Google AI Studio API key** (aistudio.google.com → Get API key)
2. [ ] Put it in `apps/api/.env` → `HANGA_GEMINI_API_KEY=...`
3. [ ] Run the bundled verifier from `apps/api/`:
       `python scripts/verify_models.py`
       It lists every Gemma model the key can see with its **exact ID** and
       supported actions (look for the multimodal Gemma 4 → supports
       `generateContent`).
4. [ ] Set the confirmed ID in `apps/api/.env`:
       `HANGA_VISION_MODEL=<exact-id>` (also check `HANGA_GEMMA_MODEL` for the
       reasoning model while you're there)
5. [ ] Test `extract_notebook` on one real notebook photo (ConfirmSheet flow)
6. [ ] Rehearse the live path once, then flip back to `HANGA_DEMO_MODE=true`
       for the stage (demo never depends on live APIs)

Related comments: `apps/api/app/config.py` (`vision_model`),
`apps/api/.env.example`, `apps/api/scripts/verify_models.py`.

## P0 — before freeze

- [ ] **Run the actual deployment** per `docs/DEPLOY.md` (configs are ready:
      `apps/web/apphosting.yaml`, Cloud Run command, `scripts/seed_demo.py`)
      — needs a real Firebase project
- [ ] Rehearse the 3 wow moments end-to-end in demo mode: capture→confirm,
      scenario flip, cash slider; then the 4th: 🎤 Tanya Hanga
- [x] ~~Onboarding: save profile + "Berapa kas hari ini?" question~~
      (saves via PUT /shops/{id}/profile, prefills the CashBudgetBar)
- [x] ~~Client-side card sort REORDER → PROMO → HOLD → SKIP~~ (Beranda)

## P1 — credibility / polish

- [ ] Extraction F1 page on the hand-labeled photo set (PRD §6)
- [ ] 30-day policy backtest → fills `baseline_compare.deltas` (currently empty
      in the computed path; frontend hides the footnote until then)
- [ ] PWA service worker + offline briefing cache + OfflineBanner
- [ ] Storage upload of notebook photos (bytes currently discarded;
      `photo_storage_path` is fabricated)
