---
date: 2026-11-25
git_commit: 0ade6a6
branch: claude/adoring-mccarthy-43vsnt
questions: thoughts/shared/questions/2026-11-25-engine-input-contract.md
status: complete
---

# Research: how the readiness engine gets its inputs today

## Summary

`runModel(prior, history, today)` (`src/lib/model.ts:104`) is a pure function
over five numeric day inputs. Its only production caller is
`dashboardVerdict` (`src/lib/dashboardModel.ts:99`), which always passes an
empty history and a prior built from fixed defaults. `dashboardVerdict` then
hands the model result to `sessionCall` (`src/lib/weekPlan.ts:168`), which
replaces verdict, rec, why and adds label/plan. The model and the session
call both run in the browser; no API route returns a verdict.

Focus/Strain/Rhythm are computed inside `GoogleCalendarService`
(`src/services/googleCalendar.ts:666-987`) from event start, end, attendee
count and a title-keyword category. The only non-Google path into that code is
`POST /api/sandbox-score`, which builds synthetic `CalendarEvent`s and calls
the same service. Missing inputs are replaced with neutral defaults; nothing
reports completeness or confidence. No mailbox data exists anywhere.

## Findings

### Q1. `runModel` inputs and outputs
- `DayInputs` (`model.ts:39-50`): `workLoad` (~0..120), `workIndex` (0–100),
  `trainingLoad`, `trainingFeel` (−1..+1), `sleep` (0–100, 62 neutral).
  `Prior` (`:53-56`): `load`, `trainingLoad`.
- `workIndex = clamp(0.3·focus + 0.3·rhythm + 0.4·(100−strain))` (`:63-65`).
- Loop over `history ++ [today]` (`:105-131`): `dayLoad = workLoad +
  trainingLoad`; `restore = (workLoad·(workIndex−50)/50 + trainingLoad·
  trainingFeel)/100`. Chronic stays at the prior on the first day; afterwards
  EWMA λ=2/22 (chronic), 2/8 (acute, feel) (`:34-36`, `:117-129`).
- `acwr = acute/chronic` (1.0 if chronic ≤ 2) (`:133`).
- Readiness = 0.45·effFit + 0.45·feelScore + (today.sleep−62)·0.35, where fit
  only drops above ACWR 1.15 (`:140-147`). Only today's sleep is read.
  Load (`:148-150`) and Balance = feel·100 (`:151`).
- `recommend` (`:172-223`), first match: ACWR>1.32 or readiness<42 →
  Survival; trainingAcwr<0.82 & readiness≥58 → Locked In; feel<−0.16 →
  Grinding; readiness≥66 or feel>0.12 → Flow; else Coasting.
- `ModelResult` (`:80-96`) has no completeness/confidence field.

### Q2. `dashboardVerdict`
- Reads `adaptivePerformanceIndex`, `cognitiveResilience`,
  `workRhythmRecovery`, `schedule.durationHours` (`dashboardModel.ts:68-74`).
  `workLoad = clamp(round(hours·11), 0, 120)` (`:23`, `:53-54`).
- Wearable: no `trainingBaseline` → baseline 30 and today = baseline
  (neutral) (`:27`, `:78-80`); no `sleepPerformance` → 62 (`:29`, `:83-85`).
- `Prior = {load: 55 + trainingBaseline, trainingLoad: trainingBaseline}`
  (`:25`, `:87-90`); `trainingFeel: 0` (`:95`); `runModel(prior, [], today)`
  (`:99`).
- `sessionCall` (`weekPlan.ts:168-288`) takes model verdict/readiness/feel/
  acwr, workLoad, sleep, recovery, trainingSpike, trainedToday, week, past
  sessions; returns its own verdict/label/rec/why/plan, which overwrite the
  model's (`dashboardModel.ts:131-148`). Readiness/Load/Balance are kept.
- Callers: `WorkHealthDashboard.tsx:56`, `SandboxDashboard.tsx:211`, tests.

### Q3. Where Focus/Strain/Rhythm come from
- Events from Google `events.list`, all-day events dropped
  (`googleCalendar.ts:296-371`). `CalendarEvent` (`:5-13`) keeps summary,
  start, end, `attendees = length || 1`, isRecurring, category. Organizer,
  description, location, response status are not read.
- `categorizeEvent(summary)` (`:273-294`): title keywords → BENEFICIAL,
  NEUTRAL, COLLABORATIVE, LIGHT, HEAVY, FOCUS; unmatched → COLLABORATIVE.
  "Actual meetings" exclude BENEFICIAL/NEUTRAL/FOCUS_WORK (`:668-673`).
- Entry `analyzeWorkHealth(tz, preloadedEvents?)` (`:1068`) →
  `calculateAdaptivePerformanceIndex` (Focus, `:666-791`: density, focus-gap
  fragmentation, back-to-backs, timing, meeting ratio, bonuses — uses start,
  end, attendees, category), `calculateCognitiveResilience` (Strain,
  `:793-893`: unique titles as context switches, time/attendee/category/
  duration fatigue, focus reserve, longest chain), `calculateWorkRhythmRecovery`
  (Rhythm, `:895-987`: morning/afternoon balance, gaps, weighted hours,
  early/late — uses start, end, category). Hours are timezone-aware
  (`:257-271`).
