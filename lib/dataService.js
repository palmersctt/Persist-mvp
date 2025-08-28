// Data service that switches between mock and real Google Calendar data
import mockDataService from './mockData'
import { getCalendarEvents, parseMeetingTypes } from './googleCalendar'

// Feature flag - change this to false to use real Google Calendar data
const USE_MOCK_DATA = true

export const dataService = {
  // Switch between mock and real data
  async getMeetings(session) {
    if (USE_MOCK_DATA) {
      return mockDataService.fetchMeetings()
    }
    
    // Real Google Calendar implementation
    if (!session?.accessToken) {
      console.error('No access token available')
      return []
    }
    
    const now = new Date()
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59)
    
    const events = await getCalendarEvents(
      session.accessToken,
      now.toISOString(),
      endOfDay.toISOString()
    )
    
    return parseMeetingTypes(events)
  },
  
  async getCorrelations(session) {
    if (USE_MOCK_DATA) {
      return mockDataService.fetchCorrelations()
    }
    
    // Real correlation analysis would go here
    // This would analyze historical calendar data and performance metrics
    return []
  },
  
  async getMetrics(session) {
    if (USE_MOCK_DATA) {
      return mockDataService.fetchMetrics()
    }
    
    // Real metrics calculation would go here
    // This would aggregate today's meeting data
    return {}
  },
  
  async getWeeklyStats(session) {
    if (USE_MOCK_DATA) {
      return mockDataService.getWeeklyStats()
    }
    
    // Real weekly stats would go here
    // This would analyze the past week's calendar data
    return {}
  },
  
  // Utility to check data source
  isUsingMockData() {
    return USE_MOCK_DATA
  }
}

export default dataService