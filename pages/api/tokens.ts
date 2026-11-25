import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { supabaseAdmin } from '../../lib/supabase';
import { cleanLabel, hashToken, newToken } from '../../src/lib/assistant/tokens';

// The signed-in user's assistant tokens.
//   GET            → { tokens: [{ id, label, created_at, last_used_at }] } (active only)
//   POST { label } → { token, id }   — the token is shown this once
//   DELETE ?id=…   → { revoked: true }
const MAX_ACTIVE = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email) return res.status(401).json({ error: 'Unauthorized - Please sign in' });

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('api_tokens')
      .select('id, label, created_at, last_used_at')
      .eq('user_email', email)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });
    if (error) return res.status(200).json({ tokens: [], available: false });
    return res.status(200).json({ tokens: data ?? [], available: true });
  }

  if (req.method === 'POST') {
    const label = cleanLabel(req.body?.label);
    if (!label) return res.status(400).json({ error: 'label is required' });
    const { data: active } = await supabaseAdmin
      .from('api_tokens')
      .select('id')
      .eq('user_email', email)
      .is('revoked_at', null);
    if ((active ?? []).length >= MAX_ACTIVE)
      return res.status(409).json({ error: `At most ${MAX_ACTIVE} active tokens` });
    const token = newToken();
    const { data, error } = await supabaseAdmin
      .from('api_tokens')
      .insert({ user_email: email, label, token_hash: hashToken(token) })
      .select('id')
      .single();
    if (error) {
      console.error('token create failed:', error.message);
      return res.status(503).json({ error: 'Tokens are not available yet' });
    }
    return res.status(201).json({ token, id: (data as { id: string }).id });
  }

  if (req.method === 'DELETE') {
    const id = typeof req.query.id === 'string' ? req.query.id : '';
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { error } = await supabaseAdmin
      .from('api_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_email', email);
    if (error) return res.status(500).json({ error: 'Could not revoke' });
    return res.status(200).json({ revoked: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
