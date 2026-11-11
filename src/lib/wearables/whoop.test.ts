import { describe, it, expect } from 'vitest';
import { whoopToActuals, type WhoopRecords } from './whoop';

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
});
