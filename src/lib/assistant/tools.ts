// What the MCP tools do, independent of the MCP plumbing. Each returns a
// plain object the route serialises; errors are values, not throws, so the
// assistant gets a clear message to relay.

import { parseDayInput } from '../engine/parse';
import { scoreDay } from '../engine/scoreDay';
import { describeConfidence } from '../engine/confidence';
import {
  HISTORY_WINDOW_DAYS,
  dayBefore,
  historyFrom,
  parseFeel,
  FEEL_LABELS,
} from '../engine/history';
import type { DayStore } from './store';

export type ToolResult<T> = { ok: true; value: T } | { ok: false; error: string };

const DAY_MS = 86_400_000;
const shift = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** The user's local date now in a zone (falls back to UTC). */
export function localToday(timezone: string, now = new Date()): string {
  try {
    return now.toLocaleDateString('sv-SE', { timeZone: timezone });
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export interface VerdictSummary {
  date: string;
  verdict: string;
  label: string;
  readiness: number;
  load: number;
  balance: number;
  action: string;
  why: string;
  drivers: { focus: number; strain: number; rhythm: number; workLoad: number; acwr: number };
  confidence: { level: string; missing: string[]; sentence: string };
  baselineDays: number;
}

/** Score a day from an assistant and save it to the user's history. */
export async function logDay(
  store: DayStore,
  email: string,
  raw: unknown,
  now = new Date()
): Promise<ToolResult<VerdictSummary>> {
  const parsed = parseDayInput(raw);
  if (!parsed.ok) return { ok: false, error: `Invalid day: ${parsed.errors.join('; ')}` };
  const input = parsed.input;
  const today = localToday(input.timezone, now);
  if (input.date !== today && input.date !== dayBefore(today))
    return { ok: false, error: `date must be today (${today}) or yesterday in ${input.timezone}` };

  const rows = await store.days(
    email,
    shift(input.date, -HISTORY_WINDOW_DAYS),
    dayBefore(input.date)
  );
  const past = historyFrom(rows, input.date);
  const r = scoreDay(input, past);
  await store.saveDay(
    email,
    { date: input.date, ...r.inputs, verdict: r.verdict, readiness: r.readiness },
    'assistant'
  );
  return {
    ok: true,
    value: {
      date: input.date,
      verdict: r.verdict,
      label: r.label,
      readiness: r.readiness,
      load: r.load,
      balance: r.balance,
      action: r.rec,
      why: r.why,
      drivers: {
        focus: r.focus,
        strain: r.strain,
        rhythm: r.rhythm,
        workLoad: r.workLoad,
        acwr: Math.round(r.acwr * 100) / 100,
      },
      confidence: {
        level: r.confidence.level,
        missing: r.confidence.missing,
        sentence: describeConfidence(r.confidence),
      },
      baselineDays: past.historyDays,
    },
  };
}

/** The stored verdict for a day (default today in `timezone`). */
export async function getVerdict(
  store: DayStore,
  email: string,
  args: { date?: string; timezone?: string },
  now = new Date()
): Promise<
  ToolResult<{ date: string; verdict: string; readiness: number | null; feel: string | null }>
> {
  const date = args.date ?? localToday(args.timezone ?? 'UTC', now);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'date must be YYYY-MM-DD' };
  const [row] = await store.days(email, date, date);
  if (!row?.verdict)
    return { ok: false, error: `No verdict logged for ${date}. Call log_day first.` };
  return {
    ok: true,
    value: {
      date,
      verdict: row.verdict,
      readiness: row.readiness ?? null,
      feel: row.feelRating ? FEEL_LABELS[row.feelRating] : null,
    },
  };
}

/** Day-by-day verdicts for the last 7 or 30 days. */
export async function getTrend(
  store: DayStore,
  email: string,
  args: { days?: number; timezone?: string },
  now = new Date()
): Promise<
  ToolResult<{
    days: { date: string; verdict: string | null; readiness: number | null; feel: string | null }[];
  }>
> {
  const n = args.days === 30 ? 30 : 7;
  const today = localToday(args.timezone ?? 'UTC', now);
  const rows = await store.days(email, shift(today, -(n - 1)), today);
  return {
    ok: true,
    value: {
      days: rows.map((r) => ({
        date: r.date,
        verdict: r.verdict ?? null,
        readiness: r.readiness ?? null,
        feel: r.feelRating ? FEEL_LABELS[r.feelRating] : null,
      })),
    },
  };
}

/** Record how the day actually felt (1–5), today or yesterday. */
export async function rateDay(
  store: DayStore,
  email: string,
  args: { date?: string; rating?: number; timezone?: string },
  now = new Date()
): Promise<ToolResult<{ date: string; feel: string }>> {
  const today = localToday(args.timezone ?? 'UTC', now);
  const feel = parseFeel({ date: args.date ?? today, rating: args.rating }, today);
  if (!feel.ok) return { ok: false, error: feel.errors.join('; ') };
  const stored = await store.rate(email, feel.date, feel.rating);
  if (!stored) return { ok: false, error: `No day logged for ${feel.date}. Call log_day first.` };
  return { ok: true, value: { date: feel.date, feel: FEEL_LABELS[feel.rating] } };
}
