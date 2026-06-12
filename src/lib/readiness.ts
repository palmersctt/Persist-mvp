import type { WearableActuals } from './wearables/types';

// Forecast vs. actual merge logic.
//
// The calendar is the FORECAST — what today is going to demand (Focus/Strain/
// Balance). The wearable is the ACTUAL — what your body brought to the day
// (recovery providers like WHOOP) or proof you actually got out (activity
// providers like Strava). This module merges the two into one answer: when
// does the workday unlock, and what are you cleared to do once it does?
// Pure functions only, so everything here is unit-testable.

export interface ForecastScores {
  focus: number;
  strain: number;
  balance: number;
}

/** Minimal event timing the work-health API exposes (no titles — times only). */
export interface DayShapeEvent {
  startISO: string;
  endISO: string;
}

export interface DayShape {
  firstEventStartISO: string | null;
  lastEventEndISO: string | null;
  events: DayShapeEvent[];
}

/** How much the body has left in the tank, derived from wearable actuals. */
export type BodyReadiness = 'charged' | 'steady' | 'drained';

export interface UnlockState {
  /** True once nothing is left on the calendar. */
  unlocked: boolean;
  /** When the last remaining event ends (null when already unlocked). */
  unlockISO: string | null;
  meetingsRemaining: number;
  minutesUntilClear: number | null;
  /** null when no wearable is connected or the provider has no recovery data. */
  readiness: BodyReadiness | null;
  headline: string;
  detail: string;
}

/**
 * Bucket recovery into WHOOP-style bands (green ≥ 67, yellow 34–66, red < 34).
 * A green recovery on short sleep gets knocked down a notch — the surplus
 * isn't real if it was borrowed from sleep. Returns null for activity-only
 * providers that don't report recovery.
 */
export function assessBodyReadiness(actuals: WearableActuals): BodyReadiness | null {
  if (actuals.recovery == null) return null;
  if (actuals.recovery >= 67) {
    return actuals.sleepHours != null && actuals.sleepHours < 6 ? 'steady' : 'charged';
  }
  if (actuals.recovery >= 34) return 'steady';
  return 'drained';
}

function formatClockTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function describeActivity(activity: NonNullable<WearableActuals['lastActivity']>): string {
  const distance = activity.distanceKm != null ? ` · ${activity.distanceKm}km` : '';
  return `${activity.type} — ${activity.durationMin}min${distance}`;
}

/**
 * One-line read on how the calendar forecast squares with the actuals.
 * Returns null when the provider has neither recovery nor activity data
 * to compare against.
 */
export function forecastVsActual(
  forecast: ForecastScores,
  actuals: WearableActuals
): string | null {
  const heavyDay = forecast.strain >= 60 || forecast.balance <= 45;
  const lightDay = forecast.strain <= 35 && forecast.focus >= 60;

  if (actuals.recovery == null) {
    // Activity provider — compare the calendar's demands with logged movement
    if (actuals.weekActivityCount == null) return null;
    if (actuals.weekActivityCount === 0) {
      return heavyDay
        ? 'Nothing logged this week and the calendar keeps taking. The trail debt is growing.'
        : 'Nothing logged this week — and today’s forecast leaves room to fix that.';
    }
    const n = actuals.weekActivityCount;
    const logged = `${n} ${n === 1 ? 'activity' : 'activities'} logged this week`;
    return heavyDay
      ? `${logged} against a heavy calendar. You’re keeping the deal.`
      : `${logged}, light forecast today. Keep the streak honest.`;
  }

  const readiness = assessBodyReadiness(actuals);
  if (heavyDay && readiness === 'drained') {
    return `Forecast and actuals disagree: your calendar wants a big day, but recovery is at ${actuals.recovery}%. Guard every break you have.`;
  }
  if (heavyDay && readiness === 'charged') {
    return `Heavy forecast, but you showed up charged — recovery at ${actuals.recovery}%. Today is survivable, maybe even good.`;
  }
  if (heavyDay) {
    return `Heavy forecast on a middling tank (recovery ${actuals.recovery}%). Spend your energy on the meetings that matter.`;
  }
  if (lightDay && readiness === 'charged') {
    return `Light forecast, full tank (recovery ${actuals.recovery}%). This is the day to plan the long ride.`;
  }
  if (lightDay && readiness === 'drained') {
    return `The light calendar is lucky — recovery is at ${actuals.recovery}% and your body needs the slack.`;
  }
  return `Forecast and actuals roughly agree today (recovery ${actuals.recovery}%). Pace it and you end the day with something left.`;
}

