'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useCognitivePositioning } from '../hooks/useCognitivePositioning'
import { signIn, signOut, useSession } from 'next-auth/react'
import type { ZoneKey, WeeklyBreakdown, WeekSnapshot, CognitiveSignals, ClassifiedEventSummary } from '../lib/cognitive-signals'
import type { RiskLevel } from '../lib/cognitive-classification'

// --- Zone config (matches design reference) ---
const ZONE_CONFIG: Record<ZoneKey, {
  label: string; color: string; bg: string
  tagBg: string; tagBorder: string; desc: string; icon: string
}> = {
  displacement: {
    label: 'Displacement',
    color: '#C0544A',
    bg: 'rgba(192, 84, 74, 0.04)',
    tagBg: 'rgba(192, 84, 74, 0.08)',
    tagBorder: 'rgba(192, 84, 74, 0.2)',
    desc: 'High automation exposure · Low leverage · Declining trajectory',
    icon: '↓',
  },
  friction: {
    label: 'Friction',
    color: '#E87D3A',
    bg: 'rgba(232, 125, 58, 0.04)',
    tagBg: 'rgba(232, 125, 58, 0.08)',
    tagBorder: 'rgba(232, 125, 58, 0.2)',
    desc: 'Split between high-value and automatable · Stuck momentum',
    icon: '—',
  },
  agency: {
    label: 'Agency',
    color: '#5A7A5C',
    bg: 'rgba(90, 122, 92, 0.04)',
    tagBg: 'rgba(90, 122, 92, 0.08)',
    tagBorder: 'rgba(90, 122, 92, 0.2)',
    desc: 'Human-essential work dominates · Positive trajectory',
    icon: '↑',
  },
}

const RISK_COLORS: Record<RiskLevel, { bar: string; bg: string; label: string }> = {
  total: { bar: '#7A2820', bg: 'rgba(192,84,74,0.08)', label: '#C0544A' },
  'very-high': { bar: '#C0544A', bg: 'rgba(192,84,74,0.06)', label: '#C0544A' },
  high: { bar: '#E87D3A', bg: 'rgba(232,125,58,0.06)', label: '#E87D3A' },
  medium: { bar: '#A8A29E', bg: 'rgba(168,162,158,0.08)', label: '#78716C' },
  low: { bar: '#5A7A5C', bg: 'rgba(90,122,92,0.06)', label: '#5A7A5C' },
  'very-low': { bar: '#3D6B40', bg: 'rgba(61,107,64,0.06)', label: '#3D6B40' },
}

const RISK_LABELS: Record<RiskLevel, string> = {
  total: 'Fully automatable',
  'very-high': 'Very high risk',
  high: 'High risk',
  medium: 'Shifting',
  low: 'Human-essential',
  'very-low': 'Irreplaceable',
}

// --- Sub-components matching design reference ---

