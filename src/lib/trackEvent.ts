type EventType =
  | 'card_swipe'
  | 'metric_click'
  | 'card_share'
  | 'sandbox_trend_viewed'
  | 'sandbox_trend_toggle'
  | 'sandbox_custom_selected'
  | 'sandbox_custom_scored'
  | 'sandbox_custom_reset'
  | 'sandbox_metric_tab_viewed'
  | 'sandbox_metric_components_viewed'
  | 'sandbox_metric_tab_exited'
  | 'sandbox_metric_time_spent'
  | 'sandbox_trends_button_viewed'
  | 'sandbox_trends_expanded'
  | 'sandbox_trend_toggled'
  | 'sandbox_trend_sparkline_viewed'
  | 'sandbox_trend_insights_expanded'

export function trackEvent(eventType: EventType, metadata: Record<string, unknown> = {}, sandboxSessionId?: string) {
  const payload: Record<string, unknown> = { eventType, metadata }
  if (sandboxSessionId) {
    payload.sandboxSessionId = sandboxSessionId
  }
  fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // fire-and-forget: silently ignore errors
  })
}

let _sandboxSessionId: string | null = null

export function getSandboxSessionId(): string {
  if (!_sandboxSessionId) {
    _sandboxSessionId = `sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
  return _sandboxSessionId
}

export function resetSandboxSessionId(): void {
  _sandboxSessionId = null
}
