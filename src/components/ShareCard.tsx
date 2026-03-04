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
      {/* Mood label */}
      <p className="text-center uppercase font-semibold" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>
        {moodName}
      </p>

      {/* Score pills */}
      <div
        className="px-4 py-3"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 14, marginBottom: 18 }}
      >
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
              <div className="text-white" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
                {values[s.prop]}
              </div>
              <div className="uppercase font-bold" style={{ fontSize: 9, letterSpacing: '0.15em', marginTop: 5, color: 'rgba(255,255,255,0.5)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quote */}
      <p className="text-white text-center whitespace-pre-line" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>
        &ldquo;{quote}&rdquo;
      </p>

      {/* Source */}
      <p className="text-center italic" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>
        &mdash; {source}
      </p>

      {/* Subtitle */}
      <p className="text-center font-normal whitespace-pre-line" style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
        {subtitle}
      </p>

      {/* Branding */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        <PersistLogo size={12} variant="light" />
        <span className="text-[9px] tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Persistwork.com</span>
      </div>
    </div>
  )
}
