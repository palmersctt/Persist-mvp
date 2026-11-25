import { describe, it, expect } from 'vitest';
import { bodyFromChips, hourLabel, nextMark, sketchToDayInput, withChips } from './sketch';
import { parseDayInput } from '../engine/parse';
import { scoreDay } from '../engine/scoreDay';

const DATE = '2026-11-25';
const TZ = 'America/New_York';

describe('sketch', () => {
  it('cycles free → busy → heavy → free', () => {
    expect(nextMark(undefined)).toBe('busy');
    expect(nextMark('busy')).toBe('heavy');
    expect(nextMark('heavy')).toBeUndefined();
  });

  it('turns tapped hours into hour-long meetings', () => {
    const input = sketchToDayInput({ 9: 'busy', 10: 'heavy', 14: 'busy' }, DATE, TZ);
    expect(parseDayInput(input).ok).toBe(true);
    expect(input.meetings).toEqual([
      {
        start: '2026-11-25T09:00:00-05:00',
        end: '2026-11-25T10:00:00-05:00',
        category: 'COLLABORATIVE',
      },
      {
        start: '2026-11-25T10:00:00-05:00',
        end: '2026-11-25T11:00:00-05:00',
        category: 'HEAVY_MEETINGS',
      },
      {
        start: '2026-11-25T14:00:00-05:00',
        end: '2026-11-25T15:00:00-05:00',
        category: 'COLLABORATIVE',
      },
    ]);
    expect(scoreDay(input).workLoad).toBe(33);
  });

  it('an empty sketch is an open day', () => {
    expect(sketchToDayInput({}, DATE, TZ).meetings).toEqual([]);
  });

  it('labels hours', () => {
    expect([6, 12, 13, 20].map(hourLabel)).toEqual(['6a', '12p', '1p', '8p']);
  });
});

describe('body chips', () => {
  it('map to training and sleep', () => {
    expect(bodyFromChips({})).toEqual({});
    expect(bodyFromChips({ trained: 'long', slept: 'rough' })).toEqual({
      training: { baseline: 40, loadToday: 110, keySessions: [{ daysAgo: 0, kind: 'long' }] },
      sleep: { performance: 40 },
    });
    expect(bodyFromChips({ trained: 'none' }).training).toEqual({ baseline: 40, loadToday: 0 });
  });

  it('never override what the day already says', () => {
    const pasted = { version: 1 as const, date: DATE, timezone: TZ, sleep: { performance: 90 } };
    const merged = withChips(pasted, { slept: 'rough', trained: 'easy' });
    expect(merged.sleep).toEqual({ performance: 90 });
    expect(merged.training).toEqual({ baseline: 40, loadToday: 30 });
  });

  it('move the verdict: rough sleep blocks a hard day', () => {
    const day = sketchToDayInput({}, DATE, TZ);
    expect(scoreDay(withChips(day, { slept: 'great' })).tier).toBe('good');
    expect(scoreDay(withChips(day, { slept: 'rough' })).label).toMatch(/Easy only|Recover/);
  });
});
