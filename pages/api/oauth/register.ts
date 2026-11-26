import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';
import { newClientId, parseRegistration } from '../../../src/lib/assistant/oauth';

/** Registrations allowed across the whole service per rolling hour. */
export const REGISTRATIONS_PER_HOUR = 100;

// RFC 7591 dynamic client registration (public clients, PKCE only).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'invalid_request' });

  const reg = parseRegistration(req.body);
  if (!reg.ok) return res.status(400).json({ error: reg.error });
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from('oauth_clients')
    .select('client_id')
    .gte('created_at', since);
  if ((recent ?? []).length >= REGISTRATIONS_PER_HOUR)
    return res.status(429).json({ error: 'temporarily_unavailable' });

  const client_id = newClientId();
  const { error } = await supabaseAdmin
    .from('oauth_clients')
    .insert({ client_id, client_name: reg.client_name, redirect_uris: reg.redirect_uris });
  if (error) {
    console.error('oauth register failed:', error.message);
    return res.status(503).json({ error: 'temporarily_unavailable' });
  }
  return res.status(201).json({
    client_id,
    client_name: reg.client_name,
    redirect_uris: reg.redirect_uris,
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
  });
}
