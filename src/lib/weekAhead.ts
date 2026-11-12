// The calendar forecast for the days ahead: meeting hours per local day.
// Pure helpers — the calendar service does the fetching.

export interface WeekDayHours {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  meetingHours: number;
}

/** `count` consecutive local dates starting at `today` (YYYY-MM-DD). */
export function weekDates(today: string, count = 7): string[] {
  const start = new Date(`${today}T12:00:00Z`).getTime();
  return Array.from({ length: count }, (_, i) =>
    new Date(start + i * 86400000).toISOString().slice(0, 10)
  );
}

/** The local calendar date of an instant in `timeZone`. */
export function localDate(instant: Date, timeZone: string): string {
  return instant.toLocaleDateString('sv-SE', { timeZone });
}

/**
 * Sum meeting hours per local day. An event counts toward the day it starts
 * on; events starting outside `dates` are ignored. Every date gets an entry,
 * so a day with no meetings reads 0 rather than going missing.
 */
export function meetingHoursByDay(
  events: Array<{ start: Date; end: Date }>,
  dates: string[],
  timeZone: string
): WeekDayHours[] {
  const hours = new Map(dates.map((d) => [d, 0]));
  for (const e of events) {
    const day = localDate(e.start, timeZone);
    const length = (e.end.getTime() - e.start.getTime()) / 3600000;
    if (!hours.has(day) || !Number.isFinite(length) || length <= 0) continue;
    hours.set(day, (hours.get(day) ?? 0) + length);
  }
  return dates.map((date) => ({
    date,
    meetingHours: Math.round((hours.get(date) ?? 0) * 10) / 10,
  }));
}
