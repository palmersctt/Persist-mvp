---
date: 2026-11-25
git_commit: cce0349
ticket: thoughts/shared/tickets/2026-11-25-4-daily-feel-checkin.md
research: thoughts/shared/research/2026-11-25-daily-feel-checkin.md
status: awaiting decisions
depends_on: thoughts/shared/designs/2026-11-25-real-baseline.md
---

# Design: one tap, "how did today actually feel?"

## Current state
No user rating exists. The verdict and its inputs aren't stored, so there is
nothing to compare a rating against (ticket 3 adds `day_inputs`).

## Desired end state
- Under the card on the dashboard, a single row: **"How did today actually
  feel?"** with five tappable chips, 1–5 (Drained · Heavy · OK · Good ·
  Great). One tap saves; the chosen chip shows lime; tap another to change.
  No modal, no nag, no reminder.
- Stored on that day's `day_inputs` row (ticket 3) next to the verdict and
  scores the user saw, so calibration is a single query.
- `GET /api/day-inputs?days=N` returns your own rows, including the rating
  (the "export"). Team-level analysis is a SQL query on Supabase.

## Decisions

**D1. Where the rating lives.**
- a) `feel_rating smallint` (1–5, nullable) + `rated_at` on ticket 3's
  `day_inputs`, which also gains `verdict` and `readiness` (what the user
  was shown).
- b) Separate `day_feel` table.
- **Recommend a.** One row per day holds inputs, verdict and rating, so
  calibration is one query. It makes ticket 4 depend on ticket 3.

**D2. Does the rating change today's verdict?**
- a) No. Calibration data only, for now.
- b) Yes: map it into `trainingFeel` (−1..+1).
- **Recommend a.** `trainingFeel` only acts on training days and drives 45%
  of Readiness. Feeding it uncalibrated ratings creates a loop before we
  know what a "2" means. Revisit once there's data.

**D3. Which days can be rated.** Today and yesterday (people rate in the
evening or next morning). **Recommend.**

**D4. Scale and words.** 1–5 with labels Drained / Heavy / OK / Good /
Great; numbers stored. **Recommend**, open to your wording.

**D5. Analytics.** Also send `feel_rated` through `trackEvent` for the
funnel? **Recommend no.** The row is the record; no duplicate.

**D6. Hard rules.** Chips use existing tokens (surface, rule, lime for the
selected one); no card change (it sits under the card, not in it).

## Open questions for you
1. D2: rating as calibration only (recommended), or fed into the verdict?
2. D4: are those five words right?

## Out of scope
- Using ratings to tune constants (that is the analysis that follows);
  reminders/notifications; the assistant tool (ticket 5).

## Security note (found in research, not this ticket)
`GET /api/analytics/users` and `GET /api/analytics/events` return every
user's data to any signed-in user (`analytics/users.ts:7-80`,
`events.ts:50-80`). Ratings must not be exposed the same way. Recommend a
separate, urgent ticket to lock those two routes down.
