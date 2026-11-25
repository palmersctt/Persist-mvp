# Google calendar blocks titled "Busy" don't count as meetings

**As** a Google Calendar user whose work events show up as "Busy" (a shared
or privacy-stripped work calendar),
**I want** those blocks counted as meetings,
**so that** a packed day doesn't read as an open one.

## Acceptance criteria

- On the Google path, placeholder titles (Busy, Tentative, Blocked,
  Unavailable, Private…) are treated as untitled meetings, matching the
  engine's raw-input path (`meaningfulTitle` in `src/lib/engine/workScores.ts`).
- Real titles that merely contain these words keep today's categorization.
- The golden snapshot changes only for days that contain placeholder titles,
  and the change is reviewed, not just re-recorded.

## Context

Today "busy"/"blocked"/"unavailable" are NEUTRAL keywords, so such blocks are
not meetings and a day of them scores as open (work load 0, Flow). Found by
validation of the engine input contract. Changes existing users' scores, and
touches the readiness model: full pipeline.
