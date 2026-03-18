'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { toPng } from 'html-to-image'
import { trackEvent, getSandboxSessionId, resetSandboxSessionId } from '../lib/trackEvent'
import { detectMood } from '../lib/mood'
import type { HeroMessage, WorkHealthMetrics } from '../hooks/useWorkHealth'
import SwipeableQuoteCards from './SwipeableQuoteCards'
import WhyMood from './WhyMood'
import PersistLogo from './PersistLogo'
import SandboxMeetingBuilder, { type MeetingEntry } from './SandboxMeetingBuilder'

function formatFocusTime(focusTimeMinutes: number) {
  const safe = Math.max(0, Math.min(480, focusTimeMinutes))
  return { hours: Math.floor(safe / 60), minutes: Math.round(safe % 60) }
}

const EMPTY_SCHEDULE = { meetingCount: 0, backToBackCount: 0, bufferTime: 0, durationHours: 0, fragmentationScore: 0, morningMeetings: 0, afternoonMeetings: 0, meetingRatio: 0, uniqueContexts: 0, longestStretch: 0, adequateBreaks: 0, shortBreaks: 0, earlyLateMeetings: 0 }

// --- Trend generation for sandbox ---

interface TrendInsight {
  type: 'positive' | 'negative' | 'neutral'
  metric: 'focus' | 'strain' | 'balance'
  title: string
  message: string
}

interface DailySnapshot {
  date: string
  focus: number
  strain: number
  balance: number
  isToday?: boolean
}

interface GeneratedTrends {
  weekly: {
    days: DailySnapshot[]
    insights: TrendInsight[]
    bestDay: string
    worstDay: string
  }
  monthly: {
    weeks: Array<{ label: string; focus: number; strain: number; balance: number }>
    insights: TrendInsight[]
    trend: 'improving' | 'declining' | 'stable'
  }
}

function vary(base: number, range: number): number {
  const v = base + Math.round((Math.random() - 0.5) * range * 2)
  return Math.min(100, Math.max(5, v))
}

function generateWeeklyInsights(
  days: DailySnapshot[],
  todayFocus: number,
  todayStrain: number,
  _todayBalance: number,
  todayLabel: string,
): TrendInsight[] {
  const insights: TrendInsight[] = []
  const avgFocus = Math.round(days.reduce((s, d) => s + d.focus, 0) / days.length)
  const avgStrain = Math.round(days.reduce((s, d) => s + d.strain, 0) / days.length)
  const best = [...days].sort((a, b) => b.focus - a.focus)[0]
  const worst = [...days].sort((a, b) => a.focus - b.focus)[0]

  if (todayFocus <= 35) {
    insights.push({ type: 'negative', metric: 'focus', title: `${todayLabel} was your hardest day for focus`, message: `At ${todayFocus} Focus, your schedule left almost no room for deep work. Compare that to ${best.date} at ${best.focus} — what was different? Fewer meetings, better spacing, or just fewer back-to-backs can shift the number dramatically.` })
  } else if (todayFocus >= 75) {
    insights.push({ type: 'positive', metric: 'focus', title: `${todayLabel} is your strongest day this week`, message: `${todayFocus} Focus means your schedule gave you real room to think. If every day looked like this, you'd be operating in a completely different gear. Look at what made today work and protect that structure.` })
  } else {
    insights.push({ type: 'neutral', metric: 'focus', title: `Focus ranged from ${worst.focus} to ${best.focus} this week`, message: `You averaged ${avgFocus} Focus across the week. That's enough to get things done but not enough to produce your best work. The gap between your best and worst day suggests your calendar structure varies a lot — consistency would help.` })
  }

  if (todayStrain >= 60) {
    insights.push({ type: 'negative', metric: 'strain', title: 'High cognitive load is compounding', message: `${todayStrain} Strain means context switching, back-to-backs, and decision fatigue are stacking up. Even one 15-minute buffer between meetings would give your working memory a chance to reset.` })
  } else if (todayStrain <= 25) {
    insights.push({ type: 'positive', metric: 'strain', title: 'Low strain — your brain has room to breathe', message: `${todayStrain} Strain means you're not fighting your calendar today. Your cognitive reserve is high, context switches are low, and you're not burning willpower just to keep up.` })
  } else {
    insights.push({ type: 'neutral', metric: 'strain', title: 'Moderate strain all week', message: `Averaging ${avgStrain} Strain means you're never overwhelmed but never fully resting either. You're in the autopilot zone — sustainable but not where breakthrough work happens.` })
  }

  if (_todayBalance >= 70) {
    insights.push({ type: 'positive', metric: 'balance', title: 'Sustainable pace today', message: `${_todayBalance} Balance means your day has rhythm — work blocks, then breathing room, then work again. This pattern is repeatable.` })
  } else if (_todayBalance <= 40) {
    insights.push({ type: 'negative', metric: 'balance', title: 'This pace is hard to sustain', message: `${_todayBalance} Balance means your schedule has no recovery built in. One day like this is fine — a week of it leads to that Friday afternoon feeling where you can't remember what you actually accomplished.` })
  } else {
    insights.push({ type: 'neutral', metric: 'balance', title: `${best.date} had the right structure`, message: `Your best day hit ${best.balance} Balance. The difference usually isn't fewer meetings — it's better spacing. Two meetings with a focus block between them feel completely different from two meetings back-to-back.` })
  }

  return insights
}

