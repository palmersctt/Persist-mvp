'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import SandboxDashboard from '../../src/components/SandboxDashboard'

export default function SandboxPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') return null
  if (status === 'authenticated') return null

  return <SandboxDashboard />
}
