# Readiness engine

One path from a day's signals to the card's verdict, whatever the source:
Google Calendar, Get your verdict (`/verdict`, in the browser), or an outside caller such as an AI assistant
that already has the user's calendar.

| Entry point                  | Takes                        | Used by                            |
| ---------------------------- | ---------------------------- | ---------------------------------- |
| `scoreDay(input)`            | a raw `DayInput`             | outside callers, future API        |
| `scoreFromWork(work, …)`     | already-computed work scores | the dashboard (`dashboardVerdict`) |
| `parseDayInput(raw)`         | untrusted JSON               | anything that accepts input        |
| `scoreWork(meetings, tz)`    | raw meetings                 | `scoreDay`                         |
| `analyzeWorkDay(events, tz)` | calendar events              | `GoogleCalendarService`            |

Both entry points run the same model (`../model.ts`) and session call
(`../weekPlan.ts`). Same input, same output: everything here is pure.

## `DayInput` v1

```jsonc
{
  "version": 1,
  "date": "2026-11-25", // user's local date
  "timezone": "America/New_York", // IANA; sets morning/afternoon/early/late
  "meetings": [
    // absent = calendar unknown; [] = open day
    {
      "start": "2026-11-25T09:00:00-05:00",
      "end": "2026-11-25T10:00:00-05:00",
      "attendees": 6, // optional, default 1
      "title": "Sprint planning", // optional, only used to pick a category
      "category": "COLLABORATIVE", // optional, wins over the title
      "organizerIsMe": true, // optional, not scored yet
    },
  ],
  "email": { "sent": 40, "sentAfterHours": 6, "received": 120 }, // not scored yet
  "training": {
    "loadToday": 45,
    "baseline": 38,
    "weekActivityCount": 4,
    "keySessions": [{ "daysAgo": 2, "kind": "hard" }],
  },
  "sleep": { "performance": 81 }, // 0–100
  "recovery": 66, // 0–100, gates intensity only
  "weekAhead": [{ "date": "2026-11-25", "meetingHours": 1.5 }],
}
```

Every section is optional. Absent means unknown, and unknown is neutral: a
missing calendar scores the work side as an open day (never a hard one) and
lowers confidence instead.

Categories: `BENEFICIAL`, `NEUTRAL`, `FOCUS_WORK` (not counted as meetings),
`LIGHT_MEETINGS`, `HEAVY_MEETINGS`, `COLLABORATIVE`. A meeting with neither
title nor category counts as `COLLABORATIVE`, the same default an unmatched
title gets. Each untitled meeting counts as its own topic for context
switching.

Placeholder titles from free/busy or privacy-stripped calendars (`Busy`,
`Tentative`, `Blocked`, `Unavailable`, `Not available`, `Private`,
`Private event`, `Private appointment`) count as no title, so a day of
"Busy" blocks scores as a day of meetings at low confidence. (The Google
Calendar path keeps its existing title handling for now.)

`parseDayInput` rejects malformed fields with a list of errors and copies
only known fields, so extra keys (a meeting body, notes) never travel on. It
also requires:

- meeting times as ISO 8601 date-times **with an offset** (`Z` or `±hh:mm`);
- each meeting to start on `date` in `timezone`;
- a real calendar `date` (no `2026-02-31`);
- at most 100 meetings;
- `weekAhead` days in order, one per day.

## Result

The card's verdict (`DashboardVerdict`): Readiness, Load, Balance, verdict,
tier, label, rec, why, the week plan, the Focus/Strain/Rhythm breakdown, plus:

- `confidence: { level: 'low' | 'medium' | 'high', missing: [...] }`
- `email`: the counts sent in, untouched (`scoreDay` only)

## Confidence

| Level  | When                                                                         |
| ------ | ---------------------------------------------------------------------------- |
| high   | full calendar (titles or categories) + training + sleep + 21 days of history |
| medium | any calendar + training or sleep, or a full calendar alone                   |
| low    | busy-only blocks alone, or no calendar                                       |

Confidence stays capped at medium until 21 days are logged in the last 21
calendar days (see History). Confidence never changes the verdict, scores or tier.

## History

Each scored day's model inputs (work load, Work Index, training load,
training feel, sleep — numbers only) are saved to `day_inputs` via
`/api/day-inputs`. `historyFrom(rows, today)` (`history.ts`) turns the last 42
days into the history `runModel` walks; gaps are skipped, not filled. Pass it
as the last argument to `scoreDay` / `scoreFromWork` / `dashboardVerdict`.
With no history the verdict is the day-one result against the prior.

## Not yet

- Email does not move any score until it can be calibrated against how days
  actually felt.
