# Wearables — Forecast vs Actual

## The model

Persist decodes the **forecast**: your calendar tells it what today is
going to demand (Focus / Strain / Balance). A wearable supplies the
**actual**: what your body brought to the day (recovery, sleep, HRV, resting
HR) and what it has left.

The two fuse into **readiness** (0–100): what a working athlete has left to
train with at any moment. Not a countdown — people train at 6am before the
chaos as often as 6pm after it, so the algorithm is time-aware:

```
capacity    = recovery − 8·max(0, 6 − sleepHours)            (what the body has)
demand      = 0.5·Strain + 0.3·(100−Balance) + 0.2·(100−Focus)
cost        = clamp((demand − 20) / 80, 0..1)                (light days cost ~0)
tax         = 45 · cost                                      (a brutal day takes ≤45 pts)
readiness(t) = capacity − tax · spentFraction(t)              (tax lands as meetings elapse)
```

`spentFraction` is the share of the day's meeting minutes already elapsed
(in-progress meetings count partially). Bands map readiness to verdicts:
**≥65 train hard · 40–64 keep it easy · <40 recovery day**. Three phases
shape the message:

- **morning** (before the first meeting) — full capacity; if the day ahead
  is expensive and the projection drops a band, the algorithm points at the
  morning window: "if today has a hard session in it, it's this morning."
- **mid-workday** — shows readiness now → projected at clear; the evening
  session is planned on the projection, not the moment.
- **clear** — the final verdict on what's left.

All constants (45-pt max tax, 8 pts/missing sleep hour, band thresholds,
demand weights) are v1 heuristics in `src/lib/readiness.ts`, unit-tested
and meant to be tuned against real worn data.

Vocabulary is deliberately sport-agnostic: workday, readiness, recovery,
session, train hard / keep it easy / recovery day. No trail/ride/run
specifics — never assume the sport.

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
src/lib/readiness.ts — computeReadiness / forecastVsActual (pure, tested)
        │
        ▼
WearableSection (dashboard "Forecast vs Actual" section)
```

| Path                                         | Purpose                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/lib/wearables/types.ts`                 | `WearableActuals` — the normalized shape every provider maps into                 |
| `src/lib/wearables/whoop.ts`                 | WHOOP OAuth + Developer API v2 client (server-side only)                          |
| `src/lib/wearables/demo.ts`                  | Deterministic demo actuals (no device required)                                   |
| `src/lib/readiness.ts`                       | Readiness algorithm: `bodyCapacity`, `workdayCost`, `computeReadiness`            |
| `pages/api/wearables/connect.ts`             | Starts OAuth (whoop) or creates a demo connection                                 |
| `pages/api/wearables/callback.ts`            | WHOOP OAuth callback (state-checked)                                              |
| `pages/api/wearables/actuals.ts`             | Returns today's normalized actuals; persists to `wearable_daily`                  |
| `pages/api/wearables/disconnect.ts`          | Deletes the connection (keeps history)                                            |
| `src/hooks/useWearable.ts`                   | Client state: connected/provider/actuals + connect/disconnect                     |
| `src/components/WearableSection.tsx`         | Dashboard UI: readiness panel + actuals row                                       |
| `supabase/migrations/20260611_wearables.sql` | `wearable_connections` + `wearable_daily`                                         |

The work-health API also returns `dayShape` — event start/end times only (no
titles) — so the client can compute time-aware readiness without another
calendar round-trip.

## Providers

Adding a provider means: implement `fetch<Provider>Actuals(...) →
WearableActuals` plus OAuth helpers in `src/lib/wearables/<provider>.ts`,
branch on it in `connect.ts` and `actuals.ts`, and extend the
`WearableProvider` union. Nothing downstream of `WearableActuals` changes.

### Provider decision (June 2026, revised): body-first — WHOOP is the story

The product story is ONE sentence: the calendar is the forecast, your
body is the actual. "Actual" means body capacity (recovery, sleep, HRV),
and the UI offers exactly one real provider: **WHOOP** (free self-serve
developer API at developer.whoop.com; recovery vocabulary matches
Persist's scores one-for-one). The demo provider previews the same
body-shaped data with zero setup.

**Strava is integrated but dormant.** It was built as the cheapest
plumbing test (self-serve OAuth, no hardware — but a Strava subscription
is now required for API access). Being activity-only it tells a second
story ("did you actually get out") that muddied the first, so its connect
button is removed from the UI. The provider, routes, and messaging
remain in code behind the abstraction; re-enable by adding the button
back and setting `STRAVA_*` env vars.

The rest of the body-data field, for when a second provider matters:

- **Oura** — free self-serve OAuth2; its readiness score maps 1:1 onto our
  capacity input. The natural second provider if users skew ring.
- **COROS** — the API _does_ carry body data (nightly sleep stages, HRV,
  recovery %, EvoLab training load), and COROS even ships an official MCP
  server — but access is a partner application, not self-serve. Worth
  applying if trail-runner users skew COROS; not a quick add.
- **Garmin** — Body Battery would fit, but the Connect Developer Program
  is suspended to new applicants (no timeline).
- **Fitbit** — self-serve API with sleep/HRV/RHR (its readiness score
  itself isn't exposed); we'd derive bands from raw signals.
- **Amazfit / Zepp** — on-watch app platform only; no practical open
  cloud API. **Apple Health** — no cloud API; needs a native iOS app.

`WearableActuals` still supports both flavors honestly: recovery
providers fill `recovery/sleepHours/hrvMs/restingHr`; activity providers
fill `lastActivity/weekActivityCount` and leave biometrics absent
(numeric readiness is null and the panel falls back to "go log it /
already logged" messaging).

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
