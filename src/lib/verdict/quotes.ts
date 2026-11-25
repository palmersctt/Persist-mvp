// Card quotes for a visitor's day, from the same local generator the
// dashboard falls back to. Runs in the browser.

import { comicReliefGenerator } from '../../utils/comicReliefGenerator';
import type { WorkHealthMetrics } from '../../services/googleCalendar';
import type { WorkDayAnalysis } from '../engine/workScores';

export interface CardQuote {
  quote: string;
  source: string;
  subtitle: string;
}

/** The work analysis in the shape the quote generator reads. */
export function toMetrics(w: WorkDayAnalysis): WorkHealthMetrics {
  return {
    adaptivePerformanceIndex: w.focus,
    cognitiveResilience: w.strain,
    workRhythmRecovery: w.rhythm,
    status: 'MODERATE',
    schedule: w.schedule,
    breakdown: { source: 'calendar', contributors: [], primaryFactors: [] },
    readiness: w.legacyReadiness,
    cognitiveAvailability: w.cognitiveAvailability,
    focusTime: Math.round(w.focusTime),
    meetingDensity: w.schedule.meetingCount,
  };
}

export function cardQuotes(w: WorkDayAnalysis, count = 5): CardQuote[] {
  return comicReliefGenerator.generateMultipleQuotes(toMetrics(w), count).map((q) => ({
    quote: q.text,
    source: `${q.source}${q.character ? ` — ${q.character}` : ''}`,
    subtitle: 'Your day, scored.',
  }));
}
