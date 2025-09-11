import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { aiInsightsCache } from '../utils/aiInsightsCache';

// AI Insights interfaces
interface AIInsight {
  category: 'performance' | 'wellness' | 'productivity' | 'balance' | 'prediction';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  actionable: boolean;
  recommendation?: string;
  timeframe?: string;
  confidence: number;
}

interface AIRecommendation {
  type: 'schedule' | 'wellness' | 'productivity' | 'focus' | 'meeting';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionSteps?: string[];
  expectedImpact?: string;
  timeToImplement?: string;
}

interface AIPersonalizedInsights {
  insights: AIInsight[];
  summary: string;
  overallScore: number;
  riskFactors: string[];
  opportunities: string[];
  predictiveAlerts: string[];
  recommendations?: AIRecommendation[];
}

interface WorkHealthData {
  // New intelligent metrics
  adaptivePerformanceIndex: number;
  cognitiveResilience: number;
  workRhythmRecovery: number;
  
  status: string;
  
  // Legacy fields for backward compatibility
  readiness: number;
  cognitiveAvailability: number;
  focusTime: number;
  meetingDensity: number;
}

interface ScheduleAnalysis {
  meetingCount: number;
  backToBackCount: number;
  bufferTime: number;
  durationHours: number;
  fragmentationScore: number;
}

interface WorkHealthBreakdown {
  source: 'calendar' | 'estimated';
  contributors: string[];
  primaryFactors: string[];
}

interface WorkHealthMetrics {
  // New intelligent metrics
  adaptivePerformanceIndex: number;
  cognitiveResilience: number;
  workRhythmRecovery: number;
  
  status: string;
  schedule: ScheduleAnalysis;
  breakdown: WorkHealthBreakdown;
  
  // Legacy fields for backward compatibility
  readiness: number;
  cognitiveAvailability: number;
  focusTime: number;
  meetingDensity: number;
  
  // AI-powered insights (optional)
  ai?: AIPersonalizedInsights;
  aiStatus?: 'success' | 'fallback' | 'unavailable';
}

export const useWorkHealth = (tabType?: 'overview' | 'performance' | 'resilience' | 'sustainability') => {
  const { data: session, status } = useSession();
  const [workHealth, setWorkHealth] = useState<WorkHealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [currentTab, setCurrentTab] = useState<string>('overview');

  // Helper function to get cache key for current user
  const getCacheKey = () => {
    if (!session?.user?.email) return null;
    return `persist-work-health-${session.user.email}`;
  };

  // Remove automatic cache loading - only load cache on API failure

  const fetchWorkHealth = async (retryCount = 0, specificTab?: string, forceRefresh = false) => {
    if (status !== 'authenticated' || !session) {
      setError('Not authenticated');
      return;
    }

    // Set appropriate loading state
    if (workHealth) {
      setIsAILoading(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const userId = session.user?.email || session.user?.id || 'anonymous';
      const currentTab = specificTab || 'overview';
      
      // Fetch fresh data from API (AI caching is handled server-side)
      let url = specificTab ? `/api/work-health?tab=${specificTab}` : '/api/work-health';
      
      // Add force parameter for production cache clearing
      if (forceRefresh) {
        url += (url.includes('?') ? '&' : '?') + 'force=true';
      }
      
      // No cache or cache miss - fetch fresh data with AI
      console.log(`🔄 Fetching fresh AI insights for ${currentTab} tab${forceRefresh ? ' (FORCE REFRESH)' : ''}`);
      const timestampedUrl = url + (url.includes('?') ? '&' : '?') + `_t=${Date.now()}`;
      const response = await fetch(timestampedUrl, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.needsReauth) {
          throw new Error('Please sign out and sign back in to refresh your Google Calendar connection');
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // AI caching is handled server-side, just set the data
      setWorkHealth(data);
      setLastRefresh(new Date());
      
      // Save successful data to localStorage for general cache
      const generalCacheKey = getCacheKey();
      if (generalCacheKey) {
        localStorage.setItem(generalCacheKey, JSON.stringify({
          metrics: data,
          lastRefresh: new Date().toISOString()
        }));
      }
    } catch (err) {
      console.error('Error fetching work health:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch work health data');
      
      // Try to use cached data for this user first
      const cacheKey = getCacheKey();
      let usedCache = false;
      
      if (cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const data = JSON.parse(cached);
            setWorkHealth({
              ...data.metrics,
              status: 'CACHED' // Indicate this is cached data
            });
            setLastRefresh(new Date(data.lastRefresh));
            usedCache = true;
            console.log('Using cached data due to API failure');
          } catch (e) {
            console.error('Error loading cached data:', e);
          }
        }
      }
      
      // Don't show fake data - show clear error state
      if (!usedCache) {
        // For new users, retry once automatically
        if (retryCount === 0 && err instanceof Error && err.message.includes('HTTP error')) {
          console.log('First attempt failed, retrying for new user...');
          setTimeout(() => {
            fetchWorkHealth(1, specificTab, forceRefresh); // Retry once with same tab and force setting
          }, 2000);
          return;
        }
        
        // After retry or for other errors, show clear error message
        console.log('Unable to fetch calendar data');
        setWorkHealth(null);
        
        // Provide clear, actionable error message
        if (err instanceof Error && err.message.includes('sign out and sign back in')) {
          setError('Calendar connection expired. Please sign out and sign back in.');
        } else {
          setError('Unable to connect to Google Calendar. Please try refreshing the page or sign out and back in.');
        }
      }
    } finally {
      setIsLoading(false);
      setIsAILoading(false);
    }
  };

  // Handle tab changes with intelligent caching
  useEffect(() => {
    const newTab = tabType || 'overview';
    
    // If tab didn't actually change, do nothing
    if (newTab === currentTab && workHealth) {
      return;
    }
    
    setCurrentTab(newTab);
    
    if (status === 'authenticated' && session) {
      // Always fetch fresh data for tab changes (server handles AI caching)
      if (workHealth) {
        console.log(`🔄 Fetching fresh data for ${newTab} tab`);
        setIsAILoading(true);
      } else {
        console.log(`🔄 Initial load for ${newTab} tab`);
        setIsLoading(true);
      }
      
      setError(null);
      fetchWorkHealth(0, newTab);
    }
  }, [session, status, tabType, workHealth]);

  const refresh = () => {
    // Clear ALL caches to force fresh data
    const userId = session?.user?.email || session?.user?.id || 'anonymous';
    
    // Clear AI insights cache
    aiInsightsCache.clearUserCache(userId);
    
    // Clear general localStorage cache
    const generalCacheKey = getCacheKey();
    if (generalCacheKey) {
      localStorage.removeItem(generalCacheKey);
    }
    
    // Clear current data and error state to force fresh load
    setWorkHealth(null);
    setError(null);
    setLastRefresh(new Date());
    
    console.log('🧹 Cleared all caches, fetching fresh data...');
    
    // Force refresh with special parameter for production
    fetchWorkHealth(0, tabType, true);
  };

  return {
    workHealth,
    isLoading,
    isAILoading,
    error,
    lastRefresh,
    refresh,
    isAuthenticated: status === 'authenticated',
    // Helper functions for AI insights
    hasAIInsights: !!workHealth?.ai && workHealth.aiStatus === 'success',
    aiInsights: workHealth?.ai,
    aiStatus: workHealth?.aiStatus || 'unavailable',
  };
};

// Export types for use in other components
export type {
  WorkHealthMetrics,
  AIInsight,
  AIRecommendation,
  AIPersonalizedInsights,
  ScheduleAnalysis,
  WorkHealthBreakdown,
};