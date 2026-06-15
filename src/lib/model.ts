// The readiness model.
//
// One shared load currency for work + training, a prior-seeded baseline so
// there's a real verdict on day one, and a SINGLE verdict (no competing
// calendar-only "work mood"). Replaces the old capacity−tax readiness model.
//
//   load      = workLoad + trainingLoad                    (one currency)
//   baseline  = 21-day EWMA, SEEDED FROM A PRIOR           (backfill, not waiting)
//   recent    = 7-day EWMA
//   ACWR      = recent / baseline                          (am I doing more than I'm built for?)
//   balance   = slow EWMA of signed restoration            (is it filling or draining me?)
//
// The three card scores are Readiness (headline), Load (recent vs baseline),
// and Balance (restoration). Work no longer produces a mood — it produces a
// Work Index (an objective aggregate of Focus/Balance/Strain) that becomes the
// work half of Balance.

export type Verdict = 'Survival' | 'Grinding' | 'Coasting' | 'Locked In' | 'Flow';
export type Tier = 'bad' | 'ok' | 'good';

/** The verdict drives the card's tier/gradient — one verdict, one tier. */
export const VERDICT_TIER: Record<Verdict, Tier> = {
  Survival: 'bad',
  Grinding: 'ok',
  Coasting: 'ok',
  'Locked In': 'good',
  Flow: 'good',
};

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// EWMA smoothing — the window is a lookback at connect, not a waiting period.
const L_CHRONIC = 2 / (21 + 1);
const L_ACUTE = 2 / (7 + 1);
const L_FEEL = 2 / (7 + 1);
const SLEEP_NEUTRAL = 62;

export interface DayInputs {
  /** Work volume from the calendar (meeting load), ~0..120. */
  workLoad: number;
  /** Objective 0–100 aggregate of Focus/Balance/Strain (see workIndex). */
  workIndex: number;
  /** Training load (Strava relative effort or duration proxy). */
  trainingLoad: number;
  /** Training valence in −1..+1 (0 when there's no signal yet). */
  trainingFeel: number;
  /** Sleep 0–100 (62 = neutral when unknown). */
  sleep: number;
}

/** The baseline seed — from backfilled history (Strava/Calendar) or a default. */
export interface Prior {
  load: number;
  trainingLoad: number;
}

/**
 * Work Index: an objective 0–100 read of the workday's shape. Independent of
 * volume (that's workLoad) — it answers "good-heavy or bad-heavy". Polarity:
 * Focus↑ good, Balance↑ good, Strain↑ bad.
 */
export function workIndex(focus: number, balance: number, strain: number): number {
  return clamp(0.3 * focus + 0.3 * balance + 0.4 * (100 - strain), 0, 100);
}

/** Work Index (0–100) → restoration valence in −1..+1. */
function workValence(d: DayInputs): number {
  return (d.workIndex - 50) / 50;
}

export interface TracePoint {
  load: number;
  restore: number;
  chronic: number;
  acute: number;
  feel: number;
}

export interface ModelResult {
  readiness: number;
  load: number;
  balance: number;
  acwr: number;
  trainingAcwr: number;
  feel: number;
  verdict: Verdict;
  tier: Tier;
  rec: string;
  why: string;
  trace: TracePoint[];
  days: number;
}

/**
 * Run the model for `today`, given a baseline `prior` and any logged `history`.
 * The baseline (chronic) STAYS at the prior on day one — it is never
 * bootstrapped from the user's first logged day — so ACWR is meaningful
 * immediately and the EWMA drifts it toward personal reality as days log.
 */
