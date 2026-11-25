# Free and declined calendar events shouldn't count as meetings

**As** a Google Calendar user, **I want** events I declined or marked "free"
left out of my load, **so that** my verdict reflects meetings I actually have.

## Acceptance criteria
- Events with `transparency: 'transparent'` or where my
  `attendees[].responseStatus` is `declined` are not meetings on the Google
  path (today and week ahead).
- Golden snapshot unchanged for days without such events.

## Context
Follow-up from the Google placeholder-titles design (D3). Google fields
`transparency` and `responseStatus` are not read today
(`googleCalendar.ts:124-150`). Readiness model: full pipeline.
