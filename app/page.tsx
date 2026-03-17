'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LandingPage from '../src/components/LandingPage'
import PersistLogo from '../src/components/PersistLogo'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (status === 'authenticated' && session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // While session is resolving, show blank cream background (no flash)
  if (status === 'loading') {
    return <div className="min-h-screen" style={{ backgroundColor: '#FBF7F2' }} />
  }

  // Show landing page for non-authenticated users
  if (status === 'unauthenticated') {
    return <LandingPage />
  }

  // Authenticated: show loading state while redirecting to dashboard
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FBF7F2' }}>
      <div className="text-center flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <PersistLogo size={28} variant="dark" />
          <span className="text-2xl font-semibold text-[#1C1917]" style={{ letterSpacing: '1.5px' }}>PERSIST<span style={{ color: '#E87D3A' }}>WORK</span></span>
        </div>
        <div className="text-[#A8A29E] text-sm">Loading...</div>
      </div>
    </div>
  )
}