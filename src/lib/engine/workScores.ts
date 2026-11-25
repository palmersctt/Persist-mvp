// Work scores: calendar meetings → Focus, Strain, Rhythm and the day's
// schedule stats. Pure and provider-neutral: Google Calendar, /verdict and
// any outside caller (an assistant sending raw meeting times) all score
// through here. Moved verbatim from GoogleCalendarService; the golden test
// (src/services/googleCalendar.golden.test.ts) pins the numbers.

import type { EngineMeeting } from './types';

export type MeetingCategory =
  | 'BENEFICIAL'
  | 'NEUTRAL'
  | 'FOCUS_WORK'
  | 'LIGHT_MEETINGS'
  | 'HEAVY_MEETINGS'
  | 'COLLABORATIVE';

/** A calendar block as the scoring maths sees it. */
export interface WorkEvent {
  start: Date;
  end: Date;
  attendees?: number;
  category?: MeetingCategory;
  /** Identity of the meeting's topic, for context switching (lowercased title). */
  contextKey: string;
}

// Meeting categorization keywords
const BENEFICIAL_KEYWORDS = [
  'workout',
  'gym',
  'exercise',
  'walk',
  'run',
  'yoga',
  'meditation',
  'break',
  'lunch',
  'eat',
  'personal',
  'doctor',
  'dentist',
  'therapy',
  'massage',
  'health',
  'family',
  'kids',
  'school pickup',
  'school drop',
  'date night',
  'self-care',
  'nap',
  'rest',
  'recovery',
  'hobby',
  'read',
  'journal',
  'breathe',
  'stretch',
  'swim',
  'hike',
  'bike',
  'sport',
  'game',
  'play',
  'volunteer',
  'church',
  'prayer',
  'worship',
  'social',
  'friends',
  'happy hour',
  'dinner',
  'basketball',
  'football',
  'soccer',
  'baseball',
  'tennis',
  'golf',
  'hockey',
  'volleyball',
  'softball',
  'lacrosse',
  'wrestling',
  'track',
  'gymnastics',
  'karate',
  'ballet',
  'dance',
  'cheer',
  'practice',
];

const NEUTRAL_KEYWORDS = [
  'commute',
  'travel',
  'vacation',
  'holiday',
  'sick',
  'pto',
  'personal day',
  'out of office',
  'not available',
  'busy',
  'blocked',
  'unavailable',
  'appointment',
  'errand',
  'pickup',
  'drop off',
  'buffer',
  'hold',
  'tentative',
  'maybe',
  'optional',
];

const FOCUS_KEYWORDS = [
  'focus',
  'deep work',
  'coding',
  'writing',
  'research',
  'analysis',
  'strategy',
  'no meetings',
  'focus block',
  'maker time',
  'thinking time',
  'planning',
  'prep',
];

const LIGHT_KEYWORDS = [
  '1:1',
  'one-on-one',
  'check-in',
  'sync',
  'standup',
  'coffee chat',
  'quick sync',
  'brief update',
  'touch base',
  'catch up',
];

const HEAVY_KEYWORDS = [
  'presentation',
  'demo',
  'review',
  'interview',
  'all-hands',
  'town hall',
  'board meeting',
  'client presentation',
  'quarterly review',
  'training',
  'workshop',
  'seminar',
  'conference',
];

const COLLABORATIVE_KEYWORDS = [
  'brainstorm',
  'planning',
  'team meeting',
  'retrospective',
  'working session',
  'design review',
  'project meeting',
  'scrum',
  'sprint',
  'kickoff',
];

// Compound patterns checked BEFORE single-keyword matching.
// These override what would otherwise be a false-positive category.
// Each entry: [pattern, category].  Checked in order; first match wins.
const COMPOUND_OVERRIDES: Array<[string, MeetingCategory]> = [
  // "work through lunch", "working lunch", "skip lunch", "lunch and learn" → not self-care
  ['work through lunch', 'COLLABORATIVE'],
  ['working lunch', 'COLLABORATIVE'],
  ['skip lunch', 'HEAVY_MEETINGS'],
  ['lunch and learn', 'COLLABORATIVE'],
  ['lunch & learn', 'COLLABORATIVE'],
  ['working dinner', 'COLLABORATIVE'],
  // "sprint planning", "sprint review", "sprint retro" → collaborative ceremonies, not focus
  ['sprint planning', 'COLLABORATIVE'],
  ['sprint review', 'COLLABORATIVE'],
  ['sprint retro', 'COLLABORATIVE'],
  // "prep for" something is usually meeting prep, not solo focus
  ['prep for', 'LIGHT_MEETINGS'],
];

