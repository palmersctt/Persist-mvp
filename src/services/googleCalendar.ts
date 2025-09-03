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

  private calculateCognitiveAvailability(events: CalendarEvent[]): number {
    if (events.length === 0) return 90; // Maximum cognitive availability with no meetings

    let cognitiveDepletion = 15; // Lower base depletion

    // Meeting density impact - reduces cognitive availability
    if (events.length >= 8) {
      cognitiveDepletion += 35; // Heavy meeting day
    } else if (events.length >= 6) {
      cognitiveDepletion += 25; // Moderate-heavy meetings
    } else if (events.length >= 4) {
      cognitiveDepletion += 15; // Moderate meetings
    } else if (events.length >= 2) {
      cognitiveDepletion += 8; // Light-moderate meetings
    } else {
      cognitiveDepletion += 3; // Very light meetings
    }

    // Back-to-back meetings reduce cognitive availability
    const backToBackCount = this.countBackToBackMeetings(events);
    if (backToBackCount >= 4) {
      cognitiveDepletion += 20;
    } else if (backToBackCount >= 2) {
      cognitiveDepletion += 12;
    } else if (backToBackCount >= 1) {
      cognitiveDepletion += 5;
    }

    // Meeting duration impact - longer meetings reduce availability
    const totalDuration = events.reduce((sum, event) => {
      return sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
    }, 0);

    if (totalDuration >= 7) {
      cognitiveDepletion += 15;
    } else if (totalDuration >= 5) {
      cognitiveDepletion += 10;
    } else if (totalDuration >= 3) {
      cognitiveDepletion += 5;
    }

    // Large meetings reduce cognitive availability
    const largeMeetings = events.filter(event => event.attendees && event.attendees >= 8);
    cognitiveDepletion += largeMeetings.length * 3;

    // Time of day factor - afternoon meetings more taxing
    const afternoonMeetings = events.filter(event => event.start.getHours() >= 13);
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

  private calculateAdaptivePerformanceIndex(events: CalendarEvent[]): number {
    if (events.length === 0) return 95; // Near-optimal with no meetings
    
    const meetingCount = events.length;
    const backToBackCount = this.countBackToBackMeetings(events);
    const focusTime = this.calculateFocusTime(events);
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
    
    // Time-of-day alignment (afternoon meetings more taxing)
    const afternoonMeetings = events.filter(e => e.start.getHours() >= 14).length;
    const morningMeetings = events.filter(e => e.start.getHours() < 12).length;
    let timingScore = 100;
    if (afternoonMeetings > morningMeetings * 1.5) timingScore = 70;
    else if (afternoonMeetings > morningMeetings) timingScore = 85;
    
    // Recovery buffer analysis
    let recoveryScore = 100;
    const totalMeetingHours = events.reduce((sum, event) => 
      sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60), 0);
    const workHours = 8;
    const meetingRatio = totalMeetingHours / workHours;
    if (meetingRatio > 0.75) recoveryScore = 30;
    else if (meetingRatio > 0.6) recoveryScore = 50;
    else if (meetingRatio > 0.5) recoveryScore = 70;
    else if (meetingRatio > 0.4) recoveryScore = 85;
    
    // Weighted calculation emphasizing cognitive health
    const adaptiveIndex = (
      densityScore * 0.25 +
      fragmentationScore * 0.30 + // Heavy weight on fragmentation
      transitionScore * 0.20 +
      timingScore * 0.10 +
      recoveryScore * 0.15
    );
    
    return Math.round(Math.min(100, Math.max(0, adaptiveIndex)));
  }
  
  private calculateCognitiveResilience(events: CalendarEvent[]): number {
    if (events.length === 0) return 90; // High resilience with no meetings
    
    // Context switching load
    const uniqueContexts = new Set(events.map(e => e.summary?.toLowerCase().split(' ')[0])).size;
    const contextSwitchingLoad = Math.min(100, uniqueContexts * 15);
    
    // Decision fatigue accumulation
    let decisionFatigue = 0;
    events.forEach((event, index) => {
      const hourOfDay = event.start.getHours();
      const timeFactor = hourOfDay >= 14 ? 1.5 : 1; // Afternoon decisions more taxing
      const attendeeFactor = (event.attendees && event.attendees > 5) ? 1.3 : 1;
      decisionFatigue += (10 * timeFactor * attendeeFactor);
    });
    decisionFatigue = Math.min(80, decisionFatigue);
    
    // Cognitive reserve calculation
    const focusTime = this.calculateFocusTime(events);
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
    
    return Math.round(Math.min(100, Math.max(0, resilienceScore)));
  }
  
  private calculateWorkRhythmRecovery(events: CalendarEvent[]): number {
    if (events.length === 0) return 95; // Excellent rhythm with no meetings
    
    // Work rhythm analysis
    const morningBlock = events.filter(e => e.start.getHours() >= 9 && e.start.getHours() < 12).length;
    const afternoonBlock = events.filter(e => e.start.getHours() >= 12 && e.start.getHours() < 17).length;
    const rhythmBalance = Math.abs(morningBlock - afternoonBlock);
    let rhythmScore = 100 - (rhythmBalance * 15);
    rhythmScore = Math.max(40, rhythmScore);
    
    // Recovery adequacy
    const gaps = this.calculateGapsBetweenMeetings(events);
    const adequateBreaks = gaps.filter(g => g >= 30).length; // 30+ minute breaks
    const shortBreaks = gaps.filter(g => g >= 15 && g < 30).length;
    let recoveryScore = (adequateBreaks * 20) + (shortBreaks * 10);
    recoveryScore = Math.min(100, recoveryScore);
    
    // Intensity sustainability
    const totalMeetingHours = events.reduce((sum, event) => 
      sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60), 0);
    let sustainabilityScore = 100;
    if (totalMeetingHours > 7) sustainabilityScore = 20;
    else if (totalMeetingHours > 6) sustainabilityScore = 40;
    else if (totalMeetingHours > 5) sustainabilityScore = 60;
    else if (totalMeetingHours > 4) sustainabilityScore = 80;
    else sustainabilityScore = 95;
    
    // Natural energy alignment
    const earlyMorningMeetings = events.filter(e => e.start.getHours() < 9).length;
    const lateMeetings = events.filter(e => e.start.getHours() >= 16).length;
    let alignmentScore = 100 - (earlyMorningMeetings * 20) - (lateMeetings * 15);
    alignmentScore = Math.max(30, alignmentScore);
    
    // Combined work rhythm & recovery score
    const combinedScore = (
      rhythmScore * 0.25 +
      recoveryScore * 0.35 +
      sustainabilityScore * 0.25 +
      alignmentScore * 0.15
    );
    
    return Math.round(Math.min(100, Math.max(0, combinedScore)));
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
    
    const meetingCount = events.length;
    const backToBackCount = this.countBackToBackMeetings(events);
    const cognitiveAvailability = this.calculateCognitiveAvailability(events);
    const focusTime = this.calculateFocusTime(events);
    const fragmentationScore = this.calculateFragmentationScore(events);
    
    const totalDuration = events.reduce((sum, event) => {
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
    
    // Contextual primary factors based on actual conditions
    if (meetingCount <= 2 && focusTime >= 240) {
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