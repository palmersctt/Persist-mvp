import { google, calendar_v3 } from 'googleapis';
import { localDate, meetingHoursByDay, weekDates, type WeekDayHours } from '../lib/weekAhead';
import {
  analyzeWorkDay,
  categorizeMeeting,
  isActualMeeting,
  type MeetingCategory,
} from '../lib/engine/workScores';
// getServerSession and authOptions available if needed for server-side auth

export interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  attendees?: number;
  isRecurring?: boolean;
  category?: MeetingCategory;
}

export type { MeetingCategory };

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

  async initialize(accessToken: string): Promise<void> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    this.calendar = google.calendar({ version: 'v3', auth });
  }

  // Simplified helper method - NO additional timezone conversion
  private parseCalendarDateTime(dateTimeString: string, _userTimezone: string): Date {
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

  async getTodaysEvents(providedUserTimezone?: string): Promise<CalendarEvent[]> {
    if (!this.calendar) {
      throw new Error('Calendar service not initialized');
    }

    // Use provided timezone (from client-side) or fallback to server detection (which will be UTC in production)
    const userTimezone =
      providedUserTimezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'America/Los_Angeles';

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
        .map((event: calendar_v3.Schema$Event, _index: number) => {
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
            category: categorizeMeeting(summary),
          };
          return calendarEvent;
        });
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  /**
   * Meeting hours per local day for today and the days ahead — the forecast
   * the week plan places key sessions against. Counts the same events the
   * daily analysis treats as meetings. Never throws: a failed fetch returns
   * null and the day's analysis carries on without a week.
   */
  async getWeekAhead(providedUserTimezone?: string, days = 7): Promise<WeekDayHours[] | null> {
    if (!this.calendar) return null;
    const userTimezone = providedUserTimezone || this.userTimezone;
    try {
      const now = new Date();
      const dates = weekDates(localDate(now, userTimezone), days);
      // A day of slack either side covers any UTC offset; events are filed by
      // their local start day, so anything outside the window is dropped.
      const timeMin = new Date(`${dates[0]}T00:00:00Z`).getTime() - 86400000;
      const timeMax = new Date(`${dates[dates.length - 1]}T00:00:00Z`).getTime() + 2 * 86400000;
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(timeMin).toISOString(),
        timeMax: new Date(timeMax).toISOString(),
        timeZone: userTimezone,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500,
        showDeleted: false,
      });
      const meetings = (response.data.items || [])
        .filter((event: calendar_v3.Schema$Event) => event.start?.dateTime && event.end?.dateTime)
        .filter((event: calendar_v3.Schema$Event) => {
          return isActualMeeting({ category: categorizeMeeting(event.summary || 'No title') });
        })
        .map((event: calendar_v3.Schema$Event) => ({
          start: new Date(event.start!.dateTime!),
          end: new Date(event.end!.dateTime!),
        }));
      return meetingHoursByDay(meetings, dates, userTimezone);
    } catch (error) {
      console.error('Error fetching the week ahead:', error);
      return null;
    }
  }

  async analyzeWorkHealth(
    userTimezone?: string,
    preloadedEvents?: CalendarEvent[]
  ): Promise<WorkHealthMetrics> {
    const events = preloadedEvents || (await this.getTodaysEvents(userTimezone));

    const day = analyzeWorkDay(
      events.map((e) => ({
        start: e.start,
        end: e.end,
        attendees: e.attendees,
        category: e.category,
        contextKey: e.summary.toLowerCase().trim(),
      })),
      this.userTimezone
    );
    const { schedule, focusTime } = day;
    const { meetingCount, backToBackCount } = schedule;
    const adaptivePerformanceIndex = day.focus;
    const cognitiveResilience = day.strain;
    const workRhythmRecovery = day.rhythm;
    const focusWorkCount = day.focusWorkCount;
    const beneficialCount = day.beneficialCount;

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
      `Strain: ${cognitiveResilience}%${cognitiveResilience <= 20 ? ' (Low)' : cognitiveResilience <= 40 ? ' (Moderate)' : cognitiveResilience <= 60 ? ' (High)' : ' (Very High)'}`,
      `Rhythm: ${workRhythmRecovery}%${workRhythmRecovery >= 80 ? ' (Excellent)' : workRhythmRecovery >= 60 ? ' (Good)' : workRhythmRecovery >= 40 ? ' (Moderate)' : ' (Needs Attention)'}`,
    ];

    const primaryFactors = [];

    // Enhanced primary factors considering event categories
    if (meetingCount === 0 && focusWorkCount > 0) {
      primaryFactors.push(
        `Perfect conditions: ${focusWorkCount} focus work block${focusWorkCount > 1 ? 's' : ''} scheduled with no meetings`
      );
    } else if (meetingCount <= 2 && focusTime >= 240) {
      primaryFactors.push(
        'Excellent work health conditions with minimal meeting load and abundant focus time'
      );
    } else if (meetingCount <= 3 && focusTime >= 180) {
      primaryFactors.push(
        'Good work health balance with light meeting schedule and adequate focus periods'
      );
    } else if (adaptivePerformanceIndex >= 85) {
      primaryFactors.push('Optimal cognitive resources and work capacity available');
    } else if (cognitiveResilience >= 60) {
      primaryFactors.push('High cognitive strain due to context switching and decision fatigue');
    } else if (focusTime < 90) {
      primaryFactors.push('Limited deep work opportunities due to schedule fragmentation');
    } else {
      primaryFactors.push('Balanced workload with manageable cognitive demands');
    }

    // Add positive factors for beneficial events
    if (beneficialCount > 0) {
      primaryFactors.push(
        `${beneficialCount} wellness/self-care block${beneficialCount > 1 ? 's' : ''} supporting cognitive recovery`
      );
    }

    if (backToBackCount >= 3) {
      primaryFactors.push(
        `${backToBackCount} back-to-back meetings creating significant mental switching costs`
      );
    } else if (backToBackCount >= 1) {
      primaryFactors.push(
        `${backToBackCount} back-to-back session${backToBackCount > 1 ? 's' : ''} requiring transition management`
      );
    }

    return {
      // New intelligent metrics
      adaptivePerformanceIndex,
      cognitiveResilience,
      workRhythmRecovery,

      status,
      schedule,
      breakdown: {
        source: 'calendar',
        contributors,
        primaryFactors,
      },

      // Legacy fields for backward compatibility
      readiness: day.legacyReadiness,
      cognitiveAvailability: day.cognitiveAvailability,
      focusTime: Math.round(focusTime), // Keep as minutes internally for calculations
      meetingDensity: meetingCount,
    };
  }
}

export default GoogleCalendarService;