function SignalBlock({ label, value, color, subtitle, isNeg, building }: {
  label: string; value: number; color: string; subtitle: string; isNeg?: boolean; building?: string
}) {
  if (building) {
    return (
      <div style={{ flex: 1, padding: '20px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#78716C', marginBottom: 10 }}>
          {label}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#A8A29E', lineHeight: 1.3, marginBottom: 8 }}>
          Building
        </div>
        <div style={{ height: 3, borderRadius: 2, background: '#E7E0D8', overflow: 'hidden', marginBottom: 8 }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: 'repeating-linear-gradient(90deg, #E7E0D8 0px, #E7E0D8 8px, transparent 8px, transparent 16px)',
            width: '100%',
          }} />
        </div>
        <div style={{ fontSize: 12, color: '#A8A29E', lineHeight: 1.3 }}>{building}</div>
      </div>
    )
  }

  const displayVal = isNeg ? (value > 0 ? `+${value}` : `${value}`) : value
  const pct = isNeg ? Math.abs(value) / 50 * 100 : value
  return (
    <div style={{ flex: 1, padding: '20px 0' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#78716C', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>
        {displayVal}
      </div>
      <div style={{ height: 3, borderRadius: 2, background: '#E7E0D8', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          height: '100%', borderRadius: 2, background: color,
          width: `${Math.min(pct, 100)}%`,
          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      </div>
      <div style={{ fontSize: 12, color: '#A8A29E', lineHeight: 1.3 }}>{subtitle}</div>
    </div>
  )
}

function TrendSpark({ data, color, height = 56 }: {
  data: WeekSnapshot[]; color: string; height?: number
}) {
  const values = data.map(d => d.leverage)
  const min = Math.min(...values) - 5
  const max = Math.max(...values) + 5
  const range = max - min || 1
  return (
    <svg viewBox={`0 0 200 ${height + 16}`} style={{ width: '100%', height: height + 16, display: 'block' }} preserveAspectRatio="none">
      {[0, 1, 2].map(i => (
        <line key={i} x1="0" y1={i * (height / 2)} x2="200" y2={i * (height / 2)} stroke="#E7E0D8" strokeWidth="0.5" />
      ))}
      <path
        d={`M0,${height - ((values[0] - min) / range) * height} ${values.map((v, i) => `L${(i / (values.length - 1)) * 200},${height - ((v - min) / range) * height}`).join(' ')} L200,${height} L0,${height} Z`}
        fill={`${color}11`}
      />
      <polyline
        points={values.map((v, i) => `${(i / (values.length - 1)) * 200},${height - ((v - min) / range) * height}`).join(' ')}
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const x = (i / (values.length - 1)) * 200
        const y = height - ((v - min) / range) * height
        return (
          <g key={i}>
            {i === values.length - 1 && <circle cx={x} cy={y} r="8" fill={`${color}18`} />}
            <circle cx={x} cy={y} r={i === values.length - 1 ? 4 : 2.5} fill={i === values.length - 1 ? color : '#FEFCF9'} stroke={color} strokeWidth="1.5" />
          </g>
        )
      })}
      {data.map((d, i) => (
        <text key={i} x={(i / (data.length - 1)) * 200} y={height + 14} textAnchor="middle" fontSize="9" fill="#A8A29E" fontFamily="inherit">
          W{i + 1}
        </text>
      ))}
    </svg>
  )
}

