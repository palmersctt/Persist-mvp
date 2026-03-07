'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useWorkHealth } from '../hooks/useWorkHealth'
import ShareCard from './ShareCard'
import SwipeableQuoteCards from './SwipeableQuoteCards'
import PersistLogo from './PersistLogo'
import { detectMood } from '../lib/mood'
import { trackEvent } from '../lib/trackEvent'
import { toPng } from 'html-to-image'

export default function WorkHealthDashboard() {
  const { data: session, status } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('persist-onboarding-complete');
    }
    return false;
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'resilience' | 'sustainability'>('overview');
  const [shareState, setShareState] = useState<'idle' | 'generating'>('idle');
  const [showProfile, setShowProfile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { workHealth, isLoading, isAILoading, error, lastRefresh, refresh, trackEngagement, aiStatus } = useWorkHealth(activeTab);

  const [loadingVerb, setLoadingVerb] = useState('Judging');
  const [dotCount, setDotCount] = useState(1);
  const [verbVisible, setVerbVisible] = useState(true);
  const verbIndexRef = useRef(0);
  const shuffledRef = useRef<string[]>([]);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!showProfile) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showProfile]);

  useEffect(() => {
    if (!isLoading) return;
    const verbs = [
      'Judging', 'Snooping', 'Squinting', 'Overthinking',
      'Spiraling', 'Procrastinating', 'Panicking', 'Manifesting',
      'Bargaining', 'Regretting', 'Stress-eating', 'Dissociating',
      'Catastrophizing', 'Vibing', 'Coping', 'Gasping',
      'Whispering', 'Stalling', 'Pacing', 'Doom-scrolling',
    ];
    shuffledRef.current = [...verbs].sort(() => Math.random() - 0.5);
    verbIndexRef.current = 0;
    setLoadingVerb(shuffledRef.current[0]);
    setDotCount(1);
    setVerbVisible(true);

    // Animate dots: cycle 1 → 2 → 3 every 400ms
    const dotId = setInterval(() => {
      setDotCount(d => (d % 3) + 1);
    }, 400);

    // Swap verb every 2.8s with fade
    const verbId = setInterval(() => {
      setVerbVisible(false);
      setTimeout(() => {
        verbIndexRef.current = (verbIndexRef.current + 1) % shuffledRef.current.length;
        setLoadingVerb(shuffledRef.current[verbIndexRef.current]);
        setDotCount(1);
        setVerbVisible(true);
      }, 300);
    }, 2800);

    return () => { clearInterval(dotId); clearInterval(verbId); };
  }, [isLoading]);

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

  const handleShare = useCallback(async () => {
    if (shareState === 'generating' || !cardRef.current) return;

    // Track the shared quote for personalization
    if (workHealth?.ai?.heroMessages && trackEngagement) {
      // We don't know exact card index from here, but the current visible card is what they're sharing
      const heroMsgs = workHealth.ai.heroMessages;
      if (heroMsgs.length > 0) {
        // The card ref points to whatever's currently visible
        const firstQuote = heroMsgs[0];
        trackEngagement(firstQuote.quote, firstQuote.source, 'share');
        trackEvent('card_share', { quote: firstQuote.quote, source: firstQuote.source });
      }
    }

    setShareState('generating');

    try {
      // Capture the actual rendered card at 3x resolution for crisp sharing
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        quality: 1,
      });

      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'persist-today.png', { type: 'image/png' });

      // Try native share (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          setShareState('idle');
          return;
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') {
            setShareState('idle');
            return;
          }
        }
      }

      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'persist-today.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Share failed:', err);
    }

    setShareState('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareState]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3">
            <PersistLogo size={28} variant="light" />
            <span className="text-2xl font-semibold text-white" style={{ letterSpacing: '1.5px' }}>Persistwork</span>
          </div>
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    if (showOnboarding) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <PersistLogo size={28} variant="light" />
                <span className="text-2xl font-semibold text-white" style={{ letterSpacing: '1.5px' }}>Persistwork</span>
              </div>
              <p className="text-gray-500 text-sm">Your calendar has a lot to say about you</p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700 glass-effect">
              <h2 className="text-xl font-semibold mb-3 text-center text-white">Here&apos;s what you get</h2>
              <p className="text-gray-400 text-sm mb-6 text-center">Three scores from your calendar and a movie quote your day deserves</p>

              <div className="space-y-5 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}>
                    <span className="text-sm font-bold" style={{ color: '#10b981' }}>F</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">Focus</h3>
                    <p className="text-gray-400 text-sm">How close you are to hiding in a conference room with your laptop</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
                    <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>S</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">Strain</h3>
                    <p className="text-gray-400 text-sm">How close you are to faking a dentist appointment</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(107,114,128,0.15)' }}>
                    <span className="text-sm font-bold" style={{ color: '#6b7280' }}>B</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">Balance</h3>
                    <p className="text-gray-400 text-sm">How long until your body sends you an out-of-office</p>
                  </div>
                </div>
              </div>

              <button
                onClick={completeOnboarding}
                className="w-full bg-white text-gray-900 py-4 px-6 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
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
          <div className="mb-8 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <PersistLogo size={28} variant="light" />
              <span className="text-2xl font-semibold text-white" style={{ letterSpacing: '1.5px' }}>Persistwork</span>
            </div>
            <p className="text-gray-500 text-sm">Your calendar has a lot to say about you</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700 glass-effect">
            <h2 className="text-lg font-semibold mb-3 text-white">Connect your calendar</h2>
            <p className="text-gray-400 text-sm mb-6">We read your schedule and find the movie quote your day deserves. Takes 10 seconds.</p>

            <button
              onClick={() => signIn('google')}
              className="w-full bg-white text-gray-900 py-3 px-6 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an error and no data
  if (error && !workHealth) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <header className="px-6 py-6 sticky top-0 z-40 bg-black/60 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <PersistLogo size={24} variant="light" />
              <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '1.5px' }}>Persistwork</span>
            </div>
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
          <div className="flex items-center gap-2">
            <PersistLogo size={24} variant="light" />
            <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '1.5px' }}>Persistwork</span>
          </div>
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
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="w-8 h-8 rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-105"
                style={{ borderColor: showProfile ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)' }}
              >
                {session?.user?.image ? (
                  <img src={session.user.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                    {session?.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </button>
              {showProfile && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-xl overflow-hidden shadow-2xl z-50"
                  style={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-3">
                      {session?.user?.image && (
                        <img src={session.user.image} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{session?.user?.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{session?.user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Permissions</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 text-xs">&#10003;</span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Email address</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 text-xs">&#10003;</span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Profile info (name, photo)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 text-xs">&#10003;</span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Google Calendar (read-only)</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <button
                      onClick={() => signOut()}
                      className="w-full text-xs font-medium py-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.05)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            {/* Share Card as Hero — swipeable when multiple quotes available */}
            {!isLoading && workHealth?.ai?.heroMessage && typeof workHealth.ai.heroMessage === 'object' ? (
              <section className="max-w-xs mx-auto">
                {workHealth.ai.heroMessages && workHealth.ai.heroMessages.length > 1 ? (
                  <SwipeableQuoteCards
                    quotes={workHealth.ai.heroMessages}
                    focus={workHealth.adaptivePerformanceIndex}
                    strain={workHealth.cognitiveResilience}
                    balance={workHealth.workRhythmRecovery}
                    mood={detectMood(workHealth.adaptivePerformanceIndex, workHealth.cognitiveResilience, workHealth.workRhythmRecovery)}
                    aiGenerated={aiStatus === 'success'}
                    aiError={workHealth._aiError}
                    onMetricClick={(metric) => { setActiveTab(metric); trackEvent('metric_click', { metric }); }}
                    activeCardRef={(el) => { (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
                    onEngagement={trackEngagement}
                  />
                ) : (
                  <div ref={cardRef}>
                    <ShareCard
                      quote={workHealth.ai.heroMessage.quote}
                      source={workHealth.ai.heroMessage.source}
                      subtitle={workHealth.ai.heroMessage.subtitle}
                      focus={workHealth.adaptivePerformanceIndex}
                      strain={workHealth.cognitiveResilience}
                      balance={workHealth.workRhythmRecovery}
                      mood={detectMood(workHealth.adaptivePerformanceIndex, workHealth.cognitiveResilience, workHealth.workRhythmRecovery)}
                      onMetricClick={(metric) => { setActiveTab(metric); trackEvent('metric_click', { metric }); }}
                    />
                  </div>
                )}
                <div className="mt-4">
                  <button
                    onClick={handleShare}
                    disabled={shareState === 'generating'}
                    className={`w-full py-4 px-6 rounded-xl text-sm font-medium transition-all duration-200 ${
                      shareState === 'generating'
                        ? 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[var(--text-muted)] cursor-wait'
                        : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.10)] hover:border-[rgba(255,255,255,0.20)] cursor-pointer'
                    }`}
                  >
                    {shareState === 'generating' ? 'Generating image\u2026' : 'Share today\u2019s quote \u2192'}
                  </button>
                </div>
              </section>
            ) : (
              <section className="max-w-xs mx-auto">
                <style>{`
                  @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                  }
                  .skeleton-bar {
                    position: relative;
                    overflow: hidden;
                  }
                  .skeleton-bar::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
                    animation: shimmer 1.8s ease-in-out infinite;
                  }
                `}</style>
                <div
                  className="w-full rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(to bottom, #4b5563, #1f2937)',
                    padding: '32px 24px 20px',
                  }}
                >
                  {/* Quote skeleton */}
                  <div className="skeleton-bar h-6 rounded-lg mx-auto mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.10)', maxWidth: '85%' }} />
                  <div className="skeleton-bar h-6 rounded-lg mx-auto mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.07)', maxWidth: '60%' }} />

                  {/* Source skeleton */}
                  <div className="skeleton-bar h-3 rounded mx-auto mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)', maxWidth: '40%' }} />

                  {/* Subtitle skeleton */}
                  <div className="skeleton-bar h-3 rounded mx-auto mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)', maxWidth: '55%' }} />

                  {/* Score bar skeleton */}
                  <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
                    <div className="skeleton-bar h-2 rounded mx-auto mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)', maxWidth: '30%' }} />
                    <div className="flex justify-center gap-8">
                      {['FOCUS', 'STRAIN', 'BALANCE'].map((label) => (
                        <div key={label} className="text-center">
                          <div className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.15)', lineHeight: 1 }}>--</div>
                          <div className="text-[9px] uppercase tracking-wider mt-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.15)' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Branding */}
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    <PersistLogo size={12} variant="light" />
                    <span className="text-[9px] tracking-widest" style={{ color: 'rgba(255,255,255,0.15)' }}>Persistwork.com</span>
                  </div>
                </div>

                {/* Loading verb */}
                <p
                  className="text-sm font-medium text-center mt-5 tracking-wide"
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    opacity: verbVisible ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out',
                  }}
                >
                  {loadingVerb}{'.'.repeat(dotCount)}
                </p>
              </section>
            )}

            {lastRefresh && (
              <div className="text-center pt-8">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Last updated {lastRefresh.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            )}
          </>
        )}

        {/* Focus Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-16">
            <button onClick={() => setActiveTab('overview')} className="flex items-center space-x-2 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              <span>&larr;</span><span>Back to Overview</span>
            </button>
            {/* Large Focus Ring */}
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
                      <div className="whoop-metric-label" style={{ fontSize: '0.75rem', lineHeight: '1' }}>
                        FOCUS
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
                {/* Focus Insights */}
                <div className="mb-6 pb-4 border-b border-gray-700 text-center">
                  <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Focus Insights
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

                {/* Focus Components — unique to this metric's calculation */}
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

                <p className="text-xs mt-4 pt-4 border-t border-gray-700" style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  How much capacity you have today for deep, uninterrupted work — based on meeting load, available focus blocks, and schedule flow.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* Strain Tab */}
        {activeTab === 'resilience' && (
          <div className="space-y-16">
            <button onClick={() => setActiveTab('overview')} className="flex items-center space-x-2 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              <span>&larr;</span><span>Back to Overview</span>
            </button>
            {/* Large Strain Ring */}
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
                      <div className="whoop-metric-label" style={{ fontSize: '0.75rem', lineHeight: '1' }}>
                        STRAIN
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              
              {/* Strain Breakdown - Always visible */}
              <div
                className="max-w-2xl mx-auto mt-4 mb-8 p-6 rounded-lg"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {/* Strain Insights */}
                <div className="mb-6 pb-4 border-b border-gray-700 text-center">
                  <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Strain Insights
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

                {/* Strain Components — unique to this metric */}
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

                <p className="text-xs mt-4 pt-4 border-t border-gray-700" style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  How much cognitive load your schedule is putting on you today — context switches, back-to-back meetings, and decision fatigue.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* Balance Tab */}
        {activeTab === 'sustainability' && (
          <div className="space-y-16">
            <button onClick={() => setActiveTab('overview')} className="flex items-center space-x-2 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              <span>&larr;</span><span>Back to Overview</span>
            </button>
            {/* Large Balance Ring */}
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
                      <div className="whoop-metric-label" style={{ fontSize: '0.75rem', lineHeight: '1' }}>
                        BALANCE
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              
              {/* Balance Breakdown - Always visible */}
              <div
                className="max-w-2xl mx-auto mt-4 mb-8 p-6 rounded-lg"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {/* Balance Insights */}
                <div className="mb-6 pb-4 border-b border-gray-700 text-center">
                  <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Balance Insights
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

                {/* Balance Components — unique to this metric */}
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

                <p className="text-xs mt-4 pt-4 border-t border-gray-700" style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Can you keep this pace up? Measures whether your schedule has enough recovery time and healthy boundaries to avoid burnout.
                </p>
              </div>
            </section>

          </div>
        )}

      </div>
    </div>
  )
}