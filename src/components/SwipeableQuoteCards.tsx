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
  onMetricClick?: (metric: 'performance' | 'resilience' | 'sustainability') => void
  /** Ref callback for the currently visible card (for screenshot/share) */
  activeCardRef?: (el: HTMLDivElement | null) => void
}

const scores = [
  { key: 'performance' as const, label: 'FOCUS', prop: 'focus' as const },
  { key: 'resilience' as const, label: 'STRAIN', prop: 'strain' as const },
  { key: 'sustainability' as const, label: 'BALANCE', prop: 'balance' as const },
]

const SWIPE_THRESHOLD = 80
const SWIPE_VELOCITY = 300

/**
 * Each card is a persistent instance (keyed by array index, never unmounted).
 * It computes its visual state from `stackPos`:
 *   0 = top card (draggable)
 *   1,2 = behind cards (scaled down, offset)
 *   >=3 = hidden
 */
function Card({
  quote,
  gradient,
  moodName,
  focus,
  strain,
  balance,
  onMetricClick,
  stackPos,
  onSwipeComplete,
  cardRef,
}: {
  quote: HeroMessage
  gradient: [string, string]
  moodName: string
  focus: number
  strain: number
  balance: number
  onMetricClick?: (metric: 'performance' | 'resilience' | 'sustainability') => void
  stackPos: number
  onSwipeComplete: () => void
  cardRef?: (el: HTMLDivElement | null) => void
}) {
  const isTop = stackPos === 0
  const prevStackPos = useRef(stackPos)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12])
  const dragOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])
  const values = { focus, strain, balance }

  // When card transitions from top (swiped off at x=400) to behind, reset x instantly
  useEffect(() => {
    if (prevStackPos.current === 0 && stackPos > 0) {
      x.set(0)
    }
    prevStackPos.current = stackPos
  }, [stackPos, x])

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD || Math.abs(info.velocity.x) > SWIPE_VELOCITY) {
      const flyTo = info.offset.x > 0 ? 400 : -400
      animate(x, flyTo, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        onComplete: onSwipeComplete,
      })
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
    }
  }, [x, onSwipeComplete])

  // Hidden cards (far back in stack)
  if (stackPos >= 3) {
    return null
  }

  const cardInner = (
    <div
      ref={isTop ? cardRef : undefined}
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
              className={`text-center${onMetricClick ? ' cursor-pointer' : ''}`}
              onClick={onMetricClick ? () => onMetricClick(s.key) : undefined}
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

  // Top card: draggable with motion values
  if (isTop) {
    return (
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ x, rotate, opacity: dragOpacity, zIndex: 20 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
      >
        {cardInner}
      </motion.div>
    )
  }

  // Behind card: animated stack position, instant x/rotate reset
  return (
    <motion.div
      className="absolute inset-0"
      animate={{
        scale: 1 - stackPos * 0.04,
        y: stackPos * 8,
        opacity: Math.max(0, 1 - stackPos * 0.2),
        x: 0,
        rotate: 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        // Instantly reset position/rotation so the swiped card doesn't slide in from offscreen
        x: { duration: 0 },
        rotate: { duration: 0 },
      }}
      style={{ zIndex: 10 - stackPos }}
    >
      {cardInner}
    </motion.div>
  )
}

export default function SwipeableQuoteCards({
  quotes,
  focus,
  strain,
  balance,
  mood,
  onMetricClick,
  activeCardRef,
}: SwipeableQuoteCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { gradient, name: moodName } = MOODS[mood]
  const n = quotes.length

  const handleSwipeComplete = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % n)
  }, [n])

  if (!quotes || n === 0) return null

  return (
    <div className="w-full">
      {/* Card stack — persistent instances, never unmounted */}
      <div className="relative" style={{ minHeight: '320px' }}>
        {quotes.map((quote, i) => {
          // How far back in the stack is this card?
          const stackPos = ((i - currentIndex) % n + n) % n

          return (
            <Card
              key={i}
              quote={quote}
              gradient={gradient}
              moodName={moodName}
              focus={focus}
              strain={strain}
              balance={balance}
              onMetricClick={onMetricClick}
              stackPos={stackPos}
              onSwipeComplete={handleSwipeComplete}
              cardRef={stackPos === 0 ? activeCardRef : undefined}
            />
          )
        })}
      </div>

      {/* Dot indicators + swipe hint */}
      {n > 1 && (
        <div className="flex flex-col items-center mt-4 gap-2">
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
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            swipe for more quotes
          </p>
        </div>
      )}
    </div>
  )
}
