import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

// Removes the user's wearable connection (tokens included). Persisted daily
// actuals are kept — they're the user's history, not the provider's.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized - Please sign in' });
  }

  const { error } = await supabaseAdmin
    .from('wearable_connections')
    .delete()
    .eq('user_email', session.user.email);

  if (error) {
    console.error('wearable disconnect failed:', error.message);
    return res.status(500).json({ error: 'Failed to disconnect wearable' });
  }

  return res.status(200).json({ ok: true });
}
