import type { ActivitySummary, WearableActuals } from './types';
import {
  CTL_DAYS,
  ATL_DAYS,
  DAY_MS,
  freshnessFromActivities,
  trainingLoadProfile,
  type LoadInput,
} from './trainingLoad';

// Server-side WHOOP API client (OAuth 2.0 + Developer API v2).
// Requires a registered app at developer.whoop.com with redirect URI
// `${NEXTAUTH_URL}/api/wearables/callback`, and these env vars:
//   WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET
// See WEARABLES.md for setup.

const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer/v2';

const WHOOP_SCOPES = [
  'read:recovery',
  'read:sleep',
  'read:cycles',
  'read:workout',
  'read:profile',
  'offline',
];

/** Workouts per page (WHOOP's maximum) and a cap on pages per fetch. */
const WORKOUT_PAGE_SIZE = 25;
const WORKOUT_MAX_PAGES = 8;

export function isWhoopConfigured(): boolean {
  return !!process.env.WHOOP_CLIENT_ID && !!process.env.WHOOP_CLIENT_SECRET;
}

export function getWhoopAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.WHOOP_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: WHOOP_SCOPES.join(' '),
    state,
  });
  return `${WHOOP_AUTH_URL}?${params}`;
}

export interface WhoopTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
}

async function requestTokens(body: URLSearchParams): Promise<WhoopTokens | null> {
  try {
    const res = await fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      console.error('WHOOP token request failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
    };
  } catch (err) {
    console.error('WHOOP token request error:', err);
    return null;
  }
}

export function exchangeWhoopCode(code: string, redirectUri: string): Promise<WhoopTokens | null> {
  return requestTokens(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
      redirect_uri: redirectUri,
    })
  );
}

export function refreshWhoopToken(refreshToken: string): Promise<WhoopTokens | null> {
  return requestTokens(
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
      scope: 'offline',
    })
  );
}

async function whoopGet(
  path: string,
  accessToken: string
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${WHOOP_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('WHOOP_UNAUTHORIZED');
      console.error(`WHOOP API ${path} failed:`, res.status);
      return null;
    }
    return res.json();
  } catch (err) {
    if (err instanceof Error && err.message === 'WHOOP_UNAUTHORIZED') throw err;
    console.error(`WHOOP API ${path} error:`, err);
    return null;
  }
}

export type WhoopRecord = Record<string, unknown> & { score?: Record<string, unknown> };

/** The latest WHOOP records for a user, as the API returned them. */
export interface WhoopRecords {
  recovery: WhoopRecord | null;
  sleep: WhoopRecord | null;
  cycle: WhoopRecord | null;
  /** Workouts over the trailing training window, any order. */
  workouts?: WhoopRecord[];
}

function latestRecord(collection: Record<string, unknown> | null): WhoopRecord | null {
  const records = collection?.records;
  if (!Array.isArray(records) || records.length === 0) return null;
  return records[0] as WhoopRecord;
}

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

/**
 * Normalize WHOOP records into actuals. Pure — no network. A value WHOOP did
 * not send stays absent (never 0), so downstream can tell "no data" from a
 * real zero. Returns null when WHOOP has nothing to say.
 */
export function whoopToActuals(records: WhoopRecords, date: string): WearableActuals | null {
  const { recovery, sleep, cycle } = records;
  const training = trainingFromWorkouts(records.workouts ?? [], date);
  if (!recovery && !sleep && !training) return null;

  const recoveryScore = recovery?.score;
  const sleepScore = sleep?.score;
  const cycleScore = cycle?.score;

  // Actual sleep = time in bed minus awake time (stage_summary), falling
  // back to the start/end span (time in bed) when stages are unavailable
  let sleepHours: number | undefined;
  const stages = sleepScore?.stage_summary as Record<string, unknown> | undefined;
  const inBedMs = num(stages?.total_in_bed_time_milli);
  if (inBedMs !== undefined) {
    const asleepMs = inBedMs - (num(stages?.total_awake_time_milli) ?? 0);
    sleepHours = Math.max(0, Math.round((asleepMs / 3600000) * 10) / 10);
  } else if (typeof sleep?.start === 'string' && typeof sleep?.end === 'string') {
    const ms = new Date(sleep.end).getTime() - new Date(sleep.start).getTime();
    if (Number.isFinite(ms)) sleepHours = Math.max(0, Math.round((ms / 3600000) * 10) / 10);
  }

  const round = (v: unknown) => {
    const n = num(v);
    return n === undefined ? undefined : Math.round(n);
  };
  const strain = num(cycleScore?.strain);

  return {
    date,
    provider: 'whoop',
    recovery: round(recoveryScore?.recovery_score),
    sleepHours,
    sleepPerformance: round(sleepScore?.sleep_performance_percentage),
    hrvMs: round(recoveryScore?.hrv_rmssd_milli),
    restingHr: round(recoveryScore?.resting_heart_rate),
    dayStrain: strain === undefined ? undefined : Math.round(strain * 10) / 10,
    ...training,
  };
}

