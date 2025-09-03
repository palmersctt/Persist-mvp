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
}

export interface WorkHealthMetrics {
  readiness: number;
  cognitiveLoad: number;
  focusTime: number;
  meetingDensity: number;
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
}

class GoogleCalendarService {
  private calendar: calendar_v3.Calendar | null = null;

  async initialize(accessToken: string): Promise<void> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async getTodaysEvents(): Promise<CalendarEvent[]> {
    if (!this.calendar) {
      throw new Error('Calendar service not initialized');
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      
      return events
        .filter(event => event.start?.dateTime && event.end?.dateTime)
        .map(event => ({
          id: event.id!,
          summary: event.summary || 'No title',
          start: new Date(event.start!.dateTime!),
          end: new Date(event.end!.dateTime!),
          attendees: event.attendees?.length || 1,
          isRecurring: !!event.recurringEventId,
        }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  private calculateCognitiveLoad(events: CalendarEvent[]): number {
    if (events.length === 0) return 10; // Very low baseline load for no meetings

    let cognitiveLoad = 15; // Lower base load

    // Meeting density impact - much more reasonable scaling
    if (events.length >= 8) {
      cognitiveLoad += 35; // Heavy meeting day
    } else if (events.length >= 6) {
      cognitiveLoad += 25; // Moderate-heavy meetings
    } else if (events.length >= 4) {
      cognitiveLoad += 15; // Moderate meetings
    } else if (events.length >= 2) {
      cognitiveLoad += 8; // Light-moderate meetings
    } else {
      cognitiveLoad += 3; // Very light meetings
    }

    // Back-to-back meeting penalty - more reasonable
    const backToBackCount = this.countBackToBackMeetings(events);
    if (backToBackCount >= 4) {
      cognitiveLoad += 20;
    } else if (backToBackCount >= 2) {
      cognitiveLoad += 12;
    } else if (backToBackCount >= 1) {
      cognitiveLoad += 5;
    }

    // Meeting duration impact - more balanced
    const totalDuration = events.reduce((sum, event) => {
      return sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
    }, 0);

    if (totalDuration >= 7) {
      cognitiveLoad += 15;
    } else if (totalDuration >= 5) {
      cognitiveLoad += 10;
    } else if (totalDuration >= 3) {
      cognitiveLoad += 5;
    }

    // Large meeting penalty - reduced impact
    const largeMeetings = events.filter(event => event.attendees && event.attendees >= 8);
    cognitiveLoad += largeMeetings.length * 3;

    // Time of day factor - afternoon meetings more taxing
    const afternoonMeetings = events.filter(event => event.start.getHours() >= 13);
    if (afternoonMeetings.length >= 3) {
      cognitiveLoad += 5;
    }

    return Math.min(85, Math.max(10, Math.round(cognitiveLoad)));
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

  private calculateFocusTime(events: CalendarEvent[]): number {
    if (events.length === 0) return 480; // 8 hours if no meetings

    const workStart = 9; // 9 AM
    const workEnd = 17; // 5 PM
    let totalFocusTime = 0;
    let qualityFocusTime = 0;

    // Check time before first meeting
    const firstMeeting = events[0];
    if (firstMeeting.start.getHours() > workStart) {
      const morningGapHours = firstMeeting.start.getHours() + (firstMeeting.start.getMinutes() / 60) - workStart;
      const morningGapMinutes = morningGapHours * 60;
      
      if (morningGapMinutes >= 30) { // 30+ minute blocks count as some focus time
        totalFocusTime += morningGapMinutes;
        if (morningGapMinutes >= 90) { // 90+ minute blocks are quality focus time
          qualityFocusTime += morningGapMinutes;
        }
      }
    }

    // Check gaps between meetings
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
    const lastMeetingEndHours = lastMeeting.end.getHours() + (lastMeeting.end.getMinutes() / 60);
    if (lastMeetingEndHours < workEnd) {
      const eveningGapMinutes = (workEnd - lastMeetingEndHours) * 60;
      if (eveningGapMinutes >= 30) {
        totalFocusTime += eveningGapMinutes;
        if (eveningGapMinutes >= 90) {
          qualityFocusTime += eveningGapMinutes;
        }
      }
    }

    // Weight quality focus time more heavily
    const effectiveFocusTime = totalFocusTime * 0.7 + qualityFocusTime * 0.3;

    return Math.round(effectiveFocusTime);
  }

  private calculateFragmentationScore(events: CalendarEvent[]): number {
    if (events.length === 0) return 100; // Perfect score for no meetings
    if (events.length === 1) return 85; // Very good for single meeting

    const totalWorkMinutes = 8 * 60; // 8-hour workday
    const focusTimeMinutes = this.calculateFocusTime(events);
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

  private calculatePerformanceIndex(cognitiveLoad: number, focusTime: number, meetingCount: number, backToBackCount: number): number {
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
    
    // Cognitive load scoring - inverse relationship
    const cognitiveScore = Math.max(0, 100 - cognitiveLoad);
    
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
    
    const meetingCount = events.length;
    const backToBackCount = this.countBackToBackMeetings(events);
    const cognitiveLoad = this.calculateCognitiveLoad(events);
    const focusTime = this.calculateFocusTime(events);
    const fragmentationScore = this.calculateFragmentationScore(events);
    
    const totalDuration = events.reduce((sum, event) => {
      return sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
    }, 0);

    const bufferTime = Math.max(0, (8 * 60) - (totalDuration * 60) - (meetingCount * 15)); // Account for transitions
    
    const readiness = this.calculatePerformanceIndex(cognitiveLoad, focusTime, meetingCount, backToBackCount);

    // Determine status based on improved readiness score thresholds
    let status: string;
    if (readiness >= 90) status = 'OPTIMAL';
    else if (readiness >= 80) status = 'EXCELLENT';
    else if (readiness >= 70) status = 'GOOD';
    else if (readiness >= 60) status = 'MODERATE';
    else status = 'NEEDS_ATTENTION';

    // Generate insights with improved categorization
    const contributors = [
      `Meeting Load: ${meetingCount} meetings${meetingCount === 0 ? ' (None)' : meetingCount <= 2 ? ' (Minimal)' : meetingCount <= 4 ? ' (Light)' : meetingCount <= 6 ? ' (Moderate)' : ' (Heavy)'}`,
      `Focus Time: ${(focusTime / 60).toFixed(1)} hours${focusTime >= 300 ? ' (Excellent)' : focusTime >= 180 ? ' (Good)' : focusTime >= 120 ? ' (Adequate)' : focusTime >= 60 ? ' (Limited)' : ' (Minimal)'}`,
      `Cognitive Load: ${cognitiveLoad}%${cognitiveLoad <= 30 ? ' (Very Low)' : cognitiveLoad <= 45 ? ' (Low)' : cognitiveLoad <= 60 ? ' (Moderate)' : ' (High)'}`
    ];

    const primaryFactors = [];
    
    // Contextual primary factors based on actual conditions
    if (meetingCount <= 2 && focusTime >= 240) {
      primaryFactors.push('Excellent work health conditions with minimal meeting load and abundant focus time');
    } else if (meetingCount <= 3 && focusTime >= 180) {
      primaryFactors.push('Good work health balance with light meeting schedule and adequate focus periods');
    } else if (readiness >= 85) {
      primaryFactors.push('Optimal cognitive resources and work capacity available');
    } else if (cognitiveLoad >= 65) {
      primaryFactors.push('Elevated cognitive demand from meeting density and schedule patterns');
    } else if (focusTime < 90) {
      primaryFactors.push('Limited deep work opportunities due to schedule fragmentation');
    } else {
      primaryFactors.push('Balanced workload with manageable cognitive demands');
    }

    if (backToBackCount >= 3) {
      primaryFactors.push(`${backToBackCount} back-to-back meetings creating significant mental switching costs`);
    } else if (backToBackCount >= 1) {
      primaryFactors.push(`${backToBackCount} back-to-back session${backToBackCount > 1 ? 's' : ''} requiring transition management`);
    }

    return {
      readiness,
      cognitiveLoad,
      focusTime: Math.round(focusTime), // Keep as minutes internally for calculations
      meetingDensity: meetingCount,
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
      }
    };
  }
}

export default GoogleCalendarService;