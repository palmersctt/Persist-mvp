'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/*
  MOODS — exact from lib/mood.ts
*/
const MOODS: Record<string, { name: string; gradient: [string, string] }> = {
  survival:    { name: 'Survival Mode', gradient: ['#1C1917', '#57534E'] },
  grinding:    { name: 'Grinding',      gradient: ['#57534E', '#1C1917'] },
  scattered:   { name: 'Scattered',     gradient: ['#A8A29E', '#57534E'] },
  autopilot:   { name: 'Autopilot',     gradient: ['#57534E', '#1C1917'] },
  coasting:    { name: 'Coasting',      gradient: ['#E7E0D8', '#A8A29E'] },
  'locked-in': { name: 'Locked In',     gradient: ['#E87D3A', '#57534E'] },
  flow:        { name: 'Flow State',    gradient: ['#FDF0E6', '#FBF7F2'] },
  victory:     { name: 'Victory Lap',   gradient: ['#E87D3A', '#1C1917'] },
}

/*
  EVENT CATEGORIES
*/
const CAT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  heavy:   { bg: 'rgba(232,93,74,0.18)',  border: '#e85d4a', text: '#fca5a5' },
  collab:  { bg: 'rgba(139,92,246,0.16)', border: '#8b5cf6', text: '#c4b5fd' },
  light:   { bg: 'rgba(59,130,246,0.16)', border: '#3b82f6', text: '#93c5fd' },
  focus:   { bg: 'rgba(16,185,129,0.14)', border: '#10b981', text: '#6ee7b7' },
  benefit: { bg: 'rgba(236,72,153,0.14)', border: '#ec4899', text: '#f9a8d4' },
}

interface CalEvent {
  t: string
  d: number
  title: string
  cat: string
}

interface Insight {
  metric: string
  text: string
}

interface Scenario {
  key: string
  label: string
  mood: string
  events: CalEvent[]
  insights: Insight[]
  scores: { focus: number; strain: number; balance: number }
  quote: string
  source: string
  subtitle: string
}

const scenarios: Scenario[] = [
  {
    key: 'grind',
    label: 'The Grind',
    mood: 'scattered',
    events: [
      { t: '9:00',  d: 60,  title: 'Sprint Planning',    cat: 'collab' },
      { t: '10:00', d: 60,  title: 'Design Review',       cat: 'heavy' },
      { t: '11:00', d: 30,  title: 'Standup',             cat: 'light' },
      { t: '11:30', d: 60,  title: 'Client Sync',         cat: 'heavy' },
      { t: '13:00', d: 60,  title: 'Product Roadmap',     cat: 'collab' },
      { t: '14:00', d: 30,  title: '1:1 with Manager',    cat: 'light' },
      { t: '14:30', d: 90,  title: 'Quarterly Review',    cat: 'heavy' },
      { t: '16:00', d: 60,  title: 'All-Hands',           cat: 'heavy' },
    ],
    insights: [
      { metric: 'focus',   text: 'No uninterrupted blocks to do actual work' },
      { metric: 'focus',   text: '4 heavy-drain meetings — reviews, presentations, clients' },
      { metric: 'strain',  text: '8 different contexts to switch between all day' },
      { metric: 'strain',  text: 'Afternoon chain of 4 meetings with no reset' },
      { metric: 'balance', text: 'One 30-minute break in an 8-hour day' },
    ],
    scores: { focus: 14, strain: 88, balance: 40 },
    quote: "I've made a huge mistake.",
    source: 'Arrested Development — Gob Bluth',
    subtitle: "Your schedule didn't leave time for a single thought.",
  },
  {
    key: 'zone',
    label: 'In the Zone',
    mood: 'flow',
    events: [
      { t: '9:00',  d: 30,  title: 'Standup',             cat: 'light' },
      { t: '9:30',  d: 150, title: 'Deep Work',           cat: 'focus' },
      { t: '12:00', d: 60,  title: 'Lunch + Walk',        cat: 'benefit' },
      { t: '13:00', d: 30,  title: '1:1 with Manager',    cat: 'light' },
      { t: '13:30', d: 150, title: 'Deep Work',           cat: 'focus' },
      { t: '16:00', d: 30,  title: 'Wrap-up Sync',        cat: 'light' },
    ],
    insights: [
      { metric: 'focus',   text: '5 hours of unbroken deep work' },
      { metric: 'focus',   text: 'Only light check-ins — low cognitive demand' },
      { metric: 'strain',  text: 'No back-to-back meetings, room to reset between each' },
      { metric: 'balance', text: 'Lunch walk actively restoring energy mid-day' },
      { metric: 'balance', text: 'Meetings spread across morning and afternoon' },
    ],
    scores: { focus: 90, strain: 15, balance: 74 },
    quote: "I'm kind of a big deal.",
    source: 'Anchorman — Ron Burgundy',
    subtitle: '5 hours of focus, 3 light meetings. This is a good day.',
  },
]