function unlockedMessage(actuals: WearableActuals | null): { headline: string; detail: string } {
  if (!actuals) {
    return {
      headline: 'Workday clear',
      detail: 'Connect a wearable to see what your body has left for the trails.',
    };
  }

  const readiness = assessBodyReadiness(actuals);
  if (readiness === null) {
    // Activity provider — the unlock closes the loop on logged movement
    const loggedToday =
      actuals.lastActivity && actuals.lastActivity.startISO.startsWith(actuals.date);
    if (loggedToday) {
      return {
        headline: 'Workday clear — and the trail is already logged',
        detail: `${describeActivity(actuals.lastActivity!)} today. Loop closed.`,
      };
    }
    return {
      headline: 'Workday clear — go log something',
      detail: actuals.lastActivity
        ? `Last logged: ${describeActivity(actuals.lastActivity)}. The evening is wide open.`
        : 'Nothing logged this week yet. The evening is wide open.',
    };
  }

  const sleepClause = actuals.sleepHours != null ? ` on ${actuals.sleepHours}h of sleep` : '';
  const byReadiness: Record<BodyReadiness, { headline: string; detail: string }> = {
    charged: {
      headline: 'Workday clear — hit the trails',
      detail: `Recovery ${actuals.recovery}%${sleepClause}. Your body barely noticed today. Go spend the surplus.`,
    },
    steady: {
      headline: 'Workday clear — an easy ride is earned',
      detail: `Recovery ${actuals.recovery}%. You have something left, just not everything. Keep it conversational-pace.`,
    },
    drained: {
      headline: 'Workday clear — make it a recovery day',
      detail: `Recovery ${actuals.recovery}%. Your body already paid for today. A walk counts; the trails will still be there tomorrow.`,
    },
  };
  return byReadiness[readiness];
}

/**
 * Merge the calendar forecast with wearable actuals into a workday unlock
 * state. The unlock moment is when the last calendar event ends; the message
 * once unlocked depends on what the actuals say.
 */
export function computeUnlock(
  now: Date,
  dayShape: DayShape | null,
  actuals: WearableActuals | null
): UnlockState {
  const readiness = actuals ? assessBodyReadiness(actuals) : null;

  const remaining = (dayShape?.events ?? []).filter((e) => new Date(e.endISO) > now);
  const unlockDate =
    remaining.length > 0
      ? new Date(Math.max(...remaining.map((e) => new Date(e.endISO).getTime())))
      : null;

  if (!unlockDate) {
    return {
      unlocked: true,
      unlockISO: null,
      meetingsRemaining: 0,
      minutesUntilClear: null,
      readiness,
      ...unlockedMessage(actuals),
    };
  }

  const minutesUntilClear = Math.max(0, Math.ceil((unlockDate.getTime() - now.getTime()) / 60000));
  const clearTime = formatClockTime(unlockDate);
  // Events whose end is in the future still count as "to go", including one in progress.
  const meetingsRemaining = remaining.length;

  let detail = `${plural(meetingsRemaining, 'meeting')} between you and the trailhead.`;
  if (readiness === 'drained' && actuals) {
    detail = `${plural(meetingsRemaining, 'meeting')} to go, and recovery is already at ${actuals.recovery}%. Don't let the afternoon eat what's left.`;
  } else if (readiness === 'charged' && actuals) {
    detail = `${plural(meetingsRemaining, 'meeting')} to go. Recovery ${actuals.recovery}% — protect it and the evening is yours.`;
  }

  return {
    unlocked: false,
    unlockISO: unlockDate.toISOString(),
    meetingsRemaining,
    minutesUntilClear,
    readiness,
    headline: `Clear at ${clearTime}`,
    detail,
  };
}
