import {
  generateWeeklyInsights,
  generateMonthlyInsights,
  type DailySnapshot,
  type TrendInsight,
} from './generateTrends'

// Shape of the entries useWorkHealth persists to localStorage (internal metric names).
export interface DailyScore {
  date: string // YYYY-MM-DD
  performance: number
  resilience: number
  sustainability: number
}

export interface WeekPoint {
  label: string
  focus: number
  strain: number
  balance: number
}

export interface RealTrends {
  daysTracked: number
  weekly: {
    days: DailySnapshot[]
    insights: TrendInsight[]
    bestDay: string
    worstDay: string
  } | null
  monthly: {
    weeks: WeekPoint[]
    insights: TrendInsight[]
    trend: 'improving' | 'declining' | 'stable'
  } | null
}

export const MIN_WEEKLY_DAYS = 3
export const MIN_MONTHLY_WEEKS = 2

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parseDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

export function buildTrendsFromHistory(
  history: DailyScore[],
  todayISO: string = new Date().toISOString().split('T')[0],
): RealTrends {
  // Dedupe by date (last entry wins), then sort ascending
  const byDate = new Map<string, DailyScore>()
  for (const s of history) byDate.set(s.date, s)
  const scores = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
  const daysTracked = scores.length

  // ---- Weekly: last 7 recorded days ----
  let weekly: RealTrends['weekly'] = null
  if (daysTracked >= MIN_WEEKLY_DAYS) {
    const recent = scores.slice(-7)
    const spanMs = parseDate(recent[recent.length - 1].date).getTime() - parseDate(recent[0].date).getTime()
    // Weekday names are only unambiguous within a 7-day window; fall back to dates for sparse usage
    const useDates = spanMs > 6 * 86400000
    const days: DailySnapshot[] = recent.map((s) => {
      const d = parseDate(s.date)
      return {
        date: useDates ? `${d.getMonth() + 1}/${d.getDate()}` : DAY_NAMES[d.getDay()],
        focus: s.performance,
        strain: s.resilience,
        balance: s.sustainability,
        isToday: s.date === todayISO,
      }
    })
    const latest = recent[recent.length - 1]
    const best = [...days].sort((a, b) => b.focus - a.focus)[0]
    const worst = [...days].sort((a, b) => a.focus - b.focus)[0]
    weekly = {
      days,
      insights: generateWeeklyInsights(
        days,
        latest.performance,
        latest.resilience,
        latest.sustainability,
        days[days.length - 1].date,
      ),
      bestDay: best.date,
      worstDay: worst.date,
    }
  }

  // ---- Monthly: average by calendar week (Monday start), up to last 4 weeks ----
  let monthly: RealTrends['monthly'] = null
  const weekGroups = new Map<string, DailyScore[]>()
  for (const s of scores) {
    const d = parseDate(s.date)
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
    const group = weekGroups.get(key)
    if (group) group.push(s)
    else weekGroups.set(key, [s])
  }
  const weekKeys = [...weekGroups.keys()].sort().slice(-4)
  if (weekKeys.length >= MIN_MONTHLY_WEEKS) {
    const weeks: WeekPoint[] = weekKeys.map((key) => {
      const entries = weekGroups.get(key)!
      const avg = (pick: (s: DailyScore) => number) =>
        Math.round(entries.reduce((sum, s) => sum + pick(s), 0) / entries.length)
      return {
        label: parseDate(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        focus: avg((s) => s.performance),
        strain: avg((s) => s.resilience),
        balance: avg((s) => s.sustainability),
      }
    })
    const first = weeks[0]
    const last = weeks[weeks.length - 1]
    // Composite delta: focus and balance up are good, strain up is bad
    const delta = (last.focus - first.focus) + (last.balance - first.balance) - (last.strain - first.strain)
    const trend: 'improving' | 'declining' | 'stable' = delta >= 10 ? 'improving' : delta <= -10 ? 'declining' : 'stable'
    monthly = { weeks, insights: generateMonthlyInsights(weeks, trend), trend }
  }

  return { daysTracked, weekly, monthly }
}