function matchesKeywords(title: string, keywords: string[]): boolean {
  const lowercaseTitle = title.toLowerCase();
  return keywords.some((keyword) => lowercaseTitle.includes(keyword.toLowerCase()));
}

/** Title → category, by keyword. Unmatched titles are COLLABORATIVE. */
export function categorizeMeeting(summary: string): MeetingCategory {
  const title = summary.toLowerCase().trim();

  // 1. Compound overrides — most-specific, multi-word patterns first
  for (const [pattern, cat] of COMPOUND_OVERRIDES) {
    if (title.includes(pattern)) return cat;
  }

  // 2. Single-keyword matching — collaborative before focus so that
  //    shared keywords like "planning" resolve to the meeting category
  let category: MeetingCategory;

  if (matchesKeywords(title, BENEFICIAL_KEYWORDS)) category = 'BENEFICIAL';
  else if (matchesKeywords(title, NEUTRAL_KEYWORDS)) category = 'NEUTRAL';
  else if (matchesKeywords(title, COLLABORATIVE_KEYWORDS)) category = 'COLLABORATIVE';
  else if (matchesKeywords(title, LIGHT_KEYWORDS)) category = 'LIGHT_MEETINGS';
  else if (matchesKeywords(title, HEAVY_KEYWORDS)) category = 'HEAVY_MEETINGS';
  else if (matchesKeywords(title, FOCUS_KEYWORDS)) category = 'FOCUS_WORK';
  else category = 'COLLABORATIVE'; // Default for unmatched meetings

  return category;
}

/** Whether an event is a meeting (not a self-care, neutral or focus block). */
export function isActualMeeting(event: { category?: MeetingCategory }): boolean {
  return (
    event.category !== 'BENEFICIAL' &&
    event.category !== 'NEUTRAL' &&
    event.category !== 'FOCUS_WORK'
  );
}

// Helper method to get timezone-aware hours from a Date object
function getTimezoneAwareHours(date: Date, timezone?: string): number {
  if (!timezone) {
    // Fallback to direct getHours() if no timezone provided
    return date.getHours();
  }

  // Get the hour in the user's timezone
  const timeInUserTZ = date.toLocaleString('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: 'numeric',
  });

  return parseInt(timeInUserTZ);
}

