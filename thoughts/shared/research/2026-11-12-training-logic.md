---
date: 2026-11-12
git_commit: 4833341
branch: claude/jolly-pascal-67e0me
status: complete
---

# Research: why an open day said "Recover", and what coaches actually do

## The bug, traced

- With no meetings, `workLoad` is 0 (`src/lib/dashboardModel.ts`). With no
  wearable, training is held at the default baseline of 30, and the prior
  load is 55 + 30 = 85.
- Recent ÷ Baseline is therefore 30 ÷ 85 = 0.35. `runModel` penalised any
  ratio under 0.85 as a "slump": fit fell to 40.
- Balance is 0, so Readiness = 0.45 × 40 + 0.45 × 50 = 41.
- `recommend` returns Survival for any Readiness under 42. Hence "Recover",
  with Load 0 and Balance +0: exactly the screenshot.
- The same penalty lowered Readiness on every lighter-than-usual day.

## A second fault in the same screenshot

The quote ("I'm not a human being, I'm a success machine") and its line
contradict the Survival verdict. Quotes and lines are generated from the
calendar's work-health metrics (`src/services/claudeAI.ts`,
`src/utils/comicReliefGenerator.ts`) and never see the model's verdict. The
line also shows literal asterisks (`*work*`).

## What the model does today

- One currency: work load and training load are added together.
- One ratio: recent ÷ baseline (acute:chronic), plus a restoration balance.
- The verdict is a threshold on those. In practice: a heavy work day raises
  load, so the call is to ease off; nothing else is considered.
- It has no idea what kind of session is at stake, what was done yesterday,
  what the rest of the week looks like, or how the body is recovering.

## What the coaches say

Sources are articles and interviews, not the coaches' books. Items marked
(unverified) are from general knowledge of their published work and were not
confirmed in this research.

- **Jason Koop (CTS).** Adaptation needs a hard enough stress and then
  enough recovery; one without the other does nothing. Career, relationship
  and money stress count toward the total that rest has to balance. Rest is
  the harder thing to get athletes to do. He argues against fixed
  three-weeks-on, one-off cycles: work hard when you can, back off at
  defined thresholds. A CTS athlete, Jen Lichter, was reported as the 2026
  Western States women's winner.
- **David Roche (SWAP).** Only a secondhand summary was found: training is
  adding build-up stress while limiting breakdown stress, and the practical
  test is whether you wake up dreading the hard session or looking forward
  to it. Easy days truly easy, consistency over heroic days (unverified).
- **Scott Johnston (Evoke), coach of the 2025 UTMB champions Ruth Croft and
  Tom Evans.** Fatigue resistance is the main determinant of ultra
  performance. Build the aerobic base at low intensity, and avoid the
  whole-body fatigue that high intensity brings. Start from the demands of
  the event and what limits the athlete.
- **Mario Fraioli, coach of Vincent Bouillard (reported 2026 Western States
  winner, course record).** A 12-week block averaging 19.5 hours a week,
  arriving at a tune-up race underprepared on purpose because the goal race
  mattered more.
- **Ben Dhiman (reported 2026 UTMB men's winner, self-coached).** Volume over
  intensity as the honest preparation for a mountain 100.
- **On the ratio itself.** Impellizzeri and colleagues showed the
  acute:chronic workload ratio's link to injury is largely an artefact of
  the ratio; practitioners keep it as a monitoring aid, not a predictor.

## What that adds up to

1. Life stress is real training stress. The model already has this.
2. Stress and rest come as a pair. A day off is earned by load, not by an
   empty calendar.
3. Easy volume is cheap and protected; intensity is the expensive thing.
   On a draining day a coach moves the hard session and keeps the easy run.
4. Hard sessions are few (about two a week), spaced apart, and placed where
   life is light. That is a week-level decision, not a day-level one.
5. Being under your usual load is headroom, not fatigue.
6. Rest is called on evidence: a real spike, several draining days, poor
   sleep or recovery, or hard days stacked together.
7. How the athlete feels about the session is a legitimate signal.
