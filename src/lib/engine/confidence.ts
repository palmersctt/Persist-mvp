// How much data a verdict stood on. A rule table, not a number: three levels
// an assistant can relay in a sentence. Confidence never changes the verdict,
// the scores or the tier — it only says how sure the read is.

export type Missing = 'calendar' | 'meetingDetail' | 'training' | 'sleep' | 'history';

/** full = titles or categories; busy = meeting times only; unknown = no calendar. */
export type CalendarDetail = 'full' | 'busy' | 'unknown';

export interface Confidence {
  level: 'low' | 'medium' | 'high';
  /** Every absent input, in a fixed order. */
  missing: Missing[];
}

/** Days of history before the baseline counts as personal (the 21-day EWMA). */
export const PERSONAL_BASELINE_DAYS = 21;

export function confidenceFor(p: {
  calendar: CalendarDetail;
  training: boolean;
  sleep: boolean;
  historyDays: number;
}): Confidence {
  const missing: Missing[] = [];
  if (p.calendar === 'unknown') missing.push('calendar');
  if (p.calendar === 'busy') missing.push('meetingDetail');
  if (!p.training) missing.push('training');
  if (!p.sleep) missing.push('sleep');
  const personal = p.historyDays >= PERSONAL_BASELINE_DAYS;
  if (!personal) missing.push('history');

  const full = p.calendar === 'full';
  const anyCalendar = p.calendar !== 'unknown';
  let level: Confidence['level'] =
    full && p.training && p.sleep
      ? 'high'
      : (anyCalendar && (p.training || p.sleep)) || full
        ? 'medium'
        : 'low';
  // Against a default baseline, "high" would overclaim.
  if (!personal && level === 'high') level = 'medium';
  return { level, missing };
}

const PHRASE: Record<Missing, string> = {
  calendar: 'no calendar',
  meetingDetail: 'meeting times only',
  training: 'no training data',
  sleep: 'no sleep data',
  history: 'no personal baseline yet',
};

/** "Medium confidence — no sleep data, no personal baseline yet". */
export function describeConfidence(c: Confidence): string {
  const level = c.level[0].toUpperCase() + c.level.slice(1);
  return c.missing.length === 0
    ? `${level} confidence`
    : `${level} confidence — ${c.missing.map((m) => PHRASE[m]).join(', ')}`;
}
