// Per-day history: the model inputs saved for each scored day, read back so
// the verdict is measured against the user's own recent normal instead of
// the default prior. Pure; storage lives in /api/day-inputs.

import type { DayInputs } from '../model';
import { PERSONAL_BASELINE_DAYS } from './confidence';

/** One saved day: the model's inputs, dated. */
export interface DayRow extends DayInputs {
  /** The user's local date, YYYY-MM-DD. */
  date: string;
}

/** History handed to the engine alongside today. */
export interface PastDays {
  /** Logged days before today, oldest first. */
  history: DayInputs[];
  /** Logged days within the personal-baseline window (last 21 days). */
  historyDays: number;
}

/** How far back logged days feed the baseline. */
export const HISTORY_WINDOW_DAYS = 42;

export const NO_HISTORY: PastDays = { history: [], historyDays: 0 };

const DAY_MS = 86_400_000;
const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

/**
 * Saved rows → the history for `today`. Keeps rows strictly before today and
 * within the window, one per date (the last one given wins), oldest first.
 * Gaps are skipped, not filled: a day with no record is unknown, not rest.
 */
export function historyFrom(
  rows: DayRow[],
  today: string,
  windowDays = HISTORY_WINDOW_DAYS
): PastDays {
  const byDate = new Map<string, DayRow>();
  for (const r of rows) {
    const age = daysBetween(r.date, today);
    if (age >= 1 && age <= windowDays) byDate.set(r.date, r);
  }
  const dated = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return {
    history: dated.map(({ workLoad, workIndex, trainingLoad, trainingFeel, sleep }) => ({
      workLoad,
      workIndex,
      trainingLoad,
      trainingFeel,
      sleep,
    })),
    historyDays: dated.filter((r) => daysBetween(r.date, today) <= PERSONAL_BASELINE_DAYS).length,
  };
}

export type ParseRowResult = { ok: true; row: DayRow } | { ok: false; errors: string[] };

const inRange = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

/** Validate a day row sent by the dashboard. Only `today` may be written. */
export function parseDayRow(raw: unknown, today: string): ParseRowResult {
  if (typeof raw !== 'object' || raw === null)
    return { ok: false, errors: ['body must be an object'] };
  const r = raw as Record<string, unknown>;
  const errors: string[] = [];
  if (r.date !== today) errors.push(`date must be today (${today})`);
  if (!inRange(r.workLoad, 0, 120)) errors.push('workLoad must be 0–120');
  if (!inRange(r.workIndex, 0, 100)) errors.push('workIndex must be 0–100');
  if (!inRange(r.trainingLoad, 0, 1000)) errors.push('trainingLoad must be 0–1000');
  if (!inRange(r.trainingFeel, -1, 1)) errors.push('trainingFeel must be −1 to 1');
  if (!inRange(r.sleep, 0, 100)) errors.push('sleep must be 0–100');
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    row: {
      date: today,
      workLoad: r.workLoad as number,
      workIndex: r.workIndex as number,
      trainingLoad: r.trainingLoad as number,
      trainingFeel: r.trainingFeel as number,
      sleep: r.sleep as number,
    },
  };
}
