import { describe, it, expect } from 'vitest'
import { detectMood, MOODS, type Mood } from './mood'

describe('detectMood', () => {
  it('returns victory when focus high, strain low, balance high', () => {
    expect(detectMood(90, 20, 85)).toBe('victory')
  })

  it('returns flow when focus high and balance high', () => {
    expect(detectMood(82, 50, 75)).toBe('flow')
  })

  it('returns survival when strain very high and focus low', () => {
    expect(detectMood(30, 85, 50)).toBe('survival')
  })

  it('returns grinding when strain high (but focus not low enough for survival)', () => {
    expect(detectMood(50, 75, 50)).toBe('grinding')
  })

  it('returns scattered when focus and balance both low', () => {
    expect(detectMood(30, 50, 30)).toBe('scattered')
  })

  it('returns locked-in when focus high and strain moderate', () => {
    expect(detectMood(75, 40, 50)).toBe('locked-in')
  })

  it('returns coasting when balance high and strain low', () => {
    expect(detectMood(50, 30, 75)).toBe('coasting')
  })

  it('returns autopilot for middle-of-the-road values', () => {
    expect(detectMood(50, 50, 50)).toBe('autopilot')
  })

  it('defaults to autopilot when no rule matches', () => {
    // Values that slip through all specific rules
    expect(detectMood(60, 60, 60)).toBe('autopilot')
  })

  // Priority ordering: victory should beat flow
  it('victory takes priority over flow when all conditions met', () => {
    expect(detectMood(90, 25, 85)).toBe('victory')
  })

  // Boundary tests
  it('handles exact boundary for victory (focus=85, strain=30, balance=80)', () => {
    expect(detectMood(85, 30, 80)).toBe('victory')
  })

  it('handles zero values', () => {
    expect(detectMood(0, 0, 0)).toBe('scattered')
  })

  it('handles max values (flow wins because focus>=80 & balance>=70 checked before strain>=70)', () => {
    expect(detectMood(100, 100, 100)).toBe('flow')
  })
})

describe('MOODS', () => {
  it('has all 8 mood types defined', () => {
    const moodKeys: Mood[] = [
      'survival', 'grinding', 'scattered', 'autopilot',
      'coasting', 'locked-in', 'flow', 'victory',
    ]
    for (const key of moodKeys) {
      expect(MOODS[key]).toBeDefined()
      expect(MOODS[key].name).toBeTruthy()
      expect(MOODS[key].gradient).toHaveLength(2)
    }
  })

  it('every gradient has two hex color strings', () => {
    for (const mood of Object.values(MOODS)) {
      for (const color of mood.gradient) {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    }
  })
})
