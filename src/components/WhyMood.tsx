'use client'

import { useState } from 'react'

interface Props {
  mood: string
  narrative: string
  focus: number
  strain: number
  balance: number
  onMetricClick: (metric: string) => void
}

export default function WhyMood({ mood, narrative, focus, strain, balance, onMetricClick }: Props) {
  const isFirstVisit = typeof window !== 'undefined' && !localStorage.getItem('persist-why-mood-seen')
  const [open, setOpen] = useState(isFirstVisit)

  const metrics = [
    { key: 'performance',    label: 'Focus',   val: focus },
    { key: 'resilience',     label: 'Strain',  val: strain },
    { key: 'sustainability', label: 'Balance', val: balance },
  ]

  return (
    <div className="max-w-xs mx-auto w-full mt-2 mb-6">

      {narrative ? (
        <>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.setItem('persist-why-mood-seen', 'true')
              }
              setOpen(o => !o)
            }}
            className="w-full flex justify-between items-center py-2 bg-transparent border-none cursor-pointer"
            style={{ color: '#78716C', borderRadius: '6px', transition: 'background 150ms ease' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FDF0E6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Why {mood}?
            </span>
            <span style={{
              fontSize: '0.7rem',
              display: 'inline-block',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
              color: '#78716C'
            }}>{open ? '↑' : '›'}</span>
          </button>

          {open && (
            <p style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #E7E0D8'
            }}>
              {narrative}
            </p>
          )}
        </>
      ) : null}

      <div style={{ borderTop: '1px solid #E7E0D8' }}>
        {metrics.map(({ key, label, val }) => (
          <button
            key={key}
            onClick={() => onMetricClick(key)}
            className="w-full flex items-center bg-transparent border-none cursor-pointer"
            style={{ padding: '14px 4px', margin: '0 -4px', borderBottom: '1px solid #E7E0D8', gap: '12px', borderRadius: '6px', transition: 'background 150ms ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FDF0E6' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            onPointerDown={(e) => { e.currentTarget.style.background = '#FDF0E6' }}
            onPointerUp={(e) => { e.currentTarget.style.background = 'transparent' }}
            onPointerCancel={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: '90px' }}>
              <span style={{ fontSize: '0.75rem', color: '#57534E', letterSpacing: '0.02em' }}>
                {label}
              </span>
              <span style={{
                fontSize: '1.25rem', fontWeight: 300, color: key === 'resilience' ? '#57534E' : 'var(--text-primary)',
                fontFeatureSettings: '"tnum"', letterSpacing: '-0.03em'
              }}>
                {val}
              </span>
            </div>
            <div style={{ flex: 1, height: '3px', background: 'rgba(28,25,23,0.08)', borderRadius: '2px' }}>
              <div style={{ height: '3px', width: `${val}%`, background: '#E87D3A', borderRadius: '2px', transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: '0.85rem', color: '#E87D3A' }}>›</span>
          </button>
        ))}
      </div>

    </div>
  )
}
