---
date: 2026-11-25
git_commit: cce0349
branch: claude/adoring-mccarthy-43vsnt
questions: thoughts/shared/questions/2026-11-25-assistant-scoring-engine.md
status: complete
---

# Research: auth, API surface and server runtime today

## Summary
Auth is NextAuth v4, Google-only, JWT sessions (30 days), identity = email
(`[...nextauth].ts:80-213`). Every API route is a Pages Router Node route,
session-cookie-gated; there is no bearer-token or API-key auth for
non-browser clients. No MCP, JSON-RPC or OAuth-server package is installed.
The engine imports nothing platform-specific and can run server-side as is.

## Findings
1. **Auth:** Google scopes `openid email profile calendar.readonly`; tokens
   in the JWT, refreshed 5 min early (`:11-47, 148-196`). No DB adapter.
   `middleware.ts` covers pages only, not `/api`.
2. **Routes:** see table in the report: all `getServerSession` cookie
   checks; `sandbox-score`, `health`, `ai-health` ungated;
   `analytics/users` and `GET analytics/events` return all users' data to
   any session. No inbound bearer/API-key auth.
3. **Runtime:** Node (no `runtime` exports); `vercel.json` maxDuration 30s
   (auth, work-health) / 15s (others); no streaming routes.
4. **Packages:** no MCP/JSON-RPC/OAuth-server; `jose` only via next-auth.
5. **Engine:** `types`, `parse`, `confidence`, `workScores`, `scoreDay`;
   only `Intl` as a platform API; no index file.
6. **Env:** declared in `types/env.d.ts:3-10`; Supabase URL/anon key
   hard-coded in `lib/supabase.js:3-5`; `ai-health` returns the Anthropic
   key's length and 7-char prefix, ungated (`ai-health.ts:17-23`).
7. **Tables:** users (unique email), events, daily_scores,
   wearable_connections (tokens), wearable_daily; `leverage_snapshots` has
   no DDL in the repo. Users are created in the NextAuth `signIn` callback.
8. **Tests:** no route tests, no mocking infrastructure.

## Open questions
- Which env vars are set in production; whether the live schema matches the
  repo.
