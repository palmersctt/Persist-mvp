import type { CalendarEvent } from '../services/googleCalendar'

export type WorkCategory =
  | 'Administrative'
  | 'Information Transfer'
  | 'Coordination'
  | 'Creation'
  | 'Decision-making'
  | 'Relationship'
  | 'Non-work'

export type WorkOrientation = 'outcome' | 'enabling' | 'process' | 'non-work'

/**
 * Orientation weights for leverage scoring.
 *   outcome  = 100  (decisions, relationships, creation — compounds over time)
 *   enabling =  35  (crisis coordination that unblocks outcomes — necessary but reactive)
 *   process  =   0  (task execution AI can replace — status updates, admin, ceremonies)
 *   non-work =   0  (excluded from scoring entirely)
 */
export const ORIENTATION_WEIGHTS: Record<WorkOrientation, number> = {
  'outcome': 100,
  'enabling': 35,
  'process': 0,
  'non-work': 0,
}

/** Legacy category weights — kept for breakdown display / backward compat */
export const CATEGORY_WEIGHTS: Record<WorkCategory, number> = {
  'Administrative': 0,
  'Information Transfer': 10,
  'Coordination': 25,
  'Creation': 50,
  'Decision-making': 85,
  'Relationship': 100,
  'Non-work': 0,
}

export type RiskLevel = 'total' | 'very-high' | 'high' | 'medium' | 'low' | 'very-low' | 'none'

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
  orientation: WorkOrientation
  weight: number
  risk: RiskLevel
  durationHours: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function matches(title: string, keywords: string[]): boolean {
  return keywords.some(kw => title.includes(kw))
}

const NON_WORK_KEYWORDS = [
  'gym', 'dentist', 'doctor', 'physician', 'therapist',
  'pick up kids', 'school pickup', 'school drop',
  'personal', 'errand', 'appointment',
  'ooo', 'out of office', 'vacation', 'pto', 'holiday',
  'commute', 'lunch break',
]

const CRISIS_KEYWORDS = ['incident', 'war room', 'outage', 'triage']

// ── Classification ───────────────────────────────────────────────────────────

/**
 * Classify a calendar event into a work category and orientation.
 *
 * Orientation drives scoring:
 *   outcome  → decisions, relationships, creation (compounds)
 *   enabling → crisis coordination (necessary but reactive)
 *   process  → ceremonies, status updates, admin (AI-replaceable)
 *   non-work → personal events (excluded from scoring)
 *
 * Rules checked in order — first match wins.
 */
