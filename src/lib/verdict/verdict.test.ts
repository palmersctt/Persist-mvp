import { describe, it, expect } from 'vitest';
import { localIso, nextDates } from './localTime';
import { EXAMPLE_DAYS } from './examples';
import { cardQuotes } from './quotes';
import { receipt, revealLines } from './story';
import { parseDayInput } from '../engine/parse';
import { scoreDay } from '../engine/scoreDay';
import { scoreWork } from '../engine/workScores';

const DATE = '2026-11-25';
const TZ = 'America/New_York';

describe('localIso', () => {
  it('adds the zone offset', () => {
    expect(localIso(DATE, 9.5, TZ)).toBe('2026-11-25T09:30:00-05:00');
    expect(localIso('2026-07-01', 9, TZ)).toBe('2026-07-01T09:00:00-04:00');
    expect(localIso(DATE, 14, 'Asia/Kolkata')).toBe('2026-11-25T14:00:00+05:30');
    expect(localIso(DATE, 8, 'UTC')).toBe('2026-11-25T08:00:00+00:00');
  });
  it('lists dates', () => {
    expect(nextDates('2026-11-29', 3)).toEqual(['2026-11-29', '2026-11-30', '2026-12-01']);
  });
});

const run = (id: string) => {
  const input = EXAMPLE_DAYS.find((e) => e.id === id)!.build(DATE, TZ);
  return { input, result: scoreDay(input), work: scoreWork(input.meetings ?? [], TZ) };
};

describe('example days', () => {
  it('are all valid input', () => {
    for (const e of EXAMPLE_DAYS) expect(parseDayInput(e.build(DATE, TZ)).ok).toBe(true);
  });
  it('tell four different stories', () => {
    expect(run('back-to-backs').result.tier).not.toBe('good');
    expect(run('busy-only').result.confidence.level).toBe('low');
    expect(run('open-long-run').result.tier).toBe('good');
    expect(run('short-sleep').result.verdict).toBe('Survival');
  });
});

describe('story', () => {
  it('reads the day back in three lines', () => {
    const { input, result, work } = run('back-to-backs');
    const lines = revealLines(input, work, result);
    expect(lines[0]).toBe('8 meetings, 8 hours · 7 back-to-back');
    expect(lines[1]).toMatch(/^Focus \d+ · Strain \d+ · Rhythm \d+$/);
    expect(lines[2]).toMatch(/^Load \d\.\d\d× your baseline$/);
  });
  it('says what went in and what did not', () => {
    expect(receipt(run('busy-only').input)).toEqual({
      used: ['5 meeting times'],
      notUsed: ['meeting titles', 'names', 'message content'],
    });
    expect(receipt(run('open-long-run').input).used).toEqual([
      'an empty calendar',
      'training load',
      'sleep',
    ]);
  });
  it('makes card quotes', () => {
    const q = cardQuotes(run('back-to-backs').work, 3);
    expect(q).toHaveLength(3);
    expect(q[0].quote.length).toBeGreaterThan(5);
  });
});
