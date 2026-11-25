export interface TrendInsight {
  type: 'positive' | 'negative' | 'neutral';
  metric: 'focus' | 'strain' | 'balance';
  title: string;
  message: string;
}

export interface DailySnapshot {
  date: string;
  focus: number;
  strain: number;
  balance: number;
  isToday?: boolean;
}

export function generateWeeklyInsights(
  days: DailySnapshot[],
  todayFocus: number,
  todayStrain: number,
  todayBalance: number,
  todayLabel: string
): TrendInsight[] {
  const insights: TrendInsight[] = [];
  const avgFocus = Math.round(days.reduce((s, d) => s + d.focus, 0) / days.length);
  const avgStrain = Math.round(days.reduce((s, d) => s + d.strain, 0) / days.length);
  const best = [...days].sort((a, b) => b.focus - a.focus)[0];
  const worst = [...days].sort((a, b) => a.focus - b.focus)[0];

  if (todayFocus <= 35) {
    insights.push({
      type: 'negative',
      metric: 'focus',
      title: `${todayLabel} was your hardest day for focus`,
      message: `At ${todayFocus} Focus, your schedule left almost no room for deep work. Compare that to ${best.date} at ${best.focus} — what was different? Fewer meetings, better spacing, or just fewer back-to-backs can shift the number dramatically.`,
    });
  } else if (todayFocus >= 75) {
    insights.push({
      type: 'positive',
      metric: 'focus',
      title: `${todayLabel} is your strongest day this week`,
      message: `${todayFocus} Focus means your schedule gave you real room to think. If every day looked like this, you'd be operating in a completely different gear. Look at what made today work and protect that structure.`,
    });
  } else {
    insights.push({
      type: 'neutral',
      metric: 'focus',
      title: `Focus ranged from ${worst.focus} to ${best.focus} this week`,
      message: `You averaged ${avgFocus} Focus across the week. That's enough to get things done but not enough to produce your best work. The gap between your best and worst day suggests your calendar structure varies a lot — consistency would help.`,
    });
  }

  if (todayStrain >= 60) {
    insights.push({
      type: 'negative',
      metric: 'strain',
      title: 'High cognitive load is compounding',
      message: `${todayStrain} Strain means context switching, back-to-backs, and decision fatigue are stacking up. Even one 15-minute buffer between meetings would give your working memory a chance to reset.`,
    });
  } else if (todayStrain <= 25) {
    insights.push({
      type: 'positive',
      metric: 'strain',
      title: 'Low strain — your brain has room to breathe',
      message: `${todayStrain} Strain means you're not fighting your calendar today. Your cognitive reserve is high, context switches are low, and you're not burning willpower just to keep up.`,
    });
  } else {
    insights.push({
      type: 'neutral',
      metric: 'strain',
      title: 'Moderate strain all week',
      message: `Averaging ${avgStrain} Strain means you're never overwhelmed but never fully resting either. You're in the autopilot zone — sustainable but not where breakthrough work happens.`,
    });
  }

  if (todayBalance >= 70) {
    insights.push({
      type: 'positive',
      metric: 'balance',
      title: 'Sustainable pace today',
      message: `${todayBalance} Balance means your day has rhythm — work blocks, then breathing room, then work again. This pattern is repeatable.`,
    });
  } else if (todayBalance <= 40) {
    insights.push({
      type: 'negative',
      metric: 'balance',
      title: 'This pace is hard to sustain',
      message: `${todayBalance} Balance means your schedule has no recovery built in. One day like this is fine — a week of it leads to that Friday afternoon feeling where you can't remember what you actually accomplished.`,
    });
  } else {
    insights.push({
      type: 'neutral',
      metric: 'balance',
      title: `${best.date} had the right structure`,
      message: `Your best day hit ${best.balance} Balance. The difference usually isn't fewer meetings — it's better spacing. Two meetings with a focus block between them feel completely different from two meetings back-to-back.`,
    });
  }

  return insights;
}

export function generateMonthlyInsights(
  weeks: Array<{ label: string; focus: number; strain: number; balance: number }>,
  trend: 'improving' | 'declining' | 'stable'
): TrendInsight[] {
  const insights: TrendInsight[] = [];
  const first = weeks[0];
  const last = weeks[weeks.length - 1];
  const span = weeks.length;

  if (trend === 'declining') {
    insights.push({
      type: 'negative',
      metric: 'focus',
      title: 'Focus has been sliding',
      message: `You started the month at ${first.focus} Focus and you're at ${last.focus} now. That's not a bad day — that's a trend. Something changed in your calendar and your deep work time has been paying the price.`,
    });
    insights.push({
      type: 'negative',
      metric: 'strain',
      title: 'Cognitive load is creeping up',
      message: `Strain went from ${first.strain} to ${last.strain} over ${span} weeks. It happens gradually — each week is only slightly worse, so you don't notice until you're exhausted.`,
    });
    insights.push({
      type: 'neutral',
      metric: 'balance',
      title: 'No recovery week in sight',
      message: `Balance dropped from ${first.balance} to ${last.balance}. You haven't had a single week this month where things got meaningfully lighter.`,
    });
  } else if (trend === 'improving') {
    insights.push({
      type: 'positive',
      metric: 'focus',
      title: `Focus improved ${last.focus - first.focus} points this month`,
      message: `You went from ${first.focus} to ${last.focus} Focus. Fewer meetings, better-protected focus blocks, or both. The trajectory matters more than any single day.`,
    });
    insights.push({
      type: 'positive',
      metric: 'strain',
      title: 'You systematically cut cognitive load',
      message: `Strain dropped from ${first.strain} to ${last.strain}. Fewer back-to-backs, fewer afternoon-heavy days, and less context switching.`,
    });
    insights.push({
      type: 'positive',
      metric: 'balance',
      title: 'This pace is actually repeatable',
      message: `Balance climbed from ${first.balance} to ${last.balance}. The sign of sustainability isn't one great week — it's ${span} weeks where each one is slightly better than the last.`,
    });
  } else {
    insights.push({
      type: 'neutral',
      metric: 'focus',
      title: `${span} very similar weeks`,
      message: `Focus stayed between ${Math.min(...weeks.map((w) => w.focus))} and ${Math.max(...weeks.map((w) => w.focus))} all month. Same recurring meetings, same structure, same results. Nothing is getting worse, but nothing is getting better.`,
    });
    insights.push({
      type: 'neutral',
      metric: 'balance',
      title: 'No breakout week',
      message: `Balance ranged from ${Math.min(...weeks.map((w) => w.balance))} to ${Math.max(...weeks.map((w) => w.balance))}. You don't have a release valve — no light day that lets you recharge.`,
    });
    insights.push({
      type: 'positive',
      metric: 'strain',
      title: 'No burnout spikes',
      message: `Strain stayed stable all month — no week above ${Math.max(...weeks.map((w) => w.strain))}. You're not at risk of acute burnout, which is genuinely good.`,
    });
  }

  return insights;
}
