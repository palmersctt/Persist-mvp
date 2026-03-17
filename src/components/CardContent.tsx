import { type Mood, MOODS, getMoodTier } from '../lib/mood'

// ─── score fields ───────────────────────────────────────────────────────────

const SCORE_FIELDS = [
  { key: 'performance' as const, label: 'FOCUS', prop: 'focus' as const },
  { key: 'resilience' as const, label: 'STRAIN', prop: 'strain' as const },
  { key: 'sustainability' as const, label: 'BALANCE', prop: 'balance' as const },
]

/** Returns which metric keys should pop (amber) for this tier. */
function getPoppedScores(tier: 'bad' | 'ok' | 'good') {
  if (tier === 'bad') return { performance: false, resilience: true, sustainability: false }
  if (tier === 'good') return { performance: true, resilience: false, sustainability: true }
  return { performance: false, resilience: false, sustainability: false }
}

// ─── token maps ─────────────────────────────────────────────────────────────

/** Tokens for dark-bg cards (bad + ok tier) */
const DARK_TOKENS = {
  popNum: 'rgba(232,125,58,0.9)',
  popLbl: 'rgba(232,125,58,0.55)',
  ghostNum: 'rgba(255,255,255,0.40)',
  ghostLbl: 'rgba(255,255,255,0.35)',
  flatNum: 'rgba(255,255,255,0.80)',
  flatLbl: 'rgba(255,255,255,0.55)',
  moodLabel: 'rgba(232,125,58,0.7)',
  dotColor: 'rgba(232,125,58,0.7)',
  dotGlow: '0 0 12px rgba(232,125,58,0.3)',
  quote: 'rgba(255,255,255,0.92)',
  source: 'rgba(255,255,255,0.60)',
  subtitle: 'rgba(255,255,255,0.65)',
  brandTxt: 'rgba(255,255,255,0.22)',
  brandAcc: 'rgba(232,125,58,0.55)',
  brandBg: 'rgba(255,255,255,0.07)',
  brandChev: 'rgba(255,255,255,0.3)',
  glowColor: 'rgba(232,125,58,0.07)',
  okMoodLabel: 'rgba(255,255,255,0.45)',
  okDotColor: 'rgba(255,255,255,0.45)',
  okBrandAcc: 'rgba(232,125,58,0.5)',
} as const

/** Tokens for light-bg card (good tier) */
const LIGHT_TOKENS = {
  popNum: 'rgba(232,125,58,0.9)',
  popLbl: 'rgba(232,125,58,0.55)',
  ghostNum: 'rgba(28,25,23,0.45)',
  ghostLbl: 'rgba(28,25,23,0.38)',
  flatNum: 'rgba(28,25,23,0.55)',
  flatLbl: 'rgba(28,25,23,0.35)',
  moodLabel: 'rgba(232,125,58,0.65)',
  dotColor: 'rgba(232,125,58,0.65)',
  dotGlow: 'none',
  quote: 'rgba(28,25,23,0.88)',
  source: 'rgba(28,25,23,0.65)',
  subtitle: 'rgba(28,25,23,0.65)',
  brandTxt: 'rgba(28,25,23,0.28)',
  brandAcc: 'rgba(232,125,58,0.7)',
  brandBg: 'rgba(28,25,23,0.06)',
  brandChev: 'rgba(28,25,23,0.22)',
  glowColor: 'rgba(232,125,58,0.08)',
} as const

// ─── component ───────────────────────────────────────────────────────────────

export interface CardContentProps {
  quote: string
  source: string
  subtitle: string
  focus: number
  strain: number
  balance: number
  mood: Mood
  daySummary?: string
  onMetricClick?: (metric: 'performance' | 'resilience' | 'sustainability') => void
  cardRef?: (el: HTMLDivElement | null) => void
  forExport?: boolean
}

