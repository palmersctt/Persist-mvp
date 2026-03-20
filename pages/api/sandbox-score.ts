import { NextApiRequest, NextApiResponse } from 'next'
import GoogleCalendarService, { MeetingCategory } from '../../src/services/googleCalendar'
import ClaudeAIService, { CalendarAnalysis } from '../../src/services/claudeAI'
import { comicReliefGenerator } from '../../src/utils/comicReliefGenerator'

interface MeetingInput {
  id: string
  title: string
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  attendees?: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { meetings } = req.body as { meetings: MeetingInput[] }

  if (!meetings || !Array.isArray(meetings)) {
    return res.status(400).json({ error: 'meetings array is required' })
  }

  const validMeetings = meetings.filter(m => m.title && m.title.trim().length > 0)

  if (validMeetings.length === 0) {
    return res.status(400).json({ error: 'At least one meeting with a title is required' })
  }

  try {
    const service = new GoogleCalendarService()

    // Convert meeting inputs to CalendarEvent objects
    const today = new Date()
    const calendarEvents = validMeetings.map(m => {
      const start = new Date(today)
      start.setHours(m.startHour, m.startMinute, 0, 0)

      const end = new Date(today)
      end.setHours(m.endHour, m.endMinute, 0, 0)

      // Access the private categorizeEvent via bracket notation
      const category = (service as unknown as Record<string, (s: string) => MeetingCategory>)['categorizeEvent'](m.title)

      return {
        id: m.id,
        summary: m.title,
        start,
        end,
        attendees: m.attendees || 3,
        isRecurring: false,
        category,
      }
    })

    // Run through the real scoring engine with preloaded events
    const workHealth = await service.analyzeWorkHealth(undefined, calendarEvents)

    // Build CalendarAnalysis for insight generation
    const meetingTypes = calendarEvents.reduce((acc, event) => {
      acc[event.category || 'COLLABORATIVE'] = (acc[event.category || 'COLLABORATIVE'] || 0) + 1
      return acc
    }, {} as Record<MeetingCategory, number>)

    const timeDistribution = calendarEvents.reduce((acc, event) => {
      const hour = event.start.getHours()
      const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
      acc[timeSlot] = (acc[timeSlot] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const focusBlocks: { start: number; duration: number }[] = []
    const sorted = [...calendarEvents].sort((a, b) => a.start.getTime() - b.start.getTime())
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = sorted[i].end
      const nextStart = sorted[i + 1].start
      const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60)
      if (gapMinutes >= 90) {
        focusBlocks.push({
          start: currentEnd.getHours() + (currentEnd.getMinutes() / 60),
          duration: gapMinutes,
        })
      }
    }

    const calendarAnalysis: CalendarAnalysis = {
      workHealth,
      events: calendarEvents,
      patterns: { meetingTypes, timeDistribution, focusBlocks },
    }

    // Try ClaudeAIService for full local insights, fall back to comicReliefGenerator
    let ai
    try {
      const claudeService = new ClaudeAIService()
      ai = claudeService.getDefaultInsights(calendarAnalysis)
    } catch {
      // API key not set — generate minimal insights from quote generator
      const quote = comicReliefGenerator.generateQuote(workHealth)
      const quotes = comicReliefGenerator.generateMultipleQuotes(workHealth, 5)

      const focusHours = Math.round(workHealth.focusTime / 60 * 10) / 10
      const mc = workHealth.schedule.meetingCount
      const btb = workHealth.schedule.backToBackCount

      ai = {
        heroMessage: {
          quote: quote.text,
          source: `${quote.source}${quote.character ? ` \u2014 ${quote.character}` : ''}`,
          subtitle: 'Your custom day, scored.',
        },
        heroMessages: quotes.map((q: { text: string; source: string; character?: string }) => ({
          quote: q.text,
          source: `${q.source}${q.character ? ` \u2014 ${q.character}` : ''}`,
          subtitle: 'Your custom day, scored.',
        })),
        whyNarrative: mc === 0
          ? "Nothing on the calendar. That's rare \u2014 and your brain already knows it. Today is yours."
          : mc <= 2 && btb === 0
          ? "Light day. You'll actually have time to finish a thought before starting the next one. Enjoy it \u2014 not every day is this kind."
          : workHealth.adaptivePerformanceIndex >= 70 && workHealth.cognitiveResilience <= 35
          ? "Your day has room to breathe. That doesn't mean it'll be easy, but it means when it gets hard, you'll have something left in the tank."
          : workHealth.cognitiveResilience >= 70 && btb >= 3
          ? `That tired feeling you'll have by 3pm? It's not because the work is hard. It's because your brain hasn't had a single moment to rest between conversations. ${btb} back-to-backs will do that.`
          : mc >= 6
          ? `${mc} meetings. Not all of them will matter, but all of them will cost you energy. The ones you remember aren't always the ones that wore you out.`
          : workHealth.workRhythmRecovery <= 30
          ? "There's no recovery built into this day. You'll push through \u2014 you always do \u2014 but your body is keeping score even when you're not."
          : workHealth.adaptivePerformanceIndex <= 40
          ? "You'll feel busy all day and still wonder what you actually got done. That's not a you problem. There's just nowhere to hide in this schedule."
          : "Not the worst day, not the best. The kind where you're tired enough to feel it but not enough to say anything about it. That's its own kind of exhausting.",
        overview: {
          title: workHealth.adaptivePerformanceIndex >= 75 ? 'Solid Day Ahead' : workHealth.adaptivePerformanceIndex >= 50 ? 'Mixed Day Ahead' : 'Demanding Day Ahead',
          message: mc === 0
            ? 'Wide-open calendar \u2014 plenty of room to set your own pace.'
            : `With ${mc} meeting${mc > 1 ? 's' : ''} and roughly ${focusHours} hours of focus time, today should feel ${workHealth.adaptivePerformanceIndex >= 75 ? 'manageable' : 'busy'}.`,
          action: 'Tap any score above to see what\u2019s driving it.',
          severity: workHealth.adaptivePerformanceIndex >= 75 ? 'success' : workHealth.adaptivePerformanceIndex >= 50 ? 'info' : 'warning',
        },
        performance: {
          title: workHealth.adaptivePerformanceIndex >= 75 ? 'Strong Cognitive Window' : 'Limited Deep Work Time',
          message: focusHours >= 4
            ? `You have about ${focusHours} hours of uninterrupted time \u2014 your best window for complex thinking.`
            : `Only about ${focusHours} hours of focus time between meetings \u2014 be selective about what you tackle.`,
          action: focusHours >= 4
            ? 'Front-load your hardest task into the first open block before meetings start.'
            : 'Save complex problems for your longest gap; use short gaps for admin and email.',
          severity: workHealth.adaptivePerformanceIndex >= 75 ? 'success' : workHealth.adaptivePerformanceIndex >= 50 ? 'info' : 'warning',
        },
        resilience: {
          title: btb >= 3 ? 'Back-to-Back Pressure' : workHealth.cognitiveResilience <= 30 ? 'Good Recovery Room' : 'Watch the Transitions',
          message: btb >= 3
            ? `${btb} back-to-back meetings will pile up context-switching fatigue.`
            : btb >= 1
            ? `${btb} consecutive meeting${btb > 1 ? 's' : ''} will require some mental resets, but you have enough gaps to recover.`
            : 'No back-to-back meetings today \u2014 you should be able to handle whatever comes up without feeling rushed.',
          action: btb >= 1
            ? 'Add a 10-minute buffer after your consecutive meetings \u2014 step away from the screen.'
            : 'Use the natural breaks between meetings to briefly reset before switching contexts.',
          severity: btb >= 3 ? 'warning' : 'info',
        },
        sustainability: {
          title: workHealth.workRhythmRecovery >= 75 ? 'Sustainable Pace' : workHealth.workRhythmRecovery >= 50 ? 'Manageable for Now' : 'Unsustainable Load',
          message: workHealth.workRhythmRecovery >= 75
            ? 'Today\u2019s workload leaves enough recovery time \u2014 you should end the day with energy to spare.'
            : workHealth.workRhythmRecovery >= 50
            ? 'This pace is okay for today, but too many days like this in a row will start to wear you down.'
            : 'The meeting-to-recovery ratio today is too high \u2014 you\u2019ll likely feel drained by end of day.',
          action: workHealth.workRhythmRecovery >= 75
            ? 'Keep this rhythm going \u2014 this is a good template for your weekly schedule.'
            : 'Look at your week ahead and find one meeting you can decline or shorten to create breathing room.',
          severity: workHealth.workRhythmRecovery >= 75 ? 'success' : workHealth.workRhythmRecovery >= 50 ? 'info' : 'warning',
        },
        insights: [],
        summary: `Current work health status: ${workHealth.status}.`,
        overallScore: workHealth.adaptivePerformanceIndex,
        riskFactors: [],
        opportunities: [],
        predictiveAlerts: [],
      }
    }

    res.status(200).json({
      ...workHealth,
      ai,
      aiStatus: 'local' as const,
    })
  } catch (error) {
    console.error('Sandbox scoring error:', error)
    res.status(500).json({
      error: 'Scoring failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
