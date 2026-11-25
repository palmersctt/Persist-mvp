import { describe, it, expect } from 'vitest';
import GoogleCalendarService from './googleCalendar';
import { GOLDEN_DAYS } from './goldenDays.fixture';

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
});
