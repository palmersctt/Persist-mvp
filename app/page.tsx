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

  // Get today's meetings with realistic busy schedule (7 meetings)
  getTodaysMeetings() {
    return [
      {
        id: 'today-1',
        title: "Daily Standup",
        time: "9:00 AM - 9:15 AM",
        type: "team_meeting",
        prediction: { outcome: 'good', confidence: 85 },
        historical: { totalMeetings: 3, averagePerformance: 78 }
      },
      {
        id: 'today-2',
        title: "Product Strategy Review",
        time: "9:30 AM - 10:30 AM",
        type: "strategic",
        prediction: { outcome: 'excellent', confidence: 92 },
        historical: { totalMeetings: 5, averagePerformance: 85 }
      },
      {
        id: 'today-3',
        title: "Client Check-in",
        time: "11:00 AM - 11:30 AM",
        type: "one_on_one",
        prediction: { outcome: 'good', confidence: 88 },
        historical: { totalMeetings: 8, averagePerformance: 82 }
      },
      {
        id: 'today-4',
        title: "Budget Planning",
        time: "12:00 PM - 1:00 PM",
        type: "strategic",
        prediction: { outcome: 'good', confidence: 79 },
        historical: { totalMeetings: 2, averagePerformance: 75 }
      },
      {
        id: 'today-5',
        title: "Team Performance Review",
        time: "2:00 PM - 3:30 PM",
        type: "one_on_one",
        prediction: { outcome: 'good', confidence: 84 },
        historical: { totalMeetings: 6, averagePerformance: 80 }
      },
      {
        id: 'today-6',
        title: "Marketing Campaign Review",
        time: "4:00 PM - 4:45 PM",
        type: "team_meeting",
        prediction: { outcome: 'adequate', confidence: 72 },
        historical: { totalMeetings: 4, averagePerformance: 68 }
      },
      {
        id: 'today-7',
        title: "Vendor Negotiation",
        time: "5:00 PM - 6:00 PM",
        type: "negotiation",
        prediction: { outcome: 'adequate', confidence: 65 },
        historical: { totalMeetings: 3, averagePerformance: 72 }
      }
    ];
  }

  // Get meetings for specific dates
  getMeetingsForDate(date) {
    const meetingsByDate = {
      22: this.getTodaysMeetings(), // Today
      23: [ // Tuesday
        {
          id: 'tue-1',
          title: "Leadership Team Meeting",
          time: "8:00 AM - 9:00 AM",
          type: "strategic",
          prediction: { outcome: 'excellent', confidence: 90 },
          historical: { totalMeetings: 12, averagePerformance: 88 }
        },
        {
          id: 'tue-2',
          title: "Client Presentation",
          time: "10:00 AM - 11:30 AM",
          type: "presentation",
          prediction: { outcome: 'good', confidence: 82 },
          historical: { totalMeetings: 7, averagePerformance: 79 }
        },
        {
          id: 'tue-3',
          title: "Budget Review",
          time: "2:00 PM - 3:00 PM",
          type: "strategic",
          prediction: { outcome: 'good', confidence: 78 },
          historical: { totalMeetings: 4, averagePerformance: 73 }
        }
      ],
      24: [ // Wednesday
        {
          id: 'wed-1',
          title: "Board Presentation",
          time: "9:00 AM - 10:00 AM",
          type: "presentation",
          prediction: { outcome: 'adequate', confidence: 68 },
          historical: { totalMeetings: 2, averagePerformance: 65 },
          rescheduleSuggestion: {
            day: 'Friday',
            time: '9:00 AM',
            improvement: '+21% vs current time'
          }
        },
        {
          id: 'wed-2',
          title: "1:1 with Manager",
          time: "11:00 AM - 11:30 AM",
          type: "one_on_one",
          prediction: { outcome: 'excellent', confidence: 91 },
          historical: { totalMeetings: 15, averagePerformance: 87 }
        }
      ],
      25: [ // Thursday
        {
          id: 'thu-1',
          title: "Product Demo",
          time: "10:00 AM - 11:00 AM",
          type: "presentation",
          prediction: { outcome: 'good', confidence: 81 },
          historical: { totalMeetings: 6, averagePerformance: 76 }
        },
        {
          id: 'thu-2',
          title: "Engineering Sync",
          time: "2:00 PM - 3:00 PM",
          type: "team_meeting",
          prediction: { outcome: 'excellent', confidence: 89 },
          historical: { totalMeetings: 20, averagePerformance: 84 }
        }
      ],
      26: [ // Friday
        {
          id: 'fri-1',
          title: "Client Check-in",
          time: "9:00 AM - 9:30 AM",
          type: "one_on_one",
          prediction: { outcome: 'good', confidence: 85 },
          historical: { totalMeetings: 11, averagePerformance: 81 }
        },
        {
          id: 'fri-2',
          title: "Team Retrospective",
          time: "3:00 PM - 4:00 PM",
          type: "team_meeting",
          prediction: { outcome: 'excellent', confidence: 93 },
          historical: { totalMeetings: 8, averagePerformance: 89 }
        }
      ]
    };
    
    return meetingsByDate[date] || [];
  }

  getDayName(dayNumber) {
    const dayNames = {
      22: 'Today',
      23: 'Tuesday', 
      24: 'Wednesday',
      25: 'Thursday',
      26: 'Friday'
    };
    return dayNames[dayNumber] || `Day ${dayNumber}`;
  }

  // Get week view data
  getWeekMeetings() {
    return [
      { day: 'Tuesday', meetings: this.getMeetingsForDate(23) },
      { day: 'Wednesday', meetings: this.getMeetingsForDate(24) },
      { day: 'Thursday', meetings: this.getMeetingsForDate(25) },
      { day: 'Friday', meetings: this.getMeetingsForDate(26) }
    ];
  }
}

