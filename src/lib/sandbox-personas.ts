import type { Mood } from './mood'

export interface MetricDetail {
  title: string
  message: string
  action: string
}

export interface SandboxSchedule {
  meetingCount: number
  durationHours: number
  meetingRatio: number
  morningMeetings: number
  afternoonMeetings: number
  uniqueContexts: number
  longestStretch: number
  adequateBreaks: number
  shortBreaks: number
  earlyLateMeetings: number
  focusTime: number // minutes
}

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
}

export interface WeeklyTrend {
  days: DailySnapshot[]
  insights: TrendInsight[]
  avgFocus: number
  avgStrain: number
  avgBalance: number
  bestDay: string
  worstDay: string
}

export interface MonthlyTrend {
  weeks: Array<{
    label: string
    focus: number
    strain: number
    balance: number
  }>
  insights: TrendInsight[]
  avgFocus: number
  avgStrain: number
  avgBalance: number
  trend: 'improving' | 'declining' | 'stable'
}

export interface SandboxTrends {
  weekly: WeeklyTrend
  monthly: MonthlyTrend
}

export interface SandboxPersona {
  id: string
  label: string
  dayName: string
  mood: Mood
  focus: number
  strain: number
  balance: number
  narrative: string
  daySummary: string
  quotes: { quote: string; source: string; subtitle: string }[]
  calendar: {
    dayLabel: string
    eventCount: number
    totalHours: number
    events: { time: string; title: string; color: string }[]
  }
  schedule: SandboxSchedule
  metrics: {
    focus: MetricDetail
    strain: MetricDetail
    balance: MetricDetail
  }
  trends: SandboxTrends
}

