'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import type { CognitiveAnalysis } from '../lib/cognitive-signals'

export function useCognitivePositioning() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<CognitiveAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return

    setIsLoading(true)
    setError(null)

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const res = await fetch(`/api/cognitive-positioning?timezone=${encodeURIComponent(tz)}`)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }

      const analysis: CognitiveAnalysis = await res.json()
      setData(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refresh: fetchData, status }
}
