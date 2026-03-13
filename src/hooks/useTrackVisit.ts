import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function useTrackVisit() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session) return

    fetch('/api/track-visit', { method: 'POST' }).catch(() => {
      // Silently fail — never throw or show errors
    })
  }, [session])
}
