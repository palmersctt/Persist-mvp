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
  survival:   { name: 'Survival Mode', gradient: ['#dc2626', '#7f1d1d'] },
  grinding:   { name: 'Grinding',      gradient: ['#ea580c', '#7c2d12'] },
  scattered:  { name: 'Scattered',     gradient: ['#d97706', '#78350f'] },
  autopilot:  { name: 'Autopilot',     gradient: ['#4b5563', '#1f2937'] },
  coasting:   { name: 'Coasting',      gradient: ['#2563eb', '#1e3a5f'] },
  'locked-in':{ name: 'Locked In',     gradient: ['#7c3aed', '#3b0764'] },
  flow:       { name: 'Flow State',    gradient: ['#059669', '#064e3b'] },
  victory:    { name: 'Victory Lap',   gradient: ['#e11d48', '#4a044e'] },
}

/** Priority-ordered mood detection. First matching rule wins. */
export function detectMood(focus: number, strain: number, balance: number): Mood {
  // Extremes first
  if (focus >= 85 && strain <= 30 && balance >= 80) return 'victory'
  if (focus >= 90 && strain >= 80)                   return 'flow'    // Elite focus + resilience = flow even with lower balance
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
