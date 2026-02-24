'use client'

import { useState, useCallback } from 'react'
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

function QuoteCard({
  quote,
  gradient,
  moodName,
  focus,
  strain,
  balance,
  onMetricClick,
  isTop,
  stackIndex,
  onSwipe,
  cardRef,
}: {
  quote: HeroMessage
  gradient: [string, string]
  moodName: string
  focus: number
  strain: number
  balance: number
  onMetricClick?: (metric: 'performance' | 'resilience' | 'sustainability') => void
  isTop: boolean
  stackIndex: number
  onSwipe: (dir: 'left' | 'right') => void
  cardRef?: (el: HTMLDivElement | null) => void
}) {
  const values = { focus, strain, balance }
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const xVal = info.offset.x
    const vx = info.velocity.x

    if (Math.abs(xVal) > SWIPE_THRESHOLD || Math.abs(vx) > SWIPE_VELOCITY) {
      const dir = xVal > 0 ? 'right' : 'left'
      const flyTo = dir === 'right' ? 400 : -400
      animate(x, flyTo, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        onComplete: () => onSwipe(dir),
      })
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
    }
  }, [x, onSwipe])

  // Cards behind the top card: slightly scaled down and offset
  const behindScale = 1 - stackIndex * 0.04
  const behindY = stackIndex * 8
  const behindOpacity = stackIndex === 0 ? 1 : Math.max(0, 1 - stackIndex * 0.2)

  if (!isTop) {
    return (
      <motion.div
        className="absolute inset-0"
        style={{
          scale: behindScale,
          y: behindY,
          opacity: behindOpacity,
          zIndex: 10 - stackIndex,
        }}
      >
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(to bottom, ${gradient[0]}, ${gradient[1]})`,
            padding: '32px 24px 20px',
          }}
        >
          <CardContent
            quote={quote}
            moodName={moodName}
            values={values}
            onMetricClick={onMetricClick}
          />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity, zIndex: 20 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={cardRef}
        className="w-full rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(to bottom, ${gradient[0]}, ${gradient[1]})`,
          padding: '32px 24px 20px',
        }}
      >
        <CardContent
          quote={quote}
          moodName={moodName}
          values={values}
          onMetricClick={onMetricClick}
        />
      </div>
    </motion.div>
  )
}

function CardContent({
  quote,
  moodName,
  values,
  onMetricClick,
}: {
  quote: HeroMessage
  moodName: string
  values: { focus: number; strain: number; balance: number }
  onMetricClick?: (metric: 'performance' | 'resilience' | 'sustainability') => void
}) {
  return (
    <>
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
    </>
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

  const handleSwipe = useCallback((_dir: 'left' | 'right') => {
    setCurrentIndex(prev => {
      const next = prev + 1
      // Loop back to start when we've gone through all
      return next >= quotes.length ? 0 : next
    })
  }, [quotes.length])

  if (!quotes || quotes.length === 0) return null

  // Show up to 3 cards in the stack (current + 2 behind)
  const visibleCards: { quote: HeroMessage; index: number }[] = []
  for (let i = 0; i < Math.min(3, quotes.length); i++) {
    const idx = (currentIndex + i) % quotes.length
    visibleCards.push({ quote: quotes[idx], index: i })
  }

  return (
    <div className="w-full">
      {/* Card stack */}
      <div className="relative" style={{ minHeight: '320px' }}>
        {visibleCards.reverse().map(({ quote, index }) => (
          <QuoteCard
            key={`${currentIndex}-${index}`}
            quote={quote}
            gradient={gradient}
            moodName={moodName}
            focus={focus}
            strain={strain}
            balance={balance}
            onMetricClick={onMetricClick}
            isTop={index === 0}
            stackIndex={index}
            onSwipe={handleSwipe}
            cardRef={index === 0 ? activeCardRef : undefined}
          />
        ))}
      </div>

      {/* Dot indicators + swipe hint */}
      <div className="flex flex-col items-center mt-4 gap-2">
        <div className="flex gap-1.5">
          {quotes.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentIndex % quotes.length ? 16 : 6,
                height: 6,
                backgroundColor: i === currentIndex % quotes.length
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
    </div>
  )
}
