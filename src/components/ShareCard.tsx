import { type Mood, MOODS, getMoodTier } from '../lib/mood'
import PersistLogo from './PersistLogo'

interface ShareCardProps {
  quote: string
  source: string
  subtitle: string
  focus: number
  strain: number
  balance: number
  mood: Mood
  daySummary?: string
  onMetricClick?: (metric: 'performance' | 'resilience' | 'sustainability') => void
}

const scores = [
  { key: 'performance' as const, label: 'FOCUS', prop: 'focus' as const },
  { key: 'resilience' as const, label: 'STRAIN', prop: 'strain' as const },
  { key: 'sustainability' as const, label: 'BALANCE', prop: 'balance' as const },
]

/** Which scores to emphasize per tier */
function getEmphasis(tier: 'bad' | 'ok' | 'good') {
  if (tier === 'bad') return { performance: false, resilience: true, sustainability: false }
  if (tier === 'good') return { performance: true, resilience: false, sustainability: true }
  return { performance: false, resilience: false, sustainability: false } // ok = all equal
}

export default function ShareCard({ quote, source, subtitle, focus, strain, balance, mood, daySummary, onMetricClick }: ShareCardProps) {
  const values = { focus, strain, balance }
  const { gradient, name: moodName, textColor } = MOODS[mood]
  const tier = getMoodTier(mood)
  const emphasis = getEmphasis(tier)
  const isDark = textColor === 'dark'

  const primary = isDark ? '#1C1917' : '#FFFFFF'
  const secondary = isDark ? 'rgba(28,25,23,0.5)' : 'rgba(255,255,255,0.5)'
  const subtle = isDark ? 'rgba(28,25,23,0.45)' : 'rgba(255,255,255,0.45)'
  const body = isDark ? 'rgba(28,25,23,0.65)' : 'rgba(255,255,255,0.65)'
  const faint = isDark ? 'rgba(28,25,23,0.25)' : 'rgba(255,255,255,0.25)'
  const summaryColor = isDark ? 'rgba(28,25,23,0.3)' : 'rgba(255,255,255,0.3)'
  const dotColor = isDark ? 'rgba(28,25,23,0.4)' : 'rgba(232,125,58,0.4)'
  const dotGlow = isDark ? 'none' : '0 0 10px rgba(232,125,58,0.15)'
  const glowColor = isDark ? 'rgba(28,25,23,0.04)' : 'rgba(232,125,58,0.035)'
  const deempNum = isDark ? 'rgba(28,25,23,0.15)' : 'rgba(255,255,255,0.08)'
  const deempLbl = isDark ? 'rgba(28,25,23,0.1)' : 'rgba(255,255,255,0.03)'
  const empNum = isDark ? 'rgba(28,25,23,0.82)' : 'rgba(232,125,58,0.6)'
  const empLbl = isDark ? 'rgba(28,25,23,0.35)' : 'rgba(232,125,58,0.18)'
  const brandBg = isDark ? 'rgba(28,25,23,0.06)' : 'rgba(255,255,255,0.05)'
  const brandChev = isDark ? 'rgba(28,25,23,0.14)' : 'rgba(255,255,255,0.12)'
  const brandTxt = isDark ? 'rgba(28,25,23,0.12)' : 'rgba(255,255,255,0.08)'
  const brandAcc = isDark ? 'rgba(232,125,58,0.45)' : 'rgba(232,125,58,0.2)'

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(to bottom, ${gradient[0]}, ${gradient[1]})`,
        padding: '28px 24px 24px',
        position: 'relative',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '35%', left: '40%',
        transform: 'translate(-50%, -50%)',
        width: 280, height: 280, borderRadius: '50%',
        background: `radial-gradient(circle, ${glowColor} 0%, transparent 50%)`,
        pointerEvents: 'none',
      }} />

      {/* Mood indicator + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, position: 'relative' }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: dotColor,
          boxShadow: dotGlow,
        }} />
        <p className="uppercase font-bold" style={{
          fontSize: 9, letterSpacing: '0.2em',
          color: isDark ? 'rgba(28,25,23,0.4)' : 'rgba(232,125,58,0.38)',
          margin: 0,
        }}>
          {moodName}
        </p>
      </div>

      {/* Day summary */}
      {daySummary && (
        <p style={{
          fontSize: 13, color: summaryColor, margin: '0 0 8px',
          fontWeight: 600, letterSpacing: '0.01em', lineHeight: 1.5, position: 'relative',
        }}>
          {daySummary}
        </p>
      )}

      {/* Scores — emphasis-based sizing */}
      <div style={{ display: 'flex', gap: 22, marginBottom: 28, position: 'relative' }}>
        {scores.map((s) => {
          const isEmp = emphasis[s.key]
          const isOk = tier === 'ok'
          return (
            <div
              key={s.key}
              className={`select-none${onMetricClick ? ' cursor-pointer' : ''}`}
              onClick={onMetricClick ? () => onMetricClick(s.key) : undefined}
              style={{
                transition: 'transform 0.1s ease, opacity 0.1s ease',
                WebkitTapHighlightColor: 'transparent',
                ...(onMetricClick ? { padding: '4px 8px', margin: '-4px -8px', borderRadius: '8px' } : {}),
              }}
              onPointerDown={onMetricClick ? (e) => {
                const el = e.currentTarget;
                el.style.transform = 'scale(0.92)';
                el.style.opacity = '0.7';
              } : undefined}
              onPointerUp={onMetricClick ? (e) => {
                const el = e.currentTarget;
                el.style.transform = 'scale(1)';
                el.style.opacity = '1';
              } : undefined}
              onPointerLeave={onMetricClick ? (e) => {
                const el = e.currentTarget;
                el.style.transform = 'scale(1)';
                el.style.opacity = '1';
              } : undefined}
            >
              <div style={{
                fontSize: isOk ? 30 : (isEmp ? 36 : 26),
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: isOk ? secondary : (isEmp ? empNum : deempNum),
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {values[s.prop]}
              </div>
              <div className="uppercase font-bold" style={{
                fontSize: 7, letterSpacing: '0.16em',
                color: isOk ? faint : (isEmp ? empLbl : deempLbl),
                marginTop: 5,
              }}>
                {s.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quote */}
      <p className="whitespace-pre-line" style={{
        fontSize: 22, fontWeight: 700, color: isDark ? 'rgba(28,25,23,0.87)' : 'rgba(255,255,255,0.85)',
        lineHeight: 1.3, margin: '0 0 10px', letterSpacing: '-0.01em',
        fontStyle: 'italic', position: 'relative',
      }}>
        &ldquo;{quote}&rdquo;
      </p>

      {/* Source */}
      <p style={{
        fontSize: 11, color: isDark ? 'rgba(28,25,23,0.3)' : 'rgba(255,255,255,0.14)',
        margin: '0 0 24px', fontWeight: 500, position: 'relative',
      }}>
        {source}
      </p>

      {/* Subtitle */}
      <p style={{
        fontSize: 12, color: isDark ? 'rgba(28,25,23,0.25)' : 'rgba(255,255,255,0.08)',
        margin: '0 0 22px', lineHeight: 1.5, fontWeight: 400, position: 'relative',
      }}>
        {subtitle}
      </p>

      {/* Ghosted brand mark */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={13} height={13} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="48" fill={brandBg} />
            <path d="M38 30 L62 50 L38 70" stroke={brandChev} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: brandTxt }}>
            PERSIST<span style={{ color: brandAcc }}>WORK</span><span style={{ fontWeight: 500 }}>.com</span>
          </span>
        </div>
      </div>
    </div>
  )
}