export default function PersistDashboard() {
  const [viewMode, setViewMode] = useState('dashboard');
  const [calendarView, setCalendarView] = useState('today');
  const [selectedBiometric, setSelectedBiometric] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
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
      negotiation: 'bg-red-100 text-red-800',
      strategic: 'bg-blue-100 text-blue-800',
      team_meeting: 'bg-gray-100 text-gray-800',
      one_on_one: 'bg-green-100 text-green-800'
    };
    return colors[type] || colors.team_meeting;
  };

  const getPerformanceColor = (outcome) => {
    const colors = {
      excellent: 'bg-green-900 text-green-300',
      good: 'bg-blue-900 text-blue-300',
      adequate: 'bg-yellow-900 text-yellow-300',
      poor: 'bg-red-900 text-red-300'
    };
    return colors[outcome] || colors.adequate;
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
            {!selectedMeeting && !selectedDate && (
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
            )}

            {selectedMeeting ? (
              /* Meeting Detail View */
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="text-gray-400 hover:text-white transition-colors mb-4"
                >
                  ← Back to {selectedDate ? `${engine.getDayName(selectedDate)}` : calendarView === 'today' ? 'Today' : calendarView === 'week' ? 'Week' : 'Calendar'}
                </button>
                
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{selectedMeeting.title}</h2>
                      <div className="flex items-center space-x-4 text-gray-400">
                        <span>{selectedMeeting.time}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMeetingTypeColor(selectedMeeting.type)}`}>
                          {selectedMeeting.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className={`text-right p-4 rounded-lg border-2 ${getPerformanceColor(selectedMeeting.prediction.outcome)} border-opacity-50`}>
                      <div className="text-sm text-gray-300">Predicted Performance</div>
                      <div className="text-2xl font-bold capitalize">{selectedMeeting.prediction.outcome}</div>
                      <div className="text-sm">{selectedMeeting.prediction.confidence}% confidence</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <section className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Performance Analysis</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Historical Average:</span>
                            <span className="text-white font-medium">{selectedMeeting.historical.averagePerformance}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Previous Meetings:</span>
                            <span className="text-white font-medium">{selectedMeeting.historical.totalMeetings}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Predicted Performance:</span>
                            <span className="text-white font-medium">{selectedMeeting.prediction.outcome}</span>
                          </div>
                        </div>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Recommendations</h3>
                        <div className="space-y-4">
                          {selectedMeeting.prediction.outcome === 'adequate' && (
                            <div className="p-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-900/20">
                              <div className="font-semibold text-white mb-1">Consider Optimization</div>
                              <div className="text-gray-300 text-sm">Your biometric data suggests this may not be optimal timing for peak performance.</div>
                            </div>
                          )}
                          {selectedMeeting.rescheduleSuggestion && (
                            <div className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-900/20">
                              <div className="font-semibold text-white mb-1">Reschedule Suggestion</div>
                              <div className="text-gray-300 text-sm">
                                Move to {selectedMeeting.rescheduleSuggestion.day} at {selectedMeeting.rescheduleSuggestion.time} for {selectedMeeting.rescheduleSuggestion.improvement} improvement
                              </div>
                            </div>
                          )}
                          <div className="p-4 rounded-lg border-l-4 border-green-500 bg-green-900/20">
                            <div className="font-semibold text-white mb-1">Peak state detected - perfect for high-impact activities</div>
                            <div className="text-gray-300 text-sm">Consider proposing additional agenda items</div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedDate ? (
              /* Day Detail View */
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-white transition-colors mb-4"
                >
                  ← Back to Month View
                </button>
                
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-light text-white">{engine.getDayName(selectedDate)}'s Schedule</h2>
                    <div className="text-gray-400 text-sm">
                      {engine.getMeetingsForDate(selectedDate).length} meetings
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {engine.getMeetingsForDate(selectedDate).map((meeting) => (
                      <div 
                        key={meeting.id}
                        onClick={() => setSelectedMeeting(meeting)}
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
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${getPerformanceColor(meeting.prediction.outcome)}`}>
                          {meeting.prediction.outcome.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              /* Calendar Views */
              <div>
                {calendarView === 'today' && (
                  <section>
                    <h2 className="text-2xl font-light text-white mb-6">Today's Schedule</h2>
                    <div className="space-y-2">
                      {todaysMeetings.map((meeting) => (
                        <div 
                          key={meeting.id}
                          onClick={() => setSelectedMeeting(meeting)}
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
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${getPerformanceColor(meeting.prediction.outcome)}`}>
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
                    <div className="grid grid-cols-1 gap-6">
                      {engine.getWeekMeetings().map(({ day, meetings }) => (
                        <div key={day} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                          <h3 className="text-white font-medium mb-3">{day}</h3>
                          <div className="space-y-2">
                            {meetings.map((meeting) => (
                              <div 
                                key={meeting.id}
                                onClick={() => setSelectedMeeting(meeting)}
                                className="flex justify-between items-center text-sm cursor-pointer hover:bg-gray-800 p-2 rounded"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-gray-400 font-mono text-xs">{meeting.time.split(' - ')[0]}</span>
                                  <span className="text-gray-300">{meeting.title}</span>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getPerformanceColor(meeting.prediction.outcome)}`}>
                                  {meeting.prediction.outcome.toUpperCase()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {calendarView === 'month' && (
                  <section>
                    <h2 className="text-2xl font-light text-white mb-6">December 2024</h2>
                    <p className="text-gray-400 text-sm mb-4">Click on any day with meetings to see detailed schedule</p>
                    
                    <div className="bg-gray-900 rounded-lg border border-gray-700">
                      {/* Calendar Header */}
                      <div className="grid grid-cols-7 border-b border-gray-700">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="p-3 text-center text-gray-400 text-sm font-medium border-r border-gray-700 last:border-r-0">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7">
                        {Array.from({length: 42}, (_, i) => {
                          // Adjust calendar to show December 2024 properly
                          const dayNum = i - 6; // December 1st starts on Sunday (adjust offset)
                          const isCurrentMonth = dayNum > 0 && dayNum <= 31;
                          const isToday = dayNum === 22; // Today is 22nd
                          const hasMeetings = [22, 23, 24, 25, 26].includes(dayNum);
                          const meetingCount = dayNum === 22 ? 7 : dayNum === 23 ? 3 : dayNum === 24 ? 2 : dayNum === 25 ? 2 : dayNum === 26 ? 2 : 0;
                          
                          return (
                            <div 
                              key={i} 
                              className={`
                                min-h-24 p-2 border-r border-b border-gray-700 last:border-r-0 transition-all
                                ${isCurrentMonth ? 'bg-gray-900' : 'bg-gray-950'}
                                ${isToday ? 'bg-white text-black' : 'text-gray-300'}
                                ${hasMeetings ? 'cursor-pointer hover:bg-gray-800 hover:scale-[1.02]' : ''}
                                ${!isCurrentMonth ? 'opacity-30' : ''}
                              `}
                              onClick={hasMeetings && isCurrentMonth ? () => {
                                setSelectedDate(dayNum);
                                console.log(`Navigating to ${engine.getDayName(dayNum)} with ${meetingCount} meetings`);
                              } : undefined}
                            >
                              {isCurrentMonth && (
                                <div className="space-y-1">
                                  <div className={`text-sm font-medium ${isToday ? 'text-black' : 'text-white'}`}>
                                    {dayNum}
                                  </div>
                                  {hasMeetings && (
                                    <div className="space-y-0.5">
                                      <div className={`text-xs ${isToday ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {meetingCount} meeting{meetingCount !== 1 ? 's' : ''}
                                      </div>
                                      <div className="flex space-x-1 flex-wrap">
                                        {/* Performance indicator dots based on meeting predictions */}
                                        {dayNum === 22 && ( // Today - mix of excellent/good/adequate
                                          <>
                                            <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-green-600' : 'bg-green-400'}`} title="Excellent meetings"></div>
                                            <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-blue-600' : 'bg-blue-400'}`} title="Good meetings"></div>
                                            <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-yellow-600' : 'bg-yellow-400'}`} title="Adequate meetings"></div>
                                            {meetingCount > 3 && (
                                              <div className={`text-xs ${isToday ? 'text-gray-600' : 'text-gray-400'} ml-1`}>
                                                +{meetingCount - 3}
                                              </div>
                                            )}
                                          </>
                                        )}
                                        {dayNum === 23 && ( // Tuesday - mostly excellent
                                          <>
                                            <div className="w-2 h-2 rounded-full bg-green-400" title="Excellent performance"></div>
                                            <div className="w-2 h-2 rounded-full bg-green-400" title="Excellent performance"></div>
                                            <div className="w-2 h-2 rounded-full bg-blue-400" title="Good performance"></div>
                                          </>
                                        )}
                                        {dayNum === 24 && ( // Wednesday - mixed with optimization opportunity
                                          <>
                                            <div className="w-2 h-2 rounded-full bg-yellow-400" title="Needs optimization"></div>
                                            <div className="w-2 h-2 rounded-full bg-green-400" title="Excellent performance"></div>
                                          </>
                                        )}
                                        {dayNum === 25 && ( // Thursday - good performance
                                          <>
                                            <div className="w-2 h-2 rounded-full bg-blue-400" title="Good performance"></div>
                                            <div className="w-2 h-2 rounded-full bg-green-400" title="Excellent performance"></div>
                                          </>
                                        )}
                                        {dayNum === 26 && ( // Friday - excellent performance
                                          <>
                                            <div className="w-2 h-2 rounded-full bg-blue-400" title="Good performance"></div>
                                            <div className="w-2 h-2 rounded-full bg-green-400" title="Excellent performance"></div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {hasMeetings && (
                                    <div className={`text-xs ${isToday ? 'text-gray-700' : 'text-gray-500'} opacity-75`}>
                                      Click for details
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-4 flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="text-gray-400">Excellent Performance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <span className="text-gray-400">Good Performance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <span className="text-gray-400">Needs Optimization</span>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}