function calculateCognitiveAvailability(events: WorkEvent[], timezone: string): number {
  // Filter out beneficial and neutral events for cognitive calculation
  const actualMeetings = events.filter(
    (event) =>
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
  actualMeetings.forEach((event) => {
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
  const beneficialEvents = events.filter((e) => e.category === 'BENEFICIAL');
  cognitiveDepletion -= beneficialEvents.length * 3; // Reduce depletion for self-care

  // Back-to-back meetings reduce cognitive availability (only count actual meetings)
  const backToBackCount = countBackToBackMeetings(actualMeetings);
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
  const largeMeetings = actualMeetings.filter((event) => event.attendees && event.attendees >= 8);
  cognitiveDepletion += largeMeetings.length * 3;

  // Time of day factor - afternoon meetings more taxing (only actual meetings)
  const afternoonMeetings = actualMeetings.filter(
    (event) => getTimezoneAwareHours(event.start, timezone) >= 13
  );
  if (afternoonMeetings.length >= 3) {
    cognitiveDepletion += 5;
  }

  // Convert depletion to availability (100 - depletion)
  const cognitiveAvailability = 100 - Math.min(85, Math.max(10, Math.round(cognitiveDepletion)));
  return Math.max(15, Math.min(90, cognitiveAvailability)); // Ensure availability is between 15-90
}

function countBackToBackMeetings(events: WorkEvent[]): number {
  let count = 0;
  for (let i = 0; i < events.length - 1; i++) {
    const currentEnd = events[i].end.getTime();
    const nextStart = events[i + 1].start.getTime();
    const gap = (nextStart - currentEnd) / (1000 * 60); // Gap in minutes

    if (gap <= 15) {
      // 15 minutes or less gap = back-to-back
      count++;
    }
  }
  return count;
}

function calculateFocusTime(events: WorkEvent[], userTimezone?: string): number {
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
        totalHours: date.getHours() + date.getMinutes() / 60,
      };
    }

    // Get the time in the user's timezone
    const timeInUserTZ = date.toLocaleString('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    const [hourStr, minuteStr] = timeInUserTZ.split(':');
    const hours = parseInt(hourStr);
    const minutes = parseInt(minuteStr);

    return {
      hours,
      minutes,
      totalHours: hours + minutes / 60,
    };
  };

  // Check time before first meeting
  const firstMeeting = events[0];
  const firstMeetingTime = getTimezoneAwareTime(firstMeeting.start, userTimezone);

  if (firstMeetingTime.totalHours > workStart) {
    const morningGapHours = firstMeetingTime.totalHours - workStart;
    const morningGapMinutes = morningGapHours * 60;

    if (morningGapMinutes >= 30) {
      // 30+ minute blocks count as some focus time
      totalFocusTime += morningGapMinutes;
      if (morningGapMinutes >= 90) {
        // 90+ minute blocks are quality focus time
        qualityFocusTime += morningGapMinutes;
      }
    }
  }

  // Check gaps between meetings (time difference calculation is timezone-agnostic)
  for (let i = 0; i < events.length - 1; i++) {
    const currentEnd = events[i].end;
    const nextStart = events[i + 1].start;
    const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);

    if (gapMinutes >= 30) {
      // 30+ minute gaps count as focus time
      totalFocusTime += gapMinutes;
      if (gapMinutes >= 90) {
        // 90+ minute gaps are quality focus time
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
  const minFocusTime = 0; // Can't have negative focus time

  const safeFocusTime = Math.max(
    minFocusTime,
    Math.min(maxRealisticFocusTime, Math.round(effectiveFocusTime))
  );

  // ALTERNATIVE CALCULATION: Use simpler, more accurate approach
  // If the complex calculation seems wrong, use theoretical maximum
  const simpleCalculation = Math.max(0, theoreticalMaxFocus);

  // Use the more conservative (lower) of the two calculations
  const finalFocusTime = Math.min(safeFocusTime, simpleCalculation);

  return finalFocusTime;
}

function calculateFragmentationScore(events: WorkEvent[], timezone: string): number {
  if (events.length === 0) return 100; // Perfect score for no meetings
  if (events.length === 1) return 85; // Very good for single meeting

  const totalWorkMinutes = 12 * 60; // 12-hour workday (6 AM - 6 PM)
  const focusTimeMinutes = calculateFocusTime(events, timezone);
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

function calculateAdaptivePerformanceIndex(events: WorkEvent[], timezone: string): number {
  // Filter events by type
  const actualMeetings = events.filter(
    (event) =>
      event.category !== 'BENEFICIAL' &&
      event.category !== 'NEUTRAL' &&
      event.category !== 'FOCUS_WORK'
  );
  const focusWorkEvents = events.filter((event) => event.category === 'FOCUS_WORK');
  const beneficialEvents = events.filter((event) => event.category === 'BENEFICIAL');

  // No meetings: day off or clear calendar — positive, not punitive.
  // Intentional structure (focus blocks) earns a higher score.
  if (actualMeetings.length === 0) {
    const hasFocusBlocks = focusWorkEvents.length > 0;
    const hasBeneficialEvents = beneficialEvents.length > 0;
    if (hasFocusBlocks) return 97;
    if (hasBeneficialEvents) return 93;
    return 90;
  }

  const backToBackCount = countBackToBackMeetings(actualMeetings);
  const focusTime = calculateFocusTime(events, timezone);
  const focusHours = focusTime / 60;

  // Weighted meeting load — a board presentation ≠ a standup
  let weightedMeetingLoad = 0;
  actualMeetings.forEach((event) => {
    const durationHours = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
    const durationWeight =
      durationHours >= 1.5 ? 1.5 : durationHours >= 1 ? 1.2 : durationHours >= 0.5 ? 1.0 : 0.6;
    const categoryWeight =
      event.category === 'HEAVY_MEETINGS'
        ? 1.6
        : event.category === 'COLLABORATIVE'
          ? 1.1
          : event.category === 'LIGHT_MEETINGS'
            ? 0.6
            : 1.0;
    const attendeeWeight =
      event.attendees && event.attendees >= 10
        ? 1.3
        : event.attendees && event.attendees >= 5
          ? 1.1
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

  // Back-to-back transitions — each one stacks painfully.
  // Cap at 90: even without back-to-backs, switching between meetings and
  // solo work still costs something (context reload, mental preparation).
  let transitionScore = 90;
  if (backToBackCount >= 5) transitionScore = 5;
  else if (backToBackCount >= 4) transitionScore = 15;
  else if (backToBackCount === 3) transitionScore = 30;
  else if (backToBackCount === 2) transitionScore = 55;
  else if (backToBackCount === 1) transitionScore = 78;

  // Afternoon-heavy days are draining (1pm+ counts as afternoon).
  // Cap at 90: even balanced timing has natural energy dips (post-lunch,
  // late-afternoon) that prevent a truly perfect timing score.
  const afternoonMeetings = actualMeetings.filter(
    (e) => getTimezoneAwareHours(e.start, timezone) >= 13
  ).length;
  const morningMeetings = actualMeetings.filter(
    (e) => getTimezoneAwareHours(e.start, timezone) < 12
  ).length;
  let timingScore = 90;
  if (afternoonMeetings >= 4) timingScore = 40;
  else if (afternoonMeetings > morningMeetings * 1.5) timingScore = 55;
  else if (afternoonMeetings > morningMeetings) timingScore = 75;

  // Meeting-to-work ratio — total hours in meetings vs. workday.
  // Cap at 90: even low meeting ratios carry scheduling overhead —
  // the meeting still fragments your mental model of the day.
  let recoveryScore = 90;
  const totalMeetingHours = actualMeetings.reduce(
    (sum, event) => sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60),
    0
  );
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
  const adaptiveIndex =
    densityScore * 0.25 +
    fragmentationScore * 0.3 +
    transitionScore * 0.2 +
    timingScore * 0.1 +
    recoveryScore * 0.15 +
    bonusPoints;

  const finalScore = Math.round(Math.min(100, Math.max(0, adaptiveIndex)));
  return finalScore;
}

function calculateCognitiveResilience(events: WorkEvent[], timezone: string): number {
  // Separate by type
  const actualMeetings = events.filter(
    (event) =>
      event.category !== 'BENEFICIAL' &&
      event.category !== 'NEUTRAL' &&
      event.category !== 'FOCUS_WORK'
  );
  const beneficialEvents = events.filter((e) => e.category === 'BENEFICIAL');

  // No meetings: low strain but not zero — ambient cognitive load always exists
  // (email triage, Slack monitoring, context maintenance, prioritization decisions).
  // Beneficial events slightly reduce it (a walk clears your head).
  if (actualMeetings.length === 0) {
    const hasBeneficial = beneficialEvents.length > 0;
    return hasBeneficial ? 8 : 12;
  }

  // Context switching — unique topics drain mental bandwidth
  const uniqueContexts = new Set(actualMeetings.map((e) => e.contextKey)).size;
  const contextSwitchingLoad = Math.min(100, uniqueContexts * 18);

  // Decision fatigue — weighted by type, time of day, attendees, and duration
  let decisionFatigue = 0;
  actualMeetings.forEach((event) => {
    const hourOfDay = getTimezoneAwareHours(event.start, timezone);
    const durationHours = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
    const timeFactor = hourOfDay >= 15 ? 1.8 : hourOfDay >= 13 ? 1.4 : 1;
    const attendeeFactor =
      event.attendees && event.attendees >= 10
        ? 1.6
        : event.attendees && event.attendees >= 5
          ? 1.3
          : event.attendees && event.attendees >= 3
            ? 1.1
            : 1;
    const categoryFactor =
      event.category === 'HEAVY_MEETINGS'
        ? 1.8
        : event.category === 'COLLABORATIVE'
          ? 1.2
          : event.category === 'LIGHT_MEETINGS'
            ? 0.7
            : 1.0;
    // Long meetings are exponentially more draining — a 6hr workshop isn't 4x a 1.5hr meeting
    const durationFactor =
      durationHours >= 4
        ? 4.0
        : durationHours >= 3
          ? 3.0
          : durationHours >= 2
            ? 2.2
            : durationHours >= 1.5
              ? 1.6
              : durationHours >= 1
                ? 1.2
                : 1.0;
    decisionFatigue += 10 * timeFactor * attendeeFactor * categoryFactor * durationFactor;
  });
  decisionFatigue = Math.min(100, decisionFatigue);

  // Cognitive reserve from focus time
  const focusTime = calculateFocusTime(events, timezone);
  const focusHours = focusTime / 60;
  let cognitiveReserve = 0;
  if (focusHours >= 5) cognitiveReserve = 90;
  else if (focusHours >= 4) cognitiveReserve = 70;
  else if (focusHours >= 3) cognitiveReserve = 50;
  else if (focusHours >= 2) cognitiveReserve = 30;
  else if (focusHours >= 1) cognitiveReserve = 12;
  else cognitiveReserve = 0;

  // Consecutive meeting chains drain energy hard
  const consecutiveMeetings = findLongestConsecutiveStretch(actualMeetings);
  let energyDepletion = 0;
  if (consecutiveMeetings >= 5) energyDepletion = 90;
  else if (consecutiveMeetings >= 4) energyDepletion = 70;
  else if (consecutiveMeetings >= 3) energyDepletion = 50;
  else if (consecutiveMeetings >= 2) energyDepletion = 30;
  else energyDepletion = consecutiveMeetings * 12;

  // Beneficial events restore resilience (walks, breaks, exercise)
  const recoveryBoost = Math.min(beneficialEvents.length, 3) * 5;

  // Calculate resilience score (internal: higher = more resilient)
  const resilienceScore =
    Math.max(
      0,
      100 -
        contextSwitchingLoad * 0.3 -
        decisionFatigue * 0.35 +
        cognitiveReserve * 0.2 -
        energyDepletion * 0.15
    ) + recoveryBoost;

  // Convert resilience → strain (higher = more cognitive load on the day).
  // Cap resilience at 92: even the lightest meeting day carries ambient strain
  // from email, Slack, context-switching between your own tasks.
  const strainScore = 100 - Math.min(92, Math.max(0, resilienceScore));
  return Math.round(strainScore);
}

function calculateWorkRhythmRecovery(events: WorkEvent[], timezone: string): number {
  // Separate by type
  const actualMeetings = events.filter(
    (event) =>
      event.category !== 'BENEFICIAL' &&
      event.category !== 'NEUTRAL' &&
      event.category !== 'FOCUS_WORK'
  );
  const beneficialEvents = events.filter((e) => e.category === 'BENEFICIAL');
  const focusWorkEvents = events.filter((e) => e.category === 'FOCUS_WORK');

  if (actualMeetings.length === 0) {
    const hasFocusBlocks = focusWorkEvents.length > 0;
    const hasBeneficialEvents = beneficialEvents.length > 0;
    if (hasFocusBlocks) return 97;
    if (hasBeneficialEvents) return 93;
    return 90;
  }

  // With only 1 meeting, the rest of the day is open — great recovery
  if (actualMeetings.length === 1) {
    const hasBeneficial = beneficialEvents.length > 0;
    const hasFocusBlocks = focusWorkEvents.length > 0;
    if (hasBeneficial && hasFocusBlocks) return 95;
    if (hasBeneficial || hasFocusBlocks) return 92;
    return 88;
  }

  // Work rhythm balance — lopsided days feel worse
  const morningBlock = actualMeetings.filter((e) => {
    const hour = getTimezoneAwareHours(e.start, timezone);
    return hour >= 6 && hour < 12;
  }).length;
  const afternoonBlock = actualMeetings.filter((e) => {
    const hour = getTimezoneAwareHours(e.start, timezone);
    return hour >= 12 && hour < 18;
  }).length;
  const rhythmBalance = Math.abs(morningBlock - afternoonBlock);
  let rhythmScore = 100 - rhythmBalance * 20;
  rhythmScore = Math.max(10, rhythmScore);

  // Recovery adequacy — beneficial events count as real breaks
  const gaps = calculateGapsBetweenMeetings(actualMeetings);
  const adequateBreaks = gaps.filter((g) => g >= 30).length;
  const shortBreaks = gaps.filter((g) => g >= 15 && g < 30).length;
  // Walks, exercise, lunch etc. are actual recovery
  const beneficialBreaks = beneficialEvents.length;
  let recoveryScore = 0;
  if (adequateBreaks === 0 && shortBreaks === 0 && beneficialBreaks === 0) recoveryScore = 5;
  else {
    recoveryScore = adequateBreaks * 18 + shortBreaks * 8 + beneficialBreaks * 15;
  }
  recoveryScore = Math.min(100, recoveryScore);

  // Intensity sustainability — weighted by meeting type, not just raw hours
  let weightedIntensityHours = 0;
  actualMeetings.forEach((event) => {
    const durationHours = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
    const typeWeight =
      event.category === 'HEAVY_MEETINGS'
        ? 1.5
        : event.category === 'COLLABORATIVE'
          ? 1.1
          : event.category === 'LIGHT_MEETINGS'
            ? 0.7
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
  const earlyMorningMeetings = actualMeetings.filter(
    (e) => getTimezoneAwareHours(e.start, timezone) < 7
  ).length;
  const lateMeetings = actualMeetings.filter(
    (e) => getTimezoneAwareHours(e.start, timezone) >= 17
  ).length;
  let alignmentScore = 100 - earlyMorningMeetings * 30 - lateMeetings * 25;
  alignmentScore = Math.max(0, alignmentScore);

  // Combined score
  const combinedScore =
    rhythmScore * 0.2 + recoveryScore * 0.3 + sustainabilityScore * 0.3 + alignmentScore * 0.2;

  const finalScore = Math.round(Math.min(100, Math.max(0, combinedScore)));
  return finalScore;
}

function findLongestConsecutiveStretch(events: WorkEvent[]): number {
  if (events.length === 0) return 0;

  let maxStretch = 1;
  let currentStretch = 1;

  for (let i = 1; i < events.length; i++) {
    const gap = (events[i].start.getTime() - events[i - 1].end.getTime()) / (1000 * 60);
    if (gap <= 30) {
      // Less than 30 minutes between meetings
      currentStretch++;
      maxStretch = Math.max(maxStretch, currentStretch);
    } else {
      currentStretch = 1;
    }
  }

  return maxStretch;
}

function calculateGapsBetweenMeetings(events: WorkEvent[]): number[] {
  const gaps: number[] = [];
  for (let i = 1; i < events.length; i++) {
    const gap = (events[i].start.getTime() - events[i - 1].end.getTime()) / (1000 * 60);
    if (gap > 0) gaps.push(gap);
  }
  return gaps;
}

function calculatePerformanceIndex(
  cognitiveAvailability: number,
  focusTime: number,
  meetingCount: number,
  backToBackCount: number
): number {
  // New tiered performance assessment
  const baseScore = 50;

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
  const performanceIndex =
    meetingScore * 0.35 + // Meeting density is key factor
    focusScore * 0.35 + // Focus time equally important
    cognitiveScore * 0.25 + // Cognitive load support factor
    baseScore * 0.05 - // Small base score
    backToBackPenalty;

  return Math.min(100, Math.max(15, Math.round(performanceIndex)));
}

export interface WorkSchedule {
  meetingCount: number;
  backToBackCount: number;
  bufferTime: number;
  durationHours: number;
  fragmentationScore: number;
  morningMeetings: number;
  afternoonMeetings: number;
  meetingRatio: number; // meeting hours / 8hr workday (0-1)
  uniqueContexts: number; // distinct meeting topics for context switching
  longestStretch: number; // longest consecutive meeting chain
  adequateBreaks: number; // gaps >= 30 min
  shortBreaks: number; // gaps 15-29 min
  earlyLateMeetings: number; // meetings before 7am or after 5pm
}

export interface WorkDayAnalysis {
  /** Focus (adaptivePerformanceIndex), 0–100, higher is better. */
  focus: number;
  /** Strain (cognitiveResilience), 0–100, higher is more strain. */
  strain: number;
  /** Rhythm (workRhythmRecovery), 0–100, higher is better. */
  rhythm: number;
  /** Focus time in minutes (unrounded). */
  focusTime: number;
  cognitiveAvailability: number;
  /** The legacy performance index (WorkHealthMetrics.readiness). */
  legacyReadiness: number;
  focusWorkCount: number;
  beneficialCount: number;
  schedule: WorkSchedule;
}

/**
 * Score a day of calendar events. Events are expected in start order (Google
 * returns them sorted); this function does not reorder them.
 */
export function analyzeWorkDay(events: WorkEvent[], timezone: string): WorkDayAnalysis {
  // Separate different types of events for analysis
  const actualMeetings = events.filter(isActualMeeting);
  const focusWorkEvents = events.filter((event) => event.category === 'FOCUS_WORK');
  const beneficialEvents = events.filter((event) => event.category === 'BENEFICIAL');

  const meetingCount = actualMeetings.length; // Only count actual meetings
  const backToBackCount = countBackToBackMeetings(actualMeetings);
  const cognitiveAvailability = calculateCognitiveAvailability(events, timezone);
  const focusTime = calculateFocusTime(events, timezone);
  const fragmentationScore = calculateFragmentationScore(events, timezone);

  const totalDuration = actualMeetings.reduce((sum, event) => {
    return sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
  }, 0);

  const bufferTime = Math.max(0, 12 * 60 - totalDuration * 60 - meetingCount * 15); // Account for transitions

  const focus = calculateAdaptivePerformanceIndex(events, timezone);
  const strain = calculateCognitiveResilience(events, timezone);
  const rhythm = calculateWorkRhythmRecovery(events, timezone);

  // Legacy calculation for backward compatibility
  const legacyReadiness = calculatePerformanceIndex(
    cognitiveAvailability,
    focusTime,
    meetingCount,
    backToBackCount
  );

  // Compute per-metric breakdown data
  const morningMeetings = actualMeetings.filter(
    (e) => getTimezoneAwareHours(e.start, timezone) < 12
  ).length;
  const afternoonMeetings = actualMeetings.filter(
    (e) => getTimezoneAwareHours(e.start, timezone) >= 14
  ).length;
  const meetingRatio = totalDuration / 8;
  const uniqueContexts = new Set(actualMeetings.map((e) => e.contextKey)).size;
  const longestStretch = findLongestConsecutiveStretch(actualMeetings);
  const gaps = calculateGapsBetweenMeetings(actualMeetings);
  // With 0-1 meetings, gaps array is empty but the day is mostly free — reflect that
  const adequateBreaks =
    actualMeetings.length <= 1
      ? actualMeetings.length === 0
        ? 4
        : 3
      : gaps.filter((g) => g >= 30).length;
  const shortBreaks = actualMeetings.length <= 1 ? 0 : gaps.filter((g) => g >= 15 && g < 30).length;
  const earlyLateMeetings = actualMeetings.filter((e) => {
    const h = getTimezoneAwareHours(e.start, timezone);
    return h < 7 || h >= 17;
  }).length;

  return {
    focus,
    strain,
    rhythm,
    focusTime,
    cognitiveAvailability,
    legacyReadiness,
    focusWorkCount: focusWorkEvents.length,
    beneficialCount: beneficialEvents.length,
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
      earlyLateMeetings,
    },
  };
}

// Titles free/busy exports and privacy-stripped calendars put on every block.
// They say a block exists, not what it is, so they count as no title: without
// this, "Busy" matches a NEUTRAL keyword and a full day of meetings vanishes.
const PLACEHOLDER_TITLES = new Set([
  'busy',
  'tentative',
  'blocked',
  'unavailable',
  'not available',
  'private',
  'private event',
  'private appointment',
]);

/** A real title, or undefined for an empty or placeholder one. */
export function meaningfulTitle(title: string | undefined): string | undefined {
  const t = title?.trim();
  return t && !PLACEHOLDER_TITLES.has(t.toLowerCase()) ? t : undefined;
}

/**
 * Title → category for any source. Empty and placeholder titles ("Busy",
 * "Tentative", "Private event"…) say only that a block exists, so they
 * count as a meeting (COLLABORATIVE, the unmatched default); real titles go
 * through the keyword categorizer.
 */
export function categorizeTitle(title: string | undefined): MeetingCategory {
  const t = meaningfulTitle(title);
  return t ? categorizeMeeting(t) : 'COLLABORATIVE';
}

/**
 * A caller's meeting → the event the maths scores. (The Google service maps
 * its own events with the same categorizeTitle, but keeps its long-standing
 * shared context for untitled events.)
 */
export function toWorkEvent(m: EngineMeeting, index: number): WorkEvent {
  const title = meaningfulTitle(m.title);
  return {
    start: new Date(m.start),
    end: new Date(m.end),
    // Google counts an event with no attendee list as just you.
    attendees: m.attendees ?? 1,
    category: m.category ?? categorizeTitle(title),
    // Without a title each meeting is its own topic: real days rarely repeat
    // a meeting, so this is the closest read of context switching.
    contextKey: title ? title.toLowerCase() : `untitled:${index}`,
  };
}

/**
 * Score raw meetings from any source. Meetings are put in start order first;
 * untitled meetings (and placeholder titles like "Busy") fall back to the caller's category, else COLLABORATIVE
 * (the same default an unmatched title gets).
 */
export function scoreWork(meetings: EngineMeeting[], timezone: string): WorkDayAnalysis {
  const events = meetings.map(toWorkEvent).sort((a, b) => a.start.getTime() - b.start.getTime());
  return analyzeWorkDay(events, timezone);
}
