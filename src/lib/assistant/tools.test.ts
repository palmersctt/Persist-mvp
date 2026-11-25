import { describe, it, expect } from 'vitest';
import { memoryStore } from './store';
import { getTrend, getVerdict, logDay, rateDay } from './tools';

const TZ = 'America/New_York';
const NOW = new Date('2026-11-25T20:00:00Z'); // 3pm in New York
const ME = 'me@example.com';
const at = (date: string, h: number) => `${date}T${String(h).padStart(2, '0')}:00:00-05:00`;
const day = (date: string, hours: number[] = [9, 10, 11, 13, 14, 15]) => ({
  version: 1,
  date,
  timezone: TZ,
  meetings: hours.map((h) => ({
    start: at(date, h),
    end: at(date, h + 1),
    attendees: 6,
    title: 'Secret project review',
    category: 'COLLABORATIVE',
  })),
});

describe('assistant tools', () => {
  it('logs a day and returns the verdict', async () => {
    const store = memoryStore();
    const r = await logDay(store, ME, day('2026-11-25'), NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(['Survival', 'Grinding', 'Coasting', 'Locked In', 'Flow']).toContain(r.value.verdict);
    expect(r.value.drivers.workLoad).toBe(66);
    expect(r.value.confidence.sentence).toMatch(/confidence/);
    expect(store.rows.get(`${ME}|2026-11-25`)?.source).toBe('assistant');
  });

  it('stores numbers only — never titles', async () => {
    const store = memoryStore();
    await logDay(store, ME, day('2026-11-25'), NOW);
    expect(JSON.stringify([...store.rows.values()])).not.toContain('Secret');
  });

  it('scores against the days already logged', async () => {
    const store = memoryStore();
    const first = await logDay(store, ME, day('2026-11-24'), NOW);
    const second = await logDay(store, ME, day('2026-11-25'), NOW);
    expect(first.ok && first.value.baselineDays).toBe(0);
    expect(second.ok && second.value.baselineDays).toBe(1);
  });

  it('keeps users apart', async () => {
    const store = memoryStore();
    await logDay(store, 'other@example.com', day('2026-11-25'), NOW);
    expect((await getVerdict(store, ME, { date: '2026-11-25' }, NOW)).ok).toBe(false);
  });

  it('rejects bad input and other dates', async () => {
    const store = memoryStore();
    const bad = await logDay(store, ME, { version: 1, date: 'x', timezone: TZ }, NOW);
    expect(bad.ok === false && bad.error).toMatch(/Invalid day/);
    const old = await logDay(store, ME, day('2026-11-20'), NOW);
    expect(old.ok === false && old.error).toMatch(/today/);
    expect(store.rows.size).toBe(0);
  });

  it('gets a logged verdict, trends and ratings', async () => {
    const store = memoryStore();
    await logDay(store, ME, day('2026-11-24'), NOW);
    await logDay(store, ME, day('2026-11-25', []), NOW);
    const v = await getVerdict(store, ME, { timezone: TZ }, NOW);
    expect(v.ok && v.value.date).toBe('2026-11-25');

    const rated = await rateDay(store, ME, { rating: 2, date: '2026-11-24', timezone: TZ }, NOW);
    expect(rated).toEqual({ ok: true, value: { date: '2026-11-24', feel: 'Heavy' } });

    const t = await getTrend(store, ME, { days: 7, timezone: TZ }, NOW);
    expect(t.ok && t.value.days.map((d) => [d.date, d.feel])).toEqual([
      ['2026-11-24', 'Heavy'],
      ['2026-11-25', null],
    ]);
  });

  it('will not rate a day that was never logged, or a bad rating', async () => {
    const store = memoryStore();
    expect((await rateDay(store, ME, { rating: 3, timezone: TZ }, NOW)).ok).toBe(false);
    await logDay(store, ME, day('2026-11-25'), NOW);
    expect((await rateDay(store, ME, { rating: 9, timezone: TZ }, NOW)).ok).toBe(false);
  });
});
