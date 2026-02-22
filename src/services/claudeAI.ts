import Anthropic from '@anthropic-ai/sdk';
import { WorkHealthMetrics, CalendarEvent, MeetingCategory } from './googleCalendar';
import crypto from 'crypto';
import { comicReliefGenerator } from '../utils/comicReliefGenerator';

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

interface HeroMessage {
  quote: string;
  source: string;
  subtitle: string;
}

interface MetricInsight {
  title: string;
  message: string;
  action: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

interface PersonalizedInsightsResponse {
  // Per-metric structured insights
  overview?: MetricInsight;
  performance?: MetricInsight;
  resilience?: MetricInsight;
  sustainability?: MetricInsight;

  // Legacy fields
  insights: PersonalizedInsight[];
  summary: string;
  overallScore: number;
  riskFactors: string[];
  opportunities: string[];
  predictiveAlerts: string[];
  heroMessage?: string | HeroMessage;
  comicReliefSaying?: string;
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

  private createAllInsightsPrompt(analysis: CalendarAnalysis, userContext: UserContext, providedUserTimezone?: string, prePickedQuote?: { text: string; source: string; character?: string }): string {
    const { workHealth, events, patterns } = analysis;
    const userTimezone = providedUserTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';

    const interpretScore = (score: number): string => {
      if (score >= 85) return 'excellent';
      if (score >= 75) return 'good';
      if (score >= 65) return 'moderate — room for improvement';
      if (score >= 55) return 'concerning — needs attention';
      if (score >= 40) return 'poor — significant issues';
      return 'critical — immediate action needed';
    };

    const q = prePickedQuote || comicReliefGenerator.generateQuote(workHealth);

    return `Analyze this person's calendar and write FOUR distinct insights — one for each metric below. Each insight MUST reference SPECIFIC events from their calendar by name and time. Do NOT repeat the same observation across metrics. Do NOT just restate a metric number — tell them what it MEANS for their actual day.

WORK HEALTH METRICS:
- Performance Index: ${workHealth.adaptivePerformanceIndex}% (${interpretScore(workHealth.adaptivePerformanceIndex)})
- Cognitive Resilience: ${workHealth.cognitiveResilience}% (${interpretScore(workHealth.cognitiveResilience)})
- Sustainability Index: ${workHealth.workRhythmRecovery}% (${interpretScore(workHealth.workRhythmRecovery)})
- Status: ${workHealth.status}
- Meeting Count: ${workHealth.schedule.meetingCount}
- Back-to-back Count: ${workHealth.schedule.backToBackCount}
- Focus Time: ${this.formatDuration(workHealth.focusTime)}
- Fragmentation Score: ${workHealth.schedule.fragmentationScore}

SCORE INTERPRETATION (calibrate your tone to the actual score):
- 85%+ = excellent, genuinely great day
- 75-84% = good, solid and positive
- 65-74% = moderate, okay but not great — be honest about areas to watch
- 55-64% = concerning, flag real issues
- Below 55% = problematic, be direct about challenges
IMPORTANT: Do NOT sugarcoat moderate or low scores. Match your tone to the actual numbers.

CALENDAR EVENTS (${events.length} total):
${events.map(event =>
  `- ${event.summary} (${this.formatTime12Hour(event.start, userTimezone)}-${this.formatTime12Hour(event.end, userTimezone)}, ${event.category}, ${event.attendees} attendees)`
).join('\n')}

MEETING PATTERNS:
${Object.entries(patterns.meetingTypes).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

USER CONTEXT:
- Work Hours: ${userContext.preferences?.workStartTime || 9}:00 - ${userContext.preferences?.workEndTime || 17}:00

METRIC INSTRUCTIONS — each insight covers a DIFFERENT lens. Do NOT overlap:

1. OVERVIEW — "How will today actually feel?"
   Predict their emotional arc through the day. Reference the hardest and easiest parts by event name.
   Focus: Energy flow hour by hour, overall vibe, when they'll feel sharp vs drained.
   Action: The single most impactful thing they can do to improve their day — name a specific meeting to shorten, a gap to protect, etc.
   Do NOT talk about: productivity tips, stress management, or burnout.

2. PERFORMANCE — "When will you do your best thinking?"
   Identify peak cognitive windows and what threatens them. Name the events that block or enable deep work.
   Focus: Which focus blocks are usable vs fragmented. Which meeting demands the most brainpower. When to tackle hard problems vs routine tasks.
   Action: Tell them exactly WHEN to do their hardest work and what to protect. (e.g., "Do your deep work before the 11 AM design review — after that you're in meetings until 3.")
   Do NOT talk about: feelings, stress, or sustainability.

3. RESILIENCE — "What will test your patience today?"
   Find the pressure points — specific events, transitions, or clusters that will stress them. Name them.
   Focus: Back-to-back sequences with no recovery, high-stakes meetings, context switches between unrelated topics, the moment stress peaks.
   Action: Name a specific buffer to add or a meeting where they should lower expectations for output afterward. (e.g., "Block 15 minutes after the 2 PM all-hands — you'll need a mental reset.")
   Do NOT talk about: productivity, deep work, or long-term patterns.

4. SUSTAINABILITY — "Can you keep this up?"
   Zoom out from today. Is this pace repeatable? Look at total meeting hours, recovery ratio, and late-day commitments.
   Focus: Whether today depletes or energizes them for tomorrow. Meeting-to-recovery ratio. Real downtime vs fragmented gaps. End-of-day energy level.
   Action: Name one structural change. (e.g., "Move the Thursday standup to batch with the 10 AM sync — that frees a 90-minute focus block.")
   Do NOT talk about: individual event performance or stress points.

HERO MESSAGE:
The quote has already been selected:
"${q.text}" — ${q.source}${q.character ? ` (${q.character})` : ''}
Write a SHORT subtitle (one sentence) that acts as the punchline — connecting the quote's mood to how this person's day will FEEL. Be witty, warm, or ironic. Talk about the emotional vibe of the day, not the calendar data. Do NOT list meetings, counts, or hours. Do NOT recap the schedule. Think: how would a funny friend describe your day after glancing at your calendar? Do NOT change the quote or source.

Current date: ${new Date().toLocaleDateString()}
Current time: ${new Date().toLocaleTimeString()}

You must respond with valid JSON only. Use exactly this format:
{
  "heroMessage": {
    "quote": "${q.text.replace(/"/g, '\\"')}",
    "source": "${q.source}${q.character ? ` — ${q.character}` : ''}",
    "subtitle": "Your witty one-sentence subtitle"
  },
  "overview": {
    "title": "3-5 word title",
    "message": "1-2 sentences about how today will feel. Reference specific events.",
    "action": "One specific action referencing a calendar event or time.",
    "severity": "info"
  },
  "performance": {
    "title": "3-5 word title",
    "message": "1-2 sentences about peak cognitive windows. Name events.",
    "action": "When exactly to do hard work and what to protect.",
    "severity": "info"
  },
  "resilience": {
    "title": "3-5 word title",
    "message": "1-2 sentences about pressure points. Name the culprit events.",
    "action": "A specific buffer or adjustment.",
    "severity": "info"
  },
  "sustainability": {
    "title": "3-5 word title",
    "message": "1-2 sentences about whether this pace is sustainable.",
    "action": "One structural change.",
    "severity": "info"
  },
  "insights": [],
  "summary": "One-sentence day summary",
  "overallScore": ${workHealth.adaptivePerformanceIndex},
  "riskFactors": [],
  "opportunities": [],
  "predictiveAlerts": []
}`;
  }

