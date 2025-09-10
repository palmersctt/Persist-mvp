import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import GoogleCalendarService, { WorkHealthMetrics, CalendarEvent, MeetingCategory } from '../../src/services/googleCalendar';
import ClaudeAIService, { PersonalizedInsightsResponse, CalendarAnalysis, UserContext, TabContext } from '../../src/services/claudeAI';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract tab context from query parameters
  const tabType = req.query.tab as string;
  const tabContext: TabContext | undefined = tabType && ['overview', 'performance', 'resilience', 'sustainability'].includes(tabType)
    ? { tabType: tabType as 'overview' | 'performance' | 'resilience' | 'sustainability' }
    : undefined;

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
    
    // Get calendar events and work health analysis
    const events = await calendarService.getTodaysEvents();
    const workHealthData = await calendarService.analyzeWorkHealth();
    
    // Create enhanced response with backward compatibility
    interface EnhancedWorkHealthResponse extends WorkHealthMetrics {
      ai?: PersonalizedInsightsResponse;
      aiStatus?: 'success' | 'fallback' | 'unavailable';
    }
    
    let enhancedResponse: EnhancedWorkHealthResponse = { ...workHealthData };
    
    // Try to get AI insights
    try {
      const claudeService = new ClaudeAIService();
      
      // Create meeting patterns analysis
      const meetingTypes = events.reduce((acc, event) => {
        acc[event.category || 'COLLABORATIVE'] = (acc[event.category || 'COLLABORATIVE'] || 0) + 1;
        return acc;
      }, {} as Record<MeetingCategory, number>);
      
      // Create time distribution (simplified for now)
      const timeDistribution = events.reduce((acc, event) => {
        const hour = event.start.getHours();
        const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        acc[timeSlot] = (acc[timeSlot] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Find focus blocks (gaps >= 90 minutes between meetings)
      const focusBlocks = [];
      for (let i = 0; i < events.length - 1; i++) {
        const currentEnd = events[i].end;
        const nextStart = events[i + 1].start;
        const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
        
        if (gapMinutes >= 90) {
          focusBlocks.push({
            start: currentEnd.getHours() + (currentEnd.getMinutes() / 60),
            duration: gapMinutes
          });
        }
      }
      
      const calendarAnalysis: CalendarAnalysis = {
        workHealth: workHealthData,
        events,
        patterns: {
          meetingTypes,
          timeDistribution,
          focusBlocks
        }
      };
      
      const userContext: UserContext = {
        userId: session.user?.id || session.user?.email || 'anonymous',
        preferences: {
          workStartTime: 9,
          workEndTime: 17,
          meetingPreference: 'balanced'
        }
      };
      
      const aiInsights = await claudeService.generatePersonalizedInsights(calendarAnalysis, userContext, tabContext);
      
      enhancedResponse.ai = aiInsights;
      enhancedResponse.aiStatus = 'success';
      
    } catch (aiError) {
      console.warn('AI insights generation failed, continuing with calendar data only:', aiError);
      enhancedResponse.aiStatus = 'fallback';
      
      // Add minimal AI status info for debugging
      if (aiError instanceof Error) {
        console.log('AI Error details:', aiError.message);
      }
    }
    
    res.status(200).json(enhancedResponse);
  } catch (error) {
    console.error('Error fetching work health data:', error);
    res.status(500).json({ 
      error: 'Failed to analyze work health', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}