import { describe, it, expect } from 'vitest';
import {
  HEAVY_WORK_LOAD,
  dayName,
  planWeek,
  sessionCall,
  type CallInputs,
  type PastSession,
  type WeekDay,
} from './weekPlan';

/** A week starting Monday 2026-06-08, with the given work loads. */
const week = (loads: number[]): WeekDay[] =>
  loads.map((workLoad, i) => ({
    date: new Date(Date.UTC(2026, 5, 8 + i)).toISOString().slice(0, 10),
    workLoad,
  }));

// Mon..Sun: a normal working week with a light Thursday and a free weekend.
const NORMAL = week([55, 66, 60, 22, 50, 0, 0]);
const roles = (loads: WeekDay[], past: PastSession[] = [], opts = {}) =>
  planWeek(loads, past, opts).map((d) => d.role);

describe('planWeek', () => {
  it('puts the long run on the lightest day and hard sessions on the next lightest', () => {
    // long → Saturday (first free day); hard → Thursday (lightest weekday) and
    // Monday (Sunday and Friday sit next to the long run)
    expect(roles(NORMAL)).toEqual(['hard', 'easy', 'easy', 'hard', 'easy', 'long', 'easy']);
  });

  it('never places key sessions on consecutive days', () => {
    for (const loads of [NORMAL, week([0, 0, 0, 0, 0, 0, 0]), week([10, 20, 30, 40, 50, 60, 70])]) {
      const r = roles(loads);
      for (let i = 1; i < r.length; i++) {
        expect(r[i] !== 'easy' && r[i - 1] !== 'easy').toBe(false);
      }
    }
  });

  it('keeps to two hard and one long in the week', () => {
    const r = roles(week([0, 0, 0, 0, 0, 0, 0]));
    expect(r.filter((x) => x === 'hard')).toHaveLength(2);
    expect(r.filter((x) => x === 'long')).toHaveLength(1);
  });

  it('places no key session on a heavy day', () => {
    const heavy = week([HEAVY_WORK_LOAD, 90, 80, 75, 88, 99, 72]);
    expect(roles(heavy).every((r) => r === 'easy')).toBe(true);
    expect(planWeek(heavy).every((d) => d.heavy)).toBe(true);
  });

  it('keeps today easy the day after a key session', () => {
    const open = week([0, 40, 40, 40, 40, 40, 40]);
    expect(roles(open)[0]).not.toBe('easy');
    expect(roles(open, [{ daysAgo: 1, kind: 'hard' }])[0]).toBe('easy');
    expect(roles(open, [{ daysAgo: 1, kind: 'long' }])[0]).toBe('easy');
  });

  it('counts sessions already done against the rolling week', () => {
    // two hard sessions in the last six days: no third until one ages out
    const past: PastSession[] = [
      { daysAgo: 2, kind: 'hard' },
      { daysAgo: 5, kind: 'hard' },
    ];
    const r = roles(week([0, 0, 0, 0, 0, 0, 0]), past);
    // offsets of every hard session, done and planned
    const hard = [-5, -2, ...r.flatMap((x, i) => (x === 'hard' ? [i] : []))];
    for (let start = -6; start <= 0; start++) {
      const inWindow = hard.filter((d) => d >= start && d < start + 7);
      expect(inWindow.length).toBeLessThanOrEqual(2);
    }
    // nothing hard until the session five days ago leaves the window
    expect(r[0]).not.toBe('hard');
    expect(r[1]).not.toBe('hard');
  });

  it('does not place a second long run within seven days of the last', () => {
    const r = roles(week([0, 0, 0, 0, 0, 0, 0]), [{ daysAgo: 3, kind: 'long' }]);
    expect(r.slice(0, 4)).not.toContain('long');
  });

  it('moves today’s session to a later day when today is blocked', () => {
    const open = week([0, 40, 30, 40, 40, 40, 40]);
    expect(roles(open)[0]).toBe('long');
    const moved = roles(open, [], { blockToday: true });
    expect(moved[0]).toBe('easy');
    expect(moved).toContain('long');
  });

  it('marks a session already done today', () => {
    const p = planWeek(NORMAL, [{ daysAgo: 0, kind: 'hard' }]);
    expect(p[0]).toMatchObject({ role: 'hard', done: true });
    expect(p[1].role).toBe('easy');
  });
});

