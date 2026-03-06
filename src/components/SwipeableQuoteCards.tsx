'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion'
import { type Mood, MOODS, getMoodTier } from '../lib/mood'
import { trackEvent } from '../lib/trackEvent'
import type { HeroMessage } from '../hooks/useWorkHealth'

interface SwipeableQuoteCardsProps {
  quotes: HeroMessage[]
  focus: number
  strain: number
  balance: number
  mood: Mood
  daySummary?: string
  aiGenerated?: boolean
  aiError?: string
  onMetricClick?: (metric: 'performance' | 'resilience' | 'sustainability') => void
  /** Ref callback for the currently visible card (for screenshot/share) */
  activeCardRef?: (el: HTMLDivElement | null) => void
  /** Called when user dwells on or shares a quote */
  onEngagement?: (quote: string, source: string, action: 'share' | 'dwell', dwellMs?: number) => void
}

const scores = [
  { key: 'performance' as const, label: 'FOCUS', prop: 'focus' as const },
  { key: 'resilience' as const, label: 'STRAIN', prop: 'strain' as const },
  { key: 'sustainability' as const, label: 'BALANCE', prop: 'balance' as const },
]

const SWIPE_THRESHOLD = 60
const SWIPE_VELOCITY = 300
const SWIPE_COOLDOWN_MS = 500

/** Which scores to emphasize per tier */
function getEmphasis(tier: 'bad' | 'ok' | 'good') {
  if (tier === 'bad') return { performance: false, resilience: true, sustainability: false }
  if (tier === 'good') return { performance: true, resilience: false, sustainability: true }
  return { performance: false, resilience: false, sustainability: false }
}

function CardContent({
  quote,
  gradient,
  moodName,
  textColor,
  focus,
  strain,
  balance,
  mood,
  daySummary,
  onMetricClick,
  cardRef,
}: {
  quote: HeroMessage
  gradient: [string, string]
  moodName: string
  textColor: 'light' | 'dark'
  focus: number
  strain: number
  balance: number
  mood: Mood
  daySummary?: string
  onMetricClick?: (metric: 'performance' | 'resilience' | 'sustainability') => void
  cardRef?: (el: HTMLDivElement | null) => void
}) {
  const values = { focus, strain, balance }
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
      ref={cardRef}
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
        &ldquo;{quote.quote}&rdquo;
      </p>

      {/* Source */}
      <p style={{
        fontSize: 11, color: isDark ? 'rgba(28,25,23,0.3)' : 'rgba(255,255,255,0.14)',
        margin: '0 0 24px', fontWeight: 500, position: 'relative',
      }}>
        {quote.source}
      </p>

      {/* Subtitle */}
      <p style={{
        fontSize: 12, color: isDark ? 'rgba(28,25,23,0.25)' : 'rgba(255,255,255,0.08)',
        margin: '0 0 22px', lineHeight: 1.5, fontWeight: 400, position: 'relative',
      }}>
        {quote.subtitle}
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

/**
 * Single draggable card. Keyed by currentIndex so React unmounts/remounts
 * on each swipe — fresh MotionValues, no stale state from previous cards.
 */
function DraggableCard({
  quote,
  gradient,
  moodName,
  textColor,
  focus,
  strain,
  balance,
  mood,
  daySummary,
  onMetricClick,
  onSwipeComplete,
  canSwipe,
  cardRef,
}: {
  quote: HeroMessage
  gradient: [string, string]
  moodName: string
  textColor: 'light' | 'dark'
  focus: number
  strain: number
  balance: number
  mood: Mood
  daySummary?: string
  onMetricClick?: (metric: 'performance' | 'resilience' | 'sustainability') => void
  onSwipeComplete: (direction: number) => void
  canSwipe: boolean
  cardRef?: (el: HTMLDivElement | null) => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-8, 0, 8])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])

  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldSwipe = canSwipe && (
      Math.abs(info.offset.x) > SWIPE_THRESHOLD ||
      Math.abs(info.velocity.x) > SWIPE_VELOCITY
    )

    if (shouldSwipe) {
      const flyTo = info.offset.x > 0 ? 400 : -400
      animate(x, flyTo, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        onComplete: () => onSwipeComplete(info.offset.x > 0 ? -1 : 1),
      })
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
    }
  }, [x, onSwipeComplete, canSwipe])

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      className="cursor-grab active:cursor-grabbing"
      initial={{ scale: 0.97 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <CardContent
        quote={quote}
        gradient={gradient}
        moodName={moodName}
        textColor={textColor}
        focus={focus}
        strain={strain}
        balance={balance}
        mood={mood}
        daySummary={daySummary}
        onMetricClick={onMetricClick}
        cardRef={cardRef}
      />
    </motion.div>
  )
}

