import Anthropic from '@anthropic-ai/sdk';
import { WorkHealthMetrics, CalendarEvent, MeetingCategory } from './googleCalendar';

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

  private createSystemPrompt(): string {
    return `You are an AI work-life balance and productivity coach analyzing calendar data to provide personalized insights. Your role is to:

1. Analyze work patterns and cognitive load indicators
2. Identify potential burnout risks and productivity opportunities
3. Provide actionable, personalized recommendations
4. Predict potential scheduling conflicts or wellness issues
5. Generate insights that adapt to individual user patterns

Focus on:
- Cognitive sustainability and mental health
- Work rhythm optimization
- Meeting effectiveness and energy management
- Personalized productivity patterns
- Predictive wellness alerts

Always provide JSON responses that are practical, evidence-based, and tailored to the individual's work patterns.`;
  }

  private createUserPrompt(analysis: CalendarAnalysis, userContext: UserContext): string {
    const { workHealth, events, patterns } = analysis;
    
    return `Analyze this user's calendar data and provide personalized insights:

WORK HEALTH METRICS:
- Adaptive Performance Index: ${workHealth.adaptivePerformanceIndex}%
- Cognitive Resilience: ${workHealth.cognitiveResilience}%
- Work Rhythm Recovery: ${workHealth.workRhythmRecovery}%
- Status: ${workHealth.status}
- Meeting Count: ${workHealth.schedule.meetingCount}
- Back-to-back Count: ${workHealth.schedule.backToBackCount}
- Focus Time: ${workHealth.focusTime} minutes
- Fragmentation Score: ${workHealth.schedule.fragmentationScore}

CALENDAR EVENTS (${events.length} total):
${events.map(event => 
  `- ${event.summary} (${event.start.toTimeString().slice(0,5)}-${event.end.toTimeString().slice(0,5)}, ${event.category}, ${event.attendees} attendees)`
).join('\n')}

MEETING PATTERNS:
${Object.entries(patterns.meetingTypes).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

USER CONTEXT:
- Work Hours: ${userContext.preferences?.workStartTime || 9}:00 - ${userContext.preferences?.workEndTime || 17}:00
- Meeting Preference: ${userContext.preferences?.meetingPreference || 'balanced'}
- Historical Avg Meetings: ${userContext.historicalPatterns?.avgDailyMeetings || 'Unknown'}
- Historical Avg Focus: ${userContext.historicalPatterns?.avgFocusTime || 'Unknown'} minutes

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
        message: `You have ${Math.round(workHealth.focusTime / 60)} hours of focus time - great for deep work!`,
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

  async generatePersonalizedInsights(
    analysis: CalendarAnalysis,
    userContext: UserContext = {}
  ): Promise<PersonalizedInsightsResponse> {
    if (!this.validateApiKey()) {
      console.warn('Anthropic API key not configured, returning default insights');
      return this.getDefaultInsights(analysis);
    }

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.3,
        system: this.createSystemPrompt(),
        messages: [{
          role: 'user',
          content: this.createUserPrompt(analysis, userContext)
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
      
      if (error instanceof Error) {
        if (error.message.includes('rate_limit')) {
          console.warn('Rate limit hit, using fallback insights');
        } else if (error.message.includes('invalid_api_key')) {
          console.error('Invalid Anthropic API key');
        } else if (error.message.includes('timeout')) {
          console.warn('Request timeout, using fallback insights');
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
- Focus Time: ${day.workHealth.focusTime} minutes
- Status: ${day.workHealth.status}
`).join('\n')}

Identify productivity patterns and provide specific recommendations for optimization.
Return JSON with 'patterns' and 'recommendations' arrays.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
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
}

export default ClaudeAIService;
export type { 
  PersonalizedInsight, 
  PersonalizedInsightsResponse, 
  UserContext, 
  CalendarAnalysis 
};