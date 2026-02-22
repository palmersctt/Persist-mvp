'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useWorkHealth } from '../hooks/useWorkHealth'
import ComicReliefSaying from './ComicReliefSaying'

interface SecondaryMetric {
  label: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'average' | 'needs_attention';
  icon: string;
}

interface WorkCapacityStatus {
  level: 'optimal' | 'excellent' | 'good' | 'moderate' | 'attention' | 'estimated';
  message: string;
  color: string;
  description: string;
}

export default function WorkHealthDashboard() {
  const { data: session, status } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('persist-onboarding-complete');
    }
    return false;
  });
  const [activeExplanation, setActiveExplanation] = useState<'performance' | 'resilience' | 'sustainability' | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'resilience' | 'sustainability'>('overview');
  
  const { workHealth, isLoading, isAILoading, error, lastRefresh, refresh, history } = useWorkHealth(activeTab);

  // Trend arrow helper
  const trendArrow = (trend?: 'up' | 'down' | 'flat') => {
    if (!trend || trend === 'flat') return '';
    return trend === 'up' ? ' ↑' : ' ↓';
  };

  const completeOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('persist-onboarding-complete', 'true');
    }
    setShowOnboarding(false);
  };

  // Helper function to safely format focus time and prevent timezone bugs
  const formatFocusTime = (focusTimeMinutes: number): { hours: number, minutes: number, isRealistic: boolean } => {
    const maxReasonableFocusTime = 480; // 8 hours max
    const minReasonableFocusTime = 0;   // 0 hours min

    const safeFocusTime = Math.max(minReasonableFocusTime, Math.min(maxReasonableFocusTime, focusTimeMinutes));
    const isRealistic = safeFocusTime === focusTimeMinutes;

    if (!isRealistic) {
      console.warn('🚨 FRONTEND - Unrealistic focus time detected and capped:', {
        originalFocusTime: focusTimeMinutes,
        cappedFocusTime: safeFocusTime,
        location: 'WorkHealthDashboard.tsx'
      });
    }

    return {
      hours: Math.floor(safeFocusTime / 60),
      minutes: Math.round(safeFocusTime % 60),
      isRealistic
    };
  };

  const getWorkCapacityStatus = (): WorkCapacityStatus => {
    if (!workHealth) {
      return {
        level: 'estimated',
        message: 'LOADING...',
        color: '#6b7280',
        description: 'Loading your work health analysis...'
      };
    }

    const adaptiveIndex = workHealth.adaptivePerformanceIndex;
    const isCached = workHealth.status === 'CACHED';
    const cached = isCached ? ' (CACHED)' : '';

    // 5-tier hierarchy aligned with googleCalendar.ts thresholds
    if (adaptiveIndex >= 85) {
      return {
        level: 'optimal',
        message: `OPTIMAL WORK HEALTH${cached}`,
        color: '#00ff88',
        description: 'You have the capacity for your hardest work today. Great day for strategic thinking, complex problems, and big decisions.'
      };
    } else if (adaptiveIndex >= 75) {
      return {
        level: 'excellent',
        message: `EXCELLENT WORK HEALTH${cached}`,
        color: '#25d366',
        description: 'Strong capacity with a sustainable schedule. Good day for challenging projects and creative work.'
      };
    } else if (adaptiveIndex >= 65) {
      return {
        level: 'good',
        message: `GOOD WORK HEALTH${cached}`,
        color: '#ffb347',
        description: 'Solid foundation with a balanced schedule. You can handle routine work and moderate complexity comfortably.'
      };
    } else if (adaptiveIndex >= 50) {
      return {
        level: 'moderate',
        message: `MODERATE WORK HEALTH${cached}`,
        color: '#ff9500',
        description: 'Your schedule is putting some strain on your capacity. Consider spacing out meetings or protecting a focus block.'
      };
    } else {
      return {
        level: 'attention',
        message: `NEEDS ATTENTION${cached}`,
        color: '#ff7744',
        description: 'Heavy schedule today. Focus on what matters most and try to create some breathing room between commitments.'
      };
    }
  };

  const getSecondaryMetrics = (): SecondaryMetric[] => {
    if (!workHealth) {
      return [
        { label: 'Cognitive Resilience', value: '—', status: 'average', icon: '🧠' },
        { label: 'Sustainability Index', value: '—', status: 'average', icon: '♻️' }
      ];
    }

    return [
      {
        label: 'Cognitive Resilience',
        value: workHealth.cognitiveResilience,
        unit: '%',
        status: workHealth.cognitiveResilience <= 40 ? 'needs_attention' : 
                workHealth.cognitiveResilience <= 75 ? 'average' : 'good',
        icon: '🧠'
      },
      {
        label: 'Sustainability Index',
        value: workHealth.workRhythmRecovery,
        unit: '%',
        status: workHealth.workRhythmRecovery <= 45 ? 'needs_attention' : 
                workHealth.workRhythmRecovery <= 70 ? 'average' : 'good',
        icon: '♻️'
      }
    ];
  };

  // Get per-metric insight directly from AI response
  const getMetricInsight = (metric: 'overview' | 'performance' | 'resilience' | 'sustainability') => {
    if (!workHealth?.ai) return null;

    // Read directly from per-metric fields
    const insight = workHealth.ai[metric];
    if (insight && insight.message) return insight;

    // Fallback to legacy insights array
    if (workHealth.ai.insights && workHealth.ai.insights.length > 0) {
      const first = workHealth.ai.insights[0];
      return { title: first.title, message: first.message, action: first.recommendation || '', severity: first.severity || 'info' as const };
    }

    return null;
  };

  if (status === 'loading') {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-white">Loading...</div>;
  }

  if (!session) {
    if (showOnboarding) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2 gradient-text">PERSIST</h1>
              <p className="text-gray-400">Your Work Health Intelligence Platform</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700 glass-effect">
              <h2 className="text-2xl font-bold mb-4 text-center">Work Health Intelligence</h2>
              <p className="text-gray-300 text-sm mb-6 text-center">Analyze your work patterns to optimize cognitive performance and prevent burnout</p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">📊</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Performance Index</h3>
                    <p className="text-gray-400 text-sm">How much capacity you have today for your best work — based on meeting load, focus blocks, and schedule flow</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">🧠</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Cognitive Resilience</h3>
                    <p className="text-gray-400 text-sm">How well you can handle tough decisions and context switches before mental fatigue sets in</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">♻️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Sustainability Index</h3>
                    <p className="text-gray-400 text-sm">Can you keep this pace up? Measures whether you have enough recovery time between demands to avoid burnout</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={completeOnboarding}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-semibold transition-colors smooth-bounce"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 gradient-text">PERSIST</h1>
            <p className="text-gray-400">Your Work Health Intelligence Platform</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700 glass-effect">
            <h2 className="text-xl font-bold mb-4">Start Your Work Health Analysis</h2>
            <p className="text-gray-400 text-sm mb-6">Connect your calendar to receive intelligent insights about your cognitive performance capacity, resilience, and work sustainability patterns.</p>
            
            <button
              onClick={() => signIn('google')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <span>🧠</span>
              <span>Analyze Work Patterns</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const workCapacity = getWorkCapacityStatus();
  const secondaryMetrics = getSecondaryMetrics();

  // Show error state if there's an error and no data
  if (error && !workHealth) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <header className="px-6 py-6 sticky top-0 z-40 bg-black/60 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <h1 className="text-lg font-medium tracking-wide" style={{ color: 'var(--text-primary)' }}>
              PERSIST
            </h1>
            <button
              onClick={() => signOut()}
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              style={{ 
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        </header>
        
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" 
                 style={{ backgroundColor: 'rgba(255,68,68,0.1)', border: '2px solid #ff4444' }}>
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Connection Issue
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              {error}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={refresh}
                disabled={isLoading}
                className="w-full px-6 py-3 font-medium rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'var(--whoop-green)',
                  color: '#000',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                {isLoading ? 'Retrying...' : 'Try Again'}
              </button>
              
              <button
                onClick={() => signOut()}
                className="w-full px-6 py-3 font-medium rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                Sign Out & Sign Back In
              </button>
            </div>
            
            <p className="text-xs mt-8" style={{ color: 'var(--text-muted)' }}>
              This usually happens when Google Calendar permissions need to be refreshed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Clean Header */}
      <header className="px-6 py-6 sticky top-0 z-40 bg-black/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-medium tracking-wide" style={{ color: 'var(--text-primary)' }}>
            PERSIST
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={refresh}
              disabled={isLoading}
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = isLoading ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)';
              }}
              style={{ 
                color: isLoading ? 'var(--text-muted)' : 'var(--text-secondary)',
                border: `1px solid ${isLoading ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
                backgroundColor: 'transparent',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Updating...' : 'Refresh'}
            </button>
            <button
              onClick={() => signOut()}
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              style={{ 
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Spacer (tab bar removed — navigate by clicking metrics) */}
      <div className="pt-8" />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 pb-12 space-y-16">
        
        {/* Overview Tab - All current content */}
        {activeTab === 'overview' && (
          <>
            {/* Hero Message Section */}
            <section className="text-center mb-12">
              <div className="max-w-2xl mx-auto">
                {!isLoading && !isAILoading && workHealth?.ai?.heroMessage ? (
                  typeof workHealth.ai.heroMessage === 'object' && workHealth.ai.heroMessage.quote ? (
                    <>
                      <h1 className="text-2xl md:text-3xl lg:text-4xl font-light mb-2 gradient-text leading-tight" style={{ opacity: 0.85 }}>
                        &ldquo;{workHealth.ai.heroMessage.quote}&rdquo;
                      </h1>
                      <p className="text-sm mt-2 mb-4 font-normal italic" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                        — {workHealth.ai.heroMessage.source}
                      </p>
                      <p className="text-sm md:text-base font-light leading-relaxed" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                        {workHealth.ai.heroMessage.subtitle}
                      </p>
                      {/* Temporary debug: shows whether quote came from AI or static fallback */}
                      <p className="text-xs mt-2" style={{ color: workHealth.aiStatus === 'success' ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)', opacity: 0.6 }}>
                        {workHealth.aiStatus === 'success' ? '✓ AI quote' : '⚠ fallback quote'}
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-light mb-4 gradient-text leading-tight">
                        {typeof workHealth.ai.heroMessage === 'string' ? workHealth.ai.heroMessage : "Today's your day to shine"}
                      </h1>
                      <p className="text-xs mt-2" style={{ color: 'rgba(239,68,68,0.5)', opacity: 0.6 }}>
                        ⚠ fallback (heroMessage is {typeof workHealth.ai.heroMessage}, quote: {String(workHealth.ai.heroMessage?.quote ?? 'undefined')}, aiStatus: {workHealth.aiStatus || 'none'})
                      </p>
                    </>
                  )
                ) : (
                  /* Loading skeleton for hero message */
                  <div className="animate-pulse">
                    <div className="h-10 md:h-12 lg:h-14 rounded-lg mx-auto mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.06)', maxWidth: '80%' }} />
                    <div className="h-4 rounded mx-auto mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.04)', maxWidth: '40%' }} />
                    <div className="h-3 rounded mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.03)', maxWidth: '50%' }} />
                  </div>
                )}
                {/* Always-visible debug: shows raw state */}
                <p className="text-xs mt-2" style={{ color: 'rgba(168,85,247,0.7)' }}>
                  DEBUG: loading={String(isLoading)}, aiLoading={String(isAILoading)}, hasAI={String(!!workHealth?.ai)}, heroType={workHealth?.ai?.heroMessage ? typeof workHealth.ai.heroMessage : 'none'}, aiStatus={workHealth?.aiStatus || 'none'}
                </p>
                <div className="w-16 h-0.5 mx-auto mt-4" style={{ backgroundColor: 'var(--whoop-green)', opacity: 0.6 }}></div>
              </div>
            </section>

            {/* Primary Work Capacity Metric */}
        <section className="text-center">
          
          {/* Dual Concentric Ring Visualization */}
          <div className="relative mx-auto mt-12 mb-8 w-full max-w-sm sm:max-w-md lg:max-w-lg" style={{ 
            width: '100%', 
            maxWidth: '400px',
            height: '280px',
            minHeight: '240px'
          }}>
            {/* SVG Ring System */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isLoading || isAILoading ? (
                /* Loading spinner rings */
                <svg
                  className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48"
                  viewBox="0 0 180 180"
                >
                  {/* Outer ring track */}
                  <circle cx="90" cy="90" r="75" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="12" />
                  {/* Outer ring spinner */}
                  <circle
                    cx="90" cy="90" r="75" fill="none"
                    stroke="#10b981" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray="120 351.2"
                    style={{ transformOrigin: 'center', animation: 'spin 1.4s linear infinite' }}
                  />
                  {/* Inner ring track */}
                  <circle cx="90" cy="90" r="55" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                  {/* Inner ring spinner */}
                  <circle
                    cx="90" cy="90" r="55" fill="none"
                    stroke="#3b82f6" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray="90 255.6"
                    style={{ transformOrigin: 'center', animation: 'spin 1.8s linear infinite reverse' }}
                  />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </svg>
              ) : (
                <svg
                  className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 transition-all duration-1000 ease-out"
                  viewBox="0 0 180 180"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  {/* Outer Ring Background */}
                  <circle
                    cx="90"
                    cy="90"
                    r="75"
                    fill="none"
                    stroke="rgba(16,185,129,0.2)"
                    strokeWidth="12"
                  />

                  {/* Outer Ring Progress (Performance Index) */}
                  <circle
                    cx="90"
                    cy="90"
                    r="75"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="471.2"
                    strokeDashoffset={471.2 * (1 - (workHealth?.adaptivePerformanceIndex || 0) / 100)}
                    className="transition-all duration-1000 ease-out"
                  />

                  {/* Inner Ring Background */}
                  <circle
                    cx="90"
                    cy="90"
                    r="55"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="10"
                  />

                  {/* Inner Ring Left Half (Cognitive Resilience) */}
                  <circle
                    cx="90"
                    cy="90"
                    r="55"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="172.8 172.8"
                    strokeDashoffset={172.8 * (1 - (workHealth?.cognitiveResilience || 0) / 100)}
                    className="transition-all duration-1000 ease-out"
                  />

                  {/* Inner Ring Right Half (Sustainability Index) */}
                  <circle
                    cx="90"
                    cy="90"
                    r="55"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${172.8 * (workHealth?.workRhythmRecovery || 0) / 100} 345.6`}
                    strokeDashoffset="-172.8"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
              )}
            </div>
            
            {/* External Labels - Clickable to navigate to detail views */}
            {/* Performance Index Label - 12 o'clock (Top) */}
            <div
              className="absolute text-center cursor-pointer transition-opacity duration-200 hover:opacity-80"
              style={{ left: '50%', top: '-30px', transform: 'translateX(-50%)' }}
              onClick={() => !(isLoading || isAILoading) && setActiveTab('performance')}
            >
              <div className={`text-2xl sm:text-3xl lg:text-4xl font-semibold ${(isLoading || isAILoading) ? 'animate-pulse' : ''}`} style={{
                color: '#10b981',
                lineHeight: '1'
              }}>
                {(isLoading || isAILoading) ? '...' : `${workHealth?.adaptivePerformanceIndex || 0}${trendArrow(history?.trend.performance)}`}
              </div>
              <div className="text-xs sm:text-sm uppercase leading-tight mt-1" style={{ color: '#10b981' }}>
                PERFORMANCE<br />INDEX
              </div>
              {history && (
                <div className="text-xs mt-1" style={{ color: '#10b981', opacity: 0.5 }}>
                  avg {history.weeklyAvg.performance}
                </div>
              )}
            </div>

            {/* Sustainability Index Label - 8 o'clock (Bottom Left) */}
            <div
              className="absolute text-center cursor-pointer transition-opacity duration-200 hover:opacity-80"
              style={{ left: '15%', bottom: '10px', transform: 'translateX(-50%)' }}
              onClick={() => !(isLoading || isAILoading) && setActiveTab('sustainability')}
            >
              <div className={`text-2xl sm:text-3xl lg:text-4xl font-semibold ${(isLoading || isAILoading) ? 'animate-pulse' : ''}`} style={{
                color: '#6b7280',
                lineHeight: '1'
              }}>
                {(isLoading || isAILoading) ? '...' : `${workHealth?.workRhythmRecovery || 0}${trendArrow(history?.trend.sustainability)}`}
              </div>
              <div className="text-xs sm:text-sm uppercase leading-tight mt-1" style={{ color: '#6b7280' }}>
                SUSTAINABILITY<br />INDEX
              </div>
              {history && (
                <div className="text-xs mt-1" style={{ color: '#6b7280', opacity: 0.5 }}>
                  avg {history.weeklyAvg.sustainability}
                </div>
              )}
            </div>

            {/* Cognitive Resilience Label - 4 o'clock (Bottom Right) */}
            <div
              className="absolute text-center cursor-pointer transition-opacity duration-200 hover:opacity-80"
              style={{ right: '15%', bottom: '10px', transform: 'translateX(50%)' }}
              onClick={() => !(isLoading || isAILoading) && setActiveTab('resilience')}
            >
              <div className={`text-2xl sm:text-3xl lg:text-4xl font-semibold ${(isLoading || isAILoading) ? 'animate-pulse' : ''}`} style={{
                color: '#3b82f6',
                lineHeight: '1'
              }}>
                {(isLoading || isAILoading) ? '...' : `${workHealth?.cognitiveResilience || 0}${trendArrow(history?.trend.resilience)}`}
              </div>
              <div className="text-xs sm:text-sm uppercase leading-tight mt-1" style={{ color: '#3b82f6' }}>
                COGNITIVE<br />RESILIENCE
              </div>
              {history && (
                <div className="text-xs mt-1" style={{ color: '#3b82f6', opacity: 0.5 }}>
                  avg {history.weeklyAvg.resilience}
                </div>
              )}
            </div>
          </div>
          
          {/* Score Explanation - positioned directly below the metric */}
          {activeExplanation === 'performance' && (
            <div 
              className="max-w-2xl mx-auto mt-4 mb-8 p-6 rounded-lg cursor-pointer hover:bg-opacity-80 transition-all duration-300 transform"
              onClick={() => setActiveExplanation(null)}
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
              ref={(el) => {
                if (el) {
                  setTimeout(() => {
                    el.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'nearest',
                      inline: 'center'
                    });
                  }, 100);
                }
              }}>
              <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                How much capacity you have today for your best work — based on meeting load, available focus blocks, and schedule flow.
              </p>

              {/* At-a-glance: one bar per metric */}
              <div className="space-y-5 mb-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium" style={{ color: '#10b981' }}>Performance</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{workHealth?.adaptivePerformanceIndex || 0}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded h-1.5">
                    <div className="h-1.5 rounded transition-all duration-700" style={{ width: `${workHealth?.adaptivePerformanceIndex || 0}%`, backgroundColor: '#10b981' }} />
                  </div>
                  <div className="mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {workHealth?.schedule?.meetingCount || 0} meetings, {formatFocusTime(workHealth?.focusTime || 0).hours}h {formatFocusTime(workHealth?.focusTime || 0).minutes}m focus time
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium" style={{ color: '#3b82f6' }}>Resilience</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{workHealth?.cognitiveResilience || 0}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded h-1.5">
                    <div className="h-1.5 rounded transition-all duration-700" style={{ width: `${workHealth?.cognitiveResilience || 0}%`, backgroundColor: '#3b82f6' }} />
                  </div>
                  <div className="mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {workHealth?.schedule?.uniqueContexts || 0} context switches, {workHealth?.schedule?.longestStretch || 0} longest chain
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium" style={{ color: '#6b7280' }}>Sustainability</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{workHealth?.workRhythmRecovery || 0}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded h-1.5">
                    <div className="h-1.5 rounded transition-all duration-700" style={{ width: `${workHealth?.workRhythmRecovery || 0}%`, backgroundColor: '#6b7280' }} />
                  </div>
                  <div className="mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {workHealth?.schedule?.adequateBreaks || 0} recovery breaks, {workHealth?.schedule?.durationHours || 0}h committed
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-center" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                Tap a metric above for the full breakdown
              </p>
            </div>
          )}
          
        </section>

        {/* Insights Section */}
        <section>
          <div className="mb-8 text-center">
            <h2 className="whoop-section-title">
              Insights
            </h2>
          </div>
          
          <div>
            {(() => {
              const insight = getMetricInsight('overview');
              if (!insight) return (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {error ? `Error loading insights: ${error}` : 'Loading insights from your calendar...'}
                  </p>
                </div>
              );
              return (
                <div className={`text-center transition-opacity duration-300 ${isAILoading ? 'opacity-50' : ''}`}>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {insight.message}
                  </p>
                  {insight.action && (
                    <p className="text-sm mt-3 leading-relaxed" style={{ color: '#10b981', opacity: 0.85 }}>
                      {insight.action}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </section>

            {lastRefresh && (
              <div className="text-center pt-8">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Last updated {lastRefresh.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            )}
          </>
        )}

        {/* Performance Index Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-16">
            <button onClick={() => setActiveTab('overview')} className="flex items-center space-x-2 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              <span>&larr;</span><span>Back to Overview</span>
            </button>
            {/* Large Performance Index Ring */}
            <section className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <svg className="w-full h-full whoop-progress-ring" viewBox="0 0 120 120">
                  <circle 
                    cx="60" cy="60" r="54" 
                    fill="none" 
                    stroke="rgba(16,185,129,0.2)" 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="60" cy="60" r="54" 
                    fill="none" 
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray="339.29" 
                    strokeDashoffset={(339.29 - (workHealth?.adaptivePerformanceIndex || 0) / 100 * 339.29)} 
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className={`text-5xl font-light mb-1 transition-all duration-500 ${isLoading ? 'opacity-50' : ''}`} style={{ 
                      color: '#10b981',
                      fontFeatureSettings: '"tnum"',
                      letterSpacing: '-0.04em'
                    }}>
                      {isLoading ? '—' : `${workHealth?.adaptivePerformanceIndex || 0}`}
                    </div>
                    <div className="text-center">
                      <div className="whoop-metric-label" style={{ fontSize: '0.65rem', lineHeight: '1' }}>
                        PERFORMANCE
                      </div>
                      <div className="whoop-metric-label" style={{ fontSize: '0.65rem', lineHeight: '1', marginTop: '2px' }}>
                        INDEX
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              
              {/* Performance Breakdown - Always visible */}
              <div 
                className="max-w-2xl mx-auto mt-4 mb-8 p-6 rounded-lg"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  How much capacity you have today for your best work — based on meeting load, available focus blocks, and schedule flow.
                </p>

                {/* Performance Components — unique to this metric's calculation */}
                <div className="space-y-5 mb-6">
                  {/* Meeting Density (25% weight) */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Meeting Density
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {(workHealth?.schedule?.meetingCount || 0) <= 2 ? 'Light' :
                         (workHealth?.schedule?.meetingCount || 0) <= 4 ? 'Moderate' : 'Heavy'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div className="h-1.5 rounded transition-all duration-700" style={{
                        width: `${Math.max(25, 100 - ((workHealth?.schedule?.meetingCount || 0) * 15))}%`,
                        backgroundColor: '#10b981'
                      }} />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {workHealth?.schedule?.meetingCount || 0} meetings competing for your attention
                      </span>
                    </div>
                  </div>

                  {/* Focus Fragmentation (30% weight) */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Deep Work Blocks
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {formatFocusTime(workHealth?.focusTime || 0).hours >= 4 ? 'Plenty' :
                         formatFocusTime(workHealth?.focusTime || 0).hours >= 2 ? 'Some' : 'Scarce'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div className="h-1.5 rounded transition-all duration-700" style={{
                        width: `${Math.min(100, formatFocusTime(workHealth?.focusTime || 0).hours * 22)}%`,
                        backgroundColor: '#10b981'
                      }} />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatFocusTime(workHealth?.focusTime || 0).hours}h {formatFocusTime(workHealth?.focusTime || 0).minutes}m available for uninterrupted work
                      </span>
                    </div>
                  </div>

                  {/* Timing Alignment (10% weight) */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Meeting Timing
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {(workHealth?.schedule?.afternoonMeetings || 0) > (workHealth?.schedule?.morningMeetings || 0) * 1.5 ? 'Afternoon-heavy' :
                         (workHealth?.schedule?.morningMeetings || 0) > 0 && (workHealth?.schedule?.afternoonMeetings || 0) > 0 ? 'Spread out' : 'Well-timed'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div className="h-1.5 rounded transition-all duration-700" style={{
                        width: `${(workHealth?.schedule?.afternoonMeetings || 0) > (workHealth?.schedule?.morningMeetings || 0) * 1.5 ? 40 :
                                  (workHealth?.schedule?.afternoonMeetings || 0) > (workHealth?.schedule?.morningMeetings || 0) ? 70 : 100}%`,
                        backgroundColor: '#10b981'
                      }} />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {workHealth?.schedule?.morningMeetings || 0} morning, {workHealth?.schedule?.afternoonMeetings || 0} afternoon
                      </span>
                    </div>
                  </div>

                  {/* Meeting-to-Work Ratio (15% weight) */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Calendar Commitment
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {(workHealth?.schedule?.meetingRatio || 0) <= 0.3 ? 'Light' :
                         (workHealth?.schedule?.meetingRatio || 0) <= 0.5 ? 'Moderate' : 'Heavy'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div className="h-1.5 rounded transition-all duration-700" style={{
                        width: `${Math.max(15, 100 - ((workHealth?.schedule?.meetingRatio || 0) * 100))}%`,
                        backgroundColor: '#10b981'
                      }} />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {workHealth?.schedule?.durationHours || 0}h of your day is in meetings ({Math.round((workHealth?.schedule?.meetingRatio || 0) * 100)}%)
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Performance Insights */}
                <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                  <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Performance Insights
                  </h4>
                  {isAILoading && activeTab === 'performance' ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Loading insights...
                        </span>
                      </div>
                    </div>
                  ) : (() => {
                    const insight = getMetricInsight('performance');
                    if (!insight) return <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>No insights available</p>;
                    return (
                      <div className="text-center">
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {insight.message}
                        </p>
                        {insight.action && (
                          <p className="text-xs mt-2 leading-relaxed" style={{ color: '#10b981', opacity: 0.85 }}>
                            {insight.action}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Cognitive Resilience Tab */}
        {activeTab === 'resilience' && (
          <div className="space-y-16">
            <button onClick={() => setActiveTab('overview')} className="flex items-center space-x-2 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              <span>&larr;</span><span>Back to Overview</span>
            </button>
            {/* Large Cognitive Resilience Ring */}
            <section className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <svg className="w-full h-full whoop-progress-ring" viewBox="0 0 120 120">
                  <circle 
                    cx="60" cy="60" r="54" 
                    fill="none" 
                    stroke="rgba(59,130,246,0.2)" 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="60" cy="60" r="54" 
                    fill="none" 
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeDasharray="339.29" 
                    strokeDashoffset={(339.29 - (workHealth?.cognitiveResilience || 0) / 100 * 339.29)} 
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className={`text-5xl font-light mb-1 transition-all duration-500 ${isLoading ? 'opacity-50' : ''}`} style={{ 
                      color: '#3b82f6',
                      fontFeatureSettings: '"tnum"',
                      letterSpacing: '-0.04em'
                    }}>
                      {isLoading ? '—' : `${workHealth?.cognitiveResilience || 0}`}
                    </div>
                    <div className="text-center">
                      <div className="whoop-metric-label" style={{ fontSize: '0.65rem', lineHeight: '1' }}>
                        COGNITIVE
                      </div>
                      <div className="whoop-metric-label" style={{ fontSize: '0.65rem', lineHeight: '1', marginTop: '2px' }}>
                        RESILIENCE
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              
              {/* Cognitive Resilience Breakdown - Always visible */}
              <div 
                className="max-w-2xl mx-auto mt-4 mb-8 p-6 rounded-lg"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  How well you can handle tough decisions and context switches today — before mental fatigue sets in.
                </p>

                {/* Cognitive Resilience Components — unique to this metric */}
                <div className="space-y-5 mb-6">
                  {/* Context Switching (unique contexts) */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Context Switching
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {(workHealth?.schedule?.uniqueContexts || 0) <= 3 ? 'Low' :
                         (workHealth?.schedule?.uniqueContexts || 0) <= 5 ? 'Moderate' : 'High'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div className="h-1.5 rounded transition-all duration-700" style={{
                        width: `${Math.max(20, 100 - ((workHealth?.schedule?.uniqueContexts || 0) * 12))}%`,
                        backgroundColor: '#3b82f6'
                      }} />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {workHealth?.schedule?.uniqueContexts || 0} different contexts your brain has to shift between
                      </span>
                    </div>
                  </div>

                  {/* Decision Fatigue (afternoon-weighted meetings) */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Decision Fatigue Risk
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {(workHealth?.schedule?.afternoonMeetings || 0) <= 1 ? 'Low' :
                         (workHealth?.schedule?.afternoonMeetings || 0) <= 3 ? 'Moderate' : 'High'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div className="h-1.5 rounded transition-all duration-700" style={{
                        width: `${Math.max(20, 100 - ((workHealth?.schedule?.afternoonMeetings || 0) * 20))}%`,
                        backgroundColor: '#3b82f6'
                      }} />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {workHealth?.schedule?.afternoonMeetings || 0} afternoon meetings when willpower is lower
                      </span>
                    </div>
                  </div>

                  {/* Longest Consecutive Stretch */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Longest Meeting Chain
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {(workHealth?.schedule?.longestStretch || 0) <= 1 ? 'None' :
                         (workHealth?.schedule?.longestStretch || 0) <= 2 ? 'Short' : 'Long'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div className="h-1.5 rounded transition-all duration-700" style={{
                        width: `${Math.max(20, 100 - ((workHealth?.schedule?.longestStretch || 0) * 25))}%`,
                        backgroundColor: '#3b82f6'
                      }} />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {(workHealth?.schedule?.longestStretch || 0) <= 1 ? 'No back-to-back chains' :
                         `${workHealth?.schedule?.longestStretch} meetings in a row without a real break`}
                      </span>
                    </div>
                  </div>

                  {/* Cognitive Reserve (focus time for recharging) */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Cognitive Reserve
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {formatFocusTime(workHealth?.focusTime || 0).hours >= 4 ? 'Strong' :
                         formatFocusTime(workHealth?.focusTime || 0).hours >= 2 ? 'Moderate' : 'Low'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div className="h-1.5 rounded transition-all duration-700" style={{
                        width: `${Math.min(100, formatFocusTime(workHealth?.focusTime || 0).hours * 22)}%`,
                        backgroundColor: '#3b82f6'
                      }} />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatFocusTime(workHealth?.focusTime || 0).hours}h {formatFocusTime(workHealth?.focusTime || 0).minutes}m of quiet time to recharge between demands
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Resilience Insights */}
                <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                  <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Resilience Insights
                  </h4>
                  {isAILoading && activeTab === 'resilience' ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Loading insights...
                        </span>
                      </div>
                    </div>
                  ) : (() => {
                    const insight = getMetricInsight('resilience');
                    if (!insight) return <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>No insights available</p>;
                    return (
                      <div className="text-center">
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {insight.message}
                        </p>
                        {insight.action && (
                          <p className="text-xs mt-2 leading-relaxed" style={{ color: '#10b981', opacity: 0.85 }}>
                            {insight.action}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Sustainability Index Tab */}
        {activeTab === 'sustainability' && (
          <div className="space-y-16">
            <button onClick={() => setActiveTab('overview')} className="flex items-center space-x-2 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              <span>&larr;</span><span>Back to Overview</span>
            </button>
            {/* Large Sustainability Index Ring */}
            <section className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <svg className="w-full h-full whoop-progress-ring" viewBox="0 0 120 120">
                  <circle 
                    cx="60" cy="60" r="54" 
                    fill="none" 
                    stroke="rgba(107,114,128,0.2)" 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="60" cy="60" r="54" 
                    fill="none" 
                    stroke="#6b7280"
                    strokeWidth="8"
                    strokeDasharray="339.29" 
                    strokeDashoffset={(339.29 - (workHealth?.workRhythmRecovery || 0) / 100 * 339.29)} 
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className={`text-5xl font-light mb-1 transition-all duration-500 ${isLoading ? 'opacity-50' : ''}`} style={{ 
                      color: '#6b7280',
                      fontFeatureSettings: '"tnum"',
                      letterSpacing: '-0.04em'
                    }}>
                      {isLoading ? '—' : `${workHealth?.workRhythmRecovery || 0}`}
                    </div>
                    <div className="text-center">
                      <div className="whoop-metric-label" style={{ fontSize: '0.65rem', lineHeight: '1' }}>
                        SUSTAINABILITY
                      </div>
                      <div className="whoop-metric-label" style={{ fontSize: '0.65rem', lineHeight: '1', marginTop: '2px' }}>
                        INDEX
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              
              {/* Sustainability Breakdown - Always visible */}
              <div 
                className="max-w-2xl mx-auto mt-4 mb-8 p-6 rounded-lg"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Can you keep this pace up? Measures whether you have enough recovery time between demands to avoid burnout.
                </p>

                {/* Sustainability Components — unique to this metric */}
                <div className="space-y-5 mb-6">
                  {/* Morning/Afternoon Balance */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Day Balance
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {Math.abs((workHealth?.schedule?.morningMeetings || 0) - (workHealth?.schedule?.afternoonMeetings || 0)) <= 1 ? 'Balanced' :
                         (workHealth?.schedule?.afternoonMeetings || 0) > (workHealth?.schedule?.morningMeetings || 0) ? 'Afternoon-loaded' : 'Morning-loaded'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div className="h-1.5 rounded transition-all duration-700" style={{
                        width: `${Math.max(30, 100 - Math.abs((workHealth?.schedule?.morningMeetings || 0) - (workHealth?.schedule?.afternoonMeetings || 0)) * 20)}%`,
                        backgroundColor: '#6b7280'
                      }} />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {workHealth?.schedule?.morningMeetings || 0} morning vs {workHealth?.schedule?.afternoonMeetings || 0} afternoon meetings
                      </span>
                    </div>
                  </div>

                  {/* Break Adequacy */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Recovery Breaks
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {(workHealth?.schedule?.adequateBreaks || 0) >= 3 ? 'Plenty' :
                         (workHealth?.schedule?.adequateBreaks || 0) >= 1 ? 'Some' : 'None'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div className="h-1.5 rounded transition-all duration-700" style={{
                        width: `${Math.min(100, (workHealth?.schedule?.adequateBreaks || 0) * 25 + (workHealth?.schedule?.shortBreaks || 0) * 12)}%`,
                        backgroundColor: '#6b7280'
                      }} />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {workHealth?.schedule?.adequateBreaks || 0} real breaks (30+ min) and {workHealth?.schedule?.shortBreaks || 0} short pauses
                      </span>
                    </div>
                  </div>

                  {/* Work Intensity */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Work Intensity
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {(workHealth?.schedule?.durationHours || 0) <= 3 ? 'Sustainable' :
                         (workHealth?.schedule?.durationHours || 0) <= 5 ? 'Moderate' : 'Unsustainable'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div className="h-1.5 rounded transition-all duration-700" style={{
                        width: `${Math.max(15, 100 - ((workHealth?.schedule?.durationHours || 0) * 15))}%`,
                        backgroundColor: '#6b7280'
                      }} />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {workHealth?.schedule?.durationHours || 0}h locked into meetings today
                      </span>
                    </div>
                  </div>

                  {/* Off-Hours Meetings */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Boundary Health
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {(workHealth?.schedule?.earlyLateMeetings || 0) === 0 ? 'Clean' :
                         (workHealth?.schedule?.earlyLateMeetings || 0) <= 1 ? 'Minor' : 'Overextended'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div className="h-1.5 rounded transition-all duration-700" style={{
                        width: `${Math.max(20, 100 - ((workHealth?.schedule?.earlyLateMeetings || 0) * 30))}%`,
                        backgroundColor: '#6b7280'
                      }} />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {(workHealth?.schedule?.earlyLateMeetings || 0) === 0
                          ? 'All meetings within core hours'
                          : `${workHealth?.schedule?.earlyLateMeetings} meeting${(workHealth?.schedule?.earlyLateMeetings || 0) > 1 ? 's' : ''} before 7am or after 5pm`}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Sustainability Insights */}
                <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                  <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Sustainability Insights
                  </h4>
                  {isAILoading && activeTab === 'sustainability' ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Loading insights...
                        </span>
                      </div>
                    </div>
                  ) : (() => {
                    const insight = getMetricInsight('sustainability');
                    if (!insight) return <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>No insights available</p>;
                    return (
                      <div className="text-center">
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {insight.message}
                        </p>
                        {insight.action && (
                          <p className="text-xs mt-2 leading-relaxed" style={{ color: '#10b981', opacity: 0.85 }}>
                            {insight.action}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </section>

          </div>
        )}

      </div>
    </div>
  )
}