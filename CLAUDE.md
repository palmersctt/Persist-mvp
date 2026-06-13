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

- Accent color: lime `#C7F95C` — the only accent color in the system.
- Background: near-black `#0B0B0C`
- Text: `#F5F5F5`
- Fonts: Geist Sans (body/headlines), Geist Mono (score numerals only).
- See `BRAND.md` for the full token table.

## Three Tiers

Every mood maps to exactly one tier. One color family per tier.

| Tier | Moods | Card look |
|------|-------|-----------|
| bad | survival, grinding, scattered | Near-black gradient, lime score numerals |
| ok | autopilot, coasting | Graphite gradient, white score numerals |
| good | locked-in, flow, victory | Lime gradient, near-black score numerals |

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
| `src/lib/trends.ts` | Real trends built from persisted daily score history |
| `src/lib/generateTrends.ts` | Synthetic trends (sandbox demo) + shared insight generators |
| `src/components/TrendsSection.tsx` | Dashboard trends UI (sparklines, weekly/monthly) |
| `src/lib/readiness.ts` | Headroom algorithm: calendar scores × wearable capacity, time-aware |
| `src/lib/wearables/` | Wearable providers (WHOOP, demo) normalized to `WearableActuals` |
| `src/components/WearableSection.tsx` | Dashboard "Forecast vs Actual" section |
| `WEARABLES.md` | Wearable integration model, provider setup, schema |
| `BRAND.md` | Brand color tokens and card design tokens |
| `PERSONAS.md` | User personas |

## Do NOT

- Do NOT create new card wrapper components — use `CardContent` directly.
- Do NOT duplicate the `MOODS` record from `mood.ts` — import it.
- Do NOT use old rainbow/multi-color gradients — cards use tier-based monochrome gradients only.
- Do NOT hardcode color values — reference `BRAND.md` tokens.
- Do NOT re-introduce cream/amber/Lora-italic styling — the brand is dark + lime + Geist (Direction A).
- Do NOT use italic-for-emphasis — emphasis is color (`--signal`) or weight only.
- Do NOT add new tiers — there are exactly three: bad, ok, good.
- Do NOT rename the display labels (Focus, Strain, Balance) without explicit instruction.
- Do NOT re-introduce "comic relief" branding — the brand is now "Persist" / "Persistwork".
