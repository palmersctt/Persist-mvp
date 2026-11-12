---
date: 2026-11-11
git_commit: 9686622
ticket: thoughts/shared/tickets/2026-11-11-whoop-provider.md
research: thoughts/shared/research/2026-11-11-whoop-provider.md
status: agreed
---

# Design: WHOOP as a wearable provider

## Current state

The plumbing exists: client, OAuth routes, token refresh and environment
variables (`src/lib/wearables/whoop.ts`, `pages/api/wearables/*`). Two
things are missing:

1. **No way in.** `WearableSection` has no WHOOP button
   (`WearableSection.tsx:69-120`).
2. **No effect.** WHOOP returns recovery, sleep and day strain. The model
   reads only `trainingBaseline` and `trainingLoadToday`
   (`dashboardModel.ts:49-51`) and fixes sleep at neutral
   (`dashboardModel.ts:62`). Connecting WHOOP changes nothing on the card.

## Desired end state

A signed-in user clicks "Connect WHOOP", approves on WHOOP, and returns to a
dashboard whose Readiness, Load and Balance reflect their WHOOP data, with
the "why" panel naming WHOOP as the source. Without the `WHOOP_*` variables
the button is disabled, as Strava's is.

## Patterns to follow

- Pure mapping functions tested with fixtures, network untested:
  `trainingLoadProfile` and `strava.test.ts`.
- The disabled-when-unavailable button and `-unavailable` notice for Strava
  (`WearableSection.tsx:28,69-94`).
- One verdict from `dashboardVerdict`; no second, competing score.

## Decisions

### D1. Sleep moves Readiness

- **Options:** (a) feed WHOOP `sleepPerformance` into the model's existing
  `sleep` input; (b) show sleep in the panel only.
- **Recommend (a).** The input and its weight already exist
  (`model.ts:146`); only the source is missing. No model change.
- **Effect:** at the current weight, a 90% sleep adds about 10 points to
  Readiness and a 40% sleep removes about 8, against the neutral 62.

### D2. Training load comes from WHOOP workouts

- **Options:** (a) workouts over the last 49 days, each converted to the
  shared load currency, through the same baseline maths as Strava; (b) day
  strain from cycles; (c) leave training neutral for WHOOP users.
- **Recommend (a).** Day strain counts all-day cardiovascular load, including
  the working day the calendar already counts, so (b) would double-count.
- **Conversion:** minutes moved per workout, which is Strava's own fallback
  (`strava.ts:123-126`). WHOOP strain is on a 0 to 21 curve, and scaling it
  to match Strava's suffer score would be a guess.
- **Cost:** a new scope, `read:workout`, and a paged call to the workout
  endpoint.

### D3. Recovery is shown, not scored

- **Options:** (a) show recovery, HRV and resting heart rate as drivers in
  the panel; (b) blend recovery into Readiness.
- **Recommend (a).** The model has no recovery input. Adding one changes the
  engine for every user and wants its own ticket.

### D4. One provider at a time

- Keep today's behaviour: the most recently connected provider is used
  (`actuals.ts:172-177`). Merging Strava and WHOOP is out of scope.

### D5. Testable mapping

- Split `fetchWhoopActuals` into the network calls and a pure
  `whoopToActuals(records, date)`, and test the pure part with fixtures.

### D6. Strava leaves the product

Added after the user's instruction: "adjust product to not reference Strava
anymore as we moved to WHOOP".

- **Options:** (a) remove Strava from what users see (button, notices,
  landing copy, page metadata, sandbox note) and keep the provider code;
  (b) also remove the Strava client, its route branches, the `'strava'`
  union member and its documentation.
- **Recommend (b), as the last slice.** The generic load maths in
  `strava.ts` (`activityLoad`, `trainingLoadProfile`,
  `freshnessFromActivities`) is kept, moved to a provider-neutral file with
  its tests, because D2 reuses it.
- **Consequence:** an existing Strava connection row is treated as not
  connected, and that user sees the WHOOP pitch. Rows are left in the
  database.

## Answers

The user replied "continue with the above", taken as agreement to the
recommendations: D1 (a), D2 (a) with minutes moved, D3 (a), D4, D5.

Still unanswered: whether a WHOOP developer app and account are available
for a live test. The work is built and unit-tested without one; the live
connection stays a manual check owed by the user.

## Out of scope

- A recovery input in the model.
- Combining two providers.
- Deleting existing Strava rows from the database.
- Storing training fields in `wearable_daily` (the stale fallback loses
  them for Strava too; a migration of its own).
- Bringing `WEARABLES.md` fully in line with the code, beyond the WHOOP
  section this change touches.