type TrainingFields = Pick<
  WearableActuals,
  'lastActivity' | 'weekActivityCount' | 'freshness' | 'trainingBaseline' | 'trainingLoadToday'
>;

/**
 * Training load from WHOOP workouts, in the shared load currency: ~1 per
 * minute moved (workout end minus start). WHOOP strain is deliberately not
 * used — it sits on a 0–21 curve with no honest mapping onto that currency.
 * Returns null when there are no usable workouts, so training stays neutral.
 */
function trainingFromWorkouts(workouts: WhoopRecord[], date: string): TrainingFields | null {
  const sessions: Array<LoadInput & { start_date: string; record: WhoopRecord }> = [];
  for (const w of workouts) {
    if (typeof w.start !== 'string' || typeof w.end !== 'string') continue;
    const ms = new Date(w.end).getTime() - new Date(w.start).getTime();
    if (!Number.isFinite(ms) || ms <= 0) continue;
    sessions.push({ start_date: w.start, moving_time: Math.round(ms / 1000), record: w });
  }
  if (sessions.length === 0) return null;

  // Most recent first
  sessions.sort((a, b) => b.start_date.localeCompare(a.start_date));
  const latest = sessions[0];
  const distanceM = num(latest.record.score?.distance_meter);
  const lastActivity: ActivitySummary = {
    type: typeof latest.record.sport_name === 'string' ? latest.record.sport_name : 'Workout',
    startISO: latest.start_date,
    durationMin: Math.round((latest.moving_time ?? 0) / 60),
    distanceKm: distanceM === undefined ? undefined : Math.round(distanceM / 100) / 10,
  };

  // Trailing 7 days, counted back from the end of `date`
  const weekStart = new Date(`${date}T00:00:00Z`).getTime() - 6 * DAY_MS;
  const weekActivityCount = sessions.filter(
    (s) => new Date(s.start_date).getTime() >= weekStart
  ).length;

  const profile = trainingLoadProfile(sessions, date);
  return {
    lastActivity,
    weekActivityCount,
    freshness: freshnessFromActivities(sessions, date) ?? undefined,
    trainingBaseline: profile.baseline,
    trainingLoadToday: profile.today,
  };
}

/** Workouts since `sinceISO`, following WHOOP's pagination. */
async function fetchWorkouts(accessToken: string, sinceISO: string): Promise<WhoopRecord[]> {
  const out: WhoopRecord[] = [];
  let nextToken: string | undefined;
  for (let page = 0; page < WORKOUT_MAX_PAGES; page++) {
    const params = new URLSearchParams({ limit: String(WORKOUT_PAGE_SIZE), start: sinceISO });
    if (nextToken) params.set('nextToken', nextToken);
    const res = await whoopGet(`/activity/workout?${params}`, accessToken);
    const records = res?.records;
    if (!Array.isArray(records)) break;
    out.push(...(records as WhoopRecord[]));
    nextToken = typeof res?.next_token === 'string' && res.next_token ? res.next_token : undefined;
    if (!nextToken) break;
  }
  return out;
}

/**
 * Fetch the latest recovery, sleep and cycle, plus the trailing window of
 * workouts, from WHOOP and normalize.
 * Throws 'WHOOP_UNAUTHORIZED' if the access token is rejected (caller should
 * refresh and retry); returns null only if WHOOP has no data at all.
 */
export async function fetchWhoopActuals(
  accessToken: string,
  date: string
): Promise<WearableActuals | null> {
  // Enough history to build the chronic-load baseline.
  const since = new Date(Date.now() - (CTL_DAYS + ATL_DAYS) * DAY_MS).toISOString();
  const [recoveryRes, sleepRes, cycleRes, workouts] = await Promise.all([
    whoopGet('/recovery?limit=1', accessToken),
    whoopGet('/activity/sleep?limit=1', accessToken),
    whoopGet('/cycle?limit=1', accessToken),
    fetchWorkouts(accessToken, since),
  ]);

  return whoopToActuals(
    {
      recovery: latestRecord(recoveryRes),
      sleep: latestRecord(sleepRes),
      cycle: latestRecord(cycleRes),
      workouts,
    },
    date
  );
}
