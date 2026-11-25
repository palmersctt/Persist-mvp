// Four ready-made days for people who just want to look. Built for today in
// the visitor's own zone, so they score like a real day would.

import type { DayInput, EngineMeeting } from '../engine/types';
import type { MeetingCategory } from '../engine/workScores';
import { localIso, nextDates } from './localTime';

export interface ExampleDay {
  id: string;
  title: string;
  blurb: string;
  build: (date: string, timezone: string) => DayInput;
}

const block = (
  date: string,
  tz: string,
  start: number,
  end: number,
  category?: MeetingCategory,
  attendees?: number
): EngineMeeting => ({
  start: localIso(date, start, tz),
  end: localIso(date, end, tz),
  ...(category ? { category } : {}),
  ...(attendees ? { attendees } : {}),
});

export const EXAMPLE_DAYS: ExampleDay[] = [
  {
    id: 'back-to-backs',
    title: 'Eight back-to-backs',
    blurb: '9 to 5, no gaps, a board review at 4.',
    build: (date, tz) => ({
      version: 1,
      date,
      timezone: tz,
      meetings: [
        block(date, tz, 9, 10, 'COLLABORATIVE', 8),
        block(date, tz, 10, 11, 'HEAVY_MEETINGS', 12),
        block(date, tz, 11, 12, 'COLLABORATIVE', 6),
        block(date, tz, 12, 13, 'COLLABORATIVE', 10),
        block(date, tz, 13, 14, 'HEAVY_MEETINGS', 5),
        block(date, tz, 14, 15, 'COLLABORATIVE', 8),
        block(date, tz, 15, 16, 'LIGHT_MEETINGS', 2),
        block(date, tz, 16, 17, 'HEAVY_MEETINGS', 14),
      ],
      sleep: { performance: 64 },
    }),
  },
  {
    id: 'busy-only',
    title: 'Busy blocks only',
    blurb: 'An Outlook calendar shared as free/busy: times, no titles.',
    build: (date, tz) => ({
      version: 1,
      date,
      timezone: tz,
      meetings: [
        block(date, tz, 9, 10),
        block(date, tz, 10.5, 11.5),
        block(date, tz, 13, 14),
        block(date, tz, 14, 15),
        block(date, tz, 15.5, 16.5),
      ],
    }),
  },
  {
    id: 'open-long-run',
    title: 'Open day, long run planned',
    blurb: 'Nothing booked, a busy week ahead, legs fresh.',
    build: (date, tz) => ({
      version: 1,
      date,
      timezone: tz,
      meetings: [],
      training: {
        baseline: 42,
        loadToday: 0,
        weekActivityCount: 4,
        keySessions: [{ daysAgo: 3, kind: 'hard' }],
      },
      sleep: { performance: 86 },
      weekAhead: nextDates(date, 7).map((d, i) => ({
        date: d,
        meetingHours: [0, 6, 5.5, 4, 6.5, 2, 0][i],
      })),
    }),
  },
  {
    id: 'short-sleep',
    title: 'Short sleep, light calendar',
    blurb: 'Two meetings, but four hours of sleep.',
    build: (date, tz) => ({
      version: 1,
      date,
      timezone: tz,
      meetings: [
        block(date, tz, 10, 10.5, 'LIGHT_MEETINGS', 2),
        block(date, tz, 14, 15, 'COLLABORATIVE', 5),
      ],
      training: { baseline: 38, loadToday: 0, keySessions: [] },
      sleep: { performance: 30 },
      recovery: 28,
    }),
  },
];
