import type { WorkCategory, RiskLevel, ClassifiedEvent } from './cognitive-classification'
import { CATEGORY_WEIGHTS, WEIGHT_TO_RISK } from './cognitive-classification'

export type ZoneKey = 'displacement' | 'friction' | 'agency'

export interface WeeklyBreakdown {
  category: WorkCategory
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

export interface CognitiveAnalysis {
  signals: CognitiveSignals
  zone: ZoneKey
  breakdown: WeeklyBreakdown[]
  totalHours: number
  humanHours: number
  autoHours: number
  weekData: WeekSnapshot[]
  insight: string
}

const ALL_CATEGORIES: WorkCategory[] = [
  'Administrative', 'Information Transfer', 'Coordination',
  'Creation', 'Decision-making', 'Relationship',
]

/**
 * Build breakdown from classified events — hours per category
 */
export function buildBreakdown(classified: ClassifiedEvent[]): WeeklyBreakdown[] {
  const hoursByCategory: Record<string, number> = {}
  for (const c of classified) {
    hoursByCategory[c.category] = (hoursByCategory[c.category] || 0) + c.durationHours
  }

  return ALL_CATEGORIES
    .map(cat => ({
      category: cat,
      hours: Math.round((hoursByCategory[cat] || 0) * 10) / 10,
      weight: CATEGORY_WEIGHTS[cat],
      risk: WEIGHT_TO_RISK[CATEGORY_WEIGHTS[cat]],
    }))
    .filter(b => b.hours > 0)
    .sort((a, b) => b.weight - a.weight) // high-value first
}

/**
 * Compute leverage from breakdown: weighted avg of hours × weight / total hours
 */
export function computeLeverage(breakdown: WeeklyBreakdown[]): number {
  const totalHours = breakdown.reduce((s, b) => s + b.hours, 0)
  if (totalHours === 0) return 0
  const weightedSum = breakdown.reduce((s, b) => s + b.hours * b.weight, 0)
  return Math.round(weightedSum / totalHours)
}

/**
 * Compute exposure: % of hours in Administrative + Information Transfer + Coordination
 */
export function computeExposure(breakdown: WeeklyBreakdown[]): number {
  const totalHours = breakdown.reduce((s, b) => s + b.hours, 0)
  if (totalHours === 0) return 0
  const exposedCategories: WorkCategory[] = ['Administrative', 'Information Transfer', 'Coordination']
  const exposedHours = breakdown
    .filter(b => exposedCategories.includes(b.category))
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

/**
 * Determine zone from signals.
 * When momentum is not ready, compute from leverage + exposure only.
 */
export function determineZone(signals: CognitiveSignals): ZoneKey {
  const { leverage, exposure, momentum, momentumReady } = signals

  if (!momentumReady) {
    // Two-signal mode: leverage + exposure only
    if (leverage < 30 && exposure > 60) return 'displacement'
    if (leverage > 50 && exposure < 40) return 'agency'
    return 'friction'
  }

  // Full three-signal mode
  const isDisplacement = leverage < 30 && exposure > 60 && momentum <= 0
  const isFriction = leverage >= 25 && leverage <= 55 && exposure >= 35 && exposure <= 65 && momentum > -10 && momentum < 10
  const isAgency = leverage > 50 && exposure < 40 && momentum > 0

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

/**
 * Generate a human insight string based on zone + signals
 */
function generateInsight(zone: ZoneKey, signals: CognitiveSignals, autoHours: number, totalHours: number): string {
  const autoPct = totalHours > 0 ? Math.round((autoHours / totalHours) * 100) : 0

  switch (zone) {
    case 'displacement':
      return `${autoPct}% of your week is in categories being actively automated at peer companies.${signals.momentumReady && signals.momentum < 0 ? ` Your Leverage has dropped ${Math.abs(signals.momentum)} points in 4 weeks.` : ''} The busyness feels productive — it isn't.`
    case 'friction':
      return `You're split — half your week is high-value, half is automatable.${signals.momentumReady ? ` Momentum is ${signals.momentum > 0 ? 'positive but slow' : signals.momentum < 0 ? 'trending down' : 'flat'}.` : ''} You're aware something needs to change. The calendar won't let you.`
    case 'agency': {
      const humanPct = 100 - autoPct
      return `${humanPct}% of your time is in human-essential categories.${signals.momentumReady && signals.momentum > 0 ? ` You've gained ${signals.momentum} points of Leverage in 4 weeks.` : ''} You're not working less — you're working on things that compound.`
    }
  }
}

/**
 * Full analysis: classify events → compute signals → determine zone
 */
export function analyze(
  breakdown: WeeklyBreakdown[],
  priorSnapshots: WeekSnapshot[]
): CognitiveAnalysis {
  const totalHours = breakdown.reduce((s, b) => s + b.hours, 0)
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

  const humanHours = breakdown
    .filter(b => ['low', 'very-low'].includes(b.risk))
    .reduce((s, b) => s + b.hours, 0)
  const autoHours = breakdown
    .filter(b => ['total', 'very-high', 'high'].includes(b.risk))
    .reduce((s, b) => s + b.hours, 0)

  // Build week data array from snapshots + current
  const weekData: WeekSnapshot[] = [
    ...priorSnapshots.sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    {
      weekStart: getMonday(new Date()).toISOString().slice(0, 10),
      leverage,
      exposure,
      totalHours,
      breakdown,
    },
  ]

  return {
    signals,
    zone,
    breakdown,
    totalHours: Math.round(totalHours * 10) / 10,
    humanHours: Math.round(humanHours * 10) / 10,
    autoHours: Math.round(autoHours * 10) / 10,
    weekData,
    insight: generateInsight(zone, signals, autoHours, totalHours),
  }
}

/** Get Monday of the week for a given date (ISO week) */
export function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust for Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
