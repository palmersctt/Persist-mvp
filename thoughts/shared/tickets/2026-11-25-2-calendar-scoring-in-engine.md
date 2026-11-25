# Work scores come from the engine, not from the Google integration

**As** a client sending raw meeting data (not just Google Calendar),
**I want** Persist to turn meetings into Focus / Strain / Rhythm itself,
**so that** an Outlook user's data, sent by Copilot or ChatGPT, is scored
exactly like a Google user's.

## Acceptance criteria

- Meetings in the ticket-1 input shape → Focus, Strain, Rhythm and work load,
  computed in one place that has no dependency on any calendar provider.
- Google Calendar uses that same path, so Google and non-Google users with the
  same meetings get the same scores.
- Works without titles (category supplied by the caller, or unknown).
- Existing Google users see no change in their scores, shown by tests on
  representative days.

## Context

Depends on ticket 1. Today the work-health scoring lives inside the Google
Calendar service. Touches the readiness model: full pipeline.
