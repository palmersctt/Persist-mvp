'use client'

import { useState, useEffect } from 'react'

// Enhanced Engine for biometric and meeting analysis
class BiometricEngine {
  constructor() {
    this.currentData = {
      readiness: 87,
      recovery: 94,
      strain: 12.1,
      hrv: 67,
      sleep: '8.4h',
      status: 'READY'
    };
    this.previousReadiness = null; // Track previous score for delta calculation
  }

  getCurrentBiometrics() {
    return this.currentData;
  }

  getWorkInsights() {
    return {
      workImpactAnalysis: [
        "Your 7 meetings today exceed optimal density (3-4) for sustained performance",
        "Back-to-back sessions detected - historically reduces effectiveness by 18%",
        "Current workload predicts -12% readiness tomorrow without recovery time"
      ],
      patternRecognition: [
        "You perform 31% better in morning strategic sessions vs afternoon",
        "High-readiness days (85%+) correlate with 89% meeting success rate",
        "Energy dips typically occur 2-4 PM based on your patterns"
      ],
      actionableRecommendations: [
        "Schedule important decisions before 11 AM during peak cognitive window",
        "Add 15-minute buffers between meetings to maintain performance",
        "Consider rescheduling 2 PM session to morning for optimal outcomes"
      ]
    };
  }

  getAggregateBiometricScore() {
    // Aggregate recovery, sleep quality, and HRV into single biometric score
    const recovery = this.currentData.recovery; // 94%
    const sleepScore = 89; // Derived from sleep: '8.4h' (good quality)
    const hrvScore = this.currentData.hrv; // 67 (normalized to %)
    
    // Weighted average: Recovery 50%, Sleep 30%, HRV 20%
    const biometricScore = Math.round(
      (recovery * 0.5) + (sleepScore * 0.3) + (hrvScore * 0.2)
    );
    
    return biometricScore; // Should be around 91%
  }

  refreshData(previousData = null) {
    // Store previous readiness for delta calculation
    this.previousReadiness = this.currentData.readiness;
    
    // Generate realistic variations in biometric data
    const readinessVariation = (Math.random() - 0.5) * 30; // ±15% variation
    const recoveryVariation = (Math.random() - 0.5) * 20; // ±10% variation
    const strainVariation = (Math.random() - 0.5) * 8; // ±4 variation
    const hrvVariation = (Math.random() - 0.5) * 20; // ±10 variation
    
    this.currentData = {
      readiness: Math.max(65, Math.min(95, Math.round(87 + readinessVariation))),
      recovery: Math.max(70, Math.min(98, Math.round(94 + recoveryVariation))),
      strain: Math.max(8, Math.min(18, parseFloat((12.1 + strainVariation).toFixed(1)))),
      hrv: Math.max(50, Math.min(80, Math.round(67 + hrvVariation))),
      sleep: '8.4h',
      status: 'READY'
    };

    // Calculate changes if previous data exists
    let changeInsight = null;
    if (previousData) {
      const readinessChange = this.currentData.readiness - previousData.readiness;
      const absChange = Math.abs(readinessChange);
      
      if (absChange >= 8) {
        if (readinessChange > 0) {
          changeInsight = `Recovery detected (+${readinessChange}%) - good time for important decisions`;
        } else {
          changeInsight = `Readiness decreased (${readinessChange}%) - consider postponing non-critical meetings`;
        }
      } else if (absChange >= 3) {
        if (readinessChange > 0) {
          changeInsight = `Slight improvement (+${readinessChange}%) - energy trending upward`;
        } else {
          changeInsight = `Minor decline (${readinessChange}%) - maintain current activity level`;
        }
      } else {
        changeInsight = "Maintaining steady performance - proceed with scheduled activities";
      }
    }

    return {
      data: this.currentData,
      changeInsight: changeInsight,
      refreshTime: new Date()
    };
  }

