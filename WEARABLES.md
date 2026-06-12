# Wearables — Forecast vs Actual

## The model

Persist already reads the **forecast**: your calendar tells it what today is
going to demand (Focus / Strain / Balance). A wearable supplies the
**actual**: what your body brought to the day (recovery, sleep, HRV, resting
HR) and what it has left.

Merging the two unlocks the workday. While meetings remain, the dashboard
counts down to the moment you're clear. The instant the last event ends, the
unlock state answers the only question that matters at 5pm:

- **charged** — "Workday clear — hit the trails."
- **steady** — "Workday clear — an easy ride is earned."
- **drained** — "Workday clear — make it a recovery day."

Readiness uses WHOOP-style recovery bands (green ≥ 67, yellow 34–66,
red < 34), with green knocked down a notch when sleep was under 6 hours.

## Architecture

```
provider APIs (WHOOP / demo)
        │  normalized to WearableActuals
        ▼
/api/wearables/*  ──persist──▶  Supabase (wearable_connections, wearable_daily)
        │
        ▼
useWearable (client hook)
        │            ┌── dayShape (event times) from /api/work-health
        ▼            ▼
src/lib/readiness.ts — computeUnlock / forecastVsActual (pure, tested)
        │
        ▼
WearableSection (dashboard "Forecast vs Actual" section)
```

| Path                                         | Purpose                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/lib/wearables/types.ts`                 | `WearableActuals` — the normalized shape every provider maps into                 |
| `src/lib/wearables/whoop.ts`                 | WHOOP OAuth + Developer API v2 client (server-side only)                          |
| `src/lib/wearables/demo.ts`                  | Deterministic demo actuals (no device required)                                   |
| `src/lib/readiness.ts`                       | Forecast×actual merge: `assessBodyReadiness`, `computeUnlock`, `forecastVsActual` |
| `pages/api/wearables/connect.ts`             | Starts OAuth (whoop) or creates a demo connection                                 |
| `pages/api/wearables/callback.ts`            | WHOOP OAuth callback (state-checked)                                              |
| `pages/api/wearables/actuals.ts`             | Returns today's normalized actuals; persists to `wearable_daily`                  |
| `pages/api/wearables/disconnect.ts`          | Deletes the connection (keeps history)                                            |
| `src/hooks/useWearable.ts`                   | Client state: connected/provider/actuals + connect/disconnect                     |
| `src/components/WearableSection.tsx`         | Dashboard UI: unlock banner + actuals row                                         |
| `supabase/migrations/20260611_wearables.sql` | `wearable_connections` + `wearable_daily`                                         |

The work-health API also returns `dayShape` — event start/end times only (no
titles) — so the client can compute the unlock moment without another
calendar round-trip.

## Providers

Adding a provider means: implement `fetch<Provider>Actuals(...) →
WearableActuals` plus OAuth helpers in `src/lib/wearables/<provider>.ts`,
branch on it in `connect.ts` and `actuals.ts`, and extend the
`WearableProvider` union. Nothing downstream of `WearableActuals` changes.

### Provider decision (June 2026): Strava to test, WHOOP for recovery data

Surveyed the field before committing:

- **Strava** — self-serve OAuth2 app (strava.com/settings/api); under the
  2026 developer program, API access requires a Strava subscription
  (~$12/mo) but no review for up to 10 athletes. **No hardware needed** —
  activities recorded with the phone app count. Activity-only (no
  recovery/sleep/HRV), so its actuals answer "did you actually get out",
  closing the unlock loop. **Chosen as the first real-data test path.**
- **WHOOP** — free self-serve developer API (OAuth2, register at
  developer.whoop.com, ship same day). Recovery/strain vocabulary matches
  Persist's scores one-for-one. Requires owning a WHOOP. **The recovery
  provider once a device is in hand.**
- **Oura** — also free self-serve OAuth2 (personal access tokens were
  deprecated Dec 2025; OAuth is unaffected). Its "readiness" maps cleanly
  onto the unlock logic. Strong second recovery provider if users skew ring.
- **Garmin** — best demographic fit for trail athletes, but the Garmin
  Connect Developer Program is suspended to new applicants (no timeline).
  Revisit when it reopens.
- **COROS** — API access is partner-application only, not self-serve. Not
  viable for a quick test.
- **Amazfit / Zepp** — the Zepp developer platform targets on-watch apps;
  there is no practical open cloud API for third parties.
- **Apple Health** — no cloud API; requires a native iOS companion app to
  read HealthKit. A later, larger project.

The demo provider remains the zero-cost dogfooding path.

Providers therefore come in two flavors, and `WearableActuals` keeps both
honest: recovery providers fill `recovery/sleepHours/hrvMs/restingHr`;
activity providers fill `lastActivity/weekActivityCount` and leave the
biometrics absent. `readiness` is null for activity providers — the unlock
still fires, with "go log it / already logged" messaging instead of a
body-capacity verdict.

### WHOOP

Register an app at [developer.whoop.com](https://developer.whoop.com) with
redirect URI `${NEXTAUTH_URL}/api/wearables/callback` and scopes
`read:recovery read:sleep read:cycles read:profile offline`, then set:

```
WHOOP_CLIENT_ID=...
WHOOP_CLIENT_SECRET=...
```

Without these, the WHOOP connect button redirects back with a friendly
"not configured" notice — the demo provider still works.

### Strava

Create an app at [strava.com/settings/api](https://www.strava.com/settings/api)
(requires a Strava subscription for API access). Set the Authorization
Callback Domain to your deployment's domain, then set:

```
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
```

Scopes requested: `read,activity:read_all` (`activity:read` alone excludes
private activities, and a personal trail log is usually private). Strava
access tokens expire every 6 hours (`expires_in: 21600`);
`/api/wearables/actuals` refreshes them automatically. Note: relative
effort (suffer score) is not in the activity list response, so Strava
actuals carry no `dayStrain`.

### Demo

`?provider=demo` creates a tokenless connection; actuals are generated
deterministically from email + date, so the flow is fully walkable (and
stable across refreshes) without hardware.

## Storage & privacy

- `wearable_connections` holds OAuth tokens — RLS enabled with **no anon
  policies**; only the service-role client touches it.
- `wearable_daily` is one row per user per local day; anon key gets
  read-own only (same hardening as `daily_scores`).
- Disconnecting deletes tokens but keeps `wearable_daily` history — it's the
  user's data, and future trend work (forecast vs actual over weeks) needs it.

## Next steps (not built yet)

- Blend actuals into the daily scores themselves (e.g., low recovery dampens
  Balance) — today the merge is presented alongside, not inside, the scores.
- Wearable history in TrendsSection (recovery line vs Strain line).
- More providers: Oura, Garmin, or Terra as an aggregator if provider count
  grows past two.
- Evening push/notification at unlock time.
