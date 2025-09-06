import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { supabase } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get session to verify user is authenticated
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Get all users for analytics
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return res.status(500).json({ message: 'Error fetching user data' })
    }

    // Calculate analytics
    const totalUsers = users?.length || 0
    const newUsersToday = users?.filter(user => {
      const today = new Date()
      const userCreated = new Date(user.created_at)
      return userCreated.toDateString() === today.toDateString()
    }).length || 0

    const newUsersThisWeek = users?.filter(user => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const userCreated = new Date(user.created_at)
      return userCreated >= weekAgo
    }).length || 0

    const premiumUsers = users?.filter(user => user.tier === 'premium').length || 0
    const freeUsers = users?.filter(user => user.tier === 'free').length || 0

    // Recent signups (last 10)
    const recentSignups = users?.slice(0, 10).map(user => ({
      email: user.email,
      name: user.name,
      tier: user.tier,
      created_at: user.created_at,
      first_login_at: user.first_login_at,
      last_login_at: user.last_login_at
    })) || []

    const analytics = {
      overview: {
        totalUsers,
        newUsersToday,
        newUsersThisWeek,
        premiumUsers,
        freeUsers,
        conversionRate: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0'
      },
      recentSignups,
      users: users?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        created_at: user.created_at,
        first_login_at: user.first_login_at,
        last_login_at: user.last_login_at,
        isNewUser: new Date(user.first_login_at).getTime() === new Date(user.created_at).getTime()
      })) || []
    }

    return res.status(200).json(analytics)
  } catch (error) {
    console.error('Analytics API error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}