import { describe, it, expect } from 'vitest'
import GoogleCalendarService from './googleCalendar'
import type { CalendarEvent, MeetingCategory } from './googleCalendar'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Service defaults to America/Los_Angeles (PDT = UTC-7 in March).
// laTime(9) → 9:00 AM LA time → UTC 16:00.
function laTime(hour: number, minute = 0): Date {
  return new Date(Date.UTC(2024, 2, 11, hour + 7, minute))
}

function makeEvent(
  summary: string,
  startHour: number,
  endHour: number,
  category: MeetingCategory,
  opts: { attendees?: number; startMin?: number; endMin?: number } = {},
): CalendarEvent {
  return {
    id: `${summary}-${startHour}`,
    summary,
    start: laTime(startHour, opts.startMin ?? 0),
    end: laTime(endHour, opts.endMin ?? 0),
    attendees: opts.attendees,
    isRecurring: false,
    category,
  }
}

// Shorthand for heavy, light, collaborative, focus, beneficial
const heavy = (name: string, s: number, e: number, attendees = 12) =>
  makeEvent(name, s, e, 'HEAVY_MEETINGS', { attendees })
const light = (name: string, s: number, e: number, attendees = 3) =>
  makeEvent(name, s, e, 'LIGHT_MEETINGS', { attendees })
const collab = (name: string, s: number, e: number, attendees = 6) =>
  makeEvent(name, s, e, 'COLLABORATIVE', { attendees })
const focus = (name: string, s: number, e: number) =>
  makeEvent(name, s, e, 'FOCUS_WORK')
const beneficial = (name: string, s: number, e: number) =>
  makeEvent(name, s, e, 'BENEFICIAL')

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

interface Scenario {
  name: string
  events: CalendarEvent[]
}

