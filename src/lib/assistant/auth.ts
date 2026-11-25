// Bearer token → user, with the hourly rate limit. Server-only.
import { supabaseAdmin } from '../../../lib/supabase';
import { bearerToken, checkRate, hashToken } from './tokens';

export type AuthResult =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 429 | 503; error: string };

export async function authenticate(
  header: string | string[] | undefined,
  now = new Date()
): Promise<AuthResult> {
  const token = bearerToken(header);
  if (!token) return { ok: false, status: 401, error: 'Missing or invalid bearer token' };
  const { data, error } = await supabaseAdmin
    .from('api_tokens')
    .select('id, user_email, revoked_at, window_start, window_calls')
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  if (error) return { ok: false, status: 503, error: 'Token check unavailable' };
  const row = data as {
    id: string;
    user_email: string;
    revoked_at: string | null;
    window_start: string | null;
    window_calls: number;
  } | null;
  if (!row || row.revoked_at) return { ok: false, status: 401, error: 'Unknown or revoked token' };
  const rate = checkRate(row, now);
  if (!rate.allowed) return { ok: false, status: 429, error: 'Rate limit: 60 calls per hour' };
  await supabaseAdmin
    .from('api_tokens')
    .update({ ...rate.next, last_used_at: now.toISOString() })
    .eq('id', row.id);
  return { ok: true, email: row.user_email };
}
