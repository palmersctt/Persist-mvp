// The engine's entry points. One path from a day's signals to the card's
// verdict, whatever the source:
//
//   scoreDay(input)          raw DayInput (meetings, training, sleep, …) —
//                            for outside callers and the future API/MCP
//   scoreFromWork(work, …)   already-computed work scores — for the
//                            dashboard, which gets them from the server
//
// Both run the same model (model.ts) and the same session call (weekPlan.ts).

import {
  VERDICT_TIER,
  runModel,
  workIndex,
  type DayInputs,
  type ModelResult,
  type Prior,
} from '../model';
import { sessionCall, type PlannedDay, type WeekDay } from '../weekPlan';
import type { WeekDayHours } from '../weekAhead';
import { confidenceFor, type CalendarDetail, type Confidence } from './confidence';
import { scoreWork } from './workScores';
import type { DayInput, EmailCounts, TrainingInput } from './types';

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** Meeting hours → work load units. Tunable. */
const WORK_LOAD_PER_HOUR = 11;
/** Work-load baseline until we persist per-user work-load history. */
const DEFAULT_WORK_BASELINE = 55;
/** Training baseline assumed when no activity provider is connected. */
const DEFAULT_TRAINING_BASELINE = 30;
/** Sleep input when no provider reports sleep — the model's neutral point. */
const NEUTRAL_SLEEP = 62;
/** Today's training counts as a spike past this multiple of the daily baseline… */
const SPIKE_VS_BASELINE = 4;
/** …and this many load units (≈ minutes) over it. */
const SPIKE_MIN_EXCESS = 45;

export interface DashboardVerdict extends ModelResult {
  workLoad: number;
  workIndexValue: number;
  // Work-health inputs + training actuals, for the breakdown panel.
  focus: number;
  rhythm: number;
  strain: number;
  trainingBaseline: number | null;
  weekActivityCount: number | null;
  trainingLoadToday: number | null;
  /** The card's short action label for this verdict, e.g. "Go long". */
  label: string;
  /** The days ahead with their key sessions placed; null without a forecast. */
  plan: PlannedDay[] | null;
  /** Whether the provider reports which recent sessions were hard or long. */
  knowsTraining: boolean;
  /** How much data the verdict stood on. Never changes the verdict. */
  confidence: Confidence;
}

/** What scoreDay returns: the card's verdict plus the inputs it carried. */
export interface EngineResult extends DashboardVerdict {
  /** The email counts sent in, untouched. Not scored yet. */
  email: EmailCounts | null;
}

/** The day's work, already scored. */
export interface WorkIn {
  focus: number;
  strain: number;
  rhythm: number;
  meetingHours: number;
}

/** The day's body signals. Absent fields are unknown, and unknown is neutral. */
export interface BodyIn {
  training?: TrainingInput;
  /** Sleep performance 0–100. */
  sleep?: number;
  recovery?: number;
}

const toWorkLoad = (meetingHours: number) =>
  clamp(Math.round(meetingHours * WORK_LOAD_PER_HOUR), 0, 120);

/**
 * Compute the readiness verdict from scored work and body signals. Works with
 * work alone (training and sleep held neutral) or with a wearable (real
 * training load + baseline, and sleep when the provider reports it).
 */
