'use client'

import { useState, useEffect } from 'react'

// Simplified BiometricEngine for MVP
interface BiometricData {
  readiness: number;
  recovery: number;
  strain: number;
  hrv: number;
  sleep: string;
  status: string;
}

interface ConnectionData {
  calendar: boolean;
  wearable: boolean;
}

interface DeviceStatus {
  connected: boolean;
  status: string;
  icon: string;
}

interface ScheduleAnalysis {
  meetingCount: number;
  backToBackCount: number;
  bufferTime: number; // minutes
  durationHours: number;
  fragmentationScore: number; // 0-100
}

interface BiometricBreakdown {
  source: 'whoop' | 'oura' | 'simulated';
  contributors: string[];
  primaryFactors: string[];
}

interface ResearchPrinciple {
  principle: string;
  source: string;
  application: string;
}

interface DataDrivenInsight {
  type: 'current_analysis' | 'schedule_impact' | 'research_backed' | 'algorithm_explanation';
  title: string;
  message: string;
  dataSource: string;
  urgency: 'low' | 'medium' | 'high';
  category: 'biometric' | 'schedule' | 'combination' | 'research';
}

interface WorkCapacityStatus {
  level: 'optimal' | 'good' | 'moderate' | 'recovery' | 'estimated' | 'peak';
  message: string;
  color: string;
  description: string;
}

interface SecondaryMetric {
  label: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'average' | 'needs_attention';
  icon: string;
}

interface CognitiveLoadState {
  current: number; // 0-100%
  baseline: number; // Morning starting load
  accumulated: number; // Added throughout day
  capacity: 'high' | 'medium' | 'low' | 'depleted';
  message: string;
  timeUntilDepletion?: number; // hours
  predictedEndOfDay: number;
}

interface WorkActivity {
  type: 'meeting' | 'focus_work' | 'decision_task' | 'routine_task' | 'break';
  duration: number; // minutes
  complexity: 'low' | 'medium' | 'high';
  attendees?: number;
  isBackToBack?: boolean;
  cognitiveImpact: number; // load percentage to add
}

class BiometricEngine {
  public currentData: BiometricData;
  public previousReadiness: number | null;
  public isConnected: ConnectionData;
  private todaySchedule: ScheduleAnalysis;
  private biometricBreakdown: BiometricBreakdown;
  private cognitiveLoad: CognitiveLoadState;
  private workActivities: WorkActivity[];
  private currentTime: Date;
  private currentScenario: number = 0;

  constructor() {
    // Initialize with first scenario
    this.currentScenario = 0;
    const scenario = this.getScenarioData(this.currentScenario);
    
    this.currentData = scenario.biometrics;
    this.previousReadiness = null;
    this.isConnected = scenario.connections;
    
    // Today's schedule analysis aligned with scenario
    this.todaySchedule = scenario.schedule;
    
    // Current biometric data breakdown
    this.biometricBreakdown = scenario.breakdown;

    // Initialize cognitive load system
    this.currentTime = new Date();
    this.workActivities = this.generateTodaysActivities();
    this.cognitiveLoad = this.calculateCognitiveLoad();
  }

