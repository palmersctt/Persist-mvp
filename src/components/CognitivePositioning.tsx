'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useCognitivePositioning } from '../hooks/useCognitivePositioning'
import { signIn, signOut, useSession } from 'next-auth/react'
import PersistLogo from './PersistLogo'
import type { ZoneKey, WeeklyBreakdown, WeekSnapshot, CognitiveSignals, ClassifiedEventSummary, OutcomeLedger, LedgerItem } from '../lib/cognitive-signals'
import type { WorkOrientation } from '../lib/cognitive-classification'

// --- Zone config ---
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
    desc: 'Mostly process work · Low outcome delivery · Calendar is filling itself',
    icon: '↓',
  },
  friction: {
    label: 'Friction',
    color: '#E87D3A',
    bg: 'rgba(232, 125, 58, 0.04)',
    tagBg: 'rgba(232, 125, 58, 0.08)',
    tagBorder: 'rgba(232, 125, 58, 0.2)',
    desc: 'Split between outcomes and tasks · You see the problem but the calendar won\u2019t let you fix it',
    icon: '—',
  },
  agency: {
    label: 'Agency',
    color: '#5A7A5C',
    bg: 'rgba(90, 122, 92, 0.04)',
    tagBg: 'rgba(90, 122, 92, 0.08)',
    tagBorder: 'rgba(90, 122, 92, 0.2)',
    desc: 'Outcome work dominates · Your time compounds',
    icon: '↑',
  },
}

// --- Orientation colors (brand tokens only) ---
const ORIENTATION_COLORS: Record<WorkOrientation, { bar: string; bg: string; label: string }> = {
  outcome:      { bar: '#5A7A5C', bg: 'rgba(90,122,92,0.06)',   label: '#5A7A5C' },
  enabling:     { bar: '#E87D3A', bg: 'rgba(232,125,58,0.06)',  label: '#E87D3A' },
  deliberation: { bar: '#57534E', bg: 'rgba(87,83,78,0.06)',    label: '#57534E' },
  ceremony:     { bar: '#C0544A', bg: 'rgba(192,84,74,0.06)',   label: '#C0544A' },
  process:      { bar: '#C0544A', bg: 'rgba(192,84,74,0.06)',   label: '#C0544A' },
  'non-work':   { bar: '#A8A29E', bg: 'rgba(168,162,158,0.04)', label: '#A8A29E' },
}

const ORIENTATION_LABELS: Record<WorkOrientation, string> = {
  outcome: 'Outcome',
  enabling: 'Enabling',
  deliberation: 'Deliberation',
  ceremony: 'Ceremony',
  process: 'Process',
  'non-work': 'Non-work',
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

function OrientationRow({ orientation, hours, maxHours, events, isOpen, onToggle, highlight }: {
  orientation: WorkOrientation; hours: number; maxHours: number; events: ClassifiedEventSummary[]
  isOpen: boolean; onToggle: () => void; highlight?: 'human' | 'risk' | null
}) {
  const oc = ORIENTATION_COLORS[orientation]
  const pct = maxHours > 0 ? (hours / maxHours) * 100 : 0
  const isOutcome = orientation === 'outcome' || orientation === 'enabling'
  const highlightBg = highlight === 'human' && isOutcome ? 'rgba(90,122,92,0.10)' :
                      highlight === 'risk' && !isOutcome ? 'rgba(192,84,74,0.10)' : 'transparent'

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
        <div style={{ width: 120, fontSize: 13, fontWeight: 600, color: '#57534E', flexShrink: 0 }}>
          {ORIENTATION_LABELS[orientation]}
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ height: 22, borderRadius: 5, background: oc.bg, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 5, background: oc.bar, opacity: 0.7,
              width: `${pct}%`,
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
          </div>
        </div>
        <div style={{ width: 42, fontSize: 13, fontWeight: 700, color: '#57534E', textAlign: 'right' as const, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {hours}h
        </div>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
          color: oc.label, background: oc.bg, padding: '4px 10px', borderRadius: 5,
          width: 100, textAlign: 'center' as const, flexShrink: 0,
        }}>
          {ORIENTATION_LABELS[orientation]}
        </div>
      </div>
      {isOpen && events.length > 0 && (
        <div style={{ padding: '4px 8px 10px 20px' }}>
          {events.map((evt, i) => (
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

function LedgerGroup({ label, items, color }: { label: string; items: LedgerItem[]; color: string }) {
  if (items.length === 0) return null
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
        color, marginBottom: 6,
      }}>
        {label}
      </div>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '4px 0',
          borderTop: i > 0 ? '1px solid rgba(231,224,216,0.5)' : 'none',
        }}>
          <span style={{ fontSize: 12, color: '#57534E' }}>{item.title}</span>
          <span style={{ fontSize: 11, color: '#A8A29E', fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: 12 }}>
            {item.hours >= 1 ? `${item.hours}h` : `${Math.round(item.hours * 60)}m`}
          </span>
        </div>
      ))}
    </div>
  )
}