export default function CardContent({
  quote,
  source,
  subtitle,
  focus,
  strain,
  balance,
  mood,
  onMetricClick,
  cardRef,
  forExport = false,
}: CardContentProps) {
  const values = { focus, strain, balance }
  const { gradient, name: moodName, textColor } = MOODS[mood]
  const tier = getMoodTier(mood)
  const popped = getPoppedScores(tier)
  const isLight = textColor === 'dark'
  const isOk = tier === 'ok'

  const tk = isLight ? LIGHT_TOKENS : DARK_TOKENS

  const cardBorder = forExport
    ? isLight
      ? '1px solid rgba(28,25,23,0.1)'
      : '1px solid rgba(255,255,255,0.08)'
    : isLight
      ? '1px solid rgba(28,25,23,0.08)'
      : '1px solid rgba(255,255,255,0.07)'

  return (
    <div
      ref={cardRef}
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})`,
        padding: '28px 24px 24px',
        position: 'relative',
        border: cardBorder,
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '35%', left: '40%',
        transform: 'translate(-50%, -50%)',
        width: 280, height: 280, borderRadius: '50%',
        background: `radial-gradient(circle, ${tk.glowColor} 0%, transparent 50%)`,
        pointerEvents: 'none',
      }} />

      {/* Mood row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, position: 'relative' }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: isOk ? DARK_TOKENS.okDotColor : tk.dotColor,
          boxShadow: isOk ? 'none' : tk.dotGlow,
        }} />
        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase' as const, margin: 0,
          color: isOk ? DARK_TOKENS.okMoodLabel : tk.moodLabel,
        }}>
          {moodName}
        </p>
      </div>


      {/* Scores — uniform 32px, color-driven emphasis */}
      <div style={{ display: 'flex', gap: 22, marginBottom: 28, position: 'relative' }}>
        {SCORE_FIELDS.map((s) => {
          const isPopped = popped[s.key]
          const numColor = isOk ? DARK_TOKENS.flatNum : isPopped ? tk.popNum : tk.ghostNum
          const lblColor = isOk ? DARK_TOKENS.flatLbl : isPopped ? tk.popLbl : tk.ghostLbl

          return (
            <div
              key={s.key}
              className={`select-none${onMetricClick ? ' cursor-pointer' : ''}`}
              onClick={onMetricClick ? () => onMetricClick(s.key) : undefined}
              style={{
                transition: 'transform 0.1s ease, opacity 0.1s ease',
                WebkitTapHighlightColor: 'transparent',
                ...(onMetricClick ? { padding: '4px 8px', margin: '-4px -8px', borderRadius: 8 } : {}),
              }}
              onPointerDown={onMetricClick ? (e) => {
                e.currentTarget.style.transform = 'scale(0.92)'
                e.currentTarget.style.opacity = '0.7'
              } : undefined}
              onPointerUp={onMetricClick ? (e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.opacity = '1'
              } : undefined}
              onPointerLeave={onMetricClick ? (e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.opacity = '1'
              } : undefined}
            >
              <div style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: numColor,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {values[s.prop]}
              </div>
              <div style={{
                fontSize: 8, fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
                color: lblColor,
                marginTop: 4,
              }}>
                {s.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quote */}
      <p style={{
        fontSize: 22, fontWeight: 700, fontStyle: 'italic',
        letterSpacing: '-0.01em', lineHeight: 1.3,
        color: tk.quote,
        margin: '0 0 10px', position: 'relative',
      }}>
        &ldquo;{quote}&rdquo;
      </p>

      {/* Source */}
      <p style={{
        fontSize: 11, fontWeight: 500,
        color: tk.source,
        margin: '0 0 20px', position: 'relative',
      }}>
        {source}
      </p>

      {/* Subtitle */}
      <p style={{
        fontSize: 12, fontWeight: 400, lineHeight: 1.5,
        color: tk.subtitle,
        margin: '0 0 22px', position: 'relative',
      }}>
        {subtitle}
      </p>

      {/* Brand mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
        <svg width={13} height={13} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="48" fill={tk.brandBg} />
          <path
            d="M38 30 L62 50 L38 70"
            stroke={tk.brandChev}
            strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: tk.brandTxt }}>
          PERSIST<span style={{ color: isOk ? DARK_TOKENS.okBrandAcc : tk.brandAcc }}>WORK</span>
          <span style={{ fontWeight: 500 }}>.com</span>
        </span>
      </div>
    </div>
  )
}
