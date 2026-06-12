import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { exchangeWhoopCode } from '../../../src/lib/wearables/whoop';
import { exchangeStravaCode } from '../../../src/lib/wearables/strava';

// OAuth callback shared by WHOOP and Strava: verify state, exchange the code
// for tokens with whichever provider started the flow (carried in a cookie
// set by /api/wearables/connect), persist the connection, and bounce back to
// the dashboard.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.redirect('/');
  }

  const expectedState = req.cookies['persist-wearable-state'];
  const provider = req.cookies['persist-wearable-provider'];

  // Clear the one-time cookies regardless of outcome
  res.setHeader('Set-Cookie', [
    'persist-wearable-state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    'persist-wearable-provider=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  ]);

  const { code, state, error: oauthError } = req.query;
  if (oauthError) {
    return res.redirect('/dashboard?wearable=denied');
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return res.redirect('/dashboard?wearable=error');
  }
  if (provider !== 'whoop' && provider !== 'strava') {
    return res.redirect('/dashboard?wearable=error');
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/wearables/callback`;
  const tokens =
    provider === 'whoop'
      ? await exchangeWhoopCode(code as string, redirectUri)
      : await exchangeStravaCode(code as string);
  if (!tokens) {
    return res.redirect('/dashboard?wearable=error');
  }

  const { error } = await supabaseAdmin.from('wearable_connections').upsert(
    {
      user_email: session.user.email,
      provider,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_email,provider' }
  );
  if (error) {
    console.error(`${provider} connection upsert failed:`, error.message);
    return res.redirect('/dashboard?wearable=error');
  }

  return res.redirect('/dashboard?wearable=connected');
}
