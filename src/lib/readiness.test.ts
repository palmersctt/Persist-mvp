import { describe, it, expect } from 'vitest';
import {
  bodyCapacity,
  workdayCost,
  readinessBand,
  readinessContributions,
  spentFraction,
  computeReadiness,
  forecastVsActual,
  MAX_WORKDAY_TAX,
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

const heavyDay: ForecastScores = { focus: 40, strain: 75, balance: 40 };
const lightDay: ForecastScores = { focus: 80, strain: 20, balance: 80 };

const dayShape: DayShape = {
  firstEventStartISO: '2026-06-11T09:00:00Z',
  lastEventEndISO: '2026-06-11T16:30:00Z',
  events: [
    { startISO: '2026-06-11T09:00:00Z', endISO: '2026-06-11T10:00:00Z' },
    { startISO: '2026-06-11T13:30:00Z', endISO: '2026-06-11T14:30:00Z' },
    { startISO: '2026-06-11T15:30:00Z', endISO: '2026-06-11T16:30:00Z' },
  ],
};

const morning = new Date('2026-06-11T07:00:00Z');
const midday = new Date('2026-06-11T14:00:00Z');
const evening = new Date('2026-06-11T18:00:00Z');

describe('bodyCapacity', () => {
  it('uses recovery directly when sleep is adequate', () => {
    expect(bodyCapacity(actuals({ recovery: 80, sleepHours: 7.5 }))).toBe(80);
  });

  it('penalizes short sleep at 8 points per missing hour under 6', () => {
    expect(bodyCapacity(actuals({ recovery: 80, sleepHours: 5 }))).toBe(72);
  });

  it('is null for activity-only providers with no recovery data', () => {
    expect(bodyCapacity(stravaActuals())).toBeNull();
  });

  it('falls back to training-load freshness when there is no recovery (Strava)', () => {
    expect(bodyCapacity(stravaActuals({ freshness: 72 }))).toBe(72);
  });
});

describe('workdayCost', () => {
  it('costs ~nothing on a light day', () => {
    expect(workdayCost(lightDay)).toBe(0);
  });

  it('rises with strain and falls with balance and focus', () => {
    const heavy = workdayCost(heavyDay);
    expect(heavy).toBeGreaterThan(0.5);
    expect(workdayCost({ focus: 40, strain: 75, balance: 80 })).toBeLessThan(heavy);
    expect(workdayCost({ focus: 90, strain: 75, balance: 40 })).toBeLessThan(heavy);
  });

  it('caps at 1 for a maximally brutal day', () => {
    expect(workdayCost({ focus: 0, strain: 100, balance: 0 })).toBe(1);
  });
});

describe('readinessBand', () => {
  it('maps headroom to train hard / keep it easy / recovery day', () => {
    expect(readinessBand(80)).toBe('prime');
    expect(readinessBand(50)).toBe('maintain');
    expect(readinessBand(30)).toBe('recover');
  });
});

describe('spentFraction', () => {
  it('is 0 before the first meeting', () => {
    expect(spentFraction(morning, dayShape)).toBe(0);
  });

  it('grows as meeting minutes elapse, counting in-progress meetings partially', () => {
    // 60min past + 30min of the in-progress meeting = 90 of 180 total minutes
    const frac = spentFraction(midday, dayShape);
    expect(frac).toBeCloseTo(0.5, 5);
  });

  it('is 1 after the last meeting, and 1 on an empty calendar', () => {
    expect(spentFraction(evening, dayShape)).toBe(1);
    expect(
      spentFraction(morning, { firstEventStartISO: null, lastEventEndISO: null, events: [] })
    ).toBe(1);
  });
});

describe('computeReadiness – morning window', () => {
  it('shows full capacity and points a charged athlete at the morning when the day is heavy', () => {
    const state = computeReadiness(
      morning,
      dayShape,
      heavyDay,
      actuals({ recovery: 88, sleepHours: 7.9 })
    );
    expect(state.phase).toBe('morning');
    expect(state.readinessNow).toBe(88);
    expect(state.readinessEndOfDay).toBeLessThan(70);
    expect(state.band).toBe('prime');
    expect(state.headline).toContain('train hard');
    expect(state.detail).toContain('this morning');
  });

  it('says both windows work when the calendar is light', () => {
    const state = computeReadiness(
      morning,
      dayShape,
      lightDay,
      actuals({ recovery: 88, sleepHours: 7.9 })
    );
    expect(state.readinessEndOfDay).toBe(88);
    expect(state.detail).toContain('both windows work');
  });

  it('calls the recovery day before work even starts when the tank is empty', () => {
    const state = computeReadiness(
      morning,
      dayShape,
      lightDay,
      actuals({ recovery: 22, sleepHours: 5.1 })
    );
    expect(state.band).toBe('recover');
    expect(state.headline).toContain('recovery day');
  });
});

describe('computeReadiness – mid-workday', () => {
  it('projects the evening and plans on the projection', () => {
    const state = computeReadiness(
      midday,
      dayShape,
      heavyDay,
      actuals({ recovery: 88, sleepHours: 7.9 })
    );
    expect(state.phase).toBe('workday');
    expect(state.readinessNow!).toBeLessThan(88);
    expect(state.readinessNow!).toBeGreaterThan(state.readinessEndOfDay!);
    expect(state.meetingsRemaining).toBe(2);
    expect(state.detail).toContain('when the calendar clears');
  });

  it('headroom only drops as meetings actually elapse', () => {
    const early = computeReadiness(morning, dayShape, heavyDay, actuals({ recovery: 88 }));
    const mid = computeReadiness(midday, dayShape, heavyDay, actuals({ recovery: 88 }));
    expect(early.readinessNow!).toBeGreaterThan(mid.readinessNow!);
    expect(mid.readinessEndOfDay).toBe(early.readinessEndOfDay);
  });
});

describe('computeReadiness – workday clear', () => {
  it('verdicts train hard when the workday barely taxed a charged body', () => {
    const state = computeReadiness(
      evening,
      dayShape,
      lightDay,
      actuals({ recovery: 88, sleepHours: 7.9 })
    );
    expect(state.phase).toBe('clear');
    expect(state.band).toBe('prime');
    expect(state.headline).toContain('train hard');
  });

  it('downgrades a charged body to easy after a brutal workday', () => {
    const state = computeReadiness(
      evening,
      dayShape,
      heavyDay,
      actuals({ recovery: 88, sleepHours: 7.9 })
    );
    expect(state.band).toBe('maintain');
    expect(state.headline).toContain('keep it easy');
  });

  it('calls the recovery day when body and calendar are both spent', () => {
    const state = computeReadiness(
      evening,
      dayShape,
      heavyDay,
      actuals({ recovery: 30, sleepHours: 5.5 })
    );
    expect(state.band).toBe('recover');
    expect(state.headline).toContain('recovery day');
  });

  it('treats an empty calendar as clear with untaxed capacity', () => {
    const state = computeReadiness(
      evening,
      { firstEventStartISO: null, lastEventEndISO: null, events: [] },
      lightDay,
      actuals({ recovery: 70 })
    );
    expect(state.phase).toBe('clear');
    expect(state.readinessEndOfDay).toBe(70);
  });

  it('never taxes more than MAX_WORKDAY_TAX even on the worst day', () => {
    const state = computeReadiness(
      evening,
      dayShape,
      { focus: 0, strain: 100, balance: 0 },
      actuals({ recovery: 100, sleepHours: 8 })
    );
    expect(state.readinessEndOfDay).toBe(100 - MAX_WORKDAY_TAX);
  });
});

describe('computeReadiness – without recovery data', () => {
  it('has null headroom without a wearable but still phases the day', () => {
    const state = computeReadiness(midday, dayShape, heavyDay, null);
    expect(state.readinessNow).toBeNull();
    expect(state.band).toBeNull();
    expect(state.phase).toBe('workday');
    expect(state.detail).toContain('Connect a wearable');
  });

  it('closes the loop when an activity is already logged today (Strava)', () => {
    const state = computeReadiness(
      evening,
      dayShape,
      lightDay,
      stravaActuals({
        lastActivity: {
          type: 'TrailRun',
          startISO: '2026-06-11T17:05:00Z',
          durationMin: 48,
          distanceKm: 7.2,
        },
      })
    );
    expect(state.phase).toBe('clear');
    expect(state.readinessNow).toBeNull();
    expect(state.headline).toContain('already logged');
    expect(state.detail).toContain('TrailRun');
  });

  it('nudges toward training when nothing is logged today (Strava)', () => {
    const state = computeReadiness(evening, dayShape, lightDay, stravaActuals());
    expect(state.headline).toContain('go train');
    expect(state.detail).toContain('TrailRun');
  });
});

describe('computeReadiness – Strava freshness as capacity', () => {
  it('reads readiness from freshness and verdicts the band, in freshness language', () => {
    const state = computeReadiness(evening, dayShape, lightDay, stravaActuals({ freshness: 80 }));
    expect(state.readinessEndOfDay).toBe(80);
    expect(state.band).toBe('prime');
    expect(state.detail).toContain('freshness 80');
    expect(state.detail).not.toContain('recovery');
  });

  it('downgrades a fresh athlete to easy after a brutal workday', () => {
    const state = computeReadiness(evening, dayShape, heavyDay, stravaActuals({ freshness: 80 }));
    expect(state.band).toBe('maintain');
    expect(state.headline).toContain('keep it easy');
  });
});

describe('forecastVsActual', () => {
  it('flags the mismatch when the calendar is heavy and the body is drained', () => {
    expect(forecastVsActual(heavyDay, actuals({ recovery: 20 }))).toContain('disagree');
  });

  it('celebrates a charged body on a light day', () => {
    expect(forecastVsActual(lightDay, actuals({ recovery: 90 }))).toContain('big session');
  });

  it('falls back to a steady read otherwise', () => {
    const msg = forecastVsActual({ focus: 55, strain: 50, balance: 55 }, actuals({ recovery: 55 }));
    expect(msg).toContain('55%');
  });

  it('compares logged sessions against the forecast for activity providers', () => {
    expect(forecastVsActual(heavyDay, stravaActuals({ weekActivityCount: 3 }))).toContain(
      '3 sessions'
    );
  });

  it('calls out an empty week for activity providers', () => {
    expect(forecastVsActual(lightDay, stravaActuals({ weekActivityCount: 0 }))).toContain(
      'Nothing logged'
    );
  });

  it('returns null when the provider has nothing to compare', () => {
    expect(
      forecastVsActual(
        lightDay,
        stravaActuals({ weekActivityCount: undefined, lastActivity: undefined })
      )
    ).toBeNull();
  });
});

describe('readinessContributions', () => {
  it('attributes capacity from the wearable and tax to the workday metrics', () => {
    const c = readinessContributions(heavyDay, actuals({ recovery: 88, sleepHours: 7.9 }));
    expect(c.capacity).toBe(88);
    expect(c.workdayTax).toBeGreaterThan(0);
    // The per-metric points should sum to roughly the total tax
    const sum = c.workday.reduce((a, w) => a + w.points, 0);
    expect(Math.abs(sum - c.workdayTax)).toBeLessThanOrEqual(2);
  });

  it('ranks the biggest driver first (strain on a heavy day)', () => {
    const c = readinessContributions(heavyDay, actuals());
    expect(c.workday[0].metric).toBe('strain');
    expect(c.workday[0].points).toBeGreaterThanOrEqual(c.workday[1].points);
  });

  it('costs nothing and has null capacity on a light day with no wearable', () => {
    const c = readinessContributions(lightDay, null);
    expect(c.capacity).toBeNull();
    expect(c.workdayTax).toBe(0);
    expect(c.body).toHaveLength(0);
  });

  it('lists recovery and sleep as body factors when present', () => {
    const c = readinessContributions(lightDay, actuals({ recovery: 70, sleepHours: 7 }));
    expect(c.body.map((b) => b.label)).toEqual(expect.arrayContaining(['Recovery', 'Sleep']));
  });

  it('surfaces activity factors for an activity-only provider', () => {
    const c = readinessContributions(lightDay, stravaActuals());
    expect(c.capacity).toBeNull();
    expect(c.body.map((b) => b.label)).toEqual(expect.arrayContaining(['This week', 'Last out']));
  });

  it('uses freshness as capacity and lists it alongside activity factors (Strava)', () => {
    const c = readinessContributions(heavyDay, stravaActuals({ freshness: 80 }));
    expect(c.capacity).toBe(80);
    expect(c.body.map((b) => b.label)).toEqual(
      expect.arrayContaining(['Freshness', 'This week', 'Last out'])
    );
  });
});
