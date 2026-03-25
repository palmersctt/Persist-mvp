import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import { google } from 'googleapis'
import { classifyEvents } from '../../src/lib/cognitive-classification'
import { buildBreakdown, analyze, getMonday } from '../../src/lib/cognitive-signals'
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

    // Compute date range: 4 weeks back from current week's Monday
    const now = new Date()
    const currentMonday = getMonday(now)
    const fourWeeksAgo = new Date(currentMonday)
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 21) // 3 prior weeks

    // End of current week (Sunday 23:59)
    const endOfWeek = new Date(currentMonday)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const timeMin = fourWeeksAgo.toISOString()
    const timeMax = endOfWeek.toISOString()

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

    // Group events by ISO week (Monday-based)
    const eventsByWeek: Record<string, CalendarEvent[]> = {}
    for (const event of events) {
      const monday = getMonday(event.start)
      const weekKey = monday.toISOString().slice(0, 10)
      if (!eventsByWeek[weekKey]) eventsByWeek[weekKey] = []
      eventsByWeek[weekKey].push(event)
    }

    // Current week key
    const currentWeekKey = currentMonday.toISOString().slice(0, 10)

    // Build breakdown for current week (or all available events if only today)
    const currentWeekEvents = eventsByWeek[currentWeekKey] || events.filter(e => {
      // If no events in current week bucket, use today's events
      const today = now.toISOString().slice(0, 10)
      return e.start.toISOString().slice(0, 10) === today
    })

    const classified = classifyEvents(currentWeekEvents)
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
    const analysis = analyze(breakdown, snapshots)

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

    console.log(`cognitive-positioning: ${events.length} events over ${Object.keys(eventsByWeek).length} weeks, zone=${analysis.zone}, leverage=${analysis.signals.leverage}, tz=${userTimezone}`)

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
