import {
  VERDICT_TIER,
  runModel,
  workIndex,
  type DayInputs,
  type ModelResult,
  type Prior,
} from './model';
import { sessionCall, type PlannedDay, type WeekDay } from './weekPlan';
import type { WorkHealthMetrics } from '../hooks/useWorkHealth';
import type { WearableActuals } from './wearables/types';
import type { WeekDayHours } from './weekAhead';

// Maps the dashboard's real signals — calendar work-health + a wearable's
// training load and sleep — into the readiness model, in day-1 mode (no
// per-day history yet, so the prior carries the baseline). trainingFeel has
// no real signal yet, so it's held neutral; sleep is neutral without a
// provider that reports it.

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
}

const toWorkLoad = (meetingHours: number) =>
  clamp(Math.round(meetingHours * WORK_LOAD_PER_HOUR), 0, 120);

/**
 * Compute the readiness verdict from live dashboard data. Works with calendar
 * alone (training and sleep held neutral) or with a wearable (real training
 * load + baseline, and sleep when the provider reports it).
 */
export function dashboardVerdict(
  work: WorkHealthMetrics,
  actuals: WearableActuals | null,
  weekAhead: WeekDayHours[] | null = null,
  /** The user's local date (YYYY-MM-DD); the forecast is aligned to it. */
  todayDate: string = new Date().toLocaleDateString('sv-SE')
): DashboardVerdict {
  const focus = work.adaptivePerformanceIndex;
  const strain = work.cognitiveResilience;
  const rhythm = work.workRhythmRecovery;
  const wi = workIndex(focus, rhythm, strain);

  const meetingHours = work.schedule?.durationHours ?? 0;
  const workLoad = toWorkLoad(meetingHours);

  // Training: real load + baseline from an activity provider, else neutral so
  // the verdict leans on work alone instead of flagging a phantom training gap.
  const hasTraining = actuals?.trainingBaseline != null;
  const trainingBaseline = actuals?.trainingBaseline ?? DEFAULT_TRAINING_BASELINE;
  const trainingLoadToday = hasTraining ? (actuals?.trainingLoadToday ?? 0) : trainingBaseline;

  // Sleep: a recovery provider's sleep performance (0–100), else neutral.
  const sleepPerformance = actuals?.sleepPerformance;
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
    recovery: actuals?.recovery,
    trainingSpike,
    trainedToday: hasTraining && trainingLoadToday > 0,
    week,
    past: actuals?.keySessions ?? null,
  });

  return {
    ...model,
    verdict: call.verdict,
    tier: VERDICT_TIER[call.verdict],
    rec: call.rec,
    why: call.why,
    label: call.label,
    plan: call.plan,
    knowsTraining: actuals?.keySessions != null,
    workLoad,
    workIndexValue: wi,
    focus,
    rhythm,
    strain,
    trainingBaseline: actuals?.trainingBaseline ?? null,
    weekActivityCount: actuals?.weekActivityCount ?? null,
    trainingLoadToday: actuals?.trainingLoadToday ?? null,
  };
}