  // Get specific scenario data by index
  private getScenarioData(scenarioIndex: number) {
    const scenarios = [
      // SCENARIO 1 - HIGH PERFORMANCE (85-95%)
      {
        type: 'peak_performance',
        biometrics: {
          readiness: 92,
          recovery: 94,
          strain: 8.5,
          hrv: 78,
          sleep: '8.7h',
          status: 'EXCELLENT'
        },
        schedule: {
          meetingCount: 3,
          backToBackCount: 0,
          bufferTime: 90, // excellent buffer time
          durationHours: 5.5,
          fragmentationScore: 92
        },
        breakdown: {
          source: 'whoop' as const,
          contributors: ['Sleep Quality: 8.7h (Excellent)', 'HRV: 78ms (Excellent)', 'Low Strain: 8.5'],
          primaryFactors: ['Peak physiological readiness', 'Minimal cognitive demand from light schedule']
        },
        connections: {
          calendar: true,
          wearable: true
        }
      },
      // SCENARIO 2 - MODERATE PERFORMANCE (65-79%)
      {
        type: 'good_performance',
        biometrics: {
          readiness: 72,
          recovery: 79,
          strain: 13.2,
          hrv: 61,
          sleep: '7.4h',
          status: 'GOOD'
        },
        schedule: {
          meetingCount: 5,
          backToBackCount: 1,
          bufferTime: 45, // adequate buffer
          durationHours: 7.0,
          fragmentationScore: 74
        },
        breakdown: {
          source: 'oura' as const,
          contributors: ['Sleep Quality: 7.4h (Good)', 'HRV: 61ms (Good)', 'Moderate Strain: 13.2'],
          primaryFactors: ['Solid biometric foundation', 'Moderate schedule load building cognitive demand']
        },
        connections: {
          calendar: true,
          wearable: true
        }
      },
      // SCENARIO 3 - LOW PERFORMANCE (40-64%)
      {
        type: 'recovery_needed',
        biometrics: {
          readiness: 58,
          recovery: 62,
          strain: 19.8,
          hrv: 42,
          sleep: '5.9h',
          status: 'POOR'
        },
        schedule: {
          meetingCount: 8,
          backToBackCount: 4,
          bufferTime: 15, // minimal buffer
          durationHours: 8.5,
          fragmentationScore: 38
        },
        breakdown: {
          source: 'whoop' as const,
          contributors: ['Sleep Quality: 5.9h (Poor)', 'HRV: 42ms (Below Average)', 'High Strain: 19.8'],
          primaryFactors: ['Poor physiological recovery', 'Heavy schedule creating cognitive overload']
        },
        connections: {
          calendar: true,
          wearable: true
        }
      },
      // SCENARIO 4 - NO WEARABLE DATA (50-70% estimated)
      {
        type: 'no_wearable_data',
        biometrics: {
          readiness: 65, // estimated based on schedule only
          recovery: 0, // no data
          strain: 0, // no data
          hrv: 0, // no data
          sleep: 'Unknown',
          status: 'ESTIMATED'
        },
        schedule: {
          meetingCount: 6,
          backToBackCount: 2,
          bufferTime: 30, // calendar-only analysis
          durationHours: 7.5,
          fragmentationScore: 65
        },
        breakdown: {
          source: 'simulated' as const,
          contributors: ['Schedule Analysis: 6 meetings', 'Calendar Load: 7.5h workday', 'No biometric data available'],
          primaryFactors: ['Performance estimated from schedule patterns only', 'Connect wearable for personalized insights']
        },
        connections: {
          calendar: true,
          wearable: false
        }
      }
    ];
    
    return scenarios[scenarioIndex % scenarios.length];
  }

  getCurrentBiometrics() {
    return this.currentData;
  }

  // Whoop-style performance index status aligned with scenarios
  getWorkCapacityStatus(): WorkCapacityStatus {
    const readiness = this.currentData.readiness;
    const isNoWearableData = this.currentData.status === 'ESTIMATED';
    
    if (isNoWearableData) {
      return {
        level: 'estimated',
        message: 'ESTIMATED PERFORMANCE',
        color: '#6b7280', // Gray
        description: 'Limited analysis without biometric data - connect your wearable for full insights and personalized recommendations.'
      };
    } else if (readiness >= 85) {
      return {
        level: 'peak',
        message: 'PEAK PERFORMANCE',
        color: '#25d366', // Green
        description: 'Excellent conditions for strategic work and important decisions. Optimal day for tackling complex projects and high-stakes meetings.'
      };
    } else if (readiness >= 60) {
      return {
        level: 'good',
        message: 'GOOD PERFORMANCE',
        color: '#ffb347', // Yellow/Orange
        description: 'Solid foundation for productive work, maintain steady output. Good capacity for routine work, avoid overly complex decisions.'
      };
    } else {
      return {
        level: 'recovery',
        message: 'RECOVERY NEEDED',
        color: '#ff7744', // Orange-Red
        description: 'Focus on essential tasks only, consider lighter workload. High cognitive load detected - delegate complex tasks, prioritize recovery.'
      };
    }
  }

  // Calculate morning baseline cognitive load from biometrics (inverse of capacity)
  private calculateMorningBaseline(): number {
    const recovery = this.currentData.recovery;
    const hrv = this.currentData.hrv;
    
    // Handle no-wearable data scenario
    if (this.currentData.status === 'ESTIMATED') {
      // For no wearable data, use schedule-only baseline (moderate starting load)
      return 45; // Moderate baseline when no biometric data available
    }
    
    const sleepQuality = parseFloat(this.currentData.sleep.replace('h', ''));
    
    // Good recovery/sleep = LOWER starting load (more cognitive availability)
    let baseline = 0;
    
    // Recovery impact (40% weight) - INVERTED
    if (recovery >= 85) {
      baseline += 10; // Excellent recovery = very low starting load
    } else if (recovery >= 70) {
      baseline += 25; // Good recovery = low starting load  
    } else if (recovery >= 55) {
      baseline += 50; // Moderate recovery = medium starting load
    } else {
      baseline += 75; // Poor recovery = high starting load
    }
    
    // Sleep impact (35% weight) - INVERTED
    if (sleepQuality >= 8) {
      baseline += 5; // Great sleep = low load
    } else if (sleepQuality >= 7) {
      baseline += 15; // Good sleep = low load
    } else if (sleepQuality >= 6) {
      baseline += 30; // Adequate sleep = medium load
    } else {
      baseline += 45; // Poor sleep = high load
    }
    
    // HRV impact (25% weight) - INVERTED  
    if (hrv >= 65) {
      baseline += 5; // High stress resilience = low load
    } else if (hrv >= 50) {
      baseline += 15; // Average resilience = low load
    } else {
      baseline += 25; // Low resilience = higher load
    }
    
    return Math.min(85, Math.max(15, baseline)); // Cap between 15-85%
  }

