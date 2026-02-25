import { google, calendar_v3 } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../pages/api/auth/[...nextauth]';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  attendees?: number;
  isRecurring?: boolean;
  category?: MeetingCategory;
}

export type MeetingCategory = 
  | 'BENEFICIAL' 
  | 'NEUTRAL' 
  | 'FOCUS_WORK' 
  | 'LIGHT_MEETINGS' 
  | 'HEAVY_MEETINGS' 
  | 'COLLABORATIVE';


export interface WorkHealthMetrics {
  // New intelligent metrics
  adaptivePerformanceIndex: number; // Main metric: 0-100
  cognitiveResilience: number; // Secondary metric: 0-100
  workRhythmRecovery: number; // Tertiary metric: 0-100
  
  status: string;
  schedule: {
    meetingCount: number;
    backToBackCount: number;
    bufferTime: number;
    durationHours: number;
    fragmentationScore: number;
    // Per-metric breakdown data
    morningMeetings: number;
    afternoonMeetings: number;
    meetingRatio: number; // meeting hours / 8hr workday (0-1)
    uniqueContexts: number; // distinct meeting types for context switching
    longestStretch: number; // longest consecutive meeting chain
    adequateBreaks: number; // gaps >= 30 min
    shortBreaks: number; // gaps 15-29 min
    earlyLateMeetings: number; // meetings before 7am or after 5pm
  };
  breakdown: {
    source: 'calendar';
    contributors: string[];
    primaryFactors: string[];
  };
  
  // Legacy fields for backward compatibility
  readiness: number;
  cognitiveAvailability: number;
  focusTime: number;
  meetingDensity: number;
}

class GoogleCalendarService {
  private calendar: calendar_v3.Calendar | null = null;
  private userTimezone: string = 'America/Los_Angeles'; // Default timezone
  
  // Meeting categorization keywords
  private readonly BENEFICIAL_KEYWORDS = [
    'workout', 'gym', 'exercise', 'walk', 'run', 'yoga', 'meditation', 'break',
    'lunch', 'eat', 'personal', 'doctor', 'dentist', 'therapy', 'massage', 'health',
    'family', 'kids', 'school pickup', 'school drop', 'date night', 'self-care',
    'nap', 'rest', 'recovery', 'hobby', 'read', 'journal', 'breathe', 'stretch',
    'swim', 'hike', 'bike', 'sport', 'game', 'play', 'volunteer', 'church',
    'prayer', 'worship', 'social', 'friends', 'happy hour', 'dinner',
    'basketball', 'football', 'soccer', 'baseball', 'tennis', 'golf',
    'hockey', 'volleyball', 'softball', 'lacrosse', 'wrestling', 'track',
    'gymnastics', 'karate', 'ballet', 'dance', 'cheer', 'practice'
  ];

  private readonly NEUTRAL_KEYWORDS = [
    'commute', 'travel', 'vacation', 'holiday', 'sick', 'pto', 'personal day',
    'out of office', 'not available', 'busy', 'blocked', 'unavailable',
    'appointment', 'errand', 'pickup', 'drop off', 'buffer', 'hold',
    'tentative', 'maybe', 'optional'
  ];
  
  private readonly FOCUS_KEYWORDS = [
    'focus', 'deep work', 'coding', 'writing', 'research', 'analysis', 'strategy',
    'no meetings', 'focus block', 'maker time', 'thinking time', 'planning', 'prep'
  ];
  
  private readonly LIGHT_KEYWORDS = [
    '1:1', 'one-on-one', 'check-in', 'sync', 'standup', 'coffee chat',
    'quick sync', 'brief update', 'touch base', 'catch up'
  ];
  
  private readonly HEAVY_KEYWORDS = [
    'presentation', 'demo', 'review', 'interview', 'all-hands', 'town hall',
    'board meeting', 'client presentation', 'quarterly review', 'training',
    'workshop', 'seminar', 'conference'
  ];
  
  private readonly COLLABORATIVE_KEYWORDS = [
    'brainstorm', 'planning', 'team meeting', 'retrospective', 'working session',
    'design review', 'project meeting', 'scrum', 'sprint', 'kickoff'
  ];

  async initialize(accessToken: string): Promise<void> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  private matchesKeywords(title: string, keywords: string[]): boolean {
    const lowercaseTitle = title.toLowerCase();
    return keywords.some(keyword => 
      lowercaseTitle.includes(keyword.toLowerCase())
    );
  }

  // Simplified helper method - NO additional timezone conversion
  private parseCalendarDateTime(dateTimeString: string, userTimezone: string): Date {
    // Google Calendar API returns ISO 8601 strings with timezone info
    // e.g., "2025-09-15T16:00:00-07:00" or "2025-09-15T23:00:00Z"
    
    try {
      const parsed = new Date(dateTimeString);
      return parsed;
      
    } catch (error) {
      console.error('Error parsing calendar dateTime:', dateTimeString, error);
      return new Date();
    }
  }

