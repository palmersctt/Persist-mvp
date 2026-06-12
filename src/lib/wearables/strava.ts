import type { ActivitySummary, WearableActuals } from './types';

// Server-side Strava API client (OAuth 2.0 + API v3).
// Strava is an ACTIVITY provider — no recovery/sleep/HRV. Its actuals answer
// "did you actually hit the trails", not "what does your body have left".
//
// Requires a self-serve app at strava.com/settings/api (a Strava
// subscription is required for API access under the 2026 developer
// program), and these env vars:
//   STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET
// See WEARABLES.md for setup.

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

// activity:read_all (not activity:read) so privately-visible activities
// count — a personal trail log is usually private.
const STRAVA_SCOPES = 'read,activity:read_all';

export function isStravaConfigured(): boolean {
  return !!process.env.STRAVA_CLIENT_ID && !!process.env.STRAVA_CLIENT_SECRET;
}

export function getStravaAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: STRAVA_SCOPES,
    approval_prompt: 'auto',
    state,
  });
  return `${STRAVA_AUTH_URL}?${params}`;
}

export interface StravaTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
}

async function requestTokens(body: URLSearchParams): Promise<StravaTokens | null> {
  try {
    const res = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      console.error('Strava token request failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      // Strava returns expires_at as epoch seconds
      expiresAt: data.expires_at
        ? new Date(data.expires_at * 1000).toISOString()
        : new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    };
  } catch (err) {
    console.error('Strava token request error:', err);
    return null;
  }
}

export function exchangeStravaCode(code: string): Promise<StravaTokens | null> {
  return requestTokens(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.STRAVA_CLIENT_ID!,
      client_secret: process.env.STRAVA_CLIENT_SECRET!,
    })
  );
}

export function refreshStravaToken(refreshToken: string): Promise<StravaTokens | null> {
  return requestTokens(
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.STRAVA_CLIENT_ID!,
      client_secret: process.env.STRAVA_CLIENT_SECRET!,
    })
  );
}

interface StravaActivity {
  name?: string;
  type?: string;
  sport_type?: string;
  start_date?: string;
  moving_time?: number; // seconds
  distance?: number; // meters
  // Relative effort. In Strava's example responses but not the declared
  // SummaryActivity schema — present for subscriber accounts, often null.
  suffer_score?: number | null;
}

/**
 * Fetch the trailing week of activities from Strava and normalize.
 * Throws 'STRAVA_UNAUTHORIZED' if the access token is rejected (caller
 * should refresh and retry).
 */
export async function fetchStravaActuals(
  accessToken: string,
  date: string
): Promise<WearableActuals | null> {
  const after = Math.floor((Date.now() - 7 * 24 * 3600 * 1000) / 1000);
  let activities: StravaActivity[];
  try {
    const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?after=${after}&per_page=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('STRAVA_UNAUTHORIZED');
      console.error('Strava activities fetch failed:', res.status);
      return null;
    }
    activities = await res.json();
  } catch (err) {
    if (err instanceof Error && err.message === 'STRAVA_UNAUTHORIZED') throw err;
    console.error('Strava activities fetch error:', err);
    return null;
  }

  if (!Array.isArray(activities)) return null;

  // Most recent first
  const sorted = [...activities].sort((a, b) =>
    (b.start_date ?? '').localeCompare(a.start_date ?? '')
  );
  const latest = sorted[0];

  const lastActivity: ActivitySummary | undefined = latest?.start_date
    ? {
        type: latest.sport_type || latest.type || 'Activity',
        name: latest.name,
        startISO: latest.start_date,
        durationMin: Math.round((latest.moving_time ?? 0) / 60),
        distanceKm:
          typeof latest.distance === 'number' ? Math.round(latest.distance / 100) / 10 : undefined,
      }
    : undefined;

  // Best-effort relative effort for today's activities (subscriber-only
  // field; treat absence as no data, not zero)
  const todayEffort = sorted
    .filter((a) => (a.start_date ?? '').startsWith(date))
    .reduce((sum, a) => sum + (a.suffer_score ?? 0), 0);

  return {
    date,
    provider: 'strava',
    lastActivity,
    weekActivityCount: sorted.length,
    dayStrain: todayEffort > 0 ? todayEffort : undefined,
  };
}
