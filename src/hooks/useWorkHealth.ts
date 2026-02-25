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

interface HeroMessage {
  quote: string;
  source: string;
  subtitle: string;
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
  heroMessage?: string | HeroMessage;
  heroMessages?: HeroMessage[];
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
  aiStatus?: 'success' | 'fallback' | 'unavailable' | 'local';
  _aiError?: string;
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

export const useWorkHealth = (_tabType?: 'overview' | 'performance' | 'resilience' | 'sustainability') => {
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

  const getQuoteHistoryKey = () => {
    if (!session?.user?.email) return null;
    return `persist-quote-history-${session.user.email}`;
  };

  const getEngagementKey = () => {
    if (!session?.user?.email) return null;
    return `persist-engagement-${session.user.email}`;
  };

  // Get recent quotes from localStorage (last 20, within 3 days)
  const getRecentQuotes = (): string[] => {
    const key = getQuoteHistoryKey();
    if (!key) return [];
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const entries: { quote: string; timestamp: string }[] = JSON.parse(raw);
      const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
      return entries
        .filter(e => new Date(e.timestamp).getTime() > cutoff)
        .map(e => e.quote);
    } catch {
      return [];
    }
  };

  // Save a quote to history
  const saveQuoteToHistory = (quote: string) => {
    const key = getQuoteHistoryKey();
    if (!key || !quote) return;
    try {
      const raw = localStorage.getItem(key);
      let entries: { quote: string; timestamp: string }[] = raw ? JSON.parse(raw) : [];
      // Deduplicate
      entries = entries.filter(e => e.quote !== quote);
      entries.push({ quote, timestamp: new Date().toISOString() });
      // Keep last 20
      if (entries.length > 20) entries = entries.slice(-20);
      localStorage.setItem(key, JSON.stringify(entries));
    } catch {
      // Ignore storage errors
    }
  };

  // --- Engagement tracking ---
  interface EngagementEntry {
    quote: string;
    source: string;
    action: 'share' | 'dwell';
    dwellMs?: number;
    timestamp: string;
  }

