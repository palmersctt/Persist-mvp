// "Sketch it": tap the hours you're booked, optionally mark the heavy ones,
// and add how you slept and trained. Turns that into a DayInput.

import type { DayInput, EngineMeeting, TrainingInput } from '../engine/types';
import { localIso } from './localTime';

export const SKETCH_HOURS = Array.from({ length: 15 }, (_, i) => 6 + i); // 6am … 8pm

export type HourMark = 'busy' | 'heavy';
export type Trained = 'none' | 'easy' | 'hard' | 'long';
export type Slept = 'rough' | 'ok' | 'great';

export interface BodyChips {
  trained?: Trained;
  slept?: Slept;
}

/** A typical recreational athlete's daily load (≈ 4–5 sessions a week). */
const TYPICAL_BASELINE = 40;
const TRAINING_LOAD: Record<Trained, number> = { none: 0, easy: 30, hard: 75, long: 110 };
const SLEEP_SCORE: Record<Slept, number> = { rough: 40, ok: 65, great: 88 };

/** Next mark when an hour is tapped: free → busy → heavy → free. */
export function nextMark(m: HourMark | undefined): HourMark | undefined {
  return m === undefined ? 'busy' : m === 'busy' ? 'heavy' : undefined;
}

/** The chips as DayInput sections (only what was chosen). */
export function bodyFromChips(chips: BodyChips): Pick<DayInput, 'training' | 'sleep'> {
  const out: Pick<DayInput, 'training' | 'sleep'> = {};
  if (chips.trained) {
    const t: TrainingInput = {
      baseline: TYPICAL_BASELINE,
      loadToday: TRAINING_LOAD[chips.trained],
    };
    if (chips.trained === 'hard' || chips.trained === 'long')
      t.keySessions = [{ daysAgo: 0, kind: chips.trained }];
    out.training = t;
  }
  if (chips.slept) out.sleep = { performance: SLEEP_SCORE[chips.slept] };
  return out;
}

/** Add chips to a day without overriding what the day already says. */
export function withChips(input: DayInput, chips: BodyChips): DayInput {
  const body = bodyFromChips(chips);
  return {
    ...input,
    ...(input.training === undefined && body.training ? { training: body.training } : {}),
    ...(input.sleep === undefined && body.sleep ? { sleep: body.sleep } : {}),
  };
}

export function sketchToDayInput(
  marks: Partial<Record<number, HourMark>>,
  date: string,
  timezone: string
): DayInput {
  const meetings: EngineMeeting[] = SKETCH_HOURS.filter((h) => marks[h]).map((h) => ({
    start: localIso(date, h, timezone),
    end: localIso(date, h + 1, timezone),
    category: marks[h] === 'heavy' ? 'HEAVY_MEETINGS' : 'COLLABORATIVE',
  }));
  return { version: 1, date, timezone, meetings };
}

export const hourLabel = (h: number) => (h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`);
