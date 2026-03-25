import type { CalendarEvent } from '../services/googleCalendar'

export type WorkCategory =
  | 'Administrative'
  | 'Information Transfer'
  | 'Coordination'
  | 'Creation'
  | 'Decision-making'
  | 'Relationship'

export const CATEGORY_WEIGHTS: Record<WorkCategory, number> = {
  'Administrative': 0,
  'Information Transfer': 10,
  'Coordination': 25,
  'Creation': 50,
  'Decision-making': 85,
  'Relationship': 100,
}

export type RiskLevel = 'total' | 'very-high' | 'high' | 'medium' | 'low' | 'very-low'

export const WEIGHT_TO_RISK: Record<number, RiskLevel> = {
  0: 'total',
  10: 'very-high',
  25: 'high',
  50: 'medium',
  85: 'low',
  100: 'very-low',
}

export interface ClassifiedEvent {
  event: CalendarEvent
  category: WorkCategory
  weight: number
  risk: RiskLevel
  durationHours: number
}

/**
 * Classify a calendar event into one of six cognitive work categories.
 * Rules checked in order — first match wins.
 */
export function classifyEvent(event: CalendarEvent): ClassifiedEvent {
  const title = (event.summary || '').toLowerCase().trim()
  const attendees = event.attendees || 1
  const durationMs = event.end.getTime() - event.start.getTime()
  const durationMin = durationMs / (1000 * 60)
  const durationHours = durationMs / (1000 * 60 * 60)
  const isRecurring = event.isRecurring || false

  let category: WorkCategory

  // --- Compound heuristics (order matters) ---

  // Large group info sessions
  if (matches(title, ['standup', 'all-hands', 'town hall', 'all hands']) && attendees > 8) {
    category = 'Information Transfer'
  }
  // Small standups are coordination
  else if (matches(title, ['standup', 'stand-up', 'daily scrum']) && attendees <= 8) {
    category = 'Coordination'
  }
  // 1:1 meetings → relationship (the human connection is the point)
  else if (matches(title, ['1:1', 'one-on-one', '1-on-1', 'one on one'])) {
    category = 'Relationship'
  }
  // Strategy / decision meetings with small groups
  else if (matches(title, ['strategy', 'decision', 'executive', 'leadership', 'board']) && attendees < 6) {
    category = 'Decision-making'
  }
  // Review meetings with small groups → decision-making
  else if (matches(title, ['review', 'approval', 'sign-off', 'sign off']) && !matches(title, ['sprint review'])) {
    category = 'Decision-making'
  }
  // Sprint review is information transfer (team demo)
  else if (matches(title, ['sprint review'])) {
    category = 'Information Transfer'
  }
  // Creative / deep work
  else if (matches(title, ['brainstorm', 'design', 'architecture', 'writing', 'deep work', 'focus', 'maker', 'creative', 'prototype', 'ideation'])) {
    category = 'Creation'
  }
  // Coordination ceremonies
  else if (matches(title, ['sync', 'retro', 'retrospective', 'planning', 'sprint', 'scrum', 'kickoff', 'kick-off', 'status', 'team meeting'])) {
    category = 'Coordination'
  }
  // Relationship-building
  else if (matches(title, ['interview', 'mentoring', 'mentor', 'coaching', 'coach', 'coffee', 'coffee chat', 'skip level', 'skip-level'])) {
    category = 'Relationship'
  }
  // Information transfer
  else if (matches(title, ['presentation', 'demo', 'training', 'onboarding', 'workshop', 'seminar', 'webinar', 'lunch and learn', 'lunch & learn', 'brown bag'])) {
    category = 'Information Transfer'
  }
  // Admin tasks
  else if (matches(title, ['admin', 'expense', 'timesheet', 'booking', 'book trip', 'travel', 'logistics', 'setup', 'IT support'])) {
    category = 'Administrative'
  }
  // --- Fallback heuristics based on attendees + duration ---
  else if (attendees >= 8) {
    category = 'Information Transfer'
  }
  else if (attendees >= 3 && durationMin >= 45) {
    category = 'Coordination'
  }
  else if (attendees === 2) {
    category = 'Relationship'
  }
  else if (attendees <= 1 && matches(title, ['focus', 'block', 'work', 'code', 'write', 'research', 'think'])) {
    category = 'Creation'
  }
  else if (attendees <= 1) {
    category = 'Administrative'
  }
  else {
    category = 'Coordination'
  }

  const weight = CATEGORY_WEIGHTS[category]
  return {
    event,
    category,
    weight,
    risk: WEIGHT_TO_RISK[weight],
    durationHours: Math.max(durationHours, 0),
  }
}

export function classifyEvents(events: CalendarEvent[]): ClassifiedEvent[] {
  return events.map(classifyEvent)
}

function matches(title: string, keywords: string[]): boolean {
  return keywords.some(kw => title.includes(kw))
}
