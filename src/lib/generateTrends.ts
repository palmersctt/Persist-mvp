export interface TrendInsight {
  type: 'positive' | 'negative' | 'neutral'
  metric: 'focus' | 'strain' | 'balance'
  title: string
  message: string
}

export interface DailySnapshot {
  date: string
  focus: number
  strain: number
  balance: number
  isToday?: boolean
}

export interface GeneratedTrends {
  weekly: {
    days: DailySnapshot[]
    insights: TrendInsight[]
    bestDay: string
    worstDay: string
  }
  monthly: {
    weeks: Array<{ label: string; focus: number; strain: number; balance: number }>
    insights: TrendInsight[]
    trend: 'improving' | 'declining' | 'stable'
  }
}

export function vary(base: number, range: number): number {
  const v = base + Math.round((Math.random() - 0.5) * range * 2)
  return Math.min(100, Math.max(5, v))
}

export function generateWeeklyInsights(
  days: DailySnapshot[],
  todayFocus: number,
  todayStrain: number,
  todayBalance: number,
  todayLabel: string,
): TrendInsight[] {
  const insights: TrendInsight[] = []
  const avgFocus = Math.round(days.reduce((s, d) => s + d.focus, 0) / days.length)
  const avgStrain = Math.round(days.reduce((s, d) => s + d.strain, 0) / days.length)
  const best = [...days].sort((a, b) => b.focus - a.focus)[0]
  const worst = [...days].sort((a, b) => a.focus - b.focus)[0]

  if (todayFocus <= 35) {
    insights.push({ type: 'negative', metric: 'focus', title: `${todayLabel} was your hardest day for focus`, message: `At ${todayFocus} Focus, your schedule left almost no room for deep work. Compare that to ${best.date} at ${best.focus} — what was different? Fewer meetings, better spacing, or just fewer back-to-backs can shift the number dramatically.` })
  } else if (todayFocus >= 75) {
    insights.push({ type: 'positive', metric: 'focus', title: `${todayLabel} is your strongest day this week`, message: `${todayFocus} Focus means your schedule gave you real room to think. If every day looked like this, you'd be operating in a completely different gear. Look at what made today work and protect that structure.` })
  } else {
    insights.push({ type: 'neutral', metric: 'focus', title: `Focus ranged from ${worst.focus} to ${best.focus} this week`, message: `You averaged ${avgFocus} Focus across the week. That's enough to get things done but not enough to produce your best work. The gap between your best and worst day suggests your calendar structure varies a lot — consistency would help.` })
  }

  if (todayStrain >= 60) {
    insights.push({ type: 'negative', metric: 'strain', title: 'High cognitive load is compounding', message: `${todayStrain} Strain means context switching, back-to-backs, and decision fatigue are stacking up. Even one 15-minute buffer between meetings would give your working memory a chance to reset.` })
  } else if (todayStrain <= 25) {
    insights.push({ type: 'positive', metric: 'strain', title: 'Low strain — your brain has room to breathe', message: `${todayStrain} Strain means you're not fighting your calendar today. Your cognitive reserve is high, context switches are low, and you're not burning willpower just to keep up.` })
  } else {
    insights.push({ type: 'neutral', metric: 'strain', title: 'Moderate strain all week', message: `Averaging ${avgStrain} Strain means you're never overwhelmed but never fully resting either. You're in the autopilot zone — sustainable but not where breakthrough work happens.` })
  }

  if (todayBalance >= 70) {
    insights.push({ type: 'positive', metric: 'balance', title: 'Sustainable pace today', message: `${todayBalance} Balance means your day has rhythm — work blocks, then breathing room, then work again. This pattern is repeatable.` })
  } else if (todayBalance <= 40) {
    insights.push({ type: 'negative', metric: 'balance', title: 'This pace is hard to sustain', message: `${todayBalance} Balance means your schedule has no recovery built in. One day like this is fine — a week of it leads to that Friday afternoon feeling where you can't remember what you actually accomplished.` })
  } else {
    insights.push({ type: 'neutral', metric: 'balance', title: `${best.date} had the right structure`, message: `Your best day hit ${best.balance} Balance. The difference usually isn't fewer meetings — it's better spacing. Two meetings with a focus block between them feel completely different from two meetings back-to-back.` })
  }

  return insights
}

