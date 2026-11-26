import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { CODE_TTL_MS, hashCode, newCode, redirectWith } from '../../../src/lib/assistant/oauth';

// The consent page's backend.
//   GET  ?client_id&redirect_uri → { client_name } if the request is valid
//   POST { client_id, redirect_uri, code_challenge, code_challenge_method,
//          state?, approve } → { redirect } back to the client
async function findClient(clientId: unknown, redirectUri: unknown) {
  if (typeof clientId !== 'string' || typeof redirectUri !== 'string') return null;
  const { data } = await supabaseAdmin
    .from('oauth_clients')
    .select('client_id, client_name, redirect_uris')
    .eq('client_id', clientId)
    .maybeSingle();
  const c = data as { client_id: string; client_name: string; redirect_uris: string[] } | null;
  return c && c.redirect_uris.includes(redirectUri) ? c : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email) return res.status(401).json({ error: 'Sign in first' });

  if (req.method === 'GET') {
    const c = await findClient(req.query.client_id, req.query.redirect_uri);
    if (!c) return res.status(400).json({ error: 'Unknown app or redirect address' });
    // Shown on the consent screen: the app's self-chosen name isn't proof of
    // who it is, but the address it sends you back to is.
    return res
      .status(200)
      .json({
        client_name: c.client_name,
        redirect_host: new URL(req.query.redirect_uri as string).host,
      });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const b = (req.body ?? {}) as Record<string, unknown>;
  const c = await findClient(b.client_id, b.redirect_uri);
  // Never redirect to an address the client didn't register.
  if (!c) return res.status(400).json({ error: 'Unknown app or redirect address' });
  const redirectUri = b.redirect_uri as string;
  const state = typeof b.state === 'string' ? b.state : undefined;

  if (b.approve !== true)
    return res
      .status(200)
      .json({ redirect: redirectWith(redirectUri, { error: 'access_denied', state }) });
  if (
    b.code_challenge_method !== 'S256' ||
    typeof b.code_challenge !== 'string' ||
    !b.code_challenge
  )
    return res
      .status(200)
      .json({ redirect: redirectWith(redirectUri, { error: 'invalid_request', state }) });

  const code = newCode();
  const { error } = await supabaseAdmin.from('oauth_codes').insert({
    code_hash: hashCode(code),
    client_id: c.client_id,
    user_email: email,
    redirect_uri: redirectUri,
    code_challenge: b.code_challenge,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });
  if (error) {
    console.error('oauth code failed:', error.message);
    return res
      .status(200)
      .json({ redirect: redirectWith(redirectUri, { error: 'temporarily_unavailable', state }) });
  }
  return res.status(200).json({ redirect: redirectWith(redirectUri, { code, state }) });
}
