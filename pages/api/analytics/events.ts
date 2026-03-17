import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { supabaseAdmin } from '../../../lib/supabase'

const VALID_EVENT_TYPES = [
  'card_swipe', 'metric_click', 'card_share',
  // Metric detail tab engagement
  'sandbox_metric_tab_viewed',
  'sandbox_metric_components_viewed',
  'sandbox_metric_tab_exited',
  'sandbox_metric_time_spent',
  // Trends section engagement
  'sandbox_trends_button_viewed',
  'sandbox_trends_expanded',
  'sandbox_trend_toggled',
  'sandbox_trend_sparkline_viewed',
  'sandbox_trend_insights_expanded',
] as const

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (req.method === 'POST') {
      const { eventType, metadata } = req.body

      if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
        return res.status(400).json({ message: `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` })
      }

      const { error } = await supabaseAdmin.from('events').insert({
        user_email: session.user?.email,
        event_type: eventType,
        metadata: metadata || {},
      })

      if (error) {
        console.error('Error inserting event:', error)
        return res.status(500).json({ message: 'Error recording event' })
      }

      return res.status(201).json({ success: true })
    }

    if (req.method === 'GET') {
      const { event_type, start_date, end_date } = req.query

      let query = supabaseAdmin
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (event_type && typeof event_type === 'string') {
        query = query.eq('event_type', event_type)
      }
      if (start_date && typeof start_date === 'string') {
        query = query.gte('created_at', start_date)
      }
      if (end_date && typeof end_date === 'string') {
        query = query.lte('created_at', end_date)
      }

      const { data: events, error } = await query

      if (error) {
        console.error('Error fetching events:', error)
        return res.status(500).json({ message: 'Error fetching events' })
      }

      return res.status(200).json({ count: events?.length || 0, events: events || [] })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Events API error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
