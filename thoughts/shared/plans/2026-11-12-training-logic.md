---
date: 2026-11-12
git_commit: 4aad61c
design: thoughts/shared/designs/2026-11-12-training-logic.md
status: implemented
---

# Plan: the session call

The user's reply ("Do 1-4") was taken as approval to build, so the outline
and plan are recorded here together.

## What we are not doing

- Goal races or periodisation.
- The one-tap feel input, and making the quote follow the verdict.
- Changing the readiness maths beyond the open-calendar fix already made.
- Renaming scores or verdicts.

## Phase 1: the week planner and today's call

- [x] `src/lib/weekPlan.ts`: `planWeek` places one long and up to two hard
      sessions on the lightest eligible days, never adjacent, respecting
      sessions already done; `sessionCall` turns the model's read into
      Recover, Easy only, Optional, Train normally, Go hard or Go long.
- [x] `src/lib/weekPlan.test.ts`.

## Phase 2: hard and long from WHOOP

- [x] `src/lib/wearables/whoop.ts`: `classifyWorkout` (hard = 10+ minutes in
      zones 4-5, or strain 14+ in a shorter session without zone data; long =
      90 minutes or 1.75x the athlete's typical session), and
      `keySessions` on the actuals. Thresholds are provisional.
- [x] Demo provider reports a plausible recent week.

## Phase 3: into the verdict

- [x] `src/lib/dashboardModel.ts`: `dashboardVerdict` takes the week ahead
      and returns the call's verdict, label, wording and plan.
- [x] `src/lib/mood.ts`: the Grinding label is "Easy only".
- [x] The dashboard card uses the call's label.

## Phase 4: the week's calendar

- [x] `src/lib/weekAhead.ts`: pure day-bucketing helpers, with tests.
- [x] `GoogleCalendarService.getWeekAhead`, returned by the work-health API
      as `week`. A failed week fetch does not fail the day.

## Phase 5: showing it

- [x] `src/components/ReadinessExplain.tsx`: a "Your week" block with
      meeting load per day and the hard and long days marked.

## Automated checks

- [x] `npm run verify`

## Manual checks

- [ ] Signed in, the dashboard shows "Your week" with seven days and the
      key sessions on the lightest days.
- [ ] A heavy meeting day reads "Easy only", not "Recover".
- [ ] With WHOOP connected, a day after a hard workout stays easy, and hard
      and long sessions are recognised correctly. The thresholds need tuning
      against real workouts.

## After validation

An independent pass found defects in the first build, fixed in a follow-up
commit:

- An ordinary run counted as a training spike and read "Recover". The daily
  baseline includes rest days, so a spike is now 4x the baseline and 45 over.
- Doing the long run the card asked for read "Recover". A key session done
  today is now checked first and reads "Key session done".
- "Save it for Thursday, the lightest day ahead" named the earliest key day,
  which is not always the lightest. The claim is gone.
- Without training history the wording still implied a session was due. It
  is now a suggestion ("If you have a hard session this week...").
- "Go hard" could sit beside low readiness or a day already trained on. A key
  session now needs Readiness of 58 and an untrained day, else it moves.
- A cached forecast from an earlier day shifted every label. The forecast is
  aligned to today's date, or dropped.
- The week block had no text alternative. It has one now.

Known and left:

- The sandbox passes no week, so it shows no plan and cannot reach "Go hard".
- Label wording stayed "Train normally" (the design said "Train as usual").
- One poor night gates intensity; the design said two.
- The outline was not presented as a separate gate. "Do 1-4" was taken as
  approval to build.
