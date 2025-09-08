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
  const [activeExplanation, setActiveExplanation] = useState<'performance' | 'resilience' | 'sustainability' | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'resilience' | 'sustainability'>('overview');

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

      {/* Tab Navigation */}
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-4">
        <div className="flex justify-center">
          <div className="flex space-x-1 md:space-x-2">
            {[
              { id: 'overview', label: 'Overview', mobileLabel: 'Overview' },
              { id: 'performance', label: 'Performance Index', mobileLabel: 'Performance' },
              { id: 'resilience', label: 'Cognitive Resilience', mobileLabel: 'Cognitive' },
              { id: 'sustainability', label: 'Sustainability Index', mobileLabel: 'Sustainability' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="px-2 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-all duration-200"
                style={{
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'
                }}
              >
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.mobileLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 pb-12 space-y-16">
        
        {/* Overview Tab - All current content */}
        {activeTab === 'overview' && (
          <>
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
            </div>
            
            {/* External Labels - Symmetric Three-Point Layout */}
            {/* Performance Index Label - 12 o'clock (Top) */}
            <div className="absolute text-center" style={{ 
              left: '50%', 
              top: '-30px',
              transform: 'translateX(-50%)'
            }}>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-semibold" style={{ 
                color: '#10b981', 
                lineHeight: '1'
              }}>
                {isLoading ? '—' : `${workHealth?.adaptivePerformanceIndex || 0}`}
              </div>
              <div className="text-xs sm:text-sm uppercase leading-tight mt-1" style={{ 
                color: '#10b981'
              }}>
                PERFORMANCE<br />INDEX
              </div>
            </div>
            
            {/* Sustainability Index Label - 8 o'clock (Bottom Left) */}
            <div className="absolute text-center" style={{ 
              left: '15%',
              bottom: '10px',
              transform: 'translateX(-50%)'
            }}>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-semibold" style={{ 
                color: '#6b7280', 
                lineHeight: '1'
              }}>
                {isLoading ? '—' : `${workHealth?.workRhythmRecovery || 0}`}
              </div>
              <div className="text-xs sm:text-sm uppercase leading-tight mt-1" style={{ 
                color: '#6b7280'
              }}>
                SUSTAINABILITY<br />INDEX
              </div>
            </div>
            
            {/* Cognitive Resilience Label - 4 o'clock (Bottom Right) */}
            <div className="absolute text-center" style={{ 
              right: '15%',
              bottom: '10px',
              transform: 'translateX(50%)'
            }}>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-semibold" style={{ 
                color: '#3b82f6', 
                lineHeight: '1'
              }}>
                {isLoading ? '—' : `${workHealth?.cognitiveResilience || 0}`}
              </div>
              <div className="text-xs sm:text-sm uppercase leading-tight mt-1" style={{ 
                color: '#3b82f6'
              }}>
                COGNITIVE<br />RESILIENCE
              </div>
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
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Your {workHealth?.adaptivePerformanceIndex || 0} Performance Index
              </h3>
              <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Based on your meeting patterns, focus availability, and schedule structure.
              </p>
              
              {/* Simplified Components - Max 4 */}
              <div className="space-y-5 mb-6">
                {/* Meeting Load */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Meeting Load
                    </span>
                    <span className="text-xs" style={{ 
                      color: 'var(--text-muted)',
                      fontWeight: '500'
                    }}>
                      {(workHealth?.schedule?.meetingCount || 0) <= 3 ? 'Light' : 
                       (workHealth?.schedule?.meetingCount || 0) <= 5 ? 'Moderate' : 'Heavy'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded h-1.5">
                    <div 
                      className="h-1.5 rounded transition-all duration-700"
                      style={{ 
                        width: `${Math.max(25, 100 - ((workHealth?.schedule?.meetingCount || 0) * 15))}%`,
                        backgroundColor: '#4F9CF9',
                        opacity: Math.max(0.4, (100 - ((workHealth?.schedule?.meetingCount || 0) * 15)) / 100)
                      }}
                    />
                  </div>
                  <div className="mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {workHealth?.schedule?.meetingCount || 0} meetings scheduled
                    </span>
                  </div>
                </div>

                {/* Focus Availability */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Focus Availability
                    </span>
                    <span className="text-xs" style={{ 
                      color: 'var(--text-muted)',
                      fontWeight: '500'
                    }}>
                      {((workHealth?.focusTime || 0) / 60) >= 4 ? 'Good' : 
                       ((workHealth?.focusTime || 0) / 60) >= 2 ? 'Moderate' : 'Limited'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded h-1.5">
                    <div 
                      className="h-1.5 rounded transition-all duration-700"
                      style={{ 
                        width: `${Math.min(100, ((workHealth?.focusTime || 0) / 60) * 22)}%`,
                        backgroundColor: '#4F9CF9',
                        opacity: Math.min(1, Math.max(0.4, ((workHealth?.focusTime || 0) / 60) / 4))
                      }}
                    />
                  </div>
                  <div className="mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {Math.floor((workHealth?.focusTime || 0) / 60)}h {(workHealth?.focusTime || 0) % 60}m uninterrupted time
                    </span>
                  </div>
                </div>

                {/* Schedule Flow */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Schedule Flow
                    </span>
                    <span className="text-xs" style={{ 
                      color: 'var(--text-muted)',
                      fontWeight: '500'
                    }}>
                      {(workHealth?.schedule?.fragmentationScore || 0) >= 80 ? 'Good' : 
                       (workHealth?.schedule?.fragmentationScore || 0) >= 60 ? 'Moderate' : 'Fragmented'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded h-1.5">
                    <div 
                      className="h-1.5 rounded transition-all duration-700"
                      style={{ 
                        width: `${workHealth?.schedule?.fragmentationScore || 20}%`,
                        backgroundColor: '#4F9CF9',
                        opacity: Math.max(0.4, (workHealth?.schedule?.fragmentationScore || 20) / 100)
                      }}
                    />
                  </div>
                  <div className="mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {(workHealth?.schedule?.backToBackCount || 0) > 0 ? 
                        `${workHealth?.schedule?.backToBackCount} back-to-back transitions` : 
                        'Well-spaced meetings'}
                    </span>
                  </div>
                </div>

                {/* Recovery Time */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Recovery Time
                    </span>
                    <span className="text-xs" style={{ 
                      color: 'var(--text-muted)',
                      fontWeight: '500'
                    }}>
                      {((workHealth?.schedule?.bufferTime || 0) / 60) >= 3 ? 'Good' : 
                       ((workHealth?.schedule?.bufferTime || 0) / 60) >= 1 ? 'Moderate' : 'Limited'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded h-1.5">
                    <div 
                      className="h-1.5 rounded transition-all duration-700"
                      style={{ 
                        width: `${Math.min(100, ((workHealth?.schedule?.bufferTime || 0) / 60) * 25)}%`,
                        backgroundColor: '#4F9CF9',
                        opacity: Math.min(1, Math.max(0.4, ((workHealth?.schedule?.bufferTime || 0) / 60) / 4))
                      }}
                    />
                  </div>
                  <div className="mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {Math.floor((workHealth?.schedule?.bufferTime || 0) / 60)}h {(workHealth?.schedule?.bufferTime || 0) % 60}m between activities
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Key Insight
                </h4>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(79, 156, 249, 0.1)', border: '1px solid rgba(79, 156, 249, 0.2)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {workHealth?.adaptivePerformanceIndex >= 75 ? 
                      'Your current schedule structure supports sustainable performance. Consider maintaining this balance of meetings and focused work time.' :
                      workHealth?.adaptivePerformanceIndex >= 50 ?
                      'Your schedule shows moderate density. Try consolidating meetings into blocks to create longer periods for focused work.' :
                      'Your schedule has high meeting density. Consider which meetings could be shortened, combined, or rescheduled to create more continuous work time.'
                    }
                  </p>
                </div>
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

        {/* Clean Insights Section */}
        <section>
          <h2 className="whoop-section-title mb-8">
            Insights
          </h2>
          
          <div className="space-y-8">
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
          </>
        )}

        {/* Performance Index Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-16">
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
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Your {workHealth?.adaptivePerformanceIndex || 0} Performance Index
                </h3>
                <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Based on your meeting patterns, focus availability, and schedule structure.
                </p>
                
                {/* Performance Components */}
                <div className="space-y-5 mb-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Meeting Load
                      </span>
                      <span className="text-xs" style={{ 
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {(workHealth?.schedule?.meetingCount || 0) <= 3 ? 'Light' : 
                         (workHealth?.schedule?.meetingCount || 0) <= 5 ? 'Moderate' : 'Heavy'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div 
                        className="h-1.5 rounded transition-all duration-700"
                        style={{ 
                          width: `${Math.max(25, 100 - ((workHealth?.schedule?.meetingCount || 0) * 15))}%`,
                          backgroundColor: '#4F9CF9',
                          opacity: Math.max(0.4, (100 - ((workHealth?.schedule?.meetingCount || 0) * 15)) / 100)
                        }}
                      />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {workHealth?.schedule?.meetingCount || 0} meetings scheduled
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Focus Availability
                      </span>
                      <span className="text-xs" style={{ 
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {((workHealth?.focusTime || 0) / 60) >= 4 ? 'Good' : 
                         ((workHealth?.focusTime || 0) / 60) >= 2 ? 'Moderate' : 'Limited'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div 
                        className="h-1.5 rounded transition-all duration-700"
                        style={{ 
                          width: `${Math.min(100, ((workHealth?.focusTime || 0) / 60) * 22)}%`,
                          backgroundColor: '#4F9CF9',
                          opacity: Math.min(1, Math.max(0.4, ((workHealth?.focusTime || 0) / 60) / 4))
                        }}
                      />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {Math.floor((workHealth?.focusTime || 0) / 60)}h {(workHealth?.focusTime || 0) % 60}m uninterrupted time
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Schedule Flow
                      </span>
                      <span className="text-xs" style={{ 
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {(workHealth?.schedule?.fragmentationScore || 0) >= 80 ? 'Good' : 
                         (workHealth?.schedule?.fragmentationScore || 0) >= 60 ? 'Moderate' : 'Fragmented'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div 
                        className="h-1.5 rounded transition-all duration-700"
                        style={{ 
                          width: `${workHealth?.schedule?.fragmentationScore || 20}%`,
                          backgroundColor: '#4F9CF9',
                          opacity: Math.max(0.4, (workHealth?.schedule?.fragmentationScore || 20) / 100)
                        }}
                      />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {(workHealth?.schedule?.backToBackCount || 0) > 0 ? 
                          `${workHealth?.schedule?.backToBackCount} back-to-back transitions` : 
                          'Well-spaced meetings'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Recovery Time
                      </span>
                      <span className="text-xs" style={{ 
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {((workHealth?.schedule?.bufferTime || 0) / 60) >= 3 ? 'Good' : 
                         ((workHealth?.schedule?.bufferTime || 0) / 60) >= 1 ? 'Moderate' : 'Limited'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div 
                        className="h-1.5 rounded transition-all duration-700"
                        style={{ 
                          width: `${Math.min(100, ((workHealth?.schedule?.bufferTime || 0) / 60) * 25)}%`,
                          backgroundColor: '#4F9CF9',
                          opacity: Math.min(1, Math.max(0.4, ((workHealth?.schedule?.bufferTime || 0) / 60) / 4))
                        }}
                      />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {Math.floor((workHealth?.schedule?.bufferTime || 0) / 60)}h {(workHealth?.schedule?.bufferTime || 0) % 60}m between activities
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Key Insight
                  </h4>
                  <div className="p-3 rounded" style={{ backgroundColor: 'rgba(79, 156, 249, 0.1)', border: '1px solid rgba(79, 156, 249, 0.2)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {workHealth?.adaptivePerformanceIndex >= 75 ? 
                        'Your current schedule structure supports sustainable performance. Consider maintaining this balance of meetings and focused work time.' :
                        workHealth?.adaptivePerformanceIndex >= 50 ?
                        'Your schedule shows moderate density. Try consolidating meetings into blocks to create longer periods for focused work.' :
                        'Your schedule has high meeting density. Consider which meetings could be shortened, combined, or rescheduled to create more continuous work time.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Cognitive Resilience Tab */}
        {activeTab === 'resilience' && (
          <div className="space-y-16">
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
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Your {workHealth?.cognitiveResilience || 0}% Cognitive Resilience
                </h3>
                <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Your mental capacity for handling decisions and context changes throughout the day.
                </p>
                
                {/* Cognitive Resilience Components */}
                <div className="space-y-5 mb-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Mental Energy
                      </span>
                      <span className="text-xs" style={{ 
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {((workHealth?.focusTime || 0) / 60) >= 4 ? 'Good' : 
                         ((workHealth?.focusTime || 0) / 60) >= 2 ? 'Moderate' : 'Limited'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div 
                        className="h-1.5 rounded transition-all duration-700"
                        style={{ 
                          width: `${Math.min(100, ((workHealth?.focusTime || 0) / 60) * 22)}%`,
                          backgroundColor: '#4F9CF9',
                          opacity: Math.min(1, Math.max(0.4, ((workHealth?.focusTime || 0) / 60) / 4))
                        }}
                      />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {Math.floor((workHealth?.focusTime || 0) / 60)}h {(workHealth?.focusTime || 0) % 60}m for deep thinking
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Task Switching
                      </span>
                      <span className="text-xs" style={{ 
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {(workHealth?.schedule?.meetingCount || 0) <= 2 ? 'Light' : 
                         (workHealth?.schedule?.meetingCount || 0) <= 4 ? 'Moderate' : 'Heavy'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div 
                        className="h-1.5 rounded transition-all duration-700"
                        style={{ 
                          width: `${Math.max(25, 100 - ((workHealth?.schedule?.meetingCount || 0) * 18))}%`,
                          backgroundColor: '#4F9CF9',
                          opacity: Math.max(0.4, (100 - ((workHealth?.schedule?.meetingCount || 0) * 18)) / 100)
                        }}
                      />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {workHealth?.schedule?.meetingCount || 0} different meetings to navigate
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Decision Load
                      </span>
                      <span className="text-xs" style={{ 
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {(workHealth?.schedule?.meetingCount || 0) <= 3 ? 'Light' : 
                         (workHealth?.schedule?.meetingCount || 0) <= 6 ? 'Moderate' : 'Heavy'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div 
                        className="h-1.5 rounded transition-all duration-700"
                        style={{ 
                          width: `${Math.max(20, 100 - ((workHealth?.schedule?.meetingCount || 0) * 12))}%`,
                          backgroundColor: '#4F9CF9',
                          opacity: Math.max(0.4, (100 - ((workHealth?.schedule?.meetingCount || 0) * 12)) / 100)
                        }}
                      />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Choices and decisions across meetings
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Reset Opportunities
                      </span>
                      <span className="text-xs" style={{ 
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {(workHealth?.schedule?.backToBackCount || 0) === 0 ? 'Good' : 
                         (workHealth?.schedule?.backToBackCount || 0) <= 2 ? 'Moderate' : 'Limited'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div 
                        className="h-1.5 rounded transition-all duration-700"
                        style={{ 
                          width: `${Math.max(30, 100 - ((workHealth?.schedule?.backToBackCount || 0) * 25))}%`,
                          backgroundColor: '#4F9CF9',
                          opacity: Math.max(0.4, (100 - ((workHealth?.schedule?.backToBackCount || 0) * 25)) / 100)
                        }}
                      />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {(workHealth?.schedule?.backToBackCount || 0) === 0 ? 
                          'Well-spaced meetings' : 
                          `${workHealth?.schedule?.backToBackCount} back-to-back sessions`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Key Insight
                  </h4>
                  <div className="p-3 rounded" style={{ backgroundColor: 'rgba(79, 156, 249, 0.1)', border: '1px solid rgba(79, 156, 249, 0.2)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {workHealth?.cognitiveResilience >= 80 ? 
                        'Your mental capacity appears strong for handling multiple decisions and context switches. Your current approach is working well.' :
                        workHealth?.cognitiveResilience >= 60 ?
                        'Your cognitive resilience is moderate. Consider grouping similar meetings together to reduce the mental effort needed for context switching.' :
                        'Your schedule may be creating cognitive fatigue. Try creating buffer time between meetings to allow for mental transitions and recovery.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Sustainability Index Tab */}
        {activeTab === 'sustainability' && (
          <div className="space-y-16">
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
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Your {workHealth?.workRhythmRecovery || 0}% Sustainability Index
                </h3>
                <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  How sustainable your current work patterns are for long-term performance.
                </p>
                
                {/* Sustainability Components */}
                <div className="space-y-5 mb-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Work Load Balance
                      </span>
                      <span className="text-xs" style={{ 
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {(workHealth?.schedule?.meetingCount || 0) <= 3 ? 'Light' : 
                         (workHealth?.schedule?.meetingCount || 0) <= 5 ? 'Moderate' : 'Heavy'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div 
                        className="h-1.5 rounded transition-all duration-700"
                        style={{ 
                          width: `${Math.max(25, 100 - ((workHealth?.schedule?.meetingCount || 0) * 12))}%`,
                          backgroundColor: '#4F9CF9',
                          opacity: Math.max(0.4, (100 - ((workHealth?.schedule?.meetingCount || 0) * 12)) / 100)
                        }}
                      />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {workHealth?.schedule?.meetingCount || 0} meetings across your day
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Time Commitment
                      </span>
                      <span className="text-xs" style={{ 
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {(workHealth?.schedule?.durationHours || 0) <= 3 ? 'Light' : 
                         (workHealth?.schedule?.durationHours || 0) <= 5 ? 'Moderate' : 'Heavy'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div 
                        className="h-1.5 rounded transition-all duration-700"
                        style={{ 
                          width: `${Math.max(20, 100 - ((workHealth?.schedule?.durationHours || 0) * 18))}%`,
                          backgroundColor: '#4F9CF9',
                          opacity: Math.max(0.4, (100 - ((workHealth?.schedule?.durationHours || 0) * 18)) / 100)
                        }}
                      />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {workHealth?.schedule?.durationHours || 0}h in structured meetings
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Recovery Balance
                      </span>
                      <span className="text-xs" style={{ 
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {((workHealth?.schedule?.bufferTime || 0) / 60) >= 3 ? 'Good' : 
                         ((workHealth?.schedule?.bufferTime || 0) / 60) >= 1 ? 'Moderate' : 'Limited'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div 
                        className="h-1.5 rounded transition-all duration-700"
                        style={{ 
                          width: `${Math.min(100, ((workHealth?.schedule?.bufferTime || 0) / 60) * 25)}%`,
                          backgroundColor: '#4F9CF9',
                          opacity: Math.min(1, Math.max(0.4, ((workHealth?.schedule?.bufferTime || 0) / 60) / 4))
                        }}
                      />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {Math.floor((workHealth?.schedule?.bufferTime || 0) / 60)}h {(workHealth?.schedule?.bufferTime || 0) % 60}m for transitions
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Schedule Pattern
                      </span>
                      <span className="text-xs" style={{ 
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {(workHealth?.schedule?.backToBackCount || 0) === 0 ? 'Structured' : 'Condensed'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded h-1.5">
                      <div 
                        className="h-1.5 rounded transition-all duration-700"
                        style={{ 
                          width: `${Math.max(30, 100 - ((workHealth?.schedule?.backToBackCount || 0) * 20))}%`,
                          backgroundColor: '#4F9CF9',
                          opacity: Math.max(0.4, (100 - ((workHealth?.schedule?.backToBackCount || 0) * 20)) / 100)
                        }}
                      />
                    </div>
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {(workHealth?.schedule?.backToBackCount || 0) === 0 ? 
                          'Distributed throughout day' : 
                          `${workHealth?.schedule?.backToBackCount} compressed blocks`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Key Insight
                  </h4>
                  <div className="p-3 rounded" style={{ backgroundColor: 'rgba(79, 156, 249, 0.1)', border: '1px solid rgba(79, 156, 249, 0.2)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {workHealth?.workRhythmRecovery >= 70 ? 
                        'Your schedule demonstrates sustainable work patterns with balanced meeting distribution and adequate recovery time. This rhythm supports long-term productivity while maintaining energy reserves throughout the day.' :
                        workHealth?.workRhythmRecovery >= 45 ?
                        'Your work pattern shows moderate sustainability with some areas for optimization. The distribution of meetings and recovery periods could be adjusted to better support sustained performance throughout the day.' :
                        'Your current schedule pattern indicates limited sustainability for long-term performance. The meeting intensity and distribution suggest adjustments to recovery time and workload distribution would support better sustained productivity.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

      </div>
    </div>
  )
}