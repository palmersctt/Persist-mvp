import type { ModelResult, Verdict } from './model';

// The session call: what today is FOR, decided at the level of the week.
//
// The readiness model answers "how loaded am I against my baseline". A coach
// answers a different question: which days carry the week's key sessions, and
// what kind of day is this one. The rules here come from how ultra coaches
// actually schedule (see thoughts/shared/research/2026-11-12-training-logic.md):
//
//   · Hard and long are different key sessions. Hard = intensity. Long = duration.
//   · Few key sessions, spaced apart: at most two hard and one long in any
//     seven days, and never two key sessions on consecutive days.
//   · Key sessions go where life is light — the lightest eligible work days.
//   · A heavy or draining day gates INTENSITY, not volume: keep the easy run,
//     move the key session. It is not a reason to rest.
//   · Rest is called on evidence (a training spike, a truly draining day,
//     poor recovery), never on an empty calendar or missing data.

export type SessionKind = 'hard' | 'long';
export type DayRole = SessionKind | 'easy';

/** One day of calendar forecast. Index 0 of a week is today. */
export interface WeekDay {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** Forecast work load for the day, same units as the model's workLoad. */
  workLoad: number;
}

/** A key session already done. daysAgo 0 = earlier today. */
export interface PastSession {
  daysAgo: number;
  kind: SessionKind;
}

export interface PlannedDay extends WeekDay {
  role: DayRole;
  /** Work load at or over the heavy line — no key session is placed here. */
  heavy: boolean;
  /** The key session on this day is already done (today only). */
  done: boolean;
}

export const HARD_PER_WEEK = 2;
export const LONG_PER_WEEK = 1;
/** ~6.5 meeting hours. At or above this, a day is too heavy for a key session. */
export const HEAVY_WORK_LOAD = 72;

const WINDOW = 7;

/**
 * Place the week's key sessions on the days ahead. Long goes first (it needs
 * the most room), then hard, each on the lightest eligible day. `past` holds
 * the key sessions of the last six days plus today, so spacing and the weekly
 * count respect what has already been done. `blockToday` keeps today easy
 * (used when today is gated) and shifts its session to a later day.
 */
export function planWeek(
  days: WeekDay[],
  past: PastSession[] = [],
  { blockToday = false }: { blockToday?: boolean } = {}
): PlannedDay[] {
  // Day offset → the key session on it. Negative = past, 0 = today.
  const taken = new Map<number, SessionKind>();
  for (const s of past) {
    if (s.daysAgo >= 0 && s.daysAgo < WINDOW) taken.set(-s.daysAgo, s.kind);
  }
  const doneToday = taken.has(0);

  const fits = (d: number, kind: SessionKind, limit: number): boolean => {
    if (taken.has(d) || taken.has(d - 1) || taken.has(d + 1)) return false;
    // No seven-day window containing d may exceed the limit.
    for (let start = d - (WINDOW - 1); start <= d; start++) {
      let count = 1;
      for (let i = start; i < start + WINDOW; i++) if (taken.get(i) === kind) count++;
      if (count > limit) return false;
    }
    return true;
  };

  // Lightest first; earlier day wins a tie.
  const order = days
    .map((day, i) => ({ i, load: day.workLoad }))
    .filter(({ i, load }) => load < HEAVY_WORK_LOAD && !(blockToday && i === 0))
    .sort((a, b) => a.load - b.load || a.i - b.i);

  const place = (kind: SessionKind, limit: number) => {
    for (const { i } of order) if (fits(i, kind, limit)) taken.set(i, kind);
  };
  place('long', LONG_PER_WEEK);
  place('hard', HARD_PER_WEEK);

  return days.map((day, i) => ({
    ...day,
    role: taken.get(i) ?? 'easy',
    heavy: day.workLoad >= HEAVY_WORK_LOAD,
    done: i === 0 && doneToday,
  }));
}

// ─── Today's call ───────────────────────────────────────────────────────────

export interface CallInputs {
  model: Pick<ModelResult, 'verdict' | 'readiness' | 'feel' | 'acwr'>;
  /** Today's forecast work load. */
  workLoad: number;
  /** Sleep 0–100, when a provider reports it. */
  sleep?: number;
  /** Recovery 0–100, when a provider reports it. */
  recovery?: number;
  /** Today's logged training is far over the training baseline. */
  trainingSpike: boolean;
  /** The days ahead (index 0 = today); null when there is no forecast. */
  week: WeekDay[] | null;
  /** Key sessions of the last six days and today; null when unknown. */
  past: PastSession[] | null;
}

export interface SessionCall {
  verdict: Verdict;
  /** The short action label for the card. */
  label: string;
  rec: string;
  why: string;
  /** The week as planned, or null without a forecast. */
  plan: PlannedDay[] | null;
}

