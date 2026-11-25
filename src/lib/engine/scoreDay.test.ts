import { describe, it, expect } from 'vitest';
import { dashboardVerdict } from '../dashboardModel';
import type { WorkHealthMetrics } from '../../hooks/useWorkHealth';
import { scoreDay } from './scoreDay';
import { scoreWork } from './workScores';
import type { DayInput, EngineMeeting } from './types';

const TZ = 'America/New_York';
const DATE = '2026-11-25';
const at = (h: number, m = 0) =>
  `${DATE}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-05:00`;
const meeting = (s: number, e: number, extra: Partial<EngineMeeting> = {}): EngineMeeting => ({
  start: at(s),
  end: at(e),
  ...extra,
});

const heavyDay: EngineMeeting[] = [
  meeting(9, 10, { title: 'Quarterly review', attendees: 12 }),
  meeting(10, 11, { title: 'Client presentation', attendees: 8 }),
  meeting(11, 12, { title: 'Design review', attendees: 6 }),
  meeting(13, 14, { title: 'Interview', attendees: 3 }),
  meeting(14, 15, { title: 'Team meeting', attendees: 9 }),
  meeting(15, 16, { title: 'Board meeting', attendees: 12 }),
  meeting(16, 17, { title: 'All-hands', attendees: 80 }),
];

const day = (patch: Partial<DayInput> = {}): DayInput => ({
  version: 1,
  date: DATE,
  timezone: TZ,
  ...patch,
});

/** The WorkHealthMetrics the dashboard would receive for the same meetings. */
const metricsFor = (meetings: EngineMeeting[]) => {
  const w = scoreWork(meetings, TZ);
  return {
    adaptivePerformanceIndex: w.focus,
    cognitiveResilience: w.strain,
    workRhythmRecovery: w.rhythm,
    schedule: w.schedule,
  } as unknown as WorkHealthMetrics;
};

const strip = <T extends { email?: unknown }>(r: T) => {
  const { email: _email, ...rest } = r;
  return rest;
};

describe('scoreDay', () => {
  it('gives the same verdict as the dashboard path for the same meetings', () => {
    const training = { baseline: 40, loadToday: 0, keySessions: [] };
    const engine = scoreDay(day({ meetings: heavyDay, training, sleep: { performance: 70 } }));
    const dash = dashboardVerdict(
      metricsFor(heavyDay),
      {
        date: DATE,
        provider: 'whoop',
        trainingBaseline: 40,
        trainingLoadToday: 0,
        keySessions: [],
        sleepPerformance: 70,
      },
      null,
      DATE
    );
    expect(strip(engine)).toEqual(dash);
  });

  it('scores busy-only blocks', () => {
    const busy = heavyDay.map(({ start, end }) => ({ start, end }));
    const r = scoreDay(day({ meetings: busy }));
    expect(r.workLoad).toBe(77); // 7h × 11
    expect(r.strain).toBeGreaterThan(50);
    expect(['bad', 'ok', 'good']).toContain(r.tier);
  });

  it('never calls an open day Survival', () => {
    const r = scoreDay(day({ meetings: [] }));
    expect(r.verdict).not.toBe('Survival');
    expect(r.tier).not.toBe('bad');
    expect(r.load).toBe(0);
  });

  it('scores an unknown calendar as an open day, with lower confidence', () => {
    const { confidence: unknown, ...noCalendar } = scoreDay(day());
    const { confidence: open, ...openDay } = scoreDay(day({ meetings: [] }));
    expect(noCalendar).toEqual(openDay);
    expect(unknown.missing).toContain('calendar');
    expect(open.missing).not.toContain('calendar');
  });

  it('carries email through without scoring it', () => {
    const email = { sent: 60, sentAfterHours: 25, received: 300 };
    const withEmail = scoreDay(day({ meetings: heavyDay, email }));
    const without = scoreDay(day({ meetings: heavyDay }));
    expect(withEmail.email).toEqual(email);
    expect(without.email).toBeNull();
    expect(strip(withEmail)).toEqual(strip(without));
  });

  it('is deterministic', () => {
    const input = day({ meetings: heavyDay, training: { baseline: 30, loadToday: 50 } });
    expect(scoreDay(input)).toEqual(scoreDay(structuredClone(input)));
  });

  it('plans the week from weekAhead', () => {
    const weekAhead = [0, 2, 6, 1, 0, 3, 4].map((meetingHours, i) => ({
      date: new Date(Date.UTC(2026, 10, 25 + i)).toISOString().slice(0, 10),
      meetingHours,
    }));
    const r = scoreDay(day({ meetings: [], weekAhead }));
    expect(r.plan?.length).toBe(7);
  });

  describe('confidence', () => {
    const training = { baseline: 40, loadToday: 20 };
    const sleep = { performance: 75 };

    it('is low for busy-only blocks alone', () => {
      const busy = heavyDay.map(({ start, end }) => ({ start, end }));
      expect(scoreDay(day({ meetings: busy })).confidence).toEqual({
        level: 'low',
        missing: ['meetingDetail', 'training', 'sleep', 'history'],
      });
    });

    it('caps a full picture at medium until there is a personal baseline', () => {
      expect(scoreDay(day({ meetings: heavyDay, training, sleep })).confidence).toEqual({
        level: 'medium',
        missing: ['history'],
      });
    });

    it('never changes the verdict, scores or tier', () => {
      const busy = heavyDay.map(({ start, end }) => ({ start, end }));
      const categorized = busy.map((m) => ({ ...m, category: 'COLLABORATIVE' as const }));
      const { confidence: a, ...low } = scoreDay(day({ meetings: busy }));
      const { confidence: b, ...full } = scoreDay(day({ meetings: categorized }));
      expect(a.level).toBe('low');
      expect(b.level).toBe('medium');
      expect(low).toEqual(full);
    });

    it('reads estimated dashboard scores as no calendar', () => {
      const w = metricsFor(heavyDay);
      const estimated = { ...w, breakdown: { source: 'estimated' } } as WorkHealthMetrics;
      expect(dashboardVerdict(estimated, null).confidence.missing).toContain('calendar');
      expect(dashboardVerdict(w, null).confidence.missing).not.toContain('calendar');
    });
  });
});
