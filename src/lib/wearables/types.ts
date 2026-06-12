// Normalized wearable data model. Every provider (WHOOP, Strava, demo,
// future Oura/Garmin) maps its API response into this shape — nothing
// downstream should ever see provider-specific fields.
//
// Providers come in two flavors and fill different subsets honestly:
//   recovery providers (WHOOP, demo) — body readiness: recovery, sleep, HRV
//   activity providers (Strava)      — proof you got out: last activity, week count

export type WearableProvider = 'whoop' | 'strava' | 'demo';

/** A single logged activity (run, ride, hike...). */
export interface ActivitySummary {
  /** Provider's activity type, e.g. 'Run', 'TrailRun', 'Ride'. */
  type: string;
  name?: string;
  startISO: string;
  durationMin: number;
  distanceKm?: number;
}

/** One day of actuals, normalized across providers. */
export interface WearableActuals {
  /** Local calendar date (YYYY-MM-DD) the actuals describe. */
  date: string;
  provider: WearableProvider;
  /** Recovery / readiness, 0–100. Absent for activity-only providers. */
  recovery?: number;
  /** Total sleep last night, in hours. */
  sleepHours?: number;
  /** Sleep performance vs. need, 0–100 (when the provider reports it). */
  sleepPerformance?: number;
  /** Heart-rate variability in milliseconds (RMSSD). */
  hrvMs?: number;
  /** Resting heart rate in bpm. */
  restingHr?: number;
  /** Cumulative day strain on the provider's scale (WHOOP: 0–21). */
  dayStrain?: number;
  /** Most recent logged activity (activity providers). */
  lastActivity?: ActivitySummary;
  /** Activities logged in the trailing 7 days (activity providers). */
  weekActivityCount?: number;
}

/** A stored OAuth connection to a wearable provider. */
export interface WearableConnection {
  provider: WearableProvider;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
}