export function runModel(prior: Prior, history: DayInputs[], today: DayInputs): ModelResult {
  const days = history.concat([today]);
  let chronic = prior.load,
    acute = prior.load,
    tChronic = prior.trainingLoad,
    tAcute = prior.trainingLoad,
    feel = 0,
    started = false;
  const trace: TracePoint[] = [];

  for (const d of days) {
    const dayLoad = d.workLoad + d.trainingLoad;
    const restore = (d.workLoad * workValence(d) + d.trainingLoad * d.trainingFeel) / 100;
    if (!started) {
      // baseline stays = prior; recent + feel jump to the first real day
      acute = dayLoad;
      tAcute = d.trainingLoad;
      feel = restore;
      started = true;
    } else {
      chronic = lerp(chronic, dayLoad, L_CHRONIC);
      acute = lerp(acute, dayLoad, L_ACUTE);
      tChronic = lerp(tChronic, d.trainingLoad, L_CHRONIC);
      tAcute = lerp(tAcute, d.trainingLoad, L_ACUTE);
      feel = lerp(feel, restore, L_FEEL);
    }
    trace.push({ load: dayLoad, restore, chronic, acute, feel });
  }

  const acwr = chronic > 2 ? acute / chronic : 1.0;
  const trainingAcwr = tChronic > 2 ? tAcute / tChronic : 1.0;

  // baseline-fit: reward ACWR near 1.0; penalize spike (>1.15) and slump (<0.85)
  let fit: number;
  if (acwr >= 0.85 && acwr <= 1.15) fit = 100;
  else if (acwr > 1.15) fit = clamp(100 - (acwr - 1.15) * 160, 5, 100);
  else fit = clamp(100 - (0.85 - acwr) * 120, 25, 100);

  const feelScore = clamp(50 + feel * 78, 0, 100);
  // being "adapted" to a draining routine isn't good — discount fit when feel<0
  const effFit = fit * (1 + Math.min(0, feel) * 0.7);
  const readiness = Math.round(
    clamp(0.45 * effFit + 0.45 * feelScore + (today.sleep - SLEEP_NEUTRAL) * 0.35, 0, 100)
  );
  const load = Math.round(
    clamp((acwr - 0.7) * 120 - (feel > 0 ? feel * 18 : 0) + (feel < 0 ? -feel * 22 : 0), 0, 100)
  );
  const balance = Math.round(feel * 100);

  const { verdict, rec, why } = recommend(acwr, trainingAcwr, readiness, feel, days.length);
  return {
    readiness,
    load,
    balance,
    acwr,
    trainingAcwr,
    feel,
    verdict,
    tier: VERDICT_TIER[verdict],
    rec,
    why,
    trace,
    days: days.length,
  };
}

function recommend(
  a: number,
  ta: number,
  v: number,
  feel: number,
  days: number
): { verdict: Verdict; rec: string; why: string } {
  if (a > 1.32 || v < 42) {
    return {
      verdict: 'Survival',
      rec: 'Recover — easy or full rest.',
      why:
        a > 1.32
          ? `Recent load is ${a.toFixed(2)}× your baseline — a real spike relative to what you're built for, not just a busy day. Ease off until it settles back toward your usual.`
          : `Readiness is low and the days have drained more than they've given back. Take the stimulus off; the budget's spent.`,
    };
  }
  if (ta < 0.82 && v >= 58) {
    return {
      verdict: 'Locked In',
      rec: 'Go hard — there’s a training gap.',
      why: `Overall load is near your usual, but training specifically is at ${ta.toFixed(2)}× its baseline and you're filled. A busy work day isn't a reason to skip — there's a real gap to fill.`,
    };
  }
  if (feel < -0.16) {
    return {
      verdict: 'Grinding',
      rec: 'Keep it moderate — protect your balance.',
      why: `Load is in your band but the week has skewed draining (balance ${Math.round(feel * 100)}). A light, chosen session beats a hard one right now, even though nothing looks heavy.`,
    };
  }
  if (v >= 66 || feel > 0.12) {
    return {
      verdict: 'Flow',
      rec: 'Train normally — you’re in your band.',
      why: `You're at ${a.toFixed(2)}× your baseline — trained for the life you're living. ${
        days <= 1
          ? 'The read holds on day one because the baseline came from your history, not from waiting.'
          : "Steady days at this level don't dig a hole — your baseline absorbs them."
      }`,
    };
  }
  return {
    verdict: 'Coasting',
    rec: 'Train if you want — nothing’s pushing either way.',
    why: `Load and balance are both flat — in your band, but nothing's forcing a hard call. A normal session fits; so does a rest day.`,
  };
}
