type EventType = 'card_swipe' | 'metric_click' | 'card_share'

export function trackEvent(eventType: EventType, metadata: Record<string, unknown> = {}) {
  fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, metadata }),
  }).catch(() => {
    // fire-and-forget: silently ignore errors
  })
}
