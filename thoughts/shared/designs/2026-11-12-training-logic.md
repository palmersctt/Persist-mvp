---
date: 2026-11-12
git_commit: 4833341
ticket: thoughts/shared/tickets/2026-11-12-training-logic.md
research: thoughts/shared/research/2026-11-12-training-logic.md
status: agreed
---

# Design: from "hard day, train easy" to a session call

## Already done (the bug)

Being under your usual load no longer lowers Readiness
(`src/lib/model.ts`). An open calendar now reads Readiness 68, Load 0,
"Flow · Train normally", and a lighter day can never score below a heavier
one. Tests added in `dashboardModel.test.ts`.

## Desired end state

The card answers the question a coach answers: **what kind of session is
today for?** The answer comes from the week, not just the day: what was done
recently, what the calendar holds for the next few days, and how the body is
recovering. The three scores and five verdicts keep their names.

## Decisions

### D1. The five verdicts become session calls

| Verdict   | Call           | When                                                                    |
| --------- | -------------- | ----------------------------------------------------------------------- |
| Survival  | Recover        | Evidence only: a real spike, several draining days, or poor recovery    |
| Grinding  | Easy only      | A draining day or short sleep: keep the easy volume, move the intensity |
| Coasting  | Optional       | Nothing due and nothing pressing                                        |
| Flow      | Train as usual | A normal aerobic day, inside your band                                  |
| Locked In | Go hard        | A hard session is due and today is the best day this week for it        |

Labels change only where the call changes ("Keep it moderate" becomes "Easy
only"). **Recommend.**

### D2. Intensity is gated, volume is protected

A heavy work day stops being a reason to do less. It becomes a reason to
keep the session easy and move the hard one. **Recommend.**

### D3. Hard-session rules

At most two hard sessions in a rolling seven days, never on consecutive
days. A hard session yesterday means easy today, whatever the calendar says.
**Recommend**, with the count as a setting later.

### D4. Look at the week, not the day

Read the next seven days of calendar. If a hard session is due, pick the
lightest eligible day. Today's call can then say "go hard today" or "save it
for Thursday, your lightest day". This is the part no wearable does, and the
main reason for the product. **Recommend.** Cost: the calendar fetch widens
from today to a week.

### D5. What counts as a hard session

- With WHOOP: a workout whose strain or time in upper heart-rate zones
  crosses a threshold.
- Without it: unknown, so the hard-session rules stay off and the call rests
  on work, sleep and the week's shape.

**Recommend.** The threshold needs real WHOOP data to set.

### D6. Recovery evidence

Sleep already moves Readiness. Add: two poor nights or a low recovery score
gates intensity (Easy only) before it gates volume (Recover). **Recommend.**

### D7. A one-tap "how do you feel about today's session?"

Roche's dread-or-excited test, as an optional input that can pull a hard day
down to easy. **Recommend later**, not in this change.

### D8. The quote follows the verdict

Pass the model's verdict into quote generation so a Recover card cannot carry
a triumphant quote, and strip markdown asterisks from the line.
**Recommend**, as its own small slice.

## Answers

The user approved D1 to D4 and added two things:

- **Hard days are flexible.** The app chooses them from the week; there are
  no fixed training days.
- **Hard and long are different things.** Hard is intensity; long is
  duration. They are separate key sessions with separate weekly limits (two
  hard, one long) and a shared spacing rule (no two key sessions on
  consecutive days). The card says "Go hard" or "Go long".

Reading the next seven days of calendar is accepted. A goal race, the
one-tap feel input (D7) and the quote following the verdict (D8) are left
for later.

## Out of scope

- Goal-race periodisation and training plans.
- Renaming scores or verdicts.
- Replacing the load ratio. It stays as a monitoring signal; it stops being
  the whole verdict.
