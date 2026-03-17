type EventType =
  | 'card_swipe'
  | 'metric_click'
  | 'card_share'
  // Metric detail tab engagement
  | 'sandbox_metric_tab_viewed'
  | 'sandbox_metric_components_viewed'
  | 'sandbox_metric_tab_exited'
  | 'sandbox_metric_time_spent'
  // Trends section engagement
  | 'sandbox_trends_button_viewed'
  | 'sandbox_trends_expanded'
  | 'sandbox_trend_toggled'
  | 'sandbox_trend_sparkline_viewed'
  | 'sandbox_trend_insights_expanded'

export function trackEvent(eventType: EventType, metadata: Record<string, unknown> = {}) {
  fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, metadata }),
  }).catch(() => {
    // fire-and-forget: silently ignore errors
  })
}
