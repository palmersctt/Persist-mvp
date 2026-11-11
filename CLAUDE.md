# Persist MVP — Agent Instructions

## Architecture

Next.js app with two surfaces:

1. **Landing page** — `app/page.tsx` (marketing, demo card)
2. **Dashboard** — `app/dashboard/page.tsx` (authenticated work-health dashboard)

Routing: `app/` directory (Next.js App Router). Shared layout in `app/layout.tsx`.

## Software Factory

The pipeline in `FACTORY.md` runs **automatically**. Do not wait to be asked
for it, and do not ask the user to type the step commands.

**When it starts.** Any request to change code starts the pipeline, unless:

- it is a question, an explanation, or a review (answer it directly);
- it is a trivial edit: copy, a typo, a rename, a one-file fix with an obvious
  cause (make the change, run `npm run verify`);
- the user says to skip it ("quick", "just do it", "skip the factory").

A change touching the readiness model (`src/lib/model.ts`,
`dashboardModel.ts`), the card system, auth, or the database always takes the
full pipeline, however small it looks. When unsure which side a request falls
on, take the pipeline and say so in one line.

**How it runs.** Follow the step prompts in `.claude/commands/` in order,
writing each step's file under `thoughts/shared/`. Where a step prompt says
to stop and hand the next command to the user, carry on to the next step
instead, except at the two gates below.

1. Questions, then research. Give the research sub-agents
   (`.claude/agents/`) the questions only, never the ticket.
2. Design. **Gate: stop.** Present the decisions and open questions, and wait
   for the user's answers.
3. Outline. **Gate: stop.** Present the slices, and wait for approval.
4. Plan, then implement every phase. Commit each phase once `npm run verify`
   passes. On a mismatch between plan and code, stop and report it.
5. Validate with a sub-agent that has not seen the implementation session,
   then report: what was built, check results, anything outside the plan, and
   the manual checks the user still owes. The user reads the code and merges.

**Rules.**

- Gate for every phase and for CI: `npm run verify` (lint + typecheck + tests).
- Research documents the code as it is. Opinions belong in the design step.
- Never skip, weaken or delete a test to get a check to pass.
- Never treat an unanswered gate as approval.

## Card System

- **`src/components/CardContent.tsx`** — the single card renderer. All cards go through this component.
- **`src/lib/mood.ts`** — owns moods, gradients, tier logic. This is the source of truth for mood/tier data.
- Do NOT create wrapper components around CardContent.
- Do NOT duplicate the MOODS record or tier definitions anywhere.

## Readiness Model

- **`src/lib/model.ts`** — the unified readiness engine: one shared load
  currency (work + training), a 21-day baseline **seeded from a prior** (a
  real verdict on day one), the Work Index, and a single verdict → **Readiness
  / Load / Balance**.
- **`src/lib/dashboardModel.ts`** — maps real calendar + Strava signals into
  the model. **`src/components/ReadinessExplain.tsx`** renders the "why" panel.
- ONE verdict drives the card: the model's verdict → mood + tier + action.
  Work does NOT produce a separate, competing mood.
- Do NOT bring back the old capacity−tax model — `readiness.ts` is retired.

## Brand Colors

Always reference `BRAND.md` for colors. Never hardcode new palettes or invent colors.

- Accent color: lime `#C7F95C` — the only accent color in the system.
- Background: near-black `#0B0B0C`
- Text: `#F5F5F5`
- Fonts: Geist Sans (body/headlines), Geist Mono (score numerals only).
- See `BRAND.md` for the full token table.

## Three Tiers

Every mood maps to exactly one tier. One color family per tier.

| Tier | Moods                         | Card look                                |
| ---- | ----------------------------- | ---------------------------------------- |
| bad  | survival, scattered           | Near-black gradient, lime score numerals |
| ok   | autopilot, coasting, grinding | Graphite gradient, white score numerals  |
| good | locked-in, flow, victory      | Lime gradient, near-black score numerals |

