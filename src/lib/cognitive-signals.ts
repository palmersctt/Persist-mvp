import type { WorkCategory, RiskLevel, ClassifiedEvent, WorkOrientation } from './cognitive-classification'
import { CATEGORY_WEIGHTS, WEIGHT_TO_RISK, ORIENTATION_WEIGHTS } from './cognitive-classification'

export type ZoneKey = 'displacement' | 'friction' | 'agency'

export interface WeeklyBreakdown {
  category: WorkCategory
  orientation?: WorkOrientation  // optional for backward compat with stored snapshots
  hours: number
  weight: number
  risk: RiskLevel
}

export interface WeekSnapshot {
  weekStart: string   // ISO date string (Monday)
  leverage: number
  exposure: number
  totalHours: number
  breakdown: WeeklyBreakdown[]
}

export interface CognitiveSignals {
  leverage: number      // 0–100
  exposure: number      // 0–100
  momentum: number      // -50 to +50
  momentumReady: boolean // false until 4 weeks of data
  weeksOfData: number
}

export interface ClassifiedEventSummary {
  title: string
  category: string
  orientation: string
  weight: number
  risk: string
  durationHours: number
}

export interface CognitiveAnalysis {
  signals: CognitiveSignals
  zone: ZoneKey
  breakdown: WeeklyBreakdown[]
  totalHours: number
  humanHours: number
  autoHours: number
  weekData: WeekSnapshot[]
  insight: string
  classifiedEvents?: ClassifiedEventSummary[]
}

const ALL_CATEGORIES: WorkCategory[] = [
  'Administrative', 'Information Transfer', 'Coordination',
  'Creation', 'Decision-making', 'Relationship', 'Non-work',
]

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive orientation from category for legacy data that doesn't have it stored.
 * Coordination defaults to 'ceremony' (safest guess without title context).
 */
function getOrientation(b: WeeklyBreakdown): WorkOrientation {
  if (b.orientation) return b.orientation
  const map: Record<string, WorkOrientation> = {
    'Decision-making': 'outcome',
    'Relationship': 'outcome',
    'Creation': 'outcome',
    'Coordination': 'ceremony',
    'Information Transfer': 'process',
    'Administrative': 'process',
    'Non-work': 'non-work',
  }
  return map[b.category] || 'process'
}

/** Orientations that count toward exposure (AI can significantly reduce or replace) */
const EXPOSED_ORIENTATIONS: Set<WorkOrientation> = new Set(['process', 'ceremony', 'deliberation'])

// ── Breakdown ────────────────────────────────────────────────────────────────

/**
 * Build breakdown from classified events.
 * Groups by category+orientation so that enabling vs process Coordination
 * are tracked separately for accurate scoring.
 */
export function buildBreakdown(classified: ClassifiedEvent[]): WeeklyBreakdown[] {
  const groups: Record<string, { category: WorkCategory; orientation: WorkOrientation; hours: number }> = {}

  for (const c of classified) {
    const key = `${c.category}|${c.orientation}`
    if (!groups[key]) {
      groups[key] = { category: c.category, orientation: c.orientation, hours: 0 }
    }
    groups[key].hours += c.durationHours
  }

  return Object.values(groups)
    .map(g => ({
      category: g.category,
      orientation: g.orientation,
      hours: Math.round(g.hours * 10) / 10,
      weight: CATEGORY_WEIGHTS[g.category],
      risk: g.category === 'Non-work' ? ('none' as RiskLevel) : WEIGHT_TO_RISK[CATEGORY_WEIGHTS[g.category]],
    }))
    .filter(b => b.hours > 0)
    .sort((a, b) => {
      // Sort by orientation value desc, then category weight desc
      const oa = ORIENTATION_WEIGHTS[getOrientation(a)]
      const ob = ORIENTATION_WEIGHTS[getOrientation(b)]
      if (ob !== oa) return ob - oa
      return (b.weight || 0) - (a.weight || 0)
    })
}

// ── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Compute leverage: weighted average using orientation weights.
 * Non-work hours are excluded from both numerator and denominator.
 *
 *   leverage = (outcome_hours × 100 + enabling_hours × 35) / total_work_hours
 */
