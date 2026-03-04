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
}

export const MOODS: Record<Mood, MoodConfig> = {
  survival:   { name: 'Survival Mode', gradient: ['#ef4444', '#991b1b'] },
  grinding:   { name: 'Grinding',      gradient: ['#f97316', '#9a3412'] },
  scattered:  { name: 'Scattered',     gradient: ['#e85d4a', '#7c2d12'] },
  autopilot:  { name: 'Autopilot',     gradient: ['#64748b', '#1e293b'] },
  coasting:   { name: 'Coasting',      gradient: ['#3b82f6', '#1e3a5f'] },
  'locked-in':{ name: 'Locked In',     gradient: ['#8b5cf6', '#4c1d95'] },
  flow:       { name: 'Flow State',    gradient: ['#10b981', '#064e3b'] },
  victory:    { name: 'Victory Lap',   gradient: ['#ec4899', '#581c87'] },
}

/** Priority-ordered mood detection. First matching rule wins. */
export function detectMood(focus: number, strain: number, balance: number): Mood {
  // Extremes first
  if (focus >= 85 && strain <= 30 && balance >= 80) return 'victory'
  if (focus >= 90 && strain <= 20)                   return 'flow'    // Elite focus + low strain = flow even with lower balance
  if (focus >= 80 && balance >= 70)                  return 'flow'
  if (strain >= 80 && focus <= 40)                   return 'survival'
  if (focus <= 40 && balance <= 50)                  return 'scattered'
  if (strain >= 70 && focus <= 65)                   return 'grinding'
  if (balance <= 40 && focus >= 50)                  return 'grinding' // Decent output but unsustainable rhythm (e.g. all-day workshop)
  if (focus >= 70 && strain <= 50)                   return 'locked-in'
  if (balance >= 70 && strain <= 50)                 return 'coasting'
  if (focus >= 70 && balance >= 60)                  return 'coasting'
  if (focus >= 40 && focus <= 60 && strain >= 40 && strain <= 60) return 'autopilot'

  return 'autopilot'
}
