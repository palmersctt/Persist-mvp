'use client'

import { useState, useEffect } from 'react'

// Engine for biometric and meeting analysis
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
  }

  getCurrentBiometrics() {
    return this.currentData;
  }

  getTodaysRecommendations() {
    return [
      {
        id: 1,
        message: "Exceptional recovery (94%) positions you perfectly for high-stakes activities. Your board presentation at 2 PM aligns with your historical cognitive peak."
      },
      {
        id: 2, 
        message: "Schedule your most important negotiations in the next 4 hours while stress resilience is optimal."
      },
      {
        id: 3,
        message: "Use 4-7-8 breathing technique 30 minutes before your presentation to maximize performance window."
      }
    ];
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
        explanation: "Your readiness score combines recovery metrics with sleep quality and physiological markers. Today's 87% indicates optimal conditions for high-performance activities.",
        factors: {
          positive: ["Excellent recovery (94%)", "Strong sleep performance (8.4h)", "HRV above baseline"],
          negative: ["Slightly elevated previous strain"]
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
        explanation: "Recovery measures how well your body has adapted to recent training and stress. 94% indicates exceptional physiological recovery.",
        factors: {
          positive: ["HRV significantly above baseline", "Low resting heart rate", "Deep sleep phases optimized"],
          negative: []
        }
      },
      strain: {
        title: "Daily Strain",
        score: 12.1,
        components: [
          { name: "Cardiovascular Load", value: 45, weight: 40, contribution: 4.8 },
          { name: "Activity Intensity", value: 38, weight: 35, contribution: 4.2 },
          { name: "Stress Response", value: 42, weight: 25, contribution: 3.1 }
        ],
        explanation: "Strain represents the cardiovascular and physiological load on your body. 12.1 is moderate - optimal for maintaining performance without overreaching.",
        factors: {
          positive: ["Balanced activity load", "Well-managed stress response"],
          negative: ["Could handle slightly higher intensity"]
        }
      }
    };
    
    return breakdowns[type];
  }

  getTodaysMeetings() {
    return [
      {
        id: 1,
        title: "Daily Standup",
        time: "9:00 AM - 9:15 AM",
        type: "team_meeting",
        prediction: { outcome: 'good', confidence: 85 }
      },
      {
        id: 2,
        title: "Product Strategy Review",
        time: "9:30 AM - 10:30 AM",
        type: "strategic",
        prediction: { outcome: 'excellent', confidence: 92 }
      }
    ];
  }
}

