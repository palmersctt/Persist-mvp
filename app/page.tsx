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
    return <div className="min-h-screen" style={{ backgroundColor: '#0B0B0C' }} />
  }

  // Show landing page for non-authenticated users
  if (status === 'unauthenticated') {
    return <LandingPage />
  }

  // Authenticated: show loading state while redirecting to dashboard
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B0B0C' }}>
      <div className="text-center flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <PersistLogo size={28} variant="dark" />
          <span className="text-2xl font-semibold text-[#F5F5F5]" style={{ letterSpacing: '1.5px' }}>PERSIST<span style={{ color: '#C7F95C' }}>WORK</span></span>
        </div>
        <div className="text-[#5F6168] text-sm">Loading...</div>
      </div>
    </div>
  )
}