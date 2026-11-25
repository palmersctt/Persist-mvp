# One-tap "how did today actually feel?"

**As** a user,
**I want** to rate my day 1–5 in one tap,
**so that** Persist learns whether its verdicts match how I felt.

**As** the Persist team,
**I want** those ratings stored next to each day's verdict,
**so that** we can calibrate the model's constants and thresholds against
reality instead of guesses.

## Acceptance criteria

- A single 1–5 rating per day, from the dashboard card (and later via an
  assistant tool), editable for that day.
- Stored alongside that day's inputs and verdict.
- A simple export or query showing verdict vs. rating over time.
- Skipping is fine; no nagging.

## Context

The engine's weights and cut-offs are hand-tuned and have never been checked
against real outcomes. Touches the database (and the card): full pipeline.