/* ── Helpers ── */
function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return (h - 9) * 60 + m
}
const DAY_MIN = 8 * 60 // 9am–5pm

function EventBlock({ ev, i, visible }: { ev: CalEvent; i: number; visible: boolean }) {
  const top = (timeToMin(ev.t) / DAY_MIN) * 100
  const height = (ev.d / DAY_MIN) * 100
  const c = CAT_COLORS[ev.cat] || CAT_COLORS.collab
  return (
    <div style={{
      position: 'absolute', top: `${top}%`, height: `${Math.max(height, 3.5)}%`,
      left: 4, right: 4, background: c.bg, borderLeft: `3px solid ${c.border}`,
      borderRadius: 6, padding: '3px 8px', display: 'flex', alignItems: 'center',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(-12px)',
      transition: `opacity 0.3s ease ${i * 0.06}s, transform 0.3s ease ${i * 0.06}s`,
      overflow: 'hidden',
    }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {ev.title}
      </span>
    </div>
  )
}

function AnimNum({ target, dur = 800, delay = 0, go }: { target: number; dur?: number; delay?: number; go: boolean }) {
  const [v, setV] = useState(0)
  const raf = useRef<number | null>(null)
  useEffect(() => {
    if (!go) { setV(0); return }
    let s: number | null = null
    const t0 = performance.now() + delay
    const tick = (now: number) => {
      if (now < t0) { raf.current = requestAnimationFrame(tick); return }
      if (!s) s = now
      const p = Math.min((now - s) / dur, 1)
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, dur, delay, go])
  return <span>{v}</span>
}

function InsightRow({ text, visible, delay }: { text: string; visible: boolean; delay: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: `all 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', marginTop: 7, flexShrink: 0 }} />
      <span style={{ fontSize: 12, lineHeight: '18px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
        {text}
      </span>
    </div>
  )
}

function ScorePill({ label, value, active, delay }: { label: string; value: number; active: boolean; delay: number }) {
  return (
    <div style={{
      textAlign: 'center',
      opacity: active ? 1 : 0.15,
      transform: active ? 'scale(1)' : 'scale(0.9)',
      transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
        <AnimNum target={value} dur={1000} delay={delay * 1000} go={active} />
      </div>
      <div style={{
        fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em',
        fontWeight: 700, marginTop: 5, color: 'rgba(255,255,255,0.5)',
      }}>
        {label}
      </div>
    </div>
  )
}

/* ══════════ Main ══════════ */
export default function CauseEffectDemo({ onGetStarted }: { onGetStarted?: () => void }) {
  const [si, setSi] = useState(0)
  const [phase, setPhase] = useState(0)   // 0=calendar, 1=insights, 2=card
  const [insightN, setInsightN] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const s = scenarios[si]
  const m = MOODS[s.mood]

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  const run = useCallback(() => {
    clear(); setPhase(0); setInsightN(0)
    timers.current.push(setTimeout(() => {
      setPhase(1)
      s.insights.forEach((_, i) => {
        timers.current.push(setTimeout(() => setInsightN(i + 1), i * 550))
      })
      timers.current.push(setTimeout(() => setPhase(2), s.insights.length * 550 + 500))
    }, 1400))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s])

  useEffect(() => { run(); return clear }, [si, run])

  useEffect(() => {
    if (!autoplay) return
    const id = setInterval(() => setSi(p => (p + 1) % scenarios.length), 12000)
    return () => clearInterval(id)
  }, [autoplay])

  const pick = (i: number) => { setAutoplay(false); setSi(i) }

  const calUp = phase >= 0, insUp = phase >= 1, cardUp = phase >= 2
  const hours = ['9am','10','11','12pm','1','2','3','4','5pm']

  return (
    <div style={{ maxWidth: 380, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
        {scenarios.map((sc, i) => (
          <button key={sc.key} onClick={() => pick(i)} style={{
            padding: '6px 16px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.25s ease',
            background: i === si
              ? `linear-gradient(135deg, ${MOODS[sc.mood].gradient[0]}, ${MOODS[sc.mood].gradient[1]})`
              : 'rgba(0,0,0,0.06)',
            color: i === si ? '#fff' : 'rgba(0,0,0,0.4)',
          }}>{sc.label}</button>
        ))}
      </div>

      {/* Container */}
      <div style={{
        background: 'linear-gradient(155deg, #111827, #0a0f1a)',
        borderRadius: 20, padding: 20, minHeight: 480,
        position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>

        {/* ── Calendar + insights ── */}
        <div style={{
          opacity: cardUp ? 0 : 1,
          transform: cardUp ? 'translateY(-16px) scale(0.96)' : 'translateY(0)',
          transition: 'all 0.5s ease',
          position: cardUp ? 'absolute' : 'relative',
          inset: cardUp ? 20 : undefined,
          zIndex: cardUp ? 0 : 1,
          pointerEvents: cardUp ? 'none' : 'auto',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>
              Today&apos;s Calendar
            </span>
          </div>

          <div style={{ position: 'relative', height: 210, marginBottom: 14 }}>
            {hours.map((h, i) => (
              <div key={h} style={{
                position: 'absolute', top: `${(i / (hours.length - 1)) * 100}%`,
                left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', width: 26, textAlign: 'right', flexShrink: 0 }}>{h}</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
              </div>
            ))}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 34, right: 0 }}>
              {s.events.map((ev, i) => (
                <EventBlock key={`${s.key}-${i}`} ev={ev} i={i} visible={calUp} />
              ))}
            </div>
          </div>

          {/* Insights */}
          <div style={{
            background: 'rgba(255,255,255,0.025)', borderRadius: 14, padding: '10px 14px',
            minHeight: 110,
            borderTop: insUp ? `2px solid ${m.gradient[0]}33` : '2px solid transparent',
            transition: 'border-color 0.4s ease',
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.25)', marginBottom: 4,
              opacity: insUp ? 1 : 0, transition: 'opacity 0.3s ease',
            }}>
              What Persist sees
            </div>
            {s.insights.map((ins, i) => (
              <InsightRow key={`${s.key}-ins-${i}`} text={ins.text} visible={i < insightN} delay={0} />
            ))}
          </div>
        </div>

        {/* ── Card ── */}
        <div style={{
          opacity: cardUp ? 1 : 0,
          transform: cardUp ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
          position: cardUp ? 'relative' : 'absolute',
          inset: cardUp ? undefined : 20,
          zIndex: cardUp ? 1 : 0,
          pointerEvents: cardUp ? 'auto' : 'none',
        }}>
          <div style={{
            background: `linear-gradient(to bottom, ${m.gradient[0]}, ${m.gradient[1]})`,
            borderRadius: 16, padding: '28px 20px 16px',
          }}>
            <p style={{ fontSize: 9, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>
              {m.name}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: '12px 16px 14px', marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 36 }}>
                <ScorePill label="Focus"   value={s.scores.focus}   active={cardUp} delay={0.05} />
                <ScorePill label="Strain"  value={s.scores.strain}  active={cardUp} delay={0.15} />
                <ScorePill label="Balance" value={s.scores.balance} active={cardUp} delay={0.25} />
              </div>
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.3, marginBottom: 8 }}>
              &ldquo;{s.quote}&rdquo;
            </p>
            <p style={{ fontSize: 11, textAlign: 'center', fontStyle: 'italic', color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>
              &mdash; {s.source}
            </p>
            <p style={{ fontSize: 13, textAlign: 'center', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
              {s.subtitle}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 0, height: 0, borderLeft: '4px solid rgba(255,255,255,0.25)', borderTop: '2.5px solid transparent', borderBottom: '2.5px solid transparent', marginLeft: 1 }} />
              </div>
              <span style={{ fontSize: 8, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>PERSISTWORK.COM</span>
            </div>
          </div>

          {/* Trace-back: insights → metrics */}
          <div style={{ marginTop: 14, padding: '0 4px' }}>
            {s.insights.map((ins, i) => {
              const label = ins.metric === 'focus' ? 'FOCUS' : ins.metric === 'strain' ? 'STRAIN' : 'BALANCE'
              const labelColor = ins.metric === 'focus' ? 'rgba(96,165,250,0.8)' : ins.metric === 'strain' ? 'rgba(251,191,36,0.8)' : 'rgba(52,211,153,0.8)'
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0',
                  opacity: cardUp ? 1 : 0,
                  transition: `opacity 0.4s ease ${0.35 + i * 0.1}s`,
                }}>
                  <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor, minWidth: 44 }}>
                    {label}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                    {ins.text}
                  </span>
                </div>
              )
            })}
          </div>

          <button onClick={() => { setAutoplay(false); run() }} style={{
            display: 'block', margin: '10px auto 0', padding: '4px 12px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 500,
          }}>&#8635; Replay</button>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          onClick={onGetStarted}
          style={{
            padding: '14px 32px', border: '2px solid #111827', borderRadius: 10,
            background: 'transparent', color: '#111827', fontSize: 16, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#111827' }}
        >
          See What Your Day Gets
        </button>
      </div>
    </div>
  )
}
