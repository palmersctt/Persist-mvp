---
date: 2026-11-25
git_commit: 0ade6a6
ticket: thoughts/shared/tickets/2026-11-25-1-engine-input-contract.md
research: thoughts/shared/research/2026-11-25-engine-input-contract.md
status: awaiting decisions
---

# Design: one engine entry point for any data source, with confidence

## Current state

- `runModel` (`src/lib/model.ts:104`) is pure but takes pre-digested inputs:
  `workLoad`, `workIndex`, `trainingLoad`, `trainingFeel`, `sleep`.
- The card's verdict is not `runModel`'s. `dashboardVerdict`
  (`src/lib/dashboardModel.ts:61-148`) builds the inputs from the Google-shaped
  `WorkHealthMetrics` plus `WearableActuals`, runs the model with empty history
  (`:99`), then `sessionCall` (`src/lib/weekPlan.ts:168`) rewrites verdict,
  rec, why and adds label + plan.
- Focus/Strain/Rhythm are private methods of `GoogleCalendarService`
  (`src/services/googleCalendar.ts:666-987`), fed by start, end, attendee
  count and a title-keyword category (`:273-294`). Strain also counts unique
  titles as context switches (`:812-813`). The only non-Google route into
  them is `/api/sandbox-score`, which fabricates `CalendarEvent`s.
- Missing data becomes a neutral default (`dashboardModel.ts:27-29, 73,
  78-85, 95`). Nothing reports how much data the verdict stood on.
- No email input exists.
- Everything runs client-side; no route returns a verdict.

So an outside caller with raw meeting times cannot get a verdict without
pretending to be Google Calendar.

## Desired end state

- One pure function, `scoreDay(input)`, in a new `src/lib/engine/` module,
  with no React, Google, Supabase or `WorkHealthMetrics` dependency. Runs the
  same in the browser, an API route, or an MCP server (ticket 5).
- A versioned, documented `DayInput` where every section is optional:

  ```ts
  interface DayInput {
    version: 1;
    date: string;            // YYYY-MM-DD, user's local date
    timezone: string;        // IANA; needed for morning/afternoon/early/late
    meetings?: Meeting[];    // omitted = calendar unknown; [] = open day
    email?: { sent?: number; sentAfterHours?: number; received?: number };
    training?: { loadToday?: number; baseline?: number;
                 keySessions?: KeySession[] };
    sleep?: { performance?: number };   // 0–100
    recovery?: number;                  // 0–100, gates only (as today)
    weekAhead?: { date: string; meetingHours: number }[];
  }
  interface Meeting {
    start: string; end: string;         // ISO with offset
    attendees?: number;
    title?: string;                     // used for category, never stored
    category?: MeetingCategory;         // caller-supplied wins over title
    organizerIsMe?: boolean;            // accepted, unused for now
  }
  ```

- `scoreDay` returns today's `DashboardVerdict` fields (scores, verdict, tier,
  label, rec, why, plan, breakdown) plus:

  ```ts
  confidence: { level: 'low' | 'medium' | 'high';
                missing: ('calendar' | 'meetingDetail' | 'training' |
                          'sleep' | 'history')[] };
  ```

- `dashboardVerdict` and `/api/sandbox-score` become thin adapters onto
  `scoreDay`; Google users see identical scores and verdicts.
- How to see it: golden tests run representative days through the old path
  and `scoreDay` and get equal results; new tests score busy-only, email-only,
  and empty inputs; the "why" panel shows one confidence line.

## Patterns to follow

- Pure-function modules with colocated Vitest tests: `model.ts` /
  `model.test.ts`, `weekPlan.ts` / `weekPlan.test.ts`.
- Absent means unknown, unknown means neutral, never 0
  (`designs/2026-11-11-whoop-provider.md`); `keySessions` absent vs `[]`
  (`wearables/types.ts:57-61`) is the model for `meetings` absent vs `[]`.
- Adapter style of `dashboardModel.ts`: map a source's shape into the
  engine's, keep the mapping in one place.

## Decisions

**D1. Fold ticket 2 (meeting scoring) into this change?**
- a) No. `DayInput` takes pre-computed Focus/Strain/Rhythm + meeting hours;
  ticket 2 adds raw meetings later. Small, but the contract is useless to an
  assistant until ticket 2 lands, and the shape would change in between.
