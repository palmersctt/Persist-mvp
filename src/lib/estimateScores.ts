import type { WorkHealthMetrics } from '../hooks/useWorkHealth'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

export interface EstimatedScores {
  focus: number
  strain: number
  balance: number
}

export interface ScheduleAnalysis {
  meetingCount: number
  durationHours: number
  meetingRatio: number
  backToBackCount: number
  bufferTime: number
  fragmentationScore: number
  morningMeetings: number
  afternoonMeetings: number
  uniqueContexts: number
  longestStretch: number
  adequateBreaks: number
  shortBreaks: number
  earlyLateMeetings: number
}

export function estimateScoresFromInputs(meetings: number, backToBack: number, hats: number): EstimatedScores {
  const focus = clamp(95 - meetings * 10 - (hats - 1) * 4, 5, 95)
  const strain = clamp(10 + backToBack * 14 + meetings * 3 + (hats - 1) * 5, 5, 95)
  const balance = clamp(90 - meetings * 7 - backToBack * 8 - (hats - 1) * 3, 5, 95)
  return { focus, strain, balance }
}

export function estimateScheduleAnalysis(meetings: number, backToBack: number, hats: number): ScheduleAnalysis {
  const durationHours = Math.round(meetings * 0.75 * 100) / 100
  const meetingRatio = Math.min(1, durationHours / 8)
  const bufferTime = Math.max(0, (8 - durationHours) * 60)
  const frag = Math.min(1, (hats / 6 + backToBack / Math.max(1, meetings)) / 2)
  const morningMeetings = Math.ceil(meetings / 2)
  const afternoonMeetings = Math.floor(meetings / 2)
  const longestStretch = Math.min(backToBack + 1, meetings)
  const adequateBreaks = Math.max(0, meetings - backToBack - 1)
  const shortBreaks = Math.min(2, Math.max(0, meetings - backToBack - 1 - adequateBreaks))
  const earlyLateMeetings = meetings >= 10 ? 1 : 0

  return {
    meetingCount: meetings,
    durationHours,
    meetingRatio,
    backToBackCount: backToBack,
    bufferTime,
    fragmentationScore: Math.round(frag * 100) / 100,
    morningMeetings,
    afternoonMeetings,
    uniqueContexts: hats,
    longestStretch,
    adequateBreaks,
    shortBreaks,
    earlyLateMeetings,
  }
}

export function buildWorkHealthMetrics(
  focus: number,
  strain: number,
  balance: number,
  schedule: ScheduleAnalysis,
): WorkHealthMetrics {
  return {
    adaptivePerformanceIndex: focus,
    cognitiveResilience: strain,
    workRhythmRecovery: balance,
    status: 'estimated',
    schedule,
    breakdown: { source: 'estimated', contributors: [], primaryFactors: [] },
    readiness: focus,
    cognitiveAvailability: 100 - strain,
    focusTime: Math.max(0, (8 - schedule.durationHours) * 60),
    meetingDensity: schedule.meetingRatio * 100,
  }
}
