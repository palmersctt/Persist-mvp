---
date: 2026-11-25
git_commit: a894872
design: thoughts/shared/designs/2026-11-25-engine-input-contract.md
outline: thoughts/shared/outlines/2026-11-25-engine-input-contract.md
status: ready
---

# Plan: one engine entry point, with confidence

## What we are not doing

- No change to any constant, threshold, weight or rule in `model.ts`,
  `weekPlan.ts`, or the work-score maths. Google users' numbers are identical.
- No API route, MCP server, persistence, history, feel input (tickets 3–5).
- No change to `CardContent`, `MOODS`, tiers, score or verdict names, colours.
- No change to `cognitive-classification.ts` / `/api/cognitive-positioning`.
- Not deleting `estimateScores.ts` / `sandbox-personas.ts`.
- `analyzeWorkDay` does not sort events (Google returns them sorted; the
  sandbox's current unsorted behaviour is kept). Only `scoreWork` (the new
  raw-meeting path) sorts by start.

## Phase 1: work scores become pure engine functions

### Changes

1. **Golden test first, against the unmoved code.**
   `src/services/googleCalendar.golden.test.ts`: eight fixed days (open,
   bored standup, fragmented 8h heavy, back-to-back afternoon, early/late
   boundary, mixed focus + beneficial, untitled 'No title' meetings,
   unsorted sandbox-style input), all in America/Los_Angeles with explicit
   UTC instants. Each runs `new GoogleCalendarService().analyzeWorkHealth(
   undefined, events)` and `toMatchSnapshot()`s the whole result. Run once to
   write `__snapshots__/googleCalendar.golden.test.ts.snap`; commit it with
   the phase.
2. **`src/lib/engine/workScores.ts`** (new), pure, no imports beyond types:
   - `export type MeetingCategory` (moved; `googleCalendar.ts` re-exports it).
   - Keyword lists + `COMPOUND_OVERRIDES` (moved verbatim).
   - `export function categorizeMeeting(title: string): MeetingCategory`
     (body of `categorizeEvent`).
   - `export interface WorkEvent { start: Date; end: Date; attendees?:
     number; category?: MeetingCategory; contextKey: string }` —
     `contextKey` replaces `summary?.toLowerCase().trim()`.
   - Moved as functions taking `(events, timezone)` where they used
     `this.userTimezone`: `hourIn`, `countBackToBack`, `focusTimeMinutes`,
     `fragmentationScore`, `cognitiveAvailability`, `focusScore` (was
     `calculateAdaptivePerformanceIndex`), `strainScore` (was
     `calculateCognitiveResilience`), `rhythmScore` (was
     `calculateWorkRhythmRecovery`), `longestStretch`, `gapsBetween`,
     `legacyReadiness` (was `calculatePerformanceIndex`).
   - `export function analyzeWorkDay(events: WorkEvent[], timezone: string):
     WorkDayAnalysis` returning `{ focus, strain, rhythm, focusTime,
     cognitiveAvailability, legacyReadiness, meetingCount, focusWorkCount,
     beneficialCount, schedule }` where `schedule` is the existing schedule
     object (same fields, same rounding).
   - `export function scoreWork(meetings: EngineMeeting[], timezone: string):
     WorkDayAnalysis` — sort by start, map to `WorkEvent` (category =
     `m.category ?? categorizeMeeting(m.title)` when a title exists, else
     `m.category ?? 'COLLABORATIVE'`; contextKey = lowercased trimmed title,
     else `untitled:<index>`; attendees = `m.attendees ?? 1`), then
     `analyzeWorkDay`.
3. **`src/lib/engine/types.ts`** (new): `EngineMeeting { start: string; end:
   string; attendees?: number; title?: string; category?: MeetingCategory;
   organizerIsMe?: boolean }`.
4. **`src/services/googleCalendar.ts`**: delete the moved private methods and
   keyword lists; `categorizeEvent` → `categorizeMeeting`; `analyzeWorkHealth`
   maps `CalendarEvent` → `WorkEvent` (contextKey from summary, as before)
   and builds status / contributors / primaryFactors / return object from
   `analyzeWorkDay(…, this.userTimezone)`. `export type { MeetingCategory }`.
5. **`pages/api/sandbox-score.ts`**: import `categorizeMeeting` instead of the
   bracket access to the private method.

### Automated checks
- [x] Golden snapshot written against the unmoved service, then passes
      unchanged after the move: `npx vitest run src/services`
- [x] `src/lib/engine/workScores.test.ts`: `scoreWork` on `EngineMeeting`
      versions of the golden days gives the same focus/strain/rhythm/
      durationHours as the snapshot; unsorted input is sorted; untitled
      meetings each count as a context (`uniqueContexts === n`);
      `category` supplied wins over title; `categorizeMeeting` cases
      ('working lunch' → COLLABORATIVE, 'gym' → BENEFICIAL, unmatched →
      COLLABORATIVE).
- [x] `npm run verify`

### Notes from implementation
- The moved helpers keep their original names (`calculateAdaptivePerformanceIndex`
  etc.) rather than the short names above, so the move reads as a pure move;
  only `categorizeMeeting`, `isActualMeeting`, `analyzeWorkDay`, `toWorkEvent`
  and `scoreWork` are exported.
