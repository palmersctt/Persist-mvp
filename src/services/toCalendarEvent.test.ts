import { describe, it, expect } from 'vitest';
import { toCalendarEvent } from './googleCalendar';
import { isActualMeeting } from '../lib/engine/workScores';

const ev = (summary?: string, attendees?: number) =>
  toCalendarEvent({
    id: 'e1',
    summary,
    start: { dateTime: '2026-11-25T09:00:00-08:00' },
    end: { dateTime: '2026-11-25T10:00:00-08:00' },
    attendees: attendees ? Array.from({ length: attendees }, () => ({})) : undefined,
  });

describe('toCalendarEvent', () => {
  it.each(['Busy', 'blocked', ' Tentative ', 'Private event', 'Unavailable', 'Not available'])(
    'counts placeholder title "%s" as a meeting',
    (title) => {
      const e = ev(title);
      expect(e.category).toBe('COLLABORATIVE');
      expect(isActualMeeting(e)).toBe(true);
    }
  );

  it('keeps keyword categories for real titles that contain those words', () => {
    expect(ev('Busy season planning').category).toBe('NEUTRAL');
    expect(ev('Out of office').category).toBe('NEUTRAL');
    expect(ev('Gym').category).toBe('BENEFICIAL');
  });

  it("names a missing title 'No title', scored as a meeting as before", () => {
    const e = ev(undefined);
    expect(e.summary).toBe('No title');
    expect(e.category).toBe('COLLABORATIVE');
  });

  it('maps times and attendees', () => {
    const e = ev('Sync', 4);
    expect(e.start.toISOString()).toBe('2026-11-25T17:00:00.000Z');
    expect(e.end.getTime() - e.start.getTime()).toBe(3600000);
    expect(e.attendees).toBe(4);
    expect(ev('Sync').attendees).toBe(1);
  });
});
