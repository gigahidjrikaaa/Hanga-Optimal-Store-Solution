# Design: Hanga

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule. The owner's product spec lives in `docs/design_system.md` (v1.1); where that file names emoji as icons, this system overrides it: icons are stroke SVGs from `apps/web/src/components/icons.tsx`, never emoji.

## System
- Genre: playful (a warm, respectful tool for warung owners; Bahasa Indonesia first)
- Shape of the first page: app screen (the Beranda briefing, behind sign-in)
- Theme: brand (kept): Hanga green on a green-tinted paper family, the warung-awning motif, the rolling-shutter success moment
- Axes: light warm-green paper / rounded-sans (Plus Jakarta Sans, one family, weights 400·600·800) / chromatic-green accent · posture: Committed (the green carries the brand surfaces; the accent stays a signal on controls and state)

## Tokens
`apps/web/src/app/tokens.css` is the source of truth. The roles:
```css
:root {
  --color-paper: #F3F7F4;  --color-paper-2: #FDFEFD;  --color-paper-3: #E9F0EB;
  --color-ink: #101828;  --color-ink-2: #344054;  --color-muted: #475467;  --color-rule: #E4E7EC;
  --color-accent: #0E9F6E;  --color-accent-ink: #FFFFFF;  --color-focus: #046C4E;
  --color-warn: #B54708; --color-warn-bg: #FEF0C7;
  --color-danger: #B42318; --color-danger-bg: #FEE4E2; --color-danger-fill: #D92D20;
  --color-info: #1570EF; --color-info-bg: #EAF1FC; --color-neutral: #98A2B3;
  --font-display: "Plus Jakarta Sans", system-ui, sans-serif;  --font-body: "Plus Jakarta Sans", system-ui, sans-serif;
  --radius-card: 12px;  --radius-chip: 8px;  --radius-sheet: 16px;  --radius-pill: 999px;
  --shadow-card: 0 1px 2px oklch(20% 0.01 170 / 0.06);
}
```
The spacing scale, the fixed type scale (13·15·17·20·24·28; body 17px per the demo spec), the easings and the durations live in `tokens.css`. Tailwind reads the same values through the `@theme inline` block in `globals.css` — utility names (`bg-surface`, `text-ink-600`, `bg-brand-100`) stay stable.

## Controls
- Primary: accent fill `--color-accent`, white text, radius 12, height 40px (48px hit target on coarse pointers)
- Secondary: outlined on `--color-rule`, ink text, same radius and height; quiet tertiaries are text-only in `--color-brand-800`
- Danger actions: outlined in `--color-danger`, never filled unless destruction is the screen's one action
- Inputs: match the button beside them; focus is an inset outline in `--color-focus`, never a border change

## Surfaces
- The shell: 480px centred column on `--color-paper`; bottom nav (4 tabs) is the only fixed chrome
- Ladder: whitespace → hairline `--color-rule` → tinted well `--color-paper-3` → card (`--color-paper-2`, one of border or shadow, never both)
- Severity is a token pair (bg + text): warn, danger, info, neutral. Never raw Tailwind palette colours (`red-*`, `amber-*`, `emerald-*`, `slate-*`)

## Motion
- Character: brisk, state-only. `--dur-micro` (120ms) and `--dur-short` (220ms); one route settle (`page-enter`, 260ms); no staggered choreography on content
- Kept signatures: the rolling-shutter sign-in sweep, the dawn scene, skeleton shimmer for loads, `useCountUp` on budget figures — all CSS-only, all end states shown under reduced motion

## Screens and states
- Beranda (`/`) briefing column: headline → health bar → scenario chips → cash-fit (the signature) → risks → recommendation cards → movers
- Every data region carries the four states: loading (skeleton in the shape of what is coming), empty (what belongs here and the one action), error (what broke and what to do), full

## Exports
`apps/web/src/app/tokens.css` in this project. Tailwind names are mapped in `globals.css` `@theme inline`; add DTCG or shadcn blocks on request, per `export-formats.md`.
