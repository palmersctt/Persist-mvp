import { describe, it, expect } from 'vitest';
import {
  assessBodyReadiness,
  computeUnlock,
  forecastVsActual,
  type DayShape,
  type ForecastScores,
} from './readiness';
import type { WearableActuals } from './wearables/types';

const actuals = (overrides: Partial<WearableActuals> = {}): WearableActuals => ({
  date: '2026-06-11',
  provider: 'demo',
  recovery: 70,
  sleepHours: 7.5,
  ...overrides,
});

// Activity-only provider (Strava): no recovery/sleep, just logged movement
const stravaActuals = (overrides: Partial<WearableActuals> = {}): WearableActuals => ({
  date: '2026-06-11',
  provider: 'strava',
  weekActivityCount: 3,
  lastActivity: {
    type: 'TrailRun',
    startISO: '2026-06-10T17:30:00Z',
    durationMin: 52,
    distanceKm: 8.4,
  },
  ...overrides,
});

describe('assessBodyReadiness', () => {
  it('is charged when recovery is green and sleep adequate', () => {
    expect(assessBodyReadiness(actuals({ recovery: 80, sleepHours: 7.5 }))).toBe('charged');
  });

  it('downgrades green recovery to steady on short sleep', () => {
    expect(assessBodyReadiness(actuals({ recovery: 80, sleepHours: 5 }))).toBe('steady');
  });

  it('is steady in the yellow recovery band', () => {
    expect(assessBodyReadiness(actuals({ recovery: 50 }))).toBe('steady');
  });

  it('is drained in the red recovery band', () => {
    expect(assessBodyReadiness(actuals({ recovery: 20 }))).toBe('drained');
  });

  it('is null for activity-only providers with no recovery data', () => {
    expect(assessBodyReadiness(stravaActuals())).toBeNull();
  });

  it('stays charged on green recovery when sleep is unknown', () => {
    expect(assessBodyReadiness(actuals({ recovery: 80, sleepHours: undefined }))).toBe('charged');
  });
});

describe('computeUnlock – counting down', () => {
  const now = new Date('2026-06-11T14:00:00Z');
  const dayShape: DayShape = {
    firstEventStartISO: '2026-06-11T09:00:00Z',
    lastEventEndISO: '2026-06-11T16:30:00Z',
    events: [
      { startISO: '2026-06-11T09:00:00Z', endISO: '2026-06-11T10:00:00Z' }, // past
      { startISO: '2026-06-11T13:30:00Z', endISO: '2026-06-11T14:30:00Z' }, // in progress
      { startISO: '2026-06-11T15:30:00Z', endISO: '2026-06-11T16:30:00Z' }, // upcoming
    ],
  };

  it('stays locked while events remain and counts them', () => {
    const state = computeUnlock(now, dayShape, actuals());
    expect(state.unlocked).toBe(false);
    expect(state.meetingsRemaining).toBe(2);
    expect(state.unlockISO).toBe('2026-06-11T16:30:00.000Z');
    expect(state.minutesUntilClear).toBe(150);
    expect(state.headline).toMatch(/^Clear at /);
  });

  it('warns when body is already drained mid-day', () => {
    const state = computeUnlock(now, dayShape, actuals({ recovery: 25 }));
    expect(state.readiness).toBe('drained');
    expect(state.detail).toContain('25%');
  });

  it('works without a wearable connected', () => {
    const state = computeUnlock(now, dayShape, null);
    expect(state.unlocked).toBe(false);
    expect(state.readiness).toBeNull();
  });

  it('counts down with null readiness for activity-only providers', () => {
    const state = computeUnlock(now, dayShape, stravaActuals());
    expect(state.unlocked).toBe(false);
    expect(state.readiness).toBeNull();
    expect(state.detail).toContain('training window');
  });
});

describe('computeUnlock – unlocked', () => {
  const evening = new Date('2026-06-11T18:00:00Z');
  const dayShape: DayShape = {
    firstEventStartISO: '2026-06-11T09:00:00Z',
    lastEventEndISO: '2026-06-11T16:30:00Z',
    events: [{ startISO: '2026-06-11T15:30:00Z', endISO: '2026-06-11T16:30:00Z' }],
  };

  it('unlocks once the last event has ended', () => {
    const state = computeUnlock(evening, dayShape, actuals({ recovery: 85 }));
    expect(state.unlocked).toBe(true);
    expect(state.meetingsRemaining).toBe(0);
    expect(state.readiness).toBe('charged');
    expect(state.headline).toContain('train hard');
  });

  it('unlocks with a recovery-day message when drained', () => {
    const state = computeUnlock(evening, dayShape, actuals({ recovery: 20 }));
    expect(state.unlocked).toBe(true);
    expect(state.headline).toContain('recovery day');
  });

  it('unlocks with a steady message in the middle band', () => {
    const state = computeUnlock(evening, dayShape, actuals({ recovery: 50 }));
    expect(state.unlocked).toBe(true);
    expect(state.headline).toContain('keep it easy');
  });

  it('treats an empty calendar as unlocked', () => {
    const state = computeUnlock(
      evening,
      { firstEventStartISO: null, lastEventEndISO: null, events: [] },
      null
    );
    expect(state.unlocked).toBe(true);
    expect(state.detail).toContain('Connect a wearable');
  });

  it('handles a missing dayShape as unlocked', () => {
    const state = computeUnlock(evening, null, actuals());
    expect(state.unlocked).toBe(true);
  });

  it('closes the loop when an activity is already logged today (Strava)', () => {
    const state = computeUnlock(
      evening,
      dayShape,
      stravaActuals({
        lastActivity: {
          type: 'TrailRun',
          startISO: '2026-06-11T17:05:00Z',
          durationMin: 48,
          distanceKm: 7.2,
        },
      })
    );
    expect(state.unlocked).toBe(true);
    expect(state.readiness).toBeNull();
    expect(state.headline).toContain('already logged');
    expect(state.detail).toContain('TrailRun');
  });

  it('nudges toward logging when nothing is logged today (Strava)', () => {
    const state = computeUnlock(evening, dayShape, stravaActuals());
    expect(state.unlocked).toBe(true);
    expect(state.headline).toContain('go train');
    expect(state.detail).toContain('TrailRun');
  });
});

describe('forecastVsActual', () => {
  const heavy: ForecastScores = { focus: 40, strain: 75, balance: 40 };
  const light: ForecastScores = { focus: 80, strain: 20, balance: 80 };

  it('flags the mismatch when the calendar is heavy and the body is drained', () => {
    expect(forecastVsActual(heavy, actuals({ recovery: 20 }))).toContain('disagree');
  });

  it('celebrates a charged body on a light day', () => {
    expect(forecastVsActual(light, actuals({ recovery: 90 }))).toContain('big session');
  });

  it('falls back to a steady read otherwise', () => {
    const msg = forecastVsActual({ focus: 55, strain: 50, balance: 55 }, actuals({ recovery: 55 }));
    expect(msg).toContain('55%');
  });

  it('compares logged activities against the forecast for activity providers', () => {
    expect(forecastVsActual(heavy, stravaActuals({ weekActivityCount: 3 }))).toContain(
      '3 sessions'
    );
  });

  it('calls out an empty week for activity providers', () => {
    expect(forecastVsActual(light, stravaActuals({ weekActivityCount: 0 }))).toContain(
      'Nothing logged'
    );
  });

  it('returns null when the provider has nothing to compare', () => {
    expect(
      forecastVsActual(
        light,
        stravaActuals({ weekActivityCount: undefined, lastActivity: undefined })
      )
    ).toBeNull();
  });
});