function generateMonthlyInsights(
  weeks: Array<{ label: string; focus: number; strain: number; balance: number }>,
  trend: 'improving' | 'declining' | 'stable',
): TrendInsight[] {
  const insights: TrendInsight[] = []

  if (trend === 'declining') {
    insights.push({ type: 'negative', metric: 'focus', title: 'Focus has been sliding', message: `You started the month at ${weeks[0].focus} Focus and you're at ${weeks[3].focus} now. That's not a bad day — that's a trend. Something changed in your calendar and your deep work time has been paying the price.` })
    insights.push({ type: 'negative', metric: 'strain', title: 'Cognitive load is creeping up', message: `Strain went from ${weeks[0].strain} to ${weeks[3].strain} over four weeks. It happens gradually — each week is only slightly worse, so you don't notice until you're exhausted.` })
    insights.push({ type: 'neutral', metric: 'balance', title: 'No recovery week in sight', message: `Balance dropped from ${weeks[0].balance} to ${weeks[3].balance}. You haven't had a single week this month where things got meaningfully lighter.` })
  } else if (trend === 'improving') {
    insights.push({ type: 'positive', metric: 'focus', title: `Focus improved ${weeks[3].focus - weeks[0].focus} points this month`, message: `You went from ${weeks[0].focus} to ${weeks[3].focus} Focus. Fewer meetings, better-protected focus blocks, or both. The trajectory matters more than any single day.` })
    insights.push({ type: 'positive', metric: 'strain', title: 'You systematically cut cognitive load', message: `Strain dropped from ${weeks[0].strain} to ${weeks[3].strain}. Fewer back-to-backs, fewer afternoon-heavy days, and less context switching.` })
    insights.push({ type: 'positive', metric: 'balance', title: 'This pace is actually repeatable', message: `Balance climbed from ${weeks[0].balance} to ${weeks[3].balance}. The sign of sustainability isn't one great week — it's four weeks where each one is slightly better than the last.` })
  } else {
    insights.push({ type: 'neutral', metric: 'focus', title: 'Four very similar weeks', message: `Focus stayed between ${Math.min(...weeks.map(w => w.focus))} and ${Math.max(...weeks.map(w => w.focus))} all month. Same recurring meetings, same structure, same results. Nothing is getting worse, but nothing is getting better.` })
    insights.push({ type: 'neutral', metric: 'balance', title: 'No breakout week', message: `Balance ranged from ${Math.min(...weeks.map(w => w.balance))} to ${Math.max(...weeks.map(w => w.balance))}. You don't have a release valve — no light day that lets you recharge.` })
    insights.push({ type: 'positive', metric: 'strain', title: 'No burnout spikes', message: `Strain stayed stable all month — no week above ${Math.max(...weeks.map(w => w.strain))}. You're not at risk of acute burnout, which is genuinely good.` })
  }

  return insights
}

function generateTrendsFromScore(focus: number, strain: number, balance: number): GeneratedTrends {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const todayIndex = new Date().getDay()
  const todayLabel = todayIndex >= 1 && todayIndex <= 5 ? dayNames[todayIndex - 1] : 'Wed'

  const days: DailySnapshot[] = dayNames.map((name) => {
    if (name === todayLabel) return { date: name, focus, strain, balance, isToday: true }
    return { date: name, focus: vary(focus, 18), strain: vary(strain, 16), balance: vary(balance, 15) }
  })

  const bestDay = [...days].sort((a, b) => b.focus - a.focus)[0]
  const worstDay = [...days].sort((a, b) => a.focus - b.focus)[0]
  const weeklyInsights = generateWeeklyInsights(days, focus, strain, balance, todayLabel)

  const monthlyTrend: 'improving' | 'declining' | 'stable' = strain >= 55 ? 'declining' : balance >= 70 ? 'improving' : 'stable'
  const weeklyAvgFocus = Math.round(days.reduce((s, d) => s + d.focus, 0) / days.length)
  const weeklyAvgStrain = Math.round(days.reduce((s, d) => s + d.strain, 0) / days.length)
  const weeklyAvgBalance = Math.round(days.reduce((s, d) => s + d.balance, 0) / days.length)

  let monthlyWeeks: Array<{ label: string; focus: number; strain: number; balance: number }>
  if (monthlyTrend === 'declining') {
    monthlyWeeks = [
      { label: 'Week 1', focus: vary(weeklyAvgFocus + 12, 5), strain: vary(strain - 14, 5), balance: vary(balance + 10, 5) },
      { label: 'Week 2', focus: vary(weeklyAvgFocus + 6, 5), strain: vary(strain - 8, 5), balance: vary(balance + 5, 5) },
      { label: 'Week 3', focus: vary(weeklyAvgFocus - 2, 5), strain: vary(strain + 2, 5), balance: vary(balance - 2, 5) },
      { label: 'Week 4', focus: weeklyAvgFocus, strain: weeklyAvgStrain, balance: weeklyAvgBalance },
    ]
  } else if (monthlyTrend === 'improving') {
    monthlyWeeks = [
      { label: 'Week 1', focus: vary(weeklyAvgFocus - 14, 5), strain: vary(strain + 15, 5), balance: vary(balance - 12, 5) },
      { label: 'Week 2', focus: vary(weeklyAvgFocus - 8, 5), strain: vary(strain + 8, 5), balance: vary(balance - 6, 5) },
      { label: 'Week 3', focus: vary(weeklyAvgFocus - 3, 5), strain: vary(strain + 3, 5), balance: vary(balance - 2, 5) },
      { label: 'Week 4', focus: weeklyAvgFocus, strain: weeklyAvgStrain, balance: weeklyAvgBalance },
    ]
  } else {
    monthlyWeeks = [
      { label: 'Week 1', focus: vary(weeklyAvgFocus, 5), strain: vary(strain, 5), balance: vary(balance, 5) },
      { label: 'Week 2', focus: vary(weeklyAvgFocus, 4), strain: vary(strain, 4), balance: vary(balance, 4) },
      { label: 'Week 3', focus: vary(weeklyAvgFocus, 3), strain: vary(strain, 3), balance: vary(balance, 3) },
      { label: 'Week 4', focus: weeklyAvgFocus, strain: weeklyAvgStrain, balance: weeklyAvgBalance },
    ]
  }

  const monthlyInsights = generateMonthlyInsights(monthlyWeeks, monthlyTrend)

  return {
    weekly: { days, insights: weeklyInsights, bestDay: bestDay.date, worstDay: worstDay.date },
    monthly: { weeks: monthlyWeeks, insights: monthlyInsights, trend: monthlyTrend },
  }
}

