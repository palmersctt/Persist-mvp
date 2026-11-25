---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-lock-down-analytics-routes.md
outline: thoughts/shared/outlines/2026-11-25-lock-down-analytics-routes.md
status: ready
---

# Plan: lock down leaking routes

## What we are not doing
Roles in the database; changing POST /api/analytics/events.

## Phase 1
### Changes
- `src/lib/admin.ts`: `isAdmin(email, list = process.env.ADMIN_EMAILS)`.
- `pages/api/analytics/users.ts`: after the session check, 403 unless admin.
- `pages/api/analytics/events.ts` GET: same.
- `pages/api/ai-health.ts`: remove `anthropicKeyLength` and
  `anthropicKeyPrefix` from both responses.
- Tests: `src/lib/admin.test.ts`; `pages/api/__tests__/adminRoutes.test.ts`
  mocking `next-auth/next`, `../auth/[...nextauth]` and `lib/supabase`.
### Automated checks
- [x] `npx vitest run src/lib/admin.test.ts pages/api/__tests__`
- [x] `npm run verify`
### Manual checks
- [ ] Set `ADMIN_EMAILS` in Vercel if you want the analytics GETs.
