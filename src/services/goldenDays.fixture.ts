import type { CalendarEvent, MeetingCategory } from './googleCalendar';

// Golden days shared by the service's golden test and the engine's
// scoreWork test. Times are fixed instants; the zone is America/Los_Angeles.

// The service defaults to America/Los_Angeles (PDT = UTC-7 on 2024-03-11).
const la = (h: number, m = 0) => new Date(Date.UTC(2024, 2, 11, h + 7, m));

const ev = (
  summary: string,
  start: [number, number],
  end: [number, number],
  category: MeetingCategory,
  attendees?: number
): CalendarEvent => ({
  id: `${summary}-${start.join(':')}`,
  summary,
  start: la(...start),
  end: la(...end),
  attendees,
  isRecurring: false,
  category,
});

export const GOLDEN_DAYS: Record<string, CalendarEvent[]> = {
  open: [],
  'bored standup': [ev('standup', [9, 30], [9, 45], 'LIGHT_MEETINGS', 3)],
  'fragmented 8h heavy': [
    ev('quarterly review', [9, 0], [10, 0], 'HEAVY_MEETINGS', 12),
    ev('client presentation', [10, 0], [11, 0], 'HEAVY_MEETINGS', 12),
    ev('all-hands', [11, 0], [12, 0], 'HEAVY_MEETINGS', 50),
    ev('training', [12, 0], [13, 0], 'HEAVY_MEETINGS', 12),
    ev('design review', [13, 0], [14, 0], 'HEAVY_MEETINGS', 8),
    ev('sprint planning', [14, 0], [15, 0], 'COLLABORATIVE', 8),
    ev('interview', [15, 0], [16, 0], 'HEAVY_MEETINGS', 4),
    ev('board meeting', [16, 0], [17, 0], 'HEAVY_MEETINGS', 12),
  ],
  'back-to-back afternoon': [
    ev('standup', [9, 0], [9, 15], 'LIGHT_MEETINGS', 5),
    ev('team meeting', [13, 0], [14, 0], 'COLLABORATIVE', 8),
    ev('design review', [14, 0], [15, 0], 'HEAVY_MEETINGS', 6),
    ev('1:1', [15, 10], [15, 40], 'LIGHT_MEETINGS', 2),
    ev('retrospective', [15, 45], [16, 45], 'COLLABORATIVE', 8),
  ],
  'early and late': [
    ev('training', [6, 30], [8, 0], 'HEAVY_MEETINGS', 12),
    ev('sync', [10, 0], [10, 30], 'LIGHT_MEETINGS', 3),
    ev('demo', [17, 30], [18, 30], 'HEAVY_MEETINGS', 10),
  ],
  'mixed focus and beneficial': [
    ev('focus block', [8, 0], [10, 0], 'FOCUS_WORK'),
    ev('1:1', [10, 30], [11, 0], 'LIGHT_MEETINGS', 2),
    ev('lunch walk', [12, 0], [13, 0], 'BENEFICIAL'),
    ev('team meeting', [14, 0], [15, 0], 'COLLABORATIVE', 6),
    ev('gym', [17, 0], [18, 0], 'BENEFICIAL'),
  ],
  'untitled meetings': [
    ev('No title', [9, 0], [10, 0], 'COLLABORATIVE', 1),
    ev('No title', [10, 0], [11, 0], 'COLLABORATIVE', 1),
    ev('No title', [14, 0], [15, 30], 'COLLABORATIVE', 1),
  ],
  'unsorted sandbox input': [
    ev('design review', [15, 0], [16, 0], 'HEAVY_MEETINGS', 3),
    ev('standup', [9, 0], [9, 15], 'LIGHT_MEETINGS', 3),
    ev('team meeting', [11, 0], [12, 0], 'COLLABORATIVE', 3),
  ],
};

/** Google events as the API returns them, for the placeholder-title day. */
export const BUSY_GOOGLE_EVENTS = [
  ['Busy', 9, 10],
  ['Blocked', 10, 11],
  ['Tentative', 11, 12],
  ['Private event', 13, 14],
  ['busy', 14, 15],
].map(([summary, s, e], i) => ({
  id: `busy-${i}`,
  summary: summary as string,
  start: { dateTime: la(s as number).toISOString() },
  end: { dateTime: la(e as number).toISOString() },
}));
