import { type Mood, MOODS } from '../lib/mood'
import PersistLogo from './PersistLogo'

interface ShareCardProps {
  quote: string
  source: string
  subtitle: string
  focus: number
  strain: number
  balance: number
  mood: Mood
  onMetricClick?: (metric: 'performance' | 'resilience' | 'sustainability') => void
}

const scores = [
  { key: 'performance' as const, label: 'FOCUS', prop: 'focus' as const },
  { key: 'resilience' as const, label: 'STRAIN', prop: 'strain' as const },
  { key: 'sustainability' as const, label: 'BALANCE', prop: 'balance' as const },
]

export default function ShareCard({ quote, source, subtitle, focus, strain, balance, mood, onMetricClick }: ShareCardProps) {
  const values = { focus, strain, balance }
  const { gradient, name: moodName } = MOODS[mood]

  return (
    <div
      className="w-full rounded-2xl overflow-hidden flex flex-col"
      style={{
        aspectRatio: '9 / 16',
        background: `linear-gradient(to bottom, ${gradient[0]}, ${gradient[1]})`,
        padding: '28px 28px 32px',
      }}
    >
      {/* Quote area — biased toward top */}
      <div className="flex-1 flex flex-col justify-start pt-6">
        <p className="text-2xl md:text-3xl font-bold text-white text-center leading-snug mb-4 whitespace-pre-line">
          &ldquo;{quote}&rdquo;
        </p>
        <p className="text-sm text-center italic mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
          &mdash; {source}
        </p>
        <p className="text-sm text-center font-light leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {subtitle}
        </p>
      </div>

      {/* Mood label */}
      <p className="text-xs text-center uppercase tracking-[0.25em] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {moodName}
      </p>

      {/* Score bar */}
      <div
        className="rounded-2xl px-6 py-5"
        style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex justify-center gap-8">
          {scores.map((s) => (
            <div
              key={s.key}
              className={`text-center${onMetricClick ? ' cursor-pointer' : ''}`}
              onClick={onMetricClick ? () => onMetricClick(s.key) : undefined}
            >
              <div className="text-2xl font-bold text-white" style={{ lineHeight: 1 }}>
                {values[s.prop]}
              </div>
              <div className="text-[10px] uppercase tracking-wider mt-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <PersistLogo size={14} variant="light" />
          <span className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>PERSIST</span>
        </div>
      </div>
    </div>
  )
}
