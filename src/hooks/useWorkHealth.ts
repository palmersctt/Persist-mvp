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

  // Remove automatic cache loading - only load cache on API failure

  const fetchWorkHealth = async (retryCount = 0) => {
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
        const errorData = await response.json().catch(() => ({}));
        
        // Check if this is a token refresh error
        if (errorData.needsReauth) {
          throw new Error('Please sign out and sign back in to refresh your Google Calendar connection');
        }
        
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
            fetchWorkHealth(1); // Retry once
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
    }
  };

  // Fetch data when session is available
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchWorkHealth();
    }
  }, [session, status]);

  const refresh = () => {
    // Clear current data and error state to force fresh load
    setWorkHealth(null);
    setError(null);
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