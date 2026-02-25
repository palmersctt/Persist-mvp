import { describe, it, expect } from 'vitest'
import { ComicReliefGenerator, comicReliefGenerator } from './comicReliefGenerator'
import type { WorkHealthMetrics } from '../hooks/useWorkHealth'

// Helper to build metrics with sensible defaults
function makeMetrics(overrides: Partial<WorkHealthMetrics> = {}): WorkHealthMetrics {
  return {
    adaptivePerformanceIndex: 50,
    cognitiveResilience: 50,
    workRhythmRecovery: 50,
    status: 'OK',
    readiness: 50,
    cognitiveAvailability: 50,
    focusTime: 180,
    meetingDensity: 0.4,
    schedule: {
      meetingCount: 3,
      backToBackCount: 1,
      bufferTime: 30,
      durationHours: 8,
      fragmentationScore: 0.4,
      morningMeetings: 2,
      afternoonMeetings: 1,
      meetingRatio: 0.3,
      uniqueContexts: 3,
      longestStretch: 120,
      adequateBreaks: 3,
      shortBreaks: 1,
      earlyLateMeetings: 0,
    },
    breakdown: {
      source: 'calendar',
      contributors: [],
      primaryFactors: [],
    },
    ...overrides,
  }
}

describe('ComicReliefGenerator', () => {
  it('exports a singleton instance', () => {
    expect(comicReliefGenerator).toBeInstanceOf(ComicReliefGenerator)
  })

  describe('generateQuote', () => {
    it('returns a quote object with required fields', () => {
      const quote = comicReliefGenerator.generateQuote(makeMetrics())
      expect(quote).toHaveProperty('text')
      expect(quote).toHaveProperty('source')
      expect(quote).toHaveProperty('category')
      expect(quote).toHaveProperty('tone')
    })

    it('returns confident quotes for high performance', () => {
      const metrics = makeMetrics({ adaptivePerformanceIndex: 95 })
      // Run multiple times to account for randomness
      const tones = new Set<string>()
      for (let i = 0; i < 20; i++) {
        tones.add(comicReliefGenerator.generateQuote(metrics).tone)
      }
      expect(tones.has('confident')).toBe(true)
    })

    it('returns defeated quotes for very poor performance', () => {
      const metrics = makeMetrics({ adaptivePerformanceIndex: 10 })
      const tones = new Set<string>()
      for (let i = 0; i < 20; i++) {
        tones.add(comicReliefGenerator.generateQuote(metrics).tone)
      }
      expect(tones.has('defeated')).toBe(true)
    })
  })

  describe('generateMultipleQuotes', () => {
    it('returns the requested number of unique quotes', () => {
      const quotes = comicReliefGenerator.generateMultipleQuotes(makeMetrics(), 3)
      expect(quotes).toHaveLength(3)
      const texts = quotes.map((q) => q.text)
      expect(new Set(texts).size).toBe(3)
    })

    it('defaults to 3 quotes', () => {
      const quotes = comicReliefGenerator.generateMultipleQuotes(makeMetrics())
      expect(quotes).toHaveLength(3)
    })
  })

  describe('formatQuote', () => {
    it('includes character when present', () => {
      const result = comicReliefGenerator.formatQuote({
        text: 'Hello',
        source: 'Movie',
        character: 'Bob',
        category: 'performance',
        tone: 'dry',
      })
      expect(result).toBe('Hello - Bob, Movie')
    })

    it('omits character when absent', () => {
      const result = comicReliefGenerator.formatQuote({
        text: 'Hello',
        source: 'Movie',
        category: 'performance',
        tone: 'dry',
      })
      expect(result).toBe('Hello - Movie')
    })
  })

  describe('getTotalQuoteCount', () => {
    it('returns a positive number', () => {
      expect(comicReliefGenerator.getTotalQuoteCount()).toBeGreaterThan(0)
    })
  })
})
