'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

const weeklyData = [
  { 
    day: 'Mon', readiness: 78, recovery: 85, strain: 14.2, sleep: '7.8h',
    story: "Back to work after weekend. Decent recovery but increased stress from Monday meetings.",
    events: [
      { name: '9 AM Team Standup', impact: 'Solid contribution despite Monday sluggishness', performance: 'good' },
      { name: '2 PM Client Call', impact: 'Energy dipped mid-afternoon, but stayed focused', performance: 'adequate' },
      { name: '4 PM Strategy Review', impact: 'Analytical thinking sharp, good strategic insights', performance: 'good' }
    ],
    highlight: 'Managed Monday transition well despite higher strain',
    overallPerformance: '2/3 meetings at optimal level'
  },
  { 
    day: 'Tue', readiness: 82, recovery: 89, strain: 13.1, sleep: '8.1h',
    story: "Strong recovery overnight. Good sleep quality boosted morning readiness significantly.",
    events: [
      { name: '10 AM Product Review', impact: 'High energy, led discussion effectively', performance: 'excellent' },
      { name: '1 PM Lunch with VP', impact: 'Confident and articulate, built strong rapport', performance: 'excellent' },
      { name: '3 PM Design Workshop', impact: 'Creative peak, contributed innovative solutions', performance: 'excellent' }
    ],
    highlight: 'Excellent sleep quality (8.1h) drove strong performance',
    overallPerformance: '3/3 meetings exceeded expectations'
  },
  { 
    day: 'Wed', readiness: 65, recovery: 72, strain: 16.8, sleep: '6.2h',
    story: "Poor sleep due to late-night project deadline. High strain from stressful client presentation.",
    events: [
      { name: '9 AM Crisis Meeting', impact: 'Low energy affected problem-solving ability', performance: 'poor' },
      { name: '11 AM Client Presentation', impact: 'Stress symptoms visible, presentation struggled', performance: 'poor' },
      { name: '6 PM Networking Event', impact: 'Completely drained, left early with minimal engagement', performance: 'poor' }
    ],
    highlight: 'Sleep debt + high-stress presentation created perfect storm',
    overallPerformance: '0/3 meetings met performance standards'
  },
  { 
    day: 'Thu', readiness: 71, recovery: 78, strain: 15.3, sleep: '7.0h',
    story: "Recovery day strategy worked. Lighter schedule allowed partial bounce-back from Wednesday.",
    events: [
      { name: '10 AM Admin Tasks', impact: 'Steady progress on routine work, no issues', performance: 'adequate' },
      { name: '2 PM 1-on-1s', impact: 'Good listening, supportive but not energetic', performance: 'good' },
      { name: '4 PM Planning Session', impact: 'Clear thinking returned, solid strategic input', performance: 'good' }
    ],
    highlight: 'Lighter schedule helped recovery from mid-week crash',
    overallPerformance: '2/3 meetings back to baseline performance'
  },
  { 
    day: 'Fri', readiness: 89, recovery: 94, strain: 11.7, sleep: '8.5h',
    story: "Exceptional recovery. Great sleep + anticipation for weekend reduced stress significantly.",
    events: [
      { name: '9 AM Weekly Review', impact: 'High energy, comprehensive analysis of week', performance: 'excellent' },
      { name: '11 AM Team Celebration', impact: 'Charismatic and engaging, boosted team morale', performance: 'excellent' },
      { name: '2 PM Wrap-up Tasks', impact: 'Efficient completion, ahead of schedule', performance: 'excellent' }
    ],
    highlight: 'Weekend anticipation + good sleep created peak state',
    overallPerformance: '3/3 meetings with peak performance'
  },
  { 
    day: 'Sat', readiness: 92, recovery: 96, strain: 8.4, sleep: '9.2h',
    story: "Weekend recovery mode. Long sleep + low stress activities optimized recovery metrics.",
    events: [
      { name: 'Morning Yoga', impact: 'Deep relaxation, excellent mind-body connection', performance: 'excellent' },
      { name: 'Family Brunch', impact: 'Present and engaged, quality time achieved', performance: 'excellent' },
      { name: 'Evening Walk', impact: 'Meditative state, mental clarity restored', performance: 'excellent' }
    ],
    highlight: 'Perfect recovery day - 9.2h sleep and zero work stress',
    overallPerformance: 'Optimal recovery activities completed'
  },
  { 
    day: 'Today', readiness: 87, recovery: 94, strain: 12.1, sleep: '8.4h',
    story: "Maintained weekend gains. Ready for high-stakes activities with optimal cognitive capacity.",
    events: [
      { name: '9 AM Strategic Planning', impact: 'Forecasted: Sharp analytical thinking expected', performance: 'predicted-excellent' },
      { name: '2 PM Board Presentation', impact: 'Forecasted: Peak confidence window, optimal timing', performance: 'predicted-excellent' },
      { name: '4:30 PM Admin Tasks', impact: 'Forecasted: Efficient completion despite energy decline', performance: 'predicted-good' }
    ],
    highlight: 'Excellent position for important board presentation',
    overallPerformance: 'Predicted: 3/3 meetings at high performance level'
  }
]

