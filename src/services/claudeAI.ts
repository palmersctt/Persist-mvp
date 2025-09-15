import Anthropic from '@anthropic-ai/sdk';
import { WorkHealthMetrics, CalendarEvent, MeetingCategory } from './googleCalendar';
import crypto from 'crypto';

interface PersonalizedInsight {
  category: 'performance' | 'wellness' | 'productivity' | 'balance' | 'prediction';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  actionable: boolean;
  recommendation?: string;
  timeframe?: string;
  confidence: number;
}

interface UserContext {
  userId?: string;
  preferences?: {
    workStartTime?: number;
    workEndTime?: number;
    preferredFocusBlocks?: number;
    meetingPreference?: 'minimal' | 'balanced' | 'heavy';
  };
  historicalPatterns?: {
    avgDailyMeetings?: number;
    avgFocusTime?: number;
    productiveTimes?: number[];
    burnoutIndicators?: string[];
  };
  currentGoals?: string[];
}

interface TabContext {
  tabType: 'overview' | 'performance' | 'resilience' | 'sustainability';
  focusArea?: string;
}

interface CalendarAnalysis {
  workHealth: WorkHealthMetrics;
  events: CalendarEvent[];
  patterns: {
    meetingTypes: Record<MeetingCategory, number>;
    timeDistribution: Record<string, number>;
    focusBlocks: { start: number; duration: number }[];
  };
}

interface PersonalizedInsightsResponse {
  insights: PersonalizedInsight[];
  summary: string;
  overallScore: number;
  riskFactors: string[];
  opportunities: string[];
  predictiveAlerts: string[];
}

class ClaudeAIService {
  private anthropic: Anthropic;
  private apiKey: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.');
    }
    
    this.anthropic = new Anthropic({
      apiKey: this.apiKey,
    });
  }

  private validateApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  // Convert Date to 12-hour format (e.g., "6:00 PM") in user's timezone
  private formatTime12Hour(date: Date, userTimezone?: string): string {
    const timezone = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone
    });
  }

  // Convert minutes to hours and minutes format (e.g., "2 hrs 38 mins")
  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} mins`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (remainingMins === 0) {
      return hours === 1 ? '1 hr' : `${hours} hrs`;
    }
    return `${hours} hr${hours === 1 ? '' : 's'} ${remainingMins} mins`;
  }

  private createSystemPrompt(): string {
    return `You are a smart colleague who knows this person's work patterns and can predict how their day will actually feel and go.

WRITE INSIGHTS THAT SOUND LIKE YOU'RE TALKING TO THEM:
- "You'll probably feel energized this morning, but that 3-hour meeting might drain you by evening"
- "Your brain typically hits its stride around 10 AM - perfect timing for that presentation" 
- "Back-to-back meetings until lunch might leave you feeling scattered for the afternoon work"
- "This feels like one of those productive days where everything just clicks"
- "Your afternoon looks packed - you might feel rushed between those client calls"

FOCUS ON THEIR ACTUAL EXPERIENCE:
- How they'll likely feel during different parts of the day
- What their energy levels will be like hour by hour
- Whether they're set up for a good day or a stressful one
- How their workload will affect their mood and performance
- What they should realistically expect from today

AVOID technical language, clinical analysis, formal recommendations, or confidence percentages.

