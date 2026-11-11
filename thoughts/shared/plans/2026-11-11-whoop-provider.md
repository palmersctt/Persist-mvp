---
date: 2026-11-11
git_commit: a54757b
design: thoughts/shared/designs/2026-11-11-whoop-provider.md
outline: thoughts/shared/outlines/2026-11-11-whoop-provider.md
status: ready
---

# Plan: WHOOP in, Strava off screen

## What we are not doing

- Phase 4 of the outline (deleting the Strava client and its route
  branches). Deferred until WHOOP is proven against the live API.
- Any change to `src/lib/model.ts` maths.
- Any database migration.
- Editing `WEARABLES.md`, `CLAUDE.md` or `BRAND.md` (they describe code
  that still exists until phase 4).

## Phase 1: WHOOP sleep moves Readiness

### Changes

- `src/lib/wearables/whoop.ts`: export
  `whoopToActuals(records: WhoopRecords, date): WearableActuals | null`,
  holding the mapping now inside `fetchWhoopActuals`. `recovery` and
  `sleepHours` become absent, not 0, when WHOOP sends no value.
  `fetchWhoopActuals` fetches, then calls it.
- `src/lib/dashboardModel.ts`: `sleep` is `actuals.sleepPerformance`
  clamped to 0-100 when it is a number, else `SLEEP_NEUTRAL` (62).
- `src/lib/wearables/whoop.test.ts` (new) and added cases in
  `src/lib/dashboardModel.test.ts`.

### Automated checks

- [x] `npm run verify`

### Manual checks

None.

## Phase 2: training load from WHOOP workouts

### Changes

- `src/lib/wearables/trainingLoad.ts` (new): `activityLoad`,
  `freshnessFromActivities`, `trainingLoadProfile`, `LoadInput` and the
  window constants, moved unchanged from `strava.ts`, which now imports
  them. `strava.test.ts` moves to `trainingLoad.test.ts`.
- `src/lib/wearables/whoop.ts`: add `read:workout` to the scopes; fetch
  workouts from `/activity/workout` for the trailing 49 days, 25 per page,
  following `next_token` for at most 8 pages; `whoopToActuals` turns each
  workout into `{ start_date, moving_time }` (end minus start) and sets
  `trainingBaseline`, `trainingLoadToday`, `weekActivityCount`,
  `freshness` and `lastActivity`. With no workouts those fields stay
  absent, so training is held neutral.
- `fetchWhoopActuals` returns data when any of recovery, sleep or workouts
  is present.

### Automated checks

- [ ] `npm run verify`

### Manual checks

None.

## Phase 3: WHOOP replaces Strava on screen

### Changes

- `src/components/WearableSection.tsx`: the connect button, its notices and
  its analytics event use WHOOP and `available.whoop`; the connected label
  reads "WHOOP"; pass `wearable.actuals` to the panel.
- `src/components/ReadinessExplain.tsx`: optional `body` prop; when it
  carries recovery, sleep, HRV or resting heart rate, render a "Your body"
  block in the existing `Stat` style. Displayed only, never scored.
- Copy: `src/components/LandingPage.tsx` (tag, step 2, closing line),
  `app/layout.tsx` (three descriptions), `src/components/SandboxDashboard.tsx`
  (note, comment, preset provider `'demo'`).
- Comments naming Strava in `dashboardModel.ts`.

### Automated checks

- [ ] `npm run verify`
- [ ] `grep -ril strava app src/components src/hooks/useWearable.ts` lists
      only `src/hooks/useWearable.ts` (the `available` shape, kept until
      phase 4)

### Manual checks

- [ ] Without `WHOOP_*` variables: the dashboard shows a disabled
      "Connect WHOOP" button with its note, and demo data still works.
- [ ] With a WHOOP developer app and device: connect, and confirm the card
      and the "Your body" and "Your training" blocks show real values.
- [ ] Register redirect `${NEXTAUTH_URL}/api/wearables/callback` and the
      scope `read:workout` on the WHOOP app.