const weekAheadData = [
  { 
    day: 'Mon', 
    date: 'Dec 16', 
    predictedReadiness: 81, 
    confidence: 85,
    recovery: 86,
    strain: 14.8,
    sleep: '7.9h',
    story: "Monday transition after weekend. Predicted moderate stress from heavy meeting load but solid baseline recovery should maintain performance.",
    events: [
      { name: '9 AM All-Hands', impact: 'Predicted: Solid participation, may feel Monday sluggishness', performance: 'good' },
      { name: '2 PM Client Review', impact: 'Predicted: Steady performance, afternoon energy dip likely', performance: 'adequate' },
      { name: '4 PM 1-on-1s', impact: 'Predicted: Good listening skills, supportive interactions', performance: 'good' }
    ],
    highlight: 'Heavy meeting schedule may challenge energy levels',
    overallPerformance: 'Predicted: 2/3 meetings at solid performance level',
    riskFactors: ['Monday transition stress', 'Heavy meeting load'],
    optimalWindows: ['10-11 AM: Analytical work', '3-4 PM: Creative tasks']
  },
  { 
    day: 'Tue', 
    date: 'Dec 17', 
    predictedReadiness: 85, 
    confidence: 90,
    recovery: 91,
    strain: 13.2,
    sleep: '8.2h',
    story: "Strong recovery predicted. Good sleep quality and lighter schedule should create optimal conditions for high-stakes activities.",
    events: [
      { name: '10 AM Strategy Session', impact: 'Predicted: Sharp analytical thinking, strong contributions', performance: 'excellent' },
      { name: '1 PM Lunch & Learn', impact: 'Predicted: Engaged learning, good questions and insights', performance: 'excellent' }
    ],
    highlight: 'Peak performance day - ideal for important decisions',
    overallPerformance: 'Predicted: 2/2 meetings exceed expectations',
    riskFactors: [],
    optimalWindows: ['9 AM-12 PM: Peak performance window', '2-4 PM: High-stakes meetings']
  },
  { 
    day: 'Wed', 
    date: 'Dec 18', 
    predictedReadiness: 67, 
    confidence: 75,
    recovery: 73,
    strain: 17.1,
    sleep: '6.3h',
    story: "High-risk day. Overloaded schedule combined with mid-week fatigue pattern likely to create performance challenges. Strong recommendation to reschedule non-critical items.",
    events: [
      { name: '8 AM Budget Review', impact: 'Predicted: Early meeting challenges, low cognitive energy', performance: 'poor' },
      { name: '11 AM Client Presentation', impact: 'Predicted: High stress visible, may struggle with confidence', performance: 'poor' },
      { name: '3 PM Team Standup', impact: 'Predicted: Minimal contribution, fatigue apparent', performance: 'poor' },
      { name: '6 PM Networking Event', impact: 'Predicted: Should cancel - will be completely drained', performance: 'poor' }
    ],
    highlight: 'Overloaded schedule + mid-week fatigue = high failure risk',
    overallPerformance: 'Predicted: 0/4 meetings meet performance standards',
    riskFactors: ['Heavy meeting load', 'Late evening event', 'Mid-week fatigue pattern'],
    optimalWindows: ['9-10 AM: Light analytical work only', 'Afternoon: Administrative tasks only']
  },
  { 
    day: 'Thu', 
    date: 'Dec 19', 
    predictedReadiness: 73, 
    confidence: 80,
    recovery: 79,
    strain: 15.7,
    sleep: '7.1h',
    story: "Recovery bounce expected. Lighter schedule and strategic rest should help rebound from Wednesday's challenges. Good opportunity to rebuild momentum.",
    events: [
      { name: '10 AM Product Demo', impact: 'Predicted: Steady presentation, energy recovering', performance: 'adequate' },
      { name: '2 PM Planning Session', impact: 'Predicted: Clear thinking returns, solid strategic input', performance: 'good' }
    ],
    highlight: 'Recovery day strategy - rebuilding from Wednesday crash',
    overallPerformance: 'Predicted: 2/2 meetings return to baseline',
    riskFactors: ['Recovering from Wednesday overload'],
    optimalWindows: ['Morning: Routine tasks', '1-3 PM: Moderate complexity work']
  },
  { 
    day: 'Fri', 
    date: 'Dec 20', 
    predictedReadiness: 88, 
    confidence: 85,
    recovery: 93,
    strain: 11.9,
    sleep: '8.4h',
    story: "Strong finish predicted. Weekend anticipation combined with Thursday's recovery should create excellent performance conditions. Ideal for important project completions.",
    events: [
      { name: '9 AM Weekly Review', impact: 'Predicted: Comprehensive analysis, strong leadership', performance: 'excellent' },
      { name: '11 AM Team Celebration', impact: 'Predicted: High energy, charismatic team interaction', performance: 'excellent' },
      { name: '2 PM Project Wrap-up', impact: 'Predicted: Efficient completion, ahead of deadlines', performance: 'excellent' }
    ],
    highlight: 'Weekend anticipation + recovery creates peak performance',
    overallPerformance: 'Predicted: 3/3 meetings with exceptional performance',
    riskFactors: [],
    optimalWindows: ['All day: High performance available', 'Morning: Peak creativity and leadership']
  },
  { 
    day: 'Sat', 
    date: 'Dec 21', 
    predictedReadiness: 94, 
    confidence: 90,
    recovery: 97,
    strain: 8.2,
    sleep: '9.1h',
    story: "Optimal recovery day predicted. Long sleep and low-stress activities should maximize physiological restoration for next week's challenges.",
    events: [
      { name: 'Morning Workout', impact: 'Predicted: Deep mind-body connection, excellent recovery', performance: 'excellent' },
      { name: 'Family Time', impact: 'Predicted: Present and engaged, quality relationships', performance: 'excellent' },
      { name: 'Meal Prep', impact: 'Predicted: Mindful preparation, sets up next week success', performance: 'excellent' }
    ],
    highlight: 'Perfect recovery programming - maintain strict boundaries',
    overallPerformance: 'Optimal recovery activities planned',
    riskFactors: [],
    optimalWindows: ['Full day: Recovery and personal activities only']
  },
  { 
    day: 'Sun', 
    date: 'Dec 22', 
    predictedReadiness: 92, 
    confidence: 85,
    recovery: 95,
    strain: 9.1,
    sleep: '8.8h',
    story: "Strategic preparation day. Maintained high recovery with light planning activities should position perfectly for next week's demands.",
    events: [
      { name: 'Weekly Planning', impact: 'Predicted: Clear strategic thinking, excellent preparation', performance: 'excellent' },
      { name: 'Reading/Learning', impact: 'Predicted: High focus and retention, valuable insights', performance: 'excellent' },
      { name: 'Evening Reflection', impact: 'Predicted: Mental clarity, strategic insights for next week', performance: 'excellent' }
    ],
    highlight: 'Preparation day - strategic advantage for next week',
    overallPerformance: 'Optimal preparation activities completed',
    riskFactors: [],
    optimalWindows: ['Morning: Strategic planning', 'Afternoon: Learning and development']
  }
]

