'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion'
import { type Mood, MOODS } from '../lib/mood'
import PersistLogo from './PersistLogo'
import type { HeroMessage } from '../hooks/useWorkHealth'

interface SwipeableQuoteCardsProps {
  quotes: HeroMessage[]
  focus: number
  strain: number
  balance: number
  mood: Mood
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

function CardContent({
  quote,
  gradient,
  moodName,
  focus,
  strain,
  balance,
  onMetricClick,
  cardRef,
}: {
  quote: HeroMessage
  gradient: [string, string]
  moodName: string
  focus: number
  strain: number
  balance: number
  onMetricClick?: (metric: 'performance' | 'resilience' | 'sustainability') => void
  cardRef?: (el: HTMLDivElement | null) => void
}) {
  const values = { focus, strain, balance }

  return (
    <div
      ref={cardRef}
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(to bottom, ${gradient[0]}, ${gradient[1]})`,
        padding: '32px 24px 20px',
      }}
    >
      {/* Quote */}
      <p className="text-xl font-bold text-white text-center leading-snug mb-3 whitespace-pre-line">
        &ldquo;{quote.quote}&rdquo;
      </p>

      {/* Source */}
      <p className="text-xs text-center italic mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
        &mdash; {quote.source}
      </p>

      {/* Subtitle */}
      <p className="text-sm text-center font-normal leading-relaxed whitespace-pre-line mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
        {quote.subtitle}
      </p>

      {/* Score bar with mood label */}
      <div
        className="rounded-2xl px-5 py-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
      >
        <p className="text-[10px] text-center uppercase tracking-[0.2em] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
              <div className="text-xl font-bold text-white" style={{ lineHeight: 1 }}>
                {values[s.prop]}
              </div>
              <div className="text-[9px] uppercase tracking-wider mt-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Branding */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        <PersistLogo size={12} variant="light" />
        <span className="text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>PERSIST</span>
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
  focus,
  strain,
  balance,
  onMetricClick,
  onSwipeComplete,
  canSwipe,
  cardRef,
}: {
  quote: HeroMessage
  gradient: [string, string]
  moodName: string
  focus: number
  strain: number
  balance: number
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
        focus={focus}
        strain={strain}
        balance={balance}
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
  const { gradient, name: moodName } = MOODS[mood]
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
          focus={focus}
          strain={strain}
          balance={balance}
          onMetricClick={onMetricClick}
          onSwipeComplete={handleSwipeComplete}
          canSwipe={canSwipe}
          cardRef={activeCardRef}
        />
      </div>

      {/* Dot indicators + swipe hint + AI badge */}
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
                    ? 'rgba(255,255,255,0.6)'
                    : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              swipe for more quotes
            </p>
            {aiGenerated === false && (
              <span
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                title={aiError ? `AI error: ${aiError}` : undefined}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.2)',
                }}
              >
                offline
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
