/**
 * Pulse Classifier Test Suite — 20 scenarios
 *
 * New model: outcome / enabling / process / non-work orientation
 *   outcome  (100) = decisions, relationships, creation
 *   enabling  (35) = crisis coordination (incident, war room, triage)
 *   process    (0) = ceremonies, status updates, admin
 *   non-work       = personal events, excluded from scoring
 *
 * Leverage = weighted avg of orientation scores over work hours
 * Exposure = % of work hours in process orientation
 */

import { classifyEvent, classifyEvents, type WorkCategory, type WorkOrientation } from './cognitive-classification'
import { buildBreakdown, computeLeverage, computeExposure, determineZone, type CognitiveSignals } from './cognitive-signals'
import type { CalendarEvent } from '../services/googleCalendar'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(
  summary: string,
  durationMin: number,
  attendees: number,
  isRecurring: boolean,
): CalendarEvent {
  const start = new Date('2026-03-25T09:00:00Z')
  const end = new Date(start.getTime() + durationMin * 60 * 1000)
  return { id: crypto.randomUUID(), summary, start, end, attendees, isRecurring }
}

const CAT_MAP: Record<string, WorkCategory> = {
  'information-transfer': 'Information Transfer',
  'coordination': 'Coordination',
  'relationship': 'Relationship',
  'decision-making': 'Decision-making',
  'creation': 'Creation',
  'administrative': 'Administrative',
  'non-work': 'Non-work',
}

interface TestEvent {
  summary: string
  durationMin: number
  attendees: number
  isRecurring: boolean
  expectedCategory: string
}

interface Scenario {
  name: string
  expectedZone: string
  expectedLeverage: number
  expectedExposure: number
  events: TestEvent[]
}

// ── Scenarios ────────────────────────────────────────────────────────────────

