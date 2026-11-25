# AI assistants can call Persist as their readiness engine

**As** a user of Claude, ChatGPT or Copilot at a company that blocks Outlook
apps,
**I want** my assistant — which already has approved access to my calendar and
mail — to send my day's metadata to Persist and get back my verdict,
**so that** I get a consistent, baseline-aware readiness read without IT
approving a new app.

## Acceptance criteria

- An MCP server exposing: log a day (ticket-1 shape), get today's verdict
  (scores, verdict, drivers, action, confidence), get a trend (7/30 days),
  and log the day's feel rating (ticket 4).
- A user links an assistant to their Persist account; their baseline follows
  them across assistants and the app.
- Only metadata and scores are accepted and stored — no titles, names or
  content beyond what the input shape allows.
- Works end to end from at least one assistant (first target chosen at design).
- The app shows days logged by an assistant.

## Context

Depends on tickets 1–3. Touches auth and the database: full pipeline. Open
questions for design: MCP vs REST first, which assistant first, account
linking, whether the app stays a destination or becomes a viewer.
