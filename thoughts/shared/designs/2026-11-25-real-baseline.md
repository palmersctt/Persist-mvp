---
date: 2026-11-25
git_commit: 0ca0c27
ticket: thoughts/shared/tickets/2026-11-25-3-real-baseline.md
research: thoughts/shared/research/2026-11-25-real-baseline.md
status: awaiting decisions
---

# Design: the verdict is measured against my own history

## Current state
- `runModel` supports history but always gets `[]`; the baseline is a fixed
  prior (55 + training baseline) (`scoreDay.ts:116-128`).
- No table stores the model's daily inputs; `daily_scores` holds only
  Focus/Strain/Rhythm for trends.
- Confidence is capped at medium because `historyDays` is always 0.

## Desired end state
- Each scored day's model inputs are saved per user: work load, Work Index,
  training load, training feel, sleep, plus the engine version.
- The verdict runs `runModel(prior, history, today)` with the user's last
  days (today excluded). Day one still gets a real verdict from the prior.
- `historyDays` = days logged in the last 21 calendar days; at 21 the cap
  lifts and the why panel says the baseline is personal.
- How to see it: tests for day 1, day 5 and day 25; on the dashboard, the
  confidence line drops "no personal baseline yet" after 21 logged days.

## Patterns to follow
- `daily_scores` migration + upsert in `work-health.ts:148-166`;
  `score-history.ts` for a session-gated read; engine purity.

## Decisions

**D1. Where the inputs live.**
- a) New table `day_inputs` (user_email, date, work_load, work_index,
  training_load, training_feel, sleep, engine_version, updated_at; unique
  (user_email, date); read-own RLS).
- b) New columns on `daily_scores`.
- **Recommend a.** `daily_scores` is the trends table; the model's inputs
  have a different owner (the engine) and will also be written by the
  assistant route (ticket 5).

**D2. Who writes the row.** Today the verdict is computed in the browser,
from work (server) and wearable actuals (another route).
- a) A session-gated `POST /api/day-inputs` the dashboard calls once it has
  a verdict, sending today's `DayInputs` (validated, own row only); and
  `GET /api/day-inputs?days=42` for the history.
- b) Move scoring to the server (one route fetches calendar + wearable and
  writes the row).
- **Recommend a.** It's small and matches today's client-side scoring. The
  user can only write their own row, and it is their own data. b is the
  right long-term shape and comes naturally with ticket 5's server routes.

**D3. Gaps between logged days.**
- a) Use logged days only, in date order, over the last 42 calendar days
  (today's EWMA behaviour: a gap is skipped).
- b) Fill each missing day with a neutral day (so acute load decays over a
  week off).
- **Recommend a** for now: a missing day is unknown, not a rest day, and the
  engine's rule is "absent means unknown, unknown means neutral". Revisit
  with feel data (ticket 4).

**D4. Backfill.** The calendar could be read 21 days back at first connect,
giving a personal work baseline on day one.
- **Recommend out of scope**, as its own ticket. It is a bigger Google fetch
  and a different risk.

**D5. Applying the migration.** The repo doesn't show how migrations reach
Supabase. A Supabase connection is available in this session.
- **Recommend:** I write the SQL file; you apply it, or tell me to apply it
  through the connected Supabase project. It writes to your production
  database, so I won't do it without an explicit go.

## Open questions for you
1. D2 a (client posts its own day) or b (server-side scoring now)?
2. D4: OK to defer the 21-day calendar backfill to its own ticket?
3. D5: will you apply the migration, or should I, through Supabase?

## Out of scope
- Backfill; server-side scoring; changing EWMA constants or the prior;
  trends UI; the feel rating (ticket 4).