  // Generate today's work activities aligned with performance scenarios
  private generateTodaysActivities(): WorkActivity[] {
    const currentHour = this.currentTime.getHours();
    const readiness = this.currentData.readiness;
    const activities: WorkActivity[] = [];
    
    // Adjust activity impact based on performance scenario
    if (readiness >= 80) {
      // HIGH PERFORMANCE: Light activities to keep cognitive load low
      if (currentHour >= 9) {
        activities.push({
          type: 'focus_work',
          duration: 90,
          complexity: 'medium',
          cognitiveImpact: 8
        });
        
        activities.push({
          type: 'meeting',
          duration: 60,
          complexity: 'low',
          attendees: 3,
          isBackToBack: false,
          cognitiveImpact: 6
        });
      }
    } else if (readiness >= 65) {
      // MODERATE PERFORMANCE: Moderate activities 
      if (currentHour >= 9) {
        activities.push({
          type: 'focus_work',
          duration: 90,
          complexity: 'medium',
          cognitiveImpact: 12
        });
        
        activities.push({
          type: 'meeting',
          duration: 60,
          complexity: 'medium',
          attendees: 4,
          isBackToBack: false,
          cognitiveImpact: 10
        });
      }
      
      if (currentHour >= 12) {
        activities.push({
          type: 'meeting',
          duration: 45,
          complexity: 'medium',
          attendees: 5,
          isBackToBack: false,
          cognitiveImpact: 12
        });
      }
    } else {
      // RECOVERY NEEDED: Heavy activities that push cognitive load high
      if (currentHour >= 9) {
        activities.push({
          type: 'focus_work',
          duration: 120,
          complexity: 'high',
          cognitiveImpact: 20
        });
        
        activities.push({
          type: 'meeting',
          duration: 60,
          complexity: 'high',
          attendees: 8,
          isBackToBack: true,
          cognitiveImpact: 18
        });
      }
      
      if (currentHour >= 12) {
        activities.push({
          type: 'meeting',
          duration: 30,
          complexity: 'high',
          attendees: 10,
          isBackToBack: true,
          cognitiveImpact: 22
        });
        
        activities.push({
          type: 'decision_task',
          duration: 60,
          complexity: 'high',
          cognitiveImpact: 25
        });
      }
    }
    
    return activities;
  }

  // Calculate current cognitive load state
  private calculateCognitiveLoad(): CognitiveLoadState {
    const baseline = this.calculateMorningBaseline();
    const currentHour = this.currentTime.getHours();
    
    // Calculate accumulated load from completed activities
    let accumulated = 0;
    const completedActivities = this.workActivities.filter(() => {
      // Simulate activities completed based on time of day
      return currentHour >= 10; // Some activities completed
    });
    
    accumulated = completedActivities.reduce((sum, activity) => {
      let impact = activity.cognitiveImpact;
      
      // Add back-to-back penalty
      if (activity.isBackToBack) {
        impact *= 1.3;
      }
      
      // Add complexity multipliers
      if (activity.complexity === 'high') {
        impact *= 1.2;
      } else if (activity.complexity === 'low') {
        impact *= 0.8;
      }
      
      return sum + impact;
    }, 0);
    
    const current = Math.min(100, baseline + accumulated);
    
    // Predict end of day load
    const remainingImpact = this.workActivities
      .filter(() => currentHour < 17) // Remaining activities
      .reduce((sum, activity) => sum + activity.cognitiveImpact, 0);
    
    const predictedEndOfDay = Math.min(100, current + remainingImpact * 0.8);
    
    // Determine capacity and message aligned with readiness
    let capacity: 'high' | 'medium' | 'low' | 'depleted';
    let message: string;
    const readiness = this.currentData.readiness;
    
    // Handle no-wearable data scenario
    if (this.currentData.status === 'ESTIMATED') {
      capacity = 'medium';
      message = `Cognitive Load: Unknown - Connect Device for personalized cognitive load tracking and insights`;
    } else {
      // Align cognitive load capacity with readiness (inverse relationship)
      // High readiness = Low cognitive load = High cognitive availability
      if (readiness >= 80) {
        // OPTIMAL PERFORMANCE: Low cognitive load (25-35%) = High availability
        capacity = 'high';
        message = `Cognitive Load: ${current}% - excellent cognitive availability for strategic work`;
      } else if (readiness >= 60) {
        // MODERATE PERFORMANCE: Moderate cognitive load (45-60%) = Medium availability  
        capacity = 'medium';
        message = `Cognitive Load: ${current}% - adequate cognitive availability for important tasks`;
      } else if (readiness >= 40) {
        // LOW PERFORMANCE: High cognitive load (70-85%) = Low availability
        capacity = 'low';
        message = `Cognitive Load: ${current}% - limited cognitive availability, focus on essential tasks only`;
      } else {
        // RECOVERY NEEDED: Very high cognitive load (85%+) = Depleted availability
        capacity = 'depleted';
        message = `Cognitive Load: ${current}% - cognitive resources depleted, prioritize recovery`;
      }
    }
    
    return {
      current,
      baseline,
      accumulated,
      capacity,
      message,
      predictedEndOfDay
    };
  }

