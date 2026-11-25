---
date: 2026-11-25
git_commit: 0ca0c27
branch: claude/adoring-mccarthy-43vsnt
questions: thoughts/shared/questions/2026-11-25-real-baseline.md
status: complete
---

# Research: per-day history and the baseline today

## Summary
`runModel` already walks `history ++ [today]` with EWMAs seeded from the
prior (`model.ts:104-134`), but every production call passes `[]`
(`scoreDay.ts:128`). The only per-day tables store the three work scores
(`daily_scores`) and recovery/sleep (`wearable_daily`); neither holds the
model's inputs (work load, Work Index, training load). Providers fetch 49
days of activities and bucket load per day, but return only baseline + today.

## Findings
1. **runModel:** chronic/acute start at `prior.load`; first day keeps
   chronic at the prior; then EWMA λ 2/22 and 2/8 (`model.ts:34-36,
   105-134`). `DayInputs` has no date (`:39-50`); one EWMA step per array
   element, so gaps are skipped, not decayed. `days` only changes the Flow
   why text (`:212-214`). Only today's sleep is read (`:146`).
2. **Tables:** `daily_scores` (user_email, date, performance, resilience,
   sustainability; unique (user_email, date); read-own RLS;
   `20260611_daily_scores.sql:10-29`). `wearable_daily` (recovery, sleep
   hours/performance, HRV, RHR, day strain; unique (user_email, date);
   `20260611_wearables.sql:28-49`). No work-load or training columns.
3. **Writes:** `/api/work-health` upserts `daily_scores` on every successful
   GET, keyed on the user's local date from the client timezone; last write
   wins; polls every 5 min (`work-health.ts:148-166`,
   `useWorkHealth.ts:112, 651-705`).
4. **History read:** `/api/score-history` returns 30 days of the three
   scores for `TrendsSection` (`score-history.ts:18-33`,
   `useWorkHealth.ts:600-620`); not used by the model.
5. **Call site:** `dashboardVerdict` runs in `WorkHealthDashboard.tsx:55-61`
   with today's metrics and today's wearable actuals only.
6. **Wearables:** `trainingLoadProfile` buckets 49 days of per-day load but
   returns `{baseline, today}` (`trainingLoad.ts:63-75`). Past sleep and
   recovery are not fetched.
7. **Engine:** prior = 55 + training baseline (`scoreDay.ts:29-34, 116-119`);
   `historyDays: 0` (`:177-182`); `PERSONAL_BASELINE_DAYS = 21`
   (`confidence.ts:17`).
8. **Migrations:** plain SQL in `supabase/migrations/`; how they are applied
   is not in the repo; routes use the service-role `supabaseAdmin`
   (`lib/supabase.js:12-27`) scoped by `session.user.email`.
9. **Tests:** no test passes a non-empty history to `runModel`.

## Open questions
- How migrations reach the live Supabase project.
