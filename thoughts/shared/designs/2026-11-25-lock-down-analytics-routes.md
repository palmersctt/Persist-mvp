---
date: 2026-11-25
git_commit: ab2cca4
ticket: thoughts/shared/tickets/2026-11-25-8-lock-down-analytics-routes.md
research: thoughts/shared/research/2026-11-25-assistant-scoring-engine.md (Q2, Q6), thoughts/shared/research/2026-11-25-daily-feel-checkin.md (Q7)
status: agreed
---

# Design: lock down routes that leak other users' data

## Current state
- `GET /api/analytics/users` returns every user row plus aggregates to any
  session (`analytics/users.ts:7-80`).
- `GET /api/analytics/events` returns up to 1000 events across all users to
  any session (`analytics/events.ts:50-80`).
- `GET /api/ai-health` (ungated) returns the Anthropic key's length and
  7-character prefix (`ai-health.ts:17-23`).
- Nothing in the app calls either GET (only `trackEvent`'s POST is used).

## Desired end state
- Both analytics GETs answer 403 unless the session email is in an
  `ADMIN_EMAILS` env var (comma-separated). Unset → nobody is admin.
- `ai-health` returns only `hasAnthropicKey` (boolean) and status.
- POST `/api/analytics/events` unchanged.

## Decisions
- **D1. Admin allow-list via env var** rather than deleting the routes, so
  you keep your own analytics. A pure `isAdmin(email, env)` in
  `src/lib/admin.ts`, unit-tested.
- **D2. Route tests** with `vi.mock('next-auth')` for `getServerSession` —
  the repo's first route tests.
- **D3.** You set `ADMIN_EMAILS` in Vercel yourself (I won't touch your
  hosting settings).

## Out of scope
- Roles in the database; the events CHECK-constraint question.
