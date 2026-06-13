import type { WearableActuals } from './wearables/types';

// Forecast × actual fusion: the READINESS algorithm.
//
// The calendar scores quantify what the workday COSTS (Focus/Strain/Balance
// → demand). The wearable quantifies what the body HAS (recovery, sleep →
// capacity). Readiness is what's left to train with at any moment of the
// day — the workday's tax is applied as meeting minutes actually elapse,
// so a 6am check and a 6pm check give different, honest answers.
//
//   capacity   = recovery − shortSleepPenalty                  (0..100)
//   demand     = 0.5·strain + 0.3·(100−balance) + 0.2·(100−focus)
//   cost       = clamp((demand − 20) / 80, 0..1)               (light days cost ~0)
//   tax        = MAX_WORKDAY_TAX · cost                        (≤ 45 points)
//   readiness(t)= capacity − tax · spentFraction(t)
//
// Pure functions only — everything here is unit-testable.

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

export type ReadinessBand = 'prime' | 'maintain' | 'recover';
export type DayPhase = 'morning' | 'workday' | 'clear';

export interface ReadinessState {
  phase: DayPhase;
  /** Readiness right now (null without recovery data). */
  readinessNow: number | null;
  /** Readiness projected for when the calendar clears. */
  readinessEndOfDay: number | null;
  /** Band for the actionable training window (now in morning/clear, end-of-day mid-workday). */
  band: ReadinessBand | null;
  /** How much of capacity the full workday takes, 0..1. */
  workdayCost: number;
  meetingsRemaining: number;
  /** When the calendar clears (last event end), if still ahead. */
  clearISO: string | null;
  headline: string;
  detail: string;
}

/** A brutal workday can take at most this many points of readiness. */
export const MAX_WORKDAY_TAX = 45;
/** Band thresholds: ≥65 train hard, 40–64 keep it easy, <40 recovery day. */
export const PRIME_THRESHOLD = 65;
export const MAINTAIN_THRESHOLD = 40;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const clamp100 = (n: number) => Math.round(Math.min(100, Math.max(0, n)));

/** What the body brought today: recovery, penalized for short sleep. */
export function bodyCapacity(actuals: WearableActuals): number | null {
  if (actuals.recovery == null) return null;
  let capacity = actuals.recovery;
  if (actuals.sleepHours != null && actuals.sleepHours < 6) {
    capacity -= (6 - actuals.sleepHours) * 8;
  }
  return clamp100(capacity);
}

/** How much of an athlete's capacity this calendar burns, 0..1. */
export function workdayCost(forecast: ForecastScores): number {
  const demand =
    0.5 * forecast.strain + 0.3 * (100 - forecast.balance) + 0.2 * (100 - forecast.focus);
  return clamp01((demand - 20) / 80);
}

/** Display verdicts for each band — the single vocabulary used everywhere. */
export const VERDICTS: Record<ReadinessBand, string> = {
  prime: 'Train hard',
  maintain: 'Keep it easy',
  recover: 'Recovery day',
};

export function readinessBand(readiness: number): ReadinessBand {
  if (readiness >= PRIME_THRESHOLD) return 'prime';
  if (readiness >= MAINTAIN_THRESHOLD) return 'maintain';
  return 'recover';
}

