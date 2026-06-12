import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { generateDemoActuals } from '../../../src/lib/wearables/demo';
import { fetchWhoopActuals, refreshWhoopToken } from '../../../src/lib/wearables/whoop';
import { fetchStravaActuals, refreshStravaToken } from '../../../src/lib/wearables/strava';
import type { WearableActuals, WearableProvider } from '../../../src/lib/wearables/types';

interface ConnectionRow {
  provider: WearableProvider;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
}

interface DailyRow {
  date: string;
  provider: WearableProvider;
  recovery: number | null;
  sleep_hours: number | null;
  sleep_performance: number | null;
  hrv_ms: number | null;
  resting_hr: number | null;
  day_strain: number | null;
}

function rowToActuals(row: DailyRow): WearableActuals {
  return {
    date: row.date,
    provider: row.provider,
    recovery: row.recovery ?? undefined,
    sleepHours: row.sleep_hours != null ? Number(row.sleep_hours) : undefined,
    sleepPerformance: row.sleep_performance ?? undefined,
    hrvMs: row.hrv_ms ?? undefined,
    restingHr: row.resting_hr ?? undefined,
    dayStrain: row.day_strain != null ? Number(row.day_strain) : undefined,
  };
}

async function persistActuals(userEmail: string, actuals: WearableActuals) {
  const { error } = await supabaseAdmin.from('wearable_daily').upsert(
    {
      user_email: userEmail,
      date: actuals.date,
      provider: actuals.provider,
      recovery: actuals.recovery ?? null,
      sleep_hours: actuals.sleepHours ?? null,
      sleep_performance: actuals.sleepPerformance ?? null,
      hrv_ms: actuals.hrvMs ?? null,
      resting_hr: actuals.restingHr ?? null,
      day_strain: actuals.dayStrain ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_email,date' }
  );
  if (error) console.error('wearable_daily upsert failed:', error.message);
}

interface OAuthProviderAdapter {
  provider: 'whoop' | 'strava';
  refresh: (
    refreshToken: string
  ) => Promise<{ accessToken: string; refreshToken: string | null; expiresAt: string } | null>;
  fetch: (accessToken: string, date: string) => Promise<WearableActuals | null>;
  unauthorizedError: string;
}

const OAUTH_ADAPTERS: Record<'whoop' | 'strava', OAuthProviderAdapter> = {
  whoop: {
    provider: 'whoop',
    refresh: refreshWhoopToken,
    fetch: fetchWhoopActuals,
    unauthorizedError: 'WHOOP_UNAUTHORIZED',
  },
  strava: {
    provider: 'strava',
    refresh: refreshStravaToken,
    fetch: fetchStravaActuals,
    unauthorizedError: 'STRAVA_UNAUTHORIZED',
  },
};

async function getOAuthActuals(
  userEmail: string,
  connection: ConnectionRow,
  date: string,
  adapter: OAuthProviderAdapter
): Promise<WearableActuals | null> {
  let accessToken = connection.access_token;
  let refreshToken = connection.refresh_token;

  const persistTokens = async (tokens: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: string;
  }) => {
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken ?? refreshToken;
    await supabaseAdmin
      .from('wearable_connections')
      .update({
        access_token: tokens.accessToken,
        refresh_token: refreshToken,
        expires_at: tokens.expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_email', userEmail)
      .eq('provider', adapter.provider);
  };

  // Proactively refresh if the token expires within 5 minutes
  const expiresSoon =
    connection.expires_at && new Date(connection.expires_at).getTime() - Date.now() < 5 * 60 * 1000;
  if (expiresSoon && refreshToken) {
    const tokens = await adapter.refresh(refreshToken);
    if (tokens) await persistTokens(tokens);
  }

  if (!accessToken) return null;

  try {
    return await adapter.fetch(accessToken, date);
  } catch (err) {
    // Access token rejected — refresh once and retry
    if (err instanceof Error && err.message === adapter.unauthorizedError && refreshToken) {
      const tokens = await adapter.refresh(refreshToken);
      if (tokens) {
        await persistTokens(tokens);
        try {
          return await adapter.fetch(tokens.accessToken, date);
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}

// Returns the signed-in user's wearable connection state plus today's
// normalized actuals (fetched live from the provider and persisted to
// wearable_daily, falling back to the last persisted row if the provider
// is unreachable).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized - Please sign in' });
  }
  const userEmail = session.user.email;

  const userTimezone =
    (req.query.timezone as string) ||
    (req.headers['x-user-timezone'] as string) ||
    'America/Los_Angeles';
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: userTimezone });

  const { data: connections, error: connError } = await supabaseAdmin
    .from('wearable_connections')
    .select('provider, access_token, refresh_token, expires_at')
    .eq('user_email', userEmail)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (connError) {
    console.error('wearable connection lookup failed:', connError.message);
    return res.status(500).json({ error: 'Failed to look up wearable connection' });
  }

  const connection = (connections?.[0] as ConnectionRow | undefined) ?? null;
  if (!connection) {
    return res.status(200).json({ connected: false });
  }

  let actuals: WearableActuals | null = null;
  if (connection.provider === 'demo') {
    actuals = generateDemoActuals(userEmail, today);
  } else if (connection.provider === 'whoop' || connection.provider === 'strava') {
    actuals = await getOAuthActuals(
      userEmail,
      connection,
      today,
      OAUTH_ADAPTERS[connection.provider]
    );
  }

  if (actuals) {
    await persistActuals(userEmail, actuals);
  } else {
    // Provider unreachable — serve the most recent persisted day instead
    const { data: rows } = await supabaseAdmin
      .from('wearable_daily')
      .select(
        'date, provider, recovery, sleep_hours, sleep_performance, hrv_ms, resting_hr, day_strain'
      )
      .eq('user_email', userEmail)
      .order('date', { ascending: false })
      .limit(1);
    const row = rows?.[0] as DailyRow | undefined;
    if (row) {
      actuals = rowToActuals(row);
    }
  }

  return res.status(200).json({
    connected: true,
    provider: connection.provider,
    actuals,
    stale: !!actuals && actuals.date !== today,
  });
}