export const SANDBOX_PERSONAS: SandboxPersona[] = [
  {
    id: 'brutal-tuesday',
    label: 'Brutal Tuesday',
    dayName: 'Tuesday',
    mood: 'survival',
    focus: 14,
    strain: 88,
    balance: 31,
    narrative:
      'Eight meetings with five context switches and zero focus blocks. Your brain spent the whole day in reactive mode — no deep work ever had a chance.',
    daySummary: 'Wall-to-wall meetings left no room to think.',
    quotes: [
      {
        quote: "You know what the happiest animal on Earth is? It's a goldfish. You know why? It's got a 10-second memory.",
        source: 'Ted Lasso · Ted Lasso',
        subtitle: 'Your only viable coping strategy today.',
      },
      {
        quote: "I'm not superstitious, but I am a little stitious.",
        source: 'Michael Scott · The Office',
        subtitle: 'Believing in luck is all you have left after this schedule.',
      },
      {
        quote: "Everything is fine. I'm okay with the events that are unfolding currently.",
        source: 'Jake the Dog · Adventure Time',
        subtitle: 'Said nobody after eight meetings in a row.',
      },
    ],
    calendar: {
      dayLabel: 'Tuesday, Mar 4',
      eventCount: 8,
      totalHours: 7.5,
      events: [
        { time: '9am', title: 'Sprint Planning', color: 'amber' },
        { time: '10', title: 'Design Review', color: 'slate' },
        { time: '11', title: 'Standup', color: 'sage' },
        { time: '1pm', title: 'Client Sync', color: 'rose' },
        { time: '2', title: 'Product Roadmap', color: 'plum' },
        { time: '3', title: '1:1 with Manager', color: 'amber' },
        { time: '4', title: 'Quarterly Review', color: 'rose' },
        { time: '5', title: 'All-Hands', color: 'slate' },
      ],
    },
    schedule: {
      meetingCount: 8,
      durationHours: 7.5,
      meetingRatio: 0.94,
      morningMeetings: 3,
      afternoonMeetings: 5,
      uniqueContexts: 8,
      longestStretch: 5,
      adequateBreaks: 0,
      shortBreaks: 1,
      earlyLateMeetings: 1,
      focusTime: 30,
    },
    metrics: {
      focus: {
        title: 'Deep work: 0 minutes',
        message: 'No uninterrupted block longer than 45 minutes. Eight meetings consumed 7.5 hours, leaving zero time for focused work.',
        action: 'Block 90 minutes before your first meeting tomorrow.',
      },
      strain: {
        title: '5 context switches',
        message: 'Sprint planning → design → standup → client → roadmap → 1:1 → review → all-hands. Your brain paid the switching tax all afternoon.',
        action: 'Group similar meetings on the same day next week.',
      },
      balance: {
        title: '1 break in 7.5 hours',
        message: 'One 30-minute gap in a wall-to-wall day. You needed at least three recovery windows to stay sharp.',
        action: 'Add 15-minute buffers between afternoon meetings.',
      },
    },
    trends: {
      weekly: {
        days: [
          { date: 'Mon', focus: 45, strain: 52, balance: 48 },
          { date: 'Tue', focus: 14, strain: 88, balance: 31 },
          { date: 'Wed', focus: 38, strain: 61, balance: 42 },
          { date: 'Thu', focus: 55, strain: 44, balance: 58 },
          { date: 'Fri', focus: 71, strain: 28, balance: 74 },
        ],
        insights: [
          {
            type: 'negative',
            metric: 'strain',
            title: 'Context switching peaked Tuesday',
            message: 'You jumped between 8 different contexts in one day — quarterly review to client presentation to all-hands to training. Your brain never settled into any single mode. By 2pm, you were running on fumes.',
          },
          {
            type: 'negative',
            metric: 'focus',
            title: 'Three days with under 1 hour of focus time',
            message: "Monday, Tuesday, and Wednesday all had less than 60 minutes of uninterrupted work. That means half your week was spent reacting to other people's agendas, not making progress on your own.",
          },
          {
            type: 'positive',
            metric: 'balance',
            title: 'Friday was a different person',
            message: "Your Friday had 3 hours of focus time, no back-to-backs, and Strain dropped to 28. Whatever you did differently — protect that. That's your template for a sustainable day.",
          },
          {
            type: 'negative',
            metric: 'strain',
            title: 'Back-to-back chains are wearing you down',
            message: 'You had 4+ consecutive meetings on both Tuesday and Wednesday. After the third meeting without a break, decision quality drops measurably. Even a 10-minute buffer between meetings would help.',
          },
        ],
        avgFocus: 45,
        avgStrain: 55,
        avgBalance: 51,
        bestDay: 'Friday',
        worstDay: 'Tuesday',
      },
      monthly: {
        weeks: [
          { label: 'Week 1', focus: 52, strain: 48, balance: 55 },
          { label: 'Week 2', focus: 44, strain: 56, balance: 47 },
          { label: 'Week 3', focus: 39, strain: 62, balance: 41 },
          { label: 'Week 4', focus: 45, strain: 55, balance: 51 },
        ],
        insights: [
          {
            type: 'negative',
            metric: 'focus',
            title: 'Focus has eroded every week',
            message: "Week 1 you averaged 52 Focus. By week 4 you're at 45. That's not a bad day — that's a trend. Meeting load has been creeping up, and your deep work time is paying the price. Something got added to your calendar in week 2 that never came off.",
          },
          {
            type: 'negative',
            metric: 'strain',
            title: 'Your afternoons are a decision fatigue factory',
            message: "Three out of four weeks, over 60% of your meetings landed after 1pm — right when willpower and cognitive reserve are lowest. The mornings look light, but by the time you could do deep work, your brain is already cooked from the afternoon gauntlet.",
          },
          {
            type: 'neutral',
            metric: 'balance',
            title: 'No week broke 55 Balance',
            message: "Balance has been stable, but stable at mediocre. You never had a recovery week — no week with fewer than 4 meetings per day on average. Your calendar doesn't have a rhythm, it has a constant hum. That's the definition of slow burnout.",
          },
        ],
        avgFocus: 45,
        avgStrain: 55,
        avgBalance: 49,
        trend: 'declining',
      },
    },
  },
  {
    id: 'mid-wednesday',
    label: 'Mid Wednesday',
    dayName: 'Wednesday',
    mood: 'autopilot',
    focus: 52,
    strain: 55,
    balance: 48,
    narrative:
      'A few meetings, a few breaks, nothing remarkable. You stayed busy without being productive — the calendar equivalent of treading water.',
    daySummary: 'Meetings scattered just enough to prevent real focus.',
    quotes: [
      {
        quote: "It's a living.",
        source: 'Every Hanna-Barbera character ever',
        subtitle: 'Wednesday in four syllables.',
      },
      {
        quote: "I am Beyoncé, always.",
        source: 'Michael Scott · The Office',
        subtitle: 'Manifesting a better Thursday from your mid-week plateau.',
      },
      {
        quote: "Not great, Bob!",
        source: 'Pete Campbell · Mad Men',
        subtitle: 'Accurate summary of a day that was fine, technically.',
      },
    ],
    calendar: {
      dayLabel: 'Wednesday, Mar 5',
      eventCount: 5,
      totalHours: 5,
      events: [
        { time: '9am', title: 'Team Standup', color: 'sage' },
        { time: '10', title: 'Project Check-in', color: 'amber' },
        { time: '12', title: 'Lunch & Learn', color: 'plum' },
        { time: '2pm', title: 'Sprint Retro', color: 'slate' },
        { time: '4', title: 'Slack Catch-up', color: 'amber' },
      ],
    },
    schedule: {
      meetingCount: 5,
      durationHours: 5,
      meetingRatio: 0.63,
      morningMeetings: 3,
      afternoonMeetings: 2,
      uniqueContexts: 5,
      longestStretch: 2,
      adequateBreaks: 1,
      shortBreaks: 2,
      earlyLateMeetings: 0,
      focusTime: 120,
    },
    metrics: {
      focus: {
        title: 'Fragmented focus blocks',
        message: 'Meetings at 9, 10, 12, 2, and 4 broke the day into short chunks. You had time between them, but never enough to get deep.',
        action: 'Cluster meetings into a morning or afternoon block.',
      },
      strain: {
        title: '3 context switches',
        message: 'Standup → check-in → lunch & learn → retro → catch-up. Moderate switching, but the scattered timing prevented any real momentum.',
        action: 'Try to batch similar meetings back-to-back.',
      },
      balance: {
        title: 'Gaps too short to recover',
        message: 'You had breaks between meetings, but most were under an hour — enough to check Slack, not enough to recharge.',
        action: 'Protect one 2-hour block for uninterrupted work.',
      },
    },
    trends: {
      weekly: {
        days: [
          { date: 'Mon', focus: 58, strain: 40, balance: 55 },
          { date: 'Tue', focus: 48, strain: 50, balance: 49 },
          { date: 'Wed', focus: 52, strain: 44, balance: 55 },
          { date: 'Thu', focus: 61, strain: 38, balance: 62 },
          { date: 'Fri', focus: 55, strain: 42, balance: 58 },
        ],
        insights: [
          {
            type: 'neutral',
            metric: 'focus',
            title: 'Focus never cracked 65 all week',
            message: "Your best day was Thursday at 61. You never hit a real flow state because every day had meetings scattered just frequently enough to interrupt any momentum. It's not that your schedule was heavy — it was fragmented.",
          },
          {
            type: 'neutral',
            metric: 'strain',
            title: 'Moderate strain, but it never lets up',
            message: "No day above 50 Strain looks healthy on paper. But no day below 38 either. Your brain is never overloaded, but it's never fully resting. That's the autopilot zone — you can sustain it, but you're not doing your best work in it.",
          },
          {
            type: 'positive',
            metric: 'balance',
            title: 'Thursday had the right structure',
            message: "Two meetings before lunch, a clean break, then one meeting in the afternoon with a focus block after. That day hit 62 Balance — your best this week. The difference wasn't fewer meetings, it was better spacing.",
          },
          {
            type: 'neutral',
            metric: 'strain',
            title: 'Context switching is consistent but present',
            message: "You shifted between 3-5 different contexts every day. Not terrible, but enough to prevent the deep concentration that produces breakthrough work. You're doing a lot of things adequately instead of one thing brilliantly.",
          },
        ],
        avgFocus: 55,
        avgStrain: 43,
        avgBalance: 56,
        bestDay: 'Thursday',
        worstDay: 'Tuesday',
      },
      monthly: {
        weeks: [
          { label: 'Week 1', focus: 54, strain: 44, balance: 56 },
          { label: 'Week 2', focus: 56, strain: 42, balance: 58 },
          { label: 'Week 3', focus: 53, strain: 45, balance: 54 },
          { label: 'Week 4', focus: 55, strain: 43, balance: 56 },
        ],
        insights: [
          {
            type: 'neutral',
            metric: 'focus',
            title: 'Four identical weeks',
            message: "Focus varied only 3 points across the entire month — 53 to 56. That level of consistency usually means your calendar is on autopilot. Same recurring meetings, same structure, same results. Nothing is getting worse, but nothing is getting better because nothing is changing.",
          },
          {
            type: 'neutral',
            metric: 'balance',
            title: 'You never had a great week or a terrible one',
            message: "Balance ranged from 54 to 58 all month. There's no week where you clearly recharged. Compare this to someone with a Dream Friday pattern — they regularly hit 75+ Balance because they have at least one light day per week. You don't have that release valve.",
          },
          {
            type: 'positive',
            metric: 'strain',
            title: 'No burnout spikes',
            message: "Strain stayed between 42-45 every week. You're not at risk of acute burnout, which is genuinely good. The risk for your pattern is chronic mediocrity — performing at 60% capacity indefinitely because there's never enough friction to force a change.",
          },
        ],
        avgFocus: 55,
        avgStrain: 44,
        avgBalance: 56,
        trend: 'stable',
      },
    },
  },
  {
    id: 'dream-friday',
    label: 'Dream Friday',
    dayName: 'Friday',
    mood: 'flow',
    focus: 91,
    strain: 18,
    balance: 85,
    narrative:
      'Two short meetings, two long focus blocks, and an early wrap. This is what a calendar should look like — your brain had space to actually do the work.',
    daySummary: 'Long focus blocks and an early finish.',
    quotes: [
      {
        quote: "I'm having an experience.",
        source: 'Alexis Rose · Schitt\'s Creek',
        subtitle: 'The experience is called productivity.',
      },
      {
        quote: "Clear eyes, full hearts, can't lose.",
        source: 'Coach Taylor · Friday Night Lights',
        subtitle: 'Your calendar finally let you play the game.',
      },
      {
        quote: "I wish there was a way to know you're in the good old days before you've actually left them.",
        source: 'Andy Bernard · The Office',
        subtitle: 'Screenshot this schedule before Monday ruins it.',
      },
    ],
    calendar: {
      dayLabel: 'Friday, Mar 7',
      eventCount: 2,
      totalHours: 1.5,
      events: [
        { time: '10am', title: 'Weekly Sync', color: 'sage' },
        { time: '2pm', title: '1:1 with Lead', color: 'amber' },
      ],
    },
    schedule: {
      meetingCount: 2,
      durationHours: 1.5,
      meetingRatio: 0.19,
      morningMeetings: 1,
      afternoonMeetings: 1,
      uniqueContexts: 2,
      longestStretch: 1,
      adequateBreaks: 3,
      shortBreaks: 0,
      earlyLateMeetings: 0,
      focusTime: 330,
    },
    metrics: {
      focus: {
        title: '5+ hours of deep work',
        message: 'Two meetings, both short, with long uninterrupted blocks before and after. This is what a focus-friendly calendar looks like.',
        action: 'Replicate this pattern: meetings mid-morning, deep work bookends.',
      },
      strain: {
        title: '1 context switch',
        message: 'Weekly sync → focus → 1:1 → done. Minimal switching meant your brain stayed in one mode most of the day.',
        action: 'This is the benchmark. Compare future days to this one.',
      },
      balance: {
        title: 'Early wrap, full recovery',
        message: 'Only 1.5 hours of meetings left the rest of the day wide open. Plenty of time for both work and recovery.',
        action: 'Aim for at least one day like this per week.',
      },
    },
    trends: {
      weekly: {
        days: [
          { date: 'Mon', focus: 72, strain: 30, balance: 75 },
          { date: 'Tue', focus: 65, strain: 38, balance: 68 },
          { date: 'Wed', focus: 78, strain: 24, balance: 80 },
          { date: 'Thu', focus: 70, strain: 32, balance: 72 },
          { date: 'Fri', focus: 88, strain: 18, balance: 91 },
        ],
        insights: [
          {
            type: 'positive',
            metric: 'focus',
            title: 'Every day had 2+ hours of deep work',
            message: "Not a single day this week had your focus time fragmented below 2 hours. That's rare. Most people get one good focus day per week — you got five. The difference is you're protecting calendar blocks, not hoping for gaps.",
          },
          {
            type: 'positive',
            metric: 'strain',
            title: 'Context switching stayed below 3 per day',
            message: "Your brain didn't have to gear-shift more than twice on most days. That means when you started something, you could finish it. That's not just comfortable — it's where your highest-quality work happens.",
          },
          {
            type: 'positive',
            metric: 'balance',
            title: 'Friday was exceptional — but Tuesday was still good',
            message: "Even your \"worst\" day (Tuesday, 65 Focus) would be the best day for someone in a Brutal Tuesday pattern. The floor of your week is higher than most people's ceiling. That's what sustainable performance looks like.",
          },
          {
            type: 'positive',
            metric: 'balance',
            title: 'Your meeting-to-focus ratio is ideal',
            message: "You averaged 2.4 meetings per day with 3+ hours of focus time. Research suggests the optimal ratio is 1 hour of meetings for every 2 hours of focus. You're right in that zone.",
          },
        ],
        avgFocus: 75,
        avgStrain: 28,
        avgBalance: 77,
        bestDay: 'Friday',
        worstDay: 'Tuesday',
      },
      monthly: {
        weeks: [
          { label: 'Week 1', focus: 62, strain: 40, balance: 64 },
          { label: 'Week 2', focus: 68, strain: 34, balance: 70 },
          { label: 'Week 3', focus: 72, strain: 30, balance: 74 },
          { label: 'Week 4', focus: 75, strain: 28, balance: 77 },
        ],
        insights: [
          {
            type: 'positive',
            metric: 'focus',
            title: 'Focus improved 13 points in 4 weeks',
            message: "You went from 62 to 75 Focus over the month. That didn't happen by accident — you actively reduced meeting load and protected focus blocks. The trajectory matters more than any single day. If you keep this up, you'll sustain 80+ Focus weeks routinely.",
          },
          {
            type: 'positive',
            metric: 'strain',
            title: 'You systematically cut cognitive load',
            message: "Strain dropped from 40 to 28 over four weeks. That's fewer back-to-backs, fewer afternoon-heavy days, and fewer meetings with 10+ attendees. You didn't just get lucky with lighter weeks — you made structural changes that compound.",
          },
          {
            type: 'positive',
            metric: 'balance',
            title: 'This pace is actually repeatable',
            message: "Balance climbed from 64 to 77, and the trend is still going up. The sign of a sustainable pattern isn't one great week — it's four weeks where each one is slightly better than the last. You're not sprinting into a wall. You're building a rhythm that lasts.",
          },
        ],
        avgFocus: 69,
        avgStrain: 33,
        avgBalance: 71,
        trend: 'improving',
      },
    },
  },
]

export function getSandboxPersona(id: string): SandboxPersona | undefined {
  return SANDBOX_PERSONAS.find((p) => p.id === id)
}
