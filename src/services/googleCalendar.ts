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
    'lunch', 'eat', 'personal', 'doctor', 'dentist', 'therapy', 'massage', 'health'
  ];
  
  private readonly NEUTRAL_KEYWORDS = [
    'commute', 'travel', 'vacation', 'holiday', 'sick', 'pto', 'personal day',
    'out of office', 'not available', 'busy', 'blocked', 'unavailable'
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
    
    console.log('🧪 parseCalendarDateTime - SIMPLE PARSING:', {
      input: dateTimeString,
      hasTimezone: dateTimeString.includes('+') || dateTimeString.includes('-') || dateTimeString.endsWith('Z')
    });
    
    try {
      // SIMPLE: Just use direct Date parsing - Google's dateTime should have timezone info
      // If it has timezone info, new Date() will handle it correctly
      // If not, it will be interpreted as local time (which would be server time)
      const parsed = new Date(dateTimeString);
      
      console.log('🧪 parseCalendarDateTime result:', {
        parsed_toString: parsed.toString(),
        parsed_ISO: parsed.toISOString(),
        inUserTZ: parsed.toLocaleString('en-US', { 
          timeZone: userTimezone,
          hour: '2-digit', minute: '2-digit', hour12: true
        })
      });
      
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
    
    if (this.matchesKeywords(title, this.BENEFICIAL_KEYWORDS)) return 'BENEFICIAL';
    if (this.matchesKeywords(title, this.NEUTRAL_KEYWORDS)) return 'NEUTRAL';
    if (this.matchesKeywords(title, this.FOCUS_KEYWORDS)) return 'FOCUS_WORK';
    if (this.matchesKeywords(title, this.LIGHT_KEYWORDS)) return 'LIGHT_MEETINGS';
    if (this.matchesKeywords(title, this.HEAVY_KEYWORDS)) return 'HEAVY_MEETINGS';
    if (this.matchesKeywords(title, this.COLLABORATIVE_KEYWORDS)) return 'COLLABORATIVE';
    
    return 'COLLABORATIVE'; // Default for unmatched meetings
  }

  async getTodaysEvents(providedUserTimezone?: string): Promise<CalendarEvent[]> {
    if (!this.calendar) {
      throw new Error('Calendar service not initialized');
    }

    // Use provided timezone (from client-side) or fallback to server detection (which will be UTC in production)
    const userTimezone = providedUserTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';

    // Store timezone for use in other methods
    this.userTimezone = userTimezone;
    
    console.log('🌍 getTodaysEvents timezone source:', {
      providedUserTimezone: providedUserTimezone,
      serverDetected: Intl.DateTimeFormat().resolvedOptions().timeZone,
      finalUsed: userTimezone,
      source: providedUserTimezone ? 'CLIENT_SIDE' : 'SERVER_SIDE_FALLBACK'
    });
    
    // BULLETPROOF TIMEZONE HANDLING: Create proper date ranges for user's timezone
    const now = new Date();
    
    // Step 1: Get today's date in the user's timezone using proper timezone conversion
    const userDateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    });
    
    const userDateParts = userDateFormatter.formatToParts(now);
    const userYear = parseInt(userDateParts.find(p => p.type === 'year')?.value || '0');
    const userMonth = parseInt(userDateParts.find(p => p.type === 'month')?.value || '0');
    const userDay = parseInt(userDateParts.find(p => p.type === 'day')?.value || '0');
    
    // Step 2: Create start and end of day timestamps in user's timezone
    // We need to create these as UTC timestamps that represent midnight and end-of-day in user's TZ
    
    // Method: Create Date objects that represent the exact start/end of day in user's timezone
    // then convert to proper UTC ISO strings for Google Calendar API
    
    // Create temporary date objects to calculate timezone offset for this specific date
    const tempStart = new Date(userYear, userMonth - 1, userDay, 0, 0, 0, 0);
    const tempEnd = new Date(userYear, userMonth - 1, userDay, 23, 59, 59, 999);
    
    // Get the timezone offset for the user's timezone on this specific date
    // This accounts for DST changes
    const startInUserTZ = new Date(tempStart.toLocaleString('sv-SE', { timeZone: 'UTC' }));
    const startAsIfUserTZ = new Date(tempStart.toLocaleString('sv-SE', { timeZone: userTimezone }));
    const timezoneOffsetMs = startInUserTZ.getTime() - startAsIfUserTZ.getTime();
    
    // Apply the timezone offset to get the correct UTC times for the user's timezone boundaries
    const startOfDay = new Date(tempStart.getTime() - timezoneOffsetMs);
    const endOfDay = new Date(tempEnd.getTime() - timezoneOffsetMs);
    
    console.log('🔍 DEBUG - Timezone-aware Calendar date range:', {
      // Server info
      serverTime: now.toISOString(),
      serverTimeLocal: now.toString(),
      serverTimezone: process.env.TZ || 'UTC (default)',
      environment: process.env.NODE_ENV,
      
      // User timezone detection
      userTimezone: userTimezone,
      userDetectedDate: { userYear, userMonth, userDay },
      
      // Timezone calculation details
      tempStartLocal: tempStart.toString(),
      tempEndLocal: tempEnd.toString(),
      startInUserTZ: startInUserTZ.toISOString(),
      startAsIfUserTZ: startAsIfUserTZ.toISOString(),
      timezoneOffsetMs: timezoneOffsetMs,
      timezoneOffsetHours: timezoneOffsetMs / (1000 * 60 * 60),
      
      // Final UTC boundaries for Google Calendar API
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      startOfDayLocal: startOfDay.toString(),
      endOfDayLocal: endOfDay.toString(),
      
      // Verification: What these UTC times look like in user's timezone
      startOfDayInUserTZ: startOfDay.toLocaleString('en-US', { 
        timeZone: userTimezone, 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
      }),
      endOfDayInUserTZ: endOfDay.toLocaleString('en-US', { 
        timeZone: userTimezone,
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
      })
    });

    try {
      // Force fresh data with aggressive cache-busting for production
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        // Force fresh data by including timestamp in request
        maxResults: 2500,
        showDeleted: false,
        // Add cache-busting parameter
        'X-Cache-Control': 'no-cache',
      });

      const events = response.data.items || [];
      
      console.log('🔍 DEBUG - Raw Google Calendar API response:', {
        eventCount: events.length,
        rawEvents: events.map(e => ({
          id: e.id,
          summary: e.summary,
          start: e.start?.dateTime,
          end: e.end?.dateTime,
          created: e.created,
          updated: e.updated
        }))
      });
      
      return events
        .filter(event => event.start?.dateTime && event.end?.dateTime)
        .map((event, index) => {
          const summary = event.summary || 'No title';
          
          // DEBUG: Log raw dateTime strings from Google Calendar API
          const rawStartDateTime = event.start!.dateTime!;
          const rawEndDateTime = event.end!.dateTime!;
          
          // Create Date objects using our safe parsing method
          const startDate = this.parseCalendarDateTime(rawStartDateTime, userTimezone);
          const endDate = this.parseCalendarDateTime(rawEndDateTime, userTimezone);
          
          // 🧪 SIMPLE TIMEZONE TEST - Check for double conversion
          console.log(`🧪 TIMEZONE TEST - Event ${index + 1} "${summary}":`, {
            // Step 1: Raw Google Calendar dateTime string 
            rawStartDateTime: rawStartDateTime,
            
            // Step 2: Simple new Date() parsing
            simpleParsed_toString: new Date(rawStartDateTime).toString(),
            simpleParsed_toISOString: new Date(rawStartDateTime).toISOString(),
            
            // Step 3: Display in user's timezone (should match original time if no double conversion)
            displayInUserTZ: new Date(rawStartDateTime).toLocaleString('en-US', {
              timeZone: userTimezone,
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', hour12: true
            }),
            
            // Step 4: Display in UTC (for comparison)
            displayInUTC: new Date(rawStartDateTime).toLocaleString('en-US', {
              timeZone: 'UTC',
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', hour12: true
            }),
            
            // Step 5: Check if Google's dateTime has timezone info
            hasTimezoneInfo: rawStartDateTime.includes('+') || rawStartDateTime.includes('-') || rawStartDateTime.endsWith('Z'),
            
            // Environment info
            userTimezone: userTimezone,
            environment: process.env.NODE_ENV
          });
          
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
    if (events.length === 0) return 480; // 8 hours if no meetings

    const workStart = 9; // 9 AM
    const workEnd = 17; // 5 PM
    let totalFocusTime = 0;
    let qualityFocusTime = 0;

    console.log('🔍 DEBUG - calculateFocusTime timezone-aware calculation:', {
      eventsCount: events.length,
      userTimezone: userTimezone || 'not provided',
      workStart,
      workEnd
    });

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

    console.log('🔍 DEBUG - First meeting time analysis:', {
      firstMeetingStart: firstMeeting.start.toISOString(),
      timezoneAwareHours: firstMeetingTime.hours,
      timezoneAwareTotalHours: firstMeetingTime.totalHours,
      workStart,
      morningGap: firstMeetingTime.totalHours > workStart ? firstMeetingTime.totalHours - workStart : 0
    });

    if (firstMeetingTime.totalHours > workStart) {
      const morningGapHours = firstMeetingTime.totalHours - workStart;
      const morningGapMinutes = morningGapHours * 60;

      if (morningGapMinutes >= 30) { // 30+ minute blocks count as some focus time
        totalFocusTime += morningGapMinutes;
        if (morningGapMinutes >= 90) { // 90+ minute blocks are quality focus time
          qualityFocusTime += morningGapMinutes;
        }
      }

      console.log('🔍 DEBUG - Morning gap calculated:', {
        morningGapHours,
        morningGapMinutes,
        addedToTotal: morningGapMinutes >= 30,
        addedToQuality: morningGapMinutes >= 90
      });
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

      console.log(`🔍 DEBUG - Gap ${i + 1} between meetings:`, {
        currentEnd: currentEnd.toISOString(),
        nextStart: nextStart.toISOString(),
        gapMinutes,
        addedToTotal: gapMinutes >= 30,
        addedToQuality: gapMinutes >= 90
      });
    }

    // Check time after last meeting
    const lastMeeting = events[events.length - 1];
    const lastMeetingTime = getTimezoneAwareTime(lastMeeting.end, userTimezone);

    console.log('🔍 DEBUG - Last meeting time analysis:', {
      lastMeetingEnd: lastMeeting.end.toISOString(),
      timezoneAwareHours: lastMeetingTime.hours,
      timezoneAwareTotalHours: lastMeetingTime.totalHours,
      workEnd,
      eveningGap: lastMeetingTime.totalHours < workEnd ? workEnd - lastMeetingTime.totalHours : 0
    });

    if (lastMeetingTime.totalHours < workEnd) {
      const eveningGapMinutes = (workEnd - lastMeetingTime.totalHours) * 60;
      if (eveningGapMinutes >= 30) {
        totalFocusTime += eveningGapMinutes;
        if (eveningGapMinutes >= 90) {
          qualityFocusTime += eveningGapMinutes;
        }
      }

      console.log('🔍 DEBUG - Evening gap calculated:', {
        eveningGapHours: workEnd - lastMeetingTime.totalHours,
        eveningGapMinutes,
        addedToTotal: eveningGapMinutes >= 30,
        addedToQuality: eveningGapMinutes >= 90
      });
    }

    // Weight quality focus time more heavily
    const effectiveFocusTime = totalFocusTime * 0.7 + qualityFocusTime * 0.3;

    console.log('🔍 DEBUG - Final focus time calculation:', {
      totalFocusTime,
      qualityFocusTime,
      effectiveFocusTime,
      finalRounded: Math.round(effectiveFocusTime)
    });

    // SAFEGUARD: Cap focus time to prevent timezone-related bugs
    // Maximum possible focus time should be 8 hours (480 minutes) for a full workday
    const maxFocusTime = 480; // 8 hours in minutes
    const minFocusTime = 0;   // Can't have negative focus time

    const safeFocusTime = Math.max(minFocusTime, Math.min(maxFocusTime, Math.round(effectiveFocusTime)));

    if (Math.round(effectiveFocusTime) !== safeFocusTime) {
      console.warn('🚨 FOCUS TIME CAPPED - Timezone bug detected:', {
        originalFocusTime: Math.round(effectiveFocusTime),
        cappedFocusTime: safeFocusTime,
        userTimezone: userTimezone,
        eventsCount: events.length,
        environment: process.env.NODE_ENV
      });
    }

    return safeFocusTime;
  }

  private calculateFragmentationScore(events: CalendarEvent[]): number {
    if (events.length === 0) return 100; // Perfect score for no meetings
    if (events.length === 1) return 85; // Very good for single meeting

    const totalWorkMinutes = 8 * 60; // 8-hour workday
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
    console.log('🔍 DEBUG - calculateAdaptivePerformanceIndex input:', {
      totalEvents: events.length,
      eventDetails: events.map(e => ({ 
        summary: e.summary, 
        category: e.category, 
        start: e.start.toISOString(),
        end: e.end.toISOString()
      }))
    });
    
    // Filter events for performance calculation
    const actualMeetings = events.filter(event => 
      event.category !== 'BENEFICIAL' && 
      event.category !== 'NEUTRAL' && 
      event.category !== 'FOCUS_WORK'
    );
    const focusWorkEvents = events.filter(event => event.category === 'FOCUS_WORK');
    const beneficialEvents = events.filter(event => event.category === 'BENEFICIAL');
    
    console.log('🔍 DEBUG - After filtering for performance calculation:', {
      actualMeetingsCount: actualMeetings.length,
      focusWorkEventsCount: focusWorkEvents.length,
      beneficialEventsCount: beneficialEvents.length,
      actualMeetingDetails: actualMeetings.map(e => ({ summary: e.summary, category: e.category }))
    });
    
    if (actualMeetings.length === 0) {
      console.log('🔍 DEBUG - No actual meetings, returning 98 for Performance Index');
      return 98; // Near-perfect with no actual meetings
    }
    
    const meetingCount = actualMeetings.length;
    const backToBackCount = this.countBackToBackMeetings(actualMeetings);
    const focusTime = this.calculateFocusTime(events, this.userTimezone); // Use all events for focus time calculation
    const focusHours = focusTime / 60;
    
    // Calculate meeting density impact with more nuanced scoring
    let densityScore = 100;
    if (meetingCount >= 8) densityScore = 25;
    else if (meetingCount >= 7) densityScore = 35;
    else if (meetingCount >= 6) densityScore = 45;
    else if (meetingCount >= 5) densityScore = 60;
    else if (meetingCount >= 4) densityScore = 70;
    else if (meetingCount >= 3) densityScore = 80;
    else if (meetingCount >= 2) densityScore = 88;
    else if (meetingCount === 1) densityScore = 95;
    
    // Fragmentation penalty - heavily weighted for low focus time
    let fragmentationScore = 100;
    if (focusHours < 1) fragmentationScore = 20; // Severe fragmentation
    else if (focusHours < 2) fragmentationScore = 40;
    else if (focusHours < 3) fragmentationScore = 65;
    else if (focusHours < 4) fragmentationScore = 80;
    else if (focusHours >= 4) fragmentationScore = 90;
    else if (focusHours >= 5) fragmentationScore = 100;
    
    // Back-to-back meeting cognitive overhead
    let transitionScore = 100;
    if (backToBackCount >= 4) transitionScore = 40;
    else if (backToBackCount === 3) transitionScore = 60;
    else if (backToBackCount === 2) transitionScore = 75;
    else if (backToBackCount === 1) transitionScore = 88;
    
    // Time-of-day alignment (afternoon meetings more taxing) - only actual meetings
    const afternoonMeetings = actualMeetings.filter(e => this.getTimezoneAwareHours(e.start, this.userTimezone) >= 14).length;
    const morningMeetings = actualMeetings.filter(e => this.getTimezoneAwareHours(e.start, this.userTimezone) < 12).length;
    let timingScore = 100;
    if (afternoonMeetings > morningMeetings * 1.5) timingScore = 70;
    else if (afternoonMeetings > morningMeetings) timingScore = 85;
    
    // Recovery buffer analysis - only count actual meetings
    let recoveryScore = 100;
    const totalMeetingHours = actualMeetings.reduce((sum, event) => 
      sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60), 0);
    const workHours = 8;
    const meetingRatio = totalMeetingHours / workHours;
    if (meetingRatio > 0.75) recoveryScore = 30;
    else if (meetingRatio > 0.6) recoveryScore = 50;
    else if (meetingRatio > 0.5) recoveryScore = 70;
    else if (meetingRatio > 0.4) recoveryScore = 85;
    
    // Add bonuses for beneficial activities
    let bonusPoints = 0;
    bonusPoints += focusWorkEvents.length * 5; // Bonus for focus work blocks
    bonusPoints += beneficialEvents.length * 3; // Bonus for self-care activities
    
    // Weighted calculation emphasizing cognitive health
    const adaptiveIndex = (
      densityScore * 0.25 +
      fragmentationScore * 0.30 + // Heavy weight on fragmentation
      transitionScore * 0.20 +
      timingScore * 0.10 +
      recoveryScore * 0.15
    ) + bonusPoints;
    
    const finalScore = Math.round(Math.min(100, Math.max(0, adaptiveIndex)));
    console.log('🔍 DEBUG - calculateAdaptivePerformanceIndex final score:', finalScore);
    return finalScore;
  }
  
  private calculateCognitiveResilience(events: CalendarEvent[]): number {
    console.log('🔍 DEBUG - calculateCognitiveResilience input:', {
      totalEvents: events.length,
      eventDetails: events.map(e => ({ 
        summary: e.summary, 
        category: e.category, 
        start: e.start.toISOString(),
        end: e.end.toISOString()
      }))
    });
    
    if (events.length === 0) {
      console.log('🔍 DEBUG - No events, returning 90 for Cognitive Resilience');
      return 90; // High resilience with no meetings
    }
    
    // Context switching load
    const uniqueContexts = new Set(events.map(e => e.summary?.toLowerCase().split(' ')[0])).size;
    const contextSwitchingLoad = Math.min(100, uniqueContexts * 15);
    
    // Decision fatigue accumulation
    let decisionFatigue = 0;
    events.forEach((event, index) => {
      const hourOfDay = this.getTimezoneAwareHours(event.start, this.userTimezone);
      const timeFactor = hourOfDay >= 14 ? 1.5 : 1; // Afternoon decisions more taxing
      const attendeeFactor = (event.attendees && event.attendees > 5) ? 1.3 : 1;
      decisionFatigue += (10 * timeFactor * attendeeFactor);
    });
    decisionFatigue = Math.min(80, decisionFatigue);
    
    // Cognitive reserve calculation
    const focusTime = this.calculateFocusTime(events, this.userTimezone);
    const focusHours = focusTime / 60;
    let cognitiveReserve = 0;
    if (focusHours >= 4) cognitiveReserve = 80;
    else if (focusHours >= 3) cognitiveReserve = 60;
    else if (focusHours >= 2) cognitiveReserve = 40;
    else if (focusHours >= 1) cognitiveReserve = 20;
    else cognitiveReserve = 10;
    
    // Mental energy patterns
    const consecutiveMeetings = this.findLongestConsecutiveStretch(events);
    let energyDepletion = consecutiveMeetings * 20;
    energyDepletion = Math.min(60, energyDepletion);
    
    // Calculate resilience score
    const resilienceScore = Math.max(0, 
      100 - contextSwitchingLoad * 0.25 
      - decisionFatigue * 0.35 
      + cognitiveReserve * 0.25 
      - energyDepletion * 0.15
    );
    
    const finalScore = Math.round(Math.min(100, Math.max(0, resilienceScore)));
    console.log('🔍 DEBUG - calculateCognitiveResilience final score:', finalScore);
    return finalScore;
  }
  
  private calculateWorkRhythmRecovery(events: CalendarEvent[]): number {
    console.log('🔍 DEBUG - calculateWorkRhythmRecovery input:', {
      totalEvents: events.length,
      eventDetails: events.map(e => ({ 
        summary: e.summary, 
        category: e.category, 
        start: e.start.toISOString(),
        end: e.end.toISOString()
      }))
    });
    
    // Filter out beneficial, neutral, and focus work events
    const actualMeetings = events.filter(event => 
      event.category !== 'BENEFICIAL' && 
      event.category !== 'NEUTRAL' && 
      event.category !== 'FOCUS_WORK'
    );
    
    console.log('🔍 DEBUG - After filtering for rhythm recovery:', {
      actualMeetingsCount: actualMeetings.length,
      actualMeetingDetails: actualMeetings.map(e => ({ summary: e.summary, category: e.category }))
    });
    
    if (actualMeetings.length === 0) {
      console.log('🔍 DEBUG - No actual meetings, returning 98 for Work Rhythm Recovery');
      return 98; // Excellent rhythm with no actual meetings
    }
    
    // Work rhythm analysis - only consider actual meetings
    const morningBlock = actualMeetings.filter(e => {
      const hour = this.getTimezoneAwareHours(e.start, this.userTimezone);
      return hour >= 9 && hour < 12;
    }).length;
    const afternoonBlock = actualMeetings.filter(e => {
      const hour = this.getTimezoneAwareHours(e.start, this.userTimezone);
      return hour >= 12 && hour < 17;
    }).length;
    const rhythmBalance = Math.abs(morningBlock - afternoonBlock);
    let rhythmScore = 100 - (rhythmBalance * 15);
    rhythmScore = Math.max(40, rhythmScore);
    
    // Recovery adequacy - use all events for gap calculation (includes beneficial breaks)
    const gaps = this.calculateGapsBetweenMeetings(events);
    const adequateBreaks = gaps.filter(g => g >= 30).length; // 30+ minute breaks
    const shortBreaks = gaps.filter(g => g >= 15 && g < 30).length;
    let recoveryScore = (adequateBreaks * 20) + (shortBreaks * 10);
    recoveryScore = Math.min(100, recoveryScore);
    
    // Intensity sustainability - only count actual meeting hours
    const totalMeetingHours = actualMeetings.reduce((sum, event) => 
      sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60), 0);
    let sustainabilityScore = 100;
    if (totalMeetingHours > 7) sustainabilityScore = 20;
    else if (totalMeetingHours > 6) sustainabilityScore = 40;
    else if (totalMeetingHours > 5) sustainabilityScore = 60;
    else if (totalMeetingHours > 4) sustainabilityScore = 80;
    else sustainabilityScore = 95;
    
    // Natural energy alignment - only consider actual meetings
    const earlyMorningMeetings = actualMeetings.filter(e => this.getTimezoneAwareHours(e.start, this.userTimezone) < 9).length;
    const lateMeetings = actualMeetings.filter(e => this.getTimezoneAwareHours(e.start, this.userTimezone) >= 16).length;
    let alignmentScore = 100 - (earlyMorningMeetings * 20) - (lateMeetings * 15);
    alignmentScore = Math.max(30, alignmentScore);
    
    // Combined work rhythm & recovery score
    const combinedScore = (
      rhythmScore * 0.25 +
      recoveryScore * 0.35 +
      sustainabilityScore * 0.25 +
      alignmentScore * 0.15
    );
    
    const finalScore = Math.round(Math.min(100, Math.max(0, combinedScore)));
    console.log('🔍 DEBUG - calculateWorkRhythmRecovery final score:', finalScore);
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

  async analyzeWorkHealth(): Promise<WorkHealthMetrics> {
    const events = await this.getTodaysEvents();
    
    console.log('🔍 DEBUG - All events before categorization:', events.map(e => ({
      summary: e.summary,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
      category: e.category
    })));
    
    // Separate different types of events for analysis
    const actualMeetings = events.filter(event => 
      event.category !== 'BENEFICIAL' && 
      event.category !== 'NEUTRAL' && 
      event.category !== 'FOCUS_WORK'
    );
    const focusWorkEvents = events.filter(event => event.category === 'FOCUS_WORK');
    const beneficialEvents = events.filter(event => event.category === 'BENEFICIAL');
    
    console.log('🔍 DEBUG - Categorized events:', {
      totalEvents: events.length,
      actualMeetings: actualMeetings.length,
      focusWorkEvents: focusWorkEvents.length,
      beneficialEvents: beneficialEvents.length,
      actualMeetingsDetails: actualMeetings.map(e => ({ summary: e.summary, category: e.category }))
    });
    
    const meetingCount = actualMeetings.length; // Only count actual meetings
    const backToBackCount = this.countBackToBackMeetings(actualMeetings);
    const cognitiveAvailability = this.calculateCognitiveAvailability(events);
    const focusTime = this.calculateFocusTime(events, this.userTimezone);
    const fragmentationScore = this.calculateFragmentationScore(events);
    
    const totalDuration = actualMeetings.reduce((sum, event) => {
      return sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
    }, 0);

    const bufferTime = Math.max(0, (8 * 60) - (totalDuration * 60) - (meetingCount * 15)); // Account for transitions
    
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
      `Adaptive Performance: ${adaptivePerformanceIndex}%${adaptivePerformanceIndex >= 85 ? ' (Optimal)' : adaptivePerformanceIndex >= 75 ? ' (Excellent)' : adaptivePerformanceIndex >= 65 ? ' (Good)' : adaptivePerformanceIndex >= 50 ? ' (Moderate)' : ' (Needs Attention)'}`,
      `Cognitive Resilience: ${cognitiveResilience}%${cognitiveResilience >= 80 ? ' (Strong)' : cognitiveResilience >= 60 ? ' (Good)' : cognitiveResilience >= 40 ? ' (Moderate)' : ' (Limited)'}`,
      `Sustainability Index: ${workRhythmRecovery}%${workRhythmRecovery >= 80 ? ' (Excellent)' : workRhythmRecovery >= 60 ? ' (Good)' : workRhythmRecovery >= 40 ? ' (Moderate)' : ' (Needs Attention)'}`
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
        fragmentationScore
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