---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-google-busy-titles.md
status: awaiting approval
---

# Outline: Google "Busy" blocks count as meetings (ticket 6)

## Phase 1 (single phase)
- `src/lib/engine/workScores.ts`: `categorizeTitle(title?: string):
  MeetingCategory` = placeholder/empty → COLLABORATIVE, else
  `categorizeMeeting`. `toWorkEvent` uses it.
- `src/services/googleCalendar.ts`: a pure exported `toCalendarEvent(event)`
  (the mapping inside `getTodaysEvents`) using `categorizeTitle`;
  `getWeekAhead` uses `categorizeTitle`. Context keys unchanged.
- Golden: new day "busy placeholders" (Busy / Blocked / Tentative /
  Private event) built through `toCalendarEvent`; all existing snapshots
  unchanged.
- **Automated:** `toCalendarEvent` tests (placeholder → COLLABORATIVE,
  "Busy season planning" → NEUTRAL, missing title → 'No title'); week-ahead
  hours include Busy blocks; existing golden snapshots pass unchanged;
  `npm run verify`.
- **Manual:** none.
