# Persist MVP — Agent Instructions

## Architecture

Next.js app with two surfaces:

1. **Landing page** — `app/page.tsx` (marketing, demo card)
2. **Dashboard** — `app/dashboard/page.tsx` (authenticated work-health dashboard)

Routing: `app/` directory (Next.js App Router). Shared layout in `app/layout.tsx`.

## Card System

- **`src/components/CardContent.tsx`** — the single card renderer. All cards go through this component.
- **`src/lib/mood.ts`** — owns moods, gradients, tier logic. This is the source of truth for mood/tier data.
- Do NOT create wrapper components around CardContent.
- Do NOT duplicate the MOODS record or tier definitions anywhere.

## Brand Colors

Always reference `BRAND.md` for colors. Never hardcode new palettes or invent colors.

- Accent color: amber `#E87D3A` — the only accent color in the system.
- Background: cream `#FBF7F2`
- Text: ink `#1C1917`
- See `BRAND.md` for the full token table.

## Three Tiers

Every mood maps to exactly one tier. One color family per tier.

| Tier | Moods | Card look |
|------|-------|-----------|
| bad | survival, grinding, scattered | Dark ink (near-black gradient) |
| ok | autopilot, coasting | Warm gray |
| good | locked-in, flow, victory | White/cream |

## Score Names

Internal metric names → display labels:

| Internal | Display |
|----------|---------|
| `performance` / `adaptivePerformanceIndex` | **Focus** |
| `resilience` / `cognitiveResilience` | **Strain** |
| `sustainability` / `workRhythmRecovery` | **Balance** |

All scores render at uniform 32px. Color-only emphasis (no size variation).

## Key Files

| Path | Purpose |
|------|---------|
| `app/page.tsx` | Landing page |
| `app/dashboard/page.tsx` | Dashboard page |
| `app/layout.tsx` | Root layout |
| `src/components/CardContent.tsx` | Card renderer (single source) |
| `src/components/LandingPage.tsx` | Landing page component |
| `src/components/WorkHealthDashboard.tsx` | Dashboard component |
| `src/components/SwipeableQuoteCards.tsx` | Multi-quote card carousel |
| `src/lib/mood.ts` | Mood types, MOODS record, tier logic |
| `src/lib/mood.test.ts` | Mood unit tests |
| `BRAND.md` | Brand color tokens and card design tokens |
| `PERSONAS.md` | User personas |

## Do NOT

- Do NOT create new card wrapper components — use `CardContent` directly.
- Do NOT duplicate the `MOODS` record from `mood.ts` — import it.
- Do NOT use old rainbow/multi-color gradients — cards use tier-based monochrome gradients only.
- Do NOT hardcode color values — reference `BRAND.md` tokens.
- Do NOT add new tiers — there are exactly three: bad, ok, good.
- Do NOT rename the display labels (Focus, Strain, Balance) without explicit instruction.
- Do NOT re-introduce "comic relief" branding — the brand is now "Persist" / "Persistwork".
