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
