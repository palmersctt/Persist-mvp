import { describe, it, expect } from 'vitest';
import { activityLoad, freshnessFromActivities } from './strava';

const BASE = '2026-06-11';
const DAY_MS = 86400000;

/** YYYY-MM-DD for `n` days before BASE. */
function dayBefore(n: number): string {
  return new Date(new Date(`${BASE}T00:00:00Z`).getTime() - n * DAY_MS).toISOString().slice(0, 10);
}

/** A run of daily sessions of `movingMin` minutes, spanning days `from`..`to` before BASE. */
function dailySessions(from: number, to: number, movingMin: number) {
  const out = [];
  for (let n = from; n <= to; n++) {
    out.push({ start_date: `${dayBefore(n)}T17:00:00Z`, moving_time: movingMin * 60 });
  }
  return out;
}

describe('activityLoad', () => {
  it('prefers relative effort when Strava reports it', () => {
    expect(activityLoad({ suffer_score: 120, moving_time: 3600 })).toBe(120);
  });

  it('falls back to ~1 load per minute of moving time', () => {
    expect(activityLoad({ moving_time: 3600 })).toBe(60);
    expect(activityLoad({ suffer_score: null, moving_time: 1800 })).toBe(30);
  });
});

describe('freshnessFromActivities', () => {
  it('is null with no training history', () => {
    expect(freshnessFromActivities([], BASE)).toBeNull();
  });

  it('reads fresh after a taper — recent load below the chronic baseline', () => {
    // Five weeks of daily hour-long sessions, then eight rest days.
    const f = freshnessFromActivities(dailySessions(8, 42, 60), BASE);
    expect(f).not.toBeNull();
    expect(f!).toBeGreaterThan(50);
  });

  it('reads fatigued when recent load spikes above the chronic baseline', () => {
    // Light chronic base, then a heavy last five days.
    const activities = [...dailySessions(14, 42, 20), ...dailySessions(0, 4, 150)];
    const f = freshnessFromActivities(activities, BASE);
    expect(f!).toBeLessThan(50);
  });

  it('ranks a tapered athlete fresher than a fatigued one', () => {
    const tapered = freshnessFromActivities(dailySessions(8, 42, 60), BASE)!;
    const fatigued = freshnessFromActivities(
      [...dailySessions(14, 42, 20), ...dailySessions(0, 4, 150)],
      BASE
    )!;
    expect(tapered).toBeGreaterThan(fatigued);
  });

  it('clamps into a sane 5–98 band', () => {
    const f = freshnessFromActivities(dailySessions(8, 42, 60), BASE)!;
    expect(f).toBeGreaterThanOrEqual(5);
    expect(f).toBeLessThanOrEqual(98);
  });
});