export function generateMonthlyInsights(
  weeks: Array<{ label: string; focus: number; strain: number; balance: number }>,
  trend: 'improving' | 'declining' | 'stable',
): TrendInsight[] {
  const insights: TrendInsight[] = []

  if (trend === 'declining') {
    insights.push({ type: 'negative', metric: 'focus', title: 'Focus has been sliding', message: `You started the month at ${weeks[0].focus} Focus and you're at ${weeks[3].focus} now. That's not a bad day — that's a trend. Something changed in your calendar and your deep work time has been paying the price.` })
    insights.push({ type: 'negative', metric: 'strain', title: 'Cognitive load is creeping up', message: `Strain went from ${weeks[0].strain} to ${weeks[3].strain} over four weeks. It happens gradually — each week is only slightly worse, so you don't notice until you're exhausted.` })
    insights.push({ type: 'neutral', metric: 'balance', title: 'No recovery week in sight', message: `Balance dropped from ${weeks[0].balance} to ${weeks[3].balance}. You haven't had a single week this month where things got meaningfully lighter.` })
  } else if (trend === 'improving') {
    insights.push({ type: 'positive', metric: 'focus', title: `Focus improved ${weeks[3].focus - weeks[0].focus} points this month`, message: `You went from ${weeks[0].focus} to ${weeks[3].focus} Focus. Fewer meetings, better-protected focus blocks, or both. The trajectory matters more than any single day.` })
    insights.push({ type: 'positive', metric: 'strain', title: 'You systematically cut cognitive load', message: `Strain dropped from ${weeks[0].strain} to ${weeks[3].strain}. Fewer back-to-backs, fewer afternoon-heavy days, and less context switching.` })
    insights.push({ type: 'positive', metric: 'balance', title: 'This pace is actually repeatable', message: `Balance climbed from ${weeks[0].balance} to ${weeks[3].balance}. The sign of sustainability isn't one great week — it's four weeks where each one is slightly better than the last.` })
  } else {
    insights.push({ type: 'neutral', metric: 'focus', title: 'Four very similar weeks', message: `Focus stayed between ${Math.min(...weeks.map(w => w.focus))} and ${Math.max(...weeks.map(w => w.focus))} all month. Same recurring meetings, same structure, same results. Nothing is getting worse, but nothing is getting better.` })
    insights.push({ type: 'neutral', metric: 'balance', title: 'No breakout week', message: `Balance ranged from ${Math.min(...weeks.map(w => w.balance))} to ${Math.max(...weeks.map(w => w.balance))}. You don't have a release valve — no light day that lets you recharge.` })
    insights.push({ type: 'positive', metric: 'strain', title: 'No burnout spikes', message: `Strain stayed stable all month — no week above ${Math.max(...weeks.map(w => w.strain))}. You're not at risk of acute burnout, which is genuinely good.` })
  }

  return insights
}

export function generateTrendsFromScore(focus: number, strain: number, balance: number): GeneratedTrends {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const todayIndex = new Date().getDay()
  const todayLabel = todayIndex >= 1 && todayIndex <= 5 ? dayNames[todayIndex - 1] : 'Wed'

  const days: DailySnapshot[] = dayNames.map((name) => {
    if (name === todayLabel) return { date: name, focus, strain, balance, isToday: true }
    return { date: name, focus: vary(focus, 18), strain: vary(strain, 16), balance: vary(balance, 15) }
  })

  const bestDay = [...days].sort((a, b) => b.focus - a.focus)[0]
  const worstDay = [...days].sort((a, b) => a.focus - b.focus)[0]
  const weeklyInsights = generateWeeklyInsights(days, focus, strain, balance, todayLabel)

  const monthlyTrend: 'improving' | 'declining' | 'stable' = strain >= 55 ? 'declining' : balance >= 70 ? 'improving' : 'stable'
  const weeklyAvgFocus = Math.round(days.reduce((s, d) => s + d.focus, 0) / days.length)
  const weeklyAvgStrain = Math.round(days.reduce((s, d) => s + d.strain, 0) / days.length)
  const weeklyAvgBalance = Math.round(days.reduce((s, d) => s + d.balance, 0) / days.length)

  let monthlyWeeks: Array<{ label: string; focus: number; strain: number; balance: number }>
  if (monthlyTrend === 'declining') {
    monthlyWeeks = [
      { label: 'Week 1', focus: vary(weeklyAvgFocus + 12, 5), strain: vary(strain - 14, 5), balance: vary(balance + 10, 5) },
      { label: 'Week 2', focus: vary(weeklyAvgFocus + 6, 5), strain: vary(strain - 8, 5), balance: vary(balance + 5, 5) },
      { label: 'Week 3', focus: vary(weeklyAvgFocus - 2, 5), strain: vary(strain + 2, 5), balance: vary(balance - 2, 5) },
      { label: 'Week 4', focus: weeklyAvgFocus, strain: weeklyAvgStrain, balance: weeklyAvgBalance },
    ]
  } else if (monthlyTrend === 'improving') {
    monthlyWeeks = [
      { label: 'Week 1', focus: vary(weeklyAvgFocus - 14, 5), strain: vary(strain + 15, 5), balance: vary(balance - 12, 5) },
      { label: 'Week 2', focus: vary(weeklyAvgFocus - 8, 5), strain: vary(strain + 8, 5), balance: vary(balance - 6, 5) },
      { label: 'Week 3', focus: vary(weeklyAvgFocus - 3, 5), strain: vary(strain + 3, 5), balance: vary(balance - 2, 5) },
      { label: 'Week 4', focus: weeklyAvgFocus, strain: weeklyAvgStrain, balance: weeklyAvgBalance },
    ]
  } else {
    monthlyWeeks = [
      { label: 'Week 1', focus: vary(weeklyAvgFocus, 5), strain: vary(strain, 5), balance: vary(balance, 5) },
      { label: 'Week 2', focus: vary(weeklyAvgFocus, 4), strain: vary(strain, 4), balance: vary(balance, 4) },
      { label: 'Week 3', focus: vary(weeklyAvgFocus, 3), strain: vary(strain, 3), balance: vary(balance, 3) },
      { label: 'Week 4', focus: weeklyAvgFocus, strain: weeklyAvgStrain, balance: weeklyAvgBalance },
    ]
  }

  const monthlyInsights = generateMonthlyInsights(monthlyWeeks, monthlyTrend)

  return {
    weekly: { days, insights: weeklyInsights, bestDay: bestDay.date, worstDay: worstDay.date },
    monthly: { weeks: monthlyWeeks, insights: monthlyInsights, trend: monthlyTrend },
  }
}
