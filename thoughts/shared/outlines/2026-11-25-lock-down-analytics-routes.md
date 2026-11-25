---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-lock-down-analytics-routes.md
status: approved
---

# Outline: lock down leaking routes (ticket 8)

## Phase 1 (single phase)
- `src/lib/admin.ts`: `isAdmin(email: string | null | undefined, list =
  process.env.ADMIN_EMAILS): boolean` (trimmed, case-insensitive).
- `pages/api/analytics/users.ts`, `pages/api/analytics/events.ts` (GET):
  403 unless `isAdmin(session.user.email)`.
- `pages/api/ai-health.ts`: drop `anthropicKeyLength` / `anthropicKeyPrefix`.
- **Automated:** `admin.test.ts`; `pages/api/analytics/__tests__` route
  tests with mocked session: non-admin → 403, admin → 200 (Supabase mocked),
  no session → 401; ai-health response has no key fields; `npm run verify`.
- **Manual:** set `ADMIN_EMAILS` in Vercel if you want the analytics GETs.
