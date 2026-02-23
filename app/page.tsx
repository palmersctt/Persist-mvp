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

  // Show landing page for non-authenticated users
  if (status === 'unauthenticated' || status === 'loading') {
    return <LandingPage />
  }

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
      <div className="text-center flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <PersistLogo size={28} variant="light" />
          <span className="text-2xl font-semibold text-white" style={{ letterSpacing: '1.5px' }}>PERSIST</span>
        </div>
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    </div>
  )
}