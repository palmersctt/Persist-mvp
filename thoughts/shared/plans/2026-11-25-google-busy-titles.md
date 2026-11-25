---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-google-busy-titles.md
outline: thoughts/shared/outlines/2026-11-25-google-busy-titles.md
status: implemented
---

# Plan: Google "Busy" blocks count as meetings

## What we are not doing
Context counting for untitled Google events; free/declined events (ticket 9).

## Phase 1
### Changes
- `workScores.ts`: `categorizeTitle(title)`; `toWorkEvent` uses it.
- `googleCalendar.ts`: exported pure `toCalendarEvent(event)` (the mapping
  that was inline in `getTodaysEvents`), using `categorizeTitle`;
  `getWeekAhead` uses `categorizeTitle`. The now-unused private
  `parseCalendarDateTime` (a bare `new Date`) is removed.
- Golden: new "busy placeholders" day built from raw Google events through
  `toCalendarEvent`.
### Automated checks
- [x] `toCalendarEvent.test.ts`; golden suite (8 existing snapshots
      unchanged, 1 new)
- [x] `npm run verify`
### Manual checks
- none