- `src/lib/cognitive-classification.ts` is a separate pipeline for
  `/api/cognitive-positioning`; it does not feed these scores.

### Q4. `WorkHealthMetrics`
- Declared twice: server (`googleCalendar.ts:23-57`) and client
  (`useWorkHealth.ts:83-109`, adds `dayShape`, `week`, `ai`, `aiStatus`).
- `schedule` (`useWorkHealth.ts:61-75`, filled at `googleCalendar.ts:
  1198-1212`): meetingCount, backToBackCount, bufferTime, durationHours,
  fragmentationScore, morning/afternoonMeetings, meetingRatio,
  uniqueContexts, longestStretch, adequate/shortBreaks, earlyLateMeetings.
- Produced by `GET /api/work-health` (`pages/api/work-health.ts:38-47`),
  fetched and cached by `useWorkHealth` (`:359-366`, `:428-437`).
- Consumers: `dashboardVerdict` (three scores + durationHours); the dashboard
  and sandbox UIs (many schedule fields); `claudeAI.ts`,
  `comicReliefGenerator.ts`, `aiInsightsCache.ts` (schedule + scores).

### Q5. Paths without a real calendar
- `estimateScores.ts` and `sandbox-personas.ts` have no importers.
- Active sandbox: `SandboxDashboard` POSTs meetings to `/api/sandbox-score`
  (`SandboxDashboard.tsx:163-171`), which builds `CalendarEvent`s (attendees
  default 3, category via the private `categorizeEvent`) and calls
  `analyzeWorkHealth(undefined, events)` with the default timezone
  (`sandbox-score.ts:38-60`). The client then calls `dashboardVerdict` with
  demo actuals and no week (`SandboxDashboard.tsx:210-211`).

### Q6. API routes
- All routes are `pages/api/*`; auth is NextAuth Google
  (`calendar.readonly`) via `getServerSession`; rows keyed by
  `session.user.email`; Supabase is accessed with the service-role client
  (`lib/supabase.js:12-27`).
- `/api/work-health` returns work metrics + week + dayShape + ai and upserts
  `daily_scores` (performance/resilience/sustainability) (`:150-166`). It
  does not compute the verdict.
- `/api/score-history` returns 30 days of those three scores.
- `/api/wearables/actuals` returns `{connected, provider, actuals, stale}`.
- `/api/sandbox-score` is unauthenticated.

### Q7. `WearableActuals`
- `types.ts:22-62`: date, provider required; recovery, freshness, sleepHours,
  sleepPerformance, hrvMs, restingHr, dayStrain, lastActivity,
  weekActivityCount, trainingBaseline, trainingLoadToday, keySessions
  optional. Absent `keySessions` = unknown; `[]` = known none.
- Strava fills training fields only; demo fills training + keySessions; WHOOP
  fills recovery/sleep/HRV/RHR/strain plus training from workouts, leaving
  missing values undefined (`whoop.ts:173-220`, `:278-356`).

### Q8. Completeness / confidence
- None in the model or dashboard. Missing inputs become neutral defaults
  (`dashboardModel.ts:27-29`, `:73`, `:78-85`, `:95`). `knowsTraining`
  (`:139`) is the only data-presence flag in the result.
- `ReadinessExplain.tsx` hides training/body/week sections when their data is
  absent (`:32-37`, `:51`, `:63`, `:75-77`). Stale wearable actuals are shown
  but passed to the model as null (`WorkHealthDashboard.tsx:53-61`).
- An empty calendar is a valid "open" day, never Survival
  (`dashboardModel.test.ts:168-188`).

### Q9. Tests
- `model.test.ts`: workIndex corners; day-one spike; six day-one verdict
  scenarios, all with empty history (`:13-100`).
- `dashboardModel.test.ts`: verdicts from work + Strava/WHOOP fixtures,
  session-call scenarios with a 7-day forecast, open-calendar monotonicity,
  sleep effects (`:27-217`).

### Q10. Email
- No mailbox data read or stored; the only Google scope is
  `calendar.readonly` (`pages/api/auth/[...nextauth].ts:87`). Email appears
  only as the user identity key and in copy.

## Code references
- `src/lib/model.ts:39-223`
- `src/lib/dashboardModel.ts:23-148`
- `src/lib/weekPlan.ts:104-288`
- `src/services/googleCalendar.ts:5-57, 273-294, 296-371, 501-1212`
- `pages/api/work-health.ts`, `pages/api/sandbox-score.ts`
- `src/lib/wearables/types.ts:22-68`

## Earlier work (thoughts/)
- `designs/2026-11-12-training-logic.md`: being under baseline is headroom;
  rest only on evidence; `sessionCall` introduced.
- `designs/2026-11-11-whoop-provider.md`: one verdict; missing data is absent,
  not 0, and absent means neutral; stale actuals not scored; recovery shown
  not scored; one-tap feel input deferred.

## Open questions (the code cannot answer)
- What `history` should be in production (it is always `[]`).
- Whether `estimateScores.ts` / `sandbox-personas.ts` are intentionally kept.
