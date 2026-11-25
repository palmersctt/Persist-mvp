---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-engine-input-contract.md
status: awaiting approval
---

# Outline: one engine entry point, with confidence

Three slices. Each leaves the app working and `npm run verify` green. No
model, work-score or session-call constant changes in any phase.

## Phase 1: work scores become pure engine functions

- New `src/lib/engine/workScores.ts`: `categorizeMeeting(title?: string,
  category?: MeetingCategory): MeetingCategory` and
  `scoreWork(meetings: EngineMeeting[], timezone: string): WorkScores`
  (`{ focus, strain, rhythm, meetingHours }`), plus the helpers they need
  (back-to-backs, focus time, longest stretch, gaps), moved out of
  `GoogleCalendarService` with `this.userTimezone` becoming a parameter.
  Untitled meetings each count as their own context (D2 a).
- `src/services/googleCalendar.ts`: `analyzeWorkHealth` and the schedule
  stats call the moved functions; the private copies are deleted.
- `pages/api/sandbox-score.ts`: uses `categorizeMeeting` instead of reaching
  into the private method.
- **Automated:** new `workScores.test.ts` with golden days (open, light,
  fragmented 8h, back-to-back afternoon, early/late, untitled-only) whose
  expected Focus/Strain/Rhythm are recorded from the **current** service
  before the move, then must still match through both `scoreWork` and
  `analyzeWorkHealth`. Plus: untitled meetings score like today's 'No title'
  events except for the context count.
- **Manual:** none (dashboard numbers unchanged by construction).

## Phase 2: `DayInput` in, verdict out

- New `src/lib/engine/types.ts`: `DayInput` (version 1), `EngineMeeting`,
  email/training/sleep/recovery/weekAhead sections, as in the design.
- New `src/lib/engine/parse.ts`: `parseDayInput(raw: unknown):
  { ok: true; input: DayInput } | { ok: false; errors: string[] }`.
- New `src/lib/engine/scoreDay.ts`:
  - `scoreFromWork(work: WorkScores, rest: Omit<DayInput, 'meetings'>):
    EngineResult` — the body of today's `dashboardVerdict` (prior, `runModel`,
    `sessionCall`), minus the `WorkHealthMetrics` shape;
  - `scoreDay(input: DayInput): EngineResult` = `scoreWork` (or the
    open-day / unknown-calendar neutral path) → `scoreFromWork`.
  Email is carried through on the result, never scored (D3 a).
- `src/lib/dashboardModel.ts`: `dashboardVerdict` maps `WorkHealthMetrics` +
  `WearableActuals` into `scoreFromWork`; its signature and return type are
  unchanged, so the dashboard and sandbox need no edits. (The dashboard
  keeps receiving computed scores from the server; meetings are not sent to
  the browser.)
- **Automated:** all existing `dashboardModel.test.ts` and
  `ReadinessExplain.test.tsx` pass unchanged; new `parse.test.ts` (valid,
  each rejection); new `scoreDay.test.ts`: raw meetings give the same
  verdict as the equivalent `dashboardVerdict` call, busy-only input scores,
  `meetings: []` is an open day (never Survival), absent meetings is
  neutral, email-only input scores neutrally and returns the email, same
  input twice gives identical output.
- **Manual:** none.

## Phase 3: confidence

- `src/lib/engine/confidence.ts`: `confidenceFor(input-presence):
  { level: 'low' | 'medium' | 'high'; missing: Missing[] }` — the D4 rule
  table, capped at medium while `history` is missing (always, until ticket
  3).
- `EngineResult` and `DashboardVerdict` gain `confidence`; `scoreDay` and
  `dashboardVerdict` fill it (dashboard: calendar = full detail when
  `WorkHealthMetrics` is from the calendar, unknown when estimated).
- `src/components/ReadinessExplain.tsx`: one line, e.g. "Medium confidence
  — no sleep data, no personal baseline yet", existing text tokens only.
- Docs: `src/lib/engine/README.md` documenting `DayInput` v1 and the result;
  `CLAUDE.md` Key Files rows for `src/lib/engine/`.
- **Automated:** `confidence.test.ts` (each row of the rule table, the cap);
  `scoreDay.test.ts` confidence cases; `ReadinessExplain.test.tsx` renders
  the line; confidence never changes verdict/scores/tier (same input with
  and without a sleep section differs only where sleep already did).
- **Manual:** open the dashboard and the sandbox, expand "Why your
  readiness", see the confidence line; card unchanged.