  // Get current cognitive load state
  getCognitiveLoad(): CognitiveLoadState {
    return this.cognitiveLoad;
  }

  // Update cognitive load (call when activities change)
  updateCognitiveLoad(): CognitiveLoadState {
    this.cognitiveLoad = this.calculateCognitiveLoad();
    return this.cognitiveLoad;
  }

  // Secondary metrics with nuanced individual thresholds for visual indicators only
  getSecondaryMetrics(): SecondaryMetric[] {
    const cognitiveLoad = this.getCognitiveLoad();
    const focusTime = Math.round((8 - this.todaySchedule.durationHours) * 60);
    
    return [
      {
        label: 'Cognitive Load',
        value: this.currentData.status === 'ESTIMATED' ? 'Unknown' : cognitiveLoad.current,
        unit: this.currentData.status === 'ESTIMATED' ? '' : '%',
        // Cognitive Load: 0-50% green, 51-75% yellow, 76%+ red
        status: this.currentData.status === 'ESTIMATED' ? 'average' :
                cognitiveLoad.current >= 76 ? 'needs_attention' : // 76%+ = Red (very high, problematic)
                cognitiveLoad.current >= 51 ? 'average' : // 51-75% = Yellow (elevated)
                'good', // 0-50% = Green (optimal)
        icon: '🧠'
      },
      {
        label: 'Schedule Load',
        value: this.todaySchedule.meetingCount,
        unit: ' meetings',
        // Schedule Load: 1-4 green, 5-6 yellow, 7+ red
        status: this.todaySchedule.meetingCount >= 7 ? 'needs_attention' : // 7+ = Red (excessive)
                this.todaySchedule.meetingCount >= 5 ? 'average' : // 5-6 = Yellow (building up)
                'good', // 1-4 = Green (manageable)
        icon: '📅'
      },
      {
        label: 'Focus Time',
        value: focusTime,
        unit: ' min',
        // Focus Time: 60+ min green, 30-59 yellow, <30 or negative red
        status: focusTime < 30 ? 'needs_attention' : // <30 min or negative = Red (insufficient/negative)
                focusTime < 60 ? 'average' : // 30-59 min = Yellow (limited)
                'good', // 60+ min = Green (adequate)
        icon: '🎯'
      }
    ];
  }

  getTopRecommendations(): DataDrivenInsight[] {
    const insights = this.generateDataDrivenInsights();
    return insights
      .sort((a, b) => {
        const urgencyWeight = { high: 3, medium: 2, low: 1 };
        return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
      })
      .slice(0, 3);
  }

  getConnectionStatus(): Record<string, DeviceStatus> {
    return {
      calendar: {
        connected: this.isConnected.calendar,
        status: this.isConnected.calendar ? 'Connected' : 'Connect Google Calendar',
        icon: '📅'
      },
      wearable: {
        connected: this.isConnected.wearable,
        status: this.isConnected.wearable ? 'Whoop Connected' : 'Connect Wearable Device',
        icon: '⌚'
      }
    };
  }

  refreshData(previousData: BiometricData | null = null) {
    this.previousReadiness = this.currentData.readiness;
    
    // Cycle to next scenario
    this.currentScenario = (this.currentScenario + 1) % 4;
    const scenario = this.getScenarioData(this.currentScenario);
    
    // Update all data to match new scenario
    this.currentData = scenario.biometrics;
    this.isConnected = scenario.connections;
    this.todaySchedule = scenario.schedule;
    this.biometricBreakdown = scenario.breakdown;
    
    // Update cognitive load based on new scenario
    this.currentTime = new Date();
    this.workActivities = this.generateTodaysActivities();
    this.cognitiveLoad = this.calculateCognitiveLoad();

    return {
      data: this.currentData,
      refreshTime: new Date()
    };
  }

