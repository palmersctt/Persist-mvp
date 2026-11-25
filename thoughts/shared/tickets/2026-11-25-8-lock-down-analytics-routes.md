# Lock down routes that leak other users' data

**As** a Persist user,
**I want** no other signed-in user to be able to read my account, events or
ratings,
**so that** my data stays mine.

## Acceptance criteria
- `GET /api/analytics/users` and `GET /api/analytics/events` are not
  reachable by ordinary signed-in users (removed, or restricted to an
  explicit admin allow-list from an env var).
- `/api/ai-health` no longer returns any part of the API key (presence
  only, or removed).
- Tests cover the denial.

## Context
Found during research for tickets 4 and 5: both GET routes return every
user's rows to any session (`analytics/users.ts:7-80`,
`analytics/events.ts:50-80`), and `ai-health` returns the key's length and
prefix ungated (`ai-health.ts:17-23`). Touches auth: full pipeline.
Should land before any new API surface (ticket 5).
