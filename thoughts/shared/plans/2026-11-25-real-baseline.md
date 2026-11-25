---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-real-baseline.md
outline: thoughts/shared/outlines/2026-11-25-real-baseline.md
status: in progress
---

# Plan: verdicts against your own history

## What we are not doing
Backfill (ticket 10); server-side scoring; changing EWMA constants or the
prior; trends UI.

## Phase 1: the engine takes history
### Changes
- `src/lib/engine/history.ts`: `DayRow`, `PastDays`, `NO_HISTORY`,
  `HISTORY_WINDOW_DAYS = 42`, `historyFrom(rows, today)`,
  `parseDayRow(raw, today)`.
- `scoreFromWork(…, calendar, past = NO_HISTORY)` → `runModel(prior,
  past.history, today)`; confidence gets `past.historyDays`; result gains
  `inputs`. `scoreDay(input, past?)`, `dashboardVerdict(…, past?)`.
### Automated checks
- [x] `history.test.ts`; `scoreDay.test.ts` "with history"
- [x] `npm run verify`

## Phase 2: saved and read back
### Changes
- `supabase/migrations/20261125_day_inputs.sql`.
- `pages/api/day-inputs.ts`: GET `?days=42` own rows; POST today's row via
  `parseDayRow` (local date from `timezone`); missing table → GET `[]`,
  POST 202 with `stored: false`.
- `src/hooks/useDayHistory.ts`: loads rows once, exposes `past` and
  `save(inputs)` (skips identical repeats).
- `WorkHealthDashboard.tsx`: passes `past` to `dashboardVerdict`, saves
  `cardModel.inputs` when they change.
### Automated checks
- [x] route tests (401; own rows only; rejects other dates; missing table)
- [x] `npm run verify`
### Notes from implementation
- The dashboard saves only once the wearable and the history read have both
  loaded, so a half-loaded day isn't logged; identical repeats are skipped
  client-side, and the upsert makes any extra write harmless.

### Manual checks
- [ ] Apply the migration; dashboard loads; a row appears for today.

## Phase 3: say it
### Changes
- `ReadinessExplain`: "Your baseline · N days logged" vs "Starting
  baseline" under the equation.
- Engine README, WEARABLES.md.
### Automated checks
- [ ] `ReadinessExplain.test.tsx` both states
- [ ] `npm run verify`
### Manual checks
- [ ] Dashboard "why" panel shows the baseline line.