describe('sessionCall', () => {
  const base: CallInputs = {
    model: { verdict: 'Flow', readiness: 72, feel: 0.05, acwr: 1.0 },
    workLoad: 22,
    trainingSpike: false,
    week: null,
    past: null,
  };
  const call = (over: Partial<CallInputs>) => sessionCall({ ...base, ...over });
  // today (Thursday) is the lightest weekday; the weekend is free
  const THU = week([22, 50, 0, 0, 55, 66, 60]);

  it('calls a hard day when one is due and today is the best day for it', () => {
    const c = call({ week: THU, past: [{ daysAgo: 4, kind: 'long' }] });
    expect(c).toMatchObject({ verdict: 'Locked In', label: 'Go hard' });
  });

  it('calls a long day separately from a hard one', () => {
    const c = call({ week: week([0, 40, 30, 40, 40, 40, 40]), past: [], workLoad: 0 });
    expect(c).toMatchObject({ verdict: 'Locked In', label: 'Go long' });
  });

  it('does not claim a session is due without training history', () => {
    const c = call({ week: THU, past: null });
    expect(c.verdict).toBe('Flow');
    expect(c.rec).toContain('today is the day for it');
  });

  it('keeps the day easy after yesterday’s key session, even on an open calendar', () => {
    const c = call({ week: THU, past: [{ daysAgo: 1, kind: 'hard' }] });
    expect(c.verdict).toBe('Flow');
    expect(c.label).toBe('Train normally');
  });

  it('a heavy work day costs intensity, not volume', () => {
    const c = call({
      model: { verdict: 'Survival', readiness: 38, feel: -0.05, acwr: 1.4 },
      workLoad: 88,
      week: week([88, 30, 40, 40, 40, 0, 0]),
      past: [],
    });
    expect(c).toMatchObject({ verdict: 'Grinding', label: 'Easy only' });
    expect(c.plan?.[0].role).toBe('easy');
    expect(c.why).toMatch(/Save the (hard session|long run) for/);
  });

  it('short sleep or low recovery alone gates intensity', () => {
    expect(call({ sleep: 44 }).verdict).toBe('Grinding');
    expect(call({ recovery: 28 }).verdict).toBe('Grinding');
    expect(call({ sleep: 80, recovery: 70 }).verdict).toBe('Flow');
  });

  it('recovers only on evidence', () => {
    expect(call({ trainingSpike: true }).verdict).toBe('Survival');
    expect(call({ model: { ...base.model, feel: -0.45 } }).verdict).toBe('Survival');
    expect(call({ sleep: 30 }).verdict).toBe('Survival');
    expect(call({ sleep: 45, recovery: 20 }).verdict).toBe('Survival');
  });

  it('never recovers on an open day with no data', () => {
    const c = call({
      model: { verdict: 'Flow', readiness: 68, feel: 0, acwr: 0.35 },
      workLoad: 0,
      week: week([0, 0, 0, 0, 0, 0, 0]),
    });
    expect(c.verdict).not.toBe('Survival');
    expect(c.verdict).not.toBe('Grinding');
  });

  it('says a done session is done', () => {
    const c = call({ week: THU, past: [{ daysAgo: 0, kind: 'hard' }] });
    expect(c).toMatchObject({ verdict: 'Coasting', label: 'Optional' });
  });

  it('falls back to optional when nothing pushes either way', () => {
    expect(call({ model: { verdict: 'Coasting', readiness: 55, feel: 0, acwr: 1 } }).verdict).toBe(
      'Coasting'
    );
  });
});

describe('dayName', () => {
  it('names tomorrow and later weekdays', () => {
    expect(dayName(NORMAL, 1)).toBe('tomorrow');
    expect(dayName(NORMAL, 3)).toBe('Thursday');
  });
});