  getReadinessDelta() {
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

  getContextualExplanation(deltaInfo, readinessScore, biometricScore) {
    const biometricLevel = biometricScore >= 90 ? 'excellent' : biometricScore >= 85 ? 'strong' : 'adequate';
    
    if (deltaInfo.formatted === "First reading") {
      return `Your work impact score combines biological readiness with professional work patterns. Current ${readinessScore}% shows ${biometricLevel} biometric foundation for optimal work performance.`;
    }
    
    const absDelta = Math.abs(deltaInfo.delta);
    const magnitude = absDelta >= 10 ? 'significantly' : absDelta >= 5 ? 'moderately' : 'slightly';
    
    if (deltaInfo.direction === "increase") {
      const advice = readinessScore >= 85 ? "Excellent timing for high-priority tasks" : "Good opportunity to tackle important work";
      return `Your readiness has ${magnitude} improved (${deltaInfo.formatted}). ${advice} - your ${biometricLevel} biometric foundation supports peak performance.`;
    } else if (deltaInfo.direction === "decrease") {
      const advice = readinessScore < 75 ? "Consider postponing non-critical meetings and focus on essential tasks only" : 
                    readinessScore < 85 ? "Prioritize important work and consider shorter meeting blocks" : 
                    "Still good for most work demands with minor adjustments";
      return `Your readiness has ${magnitude} decreased (${deltaInfo.formatted}). ${advice}. Monitor recovery patterns for tomorrow.`;
    } else {
      return `Your readiness remains stable (${deltaInfo.formatted}). Current ${readinessScore}% with ${biometricLevel} biometrics - maintain consistent work patterns.`;
    }
  }

  getWorkImpactBreakdown() {
    const biometricScore = this.getAggregateBiometricScore();
    const deltaInfo = this.getReadinessDelta();
    
    // Use the main readiness score as the single source of truth
    const readinessScore = this.currentData.readiness;
    
    // Add some variation to work metrics based on current readiness
    const readinessLevel = readinessScore;
    const meetingDensityBase = readinessLevel > 85 ? 78 : readinessLevel > 75 ? 72 : 68;
    const energyAlignmentBase = readinessLevel > 85 ? 94 : readinessLevel > 75 ? 87 : 82;
    
    return {
      title: "Work Impact Breakdown", 
      score: readinessScore, // Use the same score as the ring
      delta: deltaInfo, // Include delta information
      components: [
        { name: "Biometrics", value: biometricScore, weight: 30, contribution: Math.round(biometricScore * 0.30) },
        { name: "Meeting Density", value: meetingDensityBase, weight: 20, contribution: Math.round(meetingDensityBase * 0.20) },
        { name: "Schedule Fragmentation", value: 81, weight: 15, contribution: Math.round(81 * 0.15) },
        { name: "Energy Alignment", value: energyAlignmentBase, weight: 15, contribution: Math.round(energyAlignmentBase * 0.15) },
        { name: "Recovery Buffer", value: 89, weight: 12, contribution: Math.round(89 * 0.12) },
        { name: "Workload Sustainability", value: 85, weight: 8, contribution: Math.round(85 * 0.08) }
      ],
      explanation: this.getContextualExplanation(deltaInfo, readinessScore, biometricScore),
      factors: {
        positive: [
          biometricScore >= 90 ? "Excellent biometric foundation supporting performance" : "Good biometric foundation for work demands",
          energyAlignmentBase >= 90 ? "Optimal energy-schedule alignment" : "Adequate energy-schedule alignment",
          "Sustainable recovery buffers between intense work"
        ],
        negative: [
          meetingDensityBase < 75 ? "Meeting density exceeds optimal threshold" : null,
          "Some schedule fragmentation reducing deep work time"
        ].filter(Boolean)
      }
    };
  }


  getBiometricBreakdown(type) {
    const breakdowns = {
      readiness: {
        title: "Professional Readiness Score",
        score: 87,
        components: [
          { name: "Recovery", value: 94, weight: 35, contribution: 33 },
          { name: "Sleep Performance", value: 89, weight: 25, contribution: 22 },
          { name: "HRV", value: 67, weight: 20, contribution: 13 },
          { name: "Resting Heart Rate", value: 85, weight: 15, contribution: 13 },
          { name: "Previous Day Strain", value: 78, weight: 5, contribution: 4 }
        ],
        explanation: "Your readiness score combines recovery metrics with sleep quality and stress resilience indicators. Today's 87% indicates optimal conditions for peak professional performance - perfect for your most important meetings.",
        factors: {
          positive: ["Excellent recovery (94%)", "Strong sleep performance (8.4h)", "Stress resilience above optimal levels"],
          negative: ["Yesterday's workload slightly impacting today's capacity"]
        }
      },
      recovery: {
        title: "Recovery Score",
        score: 94,
        components: [
          { name: "HRV", value: 67, weight: 50, contribution: 47 },
          { name: "Resting Heart Rate", value: 52, weight: 30, contribution: 28 },
          { name: "Sleep Quality", value: 92, weight: 20, contribution: 18 }
        ],
        explanation: "Recovery measures how well your body has bounced back from recent work demands and stress. 94% indicates exceptional recovery - you're primed for peak professional performance.",
        factors: {
          positive: ["Stress resilience significantly above baseline", "Optimal resting heart rate for performance", "Sleep quality optimized for cognitive function"],
          negative: []
        }
      },
      strain: {
        title: "Daily Strain",
        score: 12.1,
        components: [
          { name: "Work Stress Load", value: 45, weight: 40, contribution: 4.8 },
          { name: "Daily Demands", value: 38, weight: 35, contribution: 4.2 },
          { name: "Stress Management", value: 42, weight: 25, contribution: 3.1 }
        ],
        explanation: "Daily Strain reflects your body's response to work demands and daily stressors. 12.1 is moderate - optimal for sustained professional performance without burnout.",
        factors: {
          positive: ["Balanced workload management", "Well-regulated stress response"],
          negative: ["Capacity for additional high-priority tasks"]
        }
      }
    };
    
    return breakdowns[type];
  }
}

export default function PersistDashboard() {
  const [selectedBiometric, setSelectedBiometric] = useState(null);
  const [engine] = useState(() => new BiometricEngine());
  const [currentBiometrics, setCurrentBiometrics] = useState(null);
  const [workInsights, setWorkInsights] = useState(null);
  const [workImpactBreakdown, setWorkImpactBreakdown] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshCount, setRefreshCount] = useState(0);
  const [changeInsight, setChangeInsight] = useState(null);

