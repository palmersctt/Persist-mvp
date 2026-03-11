import { describe, it, expect } from 'vitest'
import { detectMood, MOODS, MOOD_TIERS, type Mood } from './mood'

describe('detectMood – tier classification', () => {
  it('returns a good-day mood when focus high, strain low, balance high', () => {
    expect(MOOD_TIERS.good).toContain(detectMood(90, 20, 85))
  })

  it('returns a good-day mood when focus high and balance high', () => {
    expect(MOOD_TIERS.good).toContain(detectMood(82, 50, 75))
  })

  it('returns a bad-day mood when strain very high and focus low', () => {
    expect(MOOD_TIERS.bad).toContain(detectMood(30, 85, 50))
  })

  it('returns a bad-day mood when strain high but focus moderate', () => {
    expect(MOOD_TIERS.bad).toContain(detectMood(50, 75, 50))
  })

  it('returns a bad-day mood when focus and balance both low', () => {
    expect(MOOD_TIERS.bad).toContain(detectMood(30, 50, 30))
  })

  it('returns a good-day mood when focus high and strain moderate', () => {
    expect(MOOD_TIERS.good).toContain(detectMood(75, 40, 50))
  })

  it('returns an ok-day mood for middle-of-the-road values', () => {
    expect(MOOD_TIERS.ok).toContain(detectMood(50, 50, 50))
  })

  it('returns an ok-day mood when no strong signals', () => {
    expect(MOOD_TIERS.ok).toContain(detectMood(60, 60, 60))
  })

  it('good tier takes priority for top scores', () => {
    expect(MOOD_TIERS.good).toContain(detectMood(90, 25, 85))
  })

  it('handles near-floor values as bad day', () => {
    // Scores never reach 0 — ambient load always exists
    expect(MOOD_TIERS.bad).toContain(detectMood(5, 5, 5))
  })

  it('handles near-ceiling values as good day', () => {
    // Scores never reach 100 — perfect isn't real
    expect(MOOD_TIERS.good).toContain(detectMood(95, 95, 95))
  })
})

describe('detectMood – stability', () => {
  it('returns the same mood for identical inputs within a single run', () => {
    const a = detectMood(70, 40, 60)
    const b = detectMood(70, 40, 60)
    expect(a).toBe(b)
  })

  it('always returns a valid Mood', () => {
    const allMoods = Object.keys(MOODS) as Mood[]
    // Spot-check a variety of inputs
    const inputs: [number, number, number][] = [
      [5, 5, 5], [50, 50, 50], [95, 95, 95],
      [90, 10, 90], [10, 90, 10], [50, 20, 80],
    ]
    for (const [f, s, b] of inputs) {
      expect(allMoods).toContain(detectMood(f, s, b))
    }
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

describe('MOOD_TIERS', () => {
  it('covers all moods exactly once', () => {
    const allTiered = [...MOOD_TIERS.bad, ...MOOD_TIERS.ok, ...MOOD_TIERS.good]
    const allMoods = Object.keys(MOODS) as Mood[]
    expect(allTiered.sort()).toEqual(allMoods.sort())
  })

  it('bad tier has 3, ok has 2, good has 3 moods', () => {
    expect(MOOD_TIERS.bad).toHaveLength(3)
    expect(MOOD_TIERS.ok).toHaveLength(2)
    expect(MOOD_TIERS.good).toHaveLength(3)
  })
})
