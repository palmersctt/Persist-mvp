import { describe, it, expect } from 'vitest';
import {
  bodyCapacity,
  workdayCost,
  headroomBand,
  spentFraction,
  computeHeadroom,
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

describe('headroomBand', () => {
  it('maps headroom to train hard / keep it easy / recovery day', () => {
    expect(headroomBand(80)).toBe('prime');
    expect(headroomBand(50)).toBe('maintain');
    expect(headroomBand(30)).toBe('recover');
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

describe('computeHeadroom – morning window', () => {
  it('shows full capacity and points a charged athlete at the morning when the day is heavy', () => {
    const state = computeHeadroom(
      morning,
      dayShape,
      heavyDay,
      actuals({ recovery: 88, sleepHours: 7.9 })
    );
    expect(state.phase).toBe('morning');
    expect(state.headroomNow).toBe(88);
    expect(state.headroomEndOfDay).toBeLessThan(70);
    expect(state.band).toBe('prime');
    expect(state.headline).toContain('train hard');
    expect(state.detail).toContain('this morning');
  });

  it('says both windows work when the calendar is light', () => {
    const state = computeHeadroom(
      morning,
      dayShape,
      lightDay,
      actuals({ recovery: 88, sleepHours: 7.9 })
    );
    expect(state.headroomEndOfDay).toBe(88);
    expect(state.detail).toContain('both windows work');
  });

  it('calls the recovery day before work even starts when the tank is empty', () => {
    const state = computeHeadroom(
      morning,
      dayShape,
      lightDay,
      actuals({ recovery: 22, sleepHours: 5.1 })
    );
    expect(state.band).toBe('recover');
    expect(state.headline).toContain('recovery day');
  });
});

describe('computeHeadroom – mid-workday', () => {
  it('projects the evening and plans on the projection', () => {
    const state = computeHeadroom(
      midday,
      dayShape,
      heavyDay,
      actuals({ recovery: 88, sleepHours: 7.9 })
    );
    expect(state.phase).toBe('workday');
    expect(state.headroomNow!).toBeLessThan(88);
    expect(state.headroomNow!).toBeGreaterThan(state.headroomEndOfDay!);
    expect(state.meetingsRemaining).toBe(2);
    expect(state.detail).toContain('when the calendar clears');
  });

  it('headroom only drops as meetings actually elapse', () => {
    const early = computeHeadroom(morning, dayShape, heavyDay, actuals({ recovery: 88 }));
    const mid = computeHeadroom(midday, dayShape, heavyDay, actuals({ recovery: 88 }));
    expect(early.headroomNow!).toBeGreaterThan(mid.headroomNow!);
    expect(mid.headroomEndOfDay).toBe(early.headroomEndOfDay);
  });
});

describe('computeHeadroom – workday clear', () => {
  it('verdicts train hard when the workday barely taxed a charged body', () => {
    const state = computeHeadroom(
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
    const state = computeHeadroom(
      evening,
      dayShape,
      heavyDay,
      actuals({ recovery: 88, sleepHours: 7.9 })
    );
    expect(state.band).toBe('maintain');
    expect(state.headline).toContain('keep it easy');
  });

  it('calls the recovery day when body and calendar are both spent', () => {
    const state = computeHeadroom(
      evening,
      dayShape,
      heavyDay,
      actuals({ recovery: 30, sleepHours: 5.5 })
    );
    expect(state.band).toBe('recover');
    expect(state.headline).toContain('recovery day');
  });

  it('treats an empty calendar as clear with untaxed capacity', () => {
    const state = computeHeadroom(
      evening,
      { firstEventStartISO: null, lastEventEndISO: null, events: [] },
      lightDay,
      actuals({ recovery: 70 })
    );
    expect(state.phase).toBe('clear');
    expect(state.headroomEndOfDay).toBe(70);
  });

  it('never taxes more than MAX_WORKDAY_TAX even on the worst day', () => {
    const state = computeHeadroom(
      evening,
      dayShape,
      { focus: 0, strain: 100, balance: 0 },
      actuals({ recovery: 100, sleepHours: 8 })
    );
    expect(state.headroomEndOfDay).toBe(100 - MAX_WORKDAY_TAX);
  });
});

describe('computeHeadroom – without recovery data', () => {
  it('has null headroom without a wearable but still phases the day', () => {
    const state = computeHeadroom(midday, dayShape, heavyDay, null);
    expect(state.headroomNow).toBeNull();
    expect(state.band).toBeNull();
    expect(state.phase).toBe('workday');
    expect(state.detail).toContain('Connect a wearable');
  });

  it('closes the loop when an activity is already logged today (Strava)', () => {
    const state = computeHeadroom(
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
    expect(state.headroomNow).toBeNull();
    expect(state.headline).toContain('already logged');
    expect(state.detail).toContain('TrailRun');
  });

  it('nudges toward training when nothing is logged today (Strava)', () => {
    const state = computeHeadroom(evening, dayShape, lightDay, stravaActuals());
    expect(state.headline).toContain('go train');
    expect(state.detail).toContain('TrailRun');
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