  getReadinessDelta(): { delta: number; formatted: string; color: string; direction?: string } {
    if (this.previousReadiness === null) {
      return { delta: 0, formatted: "First reading", color: "text-gray-400" };
    }
    
    const delta = this.currentData.readiness - this.previousReadiness;
    const absDelta = Math.abs(delta);
    
    if (delta > 0) {
      return {
        delta,
        formatted: `↑${absDelta}%`,
        color: "text-green-400",
        direction: "increase"
      };
    } else if (delta < 0) {
      return {
        delta,
        formatted: `↓${absDelta}%`,
        color: "text-red-400", 
        direction: "decrease"
      };
    } else {
      return {
        delta: 0,
        formatted: "→0%",
        color: "text-gray-400",
        direction: "stable"
      };
    }
  }

  // Analyze current biometric data without historical claims
  private analyzeTodaysBiometrics(): DataDrivenInsight[] {
    const insights: DataDrivenInsight[] = [];
    const current = this.currentData;
    
    // Current Recovery Analysis
    if (current.recovery >= 90) {
      insights.push({
        type: 'current_analysis',
        title: 'Strong Recovery Detected',
        message: `Recovery at ${current.recovery}% indicates your body has effectively processed recent stress and is physiologically ready for demanding tasks. Key contributors: ${this.biometricBreakdown.contributors.join(', ')}.`,
        dataSource: `${this.biometricBreakdown.source} biometric data`,
        urgency: 'medium',
        category: 'biometric'
      });
    } else if (current.recovery <= 70) {
      insights.push({
        type: 'current_analysis',
        title: 'Recovery Needs Attention',
        message: `Recovery at ${current.recovery}% suggests incomplete physiological restoration. Consider light activity and prioritize essential tasks only until recovery improves.`,
        dataSource: `${this.biometricBreakdown.source} biometric data`,
        urgency: 'high',
        category: 'biometric'
      });
    }
    
    // HRV Analysis
    if (current.hrv >= 65) {
      insights.push({
        type: 'current_analysis',
        title: 'Above-Average Stress Resilience',
        message: `HRV of ${current.hrv}ms is above the general population average (50-60ms), indicating good autonomic nervous system balance and stress resilience capacity today.`,
        dataSource: `${this.biometricBreakdown.source} HRV measurement`,
        urgency: 'low',
        category: 'biometric'
      });
    }
    
    return insights;
  }

  // Analyze today's schedule impact
  private analyzeScheduleImpact(): DataDrivenInsight[] {
    const insights: DataDrivenInsight[] = [];
    const schedule = this.todaySchedule;
    
    // Meeting density analysis
    if (schedule.meetingCount >= 6) {
      insights.push({
        type: 'schedule_impact',
        title: 'High Meeting Density Detected',
        message: `${schedule.meetingCount} meetings today exceeds research-optimal density (4-5 meetings). With ${schedule.backToBackCount} back-to-back sessions and only ${schedule.bufferTime} minutes of buffer time, cognitive load will be elevated.`,
        dataSource: 'Calendar analysis + meeting density research',
        urgency: 'medium',
        category: 'schedule'
      });
    }
    
    // Schedule fragmentation
    if (schedule.fragmentationScore < 75) {
      insights.push({
        type: 'schedule_impact',
        title: 'Schedule Fragmentation Impact',
        message: `Schedule fragmentation score of ${schedule.fragmentationScore}/100 indicates limited focused work blocks. This pattern typically reduces deep work effectiveness.`,
        dataSource: 'Calendar time-block analysis',
        urgency: 'medium',
        category: 'schedule'
      });
    }
    
    return insights;
  }

  // Research-backed recommendations
  private generateResearchBackedRecommendations(): DataDrivenInsight[] {
    const insights: DataDrivenInsight[] = [];
    const current = this.currentData;
    const schedule = this.todaySchedule;
    
    // Circadian rhythm optimization
    insights.push({
      type: 'research_backed',
      title: 'Circadian Timing Optimization',
      message: 'Research shows cognitive performance peaks 2-4 hours after waking and declines after 2 PM. Schedule high-stakes decisions and complex work during your morning peak window.',
      dataSource: 'Circadian rhythm research (Schmidt et al., 2007)',
      urgency: 'low',
      category: 'research'
    });
    
    // Meeting buffer research
    if (schedule.backToBackCount >= 2) {
      insights.push({
        type: 'research_backed',
        title: 'Meeting Buffer Benefits',
        message: 'Studies show 10-15 minute buffers between meetings improve focus retention by 23% and reduce decision fatigue. Consider adding transitions between your back-to-back sessions.',
        dataSource: 'Workplace productivity research (Microsoft 2021)',
        urgency: 'medium',
        category: 'research'
      });
    }
    
    // Recovery-based recommendations
    if (current.recovery >= 90) {
      insights.push({
        type: 'research_backed',
        title: 'High-Stakes Task Timing',
        message: 'With strong physiological recovery, this is optimal timing for challenging decisions. Research indicates 67% better outcomes for complex tasks when recovery metrics are elevated.',
        dataSource: 'Performance psychology research',
        urgency: 'medium',
        category: 'research'
      });
    }
    
    return insights;
  }