const scenarios: Scenario[] = [
  {
    name: '1. The Status Update Machine',
    expectedZone: 'displacement',
    expectedLeverage: 0,
    expectedExposure: 100,
    events: [
      { summary: 'Morning Standup', durationMin: 15, attendees: 12, isRecurring: true, expectedCategory: 'information-transfer' },
      { summary: 'Project Status Update', durationMin: 60, attendees: 8, isRecurring: true, expectedCategory: 'information-transfer' },
      { summary: 'Cross-team Sync', durationMin: 30, attendees: 6, isRecurring: true, expectedCategory: 'coordination' },
      { summary: 'Sprint Review', durationMin: 60, attendees: 10, isRecurring: true, expectedCategory: 'information-transfer' },
      { summary: 'Weekly Team Meeting', durationMin: 60, attendees: 9, isRecurring: true, expectedCategory: 'information-transfer' },
      { summary: 'End of Day Recap', durationMin: 30, attendees: 7, isRecurring: true, expectedCategory: 'information-transfer' },
    ],
  },
  {
    name: '2. The Admin Day',
    expectedZone: 'displacement',
    expectedLeverage: 0,
    expectedExposure: 100,
    events: [
      { summary: 'Complete Expense Reports', durationMin: 60, attendees: 1, isRecurring: false, expectedCategory: 'administrative' },
      { summary: 'IT Setup New Laptop', durationMin: 45, attendees: 2, isRecurring: false, expectedCategory: 'administrative' },
      { summary: 'Compliance Training', durationMin: 90, attendees: 30, isRecurring: false, expectedCategory: 'administrative' },
      { summary: 'Benefits Enrollment', durationMin: 30, attendees: 1, isRecurring: false, expectedCategory: 'administrative' },
      { summary: 'Book Travel', durationMin: 30, attendees: 1, isRecurring: false, expectedCategory: 'administrative' },
    ],
  },
  {
    name: '3. The Reporting Analyst',
    expectedZone: 'displacement',
    expectedLeverage: 11,
    expectedExposure: 89,
    events: [
      { summary: 'Pull Weekly Metrics', durationMin: 60, attendees: 1, isRecurring: true, expectedCategory: 'administrative' },
      { summary: 'Update Dashboard', durationMin: 90, attendees: 1, isRecurring: true, expectedCategory: 'administrative' },
      { summary: 'Data Review with Manager', durationMin: 30, attendees: 2, isRecurring: true, expectedCategory: 'decision-making' },
      { summary: 'Send Weekly Report', durationMin: 30, attendees: 1, isRecurring: true, expectedCategory: 'administrative' },
      { summary: 'Stakeholder Readout', durationMin: 60, attendees: 15, isRecurring: true, expectedCategory: 'information-transfer' },
    ],
  },
  {
    name: '4. The Meeting Marathon',
    expectedZone: 'displacement',
    expectedLeverage: 17,
    expectedExposure: 100,
    events: [
      { summary: 'Kickoff Sync', durationMin: 30, attendees: 5, isRecurring: false, expectedCategory: 'coordination' },
      { summary: 'Vendor Alignment', durationMin: 45, attendees: 4, isRecurring: false, expectedCategory: 'coordination' },
      { summary: 'Handoff Meeting', durationMin: 30, attendees: 3, isRecurring: false, expectedCategory: 'coordination' },
      { summary: 'Cross-functional Intake', durationMin: 45, attendees: 6, isRecurring: false, expectedCategory: 'coordination' },
      { summary: 'Triage New Requests', durationMin: 30, attendees: 4, isRecurring: false, expectedCategory: 'coordination' },
      { summary: 'Standup', durationMin: 15, attendees: 8, isRecurring: true, expectedCategory: 'information-transfer' },
      { summary: 'Team Sync', durationMin: 30, attendees: 6, isRecurring: true, expectedCategory: 'coordination' },
      { summary: 'Retrospective', durationMin: 60, attendees: 7, isRecurring: true, expectedCategory: 'coordination' },
    ],
  },
  {
    name: '5. The Split Day',
    expectedZone: 'friction',
    expectedLeverage: 50,
    expectedExposure: 50,
    events: [
      { summary: '1:1 with Direct Report', durationMin: 30, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
      { summary: 'Architecture Review', durationMin: 60, attendees: 4, isRecurring: false, expectedCategory: 'decision-making' },
      { summary: 'Roadmap Prioritization', durationMin: 45, attendees: 3, isRecurring: false, expectedCategory: 'decision-making' },
      { summary: 'All-Hands', durationMin: 60, attendees: 50, isRecurring: true, expectedCategory: 'information-transfer' },
      { summary: 'Status Update to Leadership', durationMin: 30, attendees: 8, isRecurring: true, expectedCategory: 'information-transfer' },
      { summary: 'Weekly Team Sync', durationMin: 45, attendees: 7, isRecurring: true, expectedCategory: 'coordination' },
    ],
  },
  {
    name: '6. The New Manager',
    expectedZone: 'friction',
    expectedLeverage: 40,
    expectedExposure: 60,
    events: [
      { summary: '1:1 with Alex', durationMin: 30, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
      { summary: '1:1 with Jordan', durationMin: 30, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
      { summary: '1:1 with Sam', durationMin: 30, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
      { summary: 'HR Onboarding for Managers', durationMin: 60, attendees: 15, isRecurring: false, expectedCategory: 'administrative' },
      { summary: 'Approve Timesheets', durationMin: 30, attendees: 1, isRecurring: true, expectedCategory: 'administrative' },
      { summary: 'Learn Workday System', durationMin: 45, attendees: 1, isRecurring: false, expectedCategory: 'administrative' },
    ],
  },
  {
    name: '7. The Design Sprint Participant',
    expectedZone: 'friction',
    expectedLeverage: 70,
    expectedExposure: 33,
    events: [
      { summary: 'Design Sprint - Ideation', durationMin: 120, attendees: 6, isRecurring: false, expectedCategory: 'creation' },
      { summary: 'Brainstorm: Q3 Campaign', durationMin: 60, attendees: 5, isRecurring: false, expectedCategory: 'creation' },
      { summary: 'Morning Standup', durationMin: 15, attendees: 10, isRecurring: true, expectedCategory: 'information-transfer' },
      { summary: 'Weekly Planning', durationMin: 45, attendees: 8, isRecurring: true, expectedCategory: 'coordination' },
      { summary: 'Project Status', durationMin: 30, attendees: 6, isRecurring: true, expectedCategory: 'information-transfer' },
    ],
  },
  {
    name: '8. The Firefighter',
    expectedZone: 'friction',
    expectedLeverage: 52,
    expectedExposure: 13,
    events: [
      { summary: 'Incident War Room', durationMin: 120, attendees: 8, isRecurring: false, expectedCategory: 'coordination' },
      { summary: 'Customer Escalation Call', durationMin: 45, attendees: 4, isRecurring: false, expectedCategory: 'relationship' },
      { summary: 'Post-mortem Planning', durationMin: 30, attendees: 3, isRecurring: false, expectedCategory: 'decision-making' },
      { summary: 'Exec Update on Outage', durationMin: 15, attendees: 5, isRecurring: false, expectedCategory: 'information-transfer' },
      { summary: 'Quick Sync with On-call', durationMin: 15, attendees: 2, isRecurring: false, expectedCategory: 'coordination' },
    ],
  },
  {
    name: '9. The IC with One Bad Meeting',
    expectedZone: 'friction',
    expectedLeverage: 62,
    expectedExposure: 38,
    events: [
      { summary: 'Deep Work: Write RFC', durationMin: 120, attendees: 1, isRecurring: false, expectedCategory: 'creation' },
      { summary: 'Prototype Review', durationMin: 45, attendees: 3, isRecurring: false, expectedCategory: 'creation' },
      { summary: 'Quarterly All-Hands', durationMin: 120, attendees: 200, isRecurring: true, expectedCategory: 'information-transfer' },
      { summary: 'Coffee Chat with Mentor', durationMin: 30, attendees: 2, isRecurring: false, expectedCategory: 'relationship' },
    ],
  },
  {
    name: '10. The Sales Engineer',
    expectedZone: 'friction',
    expectedLeverage: 25,
    expectedExposure: 75,
    events: [
      { summary: 'Client Demo', durationMin: 60, attendees: 6, isRecurring: false, expectedCategory: 'information-transfer' },
      { summary: 'Proposal Review', durationMin: 45, attendees: 3, isRecurring: false, expectedCategory: 'decision-making' },
      { summary: 'Pre-sales Sync', durationMin: 30, attendees: 4, isRecurring: true, expectedCategory: 'coordination' },
      { summary: 'Client Relationship Dinner Planning', durationMin: 15, attendees: 2, isRecurring: false, expectedCategory: 'relationship' },
      { summary: 'Update CRM Notes', durationMin: 30, attendees: 1, isRecurring: false, expectedCategory: 'administrative' },
      { summary: 'Pipeline Review', durationMin: 60, attendees: 8, isRecurring: true, expectedCategory: 'information-transfer' },
    ],
  },
  {
    name: '11. The Strategic Leader',
    expectedZone: 'agency',
    expectedLeverage: 100,
    expectedExposure: 0,
    events: [
      { summary: 'Board Prep', durationMin: 60, attendees: 3, isRecurring: false, expectedCategory: 'decision-making' },
      { summary: '1:1 with CEO', durationMin: 30, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
      { summary: 'Budget Reallocation Decision', durationMin: 45, attendees: 4, isRecurring: false, expectedCategory: 'decision-making' },
      { summary: '1:1 with Director of Eng', durationMin: 30, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
      { summary: 'Strategic Planning Offsite', durationMin: 180, attendees: 5, isRecurring: false, expectedCategory: 'decision-making' },
    ],
  },
  {
    name: '12. The Maker Day',
    expectedZone: 'agency',
    expectedLeverage: 100,
    expectedExposure: 0,
    events: [
      { summary: '1:1 with PM', durationMin: 30, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
      { summary: 'Design: Homepage Redesign', durationMin: 180, attendees: 1, isRecurring: false, expectedCategory: 'creation' },
      { summary: 'Prototype Iteration', durationMin: 120, attendees: 1, isRecurring: false, expectedCategory: 'creation' },
    ],
  },
  {
    name: '13. The People Leader',
    expectedZone: 'agency',
    expectedLeverage: 100,
    expectedExposure: 0,
    events: [
      { summary: '1:1 with Sarah', durationMin: 45, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
      { summary: '1:1 with James', durationMin: 45, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
      { summary: '1:1 with Priya', durationMin: 45, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
      { summary: 'Coaching: Maria Career Dev', durationMin: 30, attendees: 2, isRecurring: false, expectedCategory: 'relationship' },
      { summary: 'Hiring Decision: Senior Role', durationMin: 45, attendees: 3, isRecurring: false, expectedCategory: 'decision-making' },
      { summary: 'Skip-level with VP', durationMin: 30, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
    ],
  },
  {
    name: '14. The Founder Day',
    expectedZone: 'agency',
    expectedLeverage: 100,
    expectedExposure: 0,
    events: [
      { summary: 'Investor Update Call', durationMin: 30, attendees: 3, isRecurring: false, expectedCategory: 'relationship' },
      { summary: 'Product Strategy Session', durationMin: 90, attendees: 4, isRecurring: false, expectedCategory: 'decision-making' },
      { summary: 'Lunch with Potential Hire', durationMin: 60, attendees: 2, isRecurring: false, expectedCategory: 'relationship' },
      { summary: 'Pricing Decision', durationMin: 45, attendees: 2, isRecurring: false, expectedCategory: 'decision-making' },
      { summary: 'Write Investor Memo', durationMin: 60, attendees: 1, isRecurring: false, expectedCategory: 'creation' },
    ],
  },
  {
    name: '15. The Empty Calendar',
    expectedZone: 'friction',
    expectedLeverage: 0,
    expectedExposure: 0,
    events: [],
  },
  {
    name: '16. The One Meeting Day',
    expectedZone: 'agency',
    expectedLeverage: 100,
    expectedExposure: 0,
    events: [
      { summary: '1:1 with Manager', durationMin: 30, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
    ],
  },
  {
    name: '17. The Ambiguous Titles',
    expectedZone: 'friction',
    expectedLeverage: 61,
    expectedExposure: 39,
    events: [
      { summary: 'Quick chat', durationMin: 15, attendees: 2, isRecurring: false, expectedCategory: 'relationship' },
      { summary: 'Meeting', durationMin: 60, attendees: 5, isRecurring: true, expectedCategory: 'coordination' },
      { summary: 'Call', durationMin: 30, attendees: 2, isRecurring: false, expectedCategory: 'relationship' },
      { summary: 'Blocked', durationMin: 120, attendees: 1, isRecurring: false, expectedCategory: 'creation' },
      { summary: 'TBD', durationMin: 45, attendees: 4, isRecurring: false, expectedCategory: 'coordination' },
    ],
  },
  {
    name: '18. The Hybrid Worker',
    expectedZone: 'friction',
    expectedLeverage: 64,
    expectedExposure: 44,
    events: [
      { summary: 'Gym', durationMin: 60, attendees: 1, isRecurring: true, expectedCategory: 'non-work' },
      { summary: 'Sprint Planning', durationMin: 60, attendees: 8, isRecurring: true, expectedCategory: 'coordination' },
      { summary: 'Dentist Appointment', durationMin: 60, attendees: 1, isRecurring: false, expectedCategory: 'non-work' },
      { summary: '1:1 with Tech Lead', durationMin: 30, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
      { summary: 'Pick up kids', durationMin: 30, attendees: 1, isRecurring: true, expectedCategory: 'non-work' },
      { summary: 'Product Decision Review', durationMin: 45, attendees: 4, isRecurring: false, expectedCategory: 'decision-making' },
    ],
  },
  {
    name: '19. The All-Day Events',
    expectedZone: 'displacement',
    expectedLeverage: 0,
    expectedExposure: 100,
    events: [
      { summary: 'Company Offsite', durationMin: 480, attendees: 100, isRecurring: false, expectedCategory: 'information-transfer' },
      { summary: 'OOO - Vacation', durationMin: 480, attendees: 1, isRecurring: false, expectedCategory: 'non-work' },
    ],
  },
  {
    name: '20. The AI-Forward Day',
    expectedZone: 'agency',
    expectedLeverage: 100,
    expectedExposure: 0,
    events: [
      { summary: 'Review AI-generated Report', durationMin: 30, attendees: 2, isRecurring: false, expectedCategory: 'decision-making' },
      { summary: 'Strategy: AI Tooling Rollout', durationMin: 60, attendees: 4, isRecurring: false, expectedCategory: 'decision-making' },
      { summary: '1:1 with Direct Report', durationMin: 30, attendees: 2, isRecurring: true, expectedCategory: 'relationship' },
      { summary: 'Workshop: Redesign Onboarding Flow', durationMin: 90, attendees: 5, isRecurring: false, expectedCategory: 'creation' },
      { summary: 'Decision: Vendor Selection', durationMin: 45, attendees: 3, isRecurring: false, expectedCategory: 'decision-making' },
    ],
  },
]

// ── Runner ───────────────────────────────────────────────────────────────────

interface MisclassifiedEvent {
  summary: string
  expected: string
  actual: string
  expectedOrientation: string
  actualOrientation: string
}

interface ScenarioResult {
  name: string
  expectedZone: string
  actualZone: string
  zonePass: boolean
  expectedLeverage: number
  actualLeverage: number
  leveragePass: boolean
  expectedExposure: number
  actualExposure: number
  exposurePass: boolean
  misclassified: MisclassifiedEvent[]
  orientationMatch: boolean  // even if category differs, is orientation correct?
}

const TOLERANCE = 5

function expectedOrientation(cat: string): string {
  const outcomeCategories = ['decision-making', 'relationship', 'creation']
  const nonWorkCategories = ['non-work']
  if (outcomeCategories.includes(cat)) return 'outcome'
  if (nonWorkCategories.includes(cat)) return 'non-work'
  // coordination could be enabling/deliberation/ceremony, but default to ceremony for expectations
  return 'ceremony'
}

function runScenario(scenario: Scenario): ScenarioResult {
  const calEvents = scenario.events.map(e =>
    makeEvent(e.summary, e.durationMin, e.attendees, e.isRecurring)
  )

  const classified = classifyEvents(calEvents)
  const breakdown = buildBreakdown(classified)
  const leverage = computeLeverage(breakdown)
  const exposure = computeExposure(breakdown)

  const signals: CognitiveSignals = {
    leverage,
    exposure,
    momentum: 0,
    momentumReady: false,
    weeksOfData: 1,
  }
  const zone = determineZone(signals)

  const misclassified: MisclassifiedEvent[] = []
  let allOrientationsMatch = true
  for (let i = 0; i < scenario.events.length; i++) {
    const expectedCat = CAT_MAP[scenario.events[i].expectedCategory]
    const actualCat = classified[i].category
    const expOr = expectedOrientation(scenario.events[i].expectedCategory)
    const actOr = classified[i].orientation
    if (expectedCat !== actualCat) {
      misclassified.push({
        summary: scenario.events[i].summary,
        expected: expectedCat,
        actual: actualCat,
        expectedOrientation: expOr,
        actualOrientation: actOr,
      })
    }
    if (expOr !== actOr) allOrientationsMatch = false
  }

  return {
    name: scenario.name,
    expectedZone: scenario.expectedZone,
    actualZone: zone,
    zonePass: zone === scenario.expectedZone,
    expectedLeverage: scenario.expectedLeverage,
    actualLeverage: leverage,
    leveragePass: Math.abs(leverage - scenario.expectedLeverage) <= TOLERANCE,
    expectedExposure: scenario.expectedExposure,
    actualExposure: exposure,
    exposurePass: Math.abs(exposure - scenario.expectedExposure) <= TOLERANCE,
    misclassified,
    orientationMatch: allOrientationsMatch,
  }
}

// ── Output ───────────────────────────────────────────────────────────────────

const results = scenarios.map(runScenario)

const P = '✓'
const F = '✗'

console.log('\n' + '='.repeat(140))
console.log('PULSE CLASSIFIER TEST RESULTS — Outcome/Process Orientation Model')
console.log('='.repeat(140))
console.log('')

const hdr = [
  'Scenario'.padEnd(38),
  'Zone Exp→Act'.padEnd(26),
  'Leverage Exp→Act'.padEnd(22),
  'Exposure Exp→Act'.padEnd(22),
  'Cat'.padEnd(6),
  'Orient',
].join(' | ')
console.log(hdr)
console.log('-'.repeat(140))

let totalPass = 0
let totalFail = 0

for (const r of results) {
  const zoneStr = `${r.expectedZone}→${r.actualZone} ${r.zonePass ? P : F}`
  const levStr = `${String(r.expectedLeverage).padStart(3)}→${String(r.actualLeverage).padStart(3)} ${r.leveragePass ? P : F}`
  const expStr = `${String(r.expectedExposure).padStart(3)}→${String(r.actualExposure).padStart(3)} ${r.exposurePass ? P : F}`
  const catStr = r.misclassified.length === 0 ? `${P} 0  ` : `${F} ${r.misclassified.length}  `
  const oriStr = r.orientationMatch ? P : F

  const allPass = r.zonePass && r.leveragePass && r.exposurePass && r.misclassified.length === 0
  if (allPass) totalPass++; else totalFail++

  const line = [
    r.name.padEnd(38),
    zoneStr.padEnd(26),
    levStr.padEnd(22),
    expStr.padEnd(22),
    catStr.padEnd(6),
    oriStr,
  ].join(' | ')
  console.log(line)

  if (r.misclassified.length > 0) {
    for (const m of r.misclassified) {
      const oriNote = m.expectedOrientation === m.actualOrientation ? '(same orientation)' : `(${m.expectedOrientation}→${m.actualOrientation})`
      console.log(`    ↳ "${m.summary}": expected ${m.expected}, got ${m.actual} ${oriNote}`)
    }
  }
}

console.log('-'.repeat(140))
console.log(`\nSummary: ${totalPass} fully passed, ${totalFail} have failures`)

// Orientation-only summary
const orientationOnlyFails = results.filter(r => !r.orientationMatch)
const catOnlyFails = results.filter(r => r.misclassified.length > 0)
const catMismatchButOrientationOk = results.filter(r =>
  r.misclassified.length > 0 && r.misclassified.every(m => m.expectedOrientation === m.actualOrientation)
)
console.log(`Category mismatches: ${catOnlyFails.length} scenarios, but ${catMismatchButOrientationOk.length} have correct orientation anyway (scoring unaffected)`)
console.log(`Orientation mismatches: ${orientationOnlyFails.length} scenarios (these affect scoring)`)

// Detailed failures
const failedResults = results.filter(r => !r.zonePass || !r.leveragePass || !r.exposurePass || r.misclassified.length > 0)
if (failedResults.length > 0) {
  console.log('\n' + '='.repeat(140))
  console.log('DETAILED FAILURE ANALYSIS')
  console.log('='.repeat(140))
  for (const r of failedResults) {
    console.log(`\n▸ ${r.name}`)
    if (!r.zonePass) console.log(`  Zone:     expected "${r.expectedZone}", got "${r.actualZone}"`)
    if (!r.leveragePass) console.log(`  Leverage: expected ~${r.expectedLeverage}, got ${r.actualLeverage} (off by ${Math.abs(r.actualLeverage - r.expectedLeverage)})`)
    if (!r.exposurePass) console.log(`  Exposure: expected ~${r.expectedExposure}, got ${r.actualExposure} (off by ${Math.abs(r.actualExposure - r.expectedExposure)})`)
    if (r.misclassified.length > 0) {
      console.log(`  Misclassified events (${r.misclassified.length}):`)
      for (const m of r.misclassified) {
        const oriNote = m.expectedOrientation === m.actualOrientation ? ' [orientation OK]' : ` [orientation WRONG: ${m.expectedOrientation}→${m.actualOrientation}]`
        console.log(`    • "${m.summary}": expected ${m.expected}, got ${m.actual}${oriNote}`)
      }
    }
  }
}

console.log('')
