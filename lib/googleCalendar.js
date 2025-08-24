import { google } from 'googleapis'

// Initialize Google Calendar API
export const getCalendarEvents = async (accessToken, timeMin, timeMax) => {
  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    })
    
    return response.data.items
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return []
  }
}

// Parse meeting types from calendar events
export const parseMeetingTypes = (events) => {
  return events.map(event => {
    const title = event.summary?.toLowerCase() || ''
    const description = event.description?.toLowerCase() || ''
    const attendees = event.attendees?.length || 0
    
    // Meeting type classification logic
    let meetingType = 'other'
    let importance = 'medium'
    
    // High-stakes meetings
    if (title.includes('board') || title.includes('presentation') || 
        title.includes('pitch') || title.includes('demo')) {
      meetingType = 'presentation'
      importance = 'high'
    }
    // 1-on-1 meetings
    else if (attendees <= 2 || title.includes('1:1') || title.includes('one-on-one')) {
      meetingType = '1on1'
      importance = 'medium'
    }
    // Team meetings
    else if (title.includes('standup') || title.includes('team') || 
             title.includes('all-hands') || title.includes('sprint')) {
      meetingType = 'team'
      importance = 'medium'
    }
    // Strategic meetings
    else if (title.includes('strategy') || title.includes('planning') || 
             title.includes('roadmap') || title.includes('review')) {
      meetingType = 'strategy'
      importance = 'high'
    }
    // Creative sessions
    else if (title.includes('brainstorm') || title.includes('creative') || 
             title.includes('workshop') || title.includes('design')) {
      meetingType = 'creative'
      importance = 'medium'
    }
    // Client meetings
    else if (title.includes('client') || title.includes('customer') || 
             title.includes('prospect')) {
      meetingType = 'client'
      importance = 'high'
    }
    // Admin/operational
    else if (title.includes('admin') || title.includes('sync') || 
             title.includes('check-in')) {
      meetingType = 'admin'
      importance = 'low'
    }
    
    return {
      id: event.id,
      title: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      meetingType,
      importance,
      attendees,
      description: event.description,
      location: event.location
    }
  })
}

// Analyze meeting performance based on biometric data
export const analyzeMeetingPerformance = (meetings, biometricData) => {
  return meetings.map(meeting => {
    const meetingDate = new Date(meeting.start).toDateString()
    const dayData = biometricData.find(day => 
      new Date(day.date).toDateString() === meetingDate
    )
    
    if (!dayData) return meeting
    
    // Predict performance based on biometric data
    let predictedPerformance = 'good'
    let confidence = 75
    
    if (dayData.readiness >= 85) {
      predictedPerformance = 'excellent'
      confidence = 90
    } else if (dayData.readiness >= 70) {
      predictedPerformance = 'good'
      confidence = 80
    } else if (dayData.readiness >= 55) {
      predictedPerformance = 'adequate'
      confidence = 70
    } else {
      predictedPerformance = 'poor'
      confidence = 85
    }
    
    // Adjust based on meeting type and timing
    const hour = new Date(meeting.start).getHours()
    
    // Morning meetings generally perform better
    if (hour >= 9 && hour <= 11 && dayData.readiness >= 70) {
      if (predictedPerformance === 'good') predictedPerformance = 'excellent'
      confidence += 5
    }
    
    // Afternoon energy dip
    if (hour >= 13 && hour <= 15 && dayData.readiness < 70) {
      if (predictedPerformance === 'good') predictedPerformance = 'adequate'
      if (predictedPerformance === 'excellent') predictedPerformance = 'good'
      confidence -= 5
    }
    
    // High-stakes meetings need higher readiness
    if (meeting.importance === 'high' && dayData.readiness < 75) {
      if (predictedPerformance === 'excellent') predictedPerformance = 'good'
      if (predictedPerformance === 'good') predictedPerformance = 'adequate'
    }
    
    return {
      ...meeting,
      predictedPerformance,
      confidence,
      biometricData: {
        readiness: dayData.readiness,
        recovery: dayData.recovery,
        strain: dayData.strain,
        sleep: dayData.sleep
      },
      recommendations: generateRecommendations(meeting, dayData, predictedPerformance)
    }
  })
}

// Generate performance recommendations
const generateRecommendations = (meeting, dayData, predictedPerformance) => {
  const recommendations = []
  
  if (predictedPerformance === 'poor') {
    recommendations.push('Consider rescheduling this meeting if possible')
    recommendations.push('Use breathing techniques 30 minutes before')
  } else if (predictedPerformance === 'adequate') {
    recommendations.push('Arrive 15 minutes early to prepare mentally')
    recommendations.push('Avoid caffeine 2 hours before meeting')
  } else if (predictedPerformance === 'excellent') {
    recommendations.push('Perfect timing for high-stakes discussions')
    recommendations.push('Consider scheduling similar meetings at this time')
  }
  
  if (dayData.sleep < 7) {
    recommendations.push('Low sleep detected - focus on key talking points only')
  }
  
  if (meeting.meetingType === 'creative' && dayData.readiness < 70) {
    recommendations.push('Creative sessions work better when rescheduled to morning')
  }
  
  return recommendations
}