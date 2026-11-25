import { describe, it, expect } from 'vitest';
import GoogleCalendarService from '../../services/googleCalendar';
import { GOLDEN_DAYS } from '../../services/goldenDays.fixture';
import { categorizeMeeting, scoreWork } from './workScores';
import type { EngineMeeting } from './types';

const LA = 'America/Los_Angeles';

const toMeetings = (name: string): EngineMeeting[] =>
  GOLDEN_DAYS[name].map((e) => ({
    start: e.start.toISOString(),
    end: e.end.toISOString(),
    attendees: e.attendees,
    title: e.summary,
    category: e.category,
  }));

// Google returns events in start order; the sandbox day is the one fixture
// that is deliberately out of order, so it is compared separately.
const SORTED_DAYS = Object.keys(GOLDEN_DAYS).filter((n) => n !== 'unsorted sandbox input');

describe('scoreWork', () => {
  for (const name of SORTED_DAYS) {
    it(`matches the Google service on "${name}"`, async () => {
      const google = await new GoogleCalendarService().analyzeWorkHealth(
        undefined,
        GOLDEN_DAYS[name]
      );
      const engine = scoreWork(toMeetings(name), LA);
      expect(engine.focus).toBe(google.adaptivePerformanceIndex);
      expect(engine.strain).toBe(google.cognitiveResilience);
      expect(engine.rhythm).toBe(google.workRhythmRecovery);
      expect(engine.schedule).toEqual(google.schedule);
    });
  }

  it('puts meetings in start order before scoring', () => {
    const meetings = toMeetings('unsorted sandbox input');
    const sorted = [...meetings].sort((a, b) => a.start.localeCompare(b.start));
    expect(scoreWork(meetings, LA)).toEqual(scoreWork(sorted, LA));
  });

  it('counts each untitled meeting as its own context', () => {
    const busy = toMeetings('fragmented 8h heavy').map(({ start, end }) => ({ start, end }));
    const result = scoreWork(busy, LA);
    expect(result.schedule.uniqueContexts).toBe(busy.length);
    expect(result.schedule.meetingCount).toBe(busy.length);
    expect(result.schedule.durationHours).toBe(8);
  });

  it('treats busy-only blocks as collaborative meetings of one person', () => {
    const busy = toMeetings('back-to-back afternoon').map(({ start, end }) => ({ start, end }));
    const asCollab = busy.map((m, i) => ({
      ...m,
      category: 'COLLABORATIVE' as const,
      attendees: 1,
      title: `meeting ${i}`,
    }));
    expect(scoreWork(busy, LA)).toEqual(scoreWork(asCollab, LA));
  });

  it("lets the caller's category win over the title", () => {
    const [m] = toMeetings('bored standup');
    const asFocus = scoreWork([{ ...m, category: 'FOCUS_WORK' }], LA);
    expect(asFocus.schedule.meetingCount).toBe(0);
    expect(asFocus.focusWorkCount).toBe(1);
  });

  it('scores an open day the same as Google does with no events', async () => {
    const google = await new GoogleCalendarService().analyzeWorkHealth(undefined, []);
    const engine = scoreWork([], LA);
    expect([engine.focus, engine.strain, engine.rhythm]).toEqual([
      google.adaptivePerformanceIndex,
      google.cognitiveResilience,
      google.workRhythmRecovery,
    ]);
  });
});

describe('categorizeMeeting', () => {
  it.each([
    ['working lunch', 'COLLABORATIVE'],
    ['Gym', 'BENEFICIAL'],
    ['Sprint planning', 'COLLABORATIVE'],
    ['1:1 with Sam', 'LIGHT_MEETINGS'],
    ['Quarterly review', 'HEAVY_MEETINGS'],
    ['Deep work', 'FOCUS_WORK'],
    ['Q3 numbers', 'COLLABORATIVE'],
  ] as const)('%s → %s', (title, category) => {
    expect(categorizeMeeting(title)).toBe(category);
  });
});
