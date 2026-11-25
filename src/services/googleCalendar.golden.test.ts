import { describe, it, expect } from 'vitest';
import GoogleCalendarService, { toCalendarEvent } from './googleCalendar';
import { BUSY_GOOGLE_EVENTS, GOLDEN_DAYS } from './goldenDays.fixture';

// Golden days: the whole analyzeWorkHealth result, recorded from the service
// before the work-score maths moved into src/lib/engine. Any change to these
// snapshots is a change to users' scores — it needs its own ticket.

describe('analyzeWorkHealth golden days', () => {
  for (const [name, events] of Object.entries(GOLDEN_DAYS)) {
    it(name, async () => {
      const result = await new GoogleCalendarService().analyzeWorkHealth(undefined, events);
      expect(result).toMatchSnapshot();
    });
  }

  // Added with the placeholder-title fix: raw Google events through the
  // real mapper, so the category rule is covered too.
  it('busy placeholders', async () => {
    const events = BUSY_GOOGLE_EVENTS.map(toCalendarEvent);
    const result = await new GoogleCalendarService().analyzeWorkHealth(undefined, events);
    expect(result.schedule.meetingCount).toBe(5);
    expect(result).toMatchSnapshot();
  });
});