  // Helper method to get timezone-aware hours from a Date object
  private getTimezoneAwareHours(date: Date, timezone?: string): number {
    if (!timezone) {
      // Fallback to direct getHours() if no timezone provided
      return date.getHours();
    }

    // Get the hour in the user's timezone
    const timeInUserTZ = date.toLocaleString('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: 'numeric'
    });

    return parseInt(timeInUserTZ);
  }

  private categorizeEvent(summary: string): MeetingCategory {
    const title = summary.toLowerCase().trim();

    let category: MeetingCategory;

    if (this.matchesKeywords(title, this.BENEFICIAL_KEYWORDS)) category = 'BENEFICIAL';
    else if (this.matchesKeywords(title, this.NEUTRAL_KEYWORDS)) category = 'NEUTRAL';
    else if (this.matchesKeywords(title, this.FOCUS_KEYWORDS)) category = 'FOCUS_WORK';
    else if (this.matchesKeywords(title, this.LIGHT_KEYWORDS)) category = 'LIGHT_MEETINGS';
    else if (this.matchesKeywords(title, this.HEAVY_KEYWORDS)) category = 'HEAVY_MEETINGS';
    else if (this.matchesKeywords(title, this.COLLABORATIVE_KEYWORDS)) category = 'COLLABORATIVE';
    else category = 'COLLABORATIVE'; // Default for unmatched meetings

    return category;
  }

  async getTodaysEvents(providedUserTimezone?: string): Promise<CalendarEvent[]> {
    if (!this.calendar) {
      throw new Error('Calendar service not initialized');
    }

    // Use provided timezone (from client-side) or fallback to server detection (which will be UTC in production)
    const userTimezone = providedUserTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';

    // Store timezone for use in other methods
    this.userTimezone = userTimezone;
    
    // Get today's date string in user's timezone (YYYY-MM-DD format)
    const now = new Date();
    const todayInUserTZ = now.toLocaleDateString('sv-SE', { timeZone: userTimezone });

    // Get the UTC offset for the user's timezone at start and end of day
    // so that "midnight in user's timezone" converts correctly to UTC on any server
    const getOffsetForDate = (dateStr: string, tz: string): string => {
      const d = new Date(dateStr);
      const utcStr = d.toLocaleString('en-US', { timeZone: 'UTC' });
      const tzStr = d.toLocaleString('en-US', { timeZone: tz });
      const diffMs = new Date(tzStr).getTime() - new Date(utcStr).getTime();
      const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60));
      const sign = diffMs >= 0 ? '+' : '-';
      return `${sign}${String(diffHours).padStart(2, '0')}:${String(diffMinutes).padStart(2, '0')}`;
    };

    const offset = getOffsetForDate(`${todayInUserTZ}T12:00:00Z`, userTimezone);
    const startOfDay = new Date(`${todayInUserTZ}T00:00:00${offset}`);
    const endOfDay = new Date(`${todayInUserTZ}T23:59:59${offset}`);

    const timeMin = startOfDay.toISOString();
    const timeMax = endOfDay.toISOString();
    
    try {
      // Force fresh data with aggressive cache-busting for production
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        timeZone: userTimezone,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500,
        showDeleted: false,
      });

      const events = response.data.items || [];

      return events
        .filter((event: calendar_v3.Schema$Event) => event.start?.dateTime && event.end?.dateTime)
        .map((event: calendar_v3.Schema$Event, index: number) => {
          const summary = event.summary || 'No title';
          const startDate = this.parseCalendarDateTime(event.start!.dateTime!, userTimezone);
          const endDate = this.parseCalendarDateTime(event.end!.dateTime!, userTimezone);

          const calendarEvent: CalendarEvent = {
            id: event.id!,
            summary,
            start: startDate,
            end: endDate,
            attendees: event.attendees?.length || 1,
            isRecurring: !!event.recurringEventId,
            category: this.categorizeEvent(summary),
          };
          return calendarEvent;
        });
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  private calculateCognitiveAvailability(events: CalendarEvent[]): number {
    // Filter out beneficial and neutral events for cognitive calculation
    const actualMeetings = events.filter(event => 
      event.category !== 'BENEFICIAL' && 
      event.category !== 'NEUTRAL' && 
      event.category !== 'FOCUS_WORK'
    );
    
    if (actualMeetings.length === 0) return 95; // Higher score with no actual meetings

    let cognitiveDepletion = 10; // Lower base depletion for categorized system

    // Meeting density impact based on actual meetings only
    if (actualMeetings.length >= 8) {
      cognitiveDepletion += 35; // Heavy meeting day
    } else if (actualMeetings.length >= 6) {
      cognitiveDepletion += 25; // Moderate-heavy meetings
    } else if (actualMeetings.length >= 4) {
      cognitiveDepletion += 15; // Moderate meetings
    } else if (actualMeetings.length >= 2) {
      cognitiveDepletion += 8; // Light-moderate meetings
    } else {
      cognitiveDepletion += 3; // Very light meetings
    }
    
    // Apply category-specific cognitive load
    actualMeetings.forEach(event => {
      switch (event.category) {
        case 'HEAVY_MEETINGS':
          cognitiveDepletion += 8; // Heavy cognitive load
          break;
        case 'COLLABORATIVE':
          cognitiveDepletion += 4; // Moderate cognitive load
          break;
        case 'LIGHT_MEETINGS':
          cognitiveDepletion += 2; // Light cognitive load
          break;
      }
    });
    
    // Bonus for beneficial events
    const beneficialEvents = events.filter(e => e.category === 'BENEFICIAL');
    cognitiveDepletion -= beneficialEvents.length * 3; // Reduce depletion for self-care

    // Back-to-back meetings reduce cognitive availability (only count actual meetings)
    const backToBackCount = this.countBackToBackMeetings(actualMeetings);
    if (backToBackCount >= 4) {
      cognitiveDepletion += 20;
    } else if (backToBackCount >= 2) {
      cognitiveDepletion += 12;
    } else if (backToBackCount >= 1) {
      cognitiveDepletion += 5;
    }

    // Meeting duration impact - only count actual meeting duration
    const totalDuration = actualMeetings.reduce((sum, event) => {
      return sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
    }, 0);

    if (totalDuration >= 7) {
      cognitiveDepletion += 15;
    } else if (totalDuration >= 5) {
      cognitiveDepletion += 10;
    } else if (totalDuration >= 3) {
      cognitiveDepletion += 5;
    }

    // Large meetings reduce cognitive availability (only actual meetings)
    const largeMeetings = actualMeetings.filter(event => event.attendees && event.attendees >= 8);
    cognitiveDepletion += largeMeetings.length * 3;

    // Time of day factor - afternoon meetings more taxing (only actual meetings)
    const afternoonMeetings = actualMeetings.filter(event => this.getTimezoneAwareHours(event.start, this.userTimezone) >= 13);
    if (afternoonMeetings.length >= 3) {
      cognitiveDepletion += 5;
    }

    // Convert depletion to availability (100 - depletion)
    const cognitiveAvailability = 100 - Math.min(85, Math.max(10, Math.round(cognitiveDepletion)));
    return Math.max(15, Math.min(90, cognitiveAvailability)); // Ensure availability is between 15-90
  }

  private countBackToBackMeetings(events: CalendarEvent[]): number {
    let count = 0;
    for (let i = 0; i < events.length - 1; i++) {
      const currentEnd = events[i].end.getTime();
      const nextStart = events[i + 1].start.getTime();
      const gap = (nextStart - currentEnd) / (1000 * 60); // Gap in minutes
      
      if (gap <= 15) { // 15 minutes or less gap = back-to-back
        count++;
      }
    }
    return count;
  }

  private calculateFocusTime(events: CalendarEvent[], userTimezone?: string): number {
    if (events.length === 0) return 720; // 12 hours if no meetings (6 AM - 6 PM)

    const workStart = 6; // 6 AM - expanded to capture broader daily picture
    const workEnd = 18; // 6 PM - expanded to capture broader daily picture
    let totalFocusTime = 0;
    let qualityFocusTime = 0;

    // Calculate total meeting time to validate our focus time calculation
    const totalMeetingMinutes = events.reduce((total, event) => {
      const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
      return total + duration;
    }, 0);

    const totalWorkdayMinutes = (workEnd - workStart) * 60; // 12 hours = 720 minutes
    const theoreticalMaxFocus = Math.max(0, totalWorkdayMinutes - totalMeetingMinutes);

    // Helper function to get timezone-aware hours/minutes
    const getTimezoneAwareTime = (date: Date, timezone?: string) => {
      if (!timezone) {
        // Fallback to direct getHours() if no timezone provided
        return {
          hours: date.getHours(),
          minutes: date.getMinutes(),
          totalHours: date.getHours() + (date.getMinutes() / 60)
        };
      }

      // Get the time in the user's timezone
      const timeInUserTZ = date.toLocaleString('en-US', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });

      const [hourStr, minuteStr] = timeInUserTZ.split(':');
      const hours = parseInt(hourStr);
      const minutes = parseInt(minuteStr);

      return {
        hours,
        minutes,
        totalHours: hours + (minutes / 60)
      };
    };

    // Check time before first meeting
    const firstMeeting = events[0];
    const firstMeetingTime = getTimezoneAwareTime(firstMeeting.start, userTimezone);

    if (firstMeetingTime.totalHours > workStart) {
      const morningGapHours = firstMeetingTime.totalHours - workStart;
      const morningGapMinutes = morningGapHours * 60;

      if (morningGapMinutes >= 30) { // 30+ minute blocks count as some focus time
        totalFocusTime += morningGapMinutes;
        if (morningGapMinutes >= 90) { // 90+ minute blocks are quality focus time
          qualityFocusTime += morningGapMinutes;
        }
      }

    }

    // Check gaps between meetings (time difference calculation is timezone-agnostic)
    for (let i = 0; i < events.length - 1; i++) {
      const currentEnd = events[i].end;
      const nextStart = events[i + 1].start;
      const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);

      if (gapMinutes >= 30) { // 30+ minute gaps count as focus time
        totalFocusTime += gapMinutes;
        if (gapMinutes >= 90) { // 90+ minute gaps are quality focus time
          qualityFocusTime += gapMinutes;
        }
      }

    }

    // Check time after last meeting
    const lastMeeting = events[events.length - 1];
    const lastMeetingTime = getTimezoneAwareTime(lastMeeting.end, userTimezone);

    if (lastMeetingTime.totalHours < workEnd) {
      const eveningGapMinutes = (workEnd - lastMeetingTime.totalHours) * 60;
      if (eveningGapMinutes >= 30) {
        totalFocusTime += eveningGapMinutes;
        if (eveningGapMinutes >= 90) {
          qualityFocusTime += eveningGapMinutes;
        }
      }

    }

    // Weight quality focus time more heavily
    const effectiveFocusTime = totalFocusTime * 0.7 + qualityFocusTime * 0.3;

    // ENHANCED SAFEGUARD: Use more realistic logic
    // Focus time should never exceed theoretical maximum (workday - meetings)
    const maxRealisticFocusTime = Math.min(480, theoreticalMaxFocus); // Cap at theoretical max or 8 hours
    const minFocusTime = 0;   // Can't have negative focus time

    const safeFocusTime = Math.max(minFocusTime, Math.min(maxRealisticFocusTime, Math.round(effectiveFocusTime)));

    // ALTERNATIVE CALCULATION: Use simpler, more accurate approach
    // If the complex calculation seems wrong, use theoretical maximum
    const simpleCalculation = Math.max(0, theoreticalMaxFocus);

    // Use the more conservative (lower) of the two calculations
    const finalFocusTime = Math.min(safeFocusTime, simpleCalculation);

    return finalFocusTime;
  }

  private calculateFragmentationScore(events: CalendarEvent[]): number {
    if (events.length === 0) return 100; // Perfect score for no meetings
    if (events.length === 1) return 85; // Very good for single meeting

    const totalWorkMinutes = 12 * 60; // 12-hour workday (6 AM - 6 PM)
    const focusTimeMinutes = this.calculateFocusTime(events, this.userTimezone);
    const focusTimeRatio = focusTimeMinutes / totalWorkMinutes;

    // Calculate gaps between meetings
    let qualityGaps = 0;
    for (let i = 0; i < events.length - 1; i++) {
      const currentEnd = events[i].end;
      const nextStart = events[i + 1].start;
      const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
      
      if (gapMinutes >= 90) qualityGaps++;
      else if (gapMinutes >= 30) qualityGaps += 0.5;
    }

    // Base score from focus time ratio
    let score = focusTimeRatio * 60;
    
    // Bonus for quality gaps
    score += (qualityGaps / events.length) * 40;

    // Penalty for too many meetings
    if (events.length >= 8) score -= 20;
    else if (events.length >= 6) score -= 10;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private calculateAdaptivePerformanceIndex(events: CalendarEvent[]): number {
    // Filter events by type
    const actualMeetings = events.filter(event =>
      event.category !== 'BENEFICIAL' &&
      event.category !== 'NEUTRAL' &&
      event.category !== 'FOCUS_WORK'
    );
    const focusWorkEvents = events.filter(event => event.category === 'FOCUS_WORK');
    const beneficialEvents = events.filter(event => event.category === 'BENEFICIAL');

    // No meetings: day off or clear calendar — positive, not punitive.
    // Intentional structure (focus blocks) earns a higher score.
    if (actualMeetings.length === 0) {
      const hasFocusBlocks = focusWorkEvents.length > 0;
      return hasFocusBlocks ? 88 : 75;
    }

    const meetingCount = actualMeetings.length;
    const backToBackCount = this.countBackToBackMeetings(actualMeetings);
    const focusTime = this.calculateFocusTime(events, this.userTimezone);
    const focusHours = focusTime / 60;

    // Weighted meeting load — a board presentation ≠ a standup
    let weightedMeetingLoad = 0;
    actualMeetings.forEach(event => {
      const durationHours = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
      const durationWeight = durationHours >= 1.5 ? 1.5 : durationHours >= 1 ? 1.2 : durationHours >= 0.5 ? 1.0 : 0.6;
      const categoryWeight = event.category === 'HEAVY_MEETINGS' ? 1.6
        : event.category === 'COLLABORATIVE' ? 1.1
        : event.category === 'LIGHT_MEETINGS' ? 0.6
        : 1.0;
      const attendeeWeight = (event.attendees && event.attendees >= 10) ? 1.3
        : (event.attendees && event.attendees >= 5) ? 1.1
        : 1.0;
      weightedMeetingLoad += durationWeight * categoryWeight * attendeeWeight;
    });

    // Density score uses weighted load instead of raw count
    let densityScore = 100;
    if (weightedMeetingLoad >= 12) densityScore = 5;
    else if (weightedMeetingLoad >= 9) densityScore = 15;
    else if (weightedMeetingLoad >= 7) densityScore = 25;
    else if (weightedMeetingLoad >= 5.5) densityScore = 38;
    else if (weightedMeetingLoad >= 4) densityScore = 55;
    else if (weightedMeetingLoad >= 3) densityScore = 70;
    else if (weightedMeetingLoad >= 1.5) densityScore = 82;
    else densityScore = 92;

    // Fragmentation — tighter thresholds, even lots of "focus time" doesn't
    // mean much if it's 3hrs before 9am. Cap at 85 so nobody hits 100 trivially.
    let fragmentationScore = 85;
    if (focusHours < 0.5) fragmentationScore = 5;
    else if (focusHours < 1) fragmentationScore = 12;
    else if (focusHours < 2) fragmentationScore = 25;
    else if (focusHours < 3) fragmentationScore = 40;
    else if (focusHours < 4) fragmentationScore = 58;
    else if (focusHours < 5) fragmentationScore = 72;

    // Back-to-back transitions — each one stacks painfully
    let transitionScore = 100;
    if (backToBackCount >= 5) transitionScore = 5;
    else if (backToBackCount >= 4) transitionScore = 15;
    else if (backToBackCount === 3) transitionScore = 30;
    else if (backToBackCount === 2) transitionScore = 55;
    else if (backToBackCount === 1) transitionScore = 78;

    // Afternoon-heavy days are draining (1pm+ counts as afternoon)
    const afternoonMeetings = actualMeetings.filter(e => this.getTimezoneAwareHours(e.start, this.userTimezone) >= 13).length;
    const morningMeetings = actualMeetings.filter(e => this.getTimezoneAwareHours(e.start, this.userTimezone) < 12).length;
    let timingScore = 100;
    if (afternoonMeetings >= 4) timingScore = 40;
    else if (afternoonMeetings > morningMeetings * 1.5) timingScore = 55;
    else if (afternoonMeetings > morningMeetings) timingScore = 75;

    // Meeting-to-work ratio — total hours in meetings vs. workday
    let recoveryScore = 100;
    const totalMeetingHours = actualMeetings.reduce((sum, event) =>
      sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60), 0);
    const workHours = 8;
    const meetingRatio = totalMeetingHours / workHours;
    if (meetingRatio > 0.75) recoveryScore = 8;
    else if (meetingRatio > 0.6) recoveryScore = 25;
    else if (meetingRatio > 0.5) recoveryScore = 45;
    else if (meetingRatio > 0.4) recoveryScore = 65;
    else if (meetingRatio > 0.25) recoveryScore = 85;

    // Intentional activities improve your day (capped modestly)
    let bonusPoints = 0;
    bonusPoints += Math.min(focusWorkEvents.length, 2) * 3;
    bonusPoints += Math.min(beneficialEvents.length, 2) * 2;

    // Weighted calculation
    const adaptiveIndex = (
      densityScore * 0.25 +
      fragmentationScore * 0.30 +
      transitionScore * 0.20 +
      timingScore * 0.10 +
      recoveryScore * 0.15
    ) + bonusPoints;

    const finalScore = Math.round(Math.min(100, Math.max(0, adaptiveIndex)));
    return finalScore;
  }
  
  private calculateCognitiveResilience(events: CalendarEvent[]): number {
    if (events.length === 0) {
      return 78; // No meetings = low strain, good thing. Day off or clear calendar.
    }

    // Separate by type
    const actualMeetings = events.filter(event =>
      event.category !== 'BENEFICIAL' &&
      event.category !== 'NEUTRAL' &&
      event.category !== 'FOCUS_WORK'
    );
    const beneficialEvents = events.filter(e => e.category === 'BENEFICIAL');

    // Context switching — unique topics drain mental bandwidth
    const uniqueContexts = new Set(actualMeetings.map(e => e.summary?.toLowerCase().split(' ')[0])).size;
    const contextSwitchingLoad = Math.min(100, uniqueContexts * 18);

    // Decision fatigue — weighted by type, time of day, attendees, and duration
    let decisionFatigue = 0;
    actualMeetings.forEach((event) => {
      const hourOfDay = this.getTimezoneAwareHours(event.start, this.userTimezone);
      const durationHours = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
      const timeFactor = hourOfDay >= 15 ? 1.8 : hourOfDay >= 13 ? 1.4 : 1;
      const attendeeFactor = (event.attendees && event.attendees >= 10) ? 1.6
        : (event.attendees && event.attendees >= 5) ? 1.3
        : (event.attendees && event.attendees >= 3) ? 1.1
        : 1;
      const categoryFactor = event.category === 'HEAVY_MEETINGS' ? 1.8
        : event.category === 'COLLABORATIVE' ? 1.2
        : event.category === 'LIGHT_MEETINGS' ? 0.7
        : 1.0;
      const durationFactor = durationHours >= 1.5 ? 1.5 : durationHours >= 1 ? 1.2 : 1.0;
      decisionFatigue += (10 * timeFactor * attendeeFactor * categoryFactor * durationFactor);
    });
    decisionFatigue = Math.min(100, decisionFatigue);

    // Cognitive reserve from focus time
    const focusTime = this.calculateFocusTime(events, this.userTimezone);
    const focusHours = focusTime / 60;
    let cognitiveReserve = 0;
    if (focusHours >= 5) cognitiveReserve = 90;
    else if (focusHours >= 4) cognitiveReserve = 70;
    else if (focusHours >= 3) cognitiveReserve = 50;
    else if (focusHours >= 2) cognitiveReserve = 30;
    else if (focusHours >= 1) cognitiveReserve = 12;
    else cognitiveReserve = 0;

    // Consecutive meeting chains drain energy hard
    const consecutiveMeetings = this.findLongestConsecutiveStretch(actualMeetings);
    let energyDepletion = 0;
    if (consecutiveMeetings >= 5) energyDepletion = 90;
    else if (consecutiveMeetings >= 4) energyDepletion = 70;
    else if (consecutiveMeetings >= 3) energyDepletion = 50;
    else if (consecutiveMeetings >= 2) energyDepletion = 30;
    else energyDepletion = consecutiveMeetings * 12;

    // Beneficial events restore resilience (walks, breaks, exercise)
    const recoveryBoost = Math.min(beneficialEvents.length, 3) * 5;

    // Calculate resilience score
    const resilienceScore = Math.max(0,
      100 - contextSwitchingLoad * 0.30
      - decisionFatigue * 0.35
      + cognitiveReserve * 0.20
      - energyDepletion * 0.15
    ) + recoveryBoost;

    const finalScore = Math.round(Math.min(100, Math.max(0, resilienceScore)));
    return finalScore;
  }
  
  private calculateWorkRhythmRecovery(events: CalendarEvent[]): number {
    // Separate by type
    const actualMeetings = events.filter(event =>
      event.category !== 'BENEFICIAL' &&
      event.category !== 'NEUTRAL' &&
      event.category !== 'FOCUS_WORK'
    );
    const beneficialEvents = events.filter(e => e.category === 'BENEFICIAL');
    const focusWorkEvents = events.filter(e => e.category === 'FOCUS_WORK');

    if (actualMeetings.length === 0) {
      // No meetings — day off or clear calendar. Positive baseline.
      // Intentional structure (walks, focus blocks) earns more.
      const hasStructure = beneficialEvents.length > 0 || focusWorkEvents.length > 0;
      return hasStructure ? 85 : 75;
    }

    // Work rhythm balance — lopsided days feel worse
    const morningBlock = actualMeetings.filter(e => {
      const hour = this.getTimezoneAwareHours(e.start, this.userTimezone);
      return hour >= 6 && hour < 12;
    }).length;
    const afternoonBlock = actualMeetings.filter(e => {
      const hour = this.getTimezoneAwareHours(e.start, this.userTimezone);
      return hour >= 12 && hour < 18;
    }).length;
    const rhythmBalance = Math.abs(morningBlock - afternoonBlock);
    let rhythmScore = 100 - (rhythmBalance * 20);
    rhythmScore = Math.max(10, rhythmScore);

    // Recovery adequacy — beneficial events count as real breaks
    const gaps = this.calculateGapsBetweenMeetings(actualMeetings);
    const adequateBreaks = gaps.filter(g => g >= 30).length;
    const shortBreaks = gaps.filter(g => g >= 15 && g < 30).length;
    // Walks, exercise, lunch etc. are actual recovery
    const beneficialBreaks = beneficialEvents.length;
    let recoveryScore = 0;
    if (adequateBreaks === 0 && shortBreaks === 0 && beneficialBreaks === 0) recoveryScore = 5;
    else {
      recoveryScore = (adequateBreaks * 18) + (shortBreaks * 8) + (beneficialBreaks * 15);
    }
    recoveryScore = Math.min(100, recoveryScore);

    // Intensity sustainability — weighted by meeting type, not just raw hours
    let weightedIntensityHours = 0;
    actualMeetings.forEach(event => {
      const durationHours = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
      const typeWeight = event.category === 'HEAVY_MEETINGS' ? 1.5
        : event.category === 'COLLABORATIVE' ? 1.1
        : event.category === 'LIGHT_MEETINGS' ? 0.7
        : 1.0;
      weightedIntensityHours += durationHours * typeWeight;
    });
    let sustainabilityScore = 100;
    if (weightedIntensityHours > 8) sustainabilityScore = 5;
    else if (weightedIntensityHours > 6.5) sustainabilityScore = 20;
    else if (weightedIntensityHours > 5) sustainabilityScore = 40;
    else if (weightedIntensityHours > 4) sustainabilityScore = 60;
    else if (weightedIntensityHours > 3) sustainabilityScore = 78;
    else sustainabilityScore = 92;

    // Boundary violations — early/late meetings hurt, no floor
    const earlyMorningMeetings = actualMeetings.filter(e => this.getTimezoneAwareHours(e.start, this.userTimezone) < 7).length;
    const lateMeetings = actualMeetings.filter(e => this.getTimezoneAwareHours(e.start, this.userTimezone) >= 17).length;
    let alignmentScore = 100 - (earlyMorningMeetings * 30) - (lateMeetings * 25);
    alignmentScore = Math.max(0, alignmentScore);

    // Combined score
    const combinedScore = (
      rhythmScore * 0.20 +
      recoveryScore * 0.30 +
      sustainabilityScore * 0.30 +
      alignmentScore * 0.20
    );

    const finalScore = Math.round(Math.min(100, Math.max(0, combinedScore)));
    return finalScore;
  }
  
  private findLongestConsecutiveStretch(events: CalendarEvent[]): number {
    if (events.length === 0) return 0;
    
    let maxStretch = 1;
    let currentStretch = 1;
    
    for (let i = 1; i < events.length; i++) {
      const gap = (events[i].start.getTime() - events[i-1].end.getTime()) / (1000 * 60);
      if (gap <= 30) { // Less than 30 minutes between meetings
        currentStretch++;
        maxStretch = Math.max(maxStretch, currentStretch);
      } else {
        currentStretch = 1;
      }
    }
    
    return maxStretch;
  }
  
  private calculateGapsBetweenMeetings(events: CalendarEvent[]): number[] {
    const gaps: number[] = [];
    for (let i = 1; i < events.length; i++) {
      const gap = (events[i].start.getTime() - events[i-1].end.getTime()) / (1000 * 60);
      if (gap > 0) gaps.push(gap);
    }
    return gaps;
  }

  private calculatePerformanceIndex(cognitiveAvailability: number, focusTime: number, meetingCount: number, backToBackCount: number): number {
    // New tiered performance assessment
    let baseScore = 50;
    
    // Meeting density scoring - much more generous for low counts
    let meetingScore = 0;
    if (meetingCount === 0) meetingScore = 100;
    else if (meetingCount <= 1) meetingScore = 95;
    else if (meetingCount <= 2) meetingScore = 90;
    else if (meetingCount <= 3) meetingScore = 85;
    else if (meetingCount <= 4) meetingScore = 75;
    else if (meetingCount <= 5) meetingScore = 65;
    else if (meetingCount <= 6) meetingScore = 55;
    else meetingScore = 40;
    
    // Focus time scoring - recognizes excellent focus availability
    let focusScore = 0;
    const focusHours = focusTime / 60;
    if (focusHours >= 5) focusScore = 100;
    else if (focusHours >= 4) focusScore = 90;
    else if (focusHours >= 3) focusScore = 80;
    else if (focusHours >= 2) focusScore = 70;
    else if (focusHours >= 1) focusScore = 55;
    else focusScore = 30;
    
    // Cognitive availability scoring - direct relationship
    const cognitiveScore = cognitiveAvailability;
    
    // Back-to-back penalty
    let backToBackPenalty = 0;
    if (backToBackCount >= 3) backToBackPenalty = 15;
    else if (backToBackCount >= 2) backToBackPenalty = 10;
    else if (backToBackCount >= 1) backToBackPenalty = 5;
    
    // Weighted performance calculation
    const performanceIndex = (
      meetingScore * 0.35 +           // Meeting density is key factor
      focusScore * 0.35 +            // Focus time equally important
      cognitiveScore * 0.25 +        // Cognitive load support factor
      baseScore * 0.05               // Small base score
    ) - backToBackPenalty;
    
    return Math.min(100, Math.max(15, Math.round(performanceIndex)));
  }

  async analyzeWorkHealth(userTimezone?: string): Promise<WorkHealthMetrics> {
    const events = await this.getTodaysEvents(userTimezone);
    
    // Separate different types of events for analysis
    const actualMeetings = events.filter(event => 
      event.category !== 'BENEFICIAL' && 
      event.category !== 'NEUTRAL' && 
      event.category !== 'FOCUS_WORK'
    );
    const focusWorkEvents = events.filter(event => event.category === 'FOCUS_WORK');
    const beneficialEvents = events.filter(event => event.category === 'BENEFICIAL');
    
    const meetingCount = actualMeetings.length; // Only count actual meetings
    const backToBackCount = this.countBackToBackMeetings(actualMeetings);
    const cognitiveAvailability = this.calculateCognitiveAvailability(events);
    const focusTime = this.calculateFocusTime(events, this.userTimezone);
    const fragmentationScore = this.calculateFragmentationScore(events);
    
    const totalDuration = actualMeetings.reduce((sum, event) => {
      return sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
    }, 0);

    const bufferTime = Math.max(0, (12 * 60) - (totalDuration * 60) - (meetingCount * 15)); // Account for transitions
    
    // Calculate new intelligent metrics
    const adaptivePerformanceIndex = this.calculateAdaptivePerformanceIndex(events);
    const cognitiveResilience = this.calculateCognitiveResilience(events);
    const workRhythmRecovery = this.calculateWorkRhythmRecovery(events);
    
    // Legacy calculation for backward compatibility
    const readiness = this.calculatePerformanceIndex(cognitiveAvailability, focusTime, meetingCount, backToBackCount);

    // Determine status based on adaptive performance index
    let status: string;
    if (adaptivePerformanceIndex >= 85) status = 'OPTIMAL';
    else if (adaptivePerformanceIndex >= 75) status = 'EXCELLENT';
    else if (adaptivePerformanceIndex >= 65) status = 'GOOD';
    else if (adaptivePerformanceIndex >= 50) status = 'MODERATE';
    else status = 'NEEDS_ATTENTION';

    // Generate insights based on new metrics
    const contributors = [
      `Focus: ${adaptivePerformanceIndex}%${adaptivePerformanceIndex >= 85 ? ' (Optimal)' : adaptivePerformanceIndex >= 75 ? ' (Excellent)' : adaptivePerformanceIndex >= 65 ? ' (Good)' : adaptivePerformanceIndex >= 50 ? ' (Moderate)' : ' (Needs Attention)'}`,
      `Strain: ${cognitiveResilience}%${cognitiveResilience >= 80 ? ' (Strong)' : cognitiveResilience >= 60 ? ' (Good)' : cognitiveResilience >= 40 ? ' (Moderate)' : ' (Limited)'}`,
      `Balance: ${workRhythmRecovery}%${workRhythmRecovery >= 80 ? ' (Excellent)' : workRhythmRecovery >= 60 ? ' (Good)' : workRhythmRecovery >= 40 ? ' (Moderate)' : ' (Needs Attention)'}`
    ];

    const primaryFactors = [];
    
    // Enhanced primary factors considering event categories
    if (meetingCount === 0 && focusWorkEvents.length > 0) {
      primaryFactors.push(`Perfect conditions: ${focusWorkEvents.length} focus work block${focusWorkEvents.length > 1 ? 's' : ''} scheduled with no meetings`);
    } else if (meetingCount <= 2 && focusTime >= 240) {
      primaryFactors.push('Excellent work health conditions with minimal meeting load and abundant focus time');
    } else if (meetingCount <= 3 && focusTime >= 180) {
      primaryFactors.push('Good work health balance with light meeting schedule and adequate focus periods');
    } else if (adaptivePerformanceIndex >= 85) {
      primaryFactors.push('Optimal cognitive resources and work capacity available');
    } else if (cognitiveResilience <= 40) {
      primaryFactors.push('Limited cognitive resilience due to high context switching and decision fatigue');
    } else if (focusTime < 90) {
      primaryFactors.push('Limited deep work opportunities due to schedule fragmentation');
    } else {
      primaryFactors.push('Balanced workload with manageable cognitive demands');
    }
    
    // Add positive factors for beneficial events
    if (beneficialEvents.length > 0) {
      primaryFactors.push(`${beneficialEvents.length} wellness/self-care block${beneficialEvents.length > 1 ? 's' : ''} supporting cognitive recovery`);
    }

    if (backToBackCount >= 3) {
      primaryFactors.push(`${backToBackCount} back-to-back meetings creating significant mental switching costs`);
    } else if (backToBackCount >= 1) {
      primaryFactors.push(`${backToBackCount} back-to-back session${backToBackCount > 1 ? 's' : ''} requiring transition management`);
    }

    // Compute per-metric breakdown data
    const morningMeetings = actualMeetings.filter(e => this.getTimezoneAwareHours(e.start, this.userTimezone) < 12).length;
    const afternoonMeetings = actualMeetings.filter(e => this.getTimezoneAwareHours(e.start, this.userTimezone) >= 14).length;
    const meetingRatio = totalDuration / 8;
    const uniqueContexts = new Set(events.map(e => e.summary?.toLowerCase().split(' ')[0])).size;
    const longestStretch = this.findLongestConsecutiveStretch(events);
    const gaps = this.calculateGapsBetweenMeetings(events);
    const adequateBreaks = gaps.filter(g => g >= 30).length;
    const shortBreaks = gaps.filter(g => g >= 15 && g < 30).length;
    const earlyLateMeetings = actualMeetings.filter(e => {
      const h = this.getTimezoneAwareHours(e.start, this.userTimezone);
      return h < 7 || h >= 17;
    }).length;

    return {
      // New intelligent metrics
      adaptivePerformanceIndex,
      cognitiveResilience,
      workRhythmRecovery,

      status,
      schedule: {
        meetingCount,
        backToBackCount,
        bufferTime: Math.round(bufferTime),
        durationHours: Number(totalDuration.toFixed(1)),
        fragmentationScore,
        morningMeetings,
        afternoonMeetings,
        meetingRatio: Number(meetingRatio.toFixed(2)),
        uniqueContexts,
        longestStretch,
        adequateBreaks,
        shortBreaks,
        earlyLateMeetings
      },
      breakdown: {
        source: 'calendar',
        contributors,
        primaryFactors
      },
      
      // Legacy fields for backward compatibility
      readiness,
      cognitiveAvailability,
      focusTime: Math.round(focusTime), // Keep as minutes internally for calculations
      meetingDensity: meetingCount
    };
  }
}

export default GoogleCalendarService;