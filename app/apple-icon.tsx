import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          borderRadius: 40,
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: '30px solid transparent',
            borderBottom: '30px solid transparent',
            borderLeft: '50px solid #ffffff',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
