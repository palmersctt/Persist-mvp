'use client'

import { useState } from 'react'

export interface MeetingEntry {
  id: string
  title: string
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  attendees: number
}

interface SandboxMeetingBuilderProps {
  onScore: (meetings: MeetingEntry[]) => void
  isScoring: boolean
}

const TIME_OPTIONS: Array<{ label: string; hour: number; minute: number }> = []
for (let h = 6; h <= 21; h++) {
  for (const m of [0, 30]) {
    if (h === 21 && m === 30) continue
    const label = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m === 0 ? '00' : '30'} ${h >= 12 ? 'PM' : 'AM'}`
    TIME_OPTIONS.push({ label, hour: h, minute: m })
  }
}

const SIZE_OPTIONS = [
  { label: '1–2', value: 2 },
  { label: '3–5', value: 4 },
  { label: '6–9', value: 7 },
  { label: '10+', value: 12 },
]

export default function SandboxMeetingBuilder({ onScore, isScoring }: SandboxMeetingBuilderProps) {
  const [meetings, setMeetings] = useState<MeetingEntry[]>([
    { id: '1', title: '', startHour: 9, startMinute: 0, endHour: 10, endMinute: 0, attendees: 4 },
  ])

  const addMeeting = () => {
    const last = meetings[meetings.length - 1]
    const nextStartH = last ? last.endHour : 9
    const nextStartM = last ? last.endMinute : 0
    let nextEndH = nextStartH + 1
    const nextEndM = nextStartM
    if (nextEndH > 21) { nextEndH = 21 }

    setMeetings([...meetings, {
      id: String(Date.now()),
      title: '',
      startHour: Math.min(nextStartH, 20),
      startMinute: nextStartM,
      endHour: nextEndH,
      endMinute: nextEndM,
      attendees: 4,
    }])
  }

  const removeMeeting = (id: string) => {
    if (meetings.length <= 1) return
    setMeetings(meetings.filter(m => m.id !== id))
  }

  const updateMeeting = (id: string, updates: Partial<MeetingEntry>) => {
    setMeetings(meetings.map(m => m.id === id ? { ...m, ...updates } : m))
  }

  const canScore = meetings.some(m => m.title.trim().length > 0)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          marginBottom: 4,
        }}>
          Build your day
        </p>
        <p style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}>
          Add your meetings for today. We&apos;ll score them the same way we&apos;d score your real calendar.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {meetings.map((meeting, index) => (
          <div
            key={meeting.id}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              backgroundColor: 'var(--warm-white)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ marginBottom: 10 }}>
              <input
                type="text"
                placeholder={index === 0 ? 'e.g. Sprint Planning' : 'Meeting name'}
                value={meeting.title}
                onChange={(e) => updateMeeting(meeting.id, { title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={`${meeting.startHour}:${meeting.startMinute}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number)
                  updateMeeting(meeting.id, { startHour: h, startMinute: m })
                }}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  backgroundColor: 'white',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {TIME_OPTIONS.map(({ label, hour, minute }) => (
                  <option key={`s-${hour}-${minute}`} value={`${hour}:${minute}`}>
                    {label}
                  </option>
                ))}
              </select>

              <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 500 }}>to</span>

              <select
                value={`${meeting.endHour}:${meeting.endMinute}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number)
                  updateMeeting(meeting.id, { endHour: h, endMinute: m })
                }}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  backgroundColor: 'white',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {TIME_OPTIONS.map(({ label, hour, minute }) => (
                  <option key={`e-${hour}-${minute}`} value={`${hour}:${minute}`}>
                    {label}
                  </option>
                ))}
              </select>

              {meetings.length > 1 && (
                <button
                  onClick={() => removeMeeting(meeting.id)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: 'rgba(192,84,74,0.08)',
                    color: '#C0544A',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  &times;
                </button>
              )}
            </div>

            {/* Attendee size picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <div style={{ display: 'flex', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
                {SIZE_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => updateMeeting(meeting.id, { attendees: value })}
                    style={{
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: meeting.attendees === value ? 700 : 500,
                      border: 'none',
                      borderRight: '1px solid var(--border)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      backgroundColor: meeting.attendees === value ? '#1C1917' : 'transparent',
                      color: meeting.attendees === value ? '#FBF7F2' : 'var(--ink-faint)',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 10, color: 'var(--ink-faint)', fontWeight: 500 }}>people</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addMeeting}
        style={{
          width: '100%',
          padding: 12,
          marginTop: 8,
          borderRadius: 10,
          border: '1px dashed var(--border)',
          backgroundColor: 'transparent',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-faint)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s ease',
        }}
      >
        + Add another meeting
      </button>

      <button
        onClick={() => onScore(meetings)}
        disabled={!canScore || isScoring}
        style={{
          width: '100%',
          padding: 16,
          marginTop: 16,
          borderRadius: 12,
          border: 'none',
          backgroundColor: canScore ? '#1C1917' : 'rgba(28,25,23,0.1)',
          color: canScore ? '#FBF7F2' : 'var(--ink-faint)',
          fontSize: 15,
          fontWeight: 700,
          cursor: canScore ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
          transition: 'all 0.15s ease',
          opacity: isScoring ? 0.7 : 1,
        }}
      >
        {isScoring ? 'Scoring...' : 'Score my day \u2192'}
      </button>

    </div>
  )
}
