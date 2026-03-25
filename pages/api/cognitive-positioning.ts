import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import { google } from 'googleapis'
import { classifyEvents } from '../../src/lib/cognitive-classification'
import { buildBreakdown, analyze, getMonday, getLocalDateString } from '../../src/lib/cognitive-signals'
import type { CalendarEvent } from '../../src/services/googleCalendar'
import { supabaseAdmin } from '../../lib/supabase'

async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })
    const data = await response.json()
    if (!response.ok) return null
    return data.access_token || null
  } catch {
    return null
  }
}

/**
 * Fetch events for a date range from Google Calendar
 */
async function fetchEventsForRange(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  userTimezone: string
): Promise<CalendarEvent[]> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  const calendar = google.calendar({ version: 'v3', auth })

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    timeZone: userTimezone,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 2500,
    showDeleted: false,
  })

  const events = response.data.items || []

  return events
    .filter(event => event.start?.dateTime && event.end?.dateTime)
    .map(event => ({
      id: event.id!,
      summary: event.summary || 'No title',
      start: new Date(event.start!.dateTime!),
      end: new Date(event.end!.dateTime!),
      attendees: event.attendees?.length || 1,
      isRecurring: !!event.recurringEventId,
    }))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  const userTimezone = (req.query.timezone as string) || 'America/Los_Angeles'

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session || !session.accessToken) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (session.error === 'RefreshAccessTokenError') {
      return res.status(401).json({ error: 'Token expired', needsReauth: true })
    }

    const userEmail = session.user?.email || 'anonymous'

    // Compute date range using the same timezone-aware approach as work-health.ts
    const now = new Date()

    // Get today's date in user's timezone (sv-SE gives YYYY-MM-DD)
    const todayStr = now.toLocaleDateString('sv-SE', { timeZone: userTimezone })

    // Get UTC offset for user's timezone
    const getOffset = (dateStr: string): string => {
      const d = new Date(dateStr)
      const utcStr = d.toLocaleString('en-US', { timeZone: 'UTC' })
      const tzStr = d.toLocaleString('en-US', { timeZone: userTimezone })
      const diffMs = new Date(tzStr).getTime() - new Date(utcStr).getTime()
      const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60))
      const diffMinutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60))
      const sign = diffMs >= 0 ? '+' : '-'
      return `${sign}${String(diffHours).padStart(2, '0')}:${String(diffMinutes).padStart(2, '0')}`
    }

    const offset = getOffset(`${todayStr}T12:00:00Z`)

    // Find Monday of current week in user's timezone
    const todayDate = new Date(`${todayStr}T12:00:00${offset}`)
    const currentMonday = getMonday(todayDate, userTimezone)
    const mondayStr = currentMonday.toLocaleDateString('sv-SE', { timeZone: userTimezone })

    // 3 prior weeks back from current Monday
    const fourWeeksAgoDate = new Date(currentMonday)
    fourWeeksAgoDate.setDate(fourWeeksAgoDate.getDate() - 21)
    const fourWeeksAgoStr = fourWeeksAgoDate.toLocaleDateString('sv-SE', { timeZone: userTimezone })

    // End of current week (Sunday 23:59 in user's timezone)
    const endOfWeekDate = new Date(currentMonday)
    endOfWeekDate.setDate(endOfWeekDate.getDate() + 6)
    const endOfWeekStr = endOfWeekDate.toLocaleDateString('sv-SE', { timeZone: userTimezone })

    const timeMin = new Date(`${fourWeeksAgoStr}T00:00:00${offset}`).toISOString()
    const timeMax = new Date(`${endOfWeekStr}T23:59:59${offset}`).toISOString()

    let events: CalendarEvent[]

    try {
      events = await fetchEventsForRange(session.accessToken!, timeMin, timeMax, userTimezone)
    } catch (calError) {
      const msg = calError instanceof Error ? calError.message : String(calError)
      const isAuthError = msg.includes('401') || msg.includes('403') || msg.includes('invalid_grant')

      if (isAuthError && session.refreshToken) {
        const newToken = await refreshGoogleToken(session.refreshToken)
        if (newToken) {
          events = await fetchEventsForRange(newToken, timeMin, timeMax, userTimezone)
        } else {
          throw calError
        }
      } else {
        throw calError
      }
    }

    // Group events by ISO week (Monday-based, in user's timezone)
    const eventsByWeek: Record<string, CalendarEvent[]> = {}
    for (const event of events) {
      const monday = getMonday(event.start, userTimezone)
      const weekKey = monday.toLocaleDateString('sv-SE', { timeZone: userTimezone })
      if (!eventsByWeek[weekKey]) eventsByWeek[weekKey] = []
      eventsByWeek[weekKey].push(event)
    }

    // Current week key (in user's timezone)
    const currentWeekKey = mondayStr

    // Today in user's timezone
    const todayLocal = getLocalDateString(now, userTimezone)

    // Fallback: if no events in current week bucket, use today's events
    const currentWeekEvents = eventsByWeek[currentWeekKey] || events.filter(e => {
      return getLocalDateString(e.start, userTimezone) === todayLocal
    })

    // Log raw event data for debugging classification
    console.log(`cognitive-positioning: raw events for current week (${currentWeekKey}):`)
    for (const evt of currentWeekEvents) {
      console.log(`  → "${evt.summary}" | ${Math.round((evt.end.getTime() - evt.start.getTime()) / 60000)}min | attendees=${evt.attendees} | recurring=${evt.isRecurring}`)
    }

    const classified = classifyEvents(currentWeekEvents)

    // Log classification results
    for (const c of classified) {
      console.log(`  ✓ "${c.event.summary}" → ${c.category} (weight=${c.weight}, ${c.durationHours.toFixed(2)}h)`)
    }

    const breakdown = buildBreakdown(classified)

    // Fetch prior snapshots from Supabase
    const { data: priorSnapshots } = await supabaseAdmin
      .from('leverage_snapshots')
      .select('*')
      .eq('user_email', userEmail)
      .lt('week_start', currentWeekKey)
      .order('week_start', { ascending: true })
      .limit(3)

    // Convert Supabase rows to WeekSnapshot format
    const snapshots = (priorSnapshots || []).map(row => ({
      weekStart: row.week_start,
      leverage: Number(row.leverage),
      exposure: Number(row.exposure),
      totalHours: Number(row.total_hours),
      breakdown: row.breakdown as typeof breakdown,
    }))

    // Also build snapshots from fetched events for weeks we have data but no snapshot
    const priorWeekKeys = Object.keys(eventsByWeek)
      .filter(k => k !== currentWeekKey)
      .sort()
    const existingSnapshotWeeks = new Set(snapshots.map(s => s.weekStart))

    for (const weekKey of priorWeekKeys) {
      if (existingSnapshotWeeks.has(weekKey)) continue
      const weekClassified = classifyEvents(eventsByWeek[weekKey])
      const weekBreakdown = buildBreakdown(weekClassified)
      const totalHours = weekBreakdown.reduce((s, b) => s + b.hours, 0)
      if (totalHours > 0) {
        const leverage = Math.round(weekBreakdown.reduce((s, b) => s + b.hours * b.weight, 0) / totalHours)
        const exposedCats = ['Administrative', 'Information Transfer', 'Coordination']
        const exposedHours = weekBreakdown.filter(b => exposedCats.includes(b.category)).reduce((s, b) => s + b.hours, 0)
        const exposure = Math.round((exposedHours / totalHours) * 100)

        const snapshot = { weekStart: weekKey, leverage, exposure, totalHours, breakdown: weekBreakdown }
        snapshots.push(snapshot)

        // Persist to Supabase for future use
        await supabaseAdmin
          .from('leverage_snapshots')
          .upsert({
            user_email: userEmail,
            week_start: weekKey,
            leverage,
            exposure,
            total_hours: totalHours,
            breakdown: weekBreakdown,
          }, { onConflict: 'user_email,week_start' })
          .then(() => {}) // fire and forget error
      }
    }

    // Sort snapshots chronologically
    snapshots.sort((a, b) => a.weekStart.localeCompare(b.weekStart))

    // Analyze
    const analysis = analyze(breakdown, snapshots, userTimezone)

    // Upsert current week snapshot
    const currentTotalHours = breakdown.reduce((s, b) => s + b.hours, 0)
    if (currentTotalHours > 0) {
      await supabaseAdmin
        .from('leverage_snapshots')
        .upsert({
          user_email: userEmail,
          week_start: currentWeekKey,
          leverage: analysis.signals.leverage,
          exposure: analysis.signals.exposure,
          total_hours: currentTotalHours,
          breakdown,
        }, { onConflict: 'user_email,week_start' })
    }

    console.log(`cognitive-positioning: tz=${userTimezone}, todayLocal=${todayLocal}, currentWeek=${currentWeekKey}, serverUTC=${now.toISOString()}`)
    console.log(`cognitive-positioning: ${events.length} events over ${Object.keys(eventsByWeek).length} weeks, currentWeekEvents=${currentWeekEvents.length}, zone=${analysis.zone}, leverage=${analysis.signals.leverage}`)
    console.log(`cognitive-positioning: weekBuckets=${JSON.stringify(Object.keys(eventsByWeek).map(k => `${k}(${eventsByWeek[k].length})`))}`)

    // Attach classified events for drill-down UI
    analysis.classifiedEvents = classified.map(c => ({
      title: c.event.summary,
      category: c.category,
      weight: c.weight,
      risk: c.risk,
      durationHours: Math.round(c.durationHours * 100) / 100,
    }))

    return res.status(200).json(analysis)
  } catch (error) {
    console.error('Error in cognitive-positioning:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    const isGoogleError = message.includes('Google') || message.includes('calendar') || message.includes('403')
    return res.status(isGoogleError ? 503 : 500).json({
      error: isGoogleError ? 'Calendar not ready yet — please retry' : 'Failed to compute positioning',
      details: message,
      retryable: isGoogleError,
    })
  }
}
