import { describe, it, expect } from 'vitest';
import { PERSONAL_BASELINE_DAYS, confidenceFor, describeConfidence } from './confidence';

const personal = PERSONAL_BASELINE_DAYS;

describe('confidenceFor', () => {
  it.each([
    // calendar, training, sleep, history → level
    ['full', true, true, personal, 'high'],
    ['full', true, false, personal, 'medium'],
    ['full', false, true, personal, 'medium'],
    ['full', false, false, personal, 'medium'],
    ['busy', true, false, personal, 'medium'],
    ['busy', false, true, personal, 'medium'],
    ['busy', true, true, personal, 'medium'],
    ['busy', false, false, personal, 'low'],
    ['unknown', true, true, personal, 'low'],
    ['unknown', false, false, personal, 'low'],
  ] as const)(
    '%s calendar, training %s, sleep %s, %d days → %s',
    (calendar, training, sleep, historyDays, level) => {
      expect(confidenceFor({ calendar, training, sleep, historyDays }).level).toBe(level);
    }
  );

  it('caps at medium without a personal baseline', () => {
    const full = { calendar: 'full', training: true, sleep: true } as const;
    expect(confidenceFor({ ...full, historyDays: personal - 1 }).level).toBe('medium');
    expect(confidenceFor({ ...full, historyDays: 0 }).missing).toEqual(['history']);
  });

  it('never lifts a low read', () => {
    expect(
      confidenceFor({ calendar: 'unknown', training: false, sleep: false, historyDays: 0 })
    ).toEqual({ level: 'low', missing: ['calendar', 'training', 'sleep', 'history'] });
  });

  it('lists nothing missing when everything is there', () => {
    expect(
      confidenceFor({ calendar: 'full', training: true, sleep: true, historyDays: personal })
    ).toEqual({ level: 'high', missing: [] });
  });
});

describe('describeConfidence', () => {
  it('names what is missing', () => {
    expect(describeConfidence({ level: 'medium', missing: ['sleep', 'history'] })).toBe(
      'Medium confidence — no sleep data, no personal baseline yet'
    );
  });

  it('says only the level when nothing is missing', () => {
    expect(describeConfidence({ level: 'high', missing: [] })).toBe('High confidence');
  });
});
