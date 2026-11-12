import { describe, it, expect } from 'vitest';
import { localDate, meetingHoursByDay, weekDates } from './weekAhead';

const LA = 'America/Los_Angeles';
const event = (startISO: string, hours: number) => {
  const start = new Date(startISO);
  return { start, end: new Date(start.getTime() + hours * 3600000) };
};

describe('weekDates', () => {
  it('lists consecutive dates across a month end', () => {
    expect(weekDates('2026-06-28', 5)).toEqual([
      '2026-06-28',
      '2026-06-29',
      '2026-06-30',
      '2026-07-01',
      '2026-07-02',
    ]);
  });

  it('stays on calendar days across a daylight-saving change', () => {
    expect(weekDates('2026-03-07', 3)).toEqual(['2026-03-07', '2026-03-08', '2026-03-09']);
  });
});

describe('localDate', () => {
  it('uses the wearer’s day, not UTC', () => {
    // 01:30 UTC on the 12th is 18:30 on the 11th in Los Angeles
    expect(localDate(new Date('2026-06-12T01:30:00Z'), LA)).toBe('2026-06-11');
  });
});

describe('meetingHoursByDay', () => {
  const dates = weekDates('2026-06-11', 3);

  it('sums hours per local day and reports empty days as zero', () => {
    const days = meetingHoursByDay(
      [
        event('2026-06-11T16:00:00Z', 1), // 09:00 LA
        event('2026-06-11T20:00:00Z', 1.5), // 13:00 LA
        event('2026-06-13T17:00:00Z', 2),
      ],
      dates,
      LA
    );
    expect(days).toEqual([
      { date: '2026-06-11', meetingHours: 2.5 },
      { date: '2026-06-12', meetingHours: 0 },
      { date: '2026-06-13', meetingHours: 2 },
    ]);
  });

  it('files an evening meeting under the local day it starts on', () => {
    const days = meetingHoursByDay([event('2026-06-12T01:30:00Z', 1)], dates, LA);
    expect(days[0].meetingHours).toBe(1);
    expect(days[1].meetingHours).toBe(0);
  });

  it('ignores events outside the window and malformed events', () => {
    const days = meetingHoursByDay(
      [event('2026-06-20T16:00:00Z', 1), event('2026-06-11T16:00:00Z', -1)],
      dates,
      LA
    );
    expect(days.every((d) => d.meetingHours === 0)).toBe(true);
  });
});
