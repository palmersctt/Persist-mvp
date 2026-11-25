---
date: 2026-11-25
git_commit: cce0349
branch: claude/adoring-mccarthy-43vsnt
questions: thoughts/shared/questions/2026-11-25-daily-feel-checkin.md
status: complete
---

# Research: user input surfaces and per-day storage today

## Summary
The dashboard has no form or input: its controls are refresh, profile,
share, swipe, wearable connect/disconnect and trends toggles
(`WorkHealthDashboard.tsx:538-812`). Client writes go through
`trackEvent` or the wearable routes, all NextAuth-session-gated with inline
validation. No feel, energy or rating exists anywhere in code or schema; a
one-tap feel input was deferred in the training-logic design (D7).
`trainingFeel` is a model input (−1..+1) hard-coded to 0
(`scoreDay.ts:124`). Neither the verdict nor its inputs are persisted.

## Findings
1. **Dashboard:** hero card (skeleton / swipe deck / fallback) + "Share your
   day" (`:693-793`), `WearableSection` (`:800`), `TrendsSection` (`:803`).
   No `<form>`/`<input>` in the dashboard.
2. **Posting:** `trackEvent` → `/api/analytics/events` (session or
   `sandbox-` id; allow-listed event types; metadata unvalidated;
   `events.ts:6-40`). Wearable connect/disconnect routes are session-gated
   (`connect.ts:17-83`, `disconnect.ts:9-21`). No schema library.
3. **Tables:** `daily_scores` and `wearable_daily`, both unique
   (user_email, date), read-own RLS, upserted by service role. No verdict,
   training load or feel stored.
4. **Existing feel notions:** none in code or schema. Deferred D7 in
   `designs/2026-11-12-training-logic.md:73-97`; email scoring waits on feel
   ratings (`engine/README.md:96-97`).
5. **`trainingFeel`:** `restore = (workLoad·workValence + trainingLoad·
   trainingFeel)/100` (`model.ts:116`) → feel EWMA → 45% of Readiness,
   Balance, Grinding/Flow thresholds (`:142-203`). No effect on days with no
   training. Set to 0 (`scoreDay.ts:124`).
6. **Local date:** client sends its IANA zone; server uses
   `toLocaleDateString('sv-SE', {timeZone})` (`work-health.ts:61, 152`).
7. **Export:** `/api/score-history` (own 30 days). `/api/analytics/users`
   and `GET /api/analytics/events` return **all users' data to any signed-in
   user** (no role check; `analytics/users.ts:7-80`, `events.ts:50-80`).
8. **Tests:** no API route tests; no `vi.mock` anywhere.

## Open questions
- Whether production `events` still has the 3-value CHECK constraint
  (`supabase-setup.sql:43`).
