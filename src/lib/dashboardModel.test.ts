import { describe, it, expect } from 'vitest';
import { dashboardVerdict } from './dashboardModel';
import type { WorkHealthMetrics } from '../hooks/useWorkHealth';
import type { WearableActuals } from './wearables/types';

const work = (
  focus: number,
  strain: number,
  balance: number,
  durationHours: number
): WorkHealthMetrics =>
  ({
    adaptivePerformanceIndex: focus,
    cognitiveResilience: strain,
    workRhythmRecovery: balance,
    schedule: { durationHours },
  }) as unknown as WorkHealthMetrics;

const strava = (trainingBaseline: number, trainingLoadToday: number): WearableActuals => ({
  date: '2026-06-11',
  provider: 'strava',
  trainingBaseline,
  trainingLoadToday,
});

describe('dashboardVerdict', () => {
  it('Strava athlete, light good day → Flow', () => {
    const r = dashboardVerdict(work(80, 25, 78, 3), strava(45, 50));
    expect(r.verdict).toBe('Flow');
    expect(r.tier).toBe('good');
    expect(r.workIndexValue).toBeGreaterThan(50);
  });

  it('Strava off the couch, hard session today → Survival', () => {
    const r = dashboardVerdict(work(50, 55, 50, 4), strava(8, 64));
    expect(r.verdict).toBe('Survival');
    expect(r.tier).toBe('bad');
    expect(r.acwr).toBeGreaterThan(1.3);
  });

  it('heavy, fragmented work day → recover, driven by work alone (no Strava)', () => {
    const r = dashboardVerdict(work(30, 85, 35, 8), null);
    expect(r.tier).toBe('bad');
    expect(r.verdict).not.toBe('Locked In'); // no phantom training gap
  });

  it('calendar-only never invents a training gap', () => {
    // a quiet day with no activity provider should not read as "go train"
    const r = dashboardVerdict(work(70, 35, 70, 2), null);
    expect(r.verdict).not.toBe('Locked In');
    expect(r.trainingAcwr).toBeCloseTo(1.0, 1);
  });

  it('exposes the derived work load and work index', () => {
    const r = dashboardVerdict(work(60, 50, 60, 4), null);
    expect(r.workLoad).toBe(44); // 4h × 11
    expect(r.workIndexValue).toBe(56); // 0.3·60 + 0.3·60 + 0.4·50
  });

  describe('the session call', () => {
    // today first: a light Thursday, then Friday, a free weekend, and a busy start to next week
    const weekAhead = [2, 4.5, 0, 0, 5, 6, 5.5].map((meetingHours, i) => ({
      date: new Date(Date.UTC(2026, 5, 11 + i)).toISOString().slice(0, 10),
      meetingHours,
    }));
    const athlete = (keySessions: WearableActuals['keySessions']): WearableActuals => ({
      date: '2026-06-11',
      provider: 'whoop',
      trainingBaseline: 40,
      trainingLoadToday: 0,
      keySessions,
    });
    const lightDay = work(70, 35, 70, 2);
    const TODAY = '2026-06-11';

    it('a heavy work day says easy only, not recover', () => {
      const r = dashboardVerdict(work(50, 50, 50, 8), null);
      expect(r.verdict).toBe('Grinding');
      expect(r.label).toBe('Easy only');
      expect(r.tier).toBe('ok');
    });

    it('goes hard on the lightest day when a hard session is due', () => {
      const r = dashboardVerdict(
        lightDay,
        athlete([{ daysAgo: 4, kind: 'long' }]),
        weekAhead,
        TODAY
      );
      expect(r.verdict).toBe('Locked In');
      expect(r.label).toBe('Go hard');
      expect(r.plan?.[0].role).toBe('hard');
    });

    it('stays easy the day after a hard session', () => {
      const r = dashboardVerdict(
        lightDay,
        athlete([{ daysAgo: 1, kind: 'hard' }]),
        weekAhead,
        TODAY
      );
      expect(r.verdict).toBe('Flow');
      expect(r.plan?.[0].role).toBe('easy');
    });

    it('plans the week from the calendar alone, without claiming a session is due', () => {
      const r = dashboardVerdict(lightDay, null, weekAhead, TODAY);
      expect(r.verdict).not.toBe('Locked In');
      expect(r.knowsTraining).toBe(false);
      expect(r.plan).toHaveLength(7);
      expect(r.plan?.filter((d) => d.role === 'long')).toHaveLength(1);
    });

    it('uses today’s analysed load for the first day of the plan', () => {
      const r = dashboardVerdict(work(50, 50, 50, 3), null, weekAhead, TODAY);
      expect(r.plan?.[0].workLoad).toBe(r.workLoad);
    });

    it('an ordinary run for a three-day-a-week runner is not a spike', () => {
      // daily baseline 19 ≈ three 45-minute runs a week
      const r = dashboardVerdict(work(70, 35, 70, 2), {
        ...athlete([]),
        trainingBaseline: 19,
        trainingLoadToday: 45,
      });
      expect(r.verdict).not.toBe('Survival');
    });

    it('doing the long run the card asked for reads as done, not recover', () => {
      const r = dashboardVerdict(
        lightDay,
        {
          ...athlete([{ daysAgo: 0, kind: 'long' }]),
          trainingBaseline: 49,
          trainingLoadToday: 140,
        },
        weekAhead,
        TODAY
      );
      expect(r.verdict).toBe('Coasting');
      expect(r.rec).toContain('Key session done');
      expect(r.plan?.[0]).toMatchObject({ role: 'long', done: true });
    });

    it('does not ask for a key session on a day already trained on', () => {
      const r = dashboardVerdict(
        lightDay,
        { ...athlete([]), trainingLoadToday: 50 },
        weekAhead,
        TODAY
      );
      expect(r.verdict).not.toBe('Locked In');
      expect(r.plan?.[0].role).toBe('easy');
    });

    it('drops a cached forecast that starts on an earlier day', () => {
      const aligned = dashboardVerdict(lightDay, null, weekAhead, '2026-06-12');
      expect(aligned.plan?.[0].date).toBe('2026-06-12');
      expect(aligned.plan).toHaveLength(6);
      expect(dashboardVerdict(lightDay, null, weekAhead, '2026-07-01').plan).toBeNull();
    });

    it('has no plan without a forecast', () => {
      expect(dashboardVerdict(lightDay, null).plan).toBeNull();
    });
  });

  describe('an open calendar', () => {
    // No meetings: neutral work-health scores, zero meeting hours.
    const open = work(50, 50, 50, 0);

    it('never reads as recover', () => {
      const r = dashboardVerdict(open, null);
      expect(r.verdict).not.toBe('Survival');
      expect(r.tier).not.toBe('bad');
      expect(r.readiness).toBeGreaterThanOrEqual(60);
      expect(r.load).toBe(0);
    });

    it('a lighter day never scores below a heavier one, all else equal', () => {
      const readiness = [0, 2, 4, 6].map(
        (h) => dashboardVerdict(work(50, 50, 50, h), null).readiness
      );
      for (let i = 1; i < readiness.length; i++) {
        expect(readiness[i]).toBeLessThanOrEqual(readiness[i - 1]);
      }
    });
  });

  describe('sleep from a recovery provider', () => {
    const whoop = (sleepPerformance?: number): WearableActuals => ({
      date: '2026-06-11',
      provider: 'whoop',
      sleepPerformance,
    });
    const day = work(60, 50, 60, 4);

    it('absent sleep reads the same as no provider', () => {
      expect(dashboardVerdict(day, whoop()).readiness).toBe(dashboardVerdict(day, null).readiness);
    });

    it('good sleep raises Readiness, poor sleep lowers it', () => {
      const neutral = dashboardVerdict(day, null).readiness;
      expect(dashboardVerdict(day, whoop(90)).readiness).toBeGreaterThan(neutral);
      expect(dashboardVerdict(day, whoop(40)).readiness).toBeLessThan(neutral);
    });

    it('clamps an out-of-range sleep value', () => {
      expect(dashboardVerdict(day, whoop(140)).readiness).toBe(
        dashboardVerdict(day, whoop(100)).readiness
      );
    });

    it('sleep alone never invents a training gap', () => {
      expect(dashboardVerdict(day, whoop(90)).trainingAcwr).toBeCloseTo(1.0, 1);
    });
  });
});
