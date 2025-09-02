class CalendarMetadataParser {
  constructor() {
    this.metrics = {
      daily: {},
      weekly: {},
      patterns: {}
    };
  }

  parseCalendarEvents(graphResponse) {
    const events = graphResponse.value || [];
    
    const parsedData = {
      totalEvents: events.length,
      meetings: [],
      metrics: {
        meetingDensity: 0,
        totalDuration: 0,
        averageDuration: 0,
        backToBackCount: 0,
        largeeMeetingCount: 0,
        virtualMeetingRatio: 0,
        focusTimeBlocks: [],
        peakHours: {}
      }
    };

    const validMeetings = events.filter(event => 
      event.showAs === 'busy' && 
      !event.isAllDay &&
      event.responseStatus?.response !== 'declined'
    );

    validMeetings.forEach((event, index) => {
      const meeting = this.extractMeetingMetadata(event);
      parsedData.meetings.push(meeting);
      
      parsedData.metrics.totalDuration += meeting.duration;
      
      if (meeting.attendeeCount > 5) {
        parsedData.metrics.largeMeetingCount++;
      }
      
      if (meeting.isVirtual) {
        parsedData.metrics.virtualMeetingRatio++;
      }
      
      if (index > 0) {
        const prevMeeting = parsedData.meetings[index - 1];
        if (this.isBackToBack(prevMeeting, meeting)) {
          parsedData.metrics.backToBackCount++;
        }
      }
    });

    parsedData.metrics.meetingDensity = this.calculateDensity(parsedData.meetings);
    parsedData.metrics.averageDuration = parsedData.meetings.length > 0 
      ? parsedData.metrics.totalDuration / parsedData.meetings.length 
      : 0;
    parsedData.metrics.virtualMeetingRatio = parsedData.meetings.length > 0
      ? parsedData.metrics.virtualMeetingRatio / parsedData.meetings.length
      : 0;
    parsedData.metrics.focusTimeBlocks = this.calculateFocusTime(parsedData.meetings);
    parsedData.metrics.peakHours = this.identifyPeakHours(parsedData.meetings);

    return parsedData;
  }

  extractMeetingMetadata(event) {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    const duration = (end - start) / (1000 * 60); // minutes
    
    return {
      id: event.id,
      subject: event.subject,
      startTime: start,
      endTime: end,
      duration: duration,
      hour: start.getHours(),
      dayOfWeek: start.getDay(),
      attendeeCount: event.attendees?.length || 0,
      isOrganizer: event.organizer?.emailAddress?.address === event.responseStatus?.response === 'organizer',
      isVirtual: event.isOnlineMeeting || false,
      meetingProvider: event.onlineMeetingProvider || 'in-person',
      importance: event.importance || 'normal',
      categories: event.categories || [],
      isRecurring: event.recurrence !== null,
      showAs: event.showAs,
      attendeeTypes: this.categorizeAttendees(event.attendees || [])
    };
  }

  categorizeAttendees(attendees) {
    return {
      required: attendees.filter(a => a.type === 'required').length,
      optional: attendees.filter(a => a.type === 'optional').length,
      accepted: attendees.filter(a => a.status?.response === 'accepted').length,
      declined: attendees.filter(a => a.status?.response === 'declined').length,
      tentative: attendees.filter(a => a.status?.response === 'tentative').length
    };
  }

  isBackToBack(meeting1, meeting2) {
    const gap = (meeting2.startTime - meeting1.endTime) / (1000 * 60); // minutes
    return gap <= 15; // 15 minutes or less between meetings
  }

  calculateDensity(meetings) {
    if (meetings.length === 0) return 0;
    
    const days = new Set();
    meetings.forEach(m => {
      const dateKey = `${m.startTime.getFullYear()}-${m.startTime.getMonth()}-${m.startTime.getDate()}`;
      days.add(dateKey);
    });
    
    return meetings.length / days.size; // average meetings per day
  }

  calculateFocusTime(meetings) {
    const focusBlocks = [];
    const sortedMeetings = meetings.sort((a, b) => a.startTime - b.startTime);
    
    for (let i = 0; i < sortedMeetings.length - 1; i++) {
      const gap = (sortedMeetings[i + 1].startTime - sortedMeetings[i].endTime) / (1000 * 60);
      
      if (gap >= 60) { // At least 1 hour gap
        focusBlocks.push({
          start: sortedMeetings[i].endTime,
          end: sortedMeetings[i + 1].startTime,
          duration: gap
        });
      }
    }
    
    return focusBlocks;
  }

  identifyPeakHours(meetings) {
    const hourCounts = {};
    
    meetings.forEach(meeting => {
      const hour = meeting.hour;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    return hourCounts;
  }

  generateWorkHealthScore(metrics) {
    let score = 100;
    
    // Deduct points for unhealthy patterns
    if (metrics.meetingDensity > 6) score -= 15; // More than 6 meetings per day
    if (metrics.backToBackCount > 3) score -= 10; // Many back-to-back meetings
    if (metrics.virtualMeetingRatio > 0.8) score -= 10; // Too many virtual meetings
    if (metrics.averageDuration > 60) score -= 5; // Long average meeting duration
    if (metrics.focusTimeBlocks.length < 2) score -= 15; // Insufficient focus time
    
    return Math.max(0, Math.min(100, score));
  }
}

// Example usage with MS Graph API
async function fetchAndAnalyzeCalendar(accessToken) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // Last 7 days
  const endDate = new Date();
  
  const url = `https://graph.microsoft.com/v1.0/me/calendarView?` +
    `startDateTime=${startDate.toISOString()}&` +
    `endDateTime=${endDate.toISOString()}&` +
    `$select=subject,start,end,attendees,organizer,isAllDay,showAs,responseStatus,isOnlineMeeting,onlineMeetingProvider,recurrence,importance,categories&` +
    `$top=100`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    const parser = new CalendarMetadataParser();
    const analysis = parser.parseCalendarEvents(data);
    const healthScore = parser.generateWorkHealthScore(analysis.metrics);
    
    return {
      analysis,
      healthScore,
      recommendations: generateRecommendations(analysis.metrics)
    };
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    throw error;
  }
}

function generateRecommendations(metrics) {
  const recommendations = [];
  
  if (metrics.meetingDensity > 6) {
    recommendations.push('Consider declining non-essential meetings to reduce daily meeting load');
  }
  
  if (metrics.backToBackCount > 3) {
    recommendations.push('Schedule 15-minute buffers between meetings for mental breaks');
  }
  
  if (metrics.virtualMeetingRatio > 0.8) {
    recommendations.push('Balance virtual meetings with in-person interactions when possible');
  }
  
  if (metrics.focusTimeBlocks.length < 2) {
    recommendations.push('Block calendar time for focused work sessions');
  }
  
  if (metrics.averageDuration > 45) {
    recommendations.push('Aim for shorter, more focused meetings (25-30 minutes when possible)');
  }
  
  return recommendations;
}

module.exports = { CalendarMetadataParser, fetchAndAnalyzeCalendar };