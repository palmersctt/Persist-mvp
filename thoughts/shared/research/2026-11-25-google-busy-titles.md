---
date: 2026-11-25
git_commit: 9f758ba
branch: claude/adoring-mccarthy-43vsnt
questions: thoughts/shared/questions/2026-11-25-google-busy-titles.md
status: complete
---

# Research: how event titles become categories on the Google path

## Summary

On the Google path a missing title becomes the literal `'No title'`
(`googleCalendar.ts:140`), and every title goes through `categorizeMeeting`
by substring match (`workScores.ts:200-219`). `NEUTRAL_KEYWORDS` contains
busy, blocked, unavailable, not available, tentative, hold, maybe, optional,
out of office and appointment (`:93-115`); NEUTRAL events are not meetings in
any score, schedule stat or week-ahead hour count, but still occupy focus
time. The engine's raw-input path already treats exact placeholder titles as
no title (`meaningfulTitle`, `:1022-1037`); the Google path does not use it.

## Findings

### Q1. Title → category and context key
- `getTodaysEvents`: all-day events dropped (`:138`); `summary || 'No title'`
  (`:140`); `category = categorizeMeeting(summary)` (`:151`); attendees
  `length || 1` (`:149`).
- `analyzeWorkHealth`: contextKey = lowercased summary (`:214-215`), so all
  'No title' events share one context.
- `getWeekAhead`: keeps `isActualMeeting({category: categorizeMeeting(summary
  || 'No title')})` (`:189-191`).

### Q2. Placeholder words in keyword lists
- NEUTRAL: 'not available', 'busy', 'blocked', 'unavailable', 'hold',
  'tentative', 'maybe', 'optional', 'out of office', 'appointment'
  (`workScores.ts:93-115`). Substring match: "Busy season planning" →
  NEUTRAL (`workScores.test.ts:70-71`).
- No list contains 'private': "Private"/"Private event" → COLLABORATIVE;
  "Private appointment" → NEUTRAL via 'appointment'.
- NEUTRAL events: excluded from Focus/Strain/Rhythm meeting sets (open-day
  branches return 90 / 12 / 90, `:512-517, :639-642, :739-745`), from all
  schedule stats (`:940-990`) and week-ahead hours (`googleCalendar.ts:189-191`);
  included in focus-time and fragmentation (`:521, :688, :947-948`).

### Q3. `meaningfulTitle`
- Exact (trimmed, lowercased) match against busy, tentative, blocked,
  unavailable, not available, private, private event, private appointment
  (`workScores.ts:1022-1037`). Used by `toWorkEvent` (raw path) and
  `calendarDetail` (confidence) only (`:1043-1065`; `scoreDay.ts:186-190`).

### Q4. Golden snapshot
- Runs `analyzeWorkHealth` on preloaded, pre-categorised events
  (`googleCalendar.golden.test.ts:9-15`; `goldenDays.fixture.ts:9-23`); does
  not exercise `getTodaysEvents` or `categorizeMeeting`.
- Only placeholder-style title: 'No title' ×3 (meetingCount 3,
  uniqueContexts 1, Focus 74, Strain 11, Rhythm 65).

### Q5. Other consumers of titles
- `claudeAI.ts` prompts with `event.summary` (`:165-168`) and hashes it into
  the cache key (`:459-465`).
- `cognitive-classification.ts` has its own keyword rules and ignores
  `MeetingCategory` (`:101-247`).
- `comicReliefGenerator` reads no titles.

### Q6. Google fields read
- summary, start/end dateTime, id, attendees.length, recurringEventId. Not
  read: visibility, transparency, eventType, status, responseStatus
  (`googleCalendar.ts:124-150`).

## Open questions (the code cannot answer)
- What Google returns as `summary` for free/busy-only shared events, and how
  often real calendars contain placeholder titles.