export function classifyEvent(event: CalendarEvent): ClassifiedEvent {
  const title = (event.summary || '').toLowerCase().trim()
  const attendees = event.attendees || 1
  const durationMs = event.end.getTime() - event.start.getTime()
  const durationMin = durationMs / (1000 * 60)
  const durationHours = durationMs / (1000 * 60 * 60)

  // --- Non-work: personal events, OOO, blocked personal time ---
  if (attendees <= 1 && matches(title, NON_WORK_KEYWORDS)) {
    return result(event, 'Non-work', 'non-work', durationHours)
  }

  let category: WorkCategory

  // --- 1:1 / skip-level → Relationship ---
  if (matches(title, ['1:1', 'one-on-one', '1-on-1', 'one on one', 'skip-level', 'skip level'])) {
    category = 'Relationship'
  }
  // --- Customer / client / investor (small group) → Relationship ---
  else if (matches(title, ['customer', 'client', 'investor']) && attendees >= 2 && attendees <= 5) {
    category = 'Relationship'
  }
  // --- Strategy / decision / board (small group) → Decision-making ---
  else if (
    matches(title, [
      'strategy', 'strategic', 'decision', 'executive', 'leadership',
      'board ', 'pricing', 'budget', 'allocation', 'vendor selection',
      'prioritization', 'prioritize',
    ]) && attendees < 6
  ) {
    category = 'Decision-making'
  }
  // --- Hiring decisions ---
  else if (matches(title, ['hiring decision', 'hiring review', 'offer decision'])) {
    category = 'Decision-making'
  }
  // --- Post-mortem → Decision-making (deciding what to change) ---
  else if (matches(title, ['post-mortem', 'postmortem', 'post mortem'])) {
    category = 'Decision-making'
  }
  // --- Named review types (small group) → Decision-making ---
  else if (matches(title, ['architecture review', 'design review', 'proposal review']) && attendees <= 6) {
    category = 'Decision-making'
  }
  // --- Generic review (small group, excluding non-decision reviews) ---
  else if (
    matches(title, ['review', 'approval', 'sign-off', 'sign off']) &&
    !matches(title, ['sprint review', 'pipeline review', 'prototype', 'status review']) &&
    attendees <= 6
  ) {
    category = 'Decision-making'
  }
  // --- Sprint review (team demo) → Information Transfer ---
  else if (matches(title, ['sprint review'])) {
    category = 'Information Transfer'
  }
  // --- Creative / deep work ---
  else if (matches(title, [
    'brainstorm', 'ideation', 'deep work', 'focus time', 'maker time',
    'creative', 'prototype', 'write', 'writing', 'rfc', 'memo',
  ])) {
    category = 'Creation'
  }
  // --- Design work (not design review) ---
  else if (matches(title, ['design']) && !matches(title, ['design review']) && attendees <= 6) {
    category = 'Creation'
  }
  // --- Workshop → Creation (interactive, outcome-oriented) ---
  else if (matches(title, ['workshop'])) {
    category = 'Creation'
  }
  // --- Coaching / mentoring / interviews / coffee ---
  else if (matches(title, [
    'interview', 'mentoring', 'mentor', 'coaching', 'coach',
    'coffee', 'coffee chat', 'lunch with',
  ])) {
    category = 'Relationship'
  }
  // --- Large standup / all-hands / town hall → Information Transfer ---
  else if (matches(title, ['standup', 'stand-up', 'all-hands', 'all hands', 'town hall']) && attendees >= 8) {
    category = 'Information Transfer'
  }
  // --- Small standup → Coordination ---
  else if (matches(title, ['standup', 'stand-up', 'daily scrum']) && attendees < 8) {
    category = 'Coordination'
  }
  // --- Administrative (checked before info-transfer to catch compliance, HR, etc.) ---
  else if (matches(title, [
    'compliance', 'benefits', 'enrollment',
    'expense', 'timesheet', 'approve timesheet',
    'book travel', 'travel', 'logistics',
    'setup', 'it support', 'admin',
    'crm', 'hr ',
  ])) {
    category = 'Administrative'
  }
  // --- Status / readout / update (multi-person) → Information Transfer ---
  else if (matches(title, ['status', 'readout', 'recap', 'report', 'update']) && attendees >= 3) {
    category = 'Information Transfer'
  }
  // --- Incident / crisis response → Coordination (enabling orientation) ---
  else if (matches(title, ['incident', 'war room', 'outage', 'escalation'])) {
    category = 'Coordination'
  }
  // --- Coordination ceremonies ---
  else if (matches(title, [
    'sync', 'retro', 'retrospective', 'planning', 'sprint', 'scrum',
    'kickoff', 'kick-off', 'triage', 'intake', 'handoff', 'hand-off',
    'alignment',
  ])) {
    category = 'Coordination'
  }
  // --- Large team meetings → Information Transfer ---
  else if (matches(title, ['team meeting', 'team sync', 'weekly']) && attendees >= 6) {
    category = 'Information Transfer'
  }
  // --- Presentations / demos / training / offsite ---
  else if (matches(title, [
    'presentation', 'demo', 'training', 'onboarding',
    'seminar', 'webinar', 'lunch and learn', 'lunch & learn',
    'brown bag', 'offsite',
  ])) {
    category = 'Information Transfer'
  }
  // --- Fallback heuristics (attendees + duration) ---
  else if (attendees >= 8) {
    category = 'Information Transfer'
  }
  else if (attendees >= 3 && durationMin >= 45) {
    category = 'Coordination'
  }
  else if (attendees === 2) {
    category = 'Relationship'
  }
  else if (attendees <= 1 && matches(title, ['focus', 'block', 'code', 'write', 'research', 'think', 'iterate', 'build'])) {
    category = 'Creation'
  }
  else if (attendees <= 1) {
    category = 'Administrative'
  }
  else {
    category = 'Coordination'
  }

  const orientation = orientationFor(category, title)
  return result(event, category, orientation, durationHours)
}

/**
 * Map category + title context → orientation.
 *
 * Outcome:  Decision-making, Relationship, Creation — always.
 * Enabling: Coordination with crisis keywords (incident, war room, outage, triage).
 * Process:  Everything else (Coordination ceremonies, Info Transfer, Administrative).
 */
function orientationFor(category: WorkCategory, title: string): WorkOrientation {
  switch (category) {
    case 'Decision-making':
    case 'Relationship':
    case 'Creation':
      return 'outcome'
    case 'Coordination':
      return matches(title, CRISIS_KEYWORDS) ? 'enabling' : 'process'
    case 'Information Transfer':
    case 'Administrative':
      return 'process'
    case 'Non-work':
      return 'non-work'
    default:
      return 'process'
  }
}

function result(
  event: CalendarEvent,
  category: WorkCategory,
  orientation: WorkOrientation,
  durationHours: number,
): ClassifiedEvent {
  const weight = CATEGORY_WEIGHTS[category]
  return {
    event,
    category,
    orientation,
    weight,
    risk: category === 'Non-work' ? 'none' : (WEIGHT_TO_RISK[weight] || 'none') as RiskLevel,
    durationHours: Math.max(durationHours, 0),
  }
}

export function classifyEvents(events: CalendarEvent[]): ClassifiedEvent[] {
  return events.map(classifyEvent)
}