const scenarios = {
  optimal: {
    readiness: 87, recovery: 94, strain: 12.1, sleep: '8.4h', status: 'READY', color: 'green',
    insight: "Exceptional recovery (94%) positions you perfectly for high-stakes activities. Your board presentation at 2 PM aligns with your historical cognitive peak.",
    prepTime: '1:00 PM'
  },
  moderate: {
    readiness: 65, recovery: 72, strain: 16.8, sleep: '6.2h', status: 'CAUTION', color: 'yellow',
    insight: "Moderate recovery (72%) after high strain yesterday. Your presentation may be challenging - consider rescheduling if possible.",
    prepTime: '12:30 PM'
  },
  poor: {
    readiness: 42, recovery: 33, strain: 19.4, sleep: '4.8h', status: 'REST', color: 'red',
    insight: "Poor recovery (33%) indicates your body needs rest. Strongly recommend postponing the board presentation.",
    prepTime: 'POSTPONE'
  }
}

export default function Home() {
  // Authentication state (MUST BE FIRST)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()

  // Authentication check (FIRST useEffect)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      setUser(session?.user || null)
      setAuthLoading(false)
    }
    checkUser()
  }, [router])

  // Dashboard state (AFTER authentication)
  const [currentScenario, setCurrentScenario] = useState('optimal')
  const [viewMode, setViewMode] = useState('today')
  const [selectedDay, setSelectedDay] = useState(null)

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading your biometric insights...</div>
      </div>
    )
  }

  // Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const data = scenarios[currentScenario]

  const handleDayClick = (dayIndex) => {
    setSelectedDay(selectedDay === dayIndex ? null : dayIndex)
  }

  const getCircleColor = (type) => {
    if (type === 'readiness') {
      if (data.readiness >= 80) return '#00ff41'  // WHOOP bright green
      if (data.readiness >= 60) return '#ff9500'  // WHOOP orange
      return '#ff3b30'  // WHOOP red
    }
    if (type === 'recovery') {
      if (data.recovery >= 85) return '#00ff41'   // WHOOP green for high recovery
      if (data.recovery >= 65) return '#ff9500'   // WHOOP orange for moderate
      return '#ff3b30'  // WHOOP red for low
    }
    if (type === 'strain') {
      return '#007aff'  // WHOOP blue for strain
    }
    return '#ff9500'
  }

  const getStrokeDashoffset = (percentage) => {
    const circumference = 339.29
    return circumference - (percentage / 100) * circumference
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-900 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-white tracking-wide">PERSIST</h1>
          <div className="text-right flex items-center gap-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Good Morning</div>
              <div className="text-white font-medium">
                {user?.user_metadata?.first_name ? 
                  `${user.user_metadata.first_name} ${user.user_metadata.last_name}` : 
                  user?.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-white transition-colors px-3 py-1 rounded border border-gray-800 hover:border-gray-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* View Toggle */}
      <div className="px-6 pt-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button 
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'weekly' ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'
                }`}
              >
                Trends
              </button>
              <button 
                onClick={() => setViewMode('today')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'today' ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'
                }`}
              >
                Today
              </button>
              <button 
                onClick={() => setViewMode('weekahead')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'weekahead' ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'
                }`}
              >
                Upcoming
              </button>
            </div>

            {viewMode === 'today' && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => setCurrentScenario('optimal')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentScenario === 'optimal' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  Optimal Day
                </button>
                <button 
                  onClick={() => setCurrentScenario('moderate')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentScenario === 'moderate' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  Moderate Day
                </button>
                <button 
                  onClick={() => setCurrentScenario('poor')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentScenario === 'poor' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  Recovery Day
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 pb-8">
        <div className="max-w-4xl mx-auto">

          {viewMode === 'today' ? (
            <div>
              {/* Today View */}
              <section className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a1a" strokeWidth="6"/>
                        <circle cx="60" cy="60" r="54" fill="none" stroke={getCircleColor('readiness')} strokeWidth="6"
                                strokeDasharray="339.29" strokeDashoffset={getStrokeDashoffset(data.readiness)} strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{data.readiness}%</div>
                          <div className="text-xs text-gray-500">{data.status}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide">Professional Readiness</div>
                  </div>

                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a1a" strokeWidth="6"/>
                        <circle cx="60" cy="60" r="54" fill="none" stroke={getCircleColor('recovery')} strokeWidth="6"
                                strokeDasharray="339.29" strokeDashoffset={getStrokeDashoffset(data.recovery)} strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{data.recovery}%</div>
                          <div className="text-xs text-gray-500">REC</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide">Recovery</div>
                  </div>

                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a1a" strokeWidth="6"/>
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#007aff" strokeWidth="6"
                                strokeDasharray="339.29" strokeDashoffset={getStrokeDashoffset(Math.min(data.strain * 5, 100))} strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{data.strain}</div>
                          <div className="text-xs text-gray-500">STR</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide">Daily Strain</div>
                  </div>

                </div>
              </section>

              {/* Today Insight */}
              <section className="mb-12">
                <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
                  <div className="flex items-start space-x-4">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      data.color === 'green' ? 'bg-green-400' : 
                      data.color === 'yellow' ? 'bg-orange-400' : 'bg-red-400'
                    }`}></div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Today&apos;s Focus</h3>
                      <p className="text-gray-300 leading-relaxed">{data.insight}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Schedule Optimization */}
              <section className="mb-12">
                <h2 className="text-lg font-semibold text-white mb-6 uppercase tracking-wide">Schedule Optimization</h2>
                
                <div className="space-y-3">
                  <div className={`rounded-lg p-4 flex justify-between items-center transition-all duration-300 ${
                    data.color === 'green' ? 'bg-gray-900' : 'bg-gray-900'
                  }`}>
                    <div>
                      <div className="font-medium text-white">9:00 AM - Strategic Planning</div>
                      <div className={`text-sm ${data.color === 'green' ? 'text-green-400' : data.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {data.color === 'green' ? 'Peak analytical window' : data.color === 'yellow' ? 'Reduced analytical capacity' : 'Cognitive function impaired'}
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      data.color === 'green' ? 'bg-green-500' : data.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-white">
                        {data.color === 'green' ? '11:30 AM - Creative Workshop' : data.color === 'yellow' ? '11:30 AM - Light Creative Work' : '11:30 AM - Rest Period'}
                      </div>
                      <div className={`text-sm ${data.color === 'green' ? 'text-blue-400' : data.color === 'yellow' ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {data.color === 'green' ? 'High creativity phase' : data.color === 'yellow' ? 'Limited creativity window' : 'Avoid demanding tasks'}
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      data.color === 'green' ? 'bg-blue-500' : data.color === 'yellow' ? 'bg-yellow-500' : 'bg-gray-600'
                    }`}></div>
                  </div>

                  <div className={`rounded-lg p-4 flex justify-between items-center border ${
                    data.color === 'green' ? 'border-green-500 bg-gray-800' : 
                    data.color === 'yellow' ? 'border-yellow-500 bg-gray-800' : 'border-red-500 bg-gray-900'
                  }`}>
                    <div>
                      <div className={`font-medium ${data.color === 'red' ? 'text-red-400' : 'text-white'}`}>
                        {data.color === 'red' ? '2:00 PM - POSTPONE PRESENTATION' : '2:00 PM - Board Presentation'}
                      </div>
                      <div className={`text-sm ${
                        data.color === 'green' ? 'text-green-400' : 
                        data.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {data.color === 'green' ? 'Optimal confidence window' : 
                         data.color === 'yellow' ? 'High stress risk' : 'High failure risk'}
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      data.color === 'green' ? 'bg-green-500' : data.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className={`font-medium ${data.color === 'red' ? 'text-gray-400' : 'text-white'}`}>
                        {data.color === 'red' ? '4:30 PM - Early Wrap-Up' : '4:30 PM - Administrative'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {data.color === 'green' ? 'Low cognitive demand' : 
                         data.color === 'yellow' ? 'Focus on simple tasks' : 'Prioritize recovery'}
                      </div>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                  </div>
                </div>
              </section>

              {/* Performance Preparation */}
              <section className="mb-12">
                <h2 className="text-lg font-semibold text-white mb-6 uppercase tracking-wide">Performance Preparation</h2>
                
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-1 ${data.prepTime === 'POSTPONE' ? 'text-red-500' : 'text-orange-500'}`}>
                        {data.prepTime}
                      </div>
                      <div className="text-gray-400 text-sm">Prep Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-500 text-2xl font-bold mb-1">4-7-8</div>
                      <div className="text-gray-400 text-sm">Breathing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-500 text-2xl font-bold mb-1">
                        {data.readiness >= 80 ? '28%' : data.readiness >= 60 ? '18%' : '8%'}
                      </div>
                      <div className="text-gray-400 text-sm">Stress Reduction</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <p className="text-gray-300 text-sm">
                      {data.readiness >= 80 
                        ? "Based on 47 previous presentations, your personalized stress protocol reduces pre-meeting anxiety by an average of 28%."
                        : data.readiness >= 60
                        ? "Your current state reduces the effectiveness of stress protocols. Focus on basic breathing and consider rescheduling if possible."
                        : "Strong recommendation: postpone high-stakes activities. Your body needs recovery before optimal performance is possible."
                      }
                    </p>
                  </div>
                </div>
              </section>

              {/* Biometric Detail */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-6 uppercase tracking-wide">Biometric Detail</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-white mb-1">{data.sleep}</div>
                    <div className="text-gray-400 text-sm uppercase tracking-wide">Sleep</div>
                    <div className={`text-xs ${
                      data.sleep.includes('8.') ? 'text-green-500' : 
                      data.sleep.includes('6.') ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {data.sleep.includes('8.') ? '+12% vs avg' : 
                       data.sleep.includes('6.') ? '-18% vs avg' : '-42% vs avg'}
                    </div>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-white mb-1">
                      {data.readiness >= 80 ? '67ms' : data.readiness >= 60 ? '41ms' : '28ms'}
                    </div>
                    <div className="text-gray-400 text-sm uppercase tracking-wide">HRV</div>
                    <div className={`text-xs ${
                      data.readiness >= 80 ? 'text-blue-500' : 
                      data.readiness >= 60 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {data.readiness >= 80 ? 'Above baseline' : 
                       data.readiness >= 60 ? 'Below baseline' : 'Significantly low'}
                    </div>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-white mb-1">52bpm</div>
                    <div className="text-gray-400 text-sm uppercase tracking-wide">RHR</div>
                    <div className="text-green-500 text-xs">Normal</div>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-white mb-1">2.1°F</div>
                    <div className="text-gray-400 text-sm uppercase tracking-wide">Skin Temp</div>
                    <div className="text-gray-500 text-xs">Normal</div>
                  </div>
                </div>
              </section>
            </div>
          ) : viewMode === 'weekly' ? (
            <div>
              {/* Weekly View */}
              <section className="mb-12">
                <h2 className="text-2xl font-light text-white mb-8 text-center">Weekly Performance Trends</h2>
                
                <div className="bg-gray-900 rounded-lg p-8 mb-8">
                  <h3 className="text-lg font-semibold text-white mb-6 uppercase tracking-wide">Readiness Trend</h3>
                  <div className="relative">
                    {/* Chart area */}
                    <div className="flex items-end justify-between h-48 mb-6">
                      {weeklyData.map((day, index) => (
                        <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                          <div 
                            className="relative flex flex-col items-center justify-end h-40 cursor-pointer group"
                            onClick={() => handleDayClick(index)}
                          >
                            <div 
                              className={`w-6 rounded-t transition-all duration-500 hover:opacity-80 group-hover:scale-110 ${
                                selectedDay === index ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-950' : ''
                              } ${
                                day.readiness >= 85 ? 'bg-green-500' :
                                day.readiness >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ height: `${(day.readiness / 100) * 160}px` }}
                            ></div>
                            <div className="absolute -top-10 text-white text-xs font-bold group-hover:scale-110 transition-transform text-center w-full">
                              {day.readiness}%
                            </div>
                          </div>
                          <div 
                            className={`text-xs uppercase tracking-wide transition-all cursor-pointer hover:text-white text-center ${
                              day.day === 'Today' ? 'text-white font-bold' : 
                              selectedDay === index ? 'text-white font-bold' : 'text-gray-400'
                            }`}
                            onClick={() => handleDayClick(index)}
                          >
                            <div className="font-medium">{day.day}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-gray-500 text-sm">Click on any day to see detailed breakdown</p>
                  </div>
                </div>

                {/* Weekly Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-950 rounded-lg p-6 text-center border border-green-900">
                    <div className="text-3xl font-bold text-green-400 mb-2">4</div>
                    <div className="text-gray-500 text-sm uppercase tracking-wide">Optimal Days</div>
                    <div className="text-green-500 text-xs mt-1">Tue, Fri, Sat, Today</div>
                  </div>
                  
                  <div className="bg-gray-950 rounded-lg p-6 text-center border border-red-900">
                    <div className="text-3xl font-bold text-red-400 mb-2">1</div>
                    <div className="text-gray-500 text-sm uppercase tracking-wide">Recovery Day</div>
                    <div className="text-red-500 text-xs mt-1">Wednesday crash</div>
                  </div>

                  <div className="bg-gray-950 rounded-lg p-6 text-center border border-blue-900">
                    <div className="text-3xl font-bold text-blue-400 mb-2">83%</div>
                    <div className="text-gray-500 text-sm uppercase tracking-wide">Weekly Average</div>
                    <div className="text-blue-500 text-xs mt-1">Strong week overall</div>
                  </div>
                </div>

                {/* Day Detail */}
                {selectedDay !== null && (
                  <div className="bg-white rounded-lg p-8 mb-8 border-2 border-gray-300 text-black">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-2xl font-bold text-black">
                        {weeklyData[selectedDay].day} Deep Dive
                      </h3>
                      <button 
                        onClick={() => setSelectedDay(null)}
                        className="text-gray-600 hover:text-black transition-colors text-2xl font-bold px-3 py-1 hover:bg-gray-100 rounded"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="text-center bg-gray-100 p-6 rounded-lg">
                        <div className={`text-3xl font-bold mb-2 ${
                          weeklyData[selectedDay].readiness >= 85 ? 'text-green-600' :
                          weeklyData[selectedDay].readiness >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {weeklyData[selectedDay].readiness}%
                        </div>
                        <div className="text-gray-700 text-sm font-medium">READINESS</div>
                      </div>
                      <div className="text-center bg-gray-100 p-6 rounded-lg">
                        <div className="text-blue-600 text-3xl font-bold mb-2">
                          {weeklyData[selectedDay].recovery}%
                        </div>
                        <div className="text-gray-700 text-sm font-medium">RECOVERY</div>
                      </div>
                      <div className="text-center bg-gray-100 p-6 rounded-lg">
                        <div className="text-orange-600 text-3xl font-bold mb-2">
                          {weeklyData[selectedDay].strain}
                        </div>
                        <div className="text-gray-700 text-sm font-medium">STRAIN</div>
                      </div>
                      <div className="text-center bg-gray-100 p-6 rounded-lg">
                        <div className="text-purple-600 text-3xl font-bold mb-2">
                          {weeklyData[selectedDay].sleep}
                        </div>
                        <div className="text-gray-700 text-sm font-medium">SLEEP</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-xl font-bold text-black mb-4">What Happened</h4>
                        <p className="text-gray-800 leading-relaxed mb-6 text-base">
                          {weeklyData[selectedDay].story}
                        </p>
                        <div className="bg-yellow-200 border-l-4 border-yellow-500 p-4 rounded">
                          <div className="text-sm font-bold text-yellow-800 mb-2">💡 KEY INSIGHT</div>
                          <p className="text-yellow-900 text-sm font-medium">
                            {weeklyData[selectedDay].highlight}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-xl font-bold text-black mb-4">Schedule Impact Analysis</h4>
                        <div className="space-y-4 mb-6">
                          {weeklyData[selectedDay].events.map((event, eventIndex) => (
                            <div key={eventIndex} className="bg-white rounded-lg p-4 shadow-sm border">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-800 mb-1">{event.name}</div>
                                  <div className="text-gray-600 text-sm leading-relaxed">{event.impact}</div>
                                </div>
                                <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                                  event.performance === 'excellent' || event.performance === 'predicted-excellent' 
                                    ? 'bg-green-100 text-green-800' :
                                  event.performance === 'good' || event.performance === 'predicted-good'
                                    ? 'bg-blue-100 text-blue-800' :
                                  event.performance === 'adequate' 
                                    ? 'bg-yellow-100 text-yellow-800' :
                                  event.performance === 'poor'
                                    ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {event.performance === 'predicted-excellent' ? 'PREDICTED: EXCELLENT' :
                                   event.performance === 'predicted-good' ? 'PREDICTED: GOOD' :
                                   event.performance.toUpperCase()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded">
                          <div className="text-sm font-bold text-blue-800 mb-2">📊 OVERALL PERFORMANCE</div>
                          <p className="text-blue-900 text-sm font-medium">
                            {weeklyData[selectedDay].overallPerformance}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div>
              {/* Upcoming View */}
              <section className="mb-12">
                <h2 className="text-2xl font-light text-white mb-8 text-center">Upcoming Week</h2>
                
                <div className="bg-gray-900 rounded-lg p-8 mb-8">
                  <h3 className="text-lg font-semibold text-white mb-12 uppercase tracking-wide">Predicted Readiness Trend</h3>
                  <div className="relative">
                    <div className="flex items-end justify-between h-48 mb-4">
                      {weekAheadData.map((day, index) => (
                        <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                          <div 
                            className="relative flex flex-col items-center justify-end h-40 cursor-pointer group"
                            onClick={() => handleDayClick(index + 10)}
                          >
                            {/* Confidence interval (lighter bar) */}
                            <div 
                              className={`w-6 rounded-t absolute bottom-0 opacity-30 ${
                                day.predictedReadiness >= 85 ? 'bg-green-500' :
                                day.predictedReadiness >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ height: `${(day.confidence / 100) * 160}px` }}
                            ></div>
                            {/* Predicted readiness (solid bar) */}
                            <div 
                              className={`w-6 rounded-t transition-all duration-500 hover:opacity-80 group-hover:scale-110 ${
                                selectedDay === index + 10 ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
                              } ${
                                day.predictedReadiness >= 85 ? 'bg-green-500' :
                                day.predictedReadiness >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ height: `${(day.predictedReadiness / 100) * 160}px` }}
                            ></div>
                            <div className="absolute -top-10 text-white text-xs font-bold group-hover:scale-110 transition-transform text-center w-full">
                              {day.predictedReadiness}%
                            </div>
                          </div>
                          <div 
                            className={`text-xs uppercase tracking-wide transition-all cursor-pointer hover:text-white text-center ${
                              selectedDay === index + 10 ? 'text-white font-bold' : 'text-gray-400'
                            }`}
                            onClick={() => handleDayClick(index + 10)}
                          >
                            <div className="font-medium">{day.day}</div>
                            <div className="text-xs text-gray-500">{day.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-gray-500 text-sm">Click on any day to see detailed predictions and recommendations</p>
                  </div>
                </div>

                {/* Day Detail for Upcoming */}
                {selectedDay !== null && selectedDay >= 10 && selectedDay - 10 < weekAheadData.length && (
                  <div className="bg-white rounded-lg p-8 mb-8 border-2 border-gray-300 text-black">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-2xl font-bold text-black">
                        {weekAheadData[selectedDay - 10].day} Forecast
                      </h3>
                      <button 
                        onClick={() => setSelectedDay(null)}
                        className="text-gray-600 hover:text-black transition-colors text-2xl font-bold px-3 py-1 hover:bg-gray-100 rounded"
                      >
                        ×
                      </button>
                    </div>
                    
                    {/* Predicted Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="text-center bg-gray-100 p-6 rounded-lg">
                        <div className={`text-3xl font-bold mb-2 ${
                          weekAheadData[selectedDay - 10].predictedReadiness >= 85 ? 'text-green-600' :
                          weekAheadData[selectedDay - 10].predictedReadiness >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {weekAheadData[selectedDay - 10].predictedReadiness}%
                        </div>
                        <div className="text-gray-700 text-sm font-medium">PREDICTED READINESS</div>
                        <div className="text-xs text-gray-500 mt-1">{weekAheadData[selectedDay - 10].confidence}% confidence</div>
                      </div>
                      
                      <div className="text-center bg-gray-100 p-6 rounded-lg">
                        <div className="text-blue-600 text-3xl font-bold mb-2">
                          {weekAheadData[selectedDay - 10].recovery}%
                        </div>
                        <div className="text-gray-700 text-sm font-medium">PREDICTED RECOVERY</div>
                      </div>
                      
                      <div className="text-center bg-gray-100 p-6 rounded-lg">
                        <div className="text-orange-600 text-3xl font-bold mb-2">
                          {weekAheadData[selectedDay - 10].strain}
                        </div>
                        <div className="text-gray-700 text-sm font-medium">PREDICTED STRAIN</div>
                      </div>
                      
                      <div className="text-center bg-gray-100 p-6 rounded-lg">
                        <div className="text-purple-600 text-3xl font-bold mb-2">
                          {weekAheadData[selectedDay - 10].sleep}
                        </div>
                        <div className="text-gray-700 text-sm font-medium">TARGET SLEEP</div>
                      </div>
                    </div>

                    {/* Forecast Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-xl font-bold text-black mb-4">Forecast Analysis</h4>
                        <p className="text-gray-800 leading-relaxed mb-6 text-base">
                          {weekAheadData[selectedDay - 10].story}
                        </p>
                        <div className="bg-blue-200 border-l-4 border-blue-500 p-4 rounded">
                          <div className="text-sm font-bold text-blue-800 mb-2">🔮 KEY PREDICTION</div>
                          <p className="text-blue-900 text-sm font-medium">
                            {weekAheadData[selectedDay - 10].highlight}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-xl font-bold text-black mb-4">Predicted Performance Impact</h4>
                        <div className="space-y-4 mb-6">
                          {weekAheadData[selectedDay - 10].events.map((event, eventIndex) => (
                            <div key={eventIndex} className="bg-white rounded-lg p-4 shadow-sm border">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-800 mb-1">{event.name}</div>
                                  <div className="text-gray-600 text-sm leading-relaxed">{event.impact}</div>
                                </div>
                                <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                                  event.performance === 'excellent' ? 'bg-green-100 text-green-800' :
                                  event.performance === 'good' ? 'bg-blue-100 text-blue-800' :
                                  event.performance === 'adequate' ? 'bg-yellow-100 text-yellow-800' :
                                  event.performance === 'poor' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  PREDICTED: {event.performance.toUpperCase()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-purple-100 border-l-4 border-purple-500 p-4 rounded">
                          <div className="text-sm font-bold text-purple-800 mb-2">📊 PREDICTED OUTCOME</div>
                          <p className="text-purple-900 text-sm font-medium">
                            {weekAheadData[selectedDay - 10].overallPerformance}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Risk Factors and Optimization */}
                    {weekAheadData[selectedDay - 10].riskFactors && weekAheadData[selectedDay - 10].riskFactors.length > 0 && (
                      <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
                        <h4 className="text-lg font-bold text-red-800 mb-3">⚠️ Risk Factors</h4>
                        <ul className="text-red-700 space-y-1 mb-4">
                          {weekAheadData[selectedDay - 10].riskFactors.map((risk, riskIndex) => (
                            <li key={riskIndex} className="text-sm">• {risk}</li>
                          ))}
                        </ul>
                        <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                          <div className="text-yellow-800 text-sm font-semibold mb-2">💡 Optimization Windows</div>
                          <div className="text-yellow-700 text-sm space-y-1">
                            {weekAheadData[selectedDay - 10].optimalWindows && weekAheadData[selectedDay - 10].optimalWindows.map((window, windowIndex) => (
                              <div key={windowIndex}>• {window}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Weekly Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-900 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-green-500 mb-2">3</div>
                    <div className="text-gray-400 text-sm uppercase tracking-wide">Optimal Days</div>
                    <div className="text-green-400 text-xs mt-1">Tue, Fri, Sat</div>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-red-500 mb-2">1</div>
                    <div className="text-gray-400 text-sm uppercase tracking-wide">High Risk Day</div>
                    <div className="text-red-400 text-xs mt-1">Wednesday overload</div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-blue-500 mb-2">82%</div>
                    <div className="text-gray-400 text-sm uppercase tracking-wide">Avg Predicted</div>
                    <div className="text-blue-400 text-xs mt-1">Strong week ahead</div>
                  </div>
                </div>
              </section>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}