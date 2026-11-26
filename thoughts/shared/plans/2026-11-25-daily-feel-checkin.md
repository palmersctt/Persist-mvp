---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-daily-feel-checkin.md
outline: thoughts/shared/outlines/2026-11-25-daily-feel-checkin.md
status: implemented
---

# Plan: one-tap feel rating

## What we are not doing
Feeding the rating into the verdict; reminders; the assistant tool (ticket 5).

## Phase 1: store it
### Changes
- `supabase/migrations/20261125000002_day_feel.sql`: verdict, readiness,
  feel_rating (1–5), rated_at on `day_inputs`.
- `history.ts`: `DayRow` gains optional verdict/readiness (validated);
  `parseFeel(raw, today)`, `FEEL_LABELS`, `dayBefore`.
- `/api/day-inputs`: POST saves verdict + readiness; PATCH `{date, rating}`;
  GET adds `feel` for today and yesterday.
- `useDayHistory.save(inputs, shown)`; dashboard passes verdict + readiness.
### Automated checks
- [x] `history.test.ts` (parseFeel, verdict fields); route tests (PATCH own
      row, yesterday, rejects, 404)
- [x] `npm run verify`
### Notes from implementation
- PATCH updates an existing row and answers 404 if that day was never
  scored, instead of creating one: the row's input columns are NOT NULL, and
  the check-in only appears once the day is scored, so the row exists.
- The missing-table GET response gained `feel: {}`; that route test's
  expectation was updated to the new shape.
### Manual checks
- [ ] Apply `20261125000002_day_feel.sql` after `20261125000001_day_inputs.sql`.

## Phase 2: the tap
### Changes
- `src/components/FeelCheckin.tsx` under the hero card; `useDayHistory`
  exposes `feel` and `rate(date, rating)`.
### Automated checks
- [x] `FeelCheckin.test.tsx`
- [x] `npm run verify`
### Notes from implementation
- The rating is optimistic and reverts if the save fails (for example a tap
  in the second before today's row is first written).
- Chips are a radio group, 44px tall, lime when selected (existing tokens).

### Manual checks
- [ ] Tap a rating, reload, it's still selected.
