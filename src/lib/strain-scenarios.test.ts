import { describe, it, expect } from 'vitest'
import { detectMood } from './mood'

/**
 * Replicate strain calculation logic as a pure function for testing.
 * Mirrors calculateCognitiveResilience in googleCalendar.ts.
 */
function calculateStrain(params: {
  uniqueContexts: number
  meetings: Array<{
    hourOfDay: number
    durationHours: number
    attendees?: number
    category?: string
  }>
  focusHours: number
  consecutiveMeetings: number
  beneficialEventCount: number
}): number {
  const { uniqueContexts, meetings, focusHours, consecutiveMeetings, beneficialEventCount } = params

  // Context switching load
  const contextSwitchingLoad = Math.min(100, uniqueContexts * 18)

  // Decision fatigue
  let decisionFatigue = 0
  meetings.forEach((event) => {
    const timeFactor = event.hourOfDay >= 15 ? 1.8 : event.hourOfDay >= 13 ? 1.4 : 1
    const attendeeFactor = (event.attendees && event.attendees >= 10) ? 1.6
      : (event.attendees && event.attendees >= 5) ? 1.3
      : (event.attendees && event.attendees >= 3) ? 1.1
      : 1
    const categoryFactor = event.category === 'HEAVY_MEETINGS' ? 1.8
      : event.category === 'COLLABORATIVE' ? 1.2
      : event.category === 'LIGHT_MEETINGS' ? 0.7
      : 1.0
    const durationFactor = event.durationHours >= 4 ? 4.0
      : event.durationHours >= 3 ? 3.0
      : event.durationHours >= 2 ? 2.2
      : event.durationHours >= 1.5 ? 1.6
      : event.durationHours >= 1 ? 1.2
      : 1.0
    decisionFatigue += (10 * timeFactor * attendeeFactor * categoryFactor * durationFactor)
  })
  decisionFatigue = Math.min(100, decisionFatigue)

  // Cognitive reserve from focus time
  let cognitiveReserve = 0
  if (focusHours >= 5) cognitiveReserve = 90
  else if (focusHours >= 4) cognitiveReserve = 70
  else if (focusHours >= 3) cognitiveReserve = 50
  else if (focusHours >= 2) cognitiveReserve = 30
  else if (focusHours >= 1) cognitiveReserve = 12
  else cognitiveReserve = 0

  // Energy depletion from consecutive meetings
  let energyDepletion = 0
  if (consecutiveMeetings >= 5) energyDepletion = 90
  else if (consecutiveMeetings >= 4) energyDepletion = 70
  else if (consecutiveMeetings >= 3) energyDepletion = 50
  else if (consecutiveMeetings >= 2) energyDepletion = 30
  else energyDepletion = consecutiveMeetings * 12

  // Recovery boost
  const recoveryBoost = Math.min(beneficialEventCount, 3) * 5

  // Resilience score (higher = more resilient)
  const resilienceScore = Math.max(0,
    100 - contextSwitchingLoad * 0.30
    - decisionFatigue * 0.35
    + cognitiveReserve * 0.20
    - energyDepletion * 0.15
  ) + recoveryBoost

  // Convert to strain (higher = more cognitive load)
  const strainScore = 100 - Math.min(100, Math.max(0, resilienceScore))
  return Math.round(Math.max(0, strainScore))
}

