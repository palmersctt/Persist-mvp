import { runModel, workIndex, type DayInputs, type ModelResult, type Prior } from './model';
import type { WorkHealthMetrics } from '../hooks/useWorkHealth';
import type { WearableActuals } from './wearables/types';

// Maps the dashboard's real signals — calendar work-health + Strava training
// load — into the readiness model, in day-1 mode (no per-day history yet, so
// the prior carries the baseline). trainingFeel and sleep have no real signal
// yet, so they're held neutral.

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** Meeting hours → work load units. Tunable. */
const WORK_LOAD_PER_HOUR = 11;
/** Work-load baseline until we persist per-user work-load history. */
const DEFAULT_WORK_BASELINE = 55;
/** Training baseline assumed when no activity provider is connected. */
const DEFAULT_TRAINING_BASELINE = 30;

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
}

/**
 * Compute the readiness verdict from live dashboard data. Works with calendar
 * alone (training held neutral) or with Strava (real training load + baseline).
 */
export function dashboardVerdict(
  work: WorkHealthMetrics,
  actuals: WearableActuals | null
): DashboardVerdict {
  const focus = work.adaptivePerformanceIndex;
  const strain = work.cognitiveResilience;
  const rhythm = work.workRhythmRecovery;
  const wi = workIndex(focus, rhythm, strain);

  const meetingHours = work.schedule?.durationHours ?? 0;
  const workLoad = clamp(Math.round(meetingHours * WORK_LOAD_PER_HOUR), 0, 120);

  // Training: real load + baseline from an activity provider, else neutral so
  // the verdict leans on work alone instead of flagging a phantom training gap.
  const hasTraining = actuals?.trainingBaseline != null;
  const trainingBaseline = actuals?.trainingBaseline ?? DEFAULT_TRAINING_BASELINE;
  const trainingLoadToday = hasTraining ? (actuals?.trainingLoadToday ?? 0) : trainingBaseline;

  const prior: Prior = {
    load: DEFAULT_WORK_BASELINE + trainingBaseline,
    trainingLoad: trainingBaseline,
  };
  const today: DayInputs = {
    workLoad,
    workIndex: wi,
    trainingLoad: trainingLoadToday,
    trainingFeel: 0, // no per-session feel signal yet
    sleep: 62, // neutral — no sleep source on Strava
  };

  return {
    ...runModel(prior, [], today),
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
