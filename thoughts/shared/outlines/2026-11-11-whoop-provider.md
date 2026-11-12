---
date: 2026-11-11
design: thoughts/shared/designs/2026-11-11-whoop-provider.md
status: approved (phases 1-3); phase 4 deferred
---

# Outline: WHOOP in, Strava out

Four slices. Each leaves the app working and `npm run verify` green.

## Phase 1: WHOOP sleep moves Readiness

- `src/lib/wearables/whoop.ts`: split out a pure
  `whoopToActuals(records, date): WearableActuals | null`;
  `fetchWhoopActuals` calls it.
- `src/lib/dashboardModel.ts`: `sleep` is `actuals.sleepPerformance` when
  present, else the neutral 62.
- **Automated:** new `whoop.test.ts` (fixtures to actuals, missing fields,
  no data); `dashboardModel.test.ts` gains "good sleep raises Readiness,
  poor sleep lowers it, absent sleep is neutral".
- **Manual:** none.

## Phase 2: training load from WHOOP workouts

- New `src/lib/wearables/trainingLoad.ts`: the provider-neutral maths moved
  out of `strava.ts` (`activityLoad`, `trainingLoadProfile`,
  `freshnessFromActivities`), with its tests moved alongside. `strava.ts`
  imports from it for now.
- `whoop.ts`: add the `read:workout` scope and a paged fetch of 49 days of
  workouts; `whoopToActuals` sets `trainingBaseline`, `trainingLoadToday`,
  `weekActivityCount`, `freshness` and `lastActivity` from minutes moved.
- **Automated:** `trainingLoad.test.ts` (moved, unchanged assertions);
  `whoop.test.ts` gains workout cases.
- **Manual:** none.

## Phase 3: WHOOP replaces Strava on screen

- `src/components/WearableSection.tsx`: "Connect WHOOP" button, disabled
  when `available.whoop` is false; `whoop-unavailable` notice; panel label
  "WHOOP"; recovery, HRV and resting heart rate shown as drivers.
- Copy: `src/components/LandingPage.tsx`, `app/layout.tsx` metadata,
  `src/components/SandboxDashboard.tsx` note and preset provider.
- **Automated:** `npm run verify`; a grep that no user-facing file under
  `app/` or `src/components/` contains "Strava".
- **Manual:** with `WHOOP_CLIENT_ID` and `WHOOP_CLIENT_SECRET` set, connect a
  real WHOOP account and confirm the card and panel change. Without the
  variables, confirm the button is disabled with its note.

## Phase 4: remove the Strava provider

- Delete `src/lib/wearables/strava.ts`; remove its branches from
  `pages/api/wearables/connect.ts`, `callback.ts` and `actuals.ts`; drop
  `'strava'` from `WearableProvider` and from `available`.
- `actuals.ts`: a stored connection with an unknown provider is reported as
  not connected.
- Docs and comments: `WEARABLES.md`, `CLAUDE.md`, `BRAND.md`, `model.ts`,
  `dashboardModel.ts`, `types.ts`, `demo.ts`.
- **Automated:** `npm run verify`; a grep that "strava" appears nowhere
  outside `thoughts/`.
- **Manual:** remove `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` from
  Vercel.

## Order and risk

Phase 4 removes the only provider proven against a live API. It should run
only after the Phase 3 manual check has passed.

## Approval

The user replied "your call for MVP", and has no WHOOP developer account or
device yet. Decision: build phases 1 to 3. Phase 4 is deferred until a live
WHOOP connection has been proven, so the Strava client stays in the code,
unreachable from the UI, and existing Strava connections keep working.