function BreakdownBar({ item, maxHours, events, isOpen, onToggle, highlight }: {
  item: WeeklyBreakdown; maxHours: number; events: ClassifiedEventSummary[]; isOpen: boolean; onToggle: () => void; highlight?: 'human' | 'risk' | null
}) {
  const rc = RISK_COLORS[item.risk]
  const pct = maxHours > 0 ? (item.hours / maxHours) * 100 : 0
  const categoryEvents = events.filter(e => e.category === item.category)

  const highlightBg = highlight === 'human' ? 'rgba(90,122,92,0.10)' :
                      highlight === 'risk' ? 'rgba(192,84,74,0.10)' : 'transparent'

  return (
    <div style={{
      background: highlightBg,
      borderRadius: 8, marginBottom: 2,
      transition: 'background 0.3s ease',
    }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 4px', cursor: 'pointer' }}
      >
        <div style={{ width: 140, fontSize: 13, fontWeight: 600, color: '#57534E', flexShrink: 0 }}>{item.category}</div>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ height: 22, borderRadius: 5, background: rc.bg, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 5, background: rc.bar, opacity: 0.7,
              width: `${pct}%`,
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
          </div>
        </div>
        <div style={{ width: 42, fontSize: 13, fontWeight: 700, color: '#57534E', textAlign: 'right' as const, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{item.hours}h</div>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
          color: rc.label, background: rc.bg, padding: '4px 10px', borderRadius: 5,
          width: 110, textAlign: 'center' as const, flexShrink: 0,
        }}>
          {RISK_LABELS[item.risk]}
        </div>
      </div>
      {isOpen && categoryEvents.length > 0 && (
        <div style={{ padding: '4px 8px 10px 20px' }}>
          {categoryEvents.map((evt, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '5px 0',
              borderTop: i > 0 ? '1px solid rgba(231,224,216,0.5)' : 'none',
            }}>
              <span style={{ fontSize: 12, color: '#57534E' }}>{evt.title}</span>
              <span style={{ fontSize: 11, color: '#A8A29E', fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: 12 }}>
                {evt.durationHours >= 1 ? `${evt.durationHours}h` : `${Math.round(evt.durationHours * 60)}m`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Skeleton() {
  const shimmer = {
    background: 'linear-gradient(90deg, #E7E0D8 25%, #F0EBE5 50%, #E7E0D8 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: 8,
  }
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 60px' }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div style={{ ...shimmer, width: 120, height: 14, marginBottom: 12 }} />
      <div style={{ ...shimmer, width: 200, height: 28, marginBottom: 32 }} />
      <div style={{ ...shimmer, height: 100, marginBottom: 24 }} />
      <div style={{ ...shimmer, height: 140, marginBottom: 24 }} />
      <div style={{ ...shimmer, height: 240 }} />
    </div>
  )
}

// --- Main component ---

const HUMAN_RISKS: RiskLevel[] = ['low', 'very-low']
const AT_RISK_RISKS: RiskLevel[] = ['total', 'very-high', 'high']

export default function CognitivePositioning() {
  const { data: session } = useSession()
  const { data, isLoading, error, refresh, status } = useCognitivePositioning()
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<'human' | 'risk' | null>(null)
  const classificationRef = useRef<HTMLDivElement>(null)

  const scrollAndHighlight = useCallback((type: 'human' | 'risk') => {
    classificationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setHighlight(type)
    setTimeout(() => setHighlight(null), 2000)
  }, [])

  if (status === 'unauthenticated') {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' as const }}>
          <p style={{ fontSize: 16, color: '#57534E', marginBottom: 16 }}>Sign in to see your AI Pulse.</p>
          <button
            onClick={() => signIn('google', { callbackUrl: '/positioning' })}
            style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#E87D3A', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F2', fontFamily: "'DM Sans', -apple-system, system-ui, sans-serif", color: '#1C1917' }}>
        <Skeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', -apple-system, system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center' as const, maxWidth: 400 }}>
          <p style={{ fontSize: 16, color: '#57534E', marginBottom: 8 }}>Something went wrong</p>
          <p style={{ fontSize: 13, color: '#A8A29E', marginBottom: 16 }}>{error}</p>
          <button
            onClick={refresh}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #E7E0D8', background: '#FEFCF9', color: '#1C1917', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data || data.totalHours === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', -apple-system, system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center' as const, maxWidth: 420, padding: '0 24px' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1C1917', marginBottom: 8 }}>No calendar events yet</p>
          <p style={{ fontSize: 14, color: '#57534E', lineHeight: 1.5 }}>
            AI Pulse analyzes your calendar to show where your time goes. Once you have events on your calendar, come back here.
          </p>
        </div>
      </div>
    )
  }

  const zone = ZONE_CONFIG[data.zone]
  const maxHours = Math.max(...data.breakdown.map(b => b.hours))
  const { signals } = data
  const weeksToGo = Math.max(0, 4 - signals.weeksOfData)
  const hasTrend = data.weekData.length >= 2

  return (
    <div style={{
      minHeight: '100vh', background: '#FBF7F2',
      fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, system-ui, sans-serif",
      color: '#1C1917',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 60px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <svg width={18} height={18} viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="48" fill="rgba(28,25,23,0.06)" />
                <path d="M38 30 L62 50 L38 70" stroke="#E87D3A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#1C1917' }}>
                PERSIST<span style={{ color: '#E87D3A' }}>WORK</span>
              </span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={refresh}
                style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#A8A29E', fontSize: 14 }}
                title="Refresh"
              >
                ↻
              </button>
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  width={24} height={24}
                  style={{ borderRadius: '50%', cursor: 'pointer' }}
                  onClick={() => signOut({ callbackUrl: '/' })}
                  title="Sign out"
                />
              ) : (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, fontWeight: 500, color: '#A8A29E', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
            AI Pulse
          </h1>
        </div>

        {/* Zone Banner */}
        <div style={{
          background: zone.bg,
          border: `1px solid ${zone.tagBorder}`,
          borderRadius: 14, padding: '20px 24px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap' as const, gap: 16,
        }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: zone.color, boxShadow: `0 0 10px ${zone.color}33` }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: zone.color, letterSpacing: '-0.01em' }}>
                {zone.label}
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#57534E', margin: 0, lineHeight: 1.5, maxWidth: 500 }}>
              {data.insight}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
            <div style={{ textAlign: 'center' as const, cursor: 'pointer' }} onClick={() => scrollAndHighlight('human')}>
              <div style={{ fontSize: 11, color: '#A8A29E', marginBottom: 2 }}>Human</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#5A7A5C' }}>{data.humanHours}h</div>
            </div>
            <div style={{ width: 1, background: '#E7E0D8' }} />
            <div style={{ textAlign: 'center' as const, cursor: 'pointer' }} onClick={() => scrollAndHighlight('risk')}>
              <div style={{ fontSize: 11, color: '#A8A29E', marginBottom: 2 }}>At risk</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#C0544A' }}>{data.autoHours}h</div>
            </div>
          </div>
        </div>

        {/* Three Signals */}
        <div style={{
          background: '#FEFCF9', border: '1px solid #E7E0D8',
          borderRadius: 14, padding: '4px 28px', marginBottom: 24,
          display: 'flex', gap: 0,
        }}>
          <SignalBlock label="Leverage" value={signals.leverage} color="#E87D3A" subtitle="% time on human-essential work" />
          <div style={{ width: 1, background: '#E7E0D8', margin: '16px 24px' }} />
          <SignalBlock label="Exposure" value={signals.exposure} color="#C0544A" subtitle="% time in automation-risk work" />
          <div style={{ width: 1, background: '#E7E0D8', margin: '16px 24px' }} />
          {signals.momentumReady ? (
            <SignalBlock
              label="Momentum"
              value={signals.momentum}
              color={signals.momentum >= 0 ? '#5A7A5C' : '#C0544A'}
              subtitle="4-week leverage change"
              isNeg
            />
          ) : (
            <SignalBlock
              label="Momentum"
              value={0}
              color="#A8A29E"
              subtitle=""
              building={`${weeksToGo} week${weeksToGo !== 1 ? 's' : ''} to go`}
            />
          )}
        </div>

        {/* Classification + Trend side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: hasTrend ? '1fr 280px' : '1fr', gap: 24 }}>
          {/* Classification */}
          <div ref={classificationRef} style={{
            background: '#FEFCF9', border: '1px solid #E7E0D8',
            borderRadius: 14, padding: '20px 24px', scrollMarginTop: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#78716C' }}>
                Work Classification
              </div>
              <div style={{ fontSize: 12, color: '#A8A29E', fontVariantNumeric: 'tabular-nums' }}>
                {data.totalHours}h this week
              </div>
            </div>
            {data.breakdown.map((item, i) => {
              const isHuman = HUMAN_RISKS.includes(item.risk)
              const isAtRisk = AT_RISK_RISKS.includes(item.risk)
              const rowHighlight = (highlight === 'human' && isHuman) ? 'human' :
                                   (highlight === 'risk' && isAtRisk) ? 'risk' : null
              return (
                <BreakdownBar
                  key={i}
                  item={item}
                  maxHours={maxHours}
                  events={data.classifiedEvents || []}
                  isOpen={openCategory === item.category}
                  onToggle={() => setOpenCategory(openCategory === item.category ? null : item.category)}
                  highlight={rowHighlight}
                />
              )
            })}

            {/* Stacked summary bar */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E7E0D8' }}>
              <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                {data.breakdown.map((item, i) => (
                  <div key={i} style={{
                    width: `${(item.hours / data.totalHours) * 100}%`,
                    background: RISK_COLORS[item.risk].bar,
                    opacity: 0.7,
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: '#5A7A5C', fontWeight: 600 }}>← Human-essential</span>
                <span style={{ fontSize: 11, color: '#C0544A', fontWeight: 600 }}>Automatable →</span>
              </div>
            </div>
          </div>

          {/* Right column — trend + zone map (only when we have trend data) */}
          {hasTrend && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 24 }}>
              {/* Trend */}
              <div style={{
                background: '#FEFCF9', border: '1px solid #E7E0D8',
                borderRadius: 14, padding: '20px 22px', flex: 1,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#78716C', marginBottom: 4 }}>
                  Leverage — {data.weekData.length} Weeks
                </div>
                <div style={{ fontSize: 12, color: '#A8A29E', marginBottom: 14 }}>
                  {data.weekData[0].leverage} → {data.weekData[data.weekData.length - 1].leverage}
                  {signals.momentumReady && (
                    <span style={{
                      color: signals.momentum >= 0 ? '#5A7A5C' : '#C0544A',
                      fontWeight: 700, marginLeft: 6,
                    }}>
                      {signals.momentum > 0 ? `+${signals.momentum}` : signals.momentum}
                    </span>
                  )}
                </div>
                <TrendSpark data={data.weekData} color={zone.color} height={56} />
              </div>

              {/* Zone spectrum */}
              <div style={{
                background: '#FEFCF9', border: '1px solid #E7E0D8',
                borderRadius: 14, padding: '18px 22px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#78716C', marginBottom: 14 }}>
                  Your Zone
                </div>
                {(Object.entries(ZONE_CONFIG) as [ZoneKey, typeof ZONE_CONFIG[ZoneKey]][]).map(([key, z]) => {
                  const isActive = data.zone === key
                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                        background: isActive ? z.tagBg : 'transparent',
                        border: isActive ? `1px solid ${z.tagBorder}` : '1px solid transparent',
                        transition: 'all 0.3s',
                      }}
                    >
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: isActive ? z.color : '#E7E0D8',
                        boxShadow: isActive ? `0 0 8px ${z.color}33` : 'none',
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: 13, fontWeight: isActive ? 800 : 500,
                        color: isActive ? z.color : '#A8A29E',
                      }}>
                        {z.label}
                      </span>
                      {isActive && (
                        <span style={{ fontSize: 10, color: z.color, marginLeft: 'auto', fontWeight: 600 }}>
                          You are here
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* When no trend yet, show zone spectrum inline */}
          {!hasTrend && (
            <div style={{
              background: '#FEFCF9', border: '1px solid #E7E0D8',
              borderRadius: 14, padding: '18px 22px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#78716C', marginBottom: 14 }}>
                Your Zone
              </div>
              {(Object.entries(ZONE_CONFIG) as [ZoneKey, typeof ZONE_CONFIG[ZoneKey]][]).map(([key, z]) => {
                const isActive = data.zone === key
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                      background: isActive ? z.tagBg : 'transparent',
                      border: isActive ? `1px solid ${z.tagBorder}` : '1px solid transparent',
                    }}
                  >
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: isActive ? z.color : '#E7E0D8',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 13, fontWeight: isActive ? 800 : 500,
                      color: isActive ? z.color : '#A8A29E',
                    }}>
                      {z.label}
                    </span>
                    {isActive && (
                      <span style={{ fontSize: 10, color: z.color, marginLeft: 'auto', fontWeight: 600 }}>
                        You are here
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
