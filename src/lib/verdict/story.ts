// The words around a visitor's verdict: the three reveal lines and the
// receipt (what went in, what didn't). Pure.

import type { DayInput } from '../engine/types';
import type { EngineResult } from '../engine/scoreDay';
import type { WorkDayAnalysis } from '../engine/workScores';
import { meaningfulTitle } from '../engine/workScores';

const hours = (h: number) => (Number.isInteger(h) ? `${h}` : h.toFixed(1));

/** The three lines that type in before the card lands. */
export function revealLines(
  input: DayInput,
  work: WorkDayAnalysis,
  result: EngineResult
): string[] {
  const s = work.schedule;
  const day =
    input.meetings === undefined
      ? 'No calendar — reading your body signals'
      : s.meetingCount === 0
        ? 'An open calendar'
        : [
            `${s.meetingCount} meeting${s.meetingCount === 1 ? '' : 's'}, ${hours(s.durationHours)} hours`,
            s.backToBackCount > 0 ? `${s.backToBackCount} back-to-back` : null,
          ]
            .filter(Boolean)
            .join(' · ');
  return [
    day,
    `Focus ${result.focus} · Strain ${result.strain} · Rhythm ${result.rhythm}`,
    `Load ${result.acwr.toFixed(2)}× your baseline`,
  ];
}

export interface Receipt {
  used: string[];
  notUsed: string[];
}

/** What the verdict was built from — and what never entered it. */
export function receipt(input: DayInput): Receipt {
  const used: string[] = [];
  const m = input.meetings;
  if (m === undefined) used.push('no calendar');
  else if (m.length === 0) used.push('an empty calendar');
  else {
    used.push(`${m.length} meeting time${m.length === 1 ? '' : 's'}`);
    if (m.some((x) => x.category)) used.push('meeting types');
    if (m.some((x) => x.attendees)) used.push('attendee counts');
  }
  if (input.training?.baseline != null) used.push('training load');
  if (input.sleep?.performance != null) used.push('sleep');
  if (input.recovery != null) used.push('recovery');
  if (input.email) used.push('email counts (not scored yet)');

  const notUsed = ['names', 'message content'];
  const titled = (m ?? []).some((x) => meaningfulTitle(x.title));
  notUsed.unshift(titled ? 'titles (only used to sort, then dropped)' : 'meeting titles');
  return { used, notUsed };
}
