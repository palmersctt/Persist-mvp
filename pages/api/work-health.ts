import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import GoogleCalendarService, { WorkHealthMetrics, MeetingCategory, CalendarEvent } from '../../src/services/googleCalendar';
import ClaudeAIService, { PersonalizedInsightsResponse, CalendarAnalysis, UserContext } from '../../src/services/claudeAI';

/**
 * Refresh a Google OAuth access token using the refresh token.
 * Returns the new access token string, or null if refresh fails.
 */
async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    const data = await response.json();
    if (!response.ok) return null;
    return data.access_token || null;
  } catch {
    return null;
  }
}

function isGoogleAuthError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes('401') || message.includes('403') || message.includes('Unauthorized') ||
    message.includes('insufficient') || message.includes('Invalid Credentials');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set aggressive no-cache headers for production
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // Extract user timezone from query parameter or header (CLIENT-SIDE DETECTION)
  const userTimezone = (req.query.timezone as string) || req.headers['x-user-timezone'] as string || 'America/Los_Angeles';
  const skipAI = req.query.skipAI === 'true';
  const debugAI = req.query.debugAI === 'true';

  // Extract recent quotes so AI avoids repeats
  let recentQuotes: string[] = [];
  try {
    const quotesHeader = req.headers['x-recent-quotes'] as string;
    if (quotesHeader) {
      recentQuotes = JSON.parse(decodeURIComponent(quotesHeader));
    }
  } catch {
    // Ignore malformed header
  }

  // Extract user engagement data for personalization
  let userEngagement: { sharedQuotes?: string[]; dwellFavorites?: string[]; favoriteGenres?: string[] } | undefined;
  try {
    const engagementHeader = req.headers['x-user-engagement'] as string;
    if (engagementHeader) {
      userEngagement = JSON.parse(decodeURIComponent(engagementHeader));
    }
  } catch {
    // Ignore malformed header
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
    let events: CalendarEvent[];
    let workHealthData: WorkHealthMetrics;

    // Fetch calendar data with server-side token refresh retry on auth errors
    try {
      await calendarService.initialize(session.accessToken!);
      events = await calendarService.getTodaysEvents(userTimezone);
      workHealthData = await calendarService.analyzeWorkHealth(userTimezone, events);
    } catch (calendarErr) {
      // If Google rejected the token (401/403), try refreshing and retrying once
      if (isGoogleAuthError(calendarErr) && session.refreshToken) {
        console.log('work-health: Google auth error, attempting token refresh...');
        const newAccessToken = await refreshGoogleToken(session.refreshToken);
        if (newAccessToken) {
          console.log('work-health: Token refreshed, retrying calendar fetch...');
          await calendarService.initialize(newAccessToken);
          events = await calendarService.getTodaysEvents(userTimezone);
          workHealthData = await calendarService.analyzeWorkHealth(userTimezone, events);
        } else {
          throw calendarErr;
        }
      } else {
        throw calendarErr;
      }
    }

    // Create enhanced response with backward compatibility
    interface EnhancedWorkHealthResponse extends WorkHealthMetrics {
      ai?: PersonalizedInsightsResponse;
      aiStatus?: 'success' | 'fallback' | 'unavailable' | 'local';
      _aiError?: string;
      _aiDebug?: {
        hasApiKey: boolean;
        apiKeyPrefix?: string;
        constructorOk: boolean;
        error?: string;
        errorType?: string;
        timeoutMs?: number;
      };
    }

    const enhancedResponse: EnhancedWorkHealthResponse = { ...workHealthData };

    // Build calendar analysis (shared by both fast and full paths)
    const meetingTypes = events.reduce((acc, event) => {
      acc[event.category || 'COLLABORATIVE'] = (acc[event.category || 'COLLABORATIVE'] || 0) + 1;
      return acc;
    }, {} as Record<MeetingCategory, number>);

    const timeDistribution = events.reduce((acc, event) => {
      const hour = event.start.getHours();
      const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
      patterns: { meetingTypes, timeDistribution, focusBlocks },
      ...(userEngagement && { engagement: userEngagement }),
    };

    // Fast path: return local quotes + metric insights immediately (no AI call)
    if (skipAI) {
      try {
        const claudeService = new ClaudeAIService();
        enhancedResponse.ai = claudeService.getDefaultInsights(calendarAnalysis);
        enhancedResponse.aiStatus = 'local';
      } catch {
        // If ClaudeAIService can't be instantiated, generate minimal fallback
        const { comicReliefGenerator } = await import('../../src/utils/comicReliefGenerator');
        const quote = comicReliefGenerator.generateQuote(workHealthData);
        const fallbackQuotes = comicReliefGenerator.generateMultipleQuotes(workHealthData, 5);
        enhancedResponse.ai = {
          heroMessage: {
            quote: quote.text,
            source: `${quote.source}${quote.character ? ` — ${quote.character}` : ''}`,
            subtitle: 'Loading AI insights...'
          },
          heroMessages: fallbackQuotes.map((q: { text: string; source: string; character?: string }) => ({
            quote: q.text,
            source: `${q.source}${q.character ? ` — ${q.character}` : ''}`,
            subtitle: 'Loading AI insights...'
          })),
          insights: [],
          summary: `Current work health status: ${workHealthData.status}.`,
          overallScore: workHealthData.adaptivePerformanceIndex,
          riskFactors: [],
          opportunities: [],
          predictiveAlerts: []
        };
        enhancedResponse.aiStatus = 'local';
      }
      console.log(`work-health (fast): ${events.length} events, API=${enhancedResponse.adaptivePerformanceIndex}, tz=${userTimezone}`);
      return res.status(200).json(enhancedResponse);
    }

    // Full path: call Claude AI with server-side timeout
    // Give AI a fair shot (12s) before falling back to local quotes
    const AI_TIMEOUT_MS = 25000;

    // Step 1: Try to construct the service (tests API key existence)
    let claudeService: ClaudeAIService | null = null;
    let constructorError: string | null = null;
    try {
      claudeService = new ClaudeAIService();
    } catch (err) {
      constructorError = err instanceof Error ? err.message : 'Unknown constructor error';
      console.error('❌ ClaudeAIService constructor failed:', constructorError);
    }

    // Debug info (always collected, only returned if debugAI=true)
    const aiDebug = {
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
      apiKeyPrefix: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...' : 'NOT_SET',
      constructorOk: !!claudeService,
      error: constructorError || undefined,
      errorType: undefined as string | undefined,
      timeoutMs: AI_TIMEOUT_MS,
    };

    if (!claudeService) {
      // API key is missing or invalid — can't even try AI
      enhancedResponse._aiError = constructorError || 'API key not configured';
      enhancedResponse.aiStatus = 'unavailable';
      if (debugAI) enhancedResponse._aiDebug = aiDebug;

      // Fall back to offline quotes
      try {
        // getDefaultInsights needs a ClaudeAIService instance for metric insights generation
        // Since constructor failed, go straight to comicReliefGenerator
        const { comicReliefGenerator: fallbackGen } = await import('../../src/utils/comicReliefGenerator');
        const quote = fallbackGen.generateQuote(workHealthData);
        const fallbackQuotes = fallbackGen.generateMultipleQuotes(workHealthData, 5);
        enhancedResponse.ai = {
          heroMessage: {
            quote: quote.text,
            source: `${quote.source}${quote.character ? ` — ${quote.character}` : ''}`,
            subtitle: 'AI unavailable — showing offline quotes'
          },
          heroMessages: fallbackQuotes.map((q: { text: string; source: string; character?: string }) => ({
            quote: q.text,
            source: `${q.source}${q.character ? ` — ${q.character}` : ''}`,
            subtitle: 'AI unavailable — showing offline quotes'
          })),
          insights: [],
          summary: `Current work health status: ${workHealthData.status}.`,
          overallScore: workHealthData.adaptivePerformanceIndex,
          riskFactors: [],
          opportunities: [],
          predictiveAlerts: []
        };
      } catch {
        // Last resort — shouldn't happen
      }
    } else {
      // Step 2: Constructor succeeded, try the actual AI call
      try {
        const userContext: UserContext = {
          userId: session.user?.id || session.user?.email || 'anonymous',
          preferences: {
            workStartTime: 9,
            workEndTime: 17,
            meetingPreference: 'balanced'
          }
        };

        const aiInsights = await Promise.race([
          claudeService.generatePersonalizedInsights(calendarAnalysis, userContext, undefined, userTimezone, recentQuotes),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI_TIMEOUT')), AI_TIMEOUT_MS)
          ),
        ]);

        enhancedResponse.ai = aiInsights;

        if (aiInsights._aiGenerated) {
          enhancedResponse.aiStatus = 'success';
        } else {
          // generatePersonalizedInsights caught an error internally and returned fallback
          enhancedResponse.aiStatus = 'fallback';
          enhancedResponse._aiError = (aiInsights as PersonalizedInsightsResponse & { _aiError?: string })._aiError || 'AI call failed internally (check server logs)';
          aiDebug.errorType = 'internal_fallback';
          aiDebug.error = enhancedResponse._aiError;
        }

      } catch (aiError) {
        const isTimeout = aiError instanceof Error && aiError.message === 'AI_TIMEOUT';
        const errorMsg = aiError instanceof Error ? aiError.message : 'Unknown AI error';

        if (isTimeout) {
          console.log(`⏱️ AI timed out after ${AI_TIMEOUT_MS}ms, using local insights`);
          enhancedResponse._aiError = `AI timed out after ${AI_TIMEOUT_MS}ms`;
          aiDebug.errorType = 'timeout';
        } else {
          console.warn('AI insights generation failed:', aiError);
          enhancedResponse._aiError = errorMsg;
          aiDebug.errorType = 'exception';
          aiDebug.error = errorMsg;
        }

        enhancedResponse.aiStatus = isTimeout ? 'local' : 'fallback';

        // Fall back to local insights
        enhancedResponse.ai = claudeService.getDefaultInsights(calendarAnalysis);
      }

      if (debugAI) enhancedResponse._aiDebug = aiDebug;
    }

    console.log(`work-health: ${events.length} events, API=${enhancedResponse.adaptivePerformanceIndex}, aiStatus=${enhancedResponse.aiStatus}, tz=${userTimezone}`);
    res.status(200).json(enhancedResponse);
  } catch (error) {
    console.error('Error fetching work health data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Google API often returns 403/404 on first use before token fully propagates
    const isGoogleApiError = message.includes('Google') || message.includes('calendar') || message.includes('403') || message.includes('404');
    res.status(isGoogleApiError ? 503 : 500).json({
      error: isGoogleApiError ? 'Calendar not ready yet — please retry' : 'Failed to analyze work health',
      details: message,
      retryable: isGoogleApiError,
    });
  }
}