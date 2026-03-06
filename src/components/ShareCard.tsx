import { type Mood } from '../lib/mood'
import CardContent from './CardContent'

interface ShareCardProps {
  quote: string
  source: string
  subtitle: string
  focus: number
  strain: number
  balance: number
  mood: Mood
  daySummary?: string
  onMetricClick?: (metric: 'performance' | 'resilience' | 'sustainability') => void
}

export default function ShareCard({ quote, source, subtitle, focus, strain, balance, mood, daySummary, onMetricClick }: ShareCardProps) {
  return (
    <CardContent
      quote={quote}
      source={source}
      subtitle={subtitle}
      focus={focus}
      strain={strain}
      balance={balance}
      mood={mood}
      daySummary={daySummary}
      onMetricClick={onMetricClick}
    />
  )
}
