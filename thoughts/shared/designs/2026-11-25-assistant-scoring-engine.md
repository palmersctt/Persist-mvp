---
date: 2026-11-25
git_commit: cce0349
ticket: thoughts/shared/tickets/2026-11-25-5-assistant-scoring-engine.md
research: thoughts/shared/research/2026-11-25-assistant-scoring-engine.md
status: awaiting decisions
depends_on:
  - thoughts/shared/designs/2026-11-25-real-baseline.md
  - thoughts/shared/designs/2026-11-25-daily-feel-checkin.md
---

# Design: assistants call Persist as their readiness engine

## Current state
- The engine (`scoreDay`, `parseDayInput`) is pure and server-safe.
- All API auth is a NextAuth browser cookie; no way for an assistant to
  authenticate as a user. No MCP code or package.
- Tickets 3 and 4 add `day_inputs` (history + rating), which this builds on.

## Desired end state
- An MCP server at `/api/mcp` (Streamable HTTP, stateless JSON responses,
  Node runtime) with four tools:
  - `log_day(DayInput)` → validates, scores against your history, saves the
    day's model inputs (numbers only, never titles), returns the verdict,
    scores, drivers, label and confidence;
  - `get_verdict(date?)` → that day's stored verdict;
  - `get_trend(days: 7 | 30)` → readiness / load / balance / verdict by day;
  - `rate_day(date, rating 1–5)` → the ticket-4 rating.
- Each tool's description tells the assistant what to send (metadata only)
  and how to relay the result (verdict first, confidence if not high).
- A user connects an assistant to their Persist account; their days show up
  on the dashboard and the baseline is shared across assistants and the app.
- How to see it: connect it in Claude, ask "how's my day looking?", get a
  verdict, then see that day on the dashboard.

## Decisions

**D1. MCP first, or REST first?**
- a) MCP server (`@modelcontextprotocol/sdk`) over Streamable HTTP; the
  tool handlers are plain functions, so a REST route can wrap them later.
- b) REST first.
- **Recommend a.** MCP is what Claude and ChatGPT connect to directly; REST
  alone needs a custom integration in each assistant.

**D2. How an assistant proves who you are.** The hard part.
- a) **OAuth 2.1** (authorization code + PKCE, dynamic client registration):
  Persist becomes an authorization server; the consent screen signs you in
  with Google (existing NextAuth) and issues Persist access tokens. This is
  what consumer connectors in Claude and ChatGPT expect.
- b) **Personal access tokens:** generate a token on the dashboard, paste it
  into the assistant. Simple, but only works in clients that let you set a
  bearer header (developer tools, Claude Code, API-based agents), not the
  consumer connector screens.
- **Recommend a then b.** Ship tokens (b) first as phase 1 (small, testable,
  unblocks developer/Copilot Studio-style agents and our own testing), then
  OAuth (a) as phase 2 for one-click connectors. Confirm current connector
  auth requirements for each assistant during planning; they change.

**D3. First assistant.** Claude (native MCP custom connectors) → ChatGPT
(apps/connectors) → Microsoft 365 Copilot (Copilot Studio agent with MCP).
**Recommend Claude first.**

**D4. Tokens and storage.**
- New `api_tokens` table: hashed token (SHA-256), user_email, label,
  created_at, last_used_at, revoked_at; RLS on, no anon policies.
- Tokens are shown once; the dashboard gets a small "Connected assistants"
  list with revoke.
- Per-token rate limit (e.g. 60 calls/hour) held in the table, no new infra.

**D5. What is stored from an assistant.** Only the numeric model inputs,
the verdict and scores, and the confidence level, in `day_inputs` (ticket
3). Never titles, attendee names, or the raw `DayInput`. **Recommend.**

**D6. Dashboard vs assistant on the same day.** Last write wins, and the
row records its source (`dashboard` / `assistant`). **Recommend.**

**D7. Does the app stay a destination?** Yes for now: the dashboard shows
the card, trend and rating; assistants are another way in.

## Open questions for you
1. D2: personal tokens first, then OAuth (recommended), or go straight to
   OAuth?
2. D3: Claude first?
3. Rate limit and token lifetime: 60 calls/hour, tokens until revoked?

## Out of scope
- REST API; Copilot-specific packaging; billing; team accounts.

## Security note (found in research, not this ticket)
- `/api/analytics/users` and `GET /api/analytics/events` expose all users'
  data to any signed-in user.
- `/api/ai-health` returns the Anthropic key's length and prefix, ungated.
Recommend one urgent security ticket for these, ahead of opening any new
API surface.