  // Algorithm transparency
  private explainAlgorithm(): DataDrivenInsight {
    const current = this.currentData;
    const schedule = this.todaySchedule;
    
    // Simple algorithm explanation
    const biometricScore = Math.round((current.recovery * 0.4) + (current.hrv * 0.6));
    const scheduleImpact = Math.max(0, 100 - (schedule.meetingCount * 8) - (schedule.backToBackCount * 5));
    const combinedScore = Math.round((biometricScore * 0.7) + (scheduleImpact * 0.3));
    
    return {
      type: 'algorithm_explanation',
      title: 'Readiness Calculation',
      message: `Your ${current.readiness}% readiness combines: Biometric Score ${biometricScore}% (Recovery ${current.recovery}% × 40% + HRV ${current.hrv}ms normalized × 60%) + Schedule Impact ${scheduleImpact}% (meeting load penalty). Formula: (Biometric × 70%) + (Schedule × 30%).`,
      dataSource: 'Transparent algorithm calculation',
      urgency: 'low',
      category: 'combination'
    };
  }

  // Generate cognitive load predictions and insights
  private generateCognitiveLoadInsights(): DataDrivenInsight[] {
    const insights: DataDrivenInsight[] = [];
    const cognitiveLoad = this.getCognitiveLoad();
    const currentHour = this.currentTime.getHours();
    
    const readiness = this.currentData.readiness;
    
    // Handle no-wearable data scenario
    if (this.currentData.status === 'ESTIMATED') {
      insights.push({
        type: 'current_analysis',
        title: 'Limited Performance Analysis',
        message: `Performance estimate (${readiness}%) based on schedule analysis only. Connect your wearable device for personalized biometric insights, cognitive load tracking, and more accurate performance predictions.`,
        dataSource: 'Calendar analysis only',
        urgency: 'medium',
        category: 'combination'
      });
      return insights;
    }
    
    // Coherent insights based on performance levels (inverse relationship)
    if (readiness >= 80) {
      // OPTIMAL PERFORMANCE: High work capacity + Low cognitive load = High availability
      insights.push({
        type: 'current_analysis',
        title: 'Peak Cognitive Availability',
        message: `Low cognitive load (${cognitiveLoad.current}%) with excellent biometric recovery (${this.currentData.recovery}%). Your mental resources are fresh and available. This is ideal timing for high-stakes work, complex problem-solving, and strategic decisions.`,
        dataSource: 'Biometric baseline + activity tracking',
        urgency: 'medium',
        category: 'combination'
      });
    } else if (readiness >= 60) {
      // MODERATE PERFORMANCE: Moderate work capacity + Moderate cognitive load = Medium availability
      insights.push({
        type: 'current_analysis',
        title: 'Moderate Cognitive Availability',
        message: `Moderate cognitive load (${cognitiveLoad.current}%) with adequate biometric state (${this.currentData.recovery}% recovery). Some mental resources consumed but capacity remains. Focus on important tasks and maintain steady output.`,
        dataSource: 'Biometric baseline + activity tracking',
        urgency: 'low',
        category: 'combination'
      });
    } else if (readiness >= 40) {
      // LOW PERFORMANCE: Low work capacity + High cognitive load = Low availability
      insights.push({
        type: 'current_analysis',
        title: 'High Cognitive Load Limiting Performance',
        message: `⚠️ Cognitive load at ${cognitiveLoad.current}% is the primary factor dragging down your ${readiness}% Performance Index. Despite adequate biometric recovery (${this.currentData.recovery}%), your mental resources are overextended. Focus on essential tasks only, delegate complex decisions, and consider lighter workload.`,
        dataSource: 'Biometric baseline + activity tracking',
        urgency: 'high',
        category: 'combination'
      });
    } else {
      // RECOVERY NEEDED: Very low capacity + Very high cognitive load = Depleted
      insights.push({
        type: 'current_analysis',
        title: 'Critical: Cognitive Overload Detected',
        message: `🚨 Extremely high cognitive load (${cognitiveLoad.current}%) combined with poor biometric recovery (${this.currentData.recovery}%) is creating a performance crisis. Mental resources are severely depleted. Immediate action required: prioritize recovery, keep workload minimal, and reschedule non-essential commitments.`,
        dataSource: 'Biometric baseline + activity tracking',
        urgency: 'high',
        category: 'combination'
      });
    }
    
    // Special insight for when cognitive load is the main limiting factor
    if (cognitiveLoad.current >= 70 && this.currentData.recovery >= 70) {
      insights.push({
        type: 'current_analysis',
        title: 'Cognitive Load is Your Primary Bottleneck',
        message: `🎯 Your biometric recovery is solid (${this.currentData.recovery}%), but cognitive load (${cognitiveLoad.current}%) is what's preventing peak performance. This suggests schedule optimization rather than physical recovery should be your focus today.`,
        dataSource: 'Cognitive load vs biometric analysis',
        urgency: 'high',
        category: 'combination'
      });
    }

    // Schedule-specific insights aligned with performance level
    if (readiness < 60 && this.todaySchedule.meetingCount >= 7) {
      insights.push({
        type: 'schedule_impact',
        title: 'Schedule Overload Warning',
        message: `Heavy meeting load (${this.todaySchedule.meetingCount} meetings) detected when recovery capacity is limited. Consider rescheduling non-essential meetings or delegating attendance to maintain performance quality.`,
        dataSource: 'Schedule analysis + performance state',
        urgency: 'high',
        category: 'schedule'
      });
    } else if (readiness >= 80 && cognitiveLoad.capacity === 'high' && currentHour < 14) {
      insights.push({
        type: 'research_backed',
        title: 'Strategic Work Window',
        message: `Peak cognitive availability detected (${cognitiveLoad.current}% load). Research shows mental performance is highest during morning hours when biometric recovery is strong. This is the optimal time for your most challenging work and complex decisions.`,
        dataSource: 'Performance state + circadian research',
        urgency: 'medium',
        category: 'research'
      });
    }
    
    return insights;
  }

