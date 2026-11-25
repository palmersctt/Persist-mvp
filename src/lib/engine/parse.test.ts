import { describe, it, expect } from 'vitest';
import { parseDayInput } from './parse';

const valid = {
  version: 1,
  date: '2026-11-25',
  timezone: 'America/New_York',
  meetings: [
    {
      start: '2026-11-25T09:00:00-05:00',
      end: '2026-11-25T10:00:00-05:00',
      attendees: 6,
      title: 'Sprint planning',
      category: 'COLLABORATIVE',
      organizerIsMe: true,
    },
    { start: '2026-11-25T13:00:00-05:00', end: '2026-11-25T13:30:00-05:00' },
  ],
  email: { sent: 40, sentAfterHours: 6, received: 120 },
  training: {
    loadToday: 45,
    baseline: 38,
    weekActivityCount: 4,
    keySessions: [{ daysAgo: 2, kind: 'hard' }],
  },
  sleep: { performance: 81 },
  recovery: 66,
  weekAhead: [{ date: '2026-11-25', meetingHours: 1.5 }],
};

const errorsFor = (patch: Record<string, unknown>) => {
  const r = parseDayInput({ ...valid, ...patch });
  return r.ok ? [] : r.errors;
};

describe('parseDayInput', () => {
  it('accepts a full valid day and returns it', () => {
    const r = parseDayInput(valid);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.input).toEqual(valid);
  });

  it('accepts the minimum: version, date, timezone', () => {
    const r = parseDayInput({ version: 1, date: '2026-11-25', timezone: 'UTC' });
    expect(r).toEqual({
      ok: true,
      input: { version: 1, date: '2026-11-25', timezone: 'UTC' },
    });
  });

  it('drops unknown keys', () => {
    const r = parseDayInput({
      ...valid,
      notes: 'secret',
      meetings: [{ ...valid.meetings[1], body: 'agenda text' }],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.input).not.toHaveProperty('notes');
      expect(r.input.meetings?.[0]).not.toHaveProperty('body');
    }
  });

  it.each([
    ['not an object', null, 'input must be an object'],
    ['wrong version', { version: 2 }, 'version must be 1'],
    ['bad date', { date: '25/11/2026' }, 'date must be YYYY-MM-DD'],
    ['impossible date', { date: '2026-02-31', meetings: [] }, 'date must be YYYY-MM-DD'],
    ['bad timezone', { timezone: 'Mars/Olympus' }, 'timezone must be an IANA time zone'],
    ['meetings not an array', { meetings: {} }, 'meetings must be an array'],
    [
      'unparseable start',
      { meetings: [{ start: 'nine', end: '2026-11-25T10:00:00Z' }] },
      'meetings[0].start must be an ISO date-time with an offset',
    ],
    [
      'a time with no offset',
      { meetings: [{ start: '2026-11-25T09:00', end: '2026-11-25T10:00-05:00' }] },
      'meetings[0].start must be an ISO date-time with an offset',
    ],
    [
      'a date where a time belongs',
      { meetings: [{ start: '2026-11-25', end: '2026-11-25T10:00:00-05:00' }] },
      'meetings[0].start must be an ISO date-time with an offset',
    ],
    [
      'a meeting on another day',
      { meetings: [{ start: '2026-11-24T09:00:00-05:00', end: '2026-11-24T10:00:00-05:00' }] },
      'meetings[0].start must fall on 2026-11-25 in America/New_York',
    ],
    [
      'too many meetings',
      { meetings: Array.from({ length: 101 }, () => valid.meetings[1]) },
      'meetings must have at most 100 entries',
    ],
    [
      'end before start',
      { meetings: [{ start: '2026-11-25T10:00:00Z', end: '2026-11-25T09:00:00Z' }] },
      'meetings[0].end must be after start',
    ],
    [
      'zero attendees',
      { meetings: [{ ...valid.meetings[1], attendees: 0 }] },
      'meetings[0].attendees must be a whole number ≥ 1',
    ],
    [
      'unknown category',
      { meetings: [{ ...valid.meetings[1], category: 'FUN' }] },
      'meetings[0].category must be one of',
    ],
    ['negative email', { email: { sent: -1 } }, 'email.sent must be a whole number ≥ 0'],
    ['fractional email', { email: { received: 2.5 } }, 'email.received must be a whole number'],
    ['negative training', { training: { baseline: -3 } }, 'training.baseline must be a number ≥ 0'],
    [
      'bad key session',
      { training: { keySessions: [{ daysAgo: 1, kind: 'tempo' }] } },
      'training.keySessions[0].kind must be hard or long',
    ],
    [
      'sleep over 100',
      { sleep: { performance: 140 } },
      'sleep.performance must be between 0 and 100',
    ],
    ['recovery not a number', { recovery: 'high' }, 'recovery must be between 0 and 100'],
    [
      'week day too long',
      { weekAhead: [{ date: '2026-11-25', meetingHours: 30 }] },
      'weekAhead[0].meetingHours must be between 0 and 24',
    ],
    [
      'week days out of order',
      {
        weekAhead: [
          { date: '2026-11-26', meetingHours: 1 },
          { date: '2026-11-25', meetingHours: 2 },
        ],
      },
      'weekAhead[1].date must come after 2026-11-26',
    ],
  ])('rejects %s', (_name, patch, message) => {
    const errors =
      patch === null ? (parseDayInput(null) as { errors: string[] }).errors : errorsFor(patch);
    expect(errors.some((e) => e.startsWith(message))).toBe(true);
  });

  it('places a meeting on the local date, not the UTC one', () => {
    // 19:00 in New York is already the 26th in UTC.
    const evening = { start: '2026-11-26T00:00:00Z', end: '2026-11-26T01:00:00Z' };
    expect(parseDayInput({ ...valid, meetings: [evening] }).ok).toBe(true);
  });

  it('reports every problem at once', () => {
    expect(errorsFor({ version: 0, date: 'x', timezone: '' })).toHaveLength(3);
  });
});