Write like you're having a conversation with them using "you'll feel", "your energy will", "this should be".`;
  }

  private createTabSpecificPrompt(analysis: CalendarAnalysis, userContext: UserContext, tabContext: TabContext, providedUserTimezone?: string): string {
    const { workHealth, events, patterns } = analysis;
    
    // Use provided timezone (from client-side) instead of server detection
    const userTimezone = providedUserTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
    
    console.log('🌍 createTabSpecificPrompt timezone:', {
      providedUserTimezone: providedUserTimezone,
      serverDetected: Intl.DateTimeFormat().resolvedOptions().timeZone,
      finalUsed: userTimezone,
      source: providedUserTimezone ? 'PROVIDED_FROM_CLIENT' : 'SERVER_FALLBACK'
    });
    
    const baseContext = `WORK HEALTH METRICS:
- Adaptive Performance Index: ${workHealth.adaptivePerformanceIndex}%
- Cognitive Resilience: ${workHealth.cognitiveResilience}%
- Work Rhythm Recovery: ${workHealth.workRhythmRecovery}%
- Status: ${workHealth.status}
- Meeting Count: ${workHealth.schedule.meetingCount}
- Back-to-back Count: ${workHealth.schedule.backToBackCount}
- Focus Time: ${this.formatDuration(workHealth.focusTime)}
- Fragmentation Score: ${workHealth.schedule.fragmentationScore}

CALENDAR EVENTS (${events.length} total):
${events.map(event => 
  `- ${event.summary} (${this.formatTime12Hour(event.start, userTimezone)}-${this.formatTime12Hour(event.end, userTimezone)}, ${event.category}, ${event.attendees} attendees)`
).join('\n')}

MEETING PATTERNS:
${Object.entries(patterns.meetingTypes).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

USER CONTEXT:
- Work Hours: ${userContext.preferences?.workStartTime || 9}:00 - ${userContext.preferences?.workEndTime || 17}:00
- Meeting Preference: ${userContext.preferences?.meetingPreference || 'balanced'}
- Historical Avg Meetings: ${userContext.historicalPatterns?.avgDailyMeetings || 'Unknown'}
- Historical Avg Focus: ${userContext.historicalPatterns?.avgFocusTime ? this.formatDuration(userContext.historicalPatterns.avgFocusTime) : 'Unknown'}`;

    switch (tabContext.tabType) {
      case 'overview':
        return `Look at their whole day and predict how it'll feel from start to finish.

${baseContext}

Tell them what kind of day this will be for them:
- How their energy will flow throughout the day
- Whether this feels like a good day or a tough day ahead
- What their overall mood and productivity will be like
- How they'll probably feel at different times

Write conversational insights like:
- "Your day has a nice rhythm - you'll feel energized in the morning and should stay productive through the afternoon"
- "This feels like one of those days where you'll get a lot done but might feel pretty drained by evening"
- "You're set up for a smooth day with good energy flow and manageable workload"
- "Today might feel a bit overwhelming with everything packed in, but you should handle it fine"

Provide a JSON response in exactly this format:
{
  "insights": [
    {
      "category": "performance",
      "title": "Insight Title",
      "message": "Detailed conversational insight message",
      "severity": "info",
      "actionable": true,
      "confidence": 85
    }
  ],
  "summary": "Brief overview of the day",
  "overallScore": 75,
  "riskFactors": ["factor1", "factor2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "predictiveAlerts": ["alert1", "alert2"]
}`;
      
      case 'performance':
        return `Focus on how productive and sharp they'll feel today - when they'll do their best work and when they might struggle.

${baseContext}

Tell them about their performance throughout the day:
- When their brain will be firing on all cylinders vs feeling sluggish
- What times they'll tackle complex work easily vs when to stick to simpler tasks
- How sharp and focused they'll feel during different meetings
- Whether they're set up for a high-performance day or need to manage expectations

Write conversational insights like:
- "You'll probably feel sharp and focused this morning - perfect timing for that important client call"
- "Your brain should be firing on all cylinders around 10 AM, but you might feel a bit sluggish after lunch"
- "This looks like one of those days where you'll power through your to-do list without much trouble"
- "You might feel scattered with all those meetings, but your afternoon focus block should help you get back on track"

Provide a JSON response in exactly this format:
{
  "insights": [
    {
      "category": "performance",
      "title": "Performance Insight Title",
      "message": "Detailed performance-focused insight",
      "severity": "info",
      "actionable": true,
      "confidence": 85
    }
  ],
  "summary": "Performance overview",
  "overallScore": ${workHealth.adaptivePerformanceIndex},
  "riskFactors": [],
  "opportunities": [],
  "predictiveAlerts": []
}`;
      
      case 'resilience':
        return `Focus on how well they'll handle stress and pressure today - whether they'll feel calm and composed or a bit overwhelmed.

${baseContext}

Tell them about their stress handling today:
- How they'll react to pressure and difficult moments
- Whether they'll bounce back easily from setbacks or feel more rattled
- When they might feel calm and composed vs when stress could get to them
- How they'll handle interruptions, changes, and curveballs

Write conversational insights like:
- "You should feel pretty calm and collected today - ready to handle whatever comes your way"
- "You might feel a bit more reactive than usual with all those back-to-back meetings piling up"
- "That long afternoon meeting could test your patience, but you'll probably bounce back fine"
- "You're in good shape to stay composed, even if things don't go exactly as planned"

You must respond with valid JSON only. Provide a JSON response in exactly this format:
{
  "insights": [
    {
      "category": "wellness",
      "title": "Resilience Insight Title",
      "message": "Detailed resilience-focused insight",
      "severity": "info",
      "actionable": true,
      "confidence": 85
    }
  ],
  "summary": "Resilience overview",
  "overallScore": ${workHealth.cognitiveResilience},
  "riskFactors": [],
  "opportunities": [],
  "predictiveAlerts": []
}`;
      
      case 'sustainability':
        return `Focus on whether today's pace feels sustainable - if they can keep this up or if it might wear them down over time.

${baseContext}

Tell them about the long-term impact of today's workload:
- Whether this pace feels manageable to maintain or might lead to burnout
- If they're building good work habits or pushing too hard
- How today fits into their overall work rhythm and energy
- Whether they'll feel refreshed tomorrow or need recovery time

Write conversational insights like:
- "This pace feels sustainable - you're in a good groove that you could keep up for weeks"
- "Today's intensity is fine for now, but this pattern might wear you down if it becomes the norm"
- "You're hitting a nice sustainable rhythm that should leave you energized for tomorrow"
- "This workload feels a bit much - you might need some lighter days after this to recharge"

Provide a JSON response in exactly this format:
{
  "insights": [
    {
      "category": "balance",
      "title": "Sustainability Insight Title",
      "message": "Detailed sustainability-focused insight",
      "severity": "info",
      "actionable": true,
      "confidence": 85
    }
  ],
  "summary": "Sustainability overview",
  "overallScore": ${workHealth.workRhythmRecovery},
  "riskFactors": [],
  "opportunities": [],
  "predictiveAlerts": []
}`;
      
      default:
        return this.createUserPrompt(analysis, userContext);
    }
  }

  private createUserPrompt(analysis: CalendarAnalysis, userContext: UserContext, providedUserTimezone?: string): string {
    const { workHealth, events, patterns } = analysis;
    
    // Use provided timezone (from client-side) instead of server detection
    const userTimezone = providedUserTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
    
    console.log('🌍 createUserPrompt timezone:', {
      providedUserTimezone: providedUserTimezone,
      serverDetected: Intl.DateTimeFormat().resolvedOptions().timeZone,
      finalUsed: userTimezone,
      source: providedUserTimezone ? 'PROVIDED_FROM_CLIENT' : 'SERVER_FALLBACK'
    });
    
    return `Analyze this user's calendar data and provide personalized insights:

WORK HEALTH METRICS:
- Adaptive Performance Index: ${workHealth.adaptivePerformanceIndex}%
- Cognitive Resilience: ${workHealth.cognitiveResilience}%
- Work Rhythm Recovery: ${workHealth.workRhythmRecovery}%
- Status: ${workHealth.status}
- Meeting Count: ${workHealth.schedule.meetingCount}
- Back-to-back Count: ${workHealth.schedule.backToBackCount}
- Focus Time: ${this.formatDuration(workHealth.focusTime)}
- Fragmentation Score: ${workHealth.schedule.fragmentationScore}

CALENDAR EVENTS (${events.length} total):
${events.map(event => 
  `- ${event.summary} (${this.formatTime12Hour(event.start, userTimezone)}-${this.formatTime12Hour(event.end, userTimezone)}, ${event.category}, ${event.attendees} attendees)`
).join('\n')}

MEETING PATTERNS:
${Object.entries(patterns.meetingTypes).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

USER CONTEXT:
- Work Hours: ${userContext.preferences?.workStartTime || 9}:00 - ${userContext.preferences?.workEndTime || 17}:00
- Meeting Preference: ${userContext.preferences?.meetingPreference || 'balanced'}
- Historical Avg Meetings: ${userContext.historicalPatterns?.avgDailyMeetings || 'Unknown'}
- Historical Avg Focus: ${userContext.historicalPatterns?.avgFocusTime ? this.formatDuration(userContext.historicalPatterns.avgFocusTime) : 'Unknown'}

Provide a JSON response with personalized insights that include:
1. Performance optimization recommendations
2. Wellness and burnout prevention insights
3. Productivity enhancement suggestions
4. Work-life balance guidance
5. Predictive alerts for potential issues

Focus on actionable, specific advice tailored to this user's patterns and current state.`;
  }

  private getDefaultInsights(analysis: CalendarAnalysis): PersonalizedInsightsResponse {
    const { workHealth } = analysis;
    const insights: PersonalizedInsight[] = [];

    if (workHealth.adaptivePerformanceIndex < 50) {
      insights.push({
        category: 'performance',
        title: 'Performance Optimization Needed',
        message: `Your adaptive performance index is ${workHealth.adaptivePerformanceIndex}%. Consider reducing meeting load or increasing focus time blocks.`,
        severity: 'warning',
        actionable: true,
        recommendation: 'Block 2-hour focus periods in your calendar and decline non-essential meetings.',
        confidence: 85
      });
    }

    if (workHealth.cognitiveResilience < 40) {
      insights.push({
        category: 'wellness',
        title: 'Cognitive Overload Risk',
        message: 'Your cognitive resilience is low, indicating high mental switching costs and decision fatigue.',
        severity: 'critical',
        actionable: true,
        recommendation: 'Take regular breaks between meetings and batch similar tasks together.',
        confidence: 80
      });
    }

    if (workHealth.schedule.backToBackCount >= 3) {
      insights.push({
        category: 'balance',
        title: 'Too Many Consecutive Meetings',
        message: `You have ${workHealth.schedule.backToBackCount} back-to-back meetings, which increases mental fatigue.`,
        severity: 'warning',
        actionable: true,
        recommendation: 'Add 15-minute buffers between meetings for mental transitions.',
        confidence: 90
      });
    }

    if (workHealth.focusTime >= 240) {
      insights.push({
        category: 'productivity',
        title: 'Excellent Focus Time Available',
        message: `You have ${this.formatDuration(workHealth.focusTime)} of focus time - great for deep work!`,
        severity: 'success',
        actionable: true,
        recommendation: 'Use your focus blocks for your most challenging and creative work.',
        confidence: 95
      });
    }

    return {
      insights,
      summary: `Current work health status: ${workHealth.status}. Focus on ${insights.length > 0 ? insights[0].category : 'maintaining balance'}.`,
      overallScore: workHealth.adaptivePerformanceIndex,
      riskFactors: workHealth.cognitiveResilience < 40 ? ['High cognitive load', 'Decision fatigue'] : [],
      opportunities: workHealth.focusTime >= 180 ? ['Deep work opportunities', 'Creative problem solving'] : ['Schedule optimization'],
      predictiveAlerts: workHealth.schedule.backToBackCount >= 4 ? ['Burnout risk from meeting overload'] : []
    };
  }

  // Intelligent caching methods
  private generateCacheKey(analysis: CalendarAnalysis, userContext: UserContext, tabContext?: TabContext): string {
    // Create a deterministic hash based on the actual calendar data that affects insights
    const cacheData = {
      // Core calendar data that affects AI insights
      events: analysis.events.map(event => ({
        summary: event.summary,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        category: event.category,
        attendees: event.attendees
      })),
      // Work health metrics
      workHealth: {
        adaptivePerformanceIndex: analysis.workHealth.adaptivePerformanceIndex,
        cognitiveResilience: analysis.workHealth.cognitiveResilience,
        workRhythmRecovery: analysis.workHealth.workRhythmRecovery,
        meetingCount: analysis.workHealth.schedule.meetingCount,
        backToBackCount: analysis.workHealth.schedule.backToBackCount,
        focusTime: analysis.workHealth.focusTime,
        fragmentationScore: analysis.workHealth.schedule.fragmentationScore
      },
      // User context that might affect insights
      userContext: {
        workStartTime: userContext.preferences?.workStartTime,
        workEndTime: userContext.preferences?.workEndTime,
        meetingPreference: userContext.preferences?.meetingPreference
      },
      // Tab context
      tabType: tabContext?.tabType || 'overview',
      // Date to ensure daily cache invalidation
      date: new Date().toDateString()
    };
    
    const dataString = JSON.stringify(cacheData);
    return crypto.createHash('md5').update(dataString).digest('hex');
  }

  private getCachedInsights(cacheKey: string, userId: string): PersonalizedInsightsResponse | null {
    if (typeof window === 'undefined') return null; // Server-side, no localStorage
    
    try {
      const cached = localStorage.getItem(`ai-insights-${userId}-${cacheKey}`);
      if (!cached) return null;
      
      const cachedData = JSON.parse(cached);
      
      // Check if cache is still valid (within 4 hours for same data)
      const cacheTime = new Date(cachedData.timestamp);
      const now = new Date();
      const hoursSinceCache = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCache > 4) {
        // Cache expired, remove it
        localStorage.removeItem(`ai-insights-${userId}-${cacheKey}`);
        return null;
      }
      
      return cachedData.insights;
    } catch (error) {
      console.warn('Error reading AI insights cache:', error);
      return null;
    }
  }

  private setCachedInsights(cacheKey: string, userId: string, insights: PersonalizedInsightsResponse): void {
    if (typeof window === 'undefined') return; // Server-side, no localStorage
    
    try {
      const cacheData = {
        insights,
        timestamp: new Date().toISOString(),
        cacheKey
      };
      
      localStorage.setItem(`ai-insights-${userId}-${cacheKey}`, JSON.stringify(cacheData));
      
      // Clean up old cache entries to prevent localStorage bloat
      this.cleanupOldCache(userId);
    } catch (error) {
      console.warn('Error saving AI insights cache:', error);
    }
  }

  private cleanupOldCache(userId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      const aiCacheKeys = keys.filter(key => key.startsWith(`ai-insights-${userId}-`));
      
      // Keep only the 10 most recent cache entries per user
      if (aiCacheKeys.length > 10) {
        const cacheEntries = aiCacheKeys.map(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            return { key, timestamp: new Date(data.timestamp || 0) };
          } catch {
            return { key, timestamp: new Date(0) };
          }
        }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        // Remove oldest entries
        cacheEntries.slice(10).forEach(entry => {
          localStorage.removeItem(entry.key);
        });
      }
    } catch (error) {
      console.warn('Error cleaning up AI insights cache:', error);
    }
  }

  async generatePersonalizedInsights(
    analysis: CalendarAnalysis,
    userContext: UserContext = {},
    tabContext?: TabContext,
    providedUserTimezone?: string
  ): Promise<PersonalizedInsightsResponse> {
    if (!this.validateApiKey()) {
      console.warn('Anthropic API key validation failed. Debugging info:');
      console.warn('- API Key exists:', !!this.apiKey);
      console.warn('- API Key length:', this.apiKey?.length || 0);
      console.warn('- API Key starts with sk-ant:', this.apiKey?.startsWith('sk-ant') || false);
      console.warn('- Environment:', process.env.NODE_ENV);
      console.warn('Returning default insights instead of AI-generated insights');
      return this.getDefaultInsights(analysis);
    }

    try {
      // Check if we should use cache (this will be handled client-side in the API)
      const cacheKey = this.generateCacheKey(analysis, userContext, tabContext);
      console.log('Generated cache key for AI insights:', cacheKey);

      const promptContent = tabContext 
        ? this.createTabSpecificPrompt(analysis, userContext, tabContext, providedUserTimezone)
        : this.createUserPrompt(analysis, userContext, providedUserTimezone);
      
      // Debug logging for production issues
      console.log('🔍 DEBUG - Prompt being sent to AI (first 500 chars):', promptContent.substring(0, 500));
      console.log('🔄 NO CACHING - Fresh AI request every time');
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        temperature: 0.3,
        system: this.createSystemPrompt(),
        messages: [{
          role: 'user',
          content: promptContent
        }]
      });

      const textContent = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');

      if (!textContent) {
        throw new Error('No text content received from Claude');
      }

      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      if (!this.validateInsightsResponse(parsedResponse)) {
        throw new Error('Invalid insights response format');
      }

      return parsedResponse;

    } catch (error) {
      console.error('Error generating AI insights:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        environment: process.env.NODE_ENV
      });
      
      if (error instanceof Error) {
        if (error.message.includes('rate_limit')) {
          console.warn('Rate limit hit, using fallback insights');
        } else if (error.message.includes('invalid_api_key')) {
          console.error('Invalid Anthropic API key - check environment variables in production');
        } else if (error.message.includes('timeout')) {
          console.warn('Request timeout, using fallback insights');
        } else if (error.message.includes('network')) {
          console.warn('Network error, using fallback insights');
        }
      }
      
      return this.getDefaultInsights(analysis);
    }
  }

  private validateInsightsResponse(response: any): response is PersonalizedInsightsResponse {
    return (
      response &&
      typeof response === 'object' &&
      Array.isArray(response.insights) &&
      typeof response.summary === 'string' &&
      typeof response.overallScore === 'number' &&
      Array.isArray(response.riskFactors) &&
      Array.isArray(response.opportunities) &&
      Array.isArray(response.predictiveAlerts)
    );
  }

  async analyzeProductivityPatterns(
    historicalData: CalendarAnalysis[],
    userContext: UserContext = {}
  ): Promise<{ patterns: string[]; recommendations: string[] }> {
    if (!this.validateApiKey() || historicalData.length === 0) {
      return {
        patterns: ['Insufficient data for pattern analysis'],
        recommendations: ['Continue tracking your calendar for personalized insights']
      };
    }

    try {
      const promptContent = `Analyze these historical work patterns and identify trends:

${historicalData.map((day, index) => `
Day ${index + 1}:
- Performance Index: ${day.workHealth.adaptivePerformanceIndex}%
- Meetings: ${day.workHealth.schedule.meetingCount}
- Focus Time: ${this.formatDuration(day.workHealth.focusTime)}
- Status: ${day.workHealth.status}
`).join('\n')}

Identify productivity patterns and provide specific recommendations for optimization.
Return JSON with 'patterns' and 'recommendations' arrays.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        temperature: 0.2,
        messages: [{
          role: 'user',
          content: promptContent
        }]
      });

      const textContent = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');

      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        if (result.patterns && result.recommendations) {
          return result;
        }
      }

      throw new Error('Invalid response format');

    } catch (error) {
      console.error('Error analyzing productivity patterns:', error);
      return {
        patterns: ['Unable to analyze patterns at this time'],
        recommendations: ['Focus on maintaining consistent work schedules and regular breaks']
      };
    }
  }

  getHealthStatus(): 'healthy' | 'degraded' | 'unavailable' {
    if (!this.validateApiKey()) {
      return 'unavailable';
    }
    
    return 'healthy';
  }

  // Public methods for intelligent caching
  public getCacheKeyForInsights(analysis: CalendarAnalysis, userContext: UserContext, tabContext?: TabContext): string {
    return this.generateCacheKey(analysis, userContext, tabContext);
  }

  public getCachedInsightsForUser(cacheKey: string, userId: string): PersonalizedInsightsResponse | null {
    return this.getCachedInsights(cacheKey, userId);
  }

  public setCachedInsightsForUser(cacheKey: string, userId: string, insights: PersonalizedInsightsResponse): void {
    this.setCachedInsights(cacheKey, userId, insights);
  }
}

export default ClaudeAIService;
export type { 
  PersonalizedInsight, 
  PersonalizedInsightsResponse, 
  UserContext, 
  CalendarAnalysis,
  TabContext
};