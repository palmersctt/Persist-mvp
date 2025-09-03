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

    const readiness = workHealth.readiness;
    
    if (workHealth.status === 'NEEDS_ATTENTION') {
      return {
        level: 'recovery',
        message: 'WORK HEALTH NEEDS ATTENTION',
        color: '#ff7744',
        description: 'High cognitive load detected from schedule density. Focus on essential tasks and consider protecting focus time for recovery.'
      };
    } else if (workHealth.status === 'OPTIMAL' || readiness >= 90) {
      return {
        level: 'optimal',
        message: 'OPTIMAL WORK HEALTH',
        color: '#00ff88',
        description: 'Outstanding conditions for high-impact work. Perfect for strategic initiatives, complex problem-solving, and important decisions.'
      };
    } else if (workHealth.status === 'EXCELLENT' || readiness >= 80) {
      return {
        level: 'peak',
        message: 'EXCELLENT WORK HEALTH',
        color: '#25d366',
        description: 'Exceptional conditions for meaningful work. Ideal for challenging projects, creative tasks, and high-stakes activities.'
      };
    } else if (workHealth.status === 'GOOD' || readiness >= 70) {
      return {
        level: 'good',
        message: 'GOOD WORK HEALTH',
        color: '#ffb347',
        description: 'Solid foundation for productive work. Good capacity for routine tasks, meetings, and moderate complexity projects.'
      };
    } else {
      return {
        level: 'moderate',
        message: 'MODERATE WORK HEALTH',
        color: '#ff9500',
        description: 'Some cognitive strain from schedule patterns. Consider optimizing meeting distribution and protecting focus time.'
      };
    }
  };

  const getSecondaryMetrics = (): SecondaryMetric[] => {
    if (!workHealth) {
      return [
        { label: 'Cognitive Load', value: '—', status: 'average', icon: '🧠' },
        { label: 'Schedule Load', value: '—', status: 'average', icon: '📅' },
        { label: 'Focus Time', value: '—', status: 'average', icon: '🎯' }
      ];
    }

    return [
      {
        label: 'Cognitive Load',
        value: workHealth.cognitiveLoad,
        unit: '%',
        status: workHealth.cognitiveLoad >= 76 ? 'needs_attention' : 
                workHealth.cognitiveLoad >= 51 ? 'average' : 'good',
        icon: '🧠'
      },
      {
        label: 'Schedule Load',
        value: workHealth.schedule.meetingCount,
        unit: ' meetings',
        status: workHealth.schedule.meetingCount >= 7 ? 'needs_attention' : 
                workHealth.schedule.meetingCount >= 5 ? 'average' : 'good',
        icon: '📅'
      },
      {
        label: 'Focus Time',
        value: (workHealth.focusTime / 60).toFixed(1),
        unit: ' hrs',
        status: workHealth.focusTime < 60 ? 'needs_attention' : 
                workHealth.focusTime < 180 ? 'average' : 'good',
        icon: '🎯'
      }
    ];
  };

  const getTopInsights = (): DataDrivenInsight[] => {
    if (!workHealth) return [];

    const insights: DataDrivenInsight[] = [];
    const schedule = workHealth.schedule;
    const cognitiveLoad = workHealth.cognitiveLoad;
    const readiness = workHealth.readiness;

    // Work Health Pattern Analysis - Updated for new algorithm
    if (readiness >= 90) {
      insights.push({
        type: 'current_analysis',
        title: 'Optimal Work Health Conditions',
        message: `Outstanding performance index at ${readiness}% with exceptional work health conditions. ${schedule.meetingCount} meetings and ${(workHealth.focusTime / 60).toFixed(1)} hours of focus time create ideal cognitive conditions for high-impact work.`,
        dataSource: 'Advanced calendar pattern analysis',
        urgency: 'low',
        category: 'schedule'
      });
    } else if (readiness >= 80) {
      insights.push({
        type: 'current_analysis',
        title: 'Excellent Work Health Status',
        message: `High performance index at ${readiness}% indicates excellent work capacity. Your schedule provides strong cognitive resources with ${schedule.meetingCount} meetings balanced by ${(workHealth.focusTime / 60).toFixed(1)} hours of quality focus time.`,
        dataSource: 'Calendar optimization analysis',
        urgency: 'low',
        category: 'schedule'
      });
    } else if (readiness >= 70) {
      insights.push({
        type: 'current_analysis',
        title: 'Good Work Health Balance',
        message: `Solid performance index at ${readiness}% shows good work health conditions. ${schedule.meetingCount} meetings with ${(workHealth.focusTime / 60).toFixed(1)} hours of focus time provide adequate cognitive resources for productive work.`,
        dataSource: 'Work pattern analysis',
        urgency: 'low',
        category: 'schedule'
      });
    } else if (readiness >= 60) {
      insights.push({
        type: 'current_analysis',
        title: 'Moderate Work Health Status',
        message: `Performance index at ${readiness}% indicates moderate work capacity. With ${schedule.meetingCount} meetings and ${(workHealth.focusTime / 60).toFixed(1)} hours of focus time, consider optimizing meeting distribution for improved cognitive flow.`,
        dataSource: 'Calendar and workload analysis',
        urgency: 'medium',
        category: 'schedule'
      });
    } else {
      insights.push({
        type: 'current_analysis',
        title: 'Work Health Needs Attention',
        message: `Performance index at ${readiness}% indicates cognitive strain from current work patterns. With ${schedule.meetingCount} meetings and ${(workHealth.focusTime / 60).toFixed(1)} hours of focus time, prioritize schedule optimization and cognitive recovery.`,
        dataSource: 'Work health analysis',
        urgency: 'high',
        category: 'schedule'
      });
    }

    // Focus Time Analysis
    if (workHealth.focusTime < 60) {
      insights.push({
        type: 'current_analysis',
        title: 'Limited Focus Time Available',
        message: `Only ${(workHealth.focusTime / 60).toFixed(1)} hours of uninterrupted time available today. This fragmentation pattern can impact deep work quality and cognitive recovery.`,
        dataSource: 'Calendar fragmentation analysis',
        urgency: 'high',
        category: 'schedule'
      });
    } else if (workHealth.focusTime >= 300) { // 5+ hours
      insights.push({
        type: 'current_analysis',
        title: 'Exceptional Focus Time Available',
        message: `${(workHealth.focusTime / 60).toFixed(1)} hours of premium focus time provides excellent opportunity for deep work, strategic planning, and high-cognitive tasks.`,
        dataSource: 'Advanced calendar flow analysis',
        urgency: 'low',
        category: 'schedule'
      });
    } else if (workHealth.focusTime >= 180) { // 3+ hours
      insights.push({
        type: 'current_analysis',
        title: 'Good Focus Time Available',
        message: `${(workHealth.focusTime / 60).toFixed(1)} hours of quality focus time available. Sufficient for meaningful deep work sessions and cognitive tasks.`,
        dataSource: 'Calendar flow analysis',
        urgency: 'low',
        category: 'schedule'
      });
    }

    // Meeting Density Analysis
    if (schedule.meetingCount >= 7) {
      insights.push({
        type: 'schedule_impact',
        title: 'High Meeting Density Detected',
        message: `${schedule.meetingCount} meetings today exceeds research-optimal density (4-5 meetings). With ${schedule.backToBackCount} back-to-back sessions, cognitive load will be elevated.`,
        dataSource: 'Calendar analysis + meeting density research',
        urgency: 'medium',
        category: 'schedule'
      });
    }

    return insights.slice(0, 2);
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
              <h2 className="text-2xl font-bold mb-6 text-center">Welcome to Persist</h2>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Connect Your Calendar</h3>
                    <p className="text-gray-400 text-sm">Gain intelligent insights into your meeting patterns, cognitive load, and work rhythm dynamics</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Get Intelligent Insights</h3>
                    <p className="text-gray-400 text-sm">Receive data-driven awareness about your work health patterns and professional performance trends</p>
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
            <h2 className="text-xl font-bold mb-4">Connect Your Calendar</h2>
            <p className="text-gray-400 text-sm mb-6">Sign in with Google to analyze your work patterns and get personalized work health insights.</p>
            
            <button
              onClick={() => signIn('google')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <span>📊</span>
              <span>Connect Google Calendar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const workCapacity = getWorkCapacityStatus();
  const secondaryMetrics = getSecondaryMetrics();
  const insights = getTopInsights();

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
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors duration-200"
              style={{ 
                color: isLoading ? 'var(--text-muted)' : 'var(--text-secondary)',
                border: `1px solid ${isLoading ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
                backgroundColor: 'transparent'
              }}
            >
              {isLoading ? 'Updating...' : 'Refresh'}
            </button>
            <button
              onClick={() => signOut()}
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors duration-200"
              style={{ 
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'transparent'
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
            <div className="whoop-status-pill inline-flex items-center px-3 py-1.5 mb-12">
              {workCapacity.message}
            </div>
          </div>
          
          {/* Clean minimal progress indicator */}
          <div className="relative w-32 h-32 mx-auto mb-8">
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
                strokeDashoffset={(339.29 - (workHealth?.readiness || 0) / 100 * 339.29)} 
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-5xl font-light mb-1 transition-all duration-500 ${isLoading ? 'opacity-50' : ''}`} style={{ 
                  color: workCapacity.color,
                  fontFeatureSettings: '"tnum"',
                  letterSpacing: '-0.04em'
                }}>
                  {isLoading ? '—' : `${workHealth?.readiness || 0}`}
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
          
          <p className="text-sm max-w-sm mx-auto leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
            {workCapacity.description}
          </p>
        </section>

        {/* Clean Secondary Metrics with Subtle Visual Indicators */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
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
                <div key={index} className="text-center">
                  <div className="whoop-secondary-metric mb-2" style={{ 
                    color: 'var(--text-primary)'
                  }}>
                    {metric.value}{metric.unit}
                  </div>
                  <div className="whoop-metric-label mb-3">
                    {metric.label.toUpperCase()}
                  </div>
                  
                  {/* Subtle Visual Indicators */}
                  {metric.label === 'Cognitive Load' && (
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
                  
                  {metric.label === 'Schedule Load' && (
                    <div className="flex justify-center space-x-1 mb-2">
                      {Array.from({ length: 8 }, (_, i) => (
                        <div 
                          key={i}
                          className="whoop-dot-indicator"
                          style={{
                            backgroundColor: i < Number(metric.value) ? 
                              getIndicatorColor(metric.status) : 
                              'rgba(255,255,255,0.2)'
                          }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {metric.label === 'Focus Time' && (
                    <div className="flex justify-center space-x-0.5 mb-2">
                      {Array.from({ length: 8 }, (_, i) => {
                        const availableBlocks = Math.max(0, Math.floor(Number(metric.value) / 60));
                        const isAvailable = i < availableBlocks;
                        return (
                          <div 
                            key={i}
                            className="whoop-time-block"
                            style={{
                              backgroundColor: isAvailable ? 
                                getIndicatorColor(metric.status) : 
                                'rgba(255,255,255,0.15)'
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Clean Insights Section */}
        <section>
          <h2 className="whoop-section-title mb-8">
            Insights
          </h2>
          
          <div className="space-y-8">
            {insights.length > 0 ? insights.map((insight, index) => (
              <div key={index}>
                <div className="flex items-start justify-between mb-3">
                  <h4 className="whoop-insight-title flex-1">
                    {insight.title}
                  </h4>
                  {insight.urgency === 'high' && (
                    <div className="w-2 h-2 rounded-full ml-3 mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--whoop-green)' }} />
                  )}
                </div>
                <p className="whoop-insight-text mb-4">
                  {insight.message}
                </p>
                <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {insight.dataSource}
                </div>
                {index < insights.length - 1 && <hr className="whoop-clean-divider mt-8" />}
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {error ? `Error loading insights: ${error}` : 'Loading insights from your calendar...'}
                </p>
              </div>
            )}
          </div>
        </section>

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