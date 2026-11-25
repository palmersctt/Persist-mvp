---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-assistant-scoring-engine.md
status: awaiting approval
---

# Outline: assistants call Persist (ticket 5; after tickets 3, 4, 8)

## Phase 1: personal access tokens
- `supabase/migrations/20261125_api_tokens.sql`: `api_tokens` (id,
  user_email, label, token_hash, created_at, last_used_at, revoked_at,
  window_start, window_calls); RLS on, no anon policies.
- `src/lib/assistant/tokens.ts`: `newToken()` (random, `pst_` prefix),
  `hashToken()`, `checkRate(row, now, limit = 60)`. Pure, tested.
- `pages/api/tokens.ts` (session): list / create (shown once) / revoke.
- Dashboard: "Connected assistants" section (create, copy once, revoke).
- **Automated:** tokens tests; route tests; `npm run verify`.
- **Manual:** you apply the migration; create and revoke a token.

## Phase 2: the MCP server
- Dependency: `@modelcontextprotocol/sdk`.
- `src/lib/assistant/tools.ts`: `logDay`, `getVerdict`, `getTrend`,
  `rateDay` over a `DayStore` interface (Supabase implementation + in-memory
  for tests). `logDay` = `parseDayInput` → history → `scoreDay` → save the
  numeric inputs + verdict (source `assistant`).
- `pages/api/mcp.ts`: Streamable HTTP, stateless, bearer token →
  user_email, rate-limited; registers the four tools with descriptions that
  ask for metadata only.
- **Automated:** tools tests with the in-memory store (log then get, trend,
  rate, bad input errors, no titles stored); MCP route test (no token →
  401, tool list, one `log_day` call); `npm run verify`.
- **Manual:** connect from Claude with a token (where the client allows a
  bearer header) and ask for today's verdict; see the day on the dashboard.

## Phase 3: OAuth 2.1 for one-click connectors
- Authorization-server metadata, dynamic client registration, authorize
  (consent via existing Google sign-in) + token endpoints with PKCE,
  issuing the same Persist tokens; MCP route accepts them.
- **Automated:** PKCE/code exchange unit tests; metadata route test;
  `npm run verify`.
- **Manual:** add Persist as a custom connector in Claude by URL, sign in,
  ask for a verdict.
