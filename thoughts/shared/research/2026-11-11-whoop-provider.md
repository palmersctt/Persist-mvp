---
date: 2026-11-11
git_commit: 9686622
branch: claude/jolly-pascal-67e0me
questions: thoughts/shared/questions/2026-11-11-whoop-provider.md
status: complete
---

# Research: wearable providers as they work today

## Summary

A WHOOP client, its OAuth routes and its environment variables already exist
in the code. No button offers it to the user, and none of the fields it
returns are read by the readiness model.

## Findings

### 1. Provider contract

- `src/lib/wearables/types.ts` holds data types only: the
  `WearableProvider` union `'whoop' | 'strava' | 'demo'` (`types.ts:9`) and
  `WearableActuals` (`types.ts:22-56`). There is no provider interface.
- The nearest contract is `OAuthProviderAdapter` (`provider`, `refresh`,
  `fetch`, `unauthorizedError`) and the `OAUTH_ADAPTERS` record keyed by
  `'whoop' | 'strava'` (`pages/api/wearables/actuals.ts:68-90`).
- `connect.ts` and `callback.ts` choose a provider with inline ternaries
  (`connect.ts:61,76-79`; `callback.ts:44-47`).

### 2. Strava end to end

- Connect sets state and provider cookies and redirects to Strava
  (`connect.ts:68-80`); the callback checks state, exchanges the code and
  upserts `wearable_connections` (`callback.ts:22-68`).
- `getOAuthActuals` refreshes a token within 5 minutes of expiry, and once
  more on an unauthorized error (`actuals.ts:121-146`).
- `fetchStravaActuals` reads 49 days of activities and returns
  `trainingBaseline`, `trainingLoadToday`, `weekActivityCount`,
  `freshness`, `lastActivity` and `dayStrain`
  (`src/lib/wearables/strava.ts:185-250`). Load per activity is
  `suffer_score`, else minutes moved (`strava.ts:123-126`).

### 3. `src/lib/wearables/whoop.ts`

- A complete client: auth URL, code exchange, refresh, and
  `fetchWhoopActuals` (`whoop.ts:9-168`). API base
  `https://api.prod.whoop.com/developer/v2`; scopes `read:recovery`,
  `read:sleep`, `read:cycles`, `read:profile`, `offline` (`whoop.ts:9-13`).
- It reads the latest record from `/recovery`, `/activity/sleep` and
  `/cycle` (`whoop.ts:121-125`) and returns `recovery`, `sleepHours`,
  `sleepPerformance`, `hrvMs`, `restingHr` and `dayStrain`
  (`whoop.ts:149-166`).
- It does not set `trainingBaseline`, `trainingLoadToday`,
  `weekActivityCount`, `freshness` or `lastActivity`.
- It is wired into `connect.ts:6,61,78`, `callback.ts:5,46` and
  `actuals.ts:6-10,78-83`. It has no test file.

### 4. API routes

- All four take the user from `getServerSession` and key on
  `session.user.email`.
- `actuals.ts` serves the most recently updated connection only
  (`actuals.ts:172-177`). `disconnect.ts` deletes every connection for the
  user, with no provider filter (`disconnect.ts:9-28`).
- An unconfigured provider redirects to
  `/dashboard?wearable=<provider>-unavailable` (`connect.ts:61-64`).

### 5. Database

- `wearable_connections`: tokens per `(user_email, provider)`, row-level
  security on with no policies (`20260611_wearables.sql:12-26`).
- `wearable_daily`: one row per user per day with `recovery`,
  `sleep_hours`, `sleep_performance`, `hrv_ms`, `resting_hr`,
  `day_strain` (`sql:28-49`). It has no columns for the training fields, so
  the stale fallback returns none of them (`actuals.ts:36-66`).

### 6. Environment variables

- `WHOOP_CLIENT_ID` and `WHOOP_CLIENT_SECRET` are read at
  `whoop.ts:16,22,64-65,76-77`, and `NEXTAUTH_URL` builds the redirect URI
  (`connect.ts:75`). None of the provider variables is declared in
  `types/env.d.ts`.

### 7. What the model reads

- `dashboardVerdict` reads only `trainingBaseline`, `trainingLoadToday`
  and `weekActivityCount` (`src/lib/dashboardModel.ts:49-51,73`).
- `sleep` is fixed at 62 and `trainingFeel` at 0
  (`dashboardModel.ts:61-62`). The model does have a sleep input:
  `(today.sleep - SLEEP_NEUTRAL) * 0.35` enters Readiness
  (`src/lib/model.ts:37,146`).
- So a WHOOP connection today produces the same verdict as no connection.

### 8. UI

- `WearableSection` offers "Connect Strava" and "Preview with demo data"
  only (`src/components/WearableSection.tsx:69-120`). There is no WHOOP
  button, although `available.whoop` reaches the hook
  (`src/hooks/useWearable.ts:12,26`).
- Only `strava-unavailable`, `denied` and `error` produce a notice
  (`WearableSection.tsx:24-38`).

### 9. Tests

- `strava.test.ts` covers the pure load functions with hand-built fixtures;
  `dashboardModel.test.ts` covers `dashboardVerdict`. Nothing is mocked,
  and no network function or route is tested.

### 10. `WEARABLES.md`

- It calls WHOOP the "precision tier" kept in code, re-exposed by adding the
  button back and setting the `WHOOP_*` variables (`WEARABLES.md:106-111`),
  with app registration steps (`:136-145`).
- It disagrees with the code in places: it describes a WHOOP button that does
  not exist (`:147-148`) and says Strava carries no `dayStrain`
  (`:164-166`).

## Open questions

- Whether the WHOOP endpoints and field names in `whoop.ts` match the live
  API cannot be determined from the code.
