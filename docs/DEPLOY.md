# Deploying Hanga

Targets per hackathon rules: **Firebase App Hosting** (web) + **Cloud Run**
(API), models limited to the Gemini/Gemma family. Budget ~30 minutes the
first time; the demo itself never depends on live APIs
(`HANGA_DEMO_MODE=true` is the stage default).

## 0. Prerequisites

- A Google Cloud project with **billing enabled** (Cloud Run free tier
  applies). Region used below: `asia-southeast2` (Jakarta).
- `gcloud` CLI + `firebase` CLI installed and logged in.
- Enable: Cloud Run, Artifact Registry, Firestore **(native mode)**,
  Firebase App Hosting, Cloud Build.

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com firestore.googleapis.com
```

## 1. Firestore

Console → Firestore → Create database → **Native mode** → region
`asia-southeast2`. No security rules changes needed: only the API's service
account writes (server-side); the PWA never touches Firestore directly in
demo mode.

## 2. API on Cloud Run

```bash
gcloud run deploy hanga-api \
  --source apps/api \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars "HANGA_DEMO_MODE=true,HANGA_GCP_PROJECT_ID=YOUR_PROJECT_ID,HANGA_CORS_ORIGINS=[\"https://YOUR_APP_HOSTING_DOMAIN\"]"
```

Notes:
- `--allow-unauthenticated` is safe: identity is enforced at the application
  layer (Firebase ID tokens + shop-ownership guard; demo principal while
  `HANGA_DEMO_MODE=true`).
- When going live with models: first do the 🔑 blocker in `TODO.md`
  (real key → `python scripts/verify_models.py` → confirmed
  `HANGA_VISION_MODEL`), then pass the key as a secret:
  `--set-secrets HANGA_GEMINI_API_KEY=hanga-gemini-key:latest`
  (create it with `gcloud secrets create`).
- Note the service URL → this is `NEXT_PUBLIC_API_URL`.

## 3. Web on Firebase App Hosting

1. Firebase console → App Hosting → Create backend → connect this GitHub
   repo (root: `apps/web`), or roll from CLI:
   `cd apps/web && firebase experiments:enable webframeworks && firebase init apphosting`
2. Fill `apps/web/apphosting.yaml`: `NEXT_PUBLIC_API_URL` = the Cloud Run URL
   from step 2 (+ Firebase web config for live sign-in).
3. Deploy (CLI path): `firebase apphosting:rollout` — or push to the
   connected branch.

## 4. Seed the demo data

With `GOOGLE_APPLICATION_CREDENTIALS` pointing at a service-account key
(Firestore Admin role):

```bash
cd apps/api
python scripts/seed_demo.py --project YOUR_PROJECT_ID          # full seed
python scripts/seed_demo.py --dry-run                          # validate only
```

Seeds: shop profile, 18 SKUs, 90 days of factor flags + synthetic sales, and
the 4 authored scenario briefings — the live compute path then has real
history to work from.

## 5. Smoke check

- `GET https://…run.app/api/v1/health` → 200
- PWA: sign in (or 🧪 Mode Demo) → briefing renders → flip scenarios → drag
  cash slider (bundle re-fits) → 🎤 Tanya answers → capture → confirm →
  Pesanan shows the draft.
- Rehearse the live Gemma path once per `TODO.md`, then set
  `HANGA_DEMO_MODE=true` again for stage.