  private getDefaultInsights(analysis: CalendarAnalysis): PersonalizedInsightsResponse {
    const { workHealth } = analysis;
    const insights: PersonalizedInsight[] = [];

    // Use comicReliefGenerator for a large, metrics-aware quote pool (200+ quotes)
    const quote = comicReliefGenerator.generateQuote(workHealth);

    // Subtitle = emotional punchline connecting quote mood to day's vibe
    let subtitle: string;
    if (workHealth.schedule.meetingCount === 0 || workHealth.adaptivePerformanceIndex >= 90) {
      const options = [
        "Today's yours — do something worth remembering",
        "The kind of day where you actually get to think",
        "Wide open and full of possibility",
        "No one's coming for your calendar today",
        "This is what freedom looks like in corporate America",
      ];
      subtitle = options[Math.floor(Math.random() * options.length)];
    } else if (workHealth.schedule.meetingCount >= 6 || workHealth.schedule.backToBackCount >= 4) {
      const options = [
        "Survival mode activated — and that's okay",
        "Today's about getting through, not getting ahead",
        "Your calendar wrote checks your brain can't cash",
        "Breathe when you can, coast when you can't",
        "Some days you ride the wave, today you hold on",
      ];
      subtitle = options[Math.floor(Math.random() * options.length)];
    } else if (workHealth.adaptivePerformanceIndex < 50) {
      const options = [
        "Not your best day on paper, but you've handled worse",
        "The kind of day that builds character (unfortunately)",
        "Hang in there — tomorrow's a fresh calendar",
        "You'll earn that evening on the couch tonight",
      ];
      subtitle = options[Math.floor(Math.random() * options.length)];
    } else {
      const options = [
        "A solid day if you play it right",
        "Enough breathing room to actually be creative",
        "Not too heavy, not too light — just right",
        "The kind of day where small wins add up",
        "You've got this — just don't volunteer for anything new",
      ];
      subtitle = options[Math.floor(Math.random() * options.length)];
    }

    const heroMessage: HeroMessage = {
      quote: quote.text,
      source: `${quote.source}${quote.character ? ` — ${quote.character}` : ''}`,
      subtitle,
    };

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

    // Per-metric fallback insights
    const meetingCount = workHealth.schedule.meetingCount;
    const focusHours = Math.round(workHealth.focusTime / 60 * 10) / 10;
    const backToBack = workHealth.schedule.backToBackCount;

    const overviewInsight: MetricInsight = {
      title: workHealth.adaptivePerformanceIndex >= 75 ? 'Solid Day Ahead' : workHealth.adaptivePerformanceIndex >= 50 ? 'Mixed Day Ahead' : 'Demanding Day Ahead',
      message: meetingCount === 0
        ? "Wide-open calendar today — you'll have plenty of room to set your own pace."
        : `With ${meetingCount} meeting${meetingCount > 1 ? 's' : ''} and roughly ${focusHours} hours of focus time, today should feel ${workHealth.adaptivePerformanceIndex >= 75 ? 'manageable' : 'busy'}.`,
      action: meetingCount === 0
        ? 'Use the morning for your most creative work while energy is fresh.'
        : 'Protect your longest gap between meetings for your most important task.',
      severity: workHealth.adaptivePerformanceIndex >= 75 ? 'success' : workHealth.adaptivePerformanceIndex >= 50 ? 'info' : 'warning'
    };

    const performanceInsight: MetricInsight = {
      title: workHealth.adaptivePerformanceIndex >= 75 ? 'Strong Cognitive Window' : 'Limited Deep Work Time',
      message: focusHours >= 4
        ? `You have about ${focusHours} hours of uninterrupted time — your best window for complex thinking.`
        : `Only about ${focusHours} hours of focus time between meetings — be selective about what you tackle.`,
      action: focusHours >= 4
        ? 'Front-load your hardest task into the first open block before meetings start.'
        : 'Save complex problems for your longest gap; use short gaps for admin and email.',
      severity: workHealth.adaptivePerformanceIndex >= 75 ? 'success' : workHealth.adaptivePerformanceIndex >= 50 ? 'info' : 'warning'
    };

    const resilienceInsight: MetricInsight = {
      title: backToBack >= 3 ? 'Back-to-Back Pressure' : workHealth.cognitiveResilience >= 70 ? 'Good Recovery Room' : 'Watch the Transitions',
      message: backToBack >= 3
        ? `${backToBack} back-to-back meetings will pile up context-switching fatigue — your patience may thin out by the last one.`
        : backToBack >= 1
          ? `${backToBack} consecutive meeting${backToBack > 1 ? 's' : ''} will require some mental resets, but you have enough gaps to recover.`
          : 'No back-to-back meetings today — you should be able to handle whatever comes up without feeling rushed.',
      action: backToBack >= 1
        ? 'Add a 10-minute buffer after your consecutive meetings — step away from the screen.'
        : 'Use the natural breaks between meetings to briefly reset before switching contexts.',
      severity: backToBack >= 3 ? 'warning' : 'info'
    };

    const sustainabilityInsight: MetricInsight = {
      title: workHealth.workRhythmRecovery >= 75 ? 'Sustainable Pace' : workHealth.workRhythmRecovery >= 50 ? 'Manageable for Now' : 'Unsustainable Load',
      message: workHealth.workRhythmRecovery >= 75
        ? "Today's workload leaves enough recovery time — you should end the day with energy to spare."
        : workHealth.workRhythmRecovery >= 50
          ? "This pace is okay for today, but too many days like this in a row will start to wear you down."
          : "The meeting-to-recovery ratio today is too high — you'll likely feel drained by end of day.",
      action: workHealth.workRhythmRecovery >= 75
        ? 'Keep this rhythm going — this is a good template for your weekly schedule.'
        : 'Look at your week ahead and find one meeting you can decline or shorten to create breathing room.',
      severity: workHealth.workRhythmRecovery >= 75 ? 'success' : workHealth.workRhythmRecovery >= 50 ? 'info' : 'warning'
    };

    return {
      heroMessage,
      overview: overviewInsight,
      performance: performanceInsight,
      resilience: resilienceInsight,
      sustainability: sustainabilityInsight,
      insights,
      summary: `Current work health status: ${workHealth.status}.`,
      overallScore: workHealth.adaptivePerformanceIndex,
      riskFactors: workHealth.cognitiveResilience < 40 ? ['High cognitive load', 'Decision fatigue'] : [],
      opportunities: workHealth.focusTime >= 180 ? ['Deep work opportunities'] : ['Schedule optimization'],
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
      console.warn('Anthropic API key validation failed, using default insights');
      return this.getDefaultInsights(analysis);
    }

    try {
      const prePickedQuote = comicReliefGenerator.generateQuote(analysis.workHealth);
      const promptContent = this.createAllInsightsPrompt(analysis, userContext, providedUserTimezone, prePickedQuote);

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 1.0, // Maximum variation for creative subtitle
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

      // Override heroMessage quote/source with our pre-picked values (keep AI subtitle)
      if (parsedResponse.heroMessage && typeof parsedResponse.heroMessage === 'object') {
        parsedResponse.heroMessage.quote = prePickedQuote.text;
        parsedResponse.heroMessage.source = `${prePickedQuote.source}${prePickedQuote.character ? ` — ${prePickedQuote.character}` : ''}`;
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
    const hasPerMetricFormat = response?.overview && response?.performance && response?.resilience && response?.sustainability;
    const hasLegacyFormat = Array.isArray(response?.insights);

    const isValid = (
      response &&
      typeof response === 'object' &&
      (hasPerMetricFormat || hasLegacyFormat) &&
      typeof response.summary === 'string' &&
      typeof response.overallScore === 'number' &&
      Array.isArray(response.riskFactors) &&
      Array.isArray(response.opportunities) &&
      Array.isArray(response.predictiveAlerts)
    );

    const hasValidHero = !response?.heroMessage ||
      typeof response.heroMessage === 'string' ||
      (response.heroMessage?.quote && response.heroMessage?.source);

    return isValid && hasValidHero;
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
        model: 'claude-sonnet-4-20250514',
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

  // Generate dry sarcastic movie/TV quotes based on work health metrics
  async generateComicReliefSaying(workHealth: WorkHealthMetrics): Promise<string> {
    if (!this.validateApiKey()) {
      // Fallback to local movie quotes when API is not available
      const comicReliefGenerator = require('../utils/comicReliefGenerator').comicReliefGenerator;
      const quote = comicReliefGenerator.generateQuote(workHealth);
      return comicReliefGenerator.formatQuote(quote);
    }

    try {
      const prompt = `Generate a funny movie or TV quote that matches the mood of this work situation. Use ACTUAL quotes, don't adapt them for work.

WORK METRICS:
- Performance Index: ${workHealth.adaptivePerformanceIndex}%
- Cognitive Resilience: ${workHealth.cognitiveResilience}%
- Sustainability Index: ${workHealth.workRhythmRecovery}%
- Meeting Count: ${workHealth.schedule?.meetingCount || 0}
- Back-to-back Meetings: ${workHealth.schedule?.backToBackCount || 0}
- Focus Time: ${this.formatDuration(workHealth.focusTime || 0)}
- Meeting Density: ${Math.round((workHealth.meetingDensity || 0) * 100)}%

REQUIREMENTS:
- Use the EXACT original quote from the movie/TV show - DO NOT adapt it for work
- Include the character and source (e.g., "- Darth Vader, Star Wars")
- Match the quote's tone to their situation:
  * High performance (85%+): Confident, powerful quotes
  * Many meetings (>6): Overwhelmed or tired character quotes
  * Low focus time (<60min): Confused or chaotic character quotes
  * Good balance: Content or satisfied character quotes
  * Low performance (<50%): Defeated or resigned quotes

Examples of EXACT quotes:
- High performance: "I am inevitable. - Thanos, Avengers: Endgame"
- Many meetings: "I'm getting too old for this. - Roger Murtaugh, Lethal Weapon"
- Low focus: "I feel like I'm taking crazy pills! - Derek Zoolander, Zoolander"
- Good balance: "Everything is awesome! - Emmet, The Lego Movie"
- Low performance: "This is fine. - Dog in burning room, This is Fine Meme"

Generate ONE exact quote with proper attribution that matches their current mood/situation.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        temperature: 0.8, // Higher temperature for more creativity
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const textContent = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('')
        .trim();

      // Remove any quotes that might wrap the response
      return textContent.replace(/^["']|["']$/g, '');

    } catch (error) {
      console.error('Error generating comic relief saying:', error);

      // Fallback to local movie quote generator
      const comicReliefGenerator = require('../utils/comicReliefGenerator').comicReliefGenerator;
      const quote = comicReliefGenerator.generateQuote(workHealth);
      return comicReliefGenerator.formatQuote(quote);
    }
  }
}

export default ClaudeAIService;
export type {
  PersonalizedInsight,
  PersonalizedInsightsResponse,
  MetricInsight,
  UserContext,
  CalendarAnalysis,
  TabContext
};