  const getEngagementData = (): { sharedQuotes: string[]; dwellFavorites: string[]; favoriteGenres: string[] } => {
    const key = getEngagementKey();
    if (!key) return { sharedQuotes: [], dwellFavorites: [], favoriteGenres: [] };
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return { sharedQuotes: [], dwellFavorites: [], favoriteGenres: [] };
      const entries: EngagementEntry[] = JSON.parse(raw);
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
      const recent = entries.filter(e => new Date(e.timestamp).getTime() > cutoff);

      const sharedQuotes = [...new Set(recent.filter(e => e.action === 'share').map(e => e.quote))].slice(-10);
      // Dwell favorites: quotes user spent 8+ seconds on (read them carefully)
      const dwellFavorites = [...new Set(
        recent
          .filter(e => e.action === 'dwell' && (e.dwellMs || 0) >= 8000)
          .sort((a, b) => (b.dwellMs || 0) - (a.dwellMs || 0))
          .map(e => e.quote)
      )].slice(-10);

      // Infer genre preferences from sources they engaged with
      const genreHints: Record<string, number> = {};
      for (const e of recent) {
        const src = (e.source || '').toLowerCase();
        if (src.includes('standup') || src.includes('special') || src.includes('comedy')) genreHints['standup'] = (genreHints['standup'] || 0) + 1;
        if (src.includes('office') || src.includes('succession') || src.includes('bear') || src.includes('severance')) genreHints['workplace TV'] = (genreHints['workplace TV'] || 0) + 1;
        if (/\b(book|novel|poem|song|lyric)\b/.test(src)) genreHints['literature/music'] = (genreHints['literature/music'] || 0) + 1;
        // Generic film/TV
        if (!Object.values(genreHints).length) genreHints['film/TV'] = (genreHints['film/TV'] || 0) + 1;
      }
      const favoriteGenres = Object.entries(genreHints)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre]) => genre);

      return { sharedQuotes, dwellFavorites, favoriteGenres };
    } catch {
      return { sharedQuotes: [], dwellFavorites: [], favoriteGenres: [] };
    }
  };

  const trackEngagement = useCallback((quote: string, source: string, action: 'share' | 'dwell', dwellMs?: number) => {
    const key = getEngagementKey();
    if (!key || !quote) return;
    try {
      const raw = localStorage.getItem(key);
      let entries: EngagementEntry[] = raw ? JSON.parse(raw) : [];
      entries.push({ quote, source, action, dwellMs, timestamp: new Date().toISOString() });
      // Keep last 200 entries
      if (entries.length > 200) entries = entries.slice(-200);
      localStorage.setItem(key, JSON.stringify(entries));
    } catch {
      // Ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Create a fingerprint from calendar metrics to detect real changes
  const getFingerprint = (data: WorkHealthMetrics): string => {
    return `${data.schedule?.meetingCount}-${data.schedule?.backToBackCount}-${data.schedule?.durationHours}-${data.adaptivePerformanceIndex}-${data.cognitiveResilience}-${data.workRhythmRecovery}`;
  };

  // Once quotes are displayed, lock them so background updates don't override mid-read
  const quotesLocked = useRef(false);

  const buildFetchUrl = () => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params = new URLSearchParams({
      _t: String(Date.now()),
      timezone: userTimezone,
    });
    return { url: `/api/work-health?${params}`, userTimezone };
  };

  const buildFetchHeaders = (userTimezone: string) => {
    const recentQuotes = getRecentQuotes();
    const engagement = getEngagementData();
    return {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'X-User-Timezone': userTimezone,
      ...(recentQuotes.length > 0 && {
        'X-Recent-Quotes': encodeURIComponent(JSON.stringify(recentQuotes))
      }),
      ...((engagement.sharedQuotes.length > 0 || engagement.dwellFavorites.length > 0 || engagement.favoriteGenres.length > 0) && {
        'X-User-Engagement': encodeURIComponent(JSON.stringify(engagement))
      })
    };
  };

  const handleFetchSuccess = (data: WorkHealthMetrics, preserveQuotes = false) => {
    calendarFingerprint.current = getFingerprint(data);

    if (preserveQuotes && quotesLocked.current) {
      // Update metrics + insights but keep the quotes the user is reading
      setWorkHealth(prev => {
        if (!prev?.ai?.heroMessages || !data.ai) return data;
        return {
          ...data,
          ai: {
            ...data.ai,
            heroMessage: prev.ai.heroMessage,
            heroMessages: prev.ai.heroMessages,
          }
        } as WorkHealthMetrics;
      });
    } else {
      setWorkHealth(data);
      if ((data.ai?.heroMessages?.length ?? 0) > 0) {
        quotesLocked.current = true;
      }
    }

    setLastRefresh(new Date());
    updateHistory(data);

    // Track NEW quotes for repeat avoidance (skip if preserving)
    if (!preserveQuotes) {
      if (data.ai?.heroMessages && Array.isArray(data.ai.heroMessages)) {
        data.ai.heroMessages.forEach((msg: HeroMessage) => {
          if (msg.quote) saveQuoteToHistory(msg.quote);
        });
      } else if (data.ai?.heroMessage && typeof data.ai.heroMessage === 'object' && data.ai.heroMessage.quote) {
        saveQuoteToHistory(data.ai.heroMessage.quote);
      }
    }

    // Always save ORIGINAL (unmerged) data to cache — next visit gets fresh quotes
    const generalCacheKey = getCacheKey();
    if (generalCacheKey) {
      localStorage.setItem(generalCacheKey, JSON.stringify({
        metrics: data,
        lastRefresh: new Date().toISOString()
      }));
    }
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
      // Single API call — server handles AI timeout + local fallback internally
      const { url, userTimezone } = buildFetchUrl();
      console.log(`🔄 Fetching work health${isSilent ? ' (background poll)' : ''}...`);

      const response = await fetch(url, {
        cache: 'no-cache',
        headers: buildFetchHeaders(userTimezone),
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

      // For silent polls, only continue if calendar data changed
      if (isSilent && calendarFingerprint.current === newFingerprint) {
        console.log('📊 Background poll: no calendar changes detected');
        return;
      }

      // Only preserve quotes on background polls — initial fetch should always show fresh AI
      const shouldPreserveQuotes = isSilent && quotesLocked.current;
      handleFetchSuccess(data, shouldPreserveQuotes);

      console.log(`✅ Work health loaded (${data.aiStatus || 'unknown'})`);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  // Cache-first: show cached data instantly while fresh data loads
  useEffect(() => {
    if (status !== 'authenticated' || !session) return;
    const cacheKey = getCacheKey();
    if (cacheKey && !workHealth) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          setWorkHealth(data.metrics);
          setLastRefresh(new Date(data.lastRefresh));
          // Don't lock — cache is just a loading placeholder, fresh API should replace it
          console.log('⚡ Showing cached data instantly');
        }
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Reset state and unlock quotes for fresh data
    setWorkHealth(null);
    setError(null);
    setLastRefresh(new Date());
    calendarFingerprint.current = null;
    quotesLocked.current = false;

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
    trackEngagement,
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
  HeroMessage,
  AIInsight,
  AIRecommendation,
  AIPersonalizedInsights,
  ScheduleAnalysis,
  WorkHealthBreakdown,
  HistoricalContext,
  Trend,
};