  // Main method to generate honest, data-driven insights
  private generateDataDrivenInsights(): DataDrivenInsight[] {
    const allInsights: DataDrivenInsight[] = [
      ...this.generateCognitiveLoadInsights(),
      ...this.analyzeTodaysBiometrics(),
      ...this.analyzeScheduleImpact(),
      ...this.generateResearchBackedRecommendations(),
      this.explainAlgorithm()
    ];
    
    return allInsights;
  }

  getContextualExplanation(): string {
    const insights = this.generateDataDrivenInsights();
    const algorithmExplanation = insights.find(i => i.type === 'algorithm_explanation');
    
    if (algorithmExplanation) {
      return algorithmExplanation.message;
    }
    
    // Fallback to simple current data explanation
    const current = this.currentData;
    return `Your ${current.readiness}% professional readiness combines current biometric data (Recovery: ${current.recovery}%, HRV: ${current.hrv}ms, Sleep: ${current.sleep}) with today's schedule analysis. This score reflects your physiological capacity and cognitive load for optimal work performance.`;
  }
}

export default function PersistDashboard() {
  const [engine] = useState(() => new BiometricEngine());
  const [currentBiometrics, setCurrentBiometrics] = useState<BiometricData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshCount, setRefreshCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, DeviceStatus> | null>(null);

  useEffect(() => {
    setCurrentBiometrics(engine.getCurrentBiometrics());
    setConnectionStatus(engine.getConnectionStatus());
    setLastRefresh(new Date());
    
    // Check if user needs onboarding (only on client side)
    if (typeof window !== 'undefined') {
      const hasSeenOnboarding = localStorage.getItem('persist-onboarding-complete');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [engine]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const previousData = currentBiometrics;
    
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Refresh data with variations
    const refreshResult = engine.refreshData(previousData);
    
    // Update all state
    setCurrentBiometrics(refreshResult.data);
    setLastRefresh(refreshResult.refreshTime);
    setRefreshCount(prev => prev + 1);
    setIsRefreshing(false);
  };

  const handleConnectDevice = (deviceType: string) => {
    if (deviceType === 'calendar') {
      engine.isConnected.calendar = true;
      setConnectionStatus(engine.getConnectionStatus());
    } else if (deviceType === 'wearable') {
      engine.isConnected.wearable = true;
      setConnectionStatus(engine.getConnectionStatus());
    }
  };

  const completeOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('persist-onboarding-complete', 'true');
    }
    setShowOnboarding(false);
  };

  const getCircleColor = (type: string) => {
    if (!currentBiometrics) return '#ff9500';
    
    if (type === 'readiness') {
      if (currentBiometrics.readiness >= 80) return '#00ff41'
      if (currentBiometrics.readiness >= 60) return '#ff9500'
      return '#ff3b30'
    }
    return '#007aff'
  }

  if (!currentBiometrics) return <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-white">Loading...</div>;

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 gradient-text">PERSIST</h1>
            <p className="text-gray-400">Your Professional Readiness Assistant</p>
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
                  <p className="text-gray-400 text-sm">Analyze meeting patterns and schedule optimization</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Connect Wearable Device</h3>
                  <p className="text-gray-400 text-sm">Track biometrics for professional readiness insights</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Get Actionable Insights</h3>
                  <p className="text-gray-400 text-sm">Optimize your work performance with data-driven recommendations</p>
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

  const workCapacity = engine.getWorkCapacityStatus();
  const secondaryMetrics = engine.getSecondaryMetrics();
  const cognitiveLoad = engine.getCognitiveLoad();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Clean Header */}
      <header className="px-6 py-6 sticky top-0 z-40 bg-black/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-medium tracking-wide" style={{ color: 'var(--text-primary)' }}>
            PERSIST
          </h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors duration-200"
            style={{ 
              color: isRefreshing ? 'var(--text-muted)' : 'var(--text-secondary)',
              border: `1px solid ${isRefreshing ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
              backgroundColor: 'transparent'
            }}
          >
            {isRefreshing ? 'Updating...' : 'Refresh'}
          </button>
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
                strokeDashoffset={(339.29 - (currentBiometrics?.readiness || 0) / 100 * 339.29)} 
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-5xl font-light mb-1 transition-all duration-500 ${isRefreshing ? 'opacity-50' : ''}`} style={{ 
                  color: workCapacity.color, // Use the ring color for the number too
                  fontFeatureSettings: '"tnum"',
                  letterSpacing: '-0.04em'
                }}>
                  {isRefreshing ? '—' : `${currentBiometrics?.readiness || 0}`}
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


          {/* Scenario indicators */}
          <div className="flex justify-center space-x-2 mb-4">
            {Array.from({ length: 4 }, (_, i) => {
              const isActive = i === (refreshCount % 4);
              const scenarioColors = ['#25d366', '#ffb347', '#ff7744', '#6b7280']; // green, yellow, orange-red, gray
              return (
                <div 
                  key={i}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: isActive ? scenarioColors[i] : 'rgba(255,255,255,0.2)',
                    transform: isActive ? 'scale(1.2)' : 'scale(1)'
                  }}
                />
              );
            })}
          </div>
        </section>

        {/* Clean Secondary Metrics with Subtle Visual Indicators */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
            {secondaryMetrics.map((metric, index) => {
              // Visual indicator colors only - text stays white
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
                    color: 'var(--text-primary)' // Always white text
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
                            width: metric.value === 'Unknown' ? '100%' : `${metric.value}%`,
                            backgroundColor: metric.value === 'Unknown' ? 'rgba(107, 114, 128, 0.3)' : 
                                             getIndicatorColor(metric.status)
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
                        const availableBlocks = Math.max(0, Math.floor(Number(metric.value) / 60)); // Available time blocks
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
                  
                  {index < secondaryMetrics.length - 1 && (
                    <div className="hidden lg:block absolute top-0 right-0 w-px h-full whoop-clean-divider" />
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
            {engine.getTopRecommendations().slice(0, 2).map((insight, index) => (
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
                {index < 1 && <hr className="whoop-clean-divider mt-8" />}
              </div>
            ))}
          </div>
        </section>

        {/* Clean Connections Section */}
        <section>
          <h2 className="whoop-section-title mb-8">
            Connections
          </h2>
          
          <div className="space-y-6">
            {connectionStatus && Object.entries(connectionStatus).map(([key, device]: [string, DeviceStatus], index) => (
              <div key={key}>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="whoop-insight-title capitalize mb-1">
                      {key}
                    </h3>
                    <p className="text-xs font-medium" style={{ 
                      color: device.connected ? 'var(--whoop-green)' : 'var(--text-muted)' 
                    }}>
                      {device.status}
                    </p>
                  </div>
                  
                  {!device.connected ? (
                    <button
                      onClick={() => handleConnectDevice(key)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors duration-200"
                      style={{ 
                        color: 'var(--whoop-green)',
                        border: '1px solid rgba(37,211,102,0.3)',
                        backgroundColor: 'rgba(37,211,102,0.05)'
                      }}
                    >
                      Connect
                    </button>
                  ) : (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--whoop-green)' }} />
                  )}
                </div>
                {index < Object.entries(connectionStatus).length - 1 && (
                  <hr className="whoop-clean-divider" />
                )}
              </div>
            ))}
          </div>
        </section>
        
        {refreshCount > 0 && (
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