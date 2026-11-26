---
date: 2026-11-26
status: implemented
covers:
  - thoughts/shared/plans/2026-11-25-real-baseline.md
  - thoughts/shared/plans/2026-11-25-daily-feel-checkin.md
  - thoughts/shared/plans/2026-11-25-assistant-scoring-engine.md
  - thoughts/shared/plans/2026-11-25-try-it-experience.md
---

# Plan: fixes from validation (approved by the user, 2026-11-26)

Within the agreed designs; no model, constant or verdict change.

## Changes
1. **Clickjacking:** `next.config.js` sends `X-Frame-Options: DENY` and
   `Content-Security-Policy: frame-ancestors 'none'` on every route.
2. **Consent identity:** the consent page shows the redirect host;
   registration is capped at 100 per rolling hour (429 after).
3. **Migrations:** renamed `20261125000001…04` so they sort in apply order;
   `day_inputs` policy re-runnable (`DROP POLICY IF EXISTS`).
4. **Rate yesterday:** the check-in offers "Rate yesterday instead" when
   yesterday was scored (`FeelCheckin` gains `question` and children).
5. **Baseline line:** `DashboardVerdict.baselineDays` (= the confidence
   count, last 21 days) drives "Your baseline · N days logged".
6. **OAuth token cap:** `api_tokens.client_id` (oauth migration); a new
   token for the same user and app revokes the previous one.
7. **Deep sandbox links:** `/sandbox/:path*` → `/verdict`.
8. **Save retry:** a save that comes back not stored can be retried.
9. **CI:** `npm run build` after `npm run verify`.

## Automated checks
- [x] `tests/api/nextConfig.test.ts` (headers, redirects, rewrites)
- [x] `tests/api/oauth.test.ts` (redirect host, token replaced on reconnect,
      registration rate limit)
- [x] `FeelCheckin.test.tsx` (question + children); `scoreDay.test.ts`
      (baselineDays)
- [x] `npm run verify`; `npm run build`

## Manual checks
- [ ] Apply the four migrations in filename order.
- [ ] Set `NEXTAUTH_URL` in production.
- [ ] Next morning: rate yesterday from the dashboard.
