'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion'
import { type Mood, MOODS } from '../lib/mood'
import { trackEvent } from '../lib/trackEvent'
import CardContent from './CardContent'
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
  activeCardRef?: (el: HTMLDivElement | null) => void
  onEngagement?: (quote: string, source: string, action: 'share' | 'dwell', dwellMs?: number) => void
}

const SWIPE_THRESHOLD = 60
const SWIPE_VELOCITY = 300
const SWIPE_COOLDOWN_MS = 500

function DraggableCard({
  quote,
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
        quote={quote.quote}
        source={quote.source}
        subtitle={quote.subtitle}
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
  const n = quotes.length

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current)
    }
  }, [])

  useEffect(() => {
    dwellStartRef.current = Date.now()
  }, [currentIndex])

  useEffect(() => {
    if (currentIndex >= n && n > 0) {
      setCurrentIndex(0)
    }
  }, [n, currentIndex])

  const handleSwipeComplete = useCallback((direction: number) => {
    if (onEngagement && quotes[currentIndex]) {
      const dwellMs = Date.now() - dwellStartRef.current
      const q = quotes[currentIndex]
      onEngagement(q.quote, q.source, 'dwell', dwellMs)
      trackEvent('card_swipe', { quote: q.quote, source: q.source, direction, dwellMs })
    }
    setCurrentIndex(prev => (prev + direction + n) % n)
    setCanSwipe(false)
    cooldownRef.current = setTimeout(() => setCanSwipe(true), SWIPE_COOLDOWN_MS)
  }, [n, currentIndex, quotes, onEngagement])

  if (!quotes || n === 0) return null

  return (
    <div className="w-full">
      <div className="overflow-hidden">
        <DraggableCard
          key={currentIndex}
          quote={quotes[currentIndex]}
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