export default function SwipeableQuoteCards({
  quotes,
  focus,
  strain,
  balance,
  mood,
  daySummary,
  aiGenerated,
  aiError,
  onMetricClick,
  activeCardRef,
  onEngagement,
}: SwipeableQuoteCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [canSwipe, setCanSwipe] = useState(true)
  const cooldownRef = useRef<NodeJS.Timeout | null>(null)
  const dwellStartRef = useRef<number>(Date.now())
  const { gradient, name: moodName, textColor } = MOODS[mood]
  const n = quotes.length

  // Clean up cooldown timer
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current)
    }
  }, [])

  // Track dwell time: reset timer whenever card changes
  useEffect(() => {
    dwellStartRef.current = Date.now()
  }, [currentIndex])

  // Safety: clamp index if quotes array shrinks (e.g. AI update)
  useEffect(() => {
    if (currentIndex >= n && n > 0) {
      setCurrentIndex(0)
    }
  }, [n, currentIndex])

  const handleSwipeComplete = useCallback((direction: number) => {
    // Report dwell time for the card being swiped away
    if (onEngagement && quotes[currentIndex]) {
      const dwellMs = Date.now() - dwellStartRef.current
      const q = quotes[currentIndex]
      onEngagement(q.quote, q.source, 'dwell', dwellMs)
      trackEvent('card_swipe', { quote: q.quote, source: q.source, direction, dwellMs })
    }
    // direction: +1 = next (swiped left), -1 = prev (swiped right)
    setCurrentIndex(prev => (prev + direction + n) % n)
    // Cooldown prevents rapid-fire swiping
    setCanSwipe(false)
    cooldownRef.current = setTimeout(() => setCanSwipe(true), SWIPE_COOLDOWN_MS)
  }, [n, currentIndex, quotes, onEngagement])

  if (!quotes || n === 0) return null

  return (
    <div className="w-full">
      {/* Single card at a time — overflow-hidden clips the swipe-off */}
      <div className="overflow-hidden">
        <DraggableCard
          key={currentIndex}
          quote={quotes[currentIndex]}
          gradient={gradient}
          moodName={moodName}
          textColor={textColor}
          focus={focus}
          strain={strain}
          balance={balance}
          mood={mood}
          daySummary={daySummary}
          onMetricClick={onMetricClick}
          onSwipeComplete={handleSwipeComplete}
          canSwipe={canSwipe}
          cardRef={activeCardRef}
        />
      </div>

      {/* Dot indicators + AI badge */}
      {n > 1 && (
        <div className="flex flex-col items-center mt-3 gap-2">
          <div className="flex gap-1.5">
            {quotes.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === currentIndex ? 16 : 6,
                  height: 6,
                  backgroundColor: i === currentIndex
                    ? 'var(--amber, #E87D3A)'
                    : 'var(--border, #E7E0D8)',
                }}
              />
            ))}
          </div>
          {aiGenerated === false && (
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
              title={aiError ? `AI error: ${aiError}` : undefined}
              style={{
                backgroundColor: 'rgba(0,0,0,0.04)',
                color: 'var(--ink-faint, #A8A29E)',
              }}
            >
              offline
            </span>
          )}
        </div>
      )}
    </div>
  )
}
