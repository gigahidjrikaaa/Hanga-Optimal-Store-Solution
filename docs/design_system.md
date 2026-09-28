# Design System — Hanga (v1.1)

> **v1.1 changelog (Sep 27, 2026):** added CashBudgetBar and AskHangaButton/VoiceSheet
> (cash-first advisor + Tanya Hanga); RecommendationCard now renders the product
> **name**, never the SKU code; Beranda screen order updated; CASH_TIGHT factor chip.

## 0. Principles
1. **One hand, one glance.** Primary actions in the bottom third; briefing readable in 30s.
2. **Trust through transparency.** Every recommendation shows *why* (factor chips) —
   and, since v1.1, lets the owner *ask about it* (Tanya Hanga). Transparency is a
   feature, not a settings page.
3. **Cash is real.** The briefing respects the money actually in the drawer: what fits,
   what it leaves, what waits. Never recommend an order the cash can't pay for.
4. **Low-literacy friendly.** Every icon has a label; every number has a unit; ranges
   over decimals; voice in and voice out wherever text would be a barrier.
5. **Bahasa first.** All UI copy in Bahasa Indonesia; code/identifiers stay English —
   and stay out of the UI entirely.

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
Budget mapping: fits → `brand/100` tint · deferred item → `warn/100` tint ·
over cash (`remaining_idr < 0`, live mode only) → `danger/100` tint.

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

**CashBudgetBar** (P0, v1.1) — sits directly under the ScenarioToggle. Two rows:
1. *Input row:* "Kas hari ini" + quick-set chips (`100rb · 300rb · 500rb · 1jt`) or a
   slider; value displayed as Numeric (`Rp 500.000`).
2. *Fit row:* `Terpakai Rp 241.000 · Sisa Rp 88.000` with a slim horizontal bar
   (brand fill on border track); deferred items appear as warn/100 mini-chips:
   `⏳ Tepung — besok`.
Behaviour: changing cash re-loads the briefing (pre-computed per budget tier in demo
mode). States: default · loading (skeleton) · over-cash (danger tint, live mode) ·
empty (hide fit row until briefing loads).

**RecommendationCard** (P0) — top→bottom:
`action badge (REORDER/SKIP/PROMO/HOLD)` → `product name (Heading — from
`recommendation.name`; **the SKU code is never shown**)` →
`qty range (Numeric, e.g. "8–15 kg · kemungkinan 12 kg")` →
`est cost (Numeric caption, e.g. "±Rp 171.000" — v1.1)` → `ConfidenceBadge` →
`FactorChip row (≤4)` → `rationale_bahasa (Body)` → CTA row (`Pesan via WhatsApp`
and/or **AskHangaButton**).

**AskHangaButton + VoiceSheet** (P1, v1.1) — a `🎤 Tanya` chip on every card (and a
larger primary "Tanya Hanga" button under the last card). Opens VoiceSheet (bottom
sheet, radius 16, sheet shadow): listening state (animated waveform) → transcript
(Body) → `answer_bahasa` (Body, read aloud via TTS while displayed) → cited
`FactorChip` row → 2 suggested follow-up chips. **A text-input fallback is always
visible** (venue-noise insurance). States: idle · listening · thinking (skeleton) ·
speaking · error (retry + text fallback).

**FactorChip** — icon + short label + signed weight: `📅 Gajian +18%`,
`🌧️ Hujan −10%`, `💵 Kas terbatas (v1.1, no % — deferral is binary)`.
Green tint for positive, warn tint for negative.

**ConfidenceBadge** — pill: `Yakin · Cukup yakin · Perlu cek` (HIGH/MEDIUM/LOW).

**RiskBanner** — full-width, warn/danger bg: icon + one sentence + affected items.
Since v1.1, content is *derived* by the compute layer from `shelf_days` × stock cover.

**MoverList** — rows: product name + 7-day sparkline + delta % (green/red). Max 5 rows.

**ConfirmSheet** (P0) — extraction review: editable table (name, qty, unit); rows with
low model confidence highlighted warn/100; primary CTA "Konfirmasi" sticky bottom.

**OrderDraftSheet** — itemized list + `est_cost_idr` (tabular, "Rp 171.000") +
single primary CTA: WhatsApp icon + "Kirim pesanan ke Toko Grosir Jaya".

**OfflineBanner** — top of screen when cached: "Mode luring — briefing terakhir dari
tanggal X." Shown when PWA serves cached briefing and Firestore is unreachable.

All components require: default · loading (skeleton) · empty · error states.

## 3. Screen inventory (5 screens = the demo)
1. **Onboarding/Cold-start** — voice-or-tap 4-question interview (incl. "Berapa kas
   hari ini?" — v1.1)
2. **Capture** — notebook photo upload → Firebase Storage
3. **ConfirmSheet** — extraction review
4. **Beranda (Briefing)** — headline, ScenarioToggle, **CashBudgetBar (v1.1)**,
   RiskBanner, RecommendationCards (each with 🎤 Tanya — v1.1), MoverList,
   baseline footnote
5. **OrderDraftSheet** — modal over Beranda

## 4. Voice & tone
Respectful ("Bu/Pak"), product-first, jargon-free, honest ranges, never blame.
Product names, never SKU codes — anywhere. Tanya Hanga answers cite only the numbers
already on screen.

| ✅ Do | ❌ Don't |
|---|---|
| "Stok gula habis dalam ±3 hari. Pesan 8–15 kg sebelum Jumat." | "Prediksi stokout SKU-001 dalam 72 jam (p=0.83)." |
| "Hujan besok — pengunjung biasanya turun ~30%." | "Model mendeteksi korelasi negatif curah hujan." |
| "Perlu cek: data susu masih sedikit (11 hari)." | "Confidence rendah karena sampling bias." |
| "Kas hari ini cukup untuk sirup & biskuit. Tepung ditunggu besok ya, Bu." (v1.1) | "3 item melebihi budget, dihilangkan dari daftar." (silent drop) |
| "Angka itu belum ada di briefing hari ini — cek kartu gula ya, Bu." (v1.1 deflection) | Answering with a number not on screen. |

## 5. Accessibility & resilience
- Contrast ≥ 4.5:1; touch targets ≥ 48px; primary CTAs in bottom third (thumb reach)
- Icon + text label always (never icon-only)
- Numerals large (17sp+) for qty and IDR
- Voice: transcript shown while TTS speaks; text fallback always visible; mic button
  ≥ 48px with label
- Offline: cache last briefing (service worker); write actions queue locally
- **Demo styling:** min 17sp body for stage readability; `DEMO_DATE` env var pins all
  dates; seeded mode toggle hidden behind 3s long-press on the logo
