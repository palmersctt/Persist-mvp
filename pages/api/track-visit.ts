import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { supabase } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const email = session.user?.email
    if (!email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Read current last_active_at
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('last_active_at')
      .eq('email', email)
      .single()

    if (fetchError) {
      console.error('Error fetching user for visit tracking:', fetchError)
      return res.status(500).json({ message: 'Internal server error' })
    }

    // Only update if last_active_at is null or more than 24 hours ago
    const now = new Date()
    if (user.last_active_at) {
      const lastActive = new Date(user.last_active_at)
      const hoursSinceLastActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60)

      if (hoursSinceLastActive < 24) {
        return res.status(200).json({ tracked: false, reason: 'already_tracked_today' })
      }
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ last_active_at: now.toISOString() })
      .eq('email', email)

    if (updateError) {
      console.error('Error updating last_active_at:', updateError)
      return res.status(500).json({ message: 'Internal server error' })
    }

    return res.status(200).json({ tracked: true })
  } catch (error) {
    console.error('Track visit API error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
