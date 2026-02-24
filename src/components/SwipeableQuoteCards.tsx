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
}

/**
 * Each card computes its visual state from `stackPos`:
 *   0 = top card (draggable, relative — sizes the container)
 *   1,2 = behind cards (scaled down, absolute)
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
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12])
  const dragOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])

  // Reset x when this card becomes the top card (coming from behind)
  const wasTop = useRef(isTop)
  useEffect(() => {
    if (isTop && !wasTop.current) {
      x.set(0)
    }
    wasTop.current = isTop
  }, [isTop, x])

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

  const contentProps = { quote, gradient, moodName, focus, strain, balance, onMetricClick }

  // Hidden cards
  if (stackPos >= 3) {
    return null
  }

  // Top card: relative (in flow — sizes the container), draggable
  if (isTop) {
    return (
      <motion.div
        className="relative cursor-grab active:cursor-grabbing"
        style={{ x, rotate, opacity: dragOpacity, zIndex: 20 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
      >
        <CardContent {...contentProps} cardRef={cardRef} />
      </motion.div>
    )
  }

  // Behind cards: absolute, scaled down + offset to create stack peek
  return (
    <motion.div
      className="absolute top-0 left-0 right-0"
      initial={false}
      animate={{
        scale: 1 - stackPos * 0.04,
        y: stackPos * 8,
        opacity: Math.max(0, 1 - stackPos * 0.2),
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      style={{ zIndex: 10 - stackPos }}
    >
      <CardContent {...contentProps} />
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
      {/* Card stack — overflow-hidden clips swiped cards */}
      <div className="relative overflow-hidden pb-4">
        {quotes.map((quote, i) => {
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
        <div className="flex flex-col items-center mt-2 gap-2">
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
