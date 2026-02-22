import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import GoogleCalendarService, { WorkHealthMetrics, CalendarEvent, MeetingCategory } from '../../src/services/googleCalendar';
import ClaudeAIService, { PersonalizedInsightsResponse, CalendarAnalysis, UserContext, TabContext } from '../../src/services/claudeAI';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set aggressive no-cache headers for production
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // Extract tab context from query parameters
  const tabType = req.query.tab as string;
  const tabContext: TabContext | undefined = tabType && ['overview', 'performance', 'resilience', 'sustainability'].includes(tabType)
    ? { tabType: tabType as 'overview' | 'performance' | 'resilience' | 'sustainability' }
    : undefined;

  // Extract user timezone from query parameter or header (CLIENT-SIDE DETECTION)
  const userTimezone = (req.query.timezone as string) || req.headers['x-user-timezone'] as string || 'America/Los_Angeles';

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
    
    // Get calendar events and work health analysis using CLIENT-SIDE detected timezone
    const events = await calendarService.getTodaysEvents(userTimezone);
    const workHealthData = await calendarService.analyzeWorkHealth(userTimezone);
    
    // Create enhanced response with backward compatibility
    interface EnhancedWorkHealthResponse extends WorkHealthMetrics {
      ai?: PersonalizedInsightsResponse;
      aiStatus?: 'success' | 'fallback' | 'unavailable';
    }
    
    let enhancedResponse: EnhancedWorkHealthResponse = { ...workHealthData };

    // Try to get AI insights (NO CACHING - always fresh)
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
      
      const aiInsights = await claudeService.generatePersonalizedInsights(calendarAnalysis, userContext, tabContext, userTimezone);
      
      enhancedResponse.ai = aiInsights;
      enhancedResponse.aiStatus = 'success';
      
    } catch (aiError) {
      console.warn('AI insights generation failed, continuing with calendar data only:', aiError);
      enhancedResponse.aiStatus = 'fallback';

      // Add minimal AI status info for debugging
      if (aiError instanceof Error) {
        console.log('AI Error details:', aiError.message);
      }

      // Provide fallback hero message so the UI doesn't show a blank/stuck state
      const { comicReliefGenerator } = require('../../src/utils/comicReliefGenerator');
      const quote = comicReliefGenerator.generateQuote(workHealthData);
      enhancedResponse.ai = {
        heroMessage: {
          quote: quote.text,
          source: `${quote.source}${quote.character ? ` — ${quote.character}` : ''}`,
          subtitle: 'AI insights temporarily unavailable'
        },
        insights: [],
        summary: `Current work health status: ${workHealthData.status}.`,
        overallScore: workHealthData.adaptivePerformanceIndex,
        riskFactors: [],
        opportunities: [],
        predictiveAlerts: []
      };
    }

    console.log(`work-health: ${events.length} events, API=${enhancedResponse.adaptivePerformanceIndex}, tz=${userTimezone}`);
    res.status(200).json(enhancedResponse);
  } catch (error) {
    console.error('Error fetching work health data:', error);
    res.status(500).json({ 
      error: 'Failed to analyze work health', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}