import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin, isServiceRoleConfigured } from '../../../lib/supabase';
import { getWhoopAuthUrl, isWhoopConfigured } from '../../../src/lib/wearables/whoop';
import { getStravaAuthUrl, isStravaConfigured } from '../../../src/lib/wearables/strava';

// Starts a wearable connection. `?provider=whoop|strava` kicks off that
// provider's OAuth dance; `?provider=demo` creates a tokenless demo
// connection so the full forecast-vs-actual flow works without a device.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.redirect('/');
  }

  const provider = req.query.provider as string;

  if (provider === 'demo') {
    // `json=1` lets the dashboard connect demo data in the background
    // instead of a full-page redirect round-trip
    const wantsJson = req.query.json === '1';
    if (!isServiceRoleConfigured) {
      console.error('demo wearable connect blocked: SUPABASE_SERVICE_ROLE_KEY is not set');
      return wantsJson
        ? res.status(503).json({
            ok: false,
            error:
              'Server persistence isn’t configured (SUPABASE_SERVICE_ROLE_KEY missing) — demo data can’t be saved.',
          })
        : res.redirect('/dashboard?wearable=error');
    }
    const { error } = await supabaseAdmin.from('wearable_connections').upsert(
      {
        user_email: session.user.email,
        provider: 'demo',
        access_token: null,
        refresh_token: null,
        expires_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_email,provider' }
    );
    if (error) {
      console.error('demo wearable connect failed:', error.message);
      return wantsJson
        ? res.status(500).json({ ok: false, error: 'Failed to save demo connection' })
        : res.redirect('/dashboard?wearable=error');
    }
    return wantsJson
      ? res.status(200).json({ ok: true })
      : res.redirect('/dashboard?wearable=connected');
  }

  if (provider === 'whoop' || provider === 'strava') {
    const configured = provider === 'whoop' ? isWhoopConfigured() : isStravaConfigured();
    if (!configured) {
      return res.redirect(`/dashboard?wearable=${provider}-unavailable`);
    }
    // CSRF protection: random state, echoed back by the provider and checked
    // against this cookie in the callback. The provider cookie tells the
    // callback which token exchange to run.
    const state = crypto.randomBytes(16).toString('hex');
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const cookieAttrs = `Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;
    res.setHeader('Set-Cookie', [
      `persist-wearable-state=${state}; ${cookieAttrs}`,
      `persist-wearable-provider=${provider}; ${cookieAttrs}`,
    ]);
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/wearables/callback`;
    const authUrl =
      provider === 'whoop'
        ? getWhoopAuthUrl(state, redirectUri)
        : getStravaAuthUrl(state, redirectUri);
    return res.redirect(authUrl);
  }

  return res.status(400).json({ error: 'Unknown provider' });
}