- b) Yes. Move the Focus/Strain/Rhythm functions and `categorizeEvent` out of
  `GoogleCalendarService` into `src/lib/engine/workScores.ts` as pure
  functions taking `(meetings, timezone)`; the service calls them.
- **Recommend b.** The contract's whole point is raw meetings in. The move is
  mechanical (methods → functions, `this.userTimezone` → parameter) and
  golden tests guard it. Ticket 2 then closes with this change.

**D2. Meetings without titles (busy-only or privacy-stripped).**
- Category: caller's `category` → else title keywords → else the existing
  default, COLLABORATIVE (`googleCalendar.ts:291`). Identical to today for
  untitled Google events.
- Context switching (Strain) counts unique titles. Without titles:
  - a) count each untitled meeting as its own context;
  - b) count category changes between consecutive meetings.
- **Recommend a.** Real calendars rarely repeat titles in a day, so this is
  closest to current behaviour; b) would systematically lower Strain for
  privacy-conscious callers.
- Attendees absent → 1, as Google does today (`googleCalendar.ts` `|| 1`).

**D3. Email: accept now, score later?**
- a) Accept, validate and return it, but it does not move any score until
  calibrated against feel ratings (ticket 4).
- b) Score it now (e.g. after-hours sends add Strain) with hand-picked weights.
- **Recommend a.** We just agreed hand-tuned constants are the engine's
  weakness; adding more before ticket 4 repeats it. `missing` and the why
  text stay honest ("email received, not yet used").

**D4. How confidence is defined.**
- a) Rule table, deterministic, from what is present:
  - calendar: full detail (titles or categories) / busy-only / unknown
  - training (baseline known), sleep, history days (always 0 until ticket 3)
  - high = full calendar + training + sleep; medium = any calendar + one of
    training/sleep, or full calendar alone; low = busy-only alone or no
    calendar.
- b) A 0–1 score blended from the same signals.
- **Recommend a.** Three levels are explainable in one sentence, testable,
  and an assistant can relay them; a number implies precision we don't have.
  Confidence never changes the verdict, scores or tier.
- `history` is always reported missing until ticket 3, so today's best case
  is "high" with `missing: ['history']`. (Alternative: cap at medium until
  history exists. See open question 2.)

**D5. Where `sessionCall` lives.** It produces the card's verdict, so
`scoreDay` must include it. `scoreDay` = input normalisation → work scores →
`runModel` → `sessionCall` → confidence. `runModel` and `sessionCall` are
called, not changed.

**D6. Validation.** No schema library is installed. Hand-written
`parseDayInput(unknown): {ok, input} | {ok:false, errors}` beside the types,
rejecting bad dates/times, end ≤ start, negative counts, out-of-range sleep.
Avoids a new dependency; revisit if ticket 5 wants JSON Schema for MCP (can
be generated from the same types later).

**D7. Hard rules check (CLAUDE.md).** No new verdicts, tiers, score names or
moods; card renderer untouched; `MOODS` untouched; no colors. Confidence
shows only in `ReadinessExplain` as one text line using existing tokens —
open question 1 if it should be on the card.

## Open questions for you

1. Should confidence appear **on the card** (e.g. a small "low confidence"
   tag), or only in the "why" panel and the API? (Recommend: why panel only
   for now; the card stays clean.)
2. Until a personal baseline exists (ticket 3), cap confidence at **medium**,
   or allow **high** with "history" listed as missing? (Recommend: cap at
   medium. It's the honest read of what we told you about the engine.)
3. D1: OK to fold ticket 2 into this change?
4. D3: OK that email is accepted but not scored until feel ratings exist?

## Out of scope

- Persisting inputs / real history (ticket 3).
- Feel check-in and calibration (ticket 4).
- Any API route or MCP server exposing `scoreDay` (ticket 5).
- Changing any constant, threshold or weight in the model, the work scores,
  or `sessionCall`. Behaviour for existing Google users stays identical.
- `cognitive-classification.ts` and `/api/cognitive-positioning`.
- Deleting the unused `estimateScores.ts` / `sandbox-personas.ts`.
