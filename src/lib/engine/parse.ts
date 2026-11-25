// Validate an untrusted DayInput (from an API body or an assistant's tool
// call). Hand-written: no schema library is installed. Unknown keys are
// ignored; anything present must be well-formed.

import type { MeetingCategory } from './workScores';
import type { DayInput, EmailCounts, EngineMeeting, TrainingInput } from './types';

export type ParseResult = { ok: true; input: DayInput } | { ok: false; errors: string[] };

const CATEGORIES: readonly MeetingCategory[] = [
  'BENEFICIAL',
  'NEUTRAL',
  'FOCUS_WORK',
  'LIGHT_MEETINGS',
  'HEAVY_MEETINGS',
  'COLLABORATIVE',
];

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isDate = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const isInstant = (v: unknown): v is string =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v));

function isTimezone(v: unknown): v is string {
  if (typeof v !== 'string' || v.length === 0) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: v });
    return true;
  } catch {
    return false;
  }
}

export function parseDayInput(raw: unknown): ParseResult {
  const errors: string[] = [];
  if (!isObj(raw)) return { ok: false, errors: ['input must be an object'] };

  if (raw.version !== 1) errors.push('version must be 1');
  if (!isDate(raw.date)) errors.push('date must be YYYY-MM-DD');
  if (!isTimezone(raw.timezone)) errors.push('timezone must be an IANA time zone');

  const count = (path: string, v: unknown, min = 0) => {
    if (v === undefined) return;
    if (!isNum(v) || !Number.isInteger(v) || v < min)
      errors.push(`${path} must be a whole number ≥ ${min}`);
  };
  const amount = (path: string, v: unknown) => {
    if (v === undefined) return;
    if (!isNum(v) || v < 0) errors.push(`${path} must be a number ≥ 0`);
  };
  const percent = (path: string, v: unknown) => {
    if (v === undefined) return;
    if (!isNum(v) || v < 0 || v > 100) errors.push(`${path} must be between 0 and 100`);
  };
  const section = (path: string, v: unknown): Record<string, unknown> | null => {
    if (v === undefined) return null;
    if (!isObj(v)) {
      errors.push(`${path} must be an object`);
      return null;
    }
    return v;
  };

  if (raw.meetings !== undefined) {
    if (!Array.isArray(raw.meetings)) errors.push('meetings must be an array');
    else
      raw.meetings.forEach((m: unknown, i: number) => {
        const p = `meetings[${i}]`;
        if (!isObj(m)) return errors.push(`${p} must be an object`);
        if (!isInstant(m.start)) errors.push(`${p}.start must be an ISO date-time`);
        if (!isInstant(m.end)) errors.push(`${p}.end must be an ISO date-time`);
        if (isInstant(m.start) && isInstant(m.end) && Date.parse(m.end) <= Date.parse(m.start))
          errors.push(`${p}.end must be after start`);
        count(`${p}.attendees`, m.attendees, 1);
        if (m.title !== undefined && typeof m.title !== 'string')
          errors.push(`${p}.title must be a string`);
        if (m.category !== undefined && !CATEGORIES.includes(m.category as MeetingCategory))
          errors.push(`${p}.category must be one of ${CATEGORIES.join(', ')}`);
        if (m.organizerIsMe !== undefined && typeof m.organizerIsMe !== 'boolean')
          errors.push(`${p}.organizerIsMe must be true or false`);
      });
  }

  const email = section('email', raw.email);
  if (email) {
    count('email.sent', email.sent);
    count('email.sentAfterHours', email.sentAfterHours);
    count('email.received', email.received);
  }

  const training = section('training', raw.training);
  if (training) {
    amount('training.loadToday', training.loadToday);
    amount('training.baseline', training.baseline);
    count('training.weekActivityCount', training.weekActivityCount);
    if (training.keySessions !== undefined) {
      if (!Array.isArray(training.keySessions))
        errors.push('training.keySessions must be an array');
      else
        training.keySessions.forEach((k: unknown, i: number) => {
          const p = `training.keySessions[${i}]`;
          if (!isObj(k)) return errors.push(`${p} must be an object`);
          count(`${p}.daysAgo`, k.daysAgo);
          if (k.kind !== 'hard' && k.kind !== 'long') errors.push(`${p}.kind must be hard or long`);
        });
    }
  }

  const sleep = section('sleep', raw.sleep);
  if (sleep) percent('sleep.performance', sleep.performance);
  percent('recovery', raw.recovery);

  if (raw.weekAhead !== undefined) {
    if (!Array.isArray(raw.weekAhead)) errors.push('weekAhead must be an array');
    else
      raw.weekAhead.forEach((d: unknown, i: number) => {
        const p = `weekAhead[${i}]`;
        if (!isObj(d)) return errors.push(`${p} must be an object`);
        if (!isDate(d.date)) errors.push(`${p}.date must be YYYY-MM-DD`);
        if (!isNum(d.meetingHours) || d.meetingHours < 0 || d.meetingHours > 24)
          errors.push(`${p}.meetingHours must be between 0 and 24`);
      });
  }

  if (errors.length > 0) return { ok: false, errors };

  // Copy only the known fields, so unknown keys never travel further.
  const pick = <T extends object>(o: Record<string, unknown>, keys: readonly string[]): T =>
    Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]])) as T;
  const input: DayInput = {
    version: 1,
    date: raw.date as string,
    timezone: raw.timezone as string,
  };
  if (Array.isArray(raw.meetings))
    input.meetings = raw.meetings.map((m) =>
      pick<EngineMeeting>(m as Record<string, unknown>, [
        'start',
        'end',
        'attendees',
        'title',
        'category',
        'organizerIsMe',
      ])
    );
  if (email) input.email = pick<EmailCounts>(email, ['sent', 'sentAfterHours', 'received']);
  if (training) {
    input.training = pick<TrainingInput>(training, ['loadToday', 'baseline', 'weekActivityCount']);
    if (Array.isArray(training.keySessions))
      input.training.keySessions = training.keySessions.map((k) => {
        const { daysAgo, kind } = k as { daysAgo: number; kind: 'hard' | 'long' };
        return { daysAgo, kind };
      });
  }
  if (sleep) input.sleep = pick<{ performance?: number }>(sleep, ['performance']);
  if (raw.recovery !== undefined) input.recovery = raw.recovery as number;
  if (Array.isArray(raw.weekAhead))
    input.weekAhead = raw.weekAhead.map((d) => {
      const { date, meetingHours } = d as { date: string; meetingHours: number };
      return { date, meetingHours };
    });
  return { ok: true, input };
}
