import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

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

interface MetricInsight {
  title: string;
  message: string;
  action: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

interface AIPersonalizedInsights {
  // Per-metric structured insights
  overview?: MetricInsight;
  performance?: MetricInsight;
  resilience?: MetricInsight;
  sustainability?: MetricInsight;

  // Legacy fields
  insights: AIInsight[];
  summary: string;
  overallScore: number;
  riskFactors: string[];
  opportunities: string[];
  predictiveAlerts: string[];
  recommendations?: AIRecommendation[];
  heroMessage?: string | { quote: string; source: string; subtitle: string };
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
  morningMeetings: number;
  afternoonMeetings: number;
  meetingRatio: number;
  uniqueContexts: number;
  longestStretch: number;
  adequateBreaks: number;
  shortBreaks: number;
  earlyLateMeetings: number;
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

  // Intelligent insights (optional)
  ai?: AIPersonalizedInsights;
  aiStatus?: 'success' | 'fallback' | 'unavailable';
}

// How often to poll for calendar changes (5 minutes)
const POLL_INTERVAL_MS = 5 * 60 * 1000;

// Historical score entry
interface DailyScore {
  date: string; // YYYY-MM-DD
  performance: number;
  resilience: number;
  sustainability: number;
}

// Trend direction
type Trend = 'up' | 'down' | 'flat';

interface HistoricalContext {
  weeklyAvg: { performance: number; resilience: number; sustainability: number };
  trend: { performance: Trend; resilience: Trend; sustainability: Trend };
  daysTracked: number;
}

export const useWorkHealth = (tabType?: 'overview' | 'performance' | 'resilience' | 'sustainability') => {
  const { data: session, status } = useSession();
  const [workHealth, setWorkHealth] = useState<WorkHealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [history, setHistory] = useState<HistoricalContext | null>(null);

  // Track whether we've done the initial fetch
  const hasFetched = useRef(false);
  // Store a fingerprint of calendar data to detect changes
  const calendarFingerprint = useRef<string | null>(null);
  // Poll timer ref
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  // Helper function to get cache key for current user
  const getCacheKey = () => {
    if (!session?.user?.email) return null;
    return `persist-work-health-${session.user.email}`;
  };

  const getHistoryKey = () => {
    if (!session?.user?.email) return null;
    return `persist-history-${session.user.email}`;
  };

  // Save today's scores and compute historical context
  const updateHistory = useCallback((data: WorkHealthMetrics) => {
    const historyKey = getHistoryKey();
    if (!historyKey) return;

    const today = new Date().toISOString().split('T')[0];
    const entry: DailyScore = {
      date: today,
      performance: data.adaptivePerformanceIndex,
      resilience: data.cognitiveResilience,
      sustainability: data.workRhythmRecovery,
    };

    let scores: DailyScore[] = [];
    try {
      const raw = localStorage.getItem(historyKey);
      if (raw) scores = JSON.parse(raw);
    } catch {}

    // Update or add today's entry
    const idx = scores.findIndex(s => s.date === today);
    if (idx >= 0) scores[idx] = entry;
    else scores.push(entry);

    // Keep last 30 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    scores = scores.filter(s => new Date(s.date) >= cutoff);
    localStorage.setItem(historyKey, JSON.stringify(scores));

    // Compute 7-day context
    const last7 = scores.slice(-7);
    if (last7.length < 2) {
      setHistory(null);
      return;
    }

    const avg = {
      performance: Math.round(last7.reduce((s, d) => s + d.performance, 0) / last7.length),
      resilience: Math.round(last7.reduce((s, d) => s + d.resilience, 0) / last7.length),
      sustainability: Math.round(last7.reduce((s, d) => s + d.sustainability, 0) / last7.length),
    };

    const getTrend = (current: number, weekAvg: number): Trend => {
      const diff = current - weekAvg;
      if (diff >= 5) return 'up';
      if (diff <= -5) return 'down';
      return 'flat';
    };

    setHistory({
      weeklyAvg: avg,
      trend: {
        performance: getTrend(data.adaptivePerformanceIndex, avg.performance),
        resilience: getTrend(data.cognitiveResilience, avg.resilience),
        sustainability: getTrend(data.workRhythmRecovery, avg.sustainability),
      },
      daysTracked: last7.length,
    });
  }, [session]);

  // Create a fingerprint from calendar metrics to detect real changes
  const getFingerprint = (data: WorkHealthMetrics): string => {
    return `${data.schedule?.meetingCount}-${data.schedule?.backToBackCount}-${data.schedule?.durationHours}-${data.adaptivePerformanceIndex}-${data.cognitiveResilience}-${data.workRhythmRecovery}`;
  };

  const fetchWorkHealth = useCallback(async (retryCount = 0, options?: { silent?: boolean }) => {
    if (status !== 'authenticated' || !session) {
      setError('Not authenticated');
      return;
    }

    const isSilent = options?.silent || false;

    // Set loading state (skip for silent background polls)
    if (!isSilent) {
      if (workHealth) {
        setIsAILoading(true);
      } else {
        setIsLoading(true);
      }
    }
    setError(null);

    try {
      // CLIENT-SIDE TIMEZONE DETECTION
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Always fetch overview — tab filtering happens client-side
      const url = '/api/work-health';
      const timestampedUrl = url + `?_t=${Date.now()}&timezone=${encodeURIComponent(userTimezone)}`;

      console.log(`🔄 Fetching work health data${isSilent ? ' (background poll)' : ''}...`);
      const response = await fetch(timestampedUrl, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-User-Timezone': userTimezone
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

      const newFingerprint = getFingerprint(data);

      // For silent polls, only update if calendar data actually changed
      if (isSilent && calendarFingerprint.current === newFingerprint) {
        console.log('📊 Background poll: no calendar changes detected');
        return;
      }

      if (isSilent && calendarFingerprint.current !== null) {
        console.log('📊 Background poll: calendar changed! Updating data.');
      }

      calendarFingerprint.current = newFingerprint;
      setWorkHealth(data);
      setLastRefresh(new Date());
      updateHistory(data);

      // Save to localStorage as fallback cache
      const generalCacheKey = getCacheKey();
      if (generalCacheKey) {
        localStorage.setItem(generalCacheKey, JSON.stringify({
          metrics: data,
          lastRefresh: new Date().toISOString()
        }));
      }
    } catch (err) {
      console.error('Error fetching work health:', err);

      // For silent polls, don't overwrite existing data with errors
      if (isSilent && workHealth) {
        console.log('Background poll failed, keeping existing data');
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to fetch work health data');

      // Try to use cached data
      const cacheKey = getCacheKey();
      let usedCache = false;

      if (cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const data = JSON.parse(cached);
            setWorkHealth({
              ...data.metrics,
              status: 'CACHED'
            });
            setLastRefresh(new Date(data.lastRefresh));
            usedCache = true;
            console.log('Using cached data due to API failure');
          } catch (e) {
            console.error('Error loading cached data:', e);
          }
        }
      }

      if (!usedCache) {
        if (retryCount === 0 && err instanceof Error && err.message.includes('HTTP error')) {
          console.log('First attempt failed, retrying...');
          setTimeout(() => {
            fetchWorkHealth(1);
          }, 2000);
          return;
        }

        setWorkHealth(null);

        if (err instanceof Error && err.message.includes('sign out and sign back in')) {
          setError('Calendar connection expired. Please sign out and sign back in.');
        } else {
          setError('Unable to connect to Google Calendar. Please try refreshing the page or sign out and back in.');
        }
      }
    } finally {
      if (!isSilent) {
        setIsLoading(false);
        setIsAILoading(false);
      }
    }
  }, [session, status]);

  // Initial fetch — only once when authenticated
  useEffect(() => {
    if (status === 'authenticated' && session && !hasFetched.current) {
      hasFetched.current = true;
      console.log('🔄 Initial data load');
      fetchWorkHealth(0);
    }
  }, [session, status, fetchWorkHealth]);

  // Poll for calendar changes every 5 minutes
  useEffect(() => {
    if (status !== 'authenticated' || !session) return;

    pollTimer.current = setInterval(() => {
      console.log('🔄 Polling for calendar changes...');
      fetchWorkHealth(0, { silent: true });
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
      }
    };
  }, [session, status, fetchWorkHealth]);

  const refresh = () => {
    // Clear localStorage cache
    const generalCacheKey = getCacheKey();
    if (generalCacheKey) {
      localStorage.removeItem(generalCacheKey);
    }

    // Reset state and fetch fresh
    setWorkHealth(null);
    setError(null);
    setLastRefresh(new Date());
    calendarFingerprint.current = null;

    console.log('🔄 Manual refresh...');
    fetchWorkHealth(0);
  };

  return {
    workHealth,
    isLoading,
    isAILoading,
    error,
    lastRefresh,
    refresh,
    history,
    isAuthenticated: status === 'authenticated',
    hasAIInsights: !!workHealth?.ai && workHealth.aiStatus === 'success',
    aiInsights: workHealth?.ai,
    aiStatus: workHealth?.aiStatus || 'unavailable',
  };
};

// Export types for use in other components
export type {
  WorkHealthMetrics,
  MetricInsight,
  AIInsight,
  AIRecommendation,
  AIPersonalizedInsights,
  ScheduleAnalysis,
  WorkHealthBreakdown,
  HistoricalContext,
  Trend,
};
