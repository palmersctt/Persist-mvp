import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { supabaseAdmin } from '../../lib/supabase';

// Returns the signed-in user's persisted daily scores (last 30 days, ascending).
// Shape matches the DailyScore entries the dashboard trends are built from.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized - Please sign in' });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const { data, error } = await supabaseAdmin
    .from('daily_scores')
    .select('date, performance, resilience, sustainability')
    .eq('user_email', session.user.email)
    .gte('date', cutoff.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) {
    console.error('score-history fetch failed:', error.message);
    return res.status(500).json({ error: 'Failed to load score history' });
  }

  return res.status(200).json({ scores: data ?? [] });
}