export default function SandboxDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'resilience' | 'sustainability'>('overview')
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [shareState, setShareState] = useState<'idle' | 'generating'>('idle')

  const [customMetrics, setCustomMetrics] = useState<WorkHealthMetrics | null>(null)
  const [customMeetings, setCustomMeetings] = useState<MeetingEntry[] | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const [trends, setTrends] = useState<GeneratedTrends | null>(null)
  const [trendView, setTrendView] = useState<'weekly' | 'monthly'>('weekly')
  const [showTrends, setShowTrends] = useState(false)
  const [scoreTimestamp, setScoreTimestamp] = useState<number>(0)

  // Analytics refs
  const metricComponentsSeen = useRef<Set<string>>(new Set())
  const metricTabEnteredAt = useRef<number>(0)
  const trendsButtonSeen = useRef(false)
  const sparklinesSeen = useRef<Set<string>>(new Set())

  const heroMessages: HeroMessage[] = customMetrics?.ai?.heroMessages || []

  const handleConnect = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  const handleShare = useCallback(async () => {
    if (shareState === 'generating' || !cardRef.current) return
    setShareState('generating')
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, quality: 1, skipFonts: true })
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], 'persist-today.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
          setShareState('idle')
          return
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') {
            setShareState('idle')
            return
          }
        }
      }

      // Fallback: download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'persist-today.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Share failed:', err)
    }
    setShareState('idle')
  }, [shareState])

  const handleScoreCustomDay = async (meetings: MeetingEntry[]) => {
    setIsScoring(true)
    setCustomMeetings(meetings)
    try {
      const res = await fetch('/api/sandbox-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetings: meetings.filter(m => m.title.trim()) }),
      })
      if (!res.ok) throw new Error('Scoring failed')
      const data: WorkHealthMetrics = await res.json()
      setCustomMetrics(data)
      setTrends(generateTrendsFromScore(data.adaptivePerformanceIndex, data.cognitiveResilience, data.workRhythmRecovery))
      setTrendView('weekly')
      setActiveTab('overview')
      setScoreTimestamp(Date.now())
      resetSandboxSessionId()
      metricComponentsSeen.current.clear()
      trendsButtonSeen.current = false
      sparklinesSeen.current.clear()
      trackEvent('sandbox_custom_scored', {
        meetingCount: meetings.filter(m => m.title.trim()).length,
      }, getSandboxSessionId())
    } catch (err) {
      console.error('Scoring failed:', err)
    } finally {
      setIsScoring(false)
    }
  }

  const focus = customMetrics?.adaptivePerformanceIndex ?? 0
  const strain = customMetrics?.cognitiveResilience ?? 0
  const balance = customMetrics?.workRhythmRecovery ?? 0
  const mood = customMetrics ? detectMood(focus, strain, balance) : 'autopilot'
  const narrative = customMetrics?.ai?.whyNarrative ?? ''
  const s = customMetrics?.schedule ?? EMPTY_SCHEDULE
  const ft = formatFocusTime(customMetrics?.focusTime ?? 0)

  const metricInsights = {
    focus: { message: customMetrics?.ai?.performance?.message ?? '', action: customMetrics?.ai?.performance?.action ?? '' },
    strain: { message: customMetrics?.ai?.resilience?.message ?? '', action: customMetrics?.ai?.resilience?.action ?? '' },
    balance: { message: customMetrics?.ai?.sustainability?.message ?? '', action: customMetrics?.ai?.sustainability?.action ?? '' },
  }

  const daySummary = customMetrics?.ai?.overview?.message ?? 'Your custom day'
  const scored = !!customMetrics

  // Track metric tab views and time spent
  useEffect(() => {
    if (!scored) return
    if (activeTab === 'performance' || activeTab === 'resilience' || activeTab === 'sustainability') {
      trackEvent('sandbox_metric_tab_viewed', { metric: activeTab }, getSandboxSessionId())
      metricTabEnteredAt.current = Date.now()
    }
    return () => {
      if (metricTabEnteredAt.current && activeTab !== 'overview') {
        const timeSpentMs = Date.now() - metricTabEnteredAt.current
        if (timeSpentMs > 1000) {
          trackEvent('sandbox_metric_time_spent', {
            metric: activeTab,
            timeSpentMs,
            timeSpentSeconds: Math.round(timeSpentMs / 1000),
          }, getSandboxSessionId())
        }
        metricTabEnteredAt.current = 0
      }
    }
  }, [activeTab, scored])

  // IntersectionObserver helper for one-shot visibility tracking
  const observeOnce = useCallback((el: HTMLElement | null, key: string, seenSet: React.MutableRefObject<Set<string>>, event: Parameters<typeof trackEvent>[0], metadata: Record<string, unknown>) => {
    if (!el || !scored || seenSet.current.has(key)) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !seenSet.current.has(key)) {
        seenSet.current.add(key)
        trackEvent(event, metadata, getSandboxSessionId())
        observer.disconnect()
      }
    }, { threshold: 0.3 })
    observer.observe(el)
  }, [scored])

  return (
    <>
      <style jsx global>{`
        :root {
          --cream: #FBF7F2;
          --warm-white: #FEFCF9;
          --ink: #1C1917;
          --ink-light: #57534E;
          --ink-faint: #A8A29E;
          --amber: #E87D3A;
          --amber-light: #FDF0E6;
          --border: #E7E0D8;
          --text-secondary: #57534E;
        }

        .sb-wrap {
          font-family: 'Inter', sans-serif;
          background: var(--cream);
          color: var(--ink);
          min-height: 100vh;
          padding-bottom: 80px;
          overflow-x: hidden;
        }

        @media (min-width: 640px) {
          .sb-wrap { padding-bottom: 0; }
        }

        /* Nav */
        .sb-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 16px;
          background: var(--warm-white);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        @media (min-width: 640px) {
          .sb-nav { padding: 16px 24px; }
        }
        .sb-nav-logo {
          font-weight: 800;
          font-size: 18px;
          letter-spacing: -0.5px;
          color: var(--ink);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sb-nav-logo span { color: var(--amber); }
        .sb-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--amber);
          background: var(--amber-light);
          padding: 3px 8px;
          border-radius: 6px;
        }
        .sb-nav-cta {
          background: var(--amber);
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .sb-nav-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(232,125,58,0.3);
        }

        /* Content */
        .sb-content {
          max-width: 420px;
          margin: 0 auto;
          padding: 24px 16px 40px;
        }
        @media (min-width: 640px) {
          .sb-content { max-width: 480px; padding: 32px 24px 80px; }
        }
        @media (min-width: 1024px) {
          .sb-content { max-width: 520px; }
        }

        /* Metric detail tabs — tighter spacing on mobile */
        .sb-metric-detail { display: flex; flex-direction: column; gap: 24px; }
        .sb-metric-detail .metric-breakdown { padding: 20px 16px; }
        @media (min-width: 640px) {
          .sb-metric-detail { gap: 32px; }
          .sb-metric-detail .metric-breakdown { padding: 24px; }
        }

        /* Calendar preview */
        .sb-cal {
          background: var(--warm-white);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
        }
        .sb-cal-body {
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        @media (min-width: 640px) {
          .sb-cal-body { padding: 10px 12px; gap: 3px; }
        }

        /* Event styles */
        .sb-ev-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          background: var(--warm-white);
          border-left: 3px solid transparent;
        }
        @media (min-width: 640px) {
          .sb-ev-row { padding: 10px 12px; }
        }
        .sb-ev-time {
          font-size: 11px;
          font-weight: 600;
          color: var(--ink-faint);
          min-width: 40px;
          flex-shrink: 0;
        }
        .sb-ev-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sb-ev-amber { border-color: #E8883A; }

        /* Share button */
        .sb-share-btn {
          width: 100%;
          padding: 16px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          background: rgba(28,25,23,0.03);
          border: 1px solid var(--border);
          color: var(--ink-light);
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, border-color 0.15s;
          margin-top: 12px;
        }
        .sb-share-btn:hover {
          background: rgba(28,25,23,0.06);
          border-color: rgba(28,25,23,0.2);
        }

        /* Sticky bottom CTA — mobile only */
        .sb-sticky-cta {
          display: block;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: rgba(251,247,242,0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid var(--border);
          padding: 12px 16px;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }
        @media (min-width: 640px) {
          .sb-sticky-cta { display: none; }
        }
      `}</style>

      <div className="sb-wrap">
        {/* Nav */}
        <nav className="sb-nav">
          <Link href="/" className="sb-nav-logo">
            <PersistLogo size={22} />
            PERSIST<span>WORK</span>
            <span className="sb-badge">Sandbox</span>
          </Link>
          <button className="sb-nav-cta" onClick={handleConnect}>
            Decode your real day &rarr;
          </button>
        </nav>

        {/* Main content */}
        <div className="sb-content">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* Meeting entry form — before scoring */}
              {!customMetrics && (
                <div style={{ marginTop: 16 }}>
                  <SandboxMeetingBuilder onScore={handleScoreCustomDay} isScoring={isScoring} />
                </div>
              )}

              {/* After scoring: calendar preview + card + WhyMood */}
              {customMetrics && customMeetings && (
              <>
                {/* Edit & re-score — top of results */}
                <button
                  onClick={() => {
                    setCustomMetrics(null)
                    setTrends(null)
                    setTrendView('weekly')
                    setShowTrends(false)
                    trackEvent('sandbox_custom_reset', {})
                  }}
                  style={{
                    display: 'block',
                    margin: '16px auto 0',
                    background: 'none',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--ink-faint)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  &larr; Edit meetings and re-score
                </button>

                {/* Calendar preview of entered meetings */}
                <div style={{ marginTop: 16 }}>
                  <p style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-faint)',
                    marginBottom: 8,
                  }}>
                    Your Day &middot; {customMeetings.filter(m => m.title.trim()).length} meetings
                  </p>
                  <div className="sb-cal">
                    <div className="sb-cal-body">
                      {customMeetings.filter(m => m.title.trim()).map((m) => {
                        const fmtTime = (h: number, min: number) => {
                          const dh = h > 12 ? h - 12 : h === 0 ? 12 : h
                          return `${dh}:${min === 0 ? '00' : '30'}`
                        }
                        return (
                          <div className="sb-ev-row sb-ev-amber" key={m.id}>
                            <span className="sb-ev-time">{fmtTime(m.startHour, m.startMinute)}</span>
                            <span className="sb-ev-title">{m.title}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Transition line */}
                <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    margin: '0 auto 12px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(232,125,58,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#E87D3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12l7 7 7-7"/>
                    </svg>
                  </div>
                  <p style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    margin: '0 0 4px',
                  }}>
                    Here&rsquo;s how your day scores:
                  </p>
                </div>

                {/* Card */}
                <div>
                  <SwipeableQuoteCards
                    quotes={heroMessages}
                    focus={focus}
                    strain={strain}
                    balance={balance}
                    mood={mood}
                    daySummary={daySummary}
                    activeCardRef={(el) => { cardRef.current = el }}
                  />
                </div>

                {/* Share button */}
                <button
                  className="sb-share-btn"
                  onClick={handleShare}
                  disabled={shareState === 'generating'}
                  style={{ opacity: shareState === 'generating' ? 0.6 : 1 }}
                >
                  {shareState === 'generating' ? 'Generating...' : 'Share your card \u2192'}
                </button>

                {/* Why this mood + metric bars */}
                <WhyMood
                  mood={mood}
                  narrative={narrative}
                  focus={focus}
                  strain={strain}
                  balance={balance}
                  onMetricClick={(metric) => {
                    setActiveTab(metric as 'performance' | 'resilience' | 'sustainability')
                  }}
                  defaultOpen
                />

                {/* Trends entry card */}
                {trends && !showTrends && (
                  <button
                    ref={(el) => {
                      if (!el || trendsButtonSeen.current || !scored) return
                      const observer = new IntersectionObserver(([entry]) => {
                        if (entry.isIntersecting && !trendsButtonSeen.current) {
                          trendsButtonSeen.current = true
                          trackEvent('sandbox_trends_button_viewed', {}, getSandboxSessionId())
                          observer.disconnect()
                        }
                      }, { threshold: 0.3 })
                      observer.observe(el)
                    }}
                    onClick={() => { setShowTrends(true); trackEvent('sandbox_trends_expanded', { timeAfterScore: scoreTimestamp ? Date.now() - scoreTimestamp : 0 }, getSandboxSessionId()) }}
                    style={{
                      width: '100%',
                      marginTop: 8,
                      padding: '18px 20px',
                      borderRadius: 14,
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--warm-white)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        backgroundColor: 'rgba(232,125,58,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E87D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                          Trends over time
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                          See how your week and month look
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: 16, color: 'var(--ink-faint)', fontWeight: 500 }}>&rsaquo;</span>
                  </button>
                )}

                {/* Trends section — expanded */}
                {trends && showTrends && (
                <section style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', margin: 0 }}>
                      Your Trends
                    </h2>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: 'rgba(232,125,58,0.08)', color: '#D06B2E' }}>
                      Preview
                    </span>
                  </div>

                  <div style={{ display: 'flex', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 20 }}>
                    {(['weekly', 'monthly'] as const).map((view) => (
                      <button
                        key={view}
                        onClick={() => { trackEvent('sandbox_trend_toggled', { from: trendView, to: view }, getSandboxSessionId()); setTrendView(view) }}
                        style={{
                          flex: 1, padding: '10px 16px', fontSize: 13, fontWeight: 600,
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          backgroundColor: trendView === view ? '#1C1917' : 'transparent',
                          color: trendView === view ? '#FBF7F2' : 'var(--ink-light)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {view === 'weekly' ? 'This Week' : 'This Month'}
                      </button>
                    ))}
                  </div>

                  {/* Sparkline cards */}
                  {(() => {
                    const items = trendView === 'weekly'
                      ? trends.weekly.days.map(d => ({ label: d.date, focus: d.focus, strain: d.strain, balance: d.balance, isToday: d.isToday }))
                      : trends.monthly.weeks.map(w => ({ label: w.label, focus: w.focus, strain: w.strain, balance: w.balance, isToday: false }))

                    const allInsights = trendView === 'weekly' ? trends.weekly.insights : trends.monthly.insights

                    const metrics = [
                      { key: 'focus' as const, label: 'Focus', color: '#E87D3A', getValue: (d: typeof items[0]) => d.focus, current: focus },
                      { key: 'strain' as const, label: 'Strain', color: '#C0544A', getValue: (d: typeof items[0]) => d.strain, current: strain },
                      { key: 'balance' as const, label: 'Balance', color: '#5A7A5C', getValue: (d: typeof items[0]) => d.balance, current: balance },
                    ]

                    // SVG sparkline builder
                    const W = 280
                    const H = 48
                    const PAD_X = 12
                    const PAD_Y = 6

                    const buildPath = (values: number[]) => {
                      if (values.length < 2) return { line: '', area: '' }
                      const minV = Math.min(...values)
                      const maxV = Math.max(...values)
                      const range = maxV - minV || 1
                      const xStep = (W - PAD_X * 2) / (values.length - 1)

                      const pts = values.map((v, i) => ({
                        x: PAD_X + i * xStep,
                        y: PAD_Y + (1 - (v - minV) / range) * (H - PAD_Y * 2),
                      }))

                      // Cubic bezier through points
                      let line = `M${pts[0].x},${pts[0].y}`
                      for (let i = 0; i < pts.length - 1; i++) {
                        const cp = xStep * 0.35
                        line += ` C${pts[i].x + cp},${pts[i].y} ${pts[i + 1].x - cp},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`
                      }

                      // Area: line path + close to bottom
                      const area = `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`
                      return { line, area, pts }
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {metrics.map(({ key, label, color, getValue, current }) => {
                          const values = items.map(getValue)
                          const { line, area, pts } = buildPath(values)
                          const todayIdx = items.findIndex(d => d.isToday)

                          // Direction arrow — compare last vs first half averages
                          const half = Math.floor(values.length / 2)
                          const firstHalf = values.slice(0, half).reduce((a, b) => a + b, 0) / half
                          const secondHalf = values.slice(half).reduce((a, b) => a + b, 0) / (values.length - half)
                          const diff = secondHalf - firstHalf
                          const isUp = diff > 3
                          const isDown = diff < -3

                          // Strain is inverted: up = bad, down = good
                          const arrowColor = key === 'strain'
                            ? (isUp ? '#C0544A' : isDown ? '#5A7A5C' : 'var(--ink-faint)')
                            : (isUp ? '#5A7A5C' : isDown ? '#C0544A' : 'var(--ink-faint)')

                          // First matching insight for this metric
                          const topInsight = allInsights.find(ins => ins.metric === key)

                          return (
                            <div key={key} ref={(el) => {
                              const sparkKey = `${key}-${trendView}`
                              observeOnce(el, sparkKey, sparklinesSeen, 'sandbox_trend_sparkline_viewed', { metric: key, view: trendView })
                            }} style={{
                              padding: '14px 16px 12px',
                              borderRadius: 12,
                              backgroundColor: 'var(--warm-white)',
                              border: '1px solid var(--border)',
                            }}>
                              {/* Header: metric name + value + arrow */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
                                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{label}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 18, fontWeight: 700, color, fontFeatureSettings: '"tnum"' }}>{current}</span>
                                  {(isUp || isDown) && (
                                    <span style={{ fontSize: 12, fontWeight: 700, color: arrowColor }}>
                                      {isUp ? '\u2191' : '\u2193'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* SVG sparkline */}
                              <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
                                {area && <path d={area} fill={color} opacity={0.08} />}
                                {line && <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
                                {/* Today dot */}
                                {pts && todayIdx >= 0 && todayIdx < pts.length && (
                                  <>
                                    <circle cx={pts[todayIdx].x} cy={pts[todayIdx].y} r={5} fill={color} opacity={0.15} />
                                    <circle cx={pts[todayIdx].x} cy={pts[todayIdx].y} r={3} fill={color} />
                                  </>
                                )}
                              </svg>

                              {/* X-axis labels */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, padding: '0 4px' }}>
                                {items.map((d) => (
                                  <span key={d.label} style={{
                                    fontSize: 9,
                                    fontWeight: d.isToday ? 800 : 500,
                                    color: d.isToday ? '#E87D3A' : 'var(--ink-faint)',
                                  }}>
                                    {d.isToday ? 'Today' : d.label}
                                  </span>
                                ))}
                              </div>

                              {/* One-line insight */}
                              {topInsight && (
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, marginBottom: 0, lineHeight: 1.4 }}>
                                  {topInsight.title}
                                </p>
                              )}
                            </div>
                          )
                        })}

                        {/* Collapsible full insights */}
                        {allInsights.length > 0 && (
                          <details open style={{ marginTop: 4 }} onToggle={(e) => {
                            if ((e.target as HTMLDetailsElement).open) {
                              trackEvent('sandbox_trend_insights_expanded', { view: trendView }, getSandboxSessionId())
                            }
                          }}>
                            <summary style={{
                              fontSize: 12, fontWeight: 600, color: 'var(--ink-faint)',
                              cursor: 'pointer', padding: '8px 0', listStyle: 'none',
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                              <span style={{ fontSize: 10, transition: 'transform 0.15s' }}>&#9654;</span>
                              All insights ({allInsights.length})
                            </summary>
                            <div style={{ paddingTop: 4 }}>
                              {allInsights.map((insight, i, arr) => (
                                <div key={i} style={{ padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, backgroundColor: insight.metric === 'focus' ? '#E87D3A' : insight.metric === 'strain' ? '#C0544A' : '#5A7A5C' }} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{insight.title}</span>
                                  </div>
                                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: 12, margin: 0 }}>{insight.message}</p>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    )
                  })()}

                  {/* Best / Worst (weekly only) */}
                  {trendView === 'weekly' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                      <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'rgba(90,122,92,0.06)', border: '1px solid rgba(90,122,92,0.15)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#5A7A5C', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Best day</span>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginTop: 2, marginBottom: 0 }}>{trends.weekly.bestDay}</p>
                      </div>
                      <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'rgba(192,84,74,0.06)', border: '1px solid rgba(192,84,74,0.15)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#C0544A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hardest day</span>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginTop: 2, marginBottom: 0 }}>{trends.weekly.worstDay}</p>
                      </div>
                    </div>
                  )}

                  {/* Monthly trend direction */}
                  {trendView === 'monthly' && (
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: trends.monthly.trend === 'improving' ? '#5A7A5C' : trends.monthly.trend === 'declining' ? '#C0544A' : 'var(--ink-faint)',
                      }}>
                        {trends.monthly.trend === 'improving' && '\u2191 Improving'}
                        {trends.monthly.trend === 'declining' && '\u2193 Declining'}
                        {trends.monthly.trend === 'stable' && '\u2014 Stable'}
                      </span>
                    </div>
                  )}

                  {/* WIP banner */}
                  <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 10, backgroundColor: 'rgba(232,125,58,0.05)', border: '1px solid rgba(232,125,58,0.12)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>&#128679;</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 2, marginTop: 0 }}>We&apos;re building this.</p>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>Trends will track your real Focus, Strain, and Balance over time. Connect your calendar to be first to try it when it&apos;s ready.</p>
                    </div>
                  </div>
                </section>
                )}

              </>
              )}
            </>
          )}

          {/* Focus Tab */}
          {activeTab === 'performance' && (
            <div className="sb-metric-detail">
              <button onClick={() => { trackEvent('sandbox_metric_tab_exited', { metric: 'performance' }, getSandboxSessionId()); setActiveTab('overview') }} className="flex items-center space-x-2 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--ink-faint)' }}>
                <span>&larr;</span><span>Back to Overview</span>
              </button>
              <section className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(232,125,58,0.2)" strokeWidth="8" />
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#E87D3A" strokeWidth="8"
                      strokeDasharray="339.29"
                      strokeDashoffset={339.29 - (focus / 100) * 339.29}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-5xl font-light mb-1" style={{ color: '#E87D3A', fontFeatureSettings: '"tnum"', letterSpacing: '-0.04em' }}>
                        {focus}
                      </div>
                      <div style={{ fontSize: '0.75rem', lineHeight: '1', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', fontWeight: 600 }}>
                        FOCUS
                      </div>
                    </div>
                  </div>
                </div>

                <div ref={(el) => observeOnce(el, 'performance', metricComponentsSeen, 'sandbox_metric_components_viewed', { metric: 'performance' })} className="metric-breakdown max-w-2xl mx-auto rounded-lg" style={{ backgroundColor: '#FEFCF9', border: '1px solid #E7E0D8' }}>
                  <div className="mb-6 pb-4 border-b border-[#E7E0D8] text-center">
                    <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--ink)' }}>Focus Insights</h4>
                    <div className="text-center">
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{metricInsights.focus.message}</p>
                      <p className="text-xs mt-2 leading-relaxed" style={{ color: '#E87D3A', opacity: 0.85 }}>{metricInsights.focus.action}</p>
                    </div>
                  </div>

                  <div className="space-y-5 mb-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Meeting Density</span>
                        <span className="text-xs" style={{ color: 'var(--ink-faint)', fontWeight: '500' }}>{s.meetingCount <= 2 ? 'Light' : s.meetingCount <= 4 ? 'Moderate' : 'Heavy'}</span>
                      </div>
                      <div className="w-full bg-[#E7E0D8] rounded h-1.5"><div className="h-1.5 rounded transition-all duration-700" style={{ width: `${Math.max(25, 100 - (s.meetingCount * 15))}%`, backgroundColor: '#E87D3A' }} /></div>
                      <div className="mt-1"><span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{s.meetingCount} meetings competing for your attention</span></div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Deep Work Blocks</span>
                        <span className="text-xs" style={{ color: 'var(--ink-faint)', fontWeight: '500' }}>{ft.hours >= 4 ? 'Plenty' : ft.hours >= 2 ? 'Some' : 'Scarce'}</span>
                      </div>
                      <div className="w-full bg-[#E7E0D8] rounded h-1.5"><div className="h-1.5 rounded transition-all duration-700" style={{ width: `${Math.min(100, ft.hours * 22)}%`, backgroundColor: '#E87D3A' }} /></div>
                      <div className="mt-1"><span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{ft.hours}h {ft.minutes}m available for uninterrupted work</span></div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Meeting Timing</span>
                        <span className="text-xs" style={{ color: 'var(--ink-faint)', fontWeight: '500' }}>{s.afternoonMeetings > s.morningMeetings * 1.5 ? 'Afternoon-heavy' : s.morningMeetings > 0 && s.afternoonMeetings > 0 ? 'Spread out' : 'Well-timed'}</span>
                      </div>
                      <div className="w-full bg-[#E7E0D8] rounded h-1.5"><div className="h-1.5 rounded transition-all duration-700" style={{ width: `${s.afternoonMeetings > s.morningMeetings * 1.5 ? 40 : s.afternoonMeetings > s.morningMeetings ? 70 : 100}%`, backgroundColor: '#E87D3A' }} /></div>
                      <div className="mt-1"><span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{s.morningMeetings} morning, {s.afternoonMeetings} afternoon</span></div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Calendar Commitment</span>
                        <span className="text-xs" style={{ color: 'var(--ink-faint)', fontWeight: '500' }}>{s.meetingRatio <= 0.3 ? 'Light' : s.meetingRatio <= 0.5 ? 'Moderate' : 'Heavy'}</span>
                      </div>
                      <div className="w-full bg-[#E7E0D8] rounded h-1.5"><div className="h-1.5 rounded transition-all duration-700" style={{ width: `${Math.max(15, 100 - (s.meetingRatio * 100))}%`, backgroundColor: '#E87D3A' }} /></div>
                      <div className="mt-1"><span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{s.durationHours}h of your day is in meetings ({Math.round(s.meetingRatio * 100)}%)</span></div>
                    </div>
                  </div>

                  <p className="text-xs mt-4 pt-4 border-t border-[#E7E0D8]" style={{ color: 'var(--ink-faint)', lineHeight: '1.4' }}>
                    How much capacity you have today for deep, uninterrupted work — based on meeting load, available focus blocks, and schedule flow.
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* Strain Tab */}
          {activeTab === 'resilience' && (
            <div className="sb-metric-detail">
              <button onClick={() => { trackEvent('sandbox_metric_tab_exited', { metric: 'resilience' }, getSandboxSessionId()); setActiveTab('overview') }} className="flex items-center space-x-2 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--ink-faint)' }}>
                <span>&larr;</span><span>Back to Overview</span>
              </button>
              <section className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(192,84,74,0.2)" strokeWidth="8" />
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#C0544A" strokeWidth="8"
                      strokeDasharray="339.29"
                      strokeDashoffset={339.29 - (strain / 100) * 339.29}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-5xl font-light mb-1" style={{ color: '#C0544A', fontFeatureSettings: '"tnum"', letterSpacing: '-0.04em' }}>{strain}</div>
                      <div style={{ fontSize: '0.75rem', lineHeight: '1', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', fontWeight: 600 }}>STRAIN</div>
                    </div>
                  </div>
                </div>

                <div ref={(el) => observeOnce(el, 'resilience', metricComponentsSeen, 'sandbox_metric_components_viewed', { metric: 'resilience' })} className="metric-breakdown max-w-2xl mx-auto rounded-lg" style={{ backgroundColor: '#FEFCF9', border: '1px solid #E7E0D8' }}>
                  <div className="mb-6 pb-4 border-b border-[#E7E0D8] text-center">
                    <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--ink)' }}>Strain Insights</h4>
                    <div className="text-center">
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{metricInsights.strain.message}</p>
                      <p className="text-xs mt-2 leading-relaxed" style={{ color: '#E87D3A', opacity: 0.85 }}>{metricInsights.strain.action}</p>
                    </div>
                  </div>

                  <div className="space-y-5 mb-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Context Switching</span>
                        <span className="text-xs" style={{ color: 'var(--ink-faint)', fontWeight: '500' }}>{s.uniqueContexts <= 3 ? 'Low' : s.uniqueContexts <= 5 ? 'Moderate' : 'High'}</span>
                      </div>
                      <div className="w-full bg-[#E7E0D8] rounded h-1.5"><div className="h-1.5 rounded transition-all duration-700" style={{ width: `${Math.max(20, 100 - (s.uniqueContexts * 12))}%`, backgroundColor: '#C0544A' }} /></div>
                      <div className="mt-1"><span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{s.uniqueContexts} different contexts your brain has to shift between</span></div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Decision Fatigue Risk</span>
                        <span className="text-xs" style={{ color: 'var(--ink-faint)', fontWeight: '500' }}>{s.afternoonMeetings <= 1 ? 'Low' : s.afternoonMeetings <= 3 ? 'Moderate' : 'High'}</span>
                      </div>
                      <div className="w-full bg-[#E7E0D8] rounded h-1.5"><div className="h-1.5 rounded transition-all duration-700" style={{ width: `${Math.max(20, 100 - (s.afternoonMeetings * 20))}%`, backgroundColor: '#C0544A' }} /></div>
                      <div className="mt-1"><span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{s.afternoonMeetings} afternoon meetings when willpower is lower</span></div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Longest Meeting Chain</span>
                        <span className="text-xs" style={{ color: 'var(--ink-faint)', fontWeight: '500' }}>{s.longestStretch <= 1 ? 'None' : s.longestStretch <= 2 ? 'Short' : 'Long'}</span>
                      </div>
                      <div className="w-full bg-[#E7E0D8] rounded h-1.5"><div className="h-1.5 rounded transition-all duration-700" style={{ width: `${Math.max(20, 100 - (s.longestStretch * 25))}%`, backgroundColor: '#C0544A' }} /></div>
                      <div className="mt-1"><span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{s.longestStretch <= 1 ? 'No back-to-back chains' : `${s.longestStretch} meetings in a row without a real break`}</span></div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Cognitive Reserve</span>
                        <span className="text-xs" style={{ color: 'var(--ink-faint)', fontWeight: '500' }}>{ft.hours >= 4 ? 'Strong' : ft.hours >= 2 ? 'Moderate' : 'Low'}</span>
                      </div>
                      <div className="w-full bg-[#E7E0D8] rounded h-1.5"><div className="h-1.5 rounded transition-all duration-700" style={{ width: `${Math.min(100, ft.hours * 22)}%`, backgroundColor: '#C0544A' }} /></div>
                      <div className="mt-1"><span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{ft.hours}h {ft.minutes}m of quiet time to recharge between demands</span></div>
                    </div>
                  </div>

                  <p className="text-xs mt-4 pt-4 border-t border-[#E7E0D8]" style={{ color: 'var(--ink-faint)', lineHeight: '1.4' }}>
                    How much cognitive load your schedule is putting on you today — context switches, back-to-back meetings, and decision fatigue.
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* Balance Tab */}
          {activeTab === 'sustainability' && (
            <div className="sb-metric-detail">
              <button onClick={() => { trackEvent('sandbox_metric_tab_exited', { metric: 'sustainability' }, getSandboxSessionId()); setActiveTab('overview') }} className="flex items-center space-x-2 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--ink-faint)' }}>
                <span>&larr;</span><span>Back to Overview</span>
              </button>
              <section className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(90,122,92,0.2)" strokeWidth="8" />
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#5A7A5C" strokeWidth="8"
                      strokeDasharray="339.29"
                      strokeDashoffset={339.29 - (balance / 100) * 339.29}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-5xl font-light mb-1" style={{ color: '#5A7A5C', fontFeatureSettings: '"tnum"', letterSpacing: '-0.04em' }}>{balance}</div>
                      <div style={{ fontSize: '0.75rem', lineHeight: '1', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', fontWeight: 600 }}>BALANCE</div>
                    </div>
                  </div>
                </div>

                <div ref={(el) => observeOnce(el, 'sustainability', metricComponentsSeen, 'sandbox_metric_components_viewed', { metric: 'sustainability' })} className="metric-breakdown max-w-2xl mx-auto rounded-lg" style={{ backgroundColor: '#FEFCF9', border: '1px solid #E7E0D8' }}>
                  <div className="mb-6 pb-4 border-b border-[#E7E0D8] text-center">
                    <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--ink)' }}>Balance Insights</h4>
                    <div className="text-center">
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{metricInsights.balance.message}</p>
                      <p className="text-xs mt-2 leading-relaxed" style={{ color: '#E87D3A', opacity: 0.85 }}>{metricInsights.balance.action}</p>
                    </div>
                  </div>

                  <div className="space-y-5 mb-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Day Balance</span>
                        <span className="text-xs" style={{ color: 'var(--ink-faint)', fontWeight: '500' }}>{Math.abs(s.morningMeetings - s.afternoonMeetings) <= 1 ? 'Balanced' : s.afternoonMeetings > s.morningMeetings ? 'Afternoon-loaded' : 'Morning-loaded'}</span>
                      </div>
                      <div className="w-full bg-[#E7E0D8] rounded h-1.5"><div className="h-1.5 rounded transition-all duration-700" style={{ width: `${Math.max(30, 100 - Math.abs(s.morningMeetings - s.afternoonMeetings) * 20)}%`, backgroundColor: '#5A7A5C' }} /></div>
                      <div className="mt-1"><span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{s.morningMeetings} morning vs {s.afternoonMeetings} afternoon meetings</span></div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Recovery Breaks</span>
                        <span className="text-xs" style={{ color: 'var(--ink-faint)', fontWeight: '500' }}>{s.adequateBreaks >= 3 ? 'Plenty' : s.adequateBreaks >= 1 ? 'Some' : 'None'}</span>
                      </div>
                      <div className="w-full bg-[#E7E0D8] rounded h-1.5"><div className="h-1.5 rounded transition-all duration-700" style={{ width: `${Math.min(100, s.adequateBreaks * 25 + s.shortBreaks * 12)}%`, backgroundColor: '#5A7A5C' }} /></div>
                      <div className="mt-1"><span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{s.adequateBreaks} real breaks (30+ min) and {s.shortBreaks} short pauses</span></div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Work Intensity</span>
                        <span className="text-xs" style={{ color: 'var(--ink-faint)', fontWeight: '500' }}>{s.durationHours <= 3 ? 'Sustainable' : s.durationHours <= 5 ? 'Moderate' : 'Unsustainable'}</span>
                      </div>
                      <div className="w-full bg-[#E7E0D8] rounded h-1.5"><div className="h-1.5 rounded transition-all duration-700" style={{ width: `${Math.max(15, 100 - (s.durationHours * 15))}%`, backgroundColor: '#5A7A5C' }} /></div>
                      <div className="mt-1"><span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{s.durationHours}h locked into meetings today</span></div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Boundary Health</span>
                        <span className="text-xs" style={{ color: 'var(--ink-faint)', fontWeight: '500' }}>{s.earlyLateMeetings === 0 ? 'Clean' : s.earlyLateMeetings <= 1 ? 'Minor' : 'Overextended'}</span>
                      </div>
                      <div className="w-full bg-[#E7E0D8] rounded h-1.5"><div className="h-1.5 rounded transition-all duration-700" style={{ width: `${Math.max(20, 100 - (s.earlyLateMeetings * 30))}%`, backgroundColor: '#5A7A5C' }} /></div>
                      <div className="mt-1"><span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{s.earlyLateMeetings === 0 ? 'All meetings within core hours' : `${s.earlyLateMeetings} meeting${s.earlyLateMeetings > 1 ? 's' : ''} before 7am or after 5pm`}</span></div>
                    </div>
                  </div>

                  <p className="text-xs mt-4 pt-4 border-t border-[#E7E0D8]" style={{ color: 'var(--ink-faint)', lineHeight: '1.4' }}>
                    Can you keep this pace up? Measures whether your schedule has enough recovery time and healthy boundaries to avoid burnout.
                  </p>
                </div>
              </section>
            </div>
          )}

        </div>

        {/* Sticky bottom CTA — mobile only */}
        <div className="sb-sticky-cta">
          <button
            onClick={handleConnect}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 12,
              border: 'none',
              backgroundColor: '#1C1917',
              color: '#FBF7F2',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            See your real scores &rarr;
          </button>
          <p style={{
            fontSize: 10,
            color: 'var(--ink-faint)',
            textAlign: 'center',
            marginTop: 6,
          }}>
            Read-only calendar access
          </p>
        </div>
      </div>
    </>
  )
}
