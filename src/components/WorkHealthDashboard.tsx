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

    const adaptiveIndex = workHealth.adaptivePerformanceIndex;
    
    // Color logic matches performance index ring exactly
    if (adaptiveIndex >= 85) {
      return {
        level: 'optimal',
        message: 'OPTIMAL WORK HEALTH',
        color: '#00ff88', // Green
        description: 'Outstanding cognitive conditions with excellent schedule balance. Perfect for strategic initiatives, complex problem-solving, and important decisions.'
      };
    } else if (adaptiveIndex >= 75) {
      return {
        level: 'peak',
        message: 'EXCELLENT WORK HEALTH', 
        color: '#25d366', // Green
        description: 'Strong cognitive resilience with sustainable work rhythm. Ideal for challenging projects, creative tasks, and high-stakes activities.'
      };
    } else if (adaptiveIndex >= 65) {
      return {
        level: 'good',
        message: 'GOOD WORK HEALTH',
        color: '#ffb347', // Yellow/Amber
        description: 'Solid cognitive foundation with balanced schedule patterns. Good capacity for routine tasks, meetings, and moderate complexity projects.'
      };
    } else if (adaptiveIndex >= 55) {
      return {
        level: 'moderate',
        message: 'MODERATE WORK HEALTH',
        color: '#ff9500', // Orange
        description: 'Some cognitive strain from schedule density. Consider optimizing meeting distribution and recovery periods.'
      };
    } else if (adaptiveIndex >= 40) {
      return {
        level: 'attention',
        message: 'WORK HEALTH NEEDS ATTENTION',
        color: '#ff7744', // Red-Orange
        description: 'Performance compromised by schedule density and cognitive demands. Focus on essential tasks and schedule optimization.'
      };
    } else {
      return {
        level: 'critical',
        message: 'CRITICAL WORK HEALTH',
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
                strokeDashoffset={(339.29 - (workHealth?.adaptivePerformanceIndex || 0) / 100 * 339.29)} 
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
          
          <p className="text-sm max-w-sm mx-auto leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
            {workCapacity.description}
          </p>
        </section>

        {/* Clean Secondary Metrics with Subtle Visual Indicators */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 max-w-2xl mx-auto">
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