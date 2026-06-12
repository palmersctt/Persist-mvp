import type { WearableActuals } from './types';

// Server-side WHOOP API client (OAuth 2.0 + Developer API v2).
// Requires a registered app at developer.whoop.com with redirect URI
// `${NEXTAUTH_URL}/api/wearables/callback`, and these env vars:
//   WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET
// See WEARABLES.md for setup.

const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer/v2';

const WHOOP_SCOPES = ['read:recovery', 'read:sleep', 'read:cycles', 'read:profile', 'offline'];

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

type WhoopRecord = Record<string, unknown> & { score?: Record<string, unknown> };

function latestRecord(collection: Record<string, unknown> | null): WhoopRecord | null {
  const records = collection?.records;
  if (!Array.isArray(records) || records.length === 0) return null;
  return records[0] as WhoopRecord;
}

/**
 * Fetch the latest recovery, sleep, and cycle from WHOOP and normalize.
 * Throws 'WHOOP_UNAUTHORIZED' if the access token is rejected (caller should
 * refresh and retry); returns null only if WHOOP has no data at all.
 */
export async function fetchWhoopActuals(
  accessToken: string,
  date: string
): Promise<WearableActuals | null> {
  const [recoveryRes, sleepRes, cycleRes] = await Promise.all([
    whoopGet('/recovery?limit=1', accessToken),
    whoopGet('/activity/sleep?limit=1', accessToken),
    whoopGet('/cycle?limit=1', accessToken),
  ]);

  const recovery = latestRecord(recoveryRes);
  const sleep = latestRecord(sleepRes);
  const cycle = latestRecord(cycleRes);
  if (!recovery && !sleep) return null;

  const recoveryScore = recovery?.score as Record<string, number> | undefined;
  const sleepScore = sleep?.score as Record<string, unknown> | undefined;
  const cycleScore = cycle?.score as Record<string, number> | undefined;

  // Actual sleep = time in bed minus awake time (stage_summary), falling
  // back to the start/end span (time in bed) when stages are unavailable
  let sleepHours = 0;
  const stages = sleepScore?.stage_summary as Record<string, number> | undefined;
  if (typeof stages?.total_in_bed_time_milli === 'number') {
    const asleepMs = stages.total_in_bed_time_milli - (stages.total_awake_time_milli ?? 0);
    sleepHours = Math.max(0, Math.round((asleepMs / 3600000) * 10) / 10);
  } else if (sleep?.start && sleep?.end) {
    const ms = new Date(sleep.end as string).getTime() - new Date(sleep.start as string).getTime();
    sleepHours = Math.max(0, Math.round((ms / 3600000) * 10) / 10);
  }

  return {
    date,
    provider: 'whoop',
    recovery: Math.round(recoveryScore?.recovery_score ?? 0),
    sleepHours,
    sleepPerformance:
      typeof sleepScore?.sleep_performance_percentage === 'number'
        ? Math.round(sleepScore.sleep_performance_percentage)
        : undefined,
    hrvMs:
      typeof recoveryScore?.hrv_rmssd_milli === 'number'
        ? Math.round(recoveryScore.hrv_rmssd_milli)
        : undefined,
    restingHr:
      typeof recoveryScore?.resting_heart_rate === 'number'
        ? Math.round(recoveryScore.resting_heart_rate)
        : undefined,
    dayStrain:
      typeof cycleScore?.strain === 'number' ? Math.round(cycleScore.strain * 10) / 10 : undefined,
  };
}
