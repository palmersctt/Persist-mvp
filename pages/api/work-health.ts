import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import GoogleCalendarService from '../../src/services/googleCalendar';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.accessToken) {
      return res.status(401).json({ error: 'Unauthorized - Please sign in' });
    }

    // Check if token refresh failed and we need re-authentication
    if (session.error === "RefreshAccessTokenError") {
      return res.status(401).json({ 
        error: 'Token expired - Please sign out and sign in again', 
        needsReauth: true 
      });
    }

    const calendarService = new GoogleCalendarService();
    await calendarService.initialize(session.accessToken);
    
    const workHealthData = await calendarService.analyzeWorkHealth();
    
    res.status(200).json(workHealthData);
  } catch (error) {
    console.error('Error fetching work health data:', error);
    res.status(500).json({ 
      error: 'Failed to analyze work health', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}