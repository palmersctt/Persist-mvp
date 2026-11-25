// The engine's public input types. Provider-neutral: Google Calendar, the
// sandbox, and outside callers (an AI assistant with its own calendar access)
// all describe a day in these shapes. See README.md in this folder.

import type { MeetingCategory } from './workScores';

/** One calendar block. Only start and end are required. */
export interface EngineMeeting {
  /** ISO 8601 date-time with an offset, e.g. 2026-11-25T09:00:00-08:00. */
  start: string;
  end: string;
  /** People in the meeting, you included. Absent counts as 1. */
  attendees?: number;
  /** Used only to pick a category; never stored. */
  title?: string;
  /** Wins over the title. Absent with no title counts as COLLABORATIVE. */
  category?: MeetingCategory;
  /** Accepted for later use; does not affect scores yet. */
  organizerIsMe?: boolean;
}

/** Mail volume for the day. Accepted and returned; not scored yet. */
export interface EmailCounts {
  sent?: number;
  /** Sent outside working hours, as the caller defines them. */
  sentAfterHours?: number;
  received?: number;
}

/** Training from an activity or recovery provider. */
export interface TrainingInput {
  /** Today's training load (minutes-moved or relative-effort units). */
  loadToday?: number;
  /** The athlete's daily load baseline. Absent = no training signal. */
  baseline?: number;
  /** Activities in the trailing 7 days (shown, not scored). */
  weekActivityCount?: number;
  /** Key sessions already done. Absent = unknown; [] = known none. */
  keySessions?: { daysAgo: number; kind: 'hard' | 'long' }[];
}

/**
 * One day, from any source. Version 1. Every section is optional:
 * `meetings` absent means the calendar is unknown; `[]` means an open day.
 */
export interface DayInput {
  version: 1;
  /** The user's local date, YYYY-MM-DD. */
  date: string;
  /** IANA zone, e.g. America/New_York — sets morning/afternoon/early/late. */
  timezone: string;
  meetings?: EngineMeeting[];
  email?: EmailCounts;
  training?: TrainingInput;
  sleep?: { performance?: number };
  /** Recovery 0–100. Only gates intensity together with short sleep. */
  recovery?: number;
  /** Meeting hours per local day, starting today, for the week plan. */
  weekAhead?: { date: string; meetingHours: number }[];
}
