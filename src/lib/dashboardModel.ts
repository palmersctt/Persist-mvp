import { scoreFromWork, type DashboardVerdict } from './engine/scoreDay';
import { NO_HISTORY, type PastDays } from './engine/history';
import type { WorkHealthMetrics } from '../hooks/useWorkHealth';
import type { WearableActuals } from './wearables/types';
import type { WeekDayHours } from './weekAhead';

// Maps the dashboard's real signals — calendar work-health + a wearable's
// training load and sleep — into the engine (src/lib/engine), in day-1 mode
// (no per-day history yet, so the prior carries the baseline). trainingFeel
// has no real signal yet, so it's held neutral; sleep is neutral without a
// provider that reports it.

export type { DashboardVerdict };

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
  todayDate: string = new Date().toLocaleDateString('sv-SE'),
  /** The user's logged days before today (see engine/history.ts). */
  past: PastDays = NO_HISTORY
): DashboardVerdict {
  return scoreFromWork(
    {
      focus: work.adaptivePerformanceIndex,
      strain: work.cognitiveResilience,
      rhythm: work.workRhythmRecovery,
      meetingHours: work.schedule?.durationHours ?? 0,
    },
    {
      training: actuals
        ? {
            loadToday: actuals.trainingLoadToday,
            baseline: actuals.trainingBaseline,
            weekActivityCount: actuals.weekActivityCount,
            keySessions: actuals.keySessions,
          }
        : undefined,
      sleep: actuals?.sleepPerformance,
      recovery: actuals?.recovery,
    },
    weekAhead,
    todayDate,
    // Estimated work scores came from no calendar at all.
    work.breakdown?.source === 'estimated' ? 'unknown' : 'full',
    past
  );
}
