---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-daily-feel-checkin.md
status: approved
---

# Outline: one-tap feel rating (ticket 4; after ticket 3)

## Phase 1: store it
- `supabase/migrations/20261125000002_day_feel.sql`: `day_inputs` adds
  `verdict text`, `readiness smallint`, `feel_rating smallint check 1-5`,
  `rated_at timestamptz`.
- `POST /api/day-inputs` also saves verdict + readiness.
  `PATCH /api/day-inputs` `{date, rating}`: today or yesterday only; creates
  the row if missing. Pure `parseFeel(body, today)` validator.
- **Automated:** `parseFeel` tests (range, dates); route tests (401, other
  user's row untouchable, yesterday allowed, two days ago rejected);
  `npm run verify`.
- **Manual:** you apply the migration.

## Phase 2: the tap
- `src/components/FeelCheckin.tsx`: "How did today actually feel?" + five
  chips (Drained · Heavy · OK · Good · Great), selected chip in lime,
  optimistic save, quiet failure; shows the saved rating from GET.
  Rendered under the hero card in `WorkHealthDashboard.tsx`.
- **Automated:** `FeelCheckin.test.tsx` (renders five chips, tap calls save
  with rating, shows saved state); `npm run verify`.
- **Manual:** tap a rating on the dashboard, reload, it's still selected.