/** Fraction of the day's meeting minutes already elapsed at `now`, 0..1. */
export function spentFraction(now: Date, dayShape: DayShape | null): number {
  const events = dayShape?.events ?? [];
  let total = 0;
  let spent = 0;
  for (const e of events) {
    const start = new Date(e.startISO).getTime();
    const end = new Date(e.endISO).getTime();
    if (end <= start) continue;
    total += end - start;
    spent += Math.min(Math.max(now.getTime() - start, 0), end - start);
  }
  return total === 0 ? 1 : spent / total;
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
    // Activity provider — compare the calendar's demands with logged training
    if (actuals.weekActivityCount == null) return null;
    if (actuals.weekActivityCount === 0) {
      return heavyDay
        ? 'Nothing logged this week and the calendar keeps taking. The training debt is growing.'
        : 'Nothing logged this week — and today’s forecast leaves room to fix that.';
    }
    const n = actuals.weekActivityCount;
    const logged = `${n} ${n === 1 ? 'session' : 'sessions'} logged this week`;
    return heavyDay
      ? `${logged} against a heavy calendar. You’re keeping the deal.`
      : `${logged}, light forecast today. Keep the streak honest.`;
  }

  const capacity = bodyCapacity(actuals)!;
  if (heavyDay && capacity < MAINTAIN_THRESHOLD) {
    return `Forecast and actuals disagree: your calendar wants a big day, but recovery is at ${actuals.recovery}%. Guard every break you have.`;
  }
  if (heavyDay && capacity >= PRIME_THRESHOLD) {
    return `Heavy forecast, but you showed up charged — recovery at ${actuals.recovery}%. Today is survivable, maybe even good.`;
  }
  if (heavyDay) {
    return `Heavy forecast on a middling tank (recovery ${actuals.recovery}%). Spend your energy on the meetings that matter.`;
  }
  if (lightDay && capacity >= PRIME_THRESHOLD) {
    return `Light forecast, full tank (recovery ${actuals.recovery}%). This is the day for the big session.`;
  }
  if (lightDay && capacity < MAINTAIN_THRESHOLD) {
    return `The light calendar is lucky — recovery is at ${actuals.recovery}% and your body needs the slack.`;
  }
  return `Forecast and actuals roughly agree today (recovery ${actuals.recovery}%). Pace the workday and you end it with something left to train on.`;
}

interface Message {
  headline: string;
  detail: string;
}

function messageWithoutRecoveryData(
  phase: DayPhase,
  actuals: WearableActuals | null,
  meetingsRemaining: number,
  clearTime: string | null
): Message {
  // Activity provider (Strava): the value is closing the loop on logged training
  if (actuals) {
    if (phase === 'clear') {
      const loggedToday =
        actuals.lastActivity && actuals.lastActivity.startISO.startsWith(actuals.date);
      if (loggedToday) {
        return {
          headline: 'Workday clear — today’s session is already logged',
          detail: `${describeActivity(actuals.lastActivity!)} today. Loop closed.`,
        };
      }
      return {
        headline: 'Workday clear — go train',
        detail: actuals.lastActivity
          ? `Last logged: ${describeActivity(actuals.lastActivity)}. The evening is wide open.`
          : 'Nothing logged this week yet. The evening is wide open.',
      };
    }
    return {
      headline: phase === 'morning' ? 'Morning window open' : 'Workday in progress',
      detail: `${plural(meetingsRemaining, 'meeting')} between you and your next training window${clearTime ? ` — calendar clears at ${clearTime}` : ''}.`,
    };
  }

  // No wearable at all
  if (phase === 'clear') {
    return {
      headline: 'Workday clear',
      detail: 'Connect a wearable to see what you have left to train with.',
    };
  }
  return {
    headline: phase === 'morning' ? 'Morning window open' : 'Workday in progress',
    detail: `${plural(meetingsRemaining, 'meeting')} on the calendar${clearTime ? `, clear at ${clearTime}` : ''}. Connect a wearable to see your readiness.`,
  };
}

/**
 * The forecast × actual fusion. Combines calendar scores (what the workday
 * costs) with wearable capacity (what the body has) into time-aware
 * readiness — valid for a 6am session before the chaos or a 6pm session
 * after it.
 */
