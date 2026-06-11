// Normalized wearable data model. Every provider (WHOOP, demo, future Oura/
// Garmin) maps its API response into this shape — nothing downstream should
// ever see provider-specific fields.

export type WearableProvider = 'whoop' | 'demo';

/** One day of physiological actuals, normalized across providers. */
export interface WearableActuals {
  /** Local calendar date (YYYY-MM-DD) the actuals describe. */
  date: string;
  provider: WearableProvider;
  /** Recovery / readiness, 0–100. The headline number. */
  recovery: number;
  /** Total sleep last night, in hours. */
  sleepHours: number;
  /** Sleep performance vs. need, 0–100 (when the provider reports it). */
  sleepPerformance?: number;
  /** Heart-rate variability in milliseconds (RMSSD). */
  hrvMs?: number;
  /** Resting heart rate in bpm. */
  restingHr?: number;
  /** Cumulative day strain on the provider's scale (WHOOP: 0–21). */
  dayStrain?: number;
}

/** A stored OAuth connection to a wearable provider. */
export interface WearableConnection {
  provider: WearableProvider;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
}
