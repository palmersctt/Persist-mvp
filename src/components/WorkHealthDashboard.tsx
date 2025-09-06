'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useWorkHealth } from '../hooks/useWorkHealth'

interface SecondaryMetric {
  label: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'average' | 'needs_attention';
  icon: string;
}

interface DataDrivenInsight {
  type: 'current_analysis' | 'schedule_impact' | 'research_backed' | 'algorithm_explanation';
  title: string;
  message: string;
  dataSource: string;
  urgency: 'low' | 'medium' | 'high';
  category: 'schedule' | 'research' | 'combination';
}

interface WorkCapacityStatus {
  level: 'optimal' | 'good' | 'moderate' | 'recovery' | 'estimated' | 'peak';
  message: string;
  color: string;
  description: string;
}

export default function WorkHealthDashboard() {
  const { data: session, status } = useSession();
  const { workHealth, isLoading, error, lastRefresh, refresh } = useWorkHealth();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('persist-onboarding-complete');
    }
    return false;
  });
  const [isPremium, setIsPremium] = useState(false);
  const [showScoreExplanation, setShowScoreExplanation] = useState(false);
  const [showResilienceExplanation, setShowResilienceExplanation] = useState(false);
  const [showSustainabilityExplanation, setShowSustainabilityExplanation] = useState(false);

  const completeOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('persist-onboarding-complete', 'true');
    }
    setShowOnboarding(false);
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
    
    // Color logic matches performance index ring exactly
    if (adaptiveIndex >= 85) {
      return {
        level: 'optimal',
        message: isCached ? 'OPTIMAL WORK HEALTH (CACHED)' : 'OPTIMAL WORK HEALTH',
        color: '#00ff88', // Green
        description: 'Outstanding cognitive conditions with excellent schedule balance. Perfect for strategic initiatives, complex problem-solving, and important decisions.'
      };
    } else if (adaptiveIndex >= 75) {
      return {
        level: 'peak',
        message: isCached ? 'EXCELLENT WORK HEALTH (CACHED)' : 'EXCELLENT WORK HEALTH', 
        color: '#25d366', // Green
        description: 'Strong cognitive resilience with sustainable work rhythm. Ideal for challenging projects, creative tasks, and high-stakes activities.'
      };
    } else if (adaptiveIndex >= 65) {
      return {
        level: 'good',
        message: isCached ? 'GOOD WORK HEALTH (CACHED)' : 'GOOD WORK HEALTH',
        color: '#ffb347', // Yellow/Amber
        description: 'Solid cognitive foundation with balanced schedule patterns. Good capacity for routine tasks, meetings, and moderate complexity projects.'
      };
    } else if (adaptiveIndex >= 55) {
      return {
        level: 'moderate',
        message: isCached ? 'MODERATE WORK HEALTH (CACHED)' : 'MODERATE WORK HEALTH',
        color: '#ff9500', // Orange
        description: 'Some cognitive strain from schedule density. Consider optimizing meeting distribution and recovery periods.'
      };
    } else if (adaptiveIndex >= 40) {
      return {
        level: 'attention',
        message: isCached ? 'WORK HEALTH NEEDS ATTENTION (CACHED)' : 'WORK HEALTH NEEDS ATTENTION',
        color: '#ff7744', // Red-Orange
        description: 'Performance compromised by schedule density and cognitive demands. Focus on essential tasks and schedule optimization.'
      };
    } else {
      return {
        level: 'critical',
        message: isCached ? 'CRITICAL WORK HEALTH (CACHED)' : 'CRITICAL WORK HEALTH',
        color: '#ff4444', // Red
        description: 'Severe cognitive strain requiring immediate schedule intervention. Prioritize recovery and workload reduction.'
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
                workHealth.cognitiveResilience <= 65 ? 'average' : 'good',
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

  const getTopInsights = (): DataDrivenInsight[] => {
    if (!workHealth) return [];

    const insights: DataDrivenInsight[] = [];
    const schedule = workHealth.schedule;
    const adaptiveIndex = workHealth.adaptivePerformanceIndex;
    const resilience = workHealth.cognitiveResilience;
    const rhythm = workHealth.workRhythmRecovery;

    // Adaptive Performance Analysis - Severity aligned with score
    if (adaptiveIndex >= 85) {
      insights.push({
        type: 'current_analysis',
        title: 'Excellent Work Health Conditions',
        message: `Outstanding adaptive performance at ${adaptiveIndex}% maintains optimal cognitive conditions. Your current work pattern supports sustainable peak performance with excellent schedule balance and cognitive resource management.`,
        dataSource: 'Adaptive Performance Intelligence',
        urgency: 'low',
        category: 'schedule'
      });
    } else if (adaptiveIndex >= 70) {
      insights.push({
        type: 'current_analysis',
        title: 'Good Work Health with Optimization Potential',
        message: `Solid adaptive performance at ${adaptiveIndex}% shows healthy work patterns with minor optimization opportunities. Schedule provides sustainable performance with ${schedule.meetingCount} meetings creating manageable cognitive demands.`,
        dataSource: 'Performance Pattern Analysis',
        urgency: 'low',
        category: 'schedule'
      });
    } else if (adaptiveIndex >= 55) {
      insights.push({
        type: 'schedule_impact',
        title: 'Significant Work Health Concerns Detected',
        message: `Adaptive performance at ${adaptiveIndex}% indicates serious work health issues requiring immediate attention. Current schedule intensity with ${schedule.meetingCount} meetings is creating substantial cognitive load that threatens sustainable performance. Immediate schedule restructuring recommended to prevent further degradation.`,
        dataSource: 'Work Health Risk Analysis',
        urgency: 'high',
        category: 'schedule'
      });
    } else if (adaptiveIndex >= 40) {
      insights.push({
        type: 'schedule_impact',
        title: 'Critical Work Health Issues Demand Urgent Action',
        message: `Adaptive performance at ${adaptiveIndex}% reveals critical work health problems requiring emergency intervention. Unsustainable schedule patterns are creating severe cognitive strain that poses serious risk to performance and wellbeing. Comprehensive schedule restructuring essential.`,
        dataSource: 'Critical Performance Analysis',
        urgency: 'high',
        category: 'schedule'
      });
    } else {
      insights.push({
        type: 'schedule_impact',
        title: 'Severe Work Health Crisis Requires Immediate Intervention',
        message: `Adaptive performance at ${adaptiveIndex}% indicates a severe work health crisis demanding immediate comprehensive intervention. Current patterns pose serious risk to cognitive wellbeing and sustainable performance. Emergency schedule overhaul and recovery protocols essential.`,
        dataSource: 'Emergency Performance Analysis',
        urgency: 'high',
        category: 'schedule'
      });
    }

    // Cognitive Resilience Analysis - Severity aligned
    if (resilience <= 40) {
      insights.push({
        type: 'current_analysis',
        title: 'Critical Cognitive Resilience Deficit',
        message: `Cognitive resilience at ${resilience}% reveals serious mental capacity limitations requiring immediate intervention. Excessive context switching and decision fatigue are significantly impacting cognitive performance and decision quality. Urgent schedule simplification needed.`,
        dataSource: 'Cognitive Risk Analysis',
        urgency: 'high',
        category: 'schedule'
      });
    } else if (resilience >= 80) {
      insights.push({
        type: 'current_analysis',
        title: 'Excellent Cognitive Resilience Maintained',
        message: `Outstanding cognitive resilience at ${resilience}% demonstrates strong mental capacity for complex decisions and high-cognitive tasks. Current schedule patterns support sustained cognitive excellence with effective recovery and minimal switching costs.`,
        dataSource: 'Cognitive Excellence Analysis',
        urgency: 'low',
        category: 'schedule'
      });
    } else if (resilience >= 60) {
      insights.push({
        type: 'current_analysis',
        title: 'Adequate Cognitive Resilience with Optimization Needed',
        message: `Cognitive resilience at ${resilience}% shows reasonable mental capacity with noticeable context switching load. Some cognitive strain evident but manageable. Minor schedule adjustments could improve mental resource allocation.`,
        dataSource: 'Cognitive Optimization Analysis',
        urgency: 'low',
        category: 'schedule'
      });
    }

    // Sustainability Analysis - Severity aligned
    if (rhythm <= 45) {
      insights.push({
        type: 'schedule_impact',
        title: 'Unsustainable Work Patterns Threaten Long-term Performance',
        message: `Sustainability index at ${rhythm}% reveals seriously unsustainable work patterns that threaten long-term performance capacity. Current schedule intensity far exceeds healthy recovery ratios, creating substantial risk of burnout and cognitive decline. Immediate pattern restructuring essential.`,
        dataSource: 'Sustainability Risk Analysis',
        urgency: 'high',
        category: 'schedule'
      });
    } else if (rhythm >= 80) {
      insights.push({
        type: 'current_analysis',
        title: 'Exceptional Work Sustainability Achieved',
        message: `Outstanding sustainability index at ${rhythm}% demonstrates exceptionally maintainable schedule patterns with optimal intensity-recovery balance. Current work rhythm strongly supports long-term cognitive health and sustainable peak performance.`,
        dataSource: 'Sustainability Excellence Analysis',
        urgency: 'low',
        category: 'schedule'
      });
    } else if (rhythm >= 60) {
      insights.push({
        type: 'current_analysis',
        title: 'Sustainable Work Pattern with Enhancement Opportunities',
        message: `Sustainability index at ${rhythm}% shows maintainable work patterns with adequate recovery periods. Current schedule supports consistent performance sustainability with opportunities for rhythm optimization to improve long-term outcomes.`,
        dataSource: 'Sustainability Optimization Analysis',
        urgency: 'low',
        category: 'schedule'
      });
    }

    return insights.slice(0, 3);
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
                    <h3 className="font-semibold mb-1">Adaptive Performance Index</h3>
                    <p className="text-gray-400 text-sm">Real-time cognitive capacity assessment based on calendar density, context switching, and decision fatigue patterns</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">🧠</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Cognitive Resilience</h3>
                    <p className="text-gray-400 text-sm">Mental capacity analysis for handling complex decisions and context switching without performance degradation</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">♻️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Sustainability Index</h3>
                    <p className="text-gray-400 text-sm">Long-term work pattern sustainability measurement to maintain peak performance without burnout risk</p>
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
  const insights = getTopInsights();

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

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        
        {/* Primary Work Capacity Metric */}
        <section className="text-center">
          <div className="mb-8">
            <div 
              className="inline-flex items-center px-3 py-1.5 mb-12 rounded-full text-xs font-medium tracking-wide"
              style={{
                backgroundColor: workCapacity.color,
                color: '#000000',
                opacity: 0.9
              }}
            >
              {workCapacity.message}
            </div>
          </div>
          
          {/* Clean minimal progress indicator */}
          <button 
            onClick={() => setShowScoreExplanation(!showScoreExplanation)}
            className="relative w-32 h-32 mx-auto mb-8 block hover:opacity-80 transition-opacity cursor-pointer"
          >
            <svg className="w-full h-full whoop-progress-ring" viewBox="0 0 120 120">
              <circle 
                cx="60" cy="60" r="54" 
                fill="none" 
                stroke="rgba(255,255,255,0.06)" 
                strokeWidth="2"
              />
              <circle 
                cx="60" cy="60" r="54" 
                fill="none" 
                stroke={workCapacity.color}
                strokeWidth="2"
                strokeDasharray="339.29" 
                strokeDashoffset={(339.29 - (workHealth?.adaptivePerformanceIndex || 0) / 100 * 339.29)} 
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className={`text-5xl font-light mb-1 transition-all duration-500 ${isLoading ? 'opacity-50' : ''}`} style={{ 
                  color: workCapacity.color,
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
          </button>
          
          <p className="text-sm max-w-sm mx-auto leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
            {workCapacity.description}
          </p>
          
          {/* Score Explanation */}
          {showScoreExplanation && (
            <div 
              className="max-w-2xl mx-auto mb-8 p-6 rounded-lg cursor-pointer hover:bg-opacity-80 transition-opacity"
              onClick={() => setShowScoreExplanation(false)}
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                How Your Performance Index is Calculated
              </h3>
              <div className="space-y-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <div>
                  <span className="font-medium">Meeting Density:</span> We analyze how many meetings you have and how they're distributed throughout your day.
                </div>
                <div>
                  <span className="font-medium">Context Switching:</span> Frequent transitions between different types of work reduce your score.
                </div>
                <div>
                  <span className="font-medium">Focus Time:</span> Uninterrupted blocks of 2+ hours improve your score.
                </div>
                <div>
                  <span className="font-medium">Recovery Periods:</span> Breaks between intense sessions are essential for sustainability.
                </div>
              </div>
              
              <h3 className="text-sm font-semibold mt-6 mb-4" style={{ color: 'var(--text-primary)' }}>
                What To Do With Your Score
              </h3>
              <div className="space-y-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {workHealth?.adaptivePerformanceIndex >= 75 ? (
                  <>
                    <div>✅ Your work patterns are sustainable. Maintain your current schedule structure.</div>
                    <div>💡 Protect your focus time blocks - they're working well for you.</div>
                  </>
                ) : workHealth?.adaptivePerformanceIndex >= 50 ? (
                  <>
                    <div>⚠️ Consider consolidating meetings to create longer focus blocks.</div>
                    <div>💡 Try batching similar tasks together to reduce context switching.</div>
                    <div>📅 Block out 2-3 hour focus sessions in your calendar.</div>
                  </>
                ) : (
                  <>
                    <div>🚨 Your schedule needs immediate attention to prevent burnout.</div>
                    <div>💡 Decline or delegate non-essential meetings.</div>
                    <div>📅 Create daily protected time blocks for deep work.</div>
                    <div>🔄 Add 15-minute buffers between meetings for mental reset.</div>
                  </>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <strong>Remember:</strong> This score reflects your current week's pattern. Small changes in meeting structure can significantly improve your cognitive performance.
                </p>
                <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                  Click anywhere to close
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Premium Content Wrapper */}
        <div className="relative">
        
        {/* Clean Secondary Metrics with Subtle Visual Indicators */}
        <section style={{ transition: 'filter 0.3s ease-in-out' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 max-w-2xl mx-auto" style={{
            filter: !isPremium ? 'blur(4px)' : 'none',
            transition: 'filter 0.3s ease-in-out'
          }}>
            {secondaryMetrics.map((metric, index) => {
              const getIndicatorColor = (status: string) => {
                switch (status) {
                  case 'good': return 'var(--whoop-green)';
                  case 'average': return 'var(--whoop-yellow)';
                  case 'needs_attention': return 'var(--whoop-red)';
                  default: return 'rgba(255,255,255,0.3)';
                }
              };
              
              return (
                <button 
                  key={index} 
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer block w-full"
                  onClick={() => {
                    if (metric.label === 'Cognitive Resilience') {
                      setShowResilienceExplanation(!showResilienceExplanation);
                    } else if (metric.label === 'Sustainability Index') {
                      setShowSustainabilityExplanation(!showSustainabilityExplanation);
                    }
                  }}
                >
                  <div className="whoop-secondary-metric mb-2" style={{ 
                    color: 'var(--text-primary)'
                  }}>
                    {metric.value}{metric.unit}
                  </div>
                  <div className="whoop-metric-label mb-3">
                    {metric.label.toUpperCase()}
                  </div>
                  
                  {/* Subtle Visual Indicators */}
                  {metric.label === 'Cognitive Resilience' && (
                    <div className="mx-auto w-16 mb-2">
                      <div className="whoop-thin-progress">
                        <div 
                          className="whoop-progress-fill"
                          style={{ 
                            width: `${metric.value}%`,
                            backgroundColor: getIndicatorColor(metric.status)
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {metric.label === 'Sustainability Index' && (
                    <div className="mx-auto w-16 mb-2">
                      <div className="whoop-thin-progress">
                        <div 
                          className="whoop-progress-fill"
                          style={{ 
                            width: `${metric.value}%`,
                            backgroundColor: getIndicatorColor(metric.status)
                          }}
                        />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Cognitive Resilience Explanation */}
          {showResilienceExplanation && (
            <div 
              className="max-w-2xl mx-auto mt-8 p-6 rounded-lg cursor-pointer hover:bg-opacity-80 transition-opacity"
              onClick={() => setShowResilienceExplanation(false)}
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                How Your Cognitive Resilience is Calculated
              </h3>
              <div className="space-y-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <div>
                  <span className="font-medium">Context Switching:</span> Measures how often you jump between different types of work and meetings.
                </div>
                <div>
                  <span className="font-medium">Decision Fatigue:</span> Tracks the cumulative mental load from making decisions throughout the day.
                </div>
                <div>
                  <span className="font-medium">Cognitive Reserve:</span> Calculates your available mental energy based on focus time and breaks.
                </div>
                <div>
                  <span className="font-medium">Mental Recovery:</span> Evaluates gaps between intense cognitive tasks.
                </div>
              </div>
              
              <h3 className="text-sm font-semibold mt-6 mb-4" style={{ color: 'var(--text-primary)' }}>
                What To Do With Your Score
              </h3>
              <div className="space-y-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {workHealth?.cognitiveResilience >= 65 ? (
                  <>
                    <div>✅ Your mental capacity is strong. Maintain current meeting patterns.</div>
                    <div>💡 You can handle complex decisions effectively.</div>
                  </>
                ) : workHealth?.cognitiveResilience >= 40 ? (
                  <>
                    <div>⚠️ Reduce context switching by batching similar meetings.</div>
                    <div>💡 Schedule decision-heavy tasks for your peak energy hours.</div>
                    <div>📅 Add 5-10 minute buffers between different types of work.</div>
                  </>
                ) : (
                  <>
                    <div>🚨 Critical: Your cognitive load is unsustainable.</div>
                    <div>💡 Immediately reduce meeting count or delegate decisions.</div>
                    <div>📅 Block 2+ hour focus sessions with no interruptions.</div>
                    <div>🔄 Take regular breaks to reset mental energy.</div>
                  </>
                )}
              </div>
              <p className="text-xs mt-6 text-center" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                Click anywhere to close
              </p>
            </div>
          )}
          
          {/* Sustainability Index Explanation */}
          {showSustainabilityExplanation && (
            <div 
              className="max-w-2xl mx-auto mt-8 p-6 rounded-lg cursor-pointer hover:bg-opacity-80 transition-opacity"
              onClick={() => setShowSustainabilityExplanation(false)}
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                How Your Sustainability Index is Calculated
              </h3>
              <div className="space-y-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <div>
                  <span className="font-medium">Work Rhythm:</span> Analyzes the balance between morning and afternoon meeting loads.
                </div>
                <div>
                  <span className="font-medium">Recovery Adequacy:</span> Measures breaks and recovery time between intense work periods.
                </div>
                <div>
                  <span className="font-medium">Intensity Sustainability:</span> Evaluates if your daily meeting hours are maintainable long-term.
                </div>
                <div>
                  <span className="font-medium">Energy Alignment:</span> Checks if meetings align with natural energy patterns.
                </div>
              </div>
              
              <h3 className="text-sm font-semibold mt-6 mb-4" style={{ color: 'var(--text-primary)' }}>
                What To Do With Your Score
              </h3>
              <div className="space-y-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {workHealth?.workRhythmRecovery >= 70 ? (
                  <>
                    <div>✅ Your work patterns are highly sustainable. Keep this rhythm.</div>
                    <div>💡 You have good balance between intensity and recovery.</div>
                  </>
                ) : workHealth?.workRhythmRecovery >= 45 ? (
                  <>
                    <div>⚠️ Some sustainability concerns. Adjust meeting distribution.</div>
                    <div>💡 Balance morning and afternoon meeting loads better.</div>
                    <div>📅 Ensure at least 30-minute breaks between meeting blocks.</div>
                  </>
                ) : (
                  <>
                    <div>🚨 Unsustainable pattern detected - high burnout risk.</div>
                    <div>💡 Reduce total meeting hours immediately.</div>
                    <div>📅 Implement "meeting-free" blocks daily.</div>
                    <div>🔄 Add recovery time between intense sessions.</div>
                  </>
                )}
              </div>
              <p className="text-xs mt-6 text-center" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                Click anywhere to close
              </p>
            </div>
          )}
        </section>

        {/* Clean Insights Section */}
        <section>
          <h2 className="whoop-section-title mb-8">
            Insights
          </h2>
          
          <div className="space-y-8" style={{
            filter: !isPremium ? 'blur(4px)' : 'none',
            transition: 'filter 0.3s ease-in-out'
          }}>
            {insights.length > 0 ? insights.map((insight, index) => {
              // Determine dot color based on which metric this insight is about
              const getDotColorForInsight = (insight: DataDrivenInsight) => {
                const title = insight.title.toLowerCase();
                
                // Check if insight is about Adaptive Performance Index (main metric)
                if (title.includes('work health') || title.includes('adaptive performance') || title.includes('performance')) {
                  const score = workHealth?.adaptivePerformanceIndex || 0;
                  if (score >= 75) return 'var(--whoop-green)';
                  if (score >= 65) return 'var(--whoop-yellow)';
                  if (score >= 55) return '#ff9500'; // Orange
                  return 'var(--whoop-red)';
                }
                
                // Check if insight is about Cognitive Resilience
                if (title.includes('cognitive resilience') || title.includes('cognitive')) {
                  const resilience = workHealth?.cognitiveResilience || 0;
                  if (resilience > 65) return 'var(--whoop-green)';
                  if (resilience > 40) return 'var(--whoop-yellow)';
                  return 'var(--whoop-red)';
                }
                
                // Check if insight is about Sustainability
                if (title.includes('sustainability') || title.includes('sustainable') || title.includes('unsustainable')) {
                  const sustainability = workHealth?.workRhythmRecovery || 0;
                  if (sustainability > 70) return 'var(--whoop-green)';
                  if (sustainability > 45) return 'var(--whoop-yellow)';
                  return 'var(--whoop-red)';
                }
                
                // Fallback to urgency-based color
                switch (insight.urgency) {
                  case 'low': return 'var(--whoop-green)';
                  case 'medium': return 'var(--whoop-yellow)';
                  case 'high': return 'var(--whoop-red)';
                  default: return 'rgba(255,255,255,0.3)';
                }
              };
              
              return (
                <div key={index}>
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="whoop-insight-title flex-1">
                      {insight.title}
                    </h4>
                    <div className="w-2 h-2 rounded-full ml-3 mt-2 flex-shrink-0" style={{ backgroundColor: getDotColorForInsight(insight) }} />
                  </div>
                  <p className="whoop-insight-text mb-4">
                    {insight.message}
                  </p>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    {insight.dataSource}
                  </div>
                  {index < insights.length - 1 && <hr className="whoop-clean-divider mt-8" />}
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {error ? `Error loading insights: ${error}` : 'Loading insights from your calendar...'}
                </p>
              </div>
            )}
          </div>
        </section>
        
        {/* Single Premium Overlay for both sections */}
        {!isPremium && (
          <div className="absolute inset-0 flex items-center justify-center" style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(2px)',
            borderRadius: '12px'
          }}>
            <div className="text-center">
              <button
                onClick={() => setIsPremium(true)}
                className="px-8 py-3 font-medium text-white rounded-lg transition-all duration-300 transform hover:scale-105"
                style={{
                  backgroundColor: 'black',
                  border: '2px solid',
                  borderColor: workCapacity.color || '#00ff88',
                  boxShadow: `0 4px 20px ${workCapacity.color ? workCapacity.color + '40' : 'rgba(0, 255, 136, 0.25)'}`
                }}
              >
                Unlock Advanced Metrics & Insights
              </button>
            </div>
          </div>
        )}
        </div>

        {/* Clean Connections Section */}
        <section>
          <h2 className="whoop-section-title mb-8">
            Connections
          </h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <h3 className="whoop-insight-title mb-1">
                    Data Sources
                  </h3>
                  <p className="text-xs font-medium" style={{ 
                    color: session ? 'var(--whoop-green)' : 'var(--text-muted)' 
                  }}>
                    {session ? 'Google Calendar Connected' : 'Connect Google Calendar'}
                  </p>
                </div>
                
                {session && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--whoop-green)' }} />
                )}
              </div>
            </div>
          </div>
        </section>
        
        {lastRefresh && (
          <div className="text-center pt-8">
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Last updated {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}