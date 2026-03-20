'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { detectMood } from '../lib/mood'
import { MOODS } from '../lib/mood'
import { estimateScoresFromInputs, estimateScheduleAnalysis, buildWorkHealthMetrics } from '../lib/estimateScores'
import { generateTrendsFromScore } from '../lib/generateTrends'
import type { GeneratedTrends } from '../lib/generateTrends'
import type { ScheduleAnalysis } from '../lib/estimateScores'
import type { HeroMessage } from '../hooks/useWorkHealth'
import type { Mood } from '../lib/mood'
import { ComicReliefGenerator } from '../utils/comicReliefGenerator'
import CardContent from './CardContent'
import SwipeableQuoteCards from './SwipeableQuoteCards'
import WhyMood from './WhyMood'
import PersistLogo from './PersistLogo'

// --- Narrative & insight generators ---

// Matches claudeAI.ts getDefaultInsights whyNarrative builder
function generateNarrative(schedule: ScheduleAnalysis): string {
  const mc = schedule.meetingCount
  const b2b = schedule.backToBackCount
  const focusHours = Math.max(0, 8 - schedule.durationHours).toFixed(1)
  const parts: string[] = []

  if (mc === 0) {
    parts.push('No meetings on the books today — your calendar is wide open.')
  } else if (mc <= 2) {
    parts.push(`Light day with just ${mc} meeting${mc > 1 ? 's' : ''}, leaving most of your time free.`)
  } else if (mc <= 5) {
    parts.push(`${mc} meetings today with about ${focusHours} hours of focus time between them.`)
  } else {
    parts.push(`Heavy day — ${mc} meetings eating into your calendar, leaving only ${focusHours} hours for actual work.`)
  }
  if (b2b >= 3) {
    parts.push(`${b2b} of those are back-to-back, which will wear you down by the afternoon.`)
  }
  return parts.join(' ')
}

interface MetricInsightCopy {
  title: string
  message: string
  footer: string
}

function generateMetricInsights(focus: number, strain: number, balance: number, schedule: ScheduleAnalysis): { focus: MetricInsightCopy; strain: MetricInsightCopy; balance: MetricInsightCopy } {
  const focusInsight: MetricInsightCopy = focus <= 40
    ? { title: 'There was nowhere to hide today', message: "That's why it feels like you were busy all day without getting anything done.", footer: "It's not that you're bad at focusing. There was literally no room for it." }
    : focus >= 70
    ? { title: 'Your calendar gave you room to think', message: `${Math.round(schedule.bufferTime)} minutes of uninterrupted time. That's rare — and it shows in the score.`, footer: 'This is what space to think actually looks like.' }
    : { title: 'Some room to focus, but not much', message: `${schedule.meetingCount} meetings left you with scattered windows. Enough to feel productive, not enough for deep work.`, footer: 'The difference between a good day and a great day is one fewer meeting.' }

  const strainInsight: MetricInsightCopy = strain >= 60
    ? { title: 'Your brain never got to finish a thought', message: `That's ${schedule.backToBackCount} meetings back-to-back across ${schedule.uniqueContexts} different topics. Every switch costs you.`, footer: 'Context switching isn\'t multitasking. It\'s your brain starting over, every time.' }
    : strain <= 25
    ? { title: 'Low cognitive load today', message: `Only ${schedule.backToBackCount} back-to-backs and ${schedule.uniqueContexts} contexts. Your brain had room to work.`, footer: 'This is what low strain feels like. Notice it.' }
    : { title: 'Moderate load, but it adds up', message: `${schedule.backToBackCount} back-to-backs across ${schedule.uniqueContexts} contexts. Manageable today, but another day like this and you'll feel it.`, footer: 'The fatigue from moderate strain is sneaky — you only notice it on Friday.' }

  const balanceInsight: MetricInsightCopy = balance <= 40
    ? { title: "This is why you're tired, even when you didn't do anything 'hard.'", message: "There's no recovery built into this day.", footer: `${Math.round(schedule.durationHours)} hours of meetings with ${schedule.adequateBreaks} real breaks. Your body is keeping score even when you're not.` }
    : balance >= 70
    ? { title: 'Your day has actual rhythm', message: `Work, then breathe, then work again. ${schedule.adequateBreaks} real breaks between meetings.`, footer: 'This is sustainable. Not every day needs to be a marathon.' }
    : { title: 'Not terrible, not great', message: `${schedule.adequateBreaks} real breaks in a ${Math.round(schedule.durationHours)}-hour meeting day. You survived, but thriving looks different.`, footer: 'One more break and this goes from okay to good.' }

  return { focus: focusInsight, strain: strainInsight, balance: balanceInsight }
}

