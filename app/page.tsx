'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LandingPage from '../src/components/LandingPage'

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
      <div className="text-center">
        <div className="text-2xl font-bold text-white tracking-wide mb-3">PERSIST</div>
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    </div>
  )
}