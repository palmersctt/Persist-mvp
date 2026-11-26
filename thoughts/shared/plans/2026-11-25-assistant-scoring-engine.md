---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-assistant-scoring-engine.md
outline: thoughts/shared/outlines/2026-11-25-assistant-scoring-engine.md
status: implemented
---

# Plan: assistants call Persist

## What we are not doing
REST API; Copilot packaging; billing; teams.

## Phase 1: personal access tokens
### Changes
- `supabase/migrations/20261125000003_api_tokens.sql`.
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
- [x] tools tests (in-memory store); MCP route test
- [x] `npm run verify`
### Notes from implementation
- Also added: `zod` as a direct dependency (the SDK's schema library);
  `src/lib/assistant/auth.ts` (token → user + rate limit);
  `mcpServer.ts` (tool registration, testable over the SDK's in-memory
  transport); an end-to-end HTTP test with the real Streamable HTTP
  transport (`tests/api/mcp.http.test.ts`).
- `log_day` accepts today or yesterday only, so an assistant can't rewrite
  old history. Titles are dropped by the tool schema and never stored.
- Route tests live in `tests/api/` (files under `pages/` become routes and
  broke `next build`; fixed in a separate commit with a guard test).

### Manual checks
- [ ] Connect a client with the token; ask for today's verdict.

## Phase 3: OAuth 2.1
### Changes
- Metadata, client registration, authorize + token with PKCE.
### Automated checks
- [x] PKCE/code tests; metadata test; full-flow route test; `npm run verify`; `next build`
### Notes from implementation
- Endpoints: `/.well-known/oauth-authorization-server` and
  `/.well-known/oauth-protected-resource` (rewrites to `/api/oauth/*`),
  `/api/oauth/register` (RFC 7591, public clients), `/oauth/authorize`
  (consent page; signs in with Google if needed), `/api/oauth/approve`,
  `/api/oauth/token` (code + S256 PKCE, single-use 5-minute codes).
- Issued access tokens are `api_tokens` rows labelled with the client's
  name, so they show under Connected assistants and revoke the same way.
- `/api/mcp` 401s now carry `WWW-Authenticate: Bearer resource_metadata=…`
  so clients can discover the flow.
- Migration `20261125000004_oauth.sql` (oauth_clients, oauth_codes).
- `NEXTAUTH_URL` sets the issuer; without it the request host is used.

### Manual checks
- [ ] Add Persist as a custom connector in Claude by URL.
