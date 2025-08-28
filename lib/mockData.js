// Mock meeting data service for MVP
// This module provides realistic meeting data for the dashboard
// Can be easily replaced with real Google Calendar API calls in the future

const generateMockMeetings = () => {
  const today = new Date();
  const currentHour = today.getHours();
  
  // Generate meetings for today
  const meetings = [
    {
      id: 'mock-1',
      title: 'Sprint Planning',
      time: '9:00 AM - 10:00 AM',
      type: 'Team Sync',
      attendees: ['Sarah Chen', 'Mike Johnson', 'Lisa Wang'],
      performance: 78,
      engagement: 'High',
      keyPoints: ['Q1 roadmap review', 'Resource allocation', 'Timeline adjustments'],
      actionItems: 3,
      status: currentHour >= 10 ? 'completed' : currentHour >= 9 ? 'active' : 'upcoming'
    },
    {
      id: 'mock-2',
      title: 'Product Design Review',
      time: '10:30 AM - 11:30 AM',
      type: 'Review',
      attendees: ['Design Team', 'Product Manager'],
      performance: 85,
      engagement: 'Medium',
      keyPoints: ['UI mockups approved', 'Color scheme finalized', 'User flow optimization'],
      actionItems: 2,
      status: currentHour >= 11.5 ? 'completed' : currentHour >= 10.5 ? 'active' : 'upcoming'
    },
    {
      id: 'mock-3',
      title: 'Client Check-in',
      time: '12:00 PM - 12:30 PM',
      type: 'External',
      attendees: ['Client Team', 'Account Manager'],
      performance: 92,
      engagement: 'High',
      keyPoints: ['Project status update', 'Budget review', 'Next phase planning'],
      actionItems: 1,
      status: currentHour >= 12.5 ? 'completed' : currentHour >= 12 ? 'active' : 'upcoming'
    },
    {
      id: 'mock-4',
      title: '1:1 with Manager',
      time: '2:00 PM - 2:30 PM',
      type: '1:1',
      attendees: ['Direct Manager'],
      performance: 88,
      engagement: 'High',
      keyPoints: ['Career development', 'Current project feedback', 'Goals alignment'],
      actionItems: 2,
      status: currentHour >= 14.5 ? 'completed' : currentHour >= 14 ? 'active' : 'upcoming'
    },
    {
      id: 'mock-5',
      title: 'Engineering Standup',
      time: '3:00 PM - 3:15 PM',
      type: 'Standup',
      attendees: ['Engineering Team'],
      performance: 75,
      engagement: 'Medium',
      keyPoints: ['Daily progress', 'Blockers', 'Tomorrow\'s priorities'],
      actionItems: 0,
      status: currentHour >= 15.25 ? 'completed' : currentHour >= 15 ? 'active' : 'upcoming'
    },
    {
      id: 'mock-6',
      title: 'Strategy Discussion',
      time: '4:00 PM - 5:00 PM',
      type: 'Strategic',
      attendees: ['Leadership Team'],
      performance: 90,
      engagement: 'High',
      keyPoints: ['Market analysis', 'Competitive positioning', 'Growth opportunities'],
      actionItems: 4,
      status: currentHour >= 17 ? 'completed' : currentHour >= 16 ? 'active' : 'upcoming'
    }
  ];

  return meetings;
};

const generateMockCorrelations = () => {
  return [
    {
      id: 'corr-1',
      type: 'positive',
      factor: 'Morning meetings (before 10 AM)',
      impact: '+15% performance',
      confidence: 0.89,
      sampleSize: 45,
      description: 'Your focus and engagement are significantly higher in morning meetings'
    },
    {
      id: 'corr-2',
      type: 'negative',
      factor: 'Back-to-back meetings (>3 consecutive)',
      impact: '-22% engagement',
      confidence: 0.92,
      sampleSize: 38,
      description: 'Performance drops when meetings are scheduled without breaks'
    },
    {
      id: 'corr-3',
      type: 'positive',
      factor: 'Smaller meetings (≤4 attendees)',
      impact: '+18% contribution',
      confidence: 0.85,
      sampleSize: 62,
      description: 'You contribute more effectively in smaller group settings'
    },
    {
      id: 'corr-4',
      type: 'neutral',
      factor: 'Video on vs. off',
      impact: 'No significant difference',
      confidence: 0.71,
      sampleSize: 89,
      description: 'Camera usage doesn\'t correlate with your meeting performance'
    }
  ];
};

const generateMockMetrics = () => {
  const meetings = generateMockMeetings();
  const completedMeetings = meetings.filter(m => m.status === 'completed');
  
  return {
    totalMeetings: meetings.length,
    completedMeetings: completedMeetings.length,
    averagePerformance: completedMeetings.length > 0 
      ? Math.round(completedMeetings.reduce((acc, m) => acc + m.performance, 0) / completedMeetings.length)
      : 0,
    totalHours: meetings.length * 0.75, // Rough estimate
    meetingDensity: 'Moderate',
    workloadTrend: 'Stable',
    engagementScore: 82,
    productivityIndex: 76
  };
};

const generateWeeklyStats = () => {
  return {
    monday: { meetings: 6, performance: 78 },
    tuesday: { meetings: 8, performance: 82 },
    wednesday: { meetings: 5, performance: 85 },
    thursday: { meetings: 7, performance: 79 },
    friday: { meetings: 4, performance: 88 },
    average: 80,
    trend: 'improving'
  };
};

// Export functions that match the structure of real API calls
export const mockDataService = {
  getMeetings: generateMockMeetings,
  getCorrelations: generateMockCorrelations,
  getMetrics: generateMockMetrics,
  getWeeklyStats: generateWeeklyStats,
  
  // Feature flag to easily switch between mock and real data
  useMockData: true,
  
  // Async wrappers to match real API call patterns
  fetchMeetings: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateMockMeetings();
  },
  
  fetchCorrelations: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return generateMockCorrelations();
  },
  
  fetchMetrics: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return generateMockMetrics();
  }
};

export default mockDataService;