- The golden fixtures live in `src/services/goldenDays.fixture.ts` so the
  engine test can reuse them without re-running the golden suite.

### Manual checks
- none (numbers unchanged by construction)

## Phase 2: `DayInput` in, verdict out

### Changes

1. **`src/lib/engine/types.ts`**: add `DayInput` (version 1, date, timezone,
   meetings?, email?, training?, sleep?, recovery?, weekAhead?) and
   `EngineResult = DashboardVerdict & { email: DayInput['email'] | null }`.
   `training` = `{ loadToday?, baseline?, keySessions?, weekActivityCount? }`.
2. **`src/lib/engine/parse.ts`**: `parseDayInput(raw: unknown)` returning
   `{ ok: true; input } | { ok: false; errors: string[] }`. Rejects: version
   ≠ 1, bad `date` (not YYYY-MM-DD), bad timezone (`Intl.DateTimeFormat`
   throws), meeting start/end not parseable or end ≤ start, negative or
   non-integer counts, attendees < 1, unknown category, sleep/recovery outside
   0–100, negative training numbers. Unknown keys are ignored.
3. **`src/lib/engine/scoreDay.ts`**:
   - `scoreFromWork(work: WorkScoresIn, rest: RestIn, todayDate: string):
     DashboardVerdict` — the current body of `dashboardVerdict` moved
     verbatim, reading `work.focus/strain/rhythm/meetingHours` and
     `rest.training/sleep/recovery/weekAhead`.
   - `scoreDay(input: DayInput): EngineResult`: meetings present →
     `scoreWork` → `scoreFromWork`; `meetings: []` → `scoreWork([])` (open
     day, same as Google with no events); meetings absent → neutral work
     (the open-day scores with 0 hours, the same values `scoreWork([])`
     gives) so the verdict leans on body data, never Survival from a missing
     calendar. Email copied to the result untouched.
4. **`src/lib/dashboardModel.ts`**: `dashboardVerdict` maps
   `WorkHealthMetrics` + `WearableActuals` into `scoreFromWork`. Exported
   signature and `DashboardVerdict` unchanged (type re-exported from where
   it is declared).

### Automated checks
- [x] Existing `dashboardModel.test.ts`, `ReadinessExplain.test.tsx`,
      `weekPlan.test.ts` pass with no edits
- [x] `src/lib/engine/parse.test.ts`: a full valid input; each rejection
- [x] `src/lib/engine/scoreDay.test.ts`: raw meetings → same verdict, scores
      and label as `dashboardVerdict` on the equivalent metrics; busy-only
      meetings score; `meetings: []` is never Survival/bad; absent meetings
      equals the open-day verdict; email-only input returns the email and the
      same verdict as with no email; identical input twice → deep-equal
      output.
- [x] `npm run verify`

### Notes from implementation
- `scoreFromWork(work, body, weekAhead, todayDate)` takes the body signals
  (`training`, `sleep` as a number, `recovery`) and the forecast as separate
  arguments rather than one `rest` object.
- `DashboardVerdict` moved to `engine/scoreDay.ts`; `dashboardModel.ts`
  re-exports it, so its importers are unchanged.
- `parseDayInput` copies only known fields into the result, so unknown keys
  (e.g. a meeting body) never travel past validation.

### Manual checks
- none

## Phase 3: confidence

### Changes

1. **`src/lib/engine/confidence.ts`**: `type Missing = 'calendar' |
   'meetingDetail' | 'training' | 'sleep' | 'history'`;
   `confidenceFor(p: { calendar: 'full' | 'busy' | 'unknown'; training:
   boolean; sleep: boolean; historyDays: number }): Confidence`.
   Rule table: high = full + training + sleep; medium = any calendar + one of
   training/sleep, or full alone; low = otherwise. `historyDays < 21` adds
   `'history'` and caps at medium. `missing` lists every absent input in the
   order of the type.
2. `DashboardVerdict` gains `confidence: Confidence`. `scoreFromWork` takes the
   presence flags and fills it. `scoreDay`: calendar = 'unknown' if meetings
   absent, 'full' if every meeting has a title or category (or none exist),
   else 'busy'. `dashboardVerdict`: 'full' when `work.breakdown?.source`
   is 'calendar' or absent, 'unknown' when 'estimated'; historyDays = 0.
3. **`src/components/ReadinessExplain.tsx`**: one muted line under the
   equation row: "{Level} confidence — {missing list}", e.g. "Medium
   confidence — no sleep data, no personal baseline yet". Existing
   `var(--…)` tokens, no italics.
4. Docs: `src/lib/engine/README.md` (DayInput v1, result, confidence table,
   email-not-scored note); `CLAUDE.md` Key Files rows for
   `src/lib/engine/`.

### Automated checks
- [ ] `src/lib/engine/confidence.test.ts`: each rule row; the history cap;
      `missing` contents
- [ ] `scoreDay.test.ts`: busy-only → low; full calendar + training + sleep →
      medium (capped) with only `history` missing; confidence never changes
      verdict/scores/tier
- [ ] `ReadinessExplain.test.tsx`: the confidence line renders
- [ ] `npm run verify`

### Manual checks
- [ ] Dashboard: expand "Why your readiness" — the confidence line shows; the
      card itself is unchanged
- [ ] Sandbox: score a custom day — same line shows
