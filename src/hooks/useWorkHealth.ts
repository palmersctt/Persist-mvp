import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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
}

export const useWorkHealth = () => {
  const { data: session, status } = useSession();
  const [workHealth, setWorkHealth] = useState<WorkHealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Helper function to get cache key for current user
  const getCacheKey = () => {
    if (!session?.user?.email) return null;
    return `persist-work-health-${session.user.email}`;
  };

  // Load cached data for this user on mount
  useEffect(() => {
    if (session?.user?.email && !workHealth) {
      const cacheKey = getCacheKey();
      if (cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const data = JSON.parse(cached);
            setWorkHealth(data.metrics);
            setLastRefresh(new Date(data.lastRefresh));
          } catch (e) {
            console.error('Error loading cached data:', e);
          }
        }
      }
    }
  }, [session?.user?.email]);

  const fetchWorkHealth = async () => {
    if (status !== 'authenticated' || !session) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/work-health', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setWorkHealth(data);
      setLastRefresh(new Date());
      
      // Save successful data to localStorage for this user
      const cacheKey = getCacheKey();
      if (cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify({
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
            usedCache = true;
          } catch (e) {
            console.error('Error loading cached data:', e);
          }
        }
      }
      
      // Only use generic mock data if no cached data exists
      if (!usedCache) {
        setWorkHealth({
          // New intelligent metrics
          adaptivePerformanceIndex: 55,
          cognitiveResilience: 40,
          workRhythmRecovery: 60,
          
          status: 'ESTIMATED',
          schedule: {
            meetingCount: 6,
            backToBackCount: 2,
            bufferTime: 30,
            durationHours: 7.5,
            fragmentationScore: 65
          },
          breakdown: {
            source: 'estimated',
            contributors: ['Adaptive Performance: 55% (Moderate)', 'Cognitive Resilience: 40% (Limited)', 'Sustainability Index: 60% (Good)'],
            primaryFactors: ['Performance estimated from limited data', 'Connect Google Calendar for personalized insights']
          },
          
          // Legacy fields
          readiness: 65,
          cognitiveAvailability: 45,
          focusTime: 45,
          meetingDensity: 6
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when session is available
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchWorkHealth();
    }
  }, [session, status]);

  const refresh = () => {
    fetchWorkHealth();
  };

  return {
    workHealth,
    isLoading,
    error,
    lastRefresh,
    refresh,
    isAuthenticated: status === 'authenticated',
  };
};