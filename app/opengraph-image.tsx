import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Persist - Comic relief for your workday'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          {/* Logo */}
          <svg width="56" height="56" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="48" fill="#ffffff" />
            <path d="M38 30 L62 50 L38 70" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          {/* Wordmark */}
          <span style={{ fontSize: 52, fontWeight: 600, color: '#ffffff', letterSpacing: 3 }}>
            PERSIST
          </span>
        </div>
        <span style={{ fontSize: 26, color: '#888888', fontWeight: 400 }}>
          Comic relief for your workday
        </span>
      </div>
    ),
    { ...size }
  )
}
