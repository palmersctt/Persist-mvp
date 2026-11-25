# The verdict is measured against my own history

**As** a user who has used Persist for a few weeks,
**I want** my verdict compared with my own recent normal, not a default,
**so that** "a heavy day" means heavy for me.

## Acceptance criteria

- Each day's model inputs are saved per user.
- The verdict uses the user's saved history for the baseline, seeded from the
  prior until enough history exists (day one still gets a real verdict).
- Missing days are handled sensibly (no false spike after a gap).
- The "why" panel shows when the baseline is personal vs. still the default.
- Tests cover day one, a few days in, and 21+ days.

## Context

The model already supports history, but the dashboard always runs it with an
empty history against a fixed default baseline. Touches the readiness model
and the database: full pipeline.