export default function PersistDashboard() {
  const [viewMode, setViewMode] = useState('dashboard');
  const [calendarView, setCalendarView] = useState('today');
  const [selectedBiometric, setSelectedBiometric] = useState(null);
  const [engine] = useState(() => new BiometricEngine());
  const [currentBiometrics, setCurrentBiometrics] = useState(null);
  const [todaysRecommendations, setTodaysRecommendations] = useState([]);
  const [todaysMeetings, setTodaysMeetings] = useState([]);

  useEffect(() => {
    setCurrentBiometrics(engine.getCurrentBiometrics());
    setTodaysRecommendations(engine.getTodaysRecommendations());
    setTodaysMeetings(engine.getTodaysMeetings());
  }, [engine]);

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

  const getMeetingTypeColor = (type) => {
    const colors = {
      presentation: 'bg-purple-100 text-purple-800',
      strategic: 'bg-blue-100 text-blue-800',
      team_meeting: 'bg-gray-100 text-gray-800',
      one_on_one: 'bg-green-100 text-green-800'
    };
    return colors[type] || colors.team_meeting;
  };

  if (!currentBiometrics) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-white tracking-wide">PERSIST</h1>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Biometric Performance</div>
            <div className="text-white font-medium">Professional Analytics</div>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <div className="px-6 pt-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('dashboard')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'dashboard' ? 'bg-white text-black' : 'text-gray-400'
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'calendar' ? 'bg-white text-black' : 'text-gray-400'
                }`}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-8">

        {viewMode === 'dashboard' ? (
          selectedBiometric ? (
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
            /* Main Dashboard View */
            <div className="space-y-12">
              
              {/* 1. CLICKABLE BIOMETRIC RINGS */}
              <section>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-8 md:gap-12">
                  
                  <div 
                    className="text-center cursor-pointer group"
                    onClick={() => setSelectedBiometric('readiness')}
                  >
                    <div className="relative w-32 h-32 mx-auto mb-4 group-hover:scale-105 transition-transform">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a1a" strokeWidth="6"/>
                        <circle cx="60" cy="60" r="54" fill="none" stroke={getCircleColor('readiness')} strokeWidth="6"
                                strokeDasharray="339.29" strokeDashoffset={getStrokeDashoffset(currentBiometrics.readiness)} strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{currentBiometrics.readiness}%</div>
                          <div className="text-xs text-gray-500">{currentBiometrics.status}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide group-hover:text-white transition-colors">
                      Professional Readiness
                    </div>
                  </div>

                  <div 
                    className="text-center cursor-pointer group"
                    onClick={() => setSelectedBiometric('recovery')}
                  >
                    <div className="relative w-32 h-32 mx-auto mb-4 group-hover:scale-105 transition-transform">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a1a" strokeWidth="6"/>
                        <circle cx="60" cy="60" r="54" fill="none" stroke={getCircleColor('recovery')} strokeWidth="6"
                                strokeDasharray="339.29" strokeDashoffset={getStrokeDashoffset(currentBiometrics.recovery)} strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{currentBiometrics.recovery}%</div>
                          <div className="text-xs text-gray-500">REC</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide group-hover:text-white transition-colors">
                      Recovery
                    </div>
                  </div>

                  <div 
                    className="text-center cursor-pointer group"
                    onClick={() => setSelectedBiometric('strain')}
                  >
                    <div className="relative w-32 h-32 mx-auto mb-4 group-hover:scale-105 transition-transform">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a1a" strokeWidth="6"/>
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#007aff" strokeWidth="6"
                                strokeDasharray="339.29" strokeDashoffset={getStrokeDashoffset(Math.min(currentBiometrics.strain * 5, 100))} strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{currentBiometrics.strain}</div>
                          <div className="text-xs text-gray-500">STR</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide group-hover:text-white transition-colors">
                      Daily Strain
                    </div>
                  </div>

                </div>
              </section>

              {/* 2. TODAY'S FOCUS - 3 RECOMMENDATIONS */}
              <section>
                <h2 className="text-xl font-semibold text-white mb-6">Today's Focus</h2>
                
                <div className="space-y-4">
                  {todaysRecommendations.map((rec) => (
                    <div key={rec.id} className="bg-gray-950 rounded-lg p-6 border border-gray-800">
                      <div className="flex items-start space-x-4">
                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-green-400"></div>
                        <div className="flex-1">
                          <p className="text-gray-300 leading-relaxed">
                            {rec.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          )
        ) : (
          /* Calendar View */
          <div className="space-y-8">
            
            {/* Calendar Navigation */}
            <div className="flex justify-center mb-8">
              <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
                <button 
                  onClick={() => setCalendarView('today')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    calendarView === 'today' ? 'bg-white text-black' : 'text-gray-400'
                  }`}
                >
                  Today
                </button>
                <button 
                  onClick={() => setCalendarView('week')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    calendarView === 'week' ? 'bg-white text-black' : 'text-gray-400'
                  }`}
                >
                  Week
                </button>
                <button 
                  onClick={() => setCalendarView('month')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    calendarView === 'month' ? 'bg-white text-black' : 'text-gray-400'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>

            {/* Calendar Content */}
            <div>
              {calendarView === 'today' && (
                <section>
                  <h2 className="text-2xl font-light text-white mb-6">Today's Schedule</h2>
                  <div className="space-y-2">
                    {todaysMeetings.map((meeting) => (
                      <div 
                        key={meeting.id}
                        className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer transition-all flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="text-gray-400 text-sm font-mono w-24">
                              {meeting.time.split(' - ')[0]}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-medium">{meeting.title}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getMeetingTypeColor(meeting.type)}`}>
                                {meeting.type.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          meeting.prediction.outcome === 'excellent' ? 'bg-green-900 text-green-300' :
                          meeting.prediction.outcome === 'good' ? 'bg-blue-900 text-blue-300' :
                          'bg-yellow-900 text-yellow-300'
                        }`}>
                          {meeting.prediction.outcome.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {calendarView === 'week' && (
                <section>
                  <h2 className="text-2xl font-light text-white mb-6">This Week</h2>
                  <div className="text-center text-gray-400 py-8">
                    Week view - Calendar functionality available
                  </div>
                </section>
              )}

              {calendarView === 'month' && (
                <section>
                  <h2 className="text-2xl font-light text-white mb-6">Monthly Overview</h2>
                  <div className="text-center text-gray-400 py-8">
                    Month view - Calendar functionality available
                  </div>
                </section>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}