import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1C1917',
          borderRadius: 6,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="48" fill="#ffffff" />
          <path d="M38 30 L62 50 L38 70" stroke="#1C1917" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