function formatFocusTime(focusTimeMinutes: number) {
  const safe = Math.max(0, Math.min(480, focusTimeMinutes))
  return { hours: Math.floor(safe / 60), minutes: Math.round(safe % 60) }
}

// --- Dashboard sub-view type ---
type DashboardView = 'overview' | 'focus-detail' | 'strain-detail' | 'balance-detail'

// --- Component ---

export default function LandingPage() {
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  // Input state
  const [meetings, setMeetings] = useState(5)
  const [backToBack, setBackToBack] = useState(2)
  const [hats, setHats] = useState(3)

  // Phase
  const [phase, setPhase] = useState<'input' | 'dashboard'>('input')

  // Computed dashboard state
  const [scores, setScores] = useState<{ focus: number; strain: number; balance: number } | null>(null)
  const [mood, setMood] = useState<Mood>('autopilot')
  const [quotes, setQuotes] = useState<HeroMessage[]>([])
  const [narrative, setNarrative] = useState('')
  const [schedule, setSchedule] = useState<ScheduleAnalysis | null>(null)
  const [trends, setTrends] = useState<GeneratedTrends | null>(null)
  const [metricInsights, setMetricInsights] = useState<{ focus: MetricInsightCopy; strain: MetricInsightCopy; balance: MetricInsightCopy } | null>(null)
  const [trendView, setTrendView] = useState<'weekly' | 'monthly'>('weekly')

  // Dashboard sub-view
  const [dashView, setDashView] = useState<DashboardView>('overview')
  const [showTrends, setShowTrends] = useState(false)
  const dashTopRef = useRef<HTMLDivElement>(null)

  // Auto-clamp backToBack when meetings change
  useEffect(() => {
    if (backToBack > Math.max(0, meetings - 1)) {
      setBackToBack(Math.max(0, meetings - 1))
    }
  }, [meetings, backToBack])

  const handleReadMyDay = () => {
    const s = estimateScoresFromInputs(meetings, backToBack, hats)
    const sched = estimateScheduleAnalysis(meetings, backToBack, hats)
    const metricsObj = buildWorkHealthMetrics(s.focus, s.strain, s.balance, sched)
    const detectedMood = detectMood(s.focus, s.strain, s.balance)

    const narr = generateNarrative(sched)

    // Subtitle logic matching real app (claudeAI.ts getDefaultInsights)
    let heroSubtitle: string
    if (meetings === 0 || s.focus >= 90) {
      const opts = [
        "Today's yours — do something worth remembering",
        "The kind of day where you actually get to think",
        "Wide open and full of possibility",
        "No one's coming for your calendar today",
        "This is what freedom looks like in corporate America",
      ]
      heroSubtitle = opts[Math.floor(Math.random() * opts.length)]
    } else if (meetings >= 6 || backToBack >= 4) {
      const opts = [
        "Survival mode activated — and that's okay",
        "Today's about getting through, not getting ahead",
        "Your calendar wrote checks your brain can't cash",
        "Breathe when you can, coast when you can't",
        "Some days you ride the wave, today you hold on",
      ]
      heroSubtitle = opts[Math.floor(Math.random() * opts.length)]
    } else if (s.focus < 50) {
      const opts = [
        "Not your best day on paper, but you've handled worse",
        "The kind of day that builds character (unfortunately)",
        "Hang in there — tomorrow's a fresh calendar",
        "You'll earn that evening on the couch tonight",
      ]
      heroSubtitle = opts[Math.floor(Math.random() * opts.length)]
    } else {
      const opts = [
        "A solid day if you play it right",
        "Enough breathing room to actually be creative",
        "Not too heavy, not too light — just right",
        "The kind of day where small wins add up",
        "You've got this — just don't volunteer for anything new",
      ]
      heroSubtitle = opts[Math.floor(Math.random() * opts.length)]
    }

    // Each card gets a different subtitle, matching real app pattern
    const allSubtitleOptions = [
      "Today's yours — do something worth remembering",
      "The kind of day where you actually get to think",
      "A solid day if you play it right",
      "Enough breathing room to actually be creative",
      "Not your best day on paper, but you've handled worse",
      "Survival mode activated — and that's okay",
      "Today's about getting through, not getting ahead",
      "Some days you ride the wave, today you hold on",
      "The kind of day that builds character (unfortunately)",
      "You've got this — just don't volunteer for anything new",
    ]
    const otherSubtitles = allSubtitleOptions
      .filter(s => s !== heroSubtitle)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
    const subtitlesForCards = [heroSubtitle, ...otherSubtitles]

    const generator = new ComicReliefGenerator()
    const movieQuotes = generator.generateMultipleQuotes(metricsObj, 3)
    const heroMessages: HeroMessage[] = movieQuotes.map((q, i) => ({
      quote: q.text,
      source: q.character ? `${q.character} \u00b7 ${q.source}` : q.source,
      subtitle: subtitlesForCards[i] || subtitlesForCards[0],
    }))
    const insights = generateMetricInsights(s.focus, s.strain, s.balance, sched)
    const t = generateTrendsFromScore(s.focus, s.strain, s.balance)

    setScores(s)
    setMood(detectedMood)
    setQuotes(heroMessages)
    setNarrative(narr)
    setSchedule(sched)
    setTrends(t)
    setMetricInsights(insights)
    setTrendView('weekly')
    setDashView('overview')
    setShowTrends(false)
    setPhase('dashboard')
    window.scrollTo({ top: 0 })
  }

  const handleReset = () => {
    setPhase('input')
    setDashView('overview')
    setShowTrends(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateDash = (view: DashboardView) => {
    setDashView(view)
    if (dashTopRef.current) {
      dashTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleMetricClick = (metric: string) => {
    if (metric === 'performance') navigateDash('focus-detail')
    else if (metric === 'resilience') navigateDash('strain-detail')
    else if (metric === 'sustainability') navigateDash('balance-detail')
  }

  const ft = schedule ? formatFocusTime(Math.max(0, (8 - schedule.durationHours) * 60)) : { hours: 0, minutes: 0 }
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@1,400;1,500;1,600&display=swap');

        :root {
          --cream: #FBF7F2;
          --warm-white: #FEFCF9;
          --ink: #1C1917;
          --ink-light: #57534E;
          --ink-faint: #A8A29E;
          --amber: #E87D3A;
          --amber-light: #FDF0E6;
          --amber-pale: #FEF8F2;
          --sage: #5A7A5C;
          --sage-light: #EBF2EB;
          --rose: #C0544A;
          --rose-light: #FAEAE9;
          --border: #E7E0D8;
          --text-secondary: #57534E;
        }

        html { scroll-behavior: smooth; }

        .lp-wrap {
          font-family: 'Inter', sans-serif;
          background: var(--cream);
          color: var(--ink);
          line-height: 1.6;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Mobile-first content column */
        .lp-content-col {
          max-width: none;
          margin: 0 auto;
          padding: 0 20px;
          width: 100%;
        }

        .lp-headline { font-size: 30px; }
        .lp-section-gap { padding-top: 40px; }
        .lp-demo-gap { padding-top: 44px; }
        .lp-stat-card { padding: 16px 18px; }

        /* Tablet (640px+) */
        @media (min-width: 640px) {
          .lp-content-col {
            max-width: 480px;
            padding: 0 24px;
          }
          .lp-headline { font-size: 34px; }
        }

        /* Desktop (1024px+) */
        @media (min-width: 1024px) {
          .lp-content-col {
            max-width: 520px;
            padding: 0 32px;
          }
          .lp-headline { font-size: 38px; }
          .lp-section-gap { padding-top: 52px; }
          .lp-demo-gap { padding-top: 56px; }
          .lp-stat-card { padding: 20px 20px; }
        }

        /* FOOTER */
        .lp-footer {
          background: var(--ink);
          border-top: 1px solid #2C2724;
          padding: 24px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }
        .lp-footer span {
          font-size: 13px;
          color: #6B6560;
        }
        .lp-footer-links {
          display: flex;
          gap: 20px;
        }
        .lp-footer-links a {
          font-size: 13px;
          color: #6B6560;
          text-decoration: none;
        }
        .lp-footer-links a:hover { color: #A8A29E; }

        @media (max-width: 480px) {
          .lp-footer {
            flex-direction: column;
            gap: 12px;
            text-align: center;
            padding: 24px 20px;
          }
        }
      `}</style>

      <div className="lp-wrap">
        {/* LOGO BAR */}
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href="/"
            onClick={() => { setPhase('input'); setDashView('overview'); setShowTrends(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', cursor: 'pointer' }}
          >
            <PersistLogo size={18} />
            <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.3px', color: 'var(--ink-light)' }}>
              PERSIST<span style={{ color: 'rgba(232,125,58,0.7)' }}>WORK</span>
            </span>
          </Link>
          <button
            onClick={() => signIn('google')}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 0',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--ink-faint)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Log in
          </button>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'input' ? (
            <motion.div
              key="input"
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16, transition: { duration: 0.3 } }}
            >
              <InputPhase
                meetings={meetings}
                setMeetings={setMeetings}
                backToBack={backToBack}
                setBackToBack={setBackToBack}
                hats={hats}
                setHats={setHats}
                onSubmit={handleReadMyDay}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {scores && schedule && trends && metricInsights && (
                <div ref={dashTopRef}>
                  <DashboardPhase
                    scores={scores}
                    mood={mood}
                    quotes={quotes}
                    narrative={narrative}
                    schedule={schedule}
                    trends={trends}
                    metricInsights={metricInsights}
                    trendView={trendView}
                    setTrendView={setTrendView}
                    ft={ft}
                    dashView={dashView}
                    showTrends={showTrends}
                    setShowTrends={setShowTrends}
                    onNavigate={navigateDash}
                    onMetricClick={handleMetricClick}
                    onReset={handleReset}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FOOTER */}
        <footer className="lp-footer">
            <span>&copy; 2026 PERSISTWORK</span>
            <div className="lp-footer-links">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </footer>
      </div>
    </>
  )
}

// ========== INPUT PHASE ==========

function InputPhase({
  meetings, setMeetings, backToBack, setBackToBack, hats, setHats, onSubmit,
}: {
  meetings: number; setMeetings: (v: number) => void
  backToBack: number; setBackToBack: (v: number) => void
  hats: number; setHats: (v: number) => void
  onSubmit: () => void
}) {
  return (
    <div className="lp-content-col">
      {/* Headline */}
      <section style={{ textAlign: 'center', padding: '48px 0 0' }}>
        <h1 className="lp-headline" style={{
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.8px',
          color: 'var(--ink)',
          margin: 0,
        }}>
          <span style={{ color: 'var(--amber)' }}>Yeah.</span> It&apos;s
          <br />
          <em style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 800, fontStyle: 'italic' }}>that kind of day.</em>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-faint)', margin: '14px 0 0' }}>
          Tell us about yours.
        </p>
      </section>

      {/* Steppers */}
      <section style={{ paddingTop: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Stepper
            label="Meetings today"
            subtitle="How many are on the calendar"
            value={meetings}
            min={0}
            max={15}
            onChange={setMeetings}
          />
          <Stepper
            label="Back to back"
            subtitle="No break between them"
            value={backToBack}
            min={0}
            max={Math.max(0, meetings - 1)}
            onChange={setBackToBack}
          />
          <Stepper
            label="Different topics"
            subtitle="How scattered is your day"
            value={hats}
            min={1}
            max={6}
            onChange={setHats}
          />
        </div>

        <button
          onClick={onSubmit}
          style={{
            width: '100%',
            marginTop: 28,
            marginBottom: 48,
            padding: '16px 24px',
            borderRadius: 14,
            border: 'none',
            background: 'var(--amber)',
            color: 'white',
            fontSize: 17,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(232,125,58,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(232,125,58,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(232,125,58,0.35)' }}
          onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
          onPointerUp={e => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          How bad is it? &rarr;
        </button>
      </section>

      {/* Ghost card preview */}
      <section style={{ position: 'relative', overflow: 'hidden', maxHeight: 220, marginBottom: 32 }}>
        <div style={{ opacity: 0.55, pointerEvents: 'none' }}>
          <CardContent
            quote="I'm not great at the advice. Can I interest you in a sarcastic comment?"
            source="Chandler Bing · Friends"
            subtitle="Survival mode activated — and that's okay"
            focus={22}
            strain={78}
            balance={19}
            mood="survival"
          />
        </div>
        {/* Fade-out mask */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: 'linear-gradient(to bottom, transparent, var(--cream))',
          pointerEvents: 'none',
        }} />
      </section>
    </div>
  )
}

// ========== STEPPER ==========

function Stepper({ label, subtitle, value, min, max, onChange }: {
  label: string; subtitle: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 140 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 1 }}>
          {subtitle}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={{
            width: 44, height: 44,
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: value <= min ? 'transparent' : 'var(--warm-white)',
            color: value <= min ? 'var(--ink-faint)' : 'var(--ink)',
            fontSize: 20,
            fontWeight: 700,
            cursor: value <= min ? 'default' : 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.12s, transform 0.1s',
          }}
          onPointerDown={e => { if (value > min) e.currentTarget.style.transform = 'scale(0.94)'; if (value > min) e.currentTarget.style.background = 'var(--amber-light)' }}
          onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = value <= min ? 'transparent' : 'var(--warm-white)' }}
          onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = value <= min ? 'transparent' : 'var(--warm-white)' }}
        >
          &minus;
        </button>
        <span style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink)',
          width: 28,
          textAlign: 'center',
          fontFeatureSettings: '"tnum"',
          letterSpacing: '-0.04em',
        }}>
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={{
            width: 44, height: 44,
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: value >= max ? 'transparent' : 'var(--warm-white)',
            color: value >= max ? 'var(--ink-faint)' : 'var(--ink)',
            fontSize: 20,
            fontWeight: 700,
            cursor: value >= max ? 'default' : 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.12s, transform 0.1s',
          }}
          onPointerDown={e => { if (value < max) e.currentTarget.style.transform = 'scale(0.94)'; if (value < max) e.currentTarget.style.background = 'var(--amber-light)' }}
          onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = value >= max ? 'transparent' : 'var(--warm-white)' }}
          onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = value >= max ? 'transparent' : 'var(--warm-white)' }}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ========== DASHBOARD PHASE ==========

function DashboardPhase({
  scores, mood, quotes, narrative, schedule, trends, metricInsights, trendView, setTrendView, ft,
  dashView, showTrends, setShowTrends, onNavigate, onMetricClick, onReset,
}: {
  scores: { focus: number; strain: number; balance: number }
  mood: Mood
  quotes: HeroMessage[]
  narrative: string
  schedule: ScheduleAnalysis
  trends: GeneratedTrends
  metricInsights: { focus: MetricInsightCopy; strain: MetricInsightCopy; balance: MetricInsightCopy }
  trendView: 'weekly' | 'monthly'
  setTrendView: (v: 'weekly' | 'monthly') => void
  ft: { hours: number; minutes: number }
  dashView: DashboardView
  showTrends: boolean
  setShowTrends: (v: boolean) => void
  onNavigate: (view: DashboardView) => void
  onMetricClick: (metric: string) => void
  onReset: () => void
}) {
  const { focus, strain, balance } = scores
  const moodConfig = MOODS[mood]

  return (
    <div className="lp-content-col" style={{ paddingBottom: 40 }}>
      <AnimatePresence mode="wait">
        {dashView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* 1. Card */}
            <div style={{ paddingTop: 16 }}>
              <SwipeableQuoteCards
                quotes={quotes}
                focus={focus}
                strain={strain}
                balance={balance}
                mood={mood}
              />
            </div>

            {/* 2. WhyMood */}
            <WhyMood
              mood={detectMood(focus, strain, balance)}
              narrative={narrative}
              focus={focus}
              strain={strain}
              balance={balance}
              onMetricClick={onMetricClick}
            />

            {/* 3. Trends — entry button or expanded inline */}
            {!showTrends ? (
              <button
                onClick={() => setShowTrends(true)}
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
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--amber-light)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--warm-white)' }}
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
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Trends over time</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>See how your week and month look</p>
                  </div>
                </div>
                <span style={{ fontSize: 16, color: 'var(--ink-faint)', fontWeight: 500 }}>&rsaquo;</span>
              </button>
            ) : (
              <InlineTrendsSection
                trends={trends}
                trendView={trendView}
                setTrendView={setTrendView}
                focus={focus}
                strain={strain}
                balance={balance}
              />
            )}

            {/* 4. CTA */}
            <section style={{ textAlign: 'center', paddingTop: 48 }}>
              <h2 style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: 'var(--ink)',
                margin: '0 0 12px',
              }}>
                Want this every morning?
              </h2>
              <button
                onClick={() => signIn('google')}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'var(--ink)',
                  color: 'var(--cream)',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  marginBottom: 10,
                }}
              >
                Connect your calendar &mdash; it&apos;s free
              </button>

              {/* 6. Tagline */}
              <p style={{
                fontSize: 14,
                color: 'var(--ink-light)',
                lineHeight: 1.6,
                fontStyle: 'italic',
                margin: '0 0 32px',
              }}>
                Not a fix. Just the truth.
              </p>

              {/* 7. Reset */}
              <button
                onClick={onReset}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--amber)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  padding: '8px 16px',
                }}
              >
                &larr; Try different numbers
              </button>
            </section>
          </motion.div>
        )}

        {dashView === 'focus-detail' && (
          <motion.div
            key="focus-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <MetricDetailView
              label="Focus"
              value={focus}
              color="#E87D3A"
              insight={metricInsights.focus}
              bars={[
                { label: 'Meeting Density', status: schedule.meetingCount <= 2 ? 'Light' : schedule.meetingCount <= 4 ? 'Moderate' : 'Heavy', pct: Math.max(25, 100 - schedule.meetingCount * 15), note: `${schedule.meetingCount} meetings competing for your attention` },
                { label: 'Deep Work Blocks', status: ft.hours >= 4 ? 'Plenty' : ft.hours >= 2 ? 'Some' : 'Scarce', pct: Math.min(100, ft.hours * 22), note: `${ft.hours}h ${ft.minutes}m available for uninterrupted work` },
                { label: 'Meeting Timing', status: schedule.afternoonMeetings > schedule.morningMeetings * 1.5 ? 'Afternoon-heavy' : schedule.morningMeetings > 0 && schedule.afternoonMeetings > 0 ? 'Spread out' : 'Well-timed', pct: schedule.afternoonMeetings > schedule.morningMeetings * 1.5 ? 40 : schedule.afternoonMeetings > schedule.morningMeetings ? 70 : 100, note: `${schedule.morningMeetings} morning, ${schedule.afternoonMeetings} afternoon` },
                { label: 'Calendar Commitment', status: schedule.meetingRatio <= 0.3 ? 'Light' : schedule.meetingRatio <= 0.5 ? 'Moderate' : 'Heavy', pct: Math.max(15, 100 - schedule.meetingRatio * 100), note: `${schedule.durationHours}h of your day is in meetings (${Math.round(schedule.meetingRatio * 100)}%)` },
              ]}
              footer="How much capacity you have today for deep, uninterrupted work — based on meeting load, available focus blocks, and schedule flow."
              onBack={() => onNavigate('overview')}
            />
          </motion.div>
        )}

        {dashView === 'strain-detail' && (
          <motion.div
            key="strain-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <MetricDetailView
              label="Strain"
              value={strain}
              color="#C0544A"
              insight={metricInsights.strain}
              bars={[
                { label: 'Context Switching', status: schedule.uniqueContexts <= 3 ? 'Low' : schedule.uniqueContexts <= 5 ? 'Moderate' : 'High', pct: Math.max(20, 100 - schedule.uniqueContexts * 12), note: `${schedule.uniqueContexts} different contexts your brain has to shift between` },
                { label: 'Decision Fatigue Risk', status: schedule.afternoonMeetings <= 1 ? 'Low' : schedule.afternoonMeetings <= 3 ? 'Moderate' : 'High', pct: Math.max(20, 100 - schedule.afternoonMeetings * 20), note: `${schedule.afternoonMeetings} afternoon meetings when willpower is lower` },
                { label: 'Longest Meeting Chain', status: schedule.longestStretch <= 1 ? 'None' : schedule.longestStretch <= 2 ? 'Short' : 'Long', pct: Math.max(20, 100 - schedule.longestStretch * 25), note: schedule.longestStretch <= 1 ? 'No back-to-back chains' : `${schedule.longestStretch} meetings in a row without a real break` },
                { label: 'Cognitive Reserve', status: ft.hours >= 4 ? 'Strong' : ft.hours >= 2 ? 'Moderate' : 'Low', pct: Math.min(100, ft.hours * 22), note: `${ft.hours}h ${ft.minutes}m of quiet time to recharge between demands` },
              ]}
              footer="How much cognitive load your schedule is putting on you today — context switches, back-to-back meetings, and decision fatigue."
              onBack={() => onNavigate('overview')}
            />
          </motion.div>
        )}

        {dashView === 'balance-detail' && (
          <motion.div
            key="balance-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <MetricDetailView
              label="Balance"
              value={balance}
              color="#5A7A5C"
              insight={metricInsights.balance}
              bars={[
                { label: 'Day Balance', status: Math.abs(schedule.morningMeetings - schedule.afternoonMeetings) <= 1 ? 'Balanced' : schedule.afternoonMeetings > schedule.morningMeetings ? 'Afternoon-loaded' : 'Morning-loaded', pct: Math.max(30, 100 - Math.abs(schedule.morningMeetings - schedule.afternoonMeetings) * 20), note: `${schedule.morningMeetings} morning vs ${schedule.afternoonMeetings} afternoon meetings` },
                { label: 'Recovery Breaks', status: schedule.adequateBreaks >= 3 ? 'Plenty' : schedule.adequateBreaks >= 1 ? 'Some' : 'None', pct: Math.min(100, schedule.adequateBreaks * 25 + schedule.shortBreaks * 12), note: `${schedule.adequateBreaks} real breaks (30+ min) and ${schedule.shortBreaks} short pauses` },
                { label: 'Work Intensity', status: schedule.durationHours <= 3 ? 'Sustainable' : schedule.durationHours <= 5 ? 'Moderate' : 'Unsustainable', pct: Math.max(15, 100 - schedule.durationHours * 15), note: `${schedule.durationHours}h locked into meetings today` },
                { label: 'Boundary Health', status: schedule.earlyLateMeetings === 0 ? 'Clean' : schedule.earlyLateMeetings <= 1 ? 'Minor' : 'Overextended', pct: Math.max(20, 100 - schedule.earlyLateMeetings * 30), note: schedule.earlyLateMeetings === 0 ? 'All meetings within core hours' : `${schedule.earlyLateMeetings} meeting${schedule.earlyLateMeetings > 1 ? 's' : ''} before 7am or after 5pm` },
              ]}
              footer="Can you keep this pace up? Measures whether your schedule has enough recovery time and healthy boundaries to avoid burnout."
              onBack={() => onNavigate('overview')}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

// ========== METRIC DETAIL VIEW ==========

interface BarData {
  label: string
  status: string
  pct: number
  note: string
}

function MetricDetailView({ label, value, color, insight, bars, footer, onBack }: {
  label: string
  value: number
  color: string
  insight: MetricInsightCopy
  bars: BarData[]
  footer: string
  onBack: () => void
}) {
  return (
    <div style={{ paddingTop: 16, paddingBottom: 24 }}>
      <BackButton onClick={onBack} />

      {/* Ring chart — matches sandbox w-32 h-32 */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <div style={{ position: 'relative', width: 128, height: 128, margin: '0 auto 32px' }}>
          <svg width="100%" height="100%" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke={`${color}33`} strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8"
              strokeDasharray="339.29"
              strokeDashoffset={339.29 - (value / 100) * 339.29}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 300, color, fontFeatureSettings: '"tnum"', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>
                {value}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', fontWeight: 600 }}>
                {label}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insight card */}
      <div style={{
        background: 'var(--warm-white)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 18px',
        textAlign: 'center',
        marginBottom: 24,
      }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: '0 0 10px' }}>
          {insight.title}
        </h4>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px' }}>
          {insight.message}
        </p>
        <p style={{ fontSize: 13, color, opacity: 0.85, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
          {insight.footer}
        </p>
      </div>

      {/* Component bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {bars.map((bar) => (
          <div key={bar.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{bar.label}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 500 }}>{bar.status}</span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#E7E0D8', borderRadius: 3 }}>
              <div style={{ height: 6, borderRadius: 3, width: `${bar.pct}%`, background: color, transition: 'width 0.7s ease' }} />
            </div>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)', lineHeight: 1.4 }}>{bar.note}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', lineHeight: 1.5 }}>
        {footer}
      </p>

      <BackButton onClick={onBack} style={{ marginTop: 16 }} />
    </div>
  )
}

// ========== INLINE TRENDS SECTION ==========

function InlineTrendsSection({ trends, trendView, setTrendView, focus, strain, balance }: {
  trends: GeneratedTrends
  trendView: 'weekly' | 'monthly'
  setTrendView: (v: 'weekly' | 'monthly') => void
  focus: number
  strain: number
  balance: number
}) {
  const items = trendView === 'weekly'
    ? trends.weekly.days.map(d => ({ label: d.date, focus: d.focus, strain: d.strain, balance: d.balance, isToday: d.isToday }))
    : trends.monthly.weeks.map(w => ({ label: w.label, focus: w.focus, strain: w.strain, balance: w.balance, isToday: false }))

  const allInsights = trendView === 'weekly' ? trends.weekly.insights : trends.monthly.insights
  const [insightsOpen, setInsightsOpen] = useState(false)

  const metricsConfig = [
    { key: 'focus' as const, label: 'Focus', color: '#E87D3A', getValue: (d: typeof items[0]) => d.focus, current: focus },
    { key: 'strain' as const, label: 'Strain', color: '#C0544A', getValue: (d: typeof items[0]) => d.strain, current: strain },
    { key: 'balance' as const, label: 'Balance', color: '#5A7A5C', getValue: (d: typeof items[0]) => d.balance, current: balance },
  ]

  const W = 280, H = 48, PAD_X = 12, PAD_Y = 6

  const buildPath = (values: number[]) => {
    if (values.length < 2) return { line: '', area: '', pts: [] as { x: number; y: number }[] }
    const minV = Math.min(...values)
    const maxV = Math.max(...values)
    const range = maxV - minV || 1
    const xStep = (W - PAD_X * 2) / (values.length - 1)

    const pts = values.map((v, i) => ({
      x: PAD_X + i * xStep,
      y: PAD_Y + (1 - (v - minV) / range) * (H - PAD_Y * 2),
    }))

    let line = `M${pts[0].x},${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const cp = xStep * 0.35
      line += ` C${pts[i].x + cp},${pts[i].y} ${pts[i + 1].x - cp},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`
    }

    const area = `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`
    return { line, area, pts }
  }

  return (
    <section style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', margin: 0 }}>
          Your Trends
        </h2>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: 'rgba(232,125,58,0.08)', color: '#D06B2E' }}>
          Preview
        </span>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 20 }}>
        {(['weekly', 'monthly'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setTrendView(view)}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {metricsConfig.map(({ key, label, color, getValue, current }) => {
          const values = items.map(getValue)
          const { line, area, pts } = buildPath(values)
          const todayIdx = items.findIndex(d => d.isToday)

          const half = Math.floor(values.length / 2)
          const firstHalf = values.slice(0, half).reduce((a, b) => a + b, 0) / half
          const secondHalf = values.slice(half).reduce((a, b) => a + b, 0) / (values.length - half)
          const diff = secondHalf - firstHalf
          const isUp = diff > 3
          const isDown = diff < -3

          const arrowColor = key === 'strain'
            ? (isUp ? '#C0544A' : isDown ? '#5A7A5C' : 'var(--ink-faint)')
            : (isUp ? '#5A7A5C' : isDown ? '#C0544A' : 'var(--ink-faint)')

          const topInsight = allInsights.find(ins => ins.metric === key)

          return (
            <div key={key} style={{
              padding: '14px 16px 12px',
              borderRadius: 12,
              backgroundColor: 'var(--warm-white)',
              border: '1px solid var(--border)',
            }}>
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

              <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
                {area && <path d={area} fill={color} opacity={0.08} />}
                {line && <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
                {pts && todayIdx >= 0 && todayIdx < pts.length && (
                  <>
                    <circle cx={pts[todayIdx].x} cy={pts[todayIdx].y} r={5} fill={color} opacity={0.15} />
                    <circle cx={pts[todayIdx].x} cy={pts[todayIdx].y} r={3} fill={color} />
                  </>
                )}
              </svg>

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

              {topInsight && (
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, marginBottom: 0, lineHeight: 1.4 }}>
                  {topInsight.title}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Best / Worst */}
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

      {/* Expandable insights */}
      {allInsights.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setInsightsOpen(!insightsOpen)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink-faint)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 10, display: 'inline-block', transition: 'transform 0.15s', transform: insightsOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#9654;</span>
            All insights ({allInsights.length})
          </button>
          {insightsOpen && (
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
          )}
        </div>
      )}

      {/* Trend voice */}
      <p style={{ fontSize: 12, color: 'var(--ink-faint)', textAlign: 'center', fontStyle: 'italic', margin: '20px 0 0' }}>
        That &ldquo;tired for no reason&rdquo; feeling? This is why.
      </p>
    </section>
  )
}

// ========== BACK BUTTON ==========

function BackButton({ onClick, style }: { onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: 'var(--amber)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: '6px 0',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        ...style,
      }}
    >
      &larr; Back to Overview
    </button>
  )
}
