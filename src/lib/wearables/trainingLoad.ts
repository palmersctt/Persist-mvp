// ─── Training-load freshness: the capacity proxy ────────────────────────────
//
// Provider-neutral: any provider that logs sessions can feed this. We
// estimate how rested the body is from the shape of recent training. Two exponentially-weighted averages of
// daily load — chronic (fitness, ~42d) and acute (fatigue, ~7d) — give
// "form" (chronic − acute). Positive form means recent load sits below your
// baseline: rested and ready. Negative form means you're carrying fatigue.
// Form maps onto a 0–100 freshness score that stands in for recovery in the
// readiness equation. A heuristic, not a lab test — but enough to answer
// "how hard to train today" without a body-state device.

export const CTL_DAYS = 42;
export const ATL_DAYS = 7;
const CTL_DECAY = 1 - Math.exp(-1 / CTL_DAYS);
const ATL_DECAY = 1 - Math.exp(-1 / ATL_DAYS);
export const DAY_MS = 86400000;

export type LoadInput = { start_date?: string; suffer_score?: number | null; moving_time?: number };

/** One activity's training load: relative effort if the provider reports it, else ~1 per minute moved. */
export function activityLoad(a: LoadInput): number {
  if (typeof a.suffer_score === 'number' && a.suffer_score > 0) return a.suffer_score;
  return Math.round((a.moving_time ?? 0) / 60);
}

/**
 * Map a trailing window of activities to a 0–100 freshness score for `date`
 * (YYYY-MM-DD). Buckets load by UTC day, then walks the impulse-response
 * model day by day, converting the final form (chronic − acute load) to
 * freshness. Returns null when there's no usable training to read.
 */
export function freshnessFromActivities(activities: LoadInput[], date: string): number | null {
  const byDay = new Map<string, number>();
  for (const a of activities) {
    if (!a.start_date) continue;
    const day = a.start_date.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + activityLoad(a));
  }
  if (byDay.size === 0) return null;

  const end = new Date(`${date}T00:00:00Z`).getTime();
  const start = end - (CTL_DAYS + ATL_DAYS) * DAY_MS;
  let ctl = 0;
  let atl = 0;
  for (let t = start; t <= end; t += DAY_MS) {
    const load = byDay.get(new Date(t).toISOString().slice(0, 10)) ?? 0;
    ctl += (load - ctl) * CTL_DECAY;
    atl += (load - atl) * ATL_DECAY;
  }
  const form = ctl - atl;
  return Math.min(98, Math.max(5, Math.round(50 + form * 1.3)));
}

/**
 * Training-load profile for `date`: the chronic baseline (the daily EWMA of
 * load — "what you're built for") and today's logged load. Feeds the
 * readiness model's prior and today's training input.
 */
export function trainingLoadProfile(
  activities: LoadInput[],
  date: string
): { baseline: number; today: number } {
  const byDay = new Map<string, number>();
  for (const a of activities) {
    if (!a.start_date) continue;
    const day = a.start_date.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + activityLoad(a));
  }
  const end = new Date(`${date}T00:00:00Z`).getTime();
  const start = end - (CTL_DAYS + ATL_DAYS) * DAY_MS;
  let ctl = 0;
  for (let t = start; t <= end; t += DAY_MS) {
    ctl += ((byDay.get(new Date(t).toISOString().slice(0, 10)) ?? 0) - ctl) * CTL_DECAY;
  }
  return { baseline: Math.round(ctl), today: Math.round(byDay.get(date) ?? 0) };
}
