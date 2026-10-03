# Hanga — Optimal Store Solution

> **Inventory intelligence for shops that run on paper, cash, and instinct.**

Hanga helps Indonesian warung (small shop) owners manage inventory smarter.
Photo your notebook → get AI-powered daily recommendations → order via WhatsApp.

Built for the **Google Cloud AI Builder Cup 2026** — Retail & Commerce theme.

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌───────────────┐
│   Next.js PWA       │────▶│   Cloud Run (FastAPI) │────▶│   Firestore   │
│   Firebase Hosting  │     │   Compute + Models    │     │   + Storage   │
└─────────────────────┘     └──────────────────────┘     └───────────────┘
                                     │
                            ┌────────┴────────┐
                            │  Gemma 3        │  Reasoning & explanation
                            │  Gemini Flash   │  Vision extraction
                            └─────────────────┘
```

## Project Structure

```
├── apps/
│   ├── web/              # Next.js PWA (App Router + Tailwind CSS)
│   │   ├── src/
│   │   │   ├── app/      # Routes (5 screens)
│   │   │   ├── components/ # UI components (design system)
│   │   │   ├── lib/      # API client, design system constants
│   │   │   └── types/    # TypeScript types (mirrors Python schemas)
│   │   └── public/       # PWA manifest, icons
│   │
│   └── api/              # Python FastAPI backend
│       ├── app/
│       │   ├── routers/  # API endpoints (briefings, extractions, health)
│       │   ├── schemas/  # Pydantic models (DailyBriefing contract)
│       │   └── services/ # Firestore, Model (Gemma/Gemini)
│       ├── tests/        # Pytest tests
│       └── Dockerfile    # Cloud Run container
│
├── docs/                 # Specifications
│   ├── briefing_spec.md  # Data contract & interaction spec
│   ├── prd_hanga.md      # Product Requirements Document
│   └── design_system.md  # Design tokens, components, screens
│
├── docker-compose.yml    # Local dev environment
└── .gitignore            # Monorepo ignores
```

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (optional)

### 🚀 Quick Setup (Automated)

Run the automated setup script to create a virtual environment, install all dependencies (Python API & Next.js Web), and create `.env` files automatically:

**Windows:**
```cmd
setup.bat
```

**Linux / macOS:**
```bash
chmod +x setup.sh
./setup.sh
```

**Cross-platform (Python directly):**
```bash
python setup.py
```

---

### Manual Setup

#### Frontend (Next.js)

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
# → http://localhost:3000
```

#### Backend (FastAPI)

```bash
cd apps/api
cp .env.example .env
pip install -r requirements.txt  # or pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8080
# → http://localhost:8080
```

#### Docker (both)

```bash
docker compose up --build -d
# Frontend → http://localhost:3000
# Backend  → http://localhost:8080
```

## Stack

| Layer               | Technology                                  |
|---------------------|---------------------------------------------|
| Reasoning           | Gemma 3 via Gemini API                      |
| Vision extraction   | Gemini Flash (multimodal) via Gemini API    |
| Frontend            | Next.js PWA → Firebase App Hosting          |
| Backend             | FastAPI on Cloud Run                        |
| Database            | Firestore (native mode)                     |
| Media               | Firebase Storage                            |
| Notifications       | WhatsApp deep links                         |

## Team

- **A** — Product / UI / Frontend
- **B** — AI / Backend

## License

Private — Google Cloud AI Builder Cup 2026 submission.
