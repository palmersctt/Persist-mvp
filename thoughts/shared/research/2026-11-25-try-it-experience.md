---
date: 2026-11-25
git_commit: 72115ef
branch: claude/adoring-mccarthy-43vsnt
questions: thoughts/shared/questions/2026-11-25-try-it-experience.md
status: complete
---

# Research: the public demo, the card, and the landing page today

## Summary

`/sandbox` is a client page (`app/sandbox/page.tsx:8-23`) that redirects
signed-in users and otherwise renders `SandboxDashboard` (2,268 lines). The
visitor types titled meetings into `SandboxMeetingBuilder`, the page POSTs
them to the unauthenticated `/api/sandbox-score`, which fabricates Google
events, scores them through `GoogleCalendarService`, and returns work metrics
plus local (non-Claude) quote text. The verdict is computed client-side with
`dashboardVerdict` and shown through `SwipeableQuoteCards` → `CardContent`,
followed by `WhyMood`, a demo-training `ReadinessExplain`, synthetic trends,
and metric tabs. The landing page links to it twice as "See the demo".
`CardContent` needs a quote; on the dashboard and sandbox that comes from
`comicReliefGenerator`, which is browser-safe.

## Findings

### Q1. What the sandbox does
- Entry: `app/sandbox/page.tsx:12-22`. State: `SandboxDashboard.tsx:99-118`.
- Input: `SandboxMeetingBuilder` rows (title, 30-min times 6:00–21:00,
  attendee bucket); scoring needs a titled meeting
  (`SandboxMeetingBuilder.tsx:5-39, 69`). Fresh/Steady/Fatigued toggles pick
  hard-coded demo training (`SandboxDashboard.tsx:53-94, 751-779`).
- Flow: POST `/api/sandbox-score` (`:163-174`) → `generateTrendsFromScore`
  (`:177-183`) → `dashboardVerdict(customMetrics, sandboxActuals(...))`
  (`:210-211`) → `VERDICT_MOOD` (`:212`); text from `customMetrics.ai`
  (`:120, 213-232`).
- Sections: sticky nav with "Sandbox" badge and sign-in (`:517-526`);
  builder; day list; `SwipeableQuoteCards` without a `verdict` prop
  (`:660-670`); share via `html-to-image` (`:126-161`); `WhyMood`
  (`:687-697`); "Forecast vs Actual" with `ReadinessExplain`
  (`:701-794`); synthetic trends (`:891-1459`); Focus/Strain/Balance tabs
  (`:1467-2232`); mobile sticky sign-in CTA (`:2236-2264`).

### Q2. How it is reached
- Links: `LandingPage.tsx:110-112` (nav) and `:151-157` (mobile menu).
- `middleware.ts:8-10, 17-21, 36`: public, signed-in users redirected.
- `/api/sandbox-score` has no session check (`sandbox-score.ts:18-32`).
- No sitemap/robots/config references.

### Q3. CardContent and its data
- Props (`CardContent.tsx:60-74`): quote, source, subtitle (required
  strings); readiness, load, balance; mood; optional verdict, cardRef,
  forExport (`daySummary` declared, unused). Mood → `MOODS` gradient, name,
  text colour; tier → ok-tier muting (`:89-96`). Quote rendered in italic
  curly quotes (`:209-222`).
- Dashboard: scores/mood/label from `dashboardVerdict` (`WorkHealthDashboard.tsx
  :55-66`); quote/source/subtitle from `workHealth.ai` hero messages, with a
  fixed fallback (`:678-793`).
- With no hero messages `SwipeableQuoteCards` renders nothing
  (`SwipeableQuoteCards.tsx:166`).

### Q4. Swipe deck, hero deck, mood
- `SwipeableQuoteCards`: one quote per card, scores/mood constant, count-up
  at 250ms, swipe threshold 60px / 300 velocity (`:11-213`).
- `heroDeck.ts:38-74`: five static landing cards, one per verdict.
- `mood.ts`: MOODS (`:19-28`), tiers (`:32-36`), `VERDICT_MOOD` (`:48-54`),
  `VERDICT_LABEL` (`:55-61`).

### Q5. What sandbox-score adds, and what is browser-safe
- Returns work metrics + `ai` from `ClaudeAIService.getDefaultInsights`
  (local text, but the class imports `@anthropic-ai/sdk` and throws without
  the env key) or an inline fallback using `comicReliefGenerator`
  (`sandbox-score.ts:97-190`).
- Browser-safe: `comicReliefGenerator.ts` (type-only import), the engine
  (`scoreDay`, `scoreWork`, `parseDayInput`), `dashboardVerdict`.
  Not browser-safe: `GoogleCalendarService` (googleapis), `ClaudeAIService`.

### Q6. Landing page
- Sections (`LandingPage.tsx`): nav (`:103-159`); hero with "Unlock my
  scores" (Google sign-in) and a swipeable static `HERO_DECK` of real
  `CardContent`s (`:162-263`); `#demo` static calendar + hand-built
  readiness stack (`:266-460`); how it works (`:463-497`); final CTA
  (`:500-529`); footer.
- CTAs: `signIn('google')` ×3; "See the demo →" to `/sandbox` ×2.

### Q7. Motion
- `framer-motion ^12.34.3` (used by `LandingPage.tsx`, `SwipeableQuoteCards`).
- CSS utilities `.reveal-up`, `.reveal-card`, `.bar-grow`, `.skeleton-bar`,
  easing `cubic-bezier(0.22,1,0.36,1)`, stagger via `--d`
  (`globals.css:338-392`). Global reduced-motion override
  (`:394-404`); `useCountUp` honours it (`useCountUp.ts:17-25`).

### Q8. Analytics
- `trackEvent` → POST `/api/analytics/events` (`trackEvent.ts:25-37`).
  Signed-out events need a `sandbox-…` session id (`events.ts:19-27`); the
  server allow-list misses five client event names (`events.ts:6-15`).
- Vercel `<Analytics />` on every page (`app/layout.tsx:4, 64`).

### Q9. What becomes unused if the sandbox goes
- `app/sandbox/page.tsx`, `SandboxMeetingBuilder.tsx`, `WhyMood.tsx`,
  `/api/sandbox-score`, `estimateScores.ts`, `sandbox-personas.ts`
  (already unused), `generateTrendsFromScore` + `vary` in
  `generateTrends.ts`, `getSandboxSessionId`/`resetSandboxSessionId`, and
  the `sandbox_*` event types and server branch.
- Stays: `comicReliefGenerator`, `categorizeMeeting`, `SwipeableQuoteCards`,
  `PersistLogo`, `dashboardVerdict`, `ReadinessExplain`, `html-to-image`.

### Q10. Brand
- Tokens `globals.css:5-15` = `BRAND.md:7-19`; gradients in `mood.ts:20-27`
  (160deg). Geist Sans/Mono. No type-scale, spacing, radius or motion
  tokens. Rules: lime is the only accent; emphasis by colour or weight, never
  italic (`BRAND.md:30, 115-125`).

## Open questions (the code cannot answer)
- Whether existing `sandbox_*` rows in Supabase `events` are read anywhere
  outside this repo.
