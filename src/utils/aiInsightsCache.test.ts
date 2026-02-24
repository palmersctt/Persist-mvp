import { describe, it, expect, beforeEach } from 'vitest'
import { AIInsightsCache } from './aiInsightsCache'

/**
 * Build a localStorage mock where Object.keys() returns stored keys.
 * This matters because clearUserCache and getCacheStats iterate with
 * Object.keys(localStorage).
 */
function createStorage(): Storage {
  const store: Record<string, string> = {}
  const handler: ProxyHandler<Record<string, string>> = {
    get(_target, prop: string) {
      if (prop === 'getItem') return (k: string) => store[k] ?? null
      if (prop === 'setItem')
        return (k: string, v: string) => {
          store[k] = v
        }
      if (prop === 'removeItem')
        return (k: string) => {
          delete store[k]
        }
      if (prop === 'clear')
        return () => {
          for (const k of Object.keys(store)) delete store[k]
        }
      if (prop === 'length') return Object.keys(store).length
      if (prop === 'key') return (i: number) => Object.keys(store)[i] ?? null
      return store[prop]
    },
    ownKeys() {
      return Object.keys(store)
    },
    getOwnPropertyDescriptor(_target, prop: string) {
      if (prop in store) {
        return { configurable: true, enumerable: true, value: store[prop] }
      }
      return undefined
    },
  }
  return new Proxy({} as Record<string, string>, handler) as unknown as Storage
}

// Need a fresh instance per test because the class is a singleton
function freshCache(): AIInsightsCache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(AIInsightsCache as any).instance = undefined
  return AIInsightsCache.getInstance()
}

describe('AIInsightsCache', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createStorage(),
      writable: true,
      configurable: true,
    })
  })

  describe('getInstance', () => {
    it('returns the same instance', () => {
      const a = freshCache()
      const b = AIInsightsCache.getInstance()
      expect(a).toBe(b)
    })
  })

  describe('generateCalendarDataHash', () => {
    it('returns a string hash', () => {
      const cache = freshCache()
      const hash = cache.generateCalendarDataHash(
        { adaptivePerformanceIndex: 70, cognitiveResilience: 60, workRhythmRecovery: 50 },
        []
      )
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('returns different hashes for different data', () => {
      const cache = freshCache()
      const hash1 = cache.generateCalendarDataHash(
        { adaptivePerformanceIndex: 70, cognitiveResilience: 60, workRhythmRecovery: 50 },
        []
      )
      const hash2 = cache.generateCalendarDataHash(
        { adaptivePerformanceIndex: 30, cognitiveResilience: 60, workRhythmRecovery: 50 },
        []
      )
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('getCachedInsights / setCachedInsights', () => {
    it('returns null when no cache exists', () => {
      const cache = freshCache()
      expect(cache.getCachedInsights('user1', 'overview', 'hash1')).toBeNull()
    })

    it('stores and retrieves cached insights', () => {
      const cache = freshCache()
      const insights = { summary: 'test', score: 80 }
      cache.setCachedInsights('user1', 'overview', insights, 'hash1')
      const result = cache.getCachedInsights('user1', 'overview', 'hash1')
      expect(result).toEqual(insights)
    })

    it('invalidates cache when hash changes', () => {
      const cache = freshCache()
      cache.setCachedInsights('user1', 'overview', { data: 1 }, 'hash1')
      const result = cache.getCachedInsights('user1', 'overview', 'hash2')
      expect(result).toBeNull()
    })
  })

  describe('clearUserCache', () => {
    it('removes all entries for a user', () => {
      const cache = freshCache()
      cache.setCachedInsights('user1', 'overview', { a: 1 }, 'h1')
      cache.setCachedInsights('user1', 'performance', { b: 2 }, 'h2')
      cache.clearUserCache('user1')
      expect(cache.getCachedInsights('user1', 'overview', 'h1')).toBeNull()
      expect(cache.getCachedInsights('user1', 'performance', 'h2')).toBeNull()
    })
  })

  describe('getCacheStats', () => {
    it('returns zero stats when empty', () => {
      const cache = freshCache()
      const stats = cache.getCacheStats('user1')
      expect(stats.totalEntries).toBe(0)
      expect(stats.totalSize).toBe(0)
    })

    it('counts entries after caching', () => {
      const cache = freshCache()
      cache.setCachedInsights('user1', 'overview', { x: 1 }, 'h')
      cache.setCachedInsights('user1', 'performance', { y: 2 }, 'h')
      const stats = cache.getCacheStats('user1')
      expect(stats.totalEntries).toBe(2)
      expect(stats.totalSize).toBeGreaterThan(0)
    })
  })
})
