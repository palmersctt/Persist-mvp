# Engine accepts any data source, and says how sure it is

**As** an AI assistant (or any client) calling Persist,
**I want** to send whatever day data I can reach — meetings, email counts,
training, sleep, each optional — in one documented shape,
**so that** I get a verdict whether I have a full week of calendar + WHOOP or
just two busy blocks.

**As** a user,
**I want** the verdict to say how confident it is,
**so that** a read from two meetings isn't presented with the same certainty as
one from a full picture.

## Acceptance criteria

- One provider-neutral, versioned input shape for a day: meetings (start, end,
  optional attendee count, optional category, optional organizer flag, or
  busy-only blocks), email counts (sent, sent after hours, received), training
  load, sleep. Every field optional.
- The engine returns a verdict for any subset, including busy-only blocks.
- The result carries a confidence value (and which inputs were missing), and
  the "why" text mentions low confidence when it applies.
- Same inputs → same outputs (deterministic), covered by tests.
- The existing dashboard keeps producing the same verdicts for the same data.

## Context

Today the engine takes pre-computed work scores, has no email input, and
returns no confidence. This is the foundation for the assistant-facing engine
(ticket 5). Touches the readiness model: full pipeline.