The active verdict set is five: **Survival** (bad), **Grinding** + **Coasting**
(ok), **Locked In** + **Flow** (good). The other moods remain in `mood.ts`.

## Scores

The card shows the unified model's three scores (`src/lib/model.ts`):

| Card score    | Meaning                                                   |
| ------------- | --------------------------------------------------------- |
| **Readiness** | Headline 0–100: load-vs-baseline fit blended with Balance |
| **Load**      | How hard recent load presses over your baseline           |
| **Balance**   | Restoration balance (+ fills / − drains)                  |

The calendar's work-health scores are now **inputs** (they aggregate into the
Work Index), not card labels:

| Internal                                   | Work-health label |
| ------------------------------------------ | ----------------- |
| `performance` / `adaptivePerformanceIndex` | Focus             |
| `resilience` / `cognitiveResilience`       | Strain            |
| `sustainability` / `workRhythmRecovery`    | Rhythm            |

All scores render at uniform 32px. Color-only emphasis — Readiness leads/pops.

## Key Files

| Path                                     | Purpose                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| `app/page.tsx`                           | Landing page                                                             |
| `app/dashboard/page.tsx`                 | Dashboard page                                                           |
| `app/layout.tsx`                         | Root layout                                                              |
| `src/components/CardContent.tsx`         | Card renderer (single source)                                            |
| `src/components/LandingPage.tsx`         | Landing page component                                                   |
| `src/components/WorkHealthDashboard.tsx` | Dashboard component                                                      |
| `src/components/SwipeableQuoteCards.tsx` | Multi-quote card carousel                                                |
| `src/lib/mood.ts`                        | Mood types, MOODS record, tier logic                                     |
| `src/lib/mood.test.ts`                   | Mood unit tests                                                          |
| `src/lib/trends.ts`                      | Real trends built from persisted daily score history                     |
| `src/lib/generateTrends.ts`              | Synthetic trends (sandbox demo) + shared insight generators              |
| `src/components/TrendsSection.tsx`       | Dashboard trends UI (sparklines, weekly/monthly)                         |
| `src/lib/model.ts`                       | Unified readiness engine (load vs baseline + Work Index → verdict)       |
| `src/lib/dashboardModel.ts`              | Maps real calendar + Strava signals into the model                       |
| `src/lib/wearables/`                     | Wearable providers (Strava, demo, WHOOP) normalized to `WearableActuals` |
| `src/components/WearableSection.tsx`     | Dashboard connect pitch + "Why your readiness" panel                     |
| `src/components/ReadinessExplain.tsx`    | Shared verdict panel (Readiness/Load/Balance + why + drivers)            |
| `WEARABLES.md`                           | Wearable integration model, provider setup, schema                       |
| `BRAND.md`                               | Brand color tokens and card design tokens                                |
| `PERSONAS.md`                            | User personas                                                            |
| `FACTORY.md`                             | Software factory: the step-by-step pipeline for agent-built changes      |
| `thoughts/shared/`                       | Pipeline documents (tickets, research, designs, outlines, plans)         |

## Do NOT

- Do NOT create new card wrapper components — use `CardContent` directly.
- Do NOT duplicate the `MOODS` record from `mood.ts` — import it.
- Do NOT use old rainbow/multi-color gradients — cards use tier-based monochrome gradients only.
- Do NOT hardcode color values — reference `BRAND.md` tokens.
- Do NOT re-introduce cream/amber/Lora-italic styling — the brand is dark + lime + Geist (Direction A).
- Do NOT use italic-for-emphasis — emphasis is color (`--signal`) or weight only.
- Do NOT add new tiers — there are exactly three: bad, ok, good.
- Do NOT rename the card's scores (Readiness, Load, Balance) or the verdict set (Survival/Grinding/Coasting/Locked In/Flow) without explicit instruction.
- Do NOT re-introduce "comic relief" branding — the brand is now "Persist" / "Persistwork".
