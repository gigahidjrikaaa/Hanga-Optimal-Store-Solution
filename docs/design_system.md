# Design System — Hanga (v1.0)

## 0. Principles
1. **One hand, one glance.** Primary actions in the bottom third; briefing readable in 30s.
2. **Trust through transparency.** Every recommendation shows *why* (factor chips) —
   transparency is a feature, not a settings page.
3. **Low-literacy friendly.** Every icon has a label; every number has a unit; ranges
   over decimals.
4. **Bahasa first.** All UI copy in Bahasa Indonesia; code/identifiers stay English.

## 1. Tokens

### Color
| Token | Hex | Use |
|---|---|---|
| `brand/600` | `#0E9F6E` | Primary actions, active nav |
| `brand/800` | `#046C4E` | Pressed states, heading accents |
| `brand/100` | `#DEF7EC` | Tints, selected backgrounds |
| `ink/900` | `#101828` | Primary text |
| `ink/600` | `#475467` | Secondary text |
| `surface` | `#FFFFFF` | Cards, sheets |
| `canvas` | `#F6F8FA` | App background |
| `border` | `#E4E7EC` | Dividers, card outlines |
| `warn/600` | `#F79009` | MEDIUM confidence, waste risk |
| `warn/100` | `#FEF0C7` | Warning banner bg |
| `danger/600` | `#D92D20` | HIGH severity risk |
| `danger/100` | `#FEE4E2` | Danger bg |
| `info/600` | `#1570EF` | Scenario chips, info banners |
| `neutral/400` | `#98A2B3` | LOW confidence, disabled |

Confidence mapping: HIGH → `brand/600` · MEDIUM → `warn/600` · LOW → `neutral/400`.

### Type — **Plus Jakarta Sans** (Google Fonts)
| Style | Size/Line | Weight | Use |
|---|---|---|---|
| Display | 28/34 | 800 | Briefing headline |
| Title | 20/26 | 700 | Screen titles |
| Heading | 17/24 | 600 | Card titles |
| Body | 15/22 | 400–500 | Default |
| Caption | 12/16 | 500 | Factor chips, timestamps |
| Numeric | body size | 600, tabular-nums | Quantities, IDR amounts |

### Spacing / Radius / Elevation / Motion
- 4pt grid: `4 · 8 · 12 · 16 · 20 · 24 · 32`
- Radius: chips `8` · cards `12` · sheets `16` · badges `full`
- Elevation: cards `0 1 3 rgba(16,24,40,.10)` · sheets `0 -4 16 rgba(16,24,40,.14)`
- Motion: 150–250ms ease-out; skeleton shimmer for any load > 400ms

## 2. Components

**AppShell** — bottom nav, 4 tabs: `Beranda · Stok · Pesanan · Profil`. Active tab:
brand/600 icon + label. Max width 480px centered on desktop.

**CaptureCard** (P0) — full-width card, 64px camera icon, "Foto buku catatan",
subtext "Cukup foto, kami yang baca." States: default → capturing → uploading (progress).

**ScenarioToggle** (P0) — horizontal segmented chips under briefing header:
`Normal · Lebaran +14 hr · Gajian · Hujan Besok`. Active chip: info/600 fill, white text.
Data source: Firestore `briefings/{date}_{scenario}` snapshot per chip.

**RecommendationCard** (P0) — top→bottom:
`action badge (REORDER/SKIP/PROMO/HOLD)` → `product name (Heading)` →
`qty range (Numeric, e.g. "8–15 kg · kemungkinan 12 kg")` → `ConfidenceBadge` →
`FactorChip row (≤4)` → `rationale_bahasa (Body)` → CTA row (`Pesan via WhatsApp`).

**FactorChip** — icon + short label + signed weight: `📅 Gajian +18%`,
`🌧️ Hujan −10%`. Green tint for positive, warn tint for negative.

**ConfidenceBadge** — pill: `Yakin · Cukup yakin · Perlu cek` (HIGH/MEDIUM/LOW).

**RiskBanner** — full-width, warn/danger bg: icon + one sentence + affected items.

**MoverList** — rows: product name + 7-day sparkline + delta % (green/red). Max 5 rows.

**ConfirmSheet** (P0) — extraction review: editable table (name, qty, unit); rows with
low model confidence highlighted warn/100; primary CTA "Konfirmasi" sticky bottom.

**OrderDraftSheet** — itemized list + `est_cost_idr` (tabular, "Rp 171.000") +
single primary CTA: WhatsApp icon + "Kirim pesanan ke Toko Grosir Jaya".

**OfflineBanner** — top of screen when cached: "Mode luring — briefing terakhir dari
tanggal X." Shown when PWA serves cached briefing and Firestore is unreachable.

All components require: default · loading (skeleton) · empty · error states.

## 3. Screen inventory (5 screens = the demo)
1. **Onboarding/Cold-start** — voice-or-tap 4-question interview
2. **Capture** — notebook photo upload → Firebase Storage
3. **ConfirmSheet** — extraction review
4. **Beranda (Briefing)** — headline, ScenarioToggle, RiskBanner, RecommendationCards, MoverList, baseline footnote
5. **OrderDraftSheet** — modal over Beranda

## 4. Voice & tone
Respectful ("Bu/Pak"), product-first, jargon-free, honest ranges, never blame.

| ✅ Do | ❌ Don't |
|---|---|
| "Stok gula habis dalam ±3 hari. Pesan 8–15 kg sebelum Jumat." | "Prediksi stokout SKU-001 dalam 72 jam (p=0.83)." |
| "Hujan besok — pengunjung biasanya turun ~30%." | "Model mendeteksi korelasi negatif curah hujan." |
| "Perlu cek: data susu masih sedikit (11 hari)." | "Confidence rendah karena sampling bias." |

## 5. Accessibility & resilience
- Contrast ≥ 4.5:1; touch targets ≥ 48px; primary CTAs in bottom third (thumb reach)
- Icon + text label always (never icon-only)
- Numerals large (17sp+) for qty and IDR
- Offline: cache last briefing (service worker); write actions queue locally
- **Demo styling:** min 17sp body for stage readability; `DEMO_DATE` env var pins all
  dates; seeded mode toggle hidden behind 3s long-press on the logo