const scenarios: Scenario[] = [
  // 1. Burnt out IC — 8 back-to-back heavy meetings 9am-5pm, 10+ attendees
  {
    name: 'Burnt out IC',
    events: [
      heavy('quarterly review', 9, 10),
      heavy('client presentation', 10, 11),
      heavy('all-hands', 11, 12),
      heavy('training', 12, 13),
      heavy('design review', 13, 14),
      heavy('sprint planning', 14, 15),
      heavy('interview', 15, 16),
      heavy('board meeting', 16, 17),
    ],
  },

  // 2. Bored person — 1 short standup, nothing else
  {
    name: 'Bored person',
    events: [
      light('standup', 9, 9, 3, ),
    ].map(() => makeEvent('standup', 9, 9, 'LIGHT_MEETINGS', { attendees: 3, startMin: 30, endMin: 45 })),
  },

  // 3. I schedule everything — focus + meetings + beneficial, tightly packed
  {
    name: 'I schedule everything',
    events: [
      focus('focus block', 7, 9),
      light('standup', 9, 9, 3),              // 9:00-9:15
      collab('sprint planning', 9, 10, 6),     // 9:30-10:30 (overlap after standup gap)
      focus('focus block', 10, 12),             // 10:30-12 (simplified)
      beneficial('lunch walk', 12, 13),
      light('1:1', 13, 13, 2),                 // 1:00-1:30
      heavy('design review', 14, 15),
      focus('focus block', 15, 16),             // 3:00-4:30 (simplified)
      beneficial('workout', 16, 17),            // 4:30-5:30 (simplified)
      collab('team meeting', 17, 18),           // 5:30-6:00 (simplified)
    ],
  },

  // 4. I don't schedule work time — 4 scattered meetings, no focus/beneficial blocks
  {
    name: "I don't schedule work time",
    events: [
      collab('team meeting', 10, 11),
      heavy('design review', 13, 14),
      collab('sprint planning', 15, 16),
      light('1:1', 16, 17, 2),                 // 4:30-5:00 (simplified)
    ],
  },

  // 5. Manager double-booked all day — 10 heavy meetings, overlapping, 10+ attendees
  {
    name: 'Manager double-booked all day',
    events: [
      heavy('interview', 8, 9, 15),
      heavy('all-hands', 9, 10, 50),
      heavy('quarterly review', 9, 10, 20),     // overlapping
      heavy('client presentation', 10, 11, 15),
      heavy('team meeting', 11, 12, 12),
      heavy('training', 12, 13, 15),
      heavy('1:1', 13, 14, 2),                  // category overridden to heavy
      heavy('team meeting', 14, 15, 12),
      heavy('interview', 15, 16, 4),
      heavy('1:1', 16, 17, 2),
    ],
  },

  // 6. I have an admin, I'm good — light meetings, focus blocks, beneficial
  {
    name: "I have an admin, I'm good",
    events: [
      focus('focus block', 8, 10),
      light('1:1', 10, 11, 2),                  // 10:30-11:00 (simplified)
      beneficial('lunch', 12, 13),
      focus('focus block', 13, 15),              // 1:30-3:30 (simplified)
      light('check-in', 16, 16, 2),              // 4:00-4:30 (simplified)
    ],
  },

  // 7. I schedule focus time, I don't use it — focus blocks exist but meetings dominate
  {
    name: "I schedule focus time, I don't use it",
    events: [
      focus('focus block', 8, 9),                // 8:00-9:30 (simplified)
      collab('team meeting', 9, 10, 8),          // 9:30-10:30 (simplified)
      heavy('design review', 11, 12),
      focus('focus block', 12, 13),              // 12:00-1:30 (simplified)
      collab('sprint planning', 13, 14, 8),      // 1:30-2:30 (simplified)
      heavy('client presentation', 15, 16, 10),
      collab('retrospective', 16, 17, 8),
    ],
  },

  // 8. I run at lunch, don't tell anyone — meetings + beneficial mid-day
  {
    name: "I run at lunch, don't tell anyone",
    events: [
      collab('team meeting', 9, 10, 8),
      heavy('design review', 10, 11, 6),         // 10:30-11:30 (simplified)
      beneficial('run', 12, 13),
      collab('sprint planning', 14, 15, 8),
    ],
  },

  // 9. Glass half full — medium meetings, some recovery, spread out
  {
    name: 'Glass half full',
    events: [
      light('standup', 9, 9, 4),                 // 9:00-9:15 (simplified)
      collab('team meeting', 10, 11, 8),
      focus('focus block', 11, 12),              // 11:00-12:30 (simplified)
      light('1:1', 14, 14, 2),                   // 2:00-2:30 (simplified)
      beneficial('walk', 15, 15),                 // 3:00-3:30 (simplified)
    ],
  },

  // 10. Glass always empty — 6 heavy meetings, no breaks, afternoon-loaded
  {
    name: 'Glass always empty',
    events: [
      heavy('quarterly review', 9, 10, 15),      // 9:00-10:30 (simplified)
      heavy('all-hands', 10, 12, 50),             // 10:30-12:00
      heavy('client presentation', 13, 14, 15),   // 1:00-2:30 (simplified)
      heavy('training', 14, 16, 12),              // 2:30-4:00 (simplified)
      heavy('interview', 16, 17, 4),
      heavy('board meeting', 17, 18),
    ],
  },

  // 11. I hate my job — all heavy, back-to-back, boundary violations (early + late)
  {
    name: 'I hate my job',
    events: [
      heavy('training', 6, 8, 12),               // 6:30-8:00 (early boundary violation, simplified)
      heavy('all-hands', 8, 9, 50),               // 8:00-9:30 (simplified)
      heavy('quarterly review', 9, 11, 20),       // 9:30-11:00 (simplified)
      heavy('client presentation', 11, 12, 15),   // 11:00-12:30 (simplified)
      heavy('interview', 13, 14, 4),              // 1:00-2:30 (simplified)
      heavy('board meeting', 15, 17, 15),          // 3:00-5:00
      heavy('demo', 17, 18, 10),                   // 5:30-6:30 (late boundary, simplified)
    ],
  },

  // 12. I love my job — collaborative + focus + beneficial, well-spaced
  {
    name: 'I love my job',
    events: [
      beneficial('yoga', 7, 7),                   // 7:00-7:45 (simplified)
      focus('focus block', 8, 10),
      collab('brainstorm', 10, 11, 6),             // 10:30-11:30 (simplified)
      beneficial('lunch walk', 12, 13),
      collab('working session', 13, 15, 4),        // 1:30-3:00 (simplified)
      focus('focus block', 15, 17),                 // 3:30-5:00 (simplified)
    ],
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GoogleCalendarService — persona scenarios', () => {
  const service = new GoogleCalendarService()

  // Run each scenario and snapshot the scores
  for (const scenario of scenarios) {
    it(`${scenario.name}: produces scores strictly between 0 and 100`, async () => {
      const result = await service.analyzeWorkHealth(undefined, scenario.events)

      const focus = result.adaptivePerformanceIndex
      const strain = result.cognitiveResilience
      const balance = result.workRhythmRecovery

      // Log for observation
      console.log(
        `[${scenario.name}] Focus=${focus} Strain=${strain} Balance=${balance}`,
      )

      // Core assertion: scores must never be 0 or 100
      expect(focus, `${scenario.name}: focus should be > 0`).toBeGreaterThan(0)
      expect(focus, `${scenario.name}: focus should be < 100`).toBeLessThan(100)
      expect(strain, `${scenario.name}: strain should be > 0`).toBeGreaterThan(0)
      expect(strain, `${scenario.name}: strain should be < 100`).toBeLessThan(100)
      expect(balance, `${scenario.name}: balance should be > 0`).toBeGreaterThan(0)
      expect(balance, `${scenario.name}: balance should be < 100`).toBeLessThan(100)
    })
  }

  // Explicit empty-calendar test
  it('empty calendar: strain is not zero', async () => {
    const result = await service.analyzeWorkHealth(undefined, [])

    console.log(
      `[Empty calendar] Focus=${result.adaptivePerformanceIndex} Strain=${result.cognitiveResilience} Balance=${result.workRhythmRecovery}`,
    )

    expect(result.cognitiveResilience).toBeGreaterThan(0)
    expect(result.adaptivePerformanceIndex).toBeGreaterThanOrEqual(90)
    expect(result.workRhythmRecovery).toBeGreaterThanOrEqual(90)
  })

  // Only beneficial events (e.g., wellness day)
  it('only beneficial events: strain is not zero', async () => {
    const events = [
      beneficial('yoga', 7, 8),
      beneficial('lunch walk', 12, 13),
      beneficial('workout', 17, 18),
    ]
    const result = await service.analyzeWorkHealth(undefined, events)

    console.log(
      `[Only beneficial] Focus=${result.adaptivePerformanceIndex} Strain=${result.cognitiveResilience} Balance=${result.workRhythmRecovery}`,
    )

    expect(result.cognitiveResilience).toBeGreaterThan(0)
  })

  // Relative ordering sanity checks
  it('"I love my job" has better focus than "I hate my job"', async () => {
    const love = await service.analyzeWorkHealth(undefined, scenarios[11].events)
    const hate = await service.analyzeWorkHealth(undefined, scenarios[10].events)
    expect(love.adaptivePerformanceIndex).toBeGreaterThan(hate.adaptivePerformanceIndex)
  })

  it('"Burnt out IC" has higher strain than "Bored person"', async () => {
    const burnt = await service.analyzeWorkHealth(undefined, scenarios[0].events)
    const bored = await service.analyzeWorkHealth(undefined, scenarios[1].events)
    expect(burnt.cognitiveResilience).toBeGreaterThan(bored.cognitiveResilience)
  })

  it('"I have an admin" has better balance than "Manager double-booked"', async () => {
    const admin = await service.analyzeWorkHealth(undefined, scenarios[5].events)
    const manager = await service.analyzeWorkHealth(undefined, scenarios[4].events)
    expect(admin.workRhythmRecovery).toBeGreaterThan(manager.workRhythmRecovery)
  })
})
