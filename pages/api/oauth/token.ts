import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';
import { hashCode, SCOPE, verifyPkce } from '../../../src/lib/assistant/oauth';
import { hashToken, newToken } from '../../../src/lib/assistant/tokens';

// Authorization code + PKCE → an access token (an api_tokens row, valid
// until revoked on the dashboard).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'invalid_request' });

  const b = (req.body ?? {}) as Record<string, unknown>;
  if (b.grant_type !== 'authorization_code')
    return res.status(400).json({ error: 'unsupported_grant_type' });
  if (typeof b.code !== 'string') return res.status(400).json({ error: 'invalid_request' });

  const { data } = await supabaseAdmin
    .from('oauth_codes')
    .select('code_hash, client_id, user_email, redirect_uri, code_challenge, expires_at, used_at')
    .eq('code_hash', hashCode(b.code))
    .maybeSingle();
  const code = data as {
    code_hash: string;
    client_id: string;
    user_email: string;
    redirect_uri: string;
    code_challenge: string;
    expires_at: string;
    used_at: string | null;
  } | null;
  const valid =
    code &&
    !code.used_at &&
    Date.parse(code.expires_at) > Date.now() &&
    code.client_id === b.client_id &&
    code.redirect_uri === b.redirect_uri &&
    verifyPkce(b.code_verifier, code.code_challenge);
  if (!code || !valid) return res.status(400).json({ error: 'invalid_grant' });

  // Single use: claim the code before issuing (only one exchange can win).
  const { data: claimed } = await supabaseAdmin
    .from('oauth_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('code_hash', code.code_hash)
    .is('used_at', null)
    .select('code_hash');
  if (!claimed || claimed.length === 0) return res.status(400).json({ error: 'invalid_grant' });

  const { data: client } = await supabaseAdmin
    .from('oauth_clients')
    .select('client_name')
    .eq('client_id', code.client_id)
    .maybeSingle();
  const label = ((client as { client_name?: string } | null)?.client_name ?? 'Assistant').slice(
    0,
    60
  );
  // One live token per app per user: reconnecting replaces the old one.
  await supabaseAdmin
    .from('api_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_email', code.user_email)
    .eq('client_id', code.client_id)
    .is('revoked_at', null);
  const token = newToken();
  const { error } = await supabaseAdmin.from('api_tokens').insert({
    user_email: code.user_email,
    label,
    token_hash: hashToken(token),
    client_id: code.client_id,
  });
  if (error) return res.status(503).json({ error: 'temporarily_unavailable' });

  return res.status(200).json({ access_token: token, token_type: 'Bearer', scope: SCOPE });
}