export function computeReadiness(
  now: Date,
  dayShape: DayShape | null,
  forecast: ForecastScores,
  actuals: WearableActuals | null
): ReadinessState {
  const cost = workdayCost(forecast);
  const events = dayShape?.events ?? [];
  const remaining = events.filter((e) => new Date(e.endISO) > now);
  const meetingsRemaining = remaining.length;
  const firstStart = dayShape?.firstEventStartISO ? new Date(dayShape.firstEventStartISO) : null;
  const clearDate =
    remaining.length > 0
      ? new Date(Math.max(...remaining.map((e) => new Date(e.endISO).getTime())))
      : null;
  const clearTime = clearDate ? formatClockTime(clearDate) : null;

  const phase: DayPhase =
    meetingsRemaining === 0 ? 'clear' : firstStart && now < firstStart ? 'morning' : 'workday';

  const capacity = actuals ? bodyCapacity(actuals) : null;

  if (capacity === null) {
    return {
      phase,
      readinessNow: null,
      readinessEndOfDay: null,
      band: null,
      workdayCost: cost,
      meetingsRemaining,
      clearISO: clearDate ? clearDate.toISOString() : null,
      ...messageWithoutRecoveryData(phase, actuals, meetingsRemaining, clearTime),
    };
  }

  const tax = MAX_WORKDAY_TAX * cost;
  const readinessNow = clamp100(capacity - tax * spentFraction(now, dayShape));
  const readinessEndOfDay = clamp100(capacity - tax);
  const nowBand = readinessBand(readinessNow);
  const endBand = readinessBand(readinessEndOfDay);
  const recovery = actuals!.recovery!;
  const sleepClause = actuals!.sleepHours != null ? `, ${actuals!.sleepHours}h sleep` : '';

  let message: Message;
  let band: ReadinessBand;

  if (phase === 'morning') {
    band = nowBand;
    const headlineByBand: Record<ReadinessBand, string> = {
      prime: 'Morning window — train hard',
      maintain: 'Morning window — keep it easy',
      recover: 'Morning check — recovery day',
    };
    let detail: string;
    if (nowBand === 'recover') {
      detail = `Readiness ${readinessNow} (recovery ${recovery}%${sleepClause}). The tank is empty before the workday even starts. Today is about absorbing, not adding.`;
    } else if (endBand !== nowBand) {
      detail = `Readiness ${readinessNow} now, ~${readinessEndOfDay} after the workday takes its share (recovery ${recovery}%${sleepClause}). If today has a hard session in it, it’s this morning.`;
    } else {
      detail = `Readiness ${readinessNow}, and today’s calendar only costs ~${Math.round(tax)} points (recovery ${recovery}%${sleepClause}). Morning or evening — both windows work.`;
    }
    message = { headline: headlineByBand[band], detail };
  } else if (phase === 'workday') {
    // Mid-workday: the actionable decision is the evening session — plan on
    // the projection, not the moment
    band = endBand;
    const headlineByBand: Record<ReadinessBand, string> = {
      prime: 'On track — evening session is a go',
      maintain: 'On track for an easy evening session',
      recover: 'Tonight is a recovery night',
    };
    message = {
      headline: headlineByBand[band],
      detail: `Readiness ${readinessNow} now → ~${readinessEndOfDay} when the calendar clears${clearTime ? ` at ${clearTime}` : ''}. ${plural(meetingsRemaining, 'meeting')} still to absorb.`,
    };
  } else {
    band = endBand;
    const messages: Record<ReadinessBand, Message> = {
      prime: {
        headline: 'Workday clear — train hard',
        detail: `Readiness ${readinessEndOfDay} (recovery ${recovery}%${sleepClause}). The workday barely taxed it. Make today the quality session.`,
      },
      maintain: {
        headline: 'Workday clear — keep it easy',
        detail: `Readiness ${readinessEndOfDay}. The workday took its share — there’s a session in you, just not a hard one.`,
      },
      recover: {
        headline: 'Workday clear — make it a recovery day',
        detail: `Readiness ${readinessEndOfDay}. Between recovery ${recovery}% and today’s calendar, the tank is spent. A walk counts; hard training resumes tomorrow.`,
      },
    };
    message = messages[band];
  }

  return {
    phase,
    readinessNow,
    readinessEndOfDay,
    band,
    workdayCost: cost,
    meetingsRemaining,
    clearISO: clearDate ? clearDate.toISOString() : null,
    ...message,
  };
}
