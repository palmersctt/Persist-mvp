import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { isAdmin } from '../../../src/lib/admin';

const VALID_EVENT_TYPES = [
  'card_swipe',
  'metric_click',
  'card_share',
  // Get your verdict (signed-out funnel; anonymous visitor ids)
  'verdict_door_chosen',
  'verdict_prompt_copied',
  'verdict_paste_failed',
  'verdict_scored',
  'verdict_shared',
  'verdict_signin_clicked',
] as const;

const VISITOR_EVENTS: readonly string[] = VALID_EVENT_TYPES.filter((e) => e.startsWith('verdict_'));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    // Signed-out visitors (Get your verdict) send an anonymous visitor id,
    // and may only log the verdict_* funnel events.
    const visitorId = req.body?.visitorId;
    const isVisitor =
      !session &&
      typeof visitorId === 'string' &&
      /^visitor-[\w-]{1,60}$/.test(visitorId) &&
      VISITOR_EVENTS.includes(req.body?.eventType);

    if (!session && !isVisitor) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const { eventType, metadata } = req.body;

      if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
        return res
          .status(400)
          .json({ message: `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` });
      }

      const { error } = await supabaseAdmin.from('events').insert({
        user_email: isVisitor ? visitorId : session?.user?.email,
        event_type: eventType,
        metadata: metadata || {},
      });

      if (error) {
        console.error('Error inserting event:', error);
        return res.status(500).json({ message: 'Error recording event' });
      }

      return res.status(201).json({ success: true });
    }

    if (req.method === 'GET') {
      if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      // Every user's events: admins only (ADMIN_EMAILS).
      if (!isAdmin(session.user?.email)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const { event_type, start_date, end_date } = req.query;

      let query = supabaseAdmin
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (event_type && typeof event_type === 'string') {
        query = query.eq('event_type', event_type);
      }
      if (start_date && typeof start_date === 'string') {
        query = query.gte('created_at', start_date);
      }
      if (end_date && typeof end_date === 'string') {
        query = query.lte('created_at', end_date);
      }

      const { data: events, error } = await query;

      if (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({ message: 'Error fetching events' });
      }

      return res.status(200).json({ count: events?.length || 0, events: events || [] });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Events API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
