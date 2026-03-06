export type Mood =
  | 'survival'
  | 'grinding'
  | 'scattered'
  | 'autopilot'
  | 'coasting'
  | 'locked-in'
  | 'flow'
  | 'victory'

export interface MoodConfig {
  name: string
  gradient: [string, string]
  textColor: 'light' | 'dark'
}

export const MOODS: Record<Mood, MoodConfig> = {
  survival:   { name: 'Survival Mode', gradient: ['#1C1917', '#57534E'], textColor: 'light' },
  grinding:   { name: 'Grinding',      gradient: ['#57534E', '#1C1917'], textColor: 'light' },
  scattered:  { name: 'Scattered',     gradient: ['#A8A29E', '#57534E'], textColor: 'light' },
  autopilot:  { name: 'Autopilot',     gradient: ['#57534E', '#1C1917'], textColor: 'light' },
  coasting:   { name: 'Coasting',      gradient: ['#E7E0D8', '#A8A29E'], textColor: 'dark' },
  'locked-in':{ name: 'Locked In',     gradient: ['#E87D3A', '#57534E'], textColor: 'light' },
  flow:       { name: 'Flow State',    gradient: ['#FDF0E6', '#FBF7F2'], textColor: 'dark' },
  victory:    { name: 'Victory Lap',   gradient: ['#E87D3A', '#1C1917'], textColor: 'light' },
}

export type MoodTier = 'bad' | 'ok' | 'good'

export const MOOD_TIERS: Record<MoodTier, Mood[]> = {
  bad:  ['survival', 'grinding', 'scattered'],
  ok:   ['autopilot', 'coasting'],
  good: ['locked-in', 'flow', 'victory'],
}

/** Look up which tier a mood belongs to. */
export function getMoodTier(mood: Mood): MoodTier {
  for (const [tier, moods] of Object.entries(MOOD_TIERS) as [MoodTier, Mood[]][]) {
    if (moods.includes(mood)) return tier
  }
  return 'ok'
}

/** Classify scores into a broad tier. */
function detectTier(focus: number, strain: number, balance: number): MoodTier {
  // Good day: strong focus with manageable strain
  if (focus >= 85 && strain <= 30 && balance >= 80) return 'good'
  if (focus >= 90 && strain <= 20)                   return 'good'
  if (focus >= 80 && balance >= 70)                  return 'good'
  if (focus >= 70 && strain <= 50)                   return 'good'
  if (focus >= 65 && strain <= 35)                   return 'good'

  // Bad day: high strain or very low focus/balance
  if (strain >= 80 && focus <= 40)                   return 'bad'
  if (strain >= 75 && balance <= 35)                 return 'bad'
  if (focus <= 40 && balance <= 50)                  return 'bad'
  if (strain >= 60 && focus <= 50)                   return 'bad'
  if (strain >= 70 && focus <= 65)                   return 'bad'
  if (strain >= 50 && balance <= 45)                 return 'bad'
  if (balance <= 40 && focus >= 50)                  return 'bad'

  // Everything else is an OK day
  return 'ok'
}

/** Pick a mood from the tier, rotating daily. Stable for same inputs on the same day. */
function stablePick(tier: MoodTier, focus: number, strain: number, balance: number): Mood {
  const moods = MOOD_TIERS[tier]
  const now = new Date()
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  )
  const hash = dayOfYear * 31 + Math.round(focus) * 7 + Math.round(strain) * 13 + Math.round(balance) * 17
  return moods[Math.abs(hash) % moods.length]
}

/** Detect mood tier from scores, then pick a rotating mood within that tier. */
export function detectMood(focus: number, strain: number, balance: number): Mood {
  const tier = detectTier(focus, strain, balance)
  return stablePick(tier, focus, strain, balance)
}
