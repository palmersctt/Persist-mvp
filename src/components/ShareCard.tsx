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
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(to bottom, ${gradient[0]}, ${gradient[1]})`,
        padding: '32px 24px 20px',
      }}
    >
      {/* Quote */}
      <p
        className="text-[1.25rem] font-medium text-white text-center leading-relaxed mb-3 whitespace-pre-line"
        style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontStyle: 'italic' }}
      >
        &ldquo;{quote}&rdquo;
      </p>

      {/* Source */}
      <p className="text-xs text-center font-medium tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
        &mdash; {source}
      </p>

      {/* Subtitle */}
      <p className="text-sm text-center font-normal leading-relaxed whitespace-pre-line mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
        {subtitle}
      </p>

      {/* Score bar with mood label inside */}
      <div
        className="rounded-2xl px-5 py-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
      >
        <p className="text-[11px] text-center uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {moodName}
        </p>
        <div className="flex justify-center gap-8">
          {scores.map((s) => (
            <div
              key={s.key}
              className={`text-center select-none${onMetricClick ? ' cursor-pointer' : ''}`}
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
              <div className="text-xl font-bold text-white" style={{ lineHeight: 1, fontFeatureSettings: "'tnum'" }}>
                {values[s.prop]}
              </div>
              <div className="text-[9px] uppercase tracking-wider mt-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Branding */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        <PersistLogo size={12} variant="light" />
        <span className="text-[9px] tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Persistwork</span>
      </div>
    </div>
  )
}
