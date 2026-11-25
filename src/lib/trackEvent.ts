type EventType =
  | 'card_swipe'
  | 'metric_click'
  | 'card_share'
  | 'trends_view_toggled'
  | 'trends_insights_expanded'
  | 'wearable_connect_clicked'
  | 'wearable_disconnected'
  // Get your verdict (signed-out funnel)
  | 'verdict_door_chosen'
  | 'verdict_prompt_copied'
  | 'verdict_paste_failed'
  | 'verdict_scored'
  | 'verdict_shared'
  | 'verdict_signin_clicked';

/**
 * Fire-and-forget analytics. Signed-in events are tied to the session;
 * signed-out visitors pass an anonymous `visitorId` (see getVisitorId).
 * Never put a visitor's day (times, titles, scores of their inputs) in
 * metadata — only which door, which tier, and the like.
 */
export function trackEvent(
  eventType: EventType,
  metadata: Record<string, unknown> = {},
  visitorId?: string
) {
  const payload: Record<string, unknown> = { eventType, metadata };
  if (visitorId) payload.visitorId = visitorId;
  fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // fire-and-forget: silently ignore errors
  });
}

let _visitorId: string | null = null;

/** An anonymous id for this page view, e.g. visitor-1732500000000-ab12cd. */
export function getVisitorId(): string {
  if (!_visitorId) {
    _visitorId = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return _visitorId;
}
