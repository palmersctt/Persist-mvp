import { describe, it, expect } from 'vitest';
import { dayBefore, historyFrom, parseDayRow, parseFeel, type DayRow } from './history';

const row = (date: string, workLoad = 40): DayRow => ({
  date,
  workLoad,
  workIndex: 55,
  trainingLoad: 30,
  trainingFeel: 0,
  sleep: 62,
});
const TODAY = '2026-11-25';
const daysAgo = (n: number) =>
  new Date(Date.parse(`${TODAY}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);

describe('historyFrom', () => {
  it('keeps days before today, oldest first, without dates', () => {
    const p = historyFrom([row(daysAgo(1), 10), row(daysAgo(3), 30), row(daysAgo(2), 20)], TODAY);
    expect(p.history.map((d) => d.workLoad)).toEqual([30, 20, 10]);
    expect(p.history[0]).not.toHaveProperty('date');
  });

  it('excludes today and the future', () => {
    expect(historyFrom([row(TODAY), row('2026-11-26')], TODAY).history).toEqual([]);
  });

  it('drops days outside the 42-day window', () => {
    const p = historyFrom([row(daysAgo(42)), row(daysAgo(43))], TODAY);
    expect(p.history).toHaveLength(1);
  });

  it('keeps one row per date, the last one given', () => {
    const p = historyFrom([row(daysAgo(1), 10), row(daysAgo(1), 99)], TODAY);
    expect(p.history.map((d) => d.workLoad)).toEqual([99]);
  });

  it('counts only the last 21 days toward a personal baseline', () => {
    const rows = Array.from({ length: 30 }, (_, i) => row(daysAgo(i + 1)));
    const p = historyFrom(rows, TODAY);
    expect(p.history).toHaveLength(30);
    expect(p.historyDays).toBe(21);
  });

  it('skips gaps instead of filling them', () => {
    const p = historyFrom([row(daysAgo(10)), row(daysAgo(1))], TODAY);
    expect(p.history).toHaveLength(2);
    expect(p.historyDays).toBe(2);
  });
});

describe('parseDayRow', () => {
  it('accepts a valid row for today', () => {
    expect(parseDayRow(row(TODAY), TODAY)).toEqual({ ok: true, row: row(TODAY) });
  });

  it('rejects any other date', () => {
    const r = parseDayRow(row(daysAgo(1)), TODAY);
    expect(r.ok).toBe(false);
  });

  it.each([
    ['workLoad', -1],
    ['workLoad', 121],
    ['workIndex', 101],
    ['trainingLoad', -5],
    ['trainingFeel', 1.5],
    ['sleep', 'good'],
  ])('rejects %s = %s', (field, value) => {
    expect(parseDayRow({ ...row(TODAY), [field]: value }, TODAY).ok).toBe(false);
  });

  it('drops unknown fields', () => {
    const r = parseDayRow({ ...row(TODAY), userEmail: 'x@y.com' }, TODAY);
    expect(r.ok && r.row).not.toHaveProperty('userEmail');
  });
});

describe('parseDayRow verdict fields', () => {
  it('accepts a known verdict and readiness', () => {
    const r = parseDayRow({ ...row(TODAY), verdict: 'Flow', readiness: 71.6 }, TODAY);
    expect(r.ok && r.row).toMatchObject({ verdict: 'Flow', readiness: 72 });
  });
  it('rejects an unknown verdict', () => {
    expect(parseDayRow({ ...row(TODAY), verdict: 'Victory' }, TODAY).ok).toBe(false);
  });
});

describe('parseFeel', () => {
  it('accepts today and yesterday, 1–5', () => {
    expect(parseFeel({ date: TODAY, rating: 5 }, TODAY)).toEqual({
      ok: true,
      date: TODAY,
      rating: 5,
    });
    expect(parseFeel({ date: dayBefore(TODAY), rating: 1 }, TODAY).ok).toBe(true);
  });
  it.each([
    [{ date: daysAgo(2), rating: 3 }],
    [{ date: TODAY, rating: 0 }],
    [{ date: TODAY, rating: 6 }],
    [{ date: TODAY, rating: 3.5 }],
    [{ date: TODAY }],
  ])('rejects %j', (body) => {
    expect(parseFeel(body, TODAY).ok).toBe(false);
  });
  it('knows the day before across a month boundary', () => {
    expect(dayBefore('2026-12-01')).toBe('2026-11-30');
  });
});
