---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-real-baseline.md
status: awaiting approval
---

# Outline: verdicts against your own history (ticket 3)

## Phase 1: the engine takes history
- `src/lib/engine/history.ts`: `DayRow` type (date, workLoad, workIndex,
  trainingLoad, trainingFeel, sleep); `historyFrom(rows, today, windowDays =
  42): { history: DayInputs[]; historyDays: number }` — dated rows before
  today, in order, inside the window; `historyDays` = rows in the last 21
  days.
- `scoreFromWork(..., calendar, past?: { history, historyDays })` passes
  history to `runModel` and `historyDays` to confidence; result gains
  `inputs: DayInputs` (today's model inputs, for saving).
  `dashboardVerdict(..., past?)` passes it through.
- **Automated:** `history.test.ts` (ordering, window, today excluded,
  historyDays); `scoreDay.test.ts`: day 1 = today's result; 5 heavy days
  raise the baseline; 21+ days lifts the confidence cap; existing tests
  unchanged; `npm run verify`.

## Phase 2: saved and read back
- `supabase/migrations/20261125_day_inputs.sql`: `day_inputs` (user_email,
  date, work_load, work_index, training_load, training_feel, sleep,
  engine_version, source, timestamps; unique (user_email, date); RLS on,
  read-own policy).
- `pages/api/day-inputs.ts`: session-gated GET `?days=42` → own rows;
  POST today's inputs (pure validator `parseDayRow` in `history.ts`, today's
  local date only). Fails soft if the table is missing (GET → `[]`).
- `WorkHealthDashboard.tsx`: fetch history once, pass to `dashboardVerdict`,
  POST `cardModel.inputs` when they change (skip identical repeats).
- **Automated:** `parseDayRow` tests; route tests (mocked session +
  Supabase): 401, own-rows-only, rejects other dates; `npm run verify`.
- **Manual:** you apply the migration; then the dashboard loads normally and
  a row appears for today.

## Phase 3: say it
- `ReadinessExplain`: the baseline row shows "Your baseline: N days" vs
  "Starting baseline"; engine README + WEARABLES.md updated.
- **Automated:** `ReadinessExplain.test.tsx` both states; `npm run verify`.
- **Manual:** dashboard "why" panel shows the baseline line.
