// Minimal calendar event timing (no titles — times only) that the work-health
// API exposes alongside the scores. Kept as a standalone type now that the old
// readiness model that used to own it has been retired.

export interface DayShapeEvent {
  startISO: string;
  endISO: string;
}

export interface DayShape {
  firstEventStartISO: string | null;
  lastEventEndISO: string | null;
  events: DayShapeEvent[];
}
