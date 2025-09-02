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
    if (events.length === 0) return 15; // Minimal baseline load

    let cognitiveLoad = 20; // Base morning load

    // Meeting density impact (40% of load)
    if (events.length >= 8) {
      cognitiveLoad += 45; // Heavy meeting day
    } else if (events.length >= 6) {
      cognitiveLoad += 30; // Moderate-heavy meetings
    } else if (events.length >= 4) {
      cognitiveLoad += 20; // Moderate meetings
    } else {
      cognitiveLoad += 10; // Light meetings
    }

    // Back-to-back meeting penalty (30% of load)
    const backToBackCount = this.countBackToBackMeetings(events);
    if (backToBackCount >= 4) {
      cognitiveLoad += 25;
    } else if (backToBackCount >= 2) {
      cognitiveLoad += 15;
    } else if (backToBackCount >= 1) {
      cognitiveLoad += 8;
    }

    // Meeting duration impact (20% of load)
    const totalDuration = events.reduce((sum, event) => {
      return sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
    }, 0);

    if (totalDuration >= 7) {
      cognitiveLoad += 20;
    } else if (totalDuration >= 5) {
      cognitiveLoad += 12;
    } else if (totalDuration >= 3) {
      cognitiveLoad += 6;
    }

    // Large meeting penalty (10% of load)
    const largeMeetings = events.filter(event => event.attendees && event.attendees >= 8);
    cognitiveLoad += largeMeetings.length * 5;

    return Math.min(95, Math.max(15, Math.round(cognitiveLoad)));
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

    // Check time before first meeting
    const firstMeeting = events[0];
    if (firstMeeting.start.getHours() > workStart) {
      const morningGap = firstMeeting.start.getHours() - workStart;
      if (morningGap >= 1.5) { // 90+ minute blocks count as focus time
        totalFocusTime += morningGap * 60;
      }
    }

    // Check gaps between meetings
    for (let i = 0; i < events.length - 1; i++) {
      const currentEnd = events[i].end;
      const nextStart = events[i + 1].start;
      const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
      
      if (gapMinutes >= 90) { // Only 90+ minute gaps count as meaningful focus time
        totalFocusTime += gapMinutes;
      }
    }

    // Check time after last meeting
    const lastMeeting = events[events.length - 1];
    if (lastMeeting.end.getHours() < workEnd) {
      const eveningGap = workEnd - lastMeeting.end.getHours();
      if (eveningGap >= 1.5) {
        totalFocusTime += eveningGap * 60;
      }
    }

    return Math.round(totalFocusTime);
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

  private calculatePerformanceIndex(cognitiveLoad: number, fragmentationScore: number, meetingCount: number): number {
    // Performance index is inverse of cognitive load + quality factors
    const cognitiveScore = 100 - cognitiveLoad; // Higher cognitive load = lower score
    const fragmentationBonus = fragmentationScore * 0.3;
    
    // Meeting density factor
    let densityScore = 50;
    if (meetingCount <= 3) densityScore = 80;
    else if (meetingCount <= 5) densityScore = 65;
    else if (meetingCount <= 7) densityScore = 45;
    else densityScore = 25;

    const performanceIndex = (cognitiveScore * 0.5) + (fragmentationBonus) + (densityScore * 0.2);
    
    return Math.min(100, Math.max(10, Math.round(performanceIndex)));
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
    
    const readiness = this.calculatePerformanceIndex(cognitiveLoad, fragmentationScore, meetingCount);

    // Determine status based on readiness score
    let status: string;
    if (readiness >= 85) status = 'EXCELLENT';
    else if (readiness >= 70) status = 'GOOD';
    else if (readiness >= 55) status = 'MODERATE';
    else status = 'NEEDS_ATTENTION';

    // Generate insights
    const contributors = [
      `Meeting Load: ${meetingCount} meetings${meetingCount <= 3 ? ' (Light)' : meetingCount <= 5 ? ' (Moderate)' : ' (Heavy)'}`,
      `Focus Time: ${Math.round(focusTime)} minutes${focusTime >= 120 ? ' (Good)' : focusTime >= 60 ? ' (Limited)' : ' (Minimal)'}`,
      `Cognitive Load: ${cognitiveLoad}%${cognitiveLoad <= 40 ? ' (Low)' : cognitiveLoad <= 60 ? ' (Moderate)' : ' (High)'}`
    ];

    const primaryFactors = [];
    if (meetingCount <= 3 && fragmentationScore >= 80) {
      primaryFactors.push('Optimal work conditions with preserved cognitive resources');
    } else if (cognitiveLoad >= 70) {
      primaryFactors.push('High cognitive demand from meeting density and schedule patterns');
    } else {
      primaryFactors.push('Moderate workload with balanced schedule demands');
    }

    if (backToBackCount >= 2) {
      primaryFactors.push(`${backToBackCount} back-to-back meetings increasing mental switching costs`);
    }

    return {
      readiness,
      cognitiveLoad,
      focusTime: Math.round(focusTime),
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