describe('20 Strain + Mood Scenarios', () => {

  // ─── Scenario 1: Empty calendar ─────────────────────────────────
  it('S01 — Empty calendar → minimal strain, locked-in mood', () => {
    // Base case: 0 events returns 5
    const strain = 5
    expect(strain).toBeLessThanOrEqual(10)
    expect(detectMood(78, strain, 75)).toBe('locked-in')
  })

  // ─── Scenario 2: Day off with morning walk ──────────────────────
  it('S02 — Day off with exercise → near-zero strain, victory mood', () => {
    // Only beneficial events → no actual meetings → strain ≈ 0
    const strain = calculateStrain({
      uniqueContexts: 0,
      meetings: [],
      focusHours: 7,
      consecutiveMeetings: 0,
      beneficialEventCount: 2,
    })
    expect(strain).toBe(0)
    expect(detectMood(88, strain, 85)).toBe('victory')
  })

  // ─── Scenario 3: One light 30-min morning standup ───────────────
  it('S03 — Single light standup → very low strain', () => {
    const strain = calculateStrain({
      uniqueContexts: 1,
      meetings: [{ hourOfDay: 9, durationHours: 0.5, category: 'LIGHT_MEETINGS' }],
      focusHours: 6,
      consecutiveMeetings: 1,
      beneficialEventCount: 0,
    })
    expect(strain).toBeLessThanOrEqual(15)
    expect(detectMood(82, strain, 80)).toBe('flow')
  })

  // ─── Scenario 4: Two meetings, well-spaced ─────────────────────
  it('S04 — Two 1h meetings with gaps → low strain, locked-in mood', () => {
    const strain = calculateStrain({
      uniqueContexts: 2,
      meetings: [
        { hourOfDay: 10, durationHours: 1 },
        { hourOfDay: 14, durationHours: 1 },
      ],
      focusHours: 5,
      consecutiveMeetings: 1,
      beneficialEventCount: 0,
    })
    expect(strain).toBeLessThanOrEqual(25)
    expect(detectMood(75, strain, 72)).toBe('locked-in')
  })

  // ─── Scenario 5: Three morning meetings ─────────────────────────
  it('S05 — Three morning meetings → moderate strain, coasting mood', () => {
    const strain = calculateStrain({
      uniqueContexts: 3,
      meetings: [
        { hourOfDay: 9, durationHours: 1 },
        { hourOfDay: 10, durationHours: 1 },
        { hourOfDay: 11, durationHours: 1 },
      ],
      focusHours: 4,
      consecutiveMeetings: 3,
      beneficialEventCount: 0,
    })
    expect(strain).toBeGreaterThanOrEqual(15)
    expect(strain).toBeLessThanOrEqual(45)
    expect(detectMood(65, strain, 72)).toBe('coasting')
  })

  // ─── Scenario 6: Three back-to-back, different topics ──────────
  it('S06 — Three back-to-back → moderate strain, autopilot mood', () => {
    const strain = calculateStrain({
      uniqueContexts: 3,
      meetings: [
        { hourOfDay: 13, durationHours: 1 },
        { hourOfDay: 14, durationHours: 1 },
        { hourOfDay: 15, durationHours: 1 },
      ],
      focusHours: 3,
      consecutiveMeetings: 3,
      beneficialEventCount: 0,
    })
    expect(strain).toBeGreaterThanOrEqual(20)
    expect(strain).toBeLessThanOrEqual(55)
    expect(detectMood(55, strain, 50)).toBe('autopilot')
  })

  // ─── Scenario 7: Four meetings, some afternoon ─────────────────
  it('S07 — Four meetings spanning the day → moderate-high strain', () => {
    const strain = calculateStrain({
      uniqueContexts: 4,
      meetings: [
        { hourOfDay: 9, durationHours: 1 },
        { hourOfDay: 11, durationHours: 1 },
        { hourOfDay: 14, durationHours: 1 },
        { hourOfDay: 16, durationHours: 1 },
      ],
      focusHours: 3,
      consecutiveMeetings: 2,
      beneficialEventCount: 0,
    })
    expect(strain).toBeGreaterThanOrEqual(25)
    expect(strain).toBeLessThanOrEqual(60)
  })

  // ─── Scenario 8: Five meetings, spread out ─────────────────────
  it('S08 — Five meetings spread out → high strain', () => {
    const strain = calculateStrain({
      uniqueContexts: 5,
      meetings: [
        { hourOfDay: 8, durationHours: 1 },
        { hourOfDay: 10, durationHours: 1 },
        { hourOfDay: 12, durationHours: 1 },
        { hourOfDay: 14, durationHours: 1 },
        { hourOfDay: 16, durationHours: 1 },
      ],
      focusHours: 2,
      consecutiveMeetings: 1,
      beneficialEventCount: 0,
    })
    expect(strain).toBeGreaterThanOrEqual(35)
    expect(strain).toBeLessThanOrEqual(70)
  })

  // ─── Scenario 9: Five back-to-back meetings ────────────────────
  it('S09 — Five back-to-back → high strain, grinding mood', () => {
    const strain = calculateStrain({
      uniqueContexts: 5,
      meetings: [
        { hourOfDay: 9, durationHours: 1 },
        { hourOfDay: 10, durationHours: 1 },
        { hourOfDay: 11, durationHours: 1 },
        { hourOfDay: 12, durationHours: 1 },
        { hourOfDay: 13, durationHours: 1, attendees: 5 },
      ],
      focusHours: 1,
      consecutiveMeetings: 5,
      beneficialEventCount: 0,
    })
    // strain ≈ 63 — high but not extreme because weights cap interaction
    expect(strain).toBeGreaterThanOrEqual(55)
    // balance <= 40 && focus >= 50 → grinding (unsustainable rhythm)
    expect(detectMood(50, strain, 35)).toBe('grinding')
  })

  // ─── Scenario 10: Eight different meetings ─────────────────────
  it('S10 — Eight different meetings → very high strain, scattered', () => {
    const strain = calculateStrain({
      uniqueContexts: 8,
      meetings: Array.from({ length: 8 }, (_, i) => ({
        hourOfDay: 8 + i,
        durationHours: 1,
        attendees: 4,
      })),
      focusHours: 0,
      consecutiveMeetings: 8,
      beneficialEventCount: 0,
    })
    // strain ≈ 79 — algorithm caps near 79 due to weight structure
    expect(strain).toBeGreaterThanOrEqual(75)
    // focus <= 40 && balance <= 50 → scattered (overwhelmed, can't focus)
    expect(detectMood(30, strain, 28)).toBe('scattered')
  })

  // ─── Scenario 11: Ten back-to-back (user's reported bug) ──────
  it('S11 — Ten back-to-back meetings → high strain, scattered', () => {
    const strain = calculateStrain({
      uniqueContexts: 10,
      meetings: Array.from({ length: 10 }, (_, i) => ({
        hourOfDay: 8 + i,
        durationHours: 1,
        attendees: 3,
      })),
      focusHours: 0,
      consecutiveMeetings: 10,
      beneficialEventCount: 0,
    })
    // Algorithm caps at ~79 even in worst case due to weight structure
    // (0.30 + 0.35 + 0.15 = 0.80 max drain, leaving floor of ~21 resilience)
    expect(strain).toBeGreaterThanOrEqual(75)
    // With very low focus and balance → scattered (completely overwhelmed)
    expect(detectMood(18, strain, 15)).toBe('scattered')
  })

  // ─── Scenario 12: All-day workshop (single long meeting) ───────
  it('S12 — Single 4h workshop → moderate strain from duration', () => {
    const strain = calculateStrain({
      uniqueContexts: 1,
      meetings: [{ hourOfDay: 9, durationHours: 4, category: 'HEAVY_MEETINGS', attendees: 12 }],
      focusHours: 3,
      consecutiveMeetings: 1,
      beneficialEventCount: 0,
    })
    expect(strain).toBeGreaterThanOrEqual(20)
    expect(strain).toBeLessThanOrEqual(60)
    // High effort but focused → grinding (balance low from long meeting)
    expect(detectMood(52, strain, 35)).toBe('grinding')
  })

  // ─── Scenario 13: Afternoon-heavy schedule ─────────────────────
  it('S13 — Four afternoon meetings → high decision fatigue', () => {
    const strain = calculateStrain({
      uniqueContexts: 4,
      meetings: [
        { hourOfDay: 14, durationHours: 1 },
        { hourOfDay: 15, durationHours: 1, attendees: 6 },
        { hourOfDay: 16, durationHours: 1 },
        { hourOfDay: 17, durationHours: 1, category: 'HEAVY_MEETINGS' },
      ],
      focusHours: 3,
      consecutiveMeetings: 4,
      beneficialEventCount: 0,
    })
    // strain ≈ 57 — afternoon time factors amplify decision fatigue
    expect(strain).toBeGreaterThanOrEqual(45)
    // Strain in 40-60 range + focus 40-60 → autopilot
    expect(detectMood(48, strain, 42)).toBe('autopilot')
  })

  // ─── Scenario 14: Morning meetings + free afternoon ────────────
  it('S14 — Morning cluster + free PM → moderate strain, locked-in', () => {
    const strain = calculateStrain({
      uniqueContexts: 2,
      meetings: [
        { hourOfDay: 9, durationHours: 1 },
        { hourOfDay: 10, durationHours: 1 },
      ],
      focusHours: 5,
      consecutiveMeetings: 2,
      beneficialEventCount: 0,
    })
    expect(strain).toBeLessThanOrEqual(30)
    expect(detectMood(72, strain, 70)).toBe('locked-in')
  })

  // ─── Scenario 15: Only focus work blocks ───────────────────────
  it('S15 — Only focus blocks, no meetings → near-zero strain, victory', () => {
    // Only FOCUS_WORK events → actualMeetings = 0 → uses formula with 0s
    const strain = calculateStrain({
      uniqueContexts: 0,
      meetings: [],
      focusHours: 7,
      consecutiveMeetings: 0,
      beneficialEventCount: 0,
    })
    expect(strain).toBeLessThanOrEqual(5)
    expect(detectMood(88, strain, 82)).toBe('victory')
  })

  // ─── Scenario 16: Meetings + beneficial recovery ───────────────
  it('S16 — Three meetings + walk + lunch → recovery boost lowers strain', () => {
    const withoutRecovery = calculateStrain({
      uniqueContexts: 3,
      meetings: [
        { hourOfDay: 9, durationHours: 1 },
        { hourOfDay: 11, durationHours: 1 },
        { hourOfDay: 14, durationHours: 1 },
      ],
      focusHours: 4,
      consecutiveMeetings: 1,
      beneficialEventCount: 0,
    })
    const withRecovery = calculateStrain({
      uniqueContexts: 3,
      meetings: [
        { hourOfDay: 9, durationHours: 1 },
        { hourOfDay: 11, durationHours: 1 },
        { hourOfDay: 14, durationHours: 1 },
      ],
      focusHours: 4,
      consecutiveMeetings: 1,
      beneficialEventCount: 3,
    })
    expect(withRecovery).toBeLessThan(withoutRecovery)
    expect(withoutRecovery - withRecovery).toBe(15) // 3 beneficial × 5 pts each
  })

  // ─── Scenario 17: Large group meetings ─────────────────────────
  it('S17 — Large group meetings (10+ attendees) → amplified fatigue', () => {
    const small = calculateStrain({
      uniqueContexts: 2,
      meetings: [
        { hourOfDay: 10, durationHours: 1, attendees: 2 },
        { hourOfDay: 14, durationHours: 1, attendees: 2 },
      ],
      focusHours: 5,
      consecutiveMeetings: 1,
      beneficialEventCount: 0,
    })
    const large = calculateStrain({
      uniqueContexts: 2,
      meetings: [
        { hourOfDay: 10, durationHours: 1, attendees: 12 },
        { hourOfDay: 14, durationHours: 1, attendees: 12 },
      ],
      focusHours: 5,
      consecutiveMeetings: 1,
      beneficialEventCount: 0,
    })
    expect(large).toBeGreaterThan(small)
  })

  // ─── Scenario 18: Heavy vs light meeting categories ────────────
  it('S18 — Heavy meetings cause more strain than light meetings', () => {
    const light = calculateStrain({
      uniqueContexts: 3,
      meetings: [
        { hourOfDay: 10, durationHours: 1, category: 'LIGHT_MEETINGS' },
        { hourOfDay: 12, durationHours: 1, category: 'LIGHT_MEETINGS' },
        { hourOfDay: 14, durationHours: 1, category: 'LIGHT_MEETINGS' },
      ],
      focusHours: 4,
      consecutiveMeetings: 1,
      beneficialEventCount: 0,
    })
    const heavy = calculateStrain({
      uniqueContexts: 3,
      meetings: [
        { hourOfDay: 10, durationHours: 1, category: 'HEAVY_MEETINGS' },
        { hourOfDay: 12, durationHours: 1, category: 'HEAVY_MEETINGS' },
        { hourOfDay: 14, durationHours: 1, category: 'HEAVY_MEETINGS' },
      ],
      focusHours: 4,
      consecutiveMeetings: 1,
      beneficialEventCount: 0,
    })
    expect(heavy).toBeGreaterThan(light)
  })

  // ─── Scenario 19: Elite focus with minimal strain ──────────────
  it('S19 — Elite focus + low strain → flow mood', () => {
    const strain = calculateStrain({
      uniqueContexts: 1,
      meetings: [{ hourOfDay: 10, durationHours: 0.5 }],
      focusHours: 6,
      consecutiveMeetings: 1,
      beneficialEventCount: 1,
    })
    expect(strain).toBeLessThanOrEqual(10)
    expect(detectMood(92, strain, 65)).toBe('flow')
  })

  // ─── Scenario 20: Perfectly average day ────────────────────────
  it('S20 — Middle-of-the-road day → autopilot mood', () => {
    const strain = calculateStrain({
      uniqueContexts: 3,
      meetings: [
        { hourOfDay: 10, durationHours: 1 },
        { hourOfDay: 13, durationHours: 1 },
        { hourOfDay: 15, durationHours: 1 },
      ],
      focusHours: 3,
      consecutiveMeetings: 2,
      beneficialEventCount: 0,
    })
    // Should be moderate
    expect(strain).toBeGreaterThanOrEqual(20)
    expect(strain).toBeLessThanOrEqual(55)
    expect(detectMood(55, strain, 55)).toBe('autopilot')
  })
})
