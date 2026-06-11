import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { getWhoopAuthUrl, isWhoopConfigured } from '../../../src/lib/wearables/whoop';

// Starts a wearable connection. `?provider=whoop` kicks off the WHOOP OAuth
// dance; `?provider=demo` creates a tokenless demo connection so the full
// forecast-vs-actual flow works without a device.
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
      return res.redirect('/dashboard?wearable=error');
    }
    return res.redirect('/dashboard?wearable=connected');
  }

  if (provider === 'whoop') {
    if (!isWhoopConfigured()) {
      return res.redirect('/dashboard?wearable=whoop-unavailable');
    }
    // CSRF protection: random state, echoed back by WHOOP and checked
    // against this cookie in the callback.
    const state = crypto.randomBytes(16).toString('hex');
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
      'Set-Cookie',
      `persist-wearable-state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`
    );
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/wearables/callback`;
    return res.redirect(getWhoopAuthUrl(state, redirectUri));
  }

  return res.status(400).json({ error: 'Unknown provider' });
}
