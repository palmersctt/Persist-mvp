import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface WorkHealthData {
  readiness: number;
  cognitiveLoad: number;
  focusTime: number;
  meetingDensity: number;
  status: string;
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
  readiness: number;
  cognitiveLoad: number;
  focusTime: number;
  meetingDensity: number;
  status: string;
  schedule: ScheduleAnalysis;
  breakdown: WorkHealthBreakdown;
}

export const useWorkHealth = () => {
  const { data: session, status } = useSession();
  const [workHealth, setWorkHealth] = useState<WorkHealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

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
    } catch (err) {
      console.error('Error fetching work health:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch work health data');
      
      // Fall back to mock data if API fails
      setWorkHealth({
        readiness: 65,
        cognitiveLoad: 55,
        focusTime: 45,
        meetingDensity: 6,
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
          contributors: ['Schedule Analysis: 6 meetings', 'Calendar Load: 7.5h workday', 'Limited data available'],
          primaryFactors: ['Performance estimated from limited data', 'Connect Google Calendar for personalized insights']
        }
      });
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