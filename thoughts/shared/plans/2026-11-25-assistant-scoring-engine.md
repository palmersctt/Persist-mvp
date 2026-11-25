---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-assistant-scoring-engine.md
outline: thoughts/shared/outlines/2026-11-25-assistant-scoring-engine.md
status: in progress
---

# Plan: assistants call Persist

## What we are not doing
REST API; Copilot packaging; billing; teams.

## Phase 1: personal access tokens
### Changes
- `supabase/migrations/20261125_api_tokens.sql`.
- `src/lib/assistant/tokens.ts`: `newToken`, `hashToken`, `bearerToken`,
  `checkRate` (60/hour), `cleanLabel`.
- `pages/api/tokens.ts`: GET active, POST (shown once, max 10 active),
  DELETE revoke — all scoped to the session email.
- `src/components/ConnectedAssistants.tsx` on the dashboard.
### Automated checks
- [x] `tokens.test.ts`, `pages/api/__tests__/tokens.test.ts`,
      `ConnectedAssistants.test.tsx`
- [x] `npm run verify`
### Manual checks
- [ ] Apply the migration; create a token, copy it, revoke it.

## Phase 2: MCP server
### Changes
- `@modelcontextprotocol/sdk`.
- `src/lib/assistant/store.ts`: `DayStore` interface, Supabase and
  in-memory implementations; `src/lib/assistant/tools.ts`: `logDay`,
  `getVerdict`, `getTrend`, `rateDay`.
- `pages/api/mcp.ts`: Streamable HTTP, stateless, bearer token, rate limit.
### Automated checks
- [ ] tools tests (in-memory store); MCP route test
- [ ] `npm run verify`
### Manual checks
- [ ] Connect a client with the token; ask for today's verdict.

## Phase 3: OAuth 2.1
### Changes
- Metadata, client registration, authorize + token with PKCE.
### Automated checks
- [ ] PKCE/code tests; metadata test; `npm run verify`
### Manual checks
- [ ] Add Persist as a custom connector in Claude by URL.