const DRAINED = -0.16;
const DEEPLY_DRAINED = -0.35;
const SHORT_SLEEP = 50;
const VERY_SHORT_SLEEP = 35;
const LOW_RECOVERY = 34;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "tomorrow", or the weekday name, for a plan index. */
export function dayName(plan: WeekDay[], index: number): string {
  if (index === 1) return 'tomorrow';
  const d = new Date(`${plan[index].date}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? `in ${index} days` : WEEKDAYS[d.getUTCDay()];
}

/** Where the next key session of each kind sits after today, e.g. "the hard session to Thursday". */
function movedTo(plan: PlannedDay[] | null): string {
  if (!plan) return '';
  const next = plan.findIndex((d, i) => i > 0 && d.role !== 'easy');
  if (next < 0) return '';
  const kind = plan[next].role === 'long' ? 'long run' : 'hard session';
  return ` Save the ${kind} for ${dayName(plan, next)}, the lightest day ahead.`;
}

/**
 * Turn the model's read into a session call. Order matters: evidence for rest
 * first, then the intensity gate, then the week's plan, then an ordinary day.
 */
export function sessionCall(input: CallInputs): SessionCall {
  const { model, workLoad, sleep, recovery, trainingSpike, week, past } = input;
  const knowsTraining = past !== null;
  const lowRecovery = typeof recovery === 'number' && recovery < LOW_RECOVERY;
  const shortSleep = typeof sleep === 'number' && sleep < SHORT_SLEEP;
  const veryShortSleep = typeof sleep === 'number' && sleep < VERY_SHORT_SLEEP;

  // 1. Recover — only on evidence.
  const recoverWhy = trainingSpike
    ? 'Today’s training is far over what you’re built for. That is a real spike, and the adaptation comes from the rest that follows it.'
    : model.feel < DEEPLY_DRAINED
      ? 'The day is both heavy and badly shaped, and it has taken more than it gave back. Take the stimulus off.'
      : veryShortSleep || (lowRecovery && shortSleep)
        ? 'Sleep and recovery are both well down. Training on top of that digs the hole deeper.'
        : null;
  if (recoverWhy) {
    const plan = week ? planWeek(week, past ?? [], { blockToday: true }) : null;
    return {
      verdict: 'Survival',
      label: 'Recover',
      rec: 'Recover — easy or full rest.',
      why: recoverWhy + movedTo(plan),
      plan,
    };
  }

  // 2. Easy only — the day gates intensity, not volume.
  const heavyDay = workLoad >= HEAVY_WORK_LOAD || model.verdict === 'Survival';
  const gateWhy =
    model.feel < DRAINED
      ? 'The day is draining more than it gives back.'
      : heavyDay
        ? 'Work is heavy today.'
        : shortSleep
          ? 'Sleep was short.'
          : lowRecovery
            ? 'Recovery is low.'
            : null;
  if (gateWhy) {
    const plan = week ? planWeek(week, past ?? [], { blockToday: true }) : null;
    return {
      verdict: 'Grinding',
      label: 'Easy only',
      rec: 'Easy only — keep the miles, skip the intensity.',
      why: `${gateWhy} That costs you intensity, not volume: an easy run still counts.${movedTo(plan)}`,
      plan,
    };
  }

  // 3. The week's plan.
  const plan = week ? planWeek(week, past ?? []) : null;
  const today = plan?.[0];
  if (today && today.role !== 'easy' && !today.done) {
    const long = today.role === 'long';
    const session = long ? 'long run' : 'hard session';
    if (knowsTraining) {
      return {
        verdict: 'Locked In',
        label: long ? 'Go long' : 'Go hard',
        rec: long ? 'Go long — today has the room for it.' : 'Go hard — this is the day for it.',
        why: `Of the days ahead, today is the lightest that fits a ${session}, and it is clear of your last key session. ${
          long
            ? 'Long is about time on feet, not pace.'
            : 'Hard days hard, so the easy days can be easy.'
        }`,
        plan,
      };
    }
    // Without training history the app can't say a session is due — only that
    // today is the best day for one.
    return {
      verdict: 'Flow',
      label: 'Train normally',
      rec: `Train normally — and if you have a ${session} this week, today is the day for it.`,
      why: `Today is the lightest day ahead on your calendar. Connect a wearable and the call will know what you have already done this week.`,
      plan,
    };
  }

  // 4. An ordinary day.
  if (today?.done) {
    return {
      verdict: 'Coasting',
      label: 'Optional',
      rec: 'Key session done — anything more is optional.',
      why: 'You have already done today’s key session. Easy movement is fine; more intensity is not the point.',
      plan,
    };
  }
  const nextKey = plan ? plan.findIndex((d, i) => i > 0 && d.role !== 'easy') : -1;
  const ahead =
    plan && nextKey > 0
      ? ` Your next ${plan[nextKey].role === 'long' ? 'long run' : 'hard session'} fits best ${
          nextKey === 1 ? 'tomorrow' : `on ${dayName(plan, nextKey)}`
        }.`
      : '';
  if (model.readiness >= 66 || model.feel > 0.12) {
    return {
      verdict: 'Flow',
      label: 'Train normally',
      rec: 'Train normally — an easy aerobic day.',
      why: `Nothing today argues for backing off, and no key session belongs here. Easy volume is what the week is built on.${ahead}`,
      plan,
    };
  }
  return {
    verdict: 'Coasting',
    label: 'Optional',
    rec: 'Train if you want — nothing’s pushing either way.',
    why: `Load and balance are both flat. An easy session fits; so does a day off.${ahead}`,
    plan,
  };
}
