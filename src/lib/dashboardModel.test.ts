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
});