  useEffect(() => {
    setCurrentBiometrics(engine.getCurrentBiometrics());
    setWorkInsights(engine.getWorkInsights());
    setWorkImpactBreakdown(engine.getWorkImpactBreakdown());
    setLastRefresh(new Date());
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
    setWorkImpactBreakdown(engine.getWorkImpactBreakdown());
    setChangeInsight(refreshResult.changeInsight);
    setLastRefresh(refreshResult.refreshTime);
    setRefreshCount(prev => prev + 1);
    setIsRefreshing(false);
  };

  const getCircleColor = (type) => {
    if (!currentBiometrics) return '#ff9500';
    
    if (type === 'readiness') {
      if (currentBiometrics.readiness >= 80) return '#00ff41'
      if (currentBiometrics.readiness >= 60) return '#ff9500'
      return '#ff3b30'
    }
    if (type === 'recovery') {
      if (currentBiometrics.recovery >= 85) return '#00ff41'
      if (currentBiometrics.recovery >= 65) return '#ff9500'
      return '#ff3b30'
    }
    return '#007aff' // strain
  }

  const getStrokeDashoffset = (percentage) => {
    const circumference = 339.29
    return circumference - (percentage / 100) * circumference
  }

  if (!currentBiometrics) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  const handleLogoClick = () => {
    setSelectedBiometric(null);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Mobile-First Header */}
      <header className="bg-black border-b border-gray-900 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 
            className="text-lg sm:text-xl font-bold text-white tracking-wide cursor-pointer hover:text-gray-300 transition-colors"
            onClick={handleLogoClick}
          >
            PERSIST
          </h1>
          <div className="text-right hidden sm:block">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Biometric Driven</div>
              <div className="text-white font-medium">Professional Intelligence</div>
            </div>
          </div>
          {/* Mobile-only biometric indicator */}
          <div className="sm:hidden text-right">
            <div className="text-2xl font-bold text-green-400">{currentBiometrics.readiness}%</div>
            <div className="text-xs text-gray-500 uppercase">Ready</div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Mobile Padding */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-20 md:pb-8 pt-6">
        {selectedBiometric ? (
          /* Biometric Detail View */
          <div className="space-y-6">
            <button
              onClick={() => setSelectedBiometric(null)}
              className="text-gray-400 hover:text-white transition-colors mb-4"
            >
              ← Back to Dashboard
            </button>
            
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-700">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {engine.getBiometricBreakdown(selectedBiometric).title}
                  </h2>
                  <div className="text-4xl font-bold text-green-400">
                    {selectedBiometric === 'strain' ? 
                      engine.getBiometricBreakdown(selectedBiometric).score :
                      engine.getBiometricBreakdown(selectedBiometric).score + '%'
                    }
                  </div>
                </div>
                
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a1a" strokeWidth="6"/>
                    <circle cx="60" cy="60" r="54" fill="none" stroke={getCircleColor(selectedBiometric)} strokeWidth="6"
                            strokeDasharray="339.29" strokeDashoffset={selectedBiometric === 'strain' ? 
                              getStrokeDashoffset(Math.min(currentBiometrics.strain * 5, 100)) :
                              getStrokeDashoffset(engine.getBiometricBreakdown(selectedBiometric).score)} strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Score Breakdown */}
                <div className="space-y-6">
                  <section className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Score Breakdown</h3>
                    <div className="space-y-4">
                      {engine.getBiometricBreakdown(selectedBiometric).components.map((component, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">{component.name}</span>
                            <div className="flex items-center space-x-3">
                              <span className="text-white font-medium">{component.value}{selectedBiometric === 'strain' ? '' : '%'}</span>
                              <span className="text-gray-500 text-sm">{component.weight}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{width: `${(component.contribution / engine.getBiometricBreakdown(selectedBiometric).score) * 100}%`}}
                            ></div>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            Contributes {component.contribution}{selectedBiometric === 'strain' ? '' : '%'} to total score
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Analysis & Factors */}
                <div className="space-y-6">
                  <section className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Analysis</h3>
                    <p className="text-gray-300 leading-relaxed mb-6">
                      {engine.getBiometricBreakdown(selectedBiometric).explanation}
                    </p>
                    
                    {engine.getBiometricBreakdown(selectedBiometric).factors.positive.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-green-400 font-semibold mb-2">Positive Factors</h4>
                        <ul className="space-y-1">
                          {engine.getBiometricBreakdown(selectedBiometric).factors.positive.map((factor, index) => (
                            <li key={index} className="text-green-300 text-sm">{factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {engine.getBiometricBreakdown(selectedBiometric).factors.negative.length > 0 && (
                      <div>
                        <h4 className="text-yellow-400 font-semibold mb-2">Areas for Improvement</h4>
                        <ul className="space-y-1">
                          {engine.getBiometricBreakdown(selectedBiometric).factors.negative.map((factor, index) => (
                            <li key={index} className="text-yellow-300 text-sm">{factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Main Dashboard View - Mobile First */
          <div className="space-y-6 sm:space-y-8 md:space-y-12 pt-4 md:pt-0">
            
            {/* 1. MOBILE-OPTIMIZED PROFESSIONAL READINESS RING */}
            <section className="px-2 sm:px-0">
              <div className="flex justify-center">
                <div className="text-center w-full max-w-xs sm:max-w-none">
                  {/* Mobile Ring - 80% viewport width on mobile */}
                  <div className="relative w-[80vw] h-[80vw] max-w-[280px] max-h-[280px] sm:w-48 sm:h-48 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
                      <circle cx="90" cy="90" r="80" fill="none" stroke="#1a1a1a" strokeWidth="8"/>
                      <circle cx="90" cy="90" r="80" fill="none" stroke={getCircleColor('readiness')} strokeWidth="8"
                              strokeDasharray="502.65" strokeDashoffset={(502.65 - (currentBiometrics.readiness / 100) * 502.65)} strokeLinecap="round"/>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-5xl sm:text-4xl font-bold text-white mb-1 transition-all duration-500 ${isRefreshing ? 'scale-95 opacity-50' : ''}`}>
                          {isRefreshing ? '...' : `${currentBiometrics.readiness}%`}
                        </div>
                        <div className="text-base sm:text-sm text-gray-400 uppercase">Professional</div>
                        <div className="text-base sm:text-sm text-gray-400 uppercase">
                          {isRefreshing ? 'Updating...' : 'Readiness'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. WORK IMPACT BREAKDOWN */}
            {workImpactBreakdown && (
              <div className="px-2 sm:px-0">
                <div className="bg-gray-900 rounded-lg p-6 sm:p-8 border border-gray-700">
                  
                  {/* Section Header */}
                  <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-0">
                        {workImpactBreakdown.title}
                      </h2>
                      
                      {/* Refresh Button */}
                      <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed self-start sm:self-auto"
                      >
                        {isRefreshing ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Refreshing...</span>
                          </div>
                        ) : (
                          'Refresh Data'
                        )}
                      </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="mb-2 sm:mb-0">
                        <div className={`text-3xl sm:text-4xl font-bold ${workImpactBreakdown.delta.color}`}>
                          {workImpactBreakdown.delta.formatted}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {workImpactBreakdown.delta.delta === 0 && workImpactBreakdown.delta.formatted === "First reading" 
                            ? "Initial measurement" 
                            : "from previous reading"}
                        </div>
                      </div>
                      
                      {/* Last Updated Info */}
                      <div className="text-xs text-gray-500 text-right">
                        <p>Last updated: {lastRefresh.toLocaleTimeString()}</p>
                        {refreshCount > 0 && (
                          <p>{refreshCount} refresh{refreshCount > 1 ? 'es' : ''} today</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Change Insight */}
                  {changeInsight && (
                    <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <p className="text-blue-200 text-sm font-medium">{changeInsight}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Score Breakdown */}
                    <div className="space-y-6">
                      <section className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Score Breakdown</h3>
                        <div className="space-y-4">
                          {workImpactBreakdown.components.map((component, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-300">{component.name}</span>
                                <div className="flex items-center space-x-3">
                                  <span className="text-white font-medium">{component.value}%</span>
                                  <span className="text-gray-500 text-sm">{component.weight}%</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{width: `${component.value}%`}}
                                ></div>
                              </div>
                              <div className="text-right text-xs text-gray-500">
                                Contributes {component.contribution}% to total score
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    {/* Work Analysis */}
                    <div className="space-y-6">
                      <section className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Work Analysis</h3>
                        <p className="text-gray-300 leading-relaxed mb-6">
                          {workImpactBreakdown.explanation}
                        </p>
                        
                        {workImpactBreakdown.factors.positive.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-green-400 font-semibold mb-2">Positive Factors</h4>
                            <ul className="space-y-1">
                              {workImpactBreakdown.factors.positive.map((factor, index) => (
                                <li key={index} className="text-green-300 text-sm">{factor}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {workImpactBreakdown.factors.negative.length > 0 && (
                          <div>
                            <h4 className="text-yellow-400 font-semibold mb-2">Areas for Optimization</h4>
                            <ul className="space-y-1">
                              {workImpactBreakdown.factors.negative.map((factor, index) => (
                                <li key={index} className="text-yellow-300 text-sm">{factor}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </section>
                    </div>

                  </div>
                </div>
              </div>
            )}


          </div>
        )}
      </div>
    </div>
  )
}