export function computeLeverage(breakdown: WeeklyBreakdown[]): number {
  const work = breakdown.filter(b => getOrientation(b) !== 'non-work')
  const totalHours = work.reduce((s, b) => s + b.hours, 0)
  if (totalHours === 0) return 0
  const weightedSum = work.reduce((s, b) => s + b.hours * ORIENTATION_WEIGHTS[getOrientation(b)], 0)
  return Math.round(weightedSum / totalHours)
}

/**
 * Compute exposure: % of work hours in exposed orientations.
 * Exposed = process + ceremony + deliberation (everything AI can reduce or replace).
 * Non-work hours excluded. Enabling (crisis) is NOT exposed.
 *
 *   exposure = (process + ceremony + deliberation) / total_work_hours × 100
 */
export function computeExposure(breakdown: WeeklyBreakdown[]): number {
  const work = breakdown.filter(b => getOrientation(b) !== 'non-work')
  const totalHours = work.reduce((s, b) => s + b.hours, 0)
  if (totalHours === 0) return 0
  const exposedHours = work
    .filter(b => EXPOSED_ORIENTATIONS.has(getOrientation(b)))
    .reduce((s, b) => s + b.hours, 0)
  return Math.round((exposedHours / totalHours) * 100)
}

/**
 * Compute momentum from weekly snapshots.
 * Returns { momentum, ready, weeksOfData }
 */
export function computeMomentum(
  currentLeverage: number,
  snapshots: WeekSnapshot[]
): { momentum: number; ready: boolean; weeksOfData: number } {
  const weeksOfData = snapshots.length + 1 // +1 for current week

  if (snapshots.length === 0) {
    return { momentum: 0, ready: false, weeksOfData }
  }

  // Sort oldest first
  const sorted = [...snapshots].sort((a, b) => a.weekStart.localeCompare(b.weekStart))

  // Use oldest available snapshot for comparison
  const baseline = sorted[0].leverage
  const rawMomentum = currentLeverage - baseline

  // Scale to ±50 range, but if we have fewer than 3 prior weeks, dampen
  const scaleFactor = Math.min(sorted.length / 3, 1)
  const momentum = Math.round(Math.max(-50, Math.min(50, rawMomentum * scaleFactor)))

  return {
    momentum,
    ready: weeksOfData >= 4,
    weeksOfData,
  }
}

// ── Zone determination ───────────────────────────────────────────────────────

/**
 * Determine zone from signals.
 *
 * With the outcome/process orientation model:
 *   displacement — mostly process work, low leverage
 *   agency       — mostly outcome work, high leverage
 *   friction     — split between outcome and process
 */
export function determineZone(signals: CognitiveSignals): ZoneKey {
  const { leverage, exposure, momentum, momentumReady } = signals

  if (!momentumReady) {
    // Two-signal mode: leverage + exposure only
    if (leverage < 25 && exposure > 65) return 'displacement'
    if (leverage > 70 && exposure < 30) return 'agency'
    return 'friction'
  }

  // Full three-signal mode
  const isDisplacement = leverage < 25 && exposure > 65 && momentum <= 0
  const isFriction = leverage >= 20 && leverage <= 75 && exposure >= 25 && exposure <= 70 && momentum > -10 && momentum < 10
  const isAgency = leverage > 70 && exposure < 30 && momentum > 0

  // Clean matches
  if (isDisplacement && !isFriction && !isAgency) return 'displacement'
  if (isAgency && !isFriction && !isDisplacement) return 'agency'
  if (isFriction && !isDisplacement && !isAgency) return 'friction'

  // Overlapping — momentum is the tiebreaker
  if (isDisplacement && isFriction) return momentum < 0 ? 'displacement' : 'friction'
  if (isAgency && isFriction) return momentum > 0 ? 'agency' : 'friction'
  if (isDisplacement && isAgency) return momentum > 0 ? 'agency' : 'displacement'

  // No clean match — use closest by distance scoring
  if (momentum > 5) return 'agency'
  if (momentum < -5) return 'displacement'
  return 'friction'
}

// ── Insight generation ───────────────────────────────────────────────────────