export function scoreFromWork(
  work: WorkIn,
  body: BodyIn,
  weekAhead: WeekDayHours[] | null,
  /** The user's local date (YYYY-MM-DD); the forecast is aligned to it. */
  todayDate: string,
  /** How much the work side knew about the day. */
  calendar: CalendarDetail
): DashboardVerdict {
  const { focus, strain, rhythm } = work;
  const wi = workIndex(focus, rhythm, strain);

  const workLoad = toWorkLoad(work.meetingHours);

  // Training: real load + baseline from an activity provider, else neutral so
  // the verdict leans on work alone instead of flagging a phantom training gap.
  const training = body.training;
  const hasTraining = training?.baseline != null;
  const trainingBaseline = training?.baseline ?? DEFAULT_TRAINING_BASELINE;
  const trainingLoadToday = hasTraining ? (training?.loadToday ?? 0) : trainingBaseline;

  // Sleep: a recovery provider's sleep performance (0–100), else neutral.
  const sleepPerformance = body.sleep;
  const sleep =
    typeof sleepPerformance === 'number' ? clamp(sleepPerformance, 0, 100) : NEUTRAL_SLEEP;

  const prior: Prior = {
    load: DEFAULT_WORK_BASELINE + trainingBaseline,
    trainingLoad: trainingBaseline,
  };
  const today: DayInputs = {
    workLoad,
    workIndex: wi,
    trainingLoad: trainingLoadToday,
    trainingFeel: 0, // no per-session feel signal yet
    sleep,
  };

  const model = runModel(prior, [], today);

  // The session call: the model's read, taken to the level of the week.
  // A cached forecast may start on an earlier day: drop the days already past,
  // and use no plan at all if the forecast does not reach today.
  const ahead = (weekAhead ?? []).filter((d) => d.date >= todayDate);
  const week: WeekDay[] | null =
    ahead.length > 0 && ahead[0].date === todayDate
      ? ahead.map((d, i) => ({
          date: d.date,
          // today's forecast is the day already analysed
          workLoad: i === 0 ? workLoad : toWorkLoad(d.meetingHours),
        }))
      : null;
  // A spike is training far beyond what the athlete is built for. The baseline
  // is a daily average that includes rest days, so an ordinary session sits at
  // two to three times it; a spike is well past that.
  const trainingSpike =
    hasTraining &&
    trainingLoadToday > trainingBaseline * SPIKE_VS_BASELINE &&
    trainingLoadToday - trainingBaseline > SPIKE_MIN_EXCESS;
  const call = sessionCall({
    model,
    workLoad,
    sleep: typeof sleepPerformance === 'number' ? sleep : undefined,
    recovery: body.recovery,
    trainingSpike,
    trainedToday: hasTraining && trainingLoadToday > 0,
    week,
    past: training?.keySessions ?? null,
  });

  return {
    ...model,
    verdict: call.verdict,
    tier: VERDICT_TIER[call.verdict],
    rec: call.rec,
    why: call.why,
    label: call.label,
    plan: call.plan,
    knowsTraining: training?.keySessions != null,
    workLoad,
    workIndexValue: wi,
    focus,
    rhythm,
    strain,
    trainingBaseline: training?.baseline ?? null,
    weekActivityCount: training?.weekActivityCount ?? null,
    trainingLoadToday: training?.loadToday ?? null,
    confidence: confidenceFor({
      calendar,
      training: hasTraining,
      sleep: typeof sleepPerformance === 'number',
      historyDays: 0, // no per-day history is persisted yet
    }),
  };
}

/** full when every meeting has a title or category, busy when any is bare. */
function calendarDetail(input: DayInput): CalendarDetail {
  if (input.meetings === undefined) return 'unknown';
  return input.meetings.every((m) => m.title?.trim() || m.category) ? 'full' : 'busy';
}

/**
 * Score one day from raw signals. `meetings` absent (calendar unknown) and
 * `meetings: []` (an open day) both score the work side as an open day —
 * a missing calendar never reads as a hard one, only as low confidence.
 * Email is carried through.
 */
export function scoreDay(input: DayInput): EngineResult {
  const work = scoreWork(input.meetings ?? [], input.timezone);
  const verdict = scoreFromWork(
    {
      focus: work.focus,
      strain: work.strain,
      rhythm: work.rhythm,
      meetingHours: work.schedule.durationHours,
    },
    {
      training: input.training,
      sleep: input.sleep?.performance,
      recovery: input.recovery,
    },
    input.weekAhead ?? null,
    input.date,
    calendarDetail(input)
  );
  return { ...verdict, email: input.email ? { ...input.email } : null };
}
