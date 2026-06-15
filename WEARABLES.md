# Wearables — Forecast vs Actual

## The model

Persist reads the **forecast** from your calendar — Focus / Strain / Rhythm,
aggregated into a 0–100 **Work Index** (the _shape_ of the workday) — and the
**actual** from Strava (training load). Work and training share one load
currency, and the model answers a single question: **how hard to train
today.**

```
load      = workLoad + trainingLoad                    (one shared currency)
baseline  = 21-day EWMA, SEEDED FROM A PRIOR           (backfill, not a wait)
recent    = 7-day EWMA
ACWR      = recent / baseline                          (more than you're built for?)
balance   = slow EWMA of signed restoration            (filling or draining?)
Readiness = 0.45·fit + 0.45·balance + sleep nudge      (the headline 0–100)
```

The baseline is **seeded from a prior** (the trailing weeks Strava/Calendar
hand us at connect, or an onboarding default) instead of accumulated over
time — so there's a real verdict on **day one**. As days log, the EWMA drifts
the baseline off the prior toward what you actually do; that's where trends
sharpen it.

A single **verdict** falls out — Survival / Grinding / Coasting / Locked In /
Flow — which drives the card's mood, tier, and action (recover · keep it
moderate · optional · go hard · train normally). Three scores show on the
card:

- **Readiness** — the headline. `0.45·fit + 0.45·balance + sleep nudge`,
  where `fit` rewards an ACWR near 1.0 (in your band) and is discounted when
  balance is negative. High = training in your band _and_ net-filling days.
- **Load** — how hard recent load is pressing over your baseline (ACWR
  driven; a slump reads low, a spike reads high).
- **Balance** — the restoration balance: positive fills, negative drains,
  regardless of how heavy the day was.

**Work Index** = `0.30·Focus + 0.30·Rhythm + 0.40·(100−Strain)` — an
objective read of the workday's shape, independent of its _volume_ (that's
workLoad). It's the work half of Balance, so a heavy-but-deep day can still
read as filling.

Constants (EWMA windows, ACWR bands, the Readiness and Work Index weights) are
v1 heuristics in `src/lib/model.ts` + `dashboardModel.ts`, unit-tested and
meant to be tuned against real data. `trainingFeel` and `sleep` have no signal
yet, so they're held neutral — Balance currently leans on Work Index.

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
        │            ┌── work-health scores from /api/work-health
        ▼            ▼
src/lib/model.ts + dashboardModel.ts — the unified readiness verdict (pure, tested)
        │
        ▼
WearableSection / ReadinessExplain (dashboard "Why your readiness" panel)
```

| Path                                         | Purpose                                                              |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `src/lib/wearables/types.ts`                 | `WearableActuals` — the normalized shape every provider maps into    |
| `src/lib/wearables/whoop.ts`                 | WHOOP OAuth + Developer API v2 client (server-side only)             |
| `src/lib/wearables/demo.ts`                  | Deterministic demo actuals (no device required)                      |
| `src/lib/model.ts` / `dashboardModel.ts`     | Unified readiness model: load vs baseline + Work Index → one verdict |
| `pages/api/wearables/connect.ts`             | Starts OAuth (whoop) or creates a demo connection                    |
| `pages/api/wearables/callback.ts`            | WHOOP OAuth callback (state-checked)                                 |
| `pages/api/wearables/actuals.ts`             | Returns today's normalized actuals; persists to `wearable_daily`     |
| `pages/api/wearables/disconnect.ts`          | Deletes the connection (keeps history)                               |
| `src/hooks/useWearable.ts`                   | Client state: connected/provider/actuals + connect/disconnect        |
| `src/components/WearableSection.tsx`         | Dashboard UI: readiness panel + actuals row                          |
| `supabase/migrations/20260611_wearables.sql` | `wearable_connections` + `wearable_daily`                            |

The work-health API also returns `dayShape` — event start/end times only (no
titles) — alongside the schedule stats (`durationHours`, etc.) the model
reads for work load.

## Providers

Adding a provider means: implement `fetch<Provider>Actuals(...) →
WearableActuals` plus OAuth helpers in `src/lib/wearables/<provider>.ts`,
branch on it in `connect.ts` and `actuals.ts`, and extend the
`WearableProvider` union. Nothing downstream of `WearableActuals` changes.

### Provider decision (June 2026, revised): training-first — Strava is the story

The product story is ONE sentence: the calendar is the forecast, your
training is the actual. The UI leads with **Strava** — self-serve OAuth,
no hardware, the provider the most working athletes already have. Strava
has no recovery/HRV, so we read **training load** instead — a chronic
baseline ("what you're built for") plus today's load — and judge today
against it. See `trainingLoadProfile` in `src/lib/wearables/strava.ts`.
The demo provider previews the same shape with zero setup.

**WHOOP remains in code as the precision tier.** Its recovery/sleep/HRV are
a truer body read than training-load inference and could feed the model's
fill/recovery axis directly; the provider, OAuth, and routes stay behind the
abstraction. Re-expose by adding its connect button back and setting
`WHOOP_*` env vars. Training load is a heuristic from what you've logged,
not a measured body state — when a body-state device is connected, prefer it.

The rest of the body-data field, for when a second provider matters:

- **Oura** — free self-serve OAuth2; its readiness score would feed the
  model's recovery/fill axis directly. The natural second provider if users
  skew ring.
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
fill `lastActivity/weekActivityCount` plus `trainingBaseline` and
`trainingLoadToday` — the load profile the model judges today against. A
brand-new account with no training history just leans on the prior baseline,
so there's still a verdict on day one.

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