function generateInsight(zone: ZoneKey, signals: CognitiveSignals, processHours: number, totalHours: number): string {
  const processPct = totalHours > 0 ? Math.round((processHours / totalHours) * 100) : 0

  switch (zone) {
    case 'displacement':
      return `${processPct}% of your week is process work — tasks AI can already handle at peer companies.${signals.momentumReady && signals.momentum < 0 ? ` Your Leverage has dropped ${Math.abs(signals.momentum)} points in 4 weeks.` : ''} The busyness feels productive — it isn't.`
    case 'friction':
      return `You're split — part of your week drives outcomes, part is process.${signals.momentumReady ? ` Momentum is ${signals.momentum > 0 ? 'positive but slow' : signals.momentum < 0 ? 'trending down' : 'flat'}.` : ''} You're aware something needs to change. The calendar won't let you.`
    case 'agency': {
      const outcomePct = 100 - processPct
      return `${outcomePct}% of your time is outcome work — decisions, relationships, and creation.${signals.momentumReady && signals.momentum > 0 ? ` You've gained ${signals.momentum} points of Leverage in 4 weeks.` : ''} You're not working less — you're working on things that compound.`
    }
  }
}

// ── Full analysis ────────────────────────────────────────────────────────────

/**
 * Full analysis: breakdown → compute signals → determine zone
 */
export function analyze(
  breakdown: WeeklyBreakdown[],
  priorSnapshots: WeekSnapshot[],
  timezone?: string
): CognitiveAnalysis {
  // Filter non-work for scoring
  const workBreakdown = breakdown.filter(b => getOrientation(b) !== 'non-work')
  const totalHours = workBreakdown.reduce((s, b) => s + b.hours, 0)
  const leverage = computeLeverage(breakdown)
  const exposure = computeExposure(breakdown)
  const { momentum, ready, weeksOfData } = computeMomentum(leverage, priorSnapshots)

  const signals: CognitiveSignals = {
    leverage,
    exposure,
    momentum,
    momentumReady: ready,
    weeksOfData,
  }

  const zone = determineZone(signals)

  const humanHours = workBreakdown
    .filter(b => getOrientation(b) === 'outcome')
    .reduce((s, b) => s + b.hours, 0)
  const autoHours = workBreakdown
    .filter(b => EXPOSED_ORIENTATIONS.has(getOrientation(b)))
    .reduce((s, b) => s + b.hours, 0)

  // Build week data array from snapshots + current
  const weekData: WeekSnapshot[] = [
    ...priorSnapshots.sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    {
      weekStart: getMonday(new Date(), timezone).toISOString().slice(0, 10),
      leverage,
      exposure,
      totalHours,
      breakdown: workBreakdown,
    },
  ]

  return {
    signals,
    zone,
    breakdown: workBreakdown,
    totalHours: Math.round(totalHours * 10) / 10,
    humanHours: Math.round(humanHours * 10) / 10,
    autoHours: Math.round(autoHours * 10) / 10,
    weekData,
    insight: generateInsight(zone, signals, autoHours, totalHours),
  }
}

// ── Date utilities ───────────────────────────────────────────────────────────

/**
 * Get the local date parts (year, month, day, weekday) for a Date in a given timezone.
 * Returns a plain object — avoids creating a new Date that would snap to server-local time.
 */
export function getLocalDateParts(date: Date, timezone?: string): { year: number; month: number; day: number; weekday: number } {
  if (timezone) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
    }).formatToParts(date)

    const weekdayStr = parts.find(p => p.type === 'weekday')!.value
    const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

    return {
      year: Number(parts.find(p => p.type === 'year')!.value),
      month: Number(parts.find(p => p.type === 'month')!.value) - 1,
      day: Number(parts.find(p => p.type === 'day')!.value),
      weekday: weekdayMap[weekdayStr] ?? 0,
    }
  }
  return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate(), weekday: date.getDay() }
}

/** Get Monday of the week for a given date (ISO week).
 *  When timezone is provided, computes "what day is it in that timezone"
 *  so that Sunday 11pm Pacific isn't treated as Monday UTC.
 *  Returns a Date — note the Date is in server-local time, but represents the correct calendar date.
 */
export function getMonday(date: Date, timezone?: string): Date {
  const { year, month, day, weekday } = getLocalDateParts(date, timezone)
  const diff = weekday === 0 ? -6 : 1 - weekday
  const monday = new Date(year, month, day + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * Get the local date string (YYYY-MM-DD) for a Date in a given timezone.
 */
export function getLocalDateString(date: Date, timezone?: string): string {
  if (timezone) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date)
  }
  return date.toISOString().slice(0, 10)
}
