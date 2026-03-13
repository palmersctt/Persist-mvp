'use client'

import { useTrackVisit } from '../hooks/useTrackVisit'

export default function VisitTracker() {
  useTrackVisit()
  return null
}