function OutcomeLedgerPanel({ ledger }: { ledger: OutcomeLedger }) {
  const { outcomes, tasks, enabling, summary } = ledger
  return (
    <div style={{
      background: '#FEFCF9', border: '1px solid #E7E0D8',
      borderRadius: 14, padding: '20px 24px', marginBottom: 24,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
        color: '#78716C', marginBottom: 16,
      }}>
        Outcome Ledger
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Produced */}
        <div>
          <div style={{
            fontSize: 13, fontWeight: 800, color: '#5A7A5C', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>What your calendar produced</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#A8A29E' }}>
              {summary.outcomeHours}h
            </span>
          </div>
          <LedgerGroup label="Decisions" items={outcomes.decisions} color="#5A7A5C" />
          <LedgerGroup label="Relationships" items={outcomes.relationships} color="#5A7A5C" />
          <LedgerGroup label="Creations" items={outcomes.creations} color="#5A7A5C" />
          {summary.outcomeCount === 0 && (
            <div style={{ fontSize: 12, color: '#A8A29E', fontStyle: 'italic' }}>
              No outcomes on the calendar
            </div>
          )}
        </div>

        {/* Right: Filled */}
        <div>
          <div style={{
            fontSize: 13, fontWeight: 800, color: '#C0544A', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>What filled your calendar</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#A8A29E' }}>
              {summary.taskHours}h
            </span>
          </div>
          <LedgerGroup label="Ceremonies" items={tasks.ceremonies} color="#C0544A" />
          <LedgerGroup label="Deliberations" items={tasks.deliberations} color="#57534E" />
          <LedgerGroup label="Process" items={tasks.process} color="#C0544A" />
          {summary.taskCount === 0 && (
            <div style={{ fontSize: 12, color: '#A8A29E', fontStyle: 'italic' }}>
              Every hour drove an outcome
            </div>
          )}
        </div>
      </div>

      {/* Enabling callout */}
      {enabling.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #E7E0D8' }}>
          <LedgerGroup label={`Enabling (crisis response) — ${summary.enabledHours}h`} items={enabling} color="#E87D3A" />
        </div>
      )}

      {/* Narrative */}
      <div style={{
        marginTop: 16, paddingTop: 12, borderTop: '1px solid #E7E0D8',
        fontSize: 13, color: '#57534E', lineHeight: 1.5,
      }}>
        {summary.narrative}
      </div>
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

const ORIENTATION_ORDER: WorkOrientation[] = ['outcome', 'enabling', 'deliberation', 'ceremony', 'process']

export default function CognitivePositioning() {
  const { data: session } = useSession()
  const { data, isLoading, error, refresh, status } = useCognitivePositioning()
  const [openOrientation, setOpenOrientation] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<'human' | 'risk' | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const classificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!showProfile) return
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showProfile])

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
  const { signals } = data
  const weeksToGo = Math.max(0, 4 - signals.weeksOfData)
  const hasTrend = data.weekData.length >= 2

  // Group breakdown by orientation for display
  const allEvents: ClassifiedEventSummary[] = data.classifiedEvents || []
  const orientationRows = ORIENTATION_ORDER
    .map(o => {
      const hours = data.breakdown
        .filter((b: WeeklyBreakdown) => (b.orientation || 'process') === o)
        .reduce((s: number, b: WeeklyBreakdown) => s + b.hours, 0)
      const events: ClassifiedEventSummary[] = allEvents.filter((e: ClassifiedEventSummary) => e.orientation === o)
      return { orientation: o, hours: Math.round(hours * 10) / 10, events }
    })
    .filter(r => r.hours > 0)
  const maxOrientationHours = Math.max(...orientationRows.map(r => r.hours), 0.1)

  return (
    <div style={{
      minHeight: '100vh', background: '#FBF7F2',
      fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, system-ui, sans-serif",
      color: '#1C1917',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 60px' }}>
        {/* Header — matches dashboard */}
        <header className="sticky top-0 z-40 bg-[#FEFCF9]/80 border-b border-[#E7E0D8] backdrop-blur-sm" style={{ margin: '0 -24px', padding: '24px 24px 16px' }}>
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
              <PersistLogo size={24} variant="dark" />
              <span className="text-lg font-semibold" style={{ color: 'var(--text-primary, #1C1917)', letterSpacing: '1.5px' }}>PERSIST<span style={{ color: '#E87D3A' }}>WORK</span></span>
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={refresh}
                disabled={isLoading}
                className="text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
                style={{
                  color: isLoading ? 'var(--text-muted, #A8A29E)' : 'var(--text-secondary, #57534E)',
                  border: `1px solid ${isLoading ? 'rgba(28,25,23,0.04)' : '#E7E0D8'}`,
                  backgroundColor: 'transparent',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.backgroundColor = 'rgba(28,25,23,0.06)' } }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {isLoading ? 'Updating...' : 'Refresh'}
              </button>
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="w-8 h-8 rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-105"
                  style={{ borderColor: showProfile ? '#E7E0D8' : 'rgba(28,25,23,0.1)' }}
                >
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(28,25,23,0.06)', color: 'var(--text-secondary, #57534E)' }}>
                      {session?.user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </button>
                {showProfile && (
                  <div
                    className="absolute right-0 mt-2 w-72 rounded-xl overflow-hidden shadow-2xl z-50"
                    style={{ backgroundColor: '#FEFCF9', border: '1px solid #E7E0D8' }}
                  >
                    <div className="p-4 border-b" style={{ borderColor: '#E7E0D8' }}>
                      <div className="flex items-center gap-3">
                        {session?.user?.image && (
                          <img src={session.user.image} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary, #1C1917)' }}>{session?.user?.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted, #A8A29E)' }}>{session?.user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-b" style={{ borderColor: '#E7E0D8' }}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted, #A8A29E)' }}>Permissions</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[#5A7A5C] text-xs">&#10003;</span>
                          <span className="text-xs" style={{ color: 'var(--text-secondary, #57534E)' }}>Email address</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#5A7A5C] text-xs">&#10003;</span>
                          <span className="text-xs" style={{ color: 'var(--text-secondary, #57534E)' }}>Profile info (name, photo)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#5A7A5C] text-xs">&#10003;</span>
                          <span className="text-xs" style={{ color: 'var(--text-secondary, #57534E)' }}>Google Calendar (read-only)</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <button
                        onClick={() => signOut()}
                        className="w-full text-xs font-medium py-2 rounded-lg transition-colors"
                        style={{ color: 'var(--text-secondary, #57534E)', backgroundColor: 'rgba(28,25,23,0.04)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(28,25,23,0.08)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(28,25,23,0.04)' }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: '16px 0 0', lineHeight: 1.2 }}>
            AI Pulse
          </h1>
        </header>

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
              <div style={{ fontSize: 11, color: '#A8A29E', marginBottom: 2 }}>Produced</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#5A7A5C' }}>{data.humanHours}h</div>
            </div>
            <div style={{ width: 1, background: '#E7E0D8' }} />
            <div style={{ textAlign: 'center' as const, cursor: 'pointer' }} onClick={() => scrollAndHighlight('risk')}>
              <div style={{ fontSize: 11, color: '#A8A29E', marginBottom: 2 }}>Filled</div>
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
          <SignalBlock label="Leverage" value={signals.leverage} color="#E87D3A" subtitle="Weighted toward outcome work" />
          <div style={{ width: 1, background: '#E7E0D8', margin: '16px 24px' }} />
          <SignalBlock label="Exposure" value={signals.exposure} color="#C0544A" subtitle="% hours in exposed work" />
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

        {/* Outcome Ledger */}
        {data.outcomeLedger && <OutcomeLedgerPanel ledger={data.outcomeLedger} />}

        {/* Classification + Trend side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: hasTrend ? '1fr 280px' : '1fr', gap: 24 }}>
          {/* Classification by orientation */}
          <div ref={classificationRef} style={{
            background: '#FEFCF9', border: '1px solid #E7E0D8',
            borderRadius: 14, padding: '20px 24px', scrollMarginTop: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#78716C' }}>
                Work Orientation
              </div>
              <div style={{ fontSize: 12, color: '#A8A29E', fontVariantNumeric: 'tabular-nums' }}>
                {data.totalHours}h this week
              </div>
            </div>
            {orientationRows.map(row => {
              const isOutcome = row.orientation === 'outcome' || row.orientation === 'enabling'
              const rowHighlight = (highlight === 'human' && isOutcome) ? 'human' :
                                   (highlight === 'risk' && !isOutcome) ? 'risk' : null
              return (
                <OrientationRow
                  key={row.orientation}
                  orientation={row.orientation}
                  hours={row.hours}
                  maxHours={maxOrientationHours}
                  events={row.events}
                  isOpen={openOrientation === row.orientation}
                  onToggle={() => setOpenOrientation(openOrientation === row.orientation ? null : row.orientation)}
                  highlight={rowHighlight}
                />
              )
            })}

            {/* Stacked summary bar — produced vs filled */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E7E0D8' }}>
              <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                {orientationRows.map(row => (
                  <div key={row.orientation} style={{
                    width: `${data.totalHours > 0 ? (row.hours / data.totalHours) * 100 : 0}%`,
                    background: ORIENTATION_COLORS[row.orientation].bar,
                    opacity: 0.7,
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: '#5A7A5C', fontWeight: 600 }}>Produced</span>
                <span style={{ fontSize: 11, color: '#C0544A', fontWeight: 600 }}>Filled</span>
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
