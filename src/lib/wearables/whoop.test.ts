import { describe, it, expect } from 'vitest';
import { latestMainSleep, whoopToActuals, type WhoopRecords } from './whoop';

const DATE = '2026-06-11';

const recovery = {
  score: { recovery_score: 66.4, hrv_rmssd_milli: 48.6, resting_heart_rate: 52 },
};
const sleep = {
  start: '2026-06-10T22:30:00.000Z',
  end: '2026-06-11T06:30:00.000Z',
  score: {
    sleep_performance_percentage: 88.2,
    stage_summary: {
      total_in_bed_time_milli: 8 * 3600000,
      total_awake_time_milli: 0.5 * 3600000,
    },
  },
};
const cycle = { score: { strain: 12.345 } };

const records = (over: Partial<WhoopRecords> = {}): WhoopRecords => ({
  recovery,
  sleep,
  cycle,
  ...over,
});

describe('whoopToActuals', () => {
  it('normalizes recovery, sleep and strain', () => {
    expect(whoopToActuals(records(), DATE)).toEqual({
      date: DATE,
      provider: 'whoop',
      recovery: 66,
      sleepHours: 7.5, // in bed minus awake
      sleepPerformance: 88,
      hrvMs: 49,
      restingHr: 52,
      dayStrain: 12.3,
    });
  });

  it('returns null when WHOOP has neither recovery nor sleep', () => {
    expect(whoopToActuals(records({ recovery: null, sleep: null }), DATE)).toBeNull();
  });

  it('leaves a missing value absent instead of reporting zero', () => {
    const a = whoopToActuals(records({ recovery: null, cycle: null }), DATE);
    expect(a?.recovery).toBeUndefined();
    expect(a?.hrvMs).toBeUndefined();
    expect(a?.dayStrain).toBeUndefined();
    expect(a?.sleepPerformance).toBe(88);
  });

  it('falls back to the start/end span when sleep stages are missing', () => {
    const unstaged = { start: sleep.start, end: sleep.end, score: {} };
    expect(whoopToActuals(records({ sleep: unstaged }), DATE)?.sleepHours).toBe(8);
  });

  it('treats an unscored sleep as no sleep data', () => {
    const a = whoopToActuals(records({ sleep: {} }), DATE);
    expect(a?.sleepHours).toBeUndefined();
    expect(a?.sleepPerformance).toBeUndefined();
  });

  describe('training load from workouts', () => {
    const DAY_MS = 86400000;
    /** A workout of `minutes`, `daysAgo` days before DATE, at 17:00 UTC. */
    const workout = (daysAgo: number, minutes: number, extra: Record<string, unknown> = {}) => {
      const start = new Date(`${DATE}T17:00:00Z`).getTime() - daysAgo * DAY_MS;
      return {
        start: new Date(start).toISOString(),
        end: new Date(start + minutes * 60000).toISOString(),
        ...extra,
      };
    };
    const fiveWeeks = Array.from({ length: 35 }, (_, i) => workout(i + 1, 60));

    it('leaves training absent when there are no workouts', () => {
      const a = whoopToActuals(records({ workouts: [] }), DATE);
      expect(a?.trainingBaseline).toBeUndefined();
      expect(a?.trainingLoadToday).toBeUndefined();
      expect(a?.weekActivityCount).toBeUndefined();
    });

    it('builds a baseline and today’s load from minutes moved', () => {
      const a = whoopToActuals(records({ workouts: [...fiveWeeks, workout(0, 75)] }), DATE);
      expect(a?.trainingLoadToday).toBe(75);
      expect(a?.trainingBaseline).toBeGreaterThan(0);
      expect(a?.trainingBaseline).toBeLessThan(60); // an EWMA of hour-long days
      expect(a?.freshness).toBeGreaterThanOrEqual(5);
    });

    it('counts the trailing seven days and reports the latest workout', () => {
      const a = whoopToActuals(
        records({
          workouts: [
            ...fiveWeeks,
            workout(0, 42, { sport_name: 'running', score: { distance_meter: 8040 } }),
          ],
        }),
        DATE
      );
      expect(a?.weekActivityCount).toBe(7); // today + the six days before
      expect(a?.lastActivity).toMatchObject({ type: 'running', durationMin: 42, distanceKm: 8 });
    });

    it('ignores workouts without a usable start and end', () => {
      const a = whoopToActuals(
        records({ workouts: [{ start: 'nope', end: 'nope' }, { score: {} }] }),
        DATE
      );
      expect(a?.trainingBaseline).toBeUndefined();
    });

    it('buckets an evening workout by the wearer’s local day', () => {
      // 17:30 in Los Angeles is 00:30 UTC the next day
      const evening = {
        start: '2026-06-12T00:30:00.000Z',
        end: '2026-06-12T01:15:00.000Z',
        timezone_offset: '-07:00',
      };
      const a = whoopToActuals(records({ workouts: [evening] }), DATE);
      expect(a?.trainingLoadToday).toBe(45);
    });

    it('returns training-only actuals when there is no recovery or sleep yet', () => {
      const a = whoopToActuals(
        records({ recovery: null, sleep: null, workouts: [workout(0, 30)] }),
        DATE
      );
      expect(a?.trainingLoadToday).toBe(30);
      expect(a?.recovery).toBeUndefined();
    });
  });
});

describe('latestMainSleep', () => {
  const NOW = new Date('2026-06-11T15:00:00Z').getTime();
  const night = { nap: false, end: '2026-06-11T06:30:00.000Z' };
  const nap = { nap: true, end: '2026-06-11T14:00:00.000Z' };

  it('skips a nap and returns last night', () => {
    expect(latestMainSleep({ records: [nap, night] }, NOW)).toBe(night);
  });

  it('ignores a sleep that ended more than 36 hours ago', () => {
    const old = { nap: false, end: '2026-06-04T06:30:00.000Z' };
    expect(latestMainSleep({ records: [nap, old] }, NOW)).toBeNull();
  });

  it('returns null for an empty or failed response', () => {
    expect(latestMainSleep({ records: [] }, NOW)).toBeNull();
    expect(latestMainSleep(null, NOW)).toBeNull();
  });
});
