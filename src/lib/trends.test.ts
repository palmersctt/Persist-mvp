import { describe, it, expect } from 'vitest';
import { buildTrendsFromHistory, MIN_WEEKLY_DAYS, type DailyScore } from './trends';

const day = (
  date: string,
  performance: number,
  resilience: number,
  sustainability: number
): DailyScore => ({
  date,
  performance,
  resilience,
  sustainability,
});

describe('buildTrendsFromHistory', () => {
  it('returns no weekly trend below the minimum tracked days', () => {
    const trends = buildTrendsFromHistory([day('2026-06-10', 50, 40, 60)], '2026-06-10');
    expect(trends.daysTracked).toBe(1);
    expect(trends.weekly).toBeNull();
  });

  it('builds a weekly trend with display-name mapping and today marker', () => {
    const history = [
      day('2026-06-08', 52, 44, 58), // Mon
      day('2026-06-09', 14, 88, 31), // Tue
      day('2026-06-10', 38, 71, 46), // Wed
    ];
    const trends = buildTrendsFromHistory(history, '2026-06-10');

    expect(trends.daysTracked).toBe(MIN_WEEKLY_DAYS);
    expect(trends.weekly).not.toBeNull();
    const weekly = trends.weekly!;
    expect(weekly.days.map((d) => d.date)).toEqual(['Mon', 'Tue', 'Wed']);
    expect(weekly.days[2].isToday).toBe(true);
    // Internal names map to display metrics: performance→focus, resilience→strain, sustainability→balance
    expect(weekly.days[1]).toMatchObject({ focus: 14, strain: 88, balance: 31 });
    expect(weekly.bestDay).toBe('Mon');
    expect(weekly.worstDay).toBe('Tue');
    expect(weekly.insights.length).toBeGreaterThan(0);
  });

  it('uses date labels when the recorded days span more than a week', () => {
    const history = [
      day('2026-06-01', 50, 40, 60),
      day('2026-06-05', 60, 35, 65),
      day('2026-06-10', 55, 45, 58),
    ];
    const trends = buildTrendsFromHistory(history, '2026-06-10');
    expect(trends.weekly!.days.map((d) => d.date)).toEqual(['6/1', '6/5', '6/10']);
  });

  it('dedupes entries on the same date, keeping the latest', () => {
    const history = [
      day('2026-06-08', 10, 10, 10),
      day('2026-06-08', 52, 44, 58),
      day('2026-06-09', 14, 88, 31),
      day('2026-06-10', 38, 71, 46),
    ];
    const trends = buildTrendsFromHistory(history, '2026-06-10');
    expect(trends.daysTracked).toBe(3);
    expect(trends.weekly!.days[0].focus).toBe(52);
  });

  it('returns no monthly trend with a single tracked week', () => {
    const history = [
      day('2026-06-08', 50, 40, 60),
      day('2026-06-09', 55, 42, 62),
      day('2026-06-10', 52, 41, 61),
    ];
    expect(buildTrendsFromHistory(history, '2026-06-10').monthly).toBeNull();
  });

  it('groups monthly weeks by Monday start and detects an improving trend', () => {
    const history = [
      // Week of Jun 1
      day('2026-06-01', 30, 70, 35),
      day('2026-06-02', 34, 66, 39),
      // Week of Jun 8
      day('2026-06-08', 62, 38, 66),
      day('2026-06-09', 66, 34, 70),
    ];
    const trends = buildTrendsFromHistory(history, '2026-06-09');
    expect(trends.monthly).not.toBeNull();
    const monthly = trends.monthly!;
    expect(monthly.weeks).toHaveLength(2);
    expect(monthly.weeks[0]).toMatchObject({ label: 'Jun 1', focus: 32, strain: 68, balance: 37 });
    expect(monthly.weeks[1]).toMatchObject({ label: 'Jun 8', focus: 64, strain: 36, balance: 68 });
    expect(monthly.trend).toBe('improving');
    expect(monthly.insights.length).toBeGreaterThan(0);
  });

  it('detects a declining monthly trend', () => {
    const history = [day('2026-06-01', 70, 30, 72), day('2026-06-08', 35, 65, 38)];
    expect(buildTrendsFromHistory(history, '2026-06-08').monthly!.trend).toBe('declining');
  });

  it('keeps at most the last four weeks in the monthly view', () => {
    const history = [
      day('2026-05-04', 50, 40, 60),
      day('2026-05-11', 50, 40, 60),
      day('2026-05-18', 50, 40, 60),
      day('2026-05-25', 50, 40, 60),
      day('2026-06-01', 50, 40, 60),
    ];
    const monthly = buildTrendsFromHistory(history, '2026-06-01').monthly!;
    expect(monthly.weeks).toHaveLength(4);
    expect(monthly.weeks[0].label).toBe('May 11');
    expect(monthly.trend).toBe('stable');
  });
});
