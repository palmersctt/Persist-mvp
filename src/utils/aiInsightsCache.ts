// Client-side AI insights caching utility

// Simple hash function for browser compatibility (instead of crypto module)
function simpleHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

interface CachedAIInsights {
  insights: any;
  timestamp: string;
  cacheKey: string;
  calendarDataHash: string;
}

export class AIInsightsCache {
  private static instance: AIInsightsCache;
  
  public static getInstance(): AIInsightsCache {
    if (!AIInsightsCache.instance) {
      AIInsightsCache.instance = new AIInsightsCache();
    }
    return AIInsightsCache.instance;
  }

  // Generate a hash of calendar data to detect changes
  public generateCalendarDataHash(workHealthData: any, events: any[]): string {
    const relevantData = {
      // Core metrics that affect AI insights
      adaptivePerformanceIndex: workHealthData.adaptivePerformanceIndex,
      cognitiveResilience: workHealthData.cognitiveResilience,
      workRhythmRecovery: workHealthData.workRhythmRecovery,
      meetingCount: workHealthData.schedule?.meetingCount,
      backToBackCount: workHealthData.schedule?.backToBackCount,
      focusTime: workHealthData.focusTime,
      fragmentationScore: workHealthData.schedule?.fragmentationScore,
      // Calendar events summary (titles, times, durations)
      events: events?.map(event => ({
        summary: event.summary,
        start: event.start,
        end: event.end,
        duration: event.duration
      })) || [],
      // Date to ensure daily invalidation
      date: new Date().toDateString()
    };
    
    const dataString = JSON.stringify(relevantData);
    return simpleHash(dataString);
  }

  // Check if we have cached insights for this data + tab combination
  public getCachedInsights(userId: string, tabType: string, calendarDataHash: string): any | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cacheKey = `ai-insights-${userId}-${tabType}`;
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;
      
      const cachedData: CachedAIInsights = JSON.parse(cached);
      
      // Check if calendar data has changed
      if (cachedData.calendarDataHash !== calendarDataHash) {
        console.log('Calendar data changed, cache invalidated');
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      // Check if cache is still valid (within 4 hours for same calendar data)
      const cacheTime = new Date(cachedData.timestamp);
      const now = new Date();
      const hoursSinceCache = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCache > 4) {
        console.log('Cache expired (>4 hours), invalidated');
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      console.log(`Using cached AI insights for ${tabType} (${hoursSinceCache.toFixed(1)}h old)`);
      return cachedData.insights;
    } catch (error) {
      console.warn('Error reading AI insights cache:', error);
      return null;
    }
  }

  // Store AI insights with calendar data hash
  public setCachedInsights(userId: string, tabType: string, insights: any, calendarDataHash: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheKey = `ai-insights-${userId}-${tabType}`;
      const cacheData: CachedAIInsights = {
        insights,
        timestamp: new Date().toISOString(),
        cacheKey,
        calendarDataHash
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`Cached AI insights for ${tabType}`);
      
      // Clean up old cache entries
      this.cleanupOldCache(userId);
    } catch (error) {
      console.warn('Error saving AI insights cache:', error);
    }
  }

  // Clean up old cache entries to prevent localStorage bloat
  private cleanupOldCache(userId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      const aiCacheKeys = keys.filter(key => key.startsWith(`ai-insights-${userId}-`));
      
      // Keep only the 8 most recent cache entries per user (2 for each tab)
      if (aiCacheKeys.length > 8) {
        const cacheEntries = aiCacheKeys.map(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            return { key, timestamp: new Date(data.timestamp || 0) };
          } catch {
            return { key, timestamp: new Date(0) };
          }
        }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        // Remove oldest entries
        cacheEntries.slice(8).forEach(entry => {
          localStorage.removeItem(entry.key);
        });
      }
    } catch (error) {
      console.warn('Error cleaning up AI insights cache:', error);
    }
  }

  // Clear all cache for a user (useful for sign out)
  public clearUserCache(userId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      const userCacheKeys = keys.filter(key => key.startsWith(`ai-insights-${userId}-`));
      userCacheKeys.forEach(key => localStorage.removeItem(key));
      console.log(`Cleared AI insights cache for user ${userId}`);
    } catch (error) {
      console.warn('Error clearing user cache:', error);
    }
  }

  // Get cache stats for debugging
  public getCacheStats(userId: string): { totalEntries: number; totalSize: number; oldestEntry?: Date } {
    if (typeof window === 'undefined') return { totalEntries: 0, totalSize: 0 };
    
    try {
      const keys = Object.keys(localStorage);
      const userCacheKeys = keys.filter(key => key.startsWith(`ai-insights-${userId}-`));
      
      let totalSize = 0;
      let oldestEntry: Date | undefined;
      
      userCacheKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += data.length;
          try {
            const parsed = JSON.parse(data);
            const timestamp = new Date(parsed.timestamp);
            if (!oldestEntry || timestamp < oldestEntry) {
              oldestEntry = timestamp;
            }
          } catch {
            // ignore parsing errors
          }
        }
      });
      
      return {
        totalEntries: userCacheKeys.length,
        totalSize,
        oldestEntry
      };
    } catch (error) {
      console.warn('Error getting cache stats:', error);
      return { totalEntries: 0, totalSize: 0 };
    }
  }
}

export const aiInsightsCache = AIInsightsCache.getInstance();