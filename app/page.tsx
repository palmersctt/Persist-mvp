'use client'

import { useState, useEffect } from 'react'

// Meeting Monitor for tracking meeting completion and triggering feedback
class MeetingMonitor {
  constructor() {
    this.activeMeetings = new Map(); // Track active meetings
    this.completedMeetings = new Set(); // Track completed meetings
    this.feedbackQueue = []; // Queue for feedback collection
    this.checkInterval = null;
    this.onMeetingEnd = null; // Callback for when meeting ends
  }

  // Parse time string to Date object for today
  parseTimeToDate(timeStr) {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(n => parseInt(n));
    let hour = hours;
    
    if (period === 'PM' && hours !== 12) hour += 12;
    if (period === 'AM' && hours === 12) hour = 0;
    
    const date = new Date();
    date.setHours(hour, minutes, 0, 0);
    return date;
  }

  // Extract start and end times from meeting time string
  parseMeetingTime(timeString) {
    const [startStr, endStr] = timeString.split(' - ');
    return {
      start: this.parseTimeToDate(startStr),
      end: this.parseTimeToDate(endStr)
    };
  }

  // Check if a meeting should have ended
  isMeetingEnded(meeting, currentTime = new Date()) {
    const { end } = this.parseMeetingTime(meeting.time);
    return currentTime >= end;
  }

  // Check if a meeting is currently active
  isMeetingActive(meeting, currentTime = new Date()) {
    const { start, end } = this.parseMeetingTime(meeting.time);
    return currentTime >= start && currentTime < end;
  }

  // Get meeting status
  getMeetingStatus(meeting, currentTime = new Date()) {
    const { start, end } = this.parseMeetingTime(meeting.time);
    
    if (currentTime < start) return 'upcoming';
    if (currentTime >= start && currentTime < end) return 'active';
    if (currentTime >= end) return 'completed';
    
    return 'unknown';
  }

  // Start monitoring meetings
  startMonitoring(meetings, onMeetingEndCallback) {
    this.onMeetingEnd = onMeetingEndCallback;
    
    // Clear any existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Initial check
    this.checkMeetings(meetings);

    // Check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkMeetings(meetings);
    }, 30000);
  }

  // Check all meetings for status changes
  checkMeetings(meetings) {
    const currentTime = new Date();
    
    meetings.forEach(meeting => {
      const status = this.getMeetingStatus(meeting, currentTime);
      const wasActive = this.activeMeetings.has(meeting.id);
      const wasCompleted = this.completedMeetings.has(meeting.id);
      
      // Meeting just started
      if (status === 'active' && !wasActive) {
        this.activeMeetings.set(meeting.id, {
          ...meeting,
          actualStartTime: currentTime,
          status: 'active'
        });
        console.log(`Meeting started: ${meeting.title}`);
      }
      
      // Meeting just ended
      if (status === 'completed' && !wasCompleted) {
        const activeMeeting = this.activeMeetings.get(meeting.id);
        
        // Mark as completed
        this.completedMeetings.add(meeting.id);
        this.activeMeetings.delete(meeting.id);
        
        // Calculate actual duration if it was tracked
        const actualDuration = activeMeeting 
          ? Math.round((currentTime - activeMeeting.actualStartTime) / 60000)
          : null;
        
        // Add to feedback queue
        const feedbackItem = {
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          scheduledTime: meeting.time,
          completedAt: currentTime,
          actualDuration,
          status: 'pending_feedback',
          type: meeting.type
        };
        
        this.feedbackQueue.push(feedbackItem);
        
        // Trigger callback
        if (this.onMeetingEnd) {
          this.onMeetingEnd(feedbackItem);
        }
        
        console.log(`Meeting ended: ${meeting.title} - Feedback requested`);
      }
    });
  }

  // Handle edge cases
  handleMeetingOverrun(meetingId, additionalMinutes) {
    const meeting = this.activeMeetings.get(meetingId);
    if (meeting) {
      meeting.overrunMinutes = additionalMinutes;
      console.log(`Meeting overrun: ${meeting.title} by ${additionalMinutes} minutes`);
    }
  }

  handleMeetingCancellation(meetingId) {
    // Remove from active meetings
    this.activeMeetings.delete(meetingId);
    
    // Add to completed with cancelled status
    this.completedMeetings.add(meetingId);
    
    console.log(`Meeting cancelled: ${meetingId}`);
  }

  // Get pending feedback items
  getPendingFeedback() {
    return this.feedbackQueue.filter(item => item.status === 'pending_feedback');
  }

  // Mark feedback as complete
  markFeedbackComplete(meetingId) {
    const item = this.feedbackQueue.find(f => f.meetingId === meetingId);
    if (item) {
      item.status = 'feedback_complete';
      item.feedbackCompletedAt = new Date();
    }
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Get summary of meeting statuses
  getMeetingSummary(meetings) {
    const currentTime = new Date();
    return meetings.map(meeting => ({
      ...meeting,
      status: this.getMeetingStatus(meeting, currentTime),
      isActive: this.activeMeetings.has(meeting.id),
      isCompleted: this.completedMeetings.has(meeting.id),
      hasPendingFeedback: this.feedbackQueue.some(
        f => f.meetingId === meeting.id && f.status === 'pending_feedback'
      )
    }));
  }
}

// Enhanced Engine for biometric and meeting analysis
class BiometricEngine {
  constructor() {
    this.currentData = {
      readiness: 87,
      recovery: 94,
      strain: 12.1,
      hrv: 67,
      sleep: '8.4h',
      status: 'READY'
    };
  }

  // Intelligent meeting type classification
  classifyMeetingType(title, duration = null, participantCount = null) {
    const titleLower = title.toLowerCase();
    
    // Check for specific keywords
    if (titleLower.includes('standup') || titleLower.includes('stand-up') || titleLower.includes('daily')) {
      return 'team_meeting';
    }
    
    if (titleLower.includes('1:1') || titleLower.includes('1-1') || titleLower.includes('one-on-one') || 
        titleLower.includes('check-in') || titleLower.includes('checkin')) {
      return 'one_on_one';
    }
    
    if (titleLower.includes('planning') || titleLower.includes('budget') || titleLower.includes('strategy') ||
        titleLower.includes('roadmap') || titleLower.includes('quarterly') || titleLower.includes('board')) {
      return 'strategic';
    }
    
    if (titleLower.includes('presentation') || titleLower.includes('demo') || titleLower.includes('showcase') ||
        titleLower.includes('review') || titleLower.includes('pitch')) {
      return 'presentation';
    }
    
    if (titleLower.includes('client') || titleLower.includes('customer') || titleLower.includes('vendor') ||
        titleLower.includes('sales') || titleLower.includes('partner') || titleLower.includes('contract')) {
      return 'client_meeting';
    }
    
    if (titleLower.includes('team') || titleLower.includes('sync') || titleLower.includes('meeting') ||
        titleLower.includes('retrospective') || titleLower.includes('retro')) {
      return 'team_meeting';
    }
    
    // Use participant count if available
    if (participantCount !== null) {
      if (participantCount === 2) return 'one_on_one';
      if (participantCount >= 5) return 'team_meeting';
    }
    
    // Default to general if uncertain
    return 'general';
  }

  getCurrentBiometrics() {
    return this.currentData;
  }

  getTodaysRecommendations() {
    return [
      {
        id: 1,
        message: "Your 87% readiness indicates optimal conditions for peak professional performance. Morning meetings (8-10:30 AM) align with your cognitive peak window."
      },
      {
        id: 2, 
        message: "High meeting density today (7 meetings). Consider delegating or rescheduling your 11 AM and 2 PM sessions where performance dips to 64-66%."
      },
      {
        id: 3,
        message: "Strong recovery end anticipated. Your 5 PM Vendor Discussion shows 93% predicted performance - ideal for critical negotiations."
      }
    ];
  }

  getBiometricBreakdown(type) {
    const breakdowns = {
      readiness: {
        title: "Professional Readiness Score",
        score: 87,
        components: [
          { name: "Recovery", value: 94, weight: 35, contribution: 33 },
          { name: "Sleep Performance", value: 89, weight: 25, contribution: 22 },
          { name: "HRV", value: 67, weight: 20, contribution: 13 },
          { name: "Resting Heart Rate", value: 85, weight: 15, contribution: 13 },
          { name: "Previous Day Strain", value: 78, weight: 5, contribution: 4 }
        ],
        explanation: "Your readiness score combines recovery metrics with sleep quality and stress resilience indicators. Today's 87% indicates optimal conditions for peak professional performance - perfect for your most important meetings.",
        factors: {
          positive: ["Excellent recovery (94%)", "Strong sleep performance (8.4h)", "Stress resilience above optimal levels"],
          negative: ["Yesterday's workload slightly impacting today's capacity"]
        }
      },
      recovery: {
        title: "Recovery Score",
        score: 94,
        components: [
          { name: "HRV", value: 67, weight: 50, contribution: 47 },
          { name: "Resting Heart Rate", value: 52, weight: 30, contribution: 28 },
          { name: "Sleep Quality", value: 92, weight: 20, contribution: 18 }
        ],
        explanation: "Recovery measures how well your body has bounced back from recent work demands and stress. 94% indicates exceptional recovery - you're primed for peak professional performance.",
        factors: {
          positive: ["Stress resilience significantly above baseline", "Optimal resting heart rate for performance", "Sleep quality optimized for cognitive function"],
          negative: []
        }
      },
      strain: {
        title: "Daily Strain",
        score: 12.1,
        components: [
          { name: "Work Stress Load", value: 45, weight: 40, contribution: 4.8 },
          { name: "Daily Demands", value: 38, weight: 35, contribution: 4.2 },
          { name: "Stress Management", value: 42, weight: 25, contribution: 3.1 }
        ],
        explanation: "Daily Strain reflects your body's response to work demands and daily stressors. 12.1 is moderate - optimal for sustained professional performance without burnout.",
        factors: {
          positive: ["Balanced workload management", "Well-regulated stress response"],
          negative: ["Capacity for additional high-priority tasks"]
        }
      }
    };
    
    return breakdowns[type];
  }

  // Get current date info
  getCurrentDateInfo() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      now,
      today,
      yesterday: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      tomorrow: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      dayOfMonth: today.getDate(),
      month: today.getMonth(),
      year: today.getFullYear()
    };
  }

  // Check if meeting has ended (for rating purposes)
  hasMeetingEnded(dateOffset, timeString) {
    const dateInfo = this.getCurrentDateInfo();
    const meetingDate = new Date(dateInfo.today);
    meetingDate.setDate(meetingDate.getDate() + dateOffset);
    
    // If meeting is in the past, it's ended
    if (dateOffset < 0) return true;
    
    // If meeting is in the future, it hasn't ended
    if (dateOffset > 0) return false;
    
    // If meeting is today, check the end time
    if (dateOffset === 0) {
      const endTime = timeString.split(' - ')[1];
      const [time, period] = endTime.split(' ');
      const [hours, minutes] = time.split(':').map(n => parseInt(n));
      let hour = hours;
      
      if (period === 'PM' && hours !== 12) hour += 12;
      if (period === 'AM' && hours === 12) hour = 0;
      
      const endDateTime = new Date();
      endDateTime.setHours(hour, minutes, 0, 0);
      
      return dateInfo.now >= endDateTime;
    }
    
    return false;
  }

  // Get today's meetings with realistic busy schedule (7 meetings)
  getTodaysMeetings() {
    return [
      {
        id: 'today-1',
        title: "Daily Standup",
        time: "8:00 AM - 8:15 AM",
        type: "team_meeting",
        prediction: { outcome: 'excellent', confidence: 94 },
        historical: { totalMeetings: 3, averagePerformance: 94 }
      },
      {
        id: 'today-2',
        title: "Product Strategy Review",
        time: "9:30 AM - 10:30 AM",
        type: "strategic",
        prediction: { outcome: 'good', confidence: 88 },
        historical: { totalMeetings: 5, averagePerformance: 88 }
      },
      {
        id: 'today-3',
        title: "Client Check-in",
        time: "11:00 AM - 11:30 AM",
        type: "one_on_one",
        prediction: { outcome: 'adequate', confidence: 66 },
        historical: { totalMeetings: 8, averagePerformance: 66 }
      },
      {
        id: 'today-4',
        title: "Budget Planning",
        time: "12:00 PM - 1:00 PM",
        type: "strategic",
        prediction: { outcome: 'good', confidence: 78 },
        historical: { totalMeetings: 2, averagePerformance: 78 }
      },
      {
        id: 'today-5',
        title: "Team Performance Review",
        time: "2:00 PM - 3:30 PM",
        type: "one_on_one",
        prediction: { outcome: 'adequate', confidence: 64 },
        historical: { totalMeetings: 6, averagePerformance: 64 }
      },
      {
        id: 'today-6',
        title: "Marketing Campaign Review",
        time: "4:00 PM - 4:45 PM",
        type: "team_meeting",
        prediction: { outcome: 'good', confidence: 87 },
        historical: { totalMeetings: 4, averagePerformance: 87 }
      },
      {
        id: 'today-7',
        title: "Vendor Discussion",
        time: "5:00 PM - 6:00 PM",
        type: "client_meeting",
        prediction: { outcome: 'excellent', confidence: 93 },
        historical: { totalMeetings: 3, averagePerformance: 93 }
      }
    ];
  }

  // Get meetings for specific dates with realistic date offsets
  getMeetingsForDate(dateOffset) {
    const dateInfo = this.getCurrentDateInfo();
    const targetDate = new Date(dateInfo.today);
    targetDate.setDate(targetDate.getDate() + dateOffset);
    
    // Add dateOffset and hasEnded properties to each meeting
    const addMeetingMetadata = (meetings, offset) => {
      return meetings.map(meeting => ({
        ...meeting,
        dateOffset: offset,
        hasEnded: this.hasMeetingEnded(offset, meeting.time),
        date: new Date(dateInfo.today.getTime() + offset * 24 * 60 * 60 * 1000)
      }));
    };

    const meetingsByOffset = {
      '-2': addMeetingMetadata([ // 2 days ago
        {
          id: 'past-2-1',
          title: "Board Meeting",
          time: "10:00 AM - 11:30 AM",
          type: "strategic",
          prediction: { outcome: 'excellent', confidence: 95 },
          historical: { totalMeetings: 8, averagePerformance: 92 }
        },
        {
          id: 'past-2-2',
          title: "Product Review",
          time: "2:00 PM - 3:30 PM",
          type: "team_meeting",
          prediction: { outcome: 'good', confidence: 88 },
          historical: { totalMeetings: 12, averagePerformance: 85 }
        }
      ], -2),
      '-1': addMeetingMetadata([ // Yesterday
        {
          id: 'past-1-1',
          title: "Client Presentation",
          time: "11:00 AM - 12:00 PM",
          type: "presentation",
          prediction: { outcome: 'good', confidence: 82 },
          historical: { totalMeetings: 6, averagePerformance: 78 }
        },
        {
          id: 'past-1-2',
          title: "Team Retrospective",
          time: "3:00 PM - 4:00 PM",
          type: "team_meeting",
          prediction: { outcome: 'excellent', confidence: 90 },
          historical: { totalMeetings: 15, averagePerformance: 88 }
        },
        {
          id: 'past-1-3',
          title: "Budget Review",
          time: "4:30 PM - 5:30 PM",
          type: "strategic",
          prediction: { outcome: 'adequate', confidence: 75 },
          historical: { totalMeetings: 4, averagePerformance: 72 }
        }
      ], -1),
      '0': addMeetingMetadata(this.getTodaysMeetings(), 0), // Today
      '1': addMeetingMetadata([ // Tomorrow
        {
          id: 'future-1-1',
          title: "Leadership Team Meeting",
          time: "8:00 AM - 9:00 AM",
          type: "strategic",
          prediction: { outcome: 'excellent', confidence: 90 },
          historical: { totalMeetings: 12, averagePerformance: 88 }
        },
        {
          id: 'future-1-2',
          title: "Client Check-in",
          time: "10:00 AM - 11:00 AM",
          type: "one_on_one",
          prediction: { outcome: 'good', confidence: 85 },
          historical: { totalMeetings: 7, averagePerformance: 82 }
        },
        {
          id: 'future-1-3',
          title: "Sprint Planning",
          time: "2:00 PM - 4:00 PM",
          type: "team_meeting",
          prediction: { outcome: 'good', confidence: 78 },
          historical: { totalMeetings: 20, averagePerformance: 75 }
        }
      ], 1),
      '2': addMeetingMetadata([ // Day after tomorrow
        {
          id: 'tue-1',
          title: "Leadership Team Meeting",
          time: "8:00 AM - 9:00 AM",
          type: "strategic",
          prediction: { outcome: 'excellent', confidence: 90 },
          historical: { totalMeetings: 12, averagePerformance: 88 }
        },
        {
          id: 'tue-2',
          title: "Client Presentation",
          time: "10:00 AM - 11:30 AM",
          type: "presentation",
          prediction: { outcome: 'good', confidence: 82 },
          historical: { totalMeetings: 7, averagePerformance: 79 }
        },
        {
          id: 'tue-3',
          title: "Budget Review",
          time: "2:00 PM - 3:00 PM",
          type: "strategic",
          prediction: { outcome: 'good', confidence: 78 },
          historical: { totalMeetings: 4, averagePerformance: 73 }
        }
      ], 2),
      '3': addMeetingMetadata([ // 3 days from now
        {
          id: 'wed-1',
          title: "Board Presentation",
          time: "9:00 AM - 10:00 AM",
          type: "presentation",
          prediction: { outcome: 'adequate', confidence: 68 },
          historical: { totalMeetings: 2, averagePerformance: 65 },
          rescheduleSuggestion: {
            day: 'Friday',
            time: '9:00 AM',
            improvement: '+21% vs current time'
          }
        },
        {
          id: 'wed-2',
          title: "1:1 with Manager",
          time: "11:00 AM - 11:30 AM",
          type: "one_on_one",
          prediction: { outcome: 'excellent', confidence: 91 },
          historical: { totalMeetings: 15, averagePerformance: 87 }
        }
      ], 3)
    };
    
    return meetingsByOffset[dateOffset.toString()] || [];
  }


  getDayName(dateOffset) {
    const dateInfo = this.getCurrentDateInfo();
    const targetDate = new Date(dateInfo.today);
    targetDate.setDate(targetDate.getDate() + dateOffset);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const relativeDayNames = {
      '-2': '2 days ago',
      '-1': 'Yesterday',
      '0': 'Today',
      '1': 'Tomorrow',
      '2': dayNames[targetDate.getDay()],
      '3': dayNames[targetDate.getDay()]
    };
    
    return relativeDayNames[dateOffset.toString()] || dayNames[targetDate.getDay()];
  }

  // Get week view data with actual dates
  getWeekMeetings() {
    const dateInfo = this.getCurrentDateInfo();
    const today = dateInfo.today;
    const todayDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc
    
    // Calculate offset to start from Monday of current week
    // If today is Sunday (0), we want to go back 6 days to get Monday
    // If today is Monday (1), offset is 0
    // If today is Tuesday (2), offset is -1, etc.
    const mondayOffset = todayDayOfWeek === 0 ? -6 : 1 - todayDayOfWeek;
    
    // Generate 5-day work week (Monday to Friday)
    const weekDays = [];
    for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
      const offset = mondayOffset + dayIndex;
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + offset);
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const dayName = dayNames[targetDate.getDay()];
      const monthName = monthNames[targetDate.getMonth()];
      const dayNumber = targetDate.getDate();
      
      // Check if this is today
      const isToday = targetDate.toDateString() === today.toDateString();
      
      // Format: "Mon 8/25" or "Mon 8/25 (Today)" for current day
      let displayName = `${dayName.substring(0, 3)} ${targetDate.getMonth() + 1}/${dayNumber}`;
      
      if (isToday) {
        displayName += ' (Today)';
      }
      
      weekDays.push({
        day: displayName,
        meetings: this.getMeetingsForDate(offset),
        isToday: isToday,
        date: targetDate,
        dateOffset: offset
      });
    }
    
    return weekDays;
  }
}

export default function PersistDashboard() {
  const [viewMode, setViewMode] = useState('dashboard');
  const [calendarView, setCalendarView] = useState('today');
  const [selectedBiometric, setSelectedBiometric] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [engine] = useState(() => new BiometricEngine());
  const [meetingMonitor] = useState(() => new MeetingMonitor());
  const [currentBiometrics, setCurrentBiometrics] = useState(null);
  const [todaysRecommendations, setTodaysRecommendations] = useState([]);
  const [todaysMeetings, setTodaysMeetings] = useState([]);
  const [feedbackModal, setFeedbackModal] = useState(null); // null or meeting object
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [ratedMeetings, setRatedMeetings] = useState(new Set()); // Track which meetings have been rated
  const [correctedMeetingType, setCorrectedMeetingType] = useState(null); // Track user-corrected meeting type
  const [editingMeetingType, setEditingMeetingType] = useState(null); // Track which meeting's type is being edited
  const [meetingTypes, setMeetingTypes] = useState({}); // Store corrected meeting types
  const [typeUpdateConfirm, setTypeUpdateConfirm] = useState(null); // Show confirmation for type updates

  useEffect(() => {
    setCurrentBiometrics(engine.getCurrentBiometrics());
    setTodaysRecommendations(engine.getTodaysRecommendations());
    setTodaysMeetings(engine.getTodaysMeetings());
  }, [engine]);

  // Load rated meetings from localStorage on mount
  useEffect(() => {
    // For fresh testing, we'll start with empty ratings
    // Comment out the lines below if you want to persist ratings between sessions
    
    const savedRatedMeetings = localStorage.getItem('ratedMeetings');
    if (savedRatedMeetings) {
      try {
        const parsed = JSON.parse(savedRatedMeetings);
        setRatedMeetings(new Set(parsed));
      } catch (error) {
        console.warn('Error loading rated meetings from localStorage:', error);
      }
    }
  }, []);

  // Save rated meetings to localStorage whenever it changes
  useEffect(() => {
    if (ratedMeetings.size > 0) {
      localStorage.setItem('ratedMeetings', JSON.stringify([...ratedMeetings]));
    }
  }, [ratedMeetings]);

  // Initialize meeting monitoring (simplified - no banner needed)
  useEffect(() => {
    if (todaysMeetings.length > 0) {
      // Define callback for when a meeting ends
      const handleMeetingEnd = (feedbackItem) => {
        console.log('Meeting ended:', feedbackItem.meetingTitle);
        
        // Optional: Show browser notification (requires permission)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Meeting Feedback', {
            body: `How was your ${feedbackItem.meetingTitle}?`,
            icon: '/icon.png'
          });
        }
      };

      // Start monitoring meetings
      meetingMonitor.startMonitoring(todaysMeetings, handleMeetingEnd);

      // Cleanup on unmount
      return () => {
        meetingMonitor.stopMonitoring();
      };
    }
  }, [todaysMeetings, meetingMonitor]);

  const getCircleColor = (type) => {
    if (!currentBiometrics) return '#ff9500';
    
    if (type === 'readiness') {
      if (currentBiometrics.readiness >= 80) return '#00ff41'
      if (currentBiometrics.readiness >= 60) return '#ff9500'
      return '#ff3b30'
    }
    if (type === 'recovery') {
      if (currentBiometrics.recovery >= 85) return '#00ff41'
      if (currentBiometrics.recovery >= 65) return '#ff9500'
      return '#ff3b30'
    }
    return '#007aff' // strain
  }

  const getStrokeDashoffset = (percentage) => {
    const circumference = 339.29
    return circumference - (percentage / 100) * circumference
  }

  const getMeetingTypeColor = (type) => {
    const colors = {
      presentation: 'bg-purple-100 text-purple-800',
      client_meeting: 'bg-amber-100 text-amber-800',
      strategic: 'bg-blue-100 text-blue-800',
      team_meeting: 'bg-gray-100 text-gray-800',
      one_on_one: 'bg-green-100 text-green-800',
      general: 'bg-slate-100 text-slate-800'
    };
    return colors[type] || colors.general;
  };

  const getPerformanceColor = (outcome) => {
    const colors = {
      excellent: 'bg-green-900 text-green-300',
      good: 'bg-blue-900 text-blue-300',
      adequate: 'bg-gray-700 text-gray-300',
      poor: 'bg-red-900 text-red-300'
    };
    return colors[outcome] || colors.adequate;
  };

  if (!currentBiometrics) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  const handleLogoClick = () => {
    setViewMode('dashboard');
    setCalendarView('today');
    setSelectedBiometric(null);
    setSelectedMeeting(null);
    setSelectedDate(null);
  };

  const handleRateMeeting = (meeting, e) => {
    e.stopPropagation(); // Prevent triggering meeting selection
    setFeedbackModal(meeting);
    setFeedbackRating(0);
    setFeedbackSubmitted(false);
    setCorrectedMeetingType(meeting.type); // Initialize with current type
  };

  const handleSubmitFeedback = () => {
    if (feedbackRating > 0) {
      // Store feedback data (in real app, this would go to backend)
      const feedbackData = {
        meetingId: feedbackModal.id,
        meetingTitle: feedbackModal.title,
        originalMeetingType: feedbackModal.type,
        correctedMeetingType: correctedMeetingType,
        typeWasCorrected: correctedMeetingType !== feedbackModal.type,
        scheduledTime: feedbackModal.time,
        predictedOutcome: feedbackModal.prediction.outcome,
        actualRating: feedbackRating,
        submittedAt: new Date(),
      };
      
      console.log('Feedback submitted:', feedbackData);
      
      // If type was corrected, log for learning
      if (feedbackData.typeWasCorrected) {
        console.log(`Meeting type corrected: ${feedbackModal.title} was ${feedbackModal.type}, should be ${correctedMeetingType}`);
      }
      
      // Store rating data
      storeMeetingRating(feedbackModal.id, feedbackRating);
      
      // Mark meeting as rated
      setRatedMeetings(prev => new Set([...prev, feedbackModal.id]));
      
      // Show success state
      setFeedbackSubmitted(true);
      
      // Close modal after brief delay
      setTimeout(() => {
        setFeedbackModal(null);
        setFeedbackRating(0);
        setFeedbackSubmitted(false);
      }, 2000);
    }
  };

  const getRatingLabel = (rating) => {
    switch(rating) {
      case 1: return 'Poor';
      case 2: return 'Below Average';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  // Reset all meeting ratings (for testing/development)
  const resetAllRatings = () => {
    // Clear localStorage data
    localStorage.removeItem('ratedMeetings');
    localStorage.removeItem('meetingRatings');
    
    // Reset state variables
    setRatedMeetings(new Set());
    
    console.log('✅ All meeting ratings have been reset');
    console.log('📝 All eligible meetings should now show "Rate Meeting" buttons');
    console.log('🔄 Meeting detail views will only show predicted performance');
  };

  // Get stored rating data for a meeting
  const getMeetingRating = (meetingId) => {
    // In a real app, this would come from your backend/database
    // For now, we'll use localStorage to simulate stored ratings
    try {
      const storedRatings = localStorage.getItem('meetingRatings');
      if (storedRatings) {
        const ratings = JSON.parse(storedRatings);
        return ratings[meetingId] || null;
      }
    } catch (error) {
      console.warn('Error loading meeting ratings:', error);
    }
    return null;
  };

  // Store a meeting rating
  const storeMeetingRating = (meetingId, rating) => {
    try {
      const storedRatings = localStorage.getItem('meetingRatings');
      const ratings = storedRatings ? JSON.parse(storedRatings) : {};
      ratings[meetingId] = rating;
      localStorage.setItem('meetingRatings', JSON.stringify(ratings));
    } catch (error) {
      console.warn('Error storing meeting rating:', error);
    }
  };

  // Get prediction accuracy comparison
  const getPredictionAccuracy = (predicted, actualRating) => {
    // Convert prediction to numeric scale
    const predictionMap = { poor: 1, adequate: 2, good: 4, excellent: 5 };
    const predictedNumeric = predictionMap[predicted.toLowerCase()] || 3;
    
    const difference = actualRating - predictedNumeric;
    
    if (Math.abs(difference) <= 1) {
      return { status: 'accurate', message: 'Prediction was accurate' };
    } else if (difference > 1) {
      return { status: 'pessimistic', message: 'Prediction was pessimistic' };
    } else {
      return { status: 'optimistic', message: 'Prediction was optimistic' };
    }
  };

  // Handle meeting type badge click
  const handleMeetingTypeBadgeClick = (meeting, e) => {
    e.stopPropagation();
    setEditingMeetingType(meeting.id);
  };

  // Handle meeting type change
  const handleMeetingTypeChange = (meetingId, newType, originalType) => {
    setMeetingTypes(prev => ({
      ...prev,
      [meetingId]: newType
    }));
    setEditingMeetingType(null);
    
    // Show confirmation
    setTypeUpdateConfirm(meetingId);
    setTimeout(() => setTypeUpdateConfirm(null), 2000);
    
    // Log for learning
    console.log(`Meeting type updated: ${meetingId} changed from ${originalType} to ${newType}`);
  };

  // Get display type for a meeting (corrected or original)
  const getMeetingDisplayType = (meeting) => {
    return meetingTypes[meeting.id] || meeting.type;
  };

  // Meeting Type Badge Component
  const MeetingTypeBadge = ({ meeting, className = "" }) => {
    const currentType = getMeetingDisplayType(meeting);
    const isEditing = editingMeetingType === meeting.id;
    const showConfirm = typeUpdateConfirm === meeting.id;
    
    return (
      <div className="relative inline-block">
        {isEditing ? (
          <select
            autoFocus
            value={currentType}
            onChange={(e) => handleMeetingTypeChange(meeting.id, e.target.value, meeting.type)}
            onBlur={() => setEditingMeetingType(null)}
            className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:outline-none focus:border-blue-500"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="team_meeting">Team Meeting</option>
            <option value="one_on_one">One-on-One</option>
            <option value="strategic">Strategic</option>
            <option value="presentation">Presentation</option>
            <option value="client_meeting">Client Meeting</option>
            <option value="general">General</option>
          </select>
        ) : (
          <>
            <span
              className={`${className} ${getMeetingTypeColor(currentType)} cursor-pointer hover:opacity-80 transition-opacity select-none`}
              onClick={(e) => handleMeetingTypeBadgeClick(meeting, e)}
              title="Click to change meeting type"
            >
              {currentType === 'client_meeting' ? 'client meeting' : currentType.replace('_', ' ')}
            </span>
            {showConfirm && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-800 text-green-200 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                ✓ Type updated
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Mobile-First Header */}
      <header className="bg-black border-b border-gray-900 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 
            className="text-lg sm:text-xl font-bold text-white tracking-wide cursor-pointer hover:text-gray-300 transition-colors"
            onClick={handleLogoClick}
          >
            PERSIST
          </h1>
          <div className="text-right hidden sm:block">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Biometric Driven</div>
              <div className="text-white font-medium">Professional Intelligence</div>
            </div>
          </div>
          {/* Mobile-only biometric indicator */}
          <div className="sm:hidden text-right">
            <div className="text-2xl font-bold text-green-400">{currentBiometrics.readiness}%</div>
            <div className="text-xs text-gray-500 uppercase">Ready</div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation - Hidden on Mobile */}
      <div className="hidden md:block px-6 pt-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('dashboard')}
                className={`flex-1 px-6 py-3 rounded-md text-base font-medium transition-all touch-manipulation min-h-[44px] ${
                  viewMode === 'dashboard' ? 'bg-white text-black' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={`flex-1 px-6 py-3 rounded-md text-base font-medium transition-all touch-manipulation min-h-[44px] ${
                  viewMode === 'calendar' ? 'bg-white text-black' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Mobile Padding */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-20 md:pb-8">

        {viewMode === 'dashboard' ? (
          selectedBiometric ? (
            /* Biometric Detail View */
            <div className="space-y-6">
              <button
                onClick={() => setSelectedBiometric(null)}
                className="text-gray-400 hover:text-white transition-colors mb-4"
              >
                ← Back to Dashboard
              </button>
              
              <div className="bg-gray-900 rounded-lg p-8 border border-gray-700">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {engine.getBiometricBreakdown(selectedBiometric).title}
                    </h2>
                    <div className="text-4xl font-bold text-green-400">
                      {selectedBiometric === 'strain' ? 
                        engine.getBiometricBreakdown(selectedBiometric).score :
                        engine.getBiometricBreakdown(selectedBiometric).score + '%'
                      }
                    </div>
                  </div>
                  
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a1a" strokeWidth="6"/>
                      <circle cx="60" cy="60" r="54" fill="none" stroke={getCircleColor(selectedBiometric)} strokeWidth="6"
                              strokeDasharray="339.29" strokeDashoffset={selectedBiometric === 'strain' ? 
                                getStrokeDashoffset(Math.min(currentBiometrics.strain * 5, 100)) :
                                getStrokeDashoffset(engine.getBiometricBreakdown(selectedBiometric).score)} strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Score Breakdown */}
                  <div className="space-y-6">
                    <section className="bg-gray-800 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Score Breakdown</h3>
                      <div className="space-y-4">
                        {engine.getBiometricBreakdown(selectedBiometric).components.map((component, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">{component.name}</span>
                              <div className="flex items-center space-x-3">
                                <span className="text-white font-medium">{component.value}{selectedBiometric === 'strain' ? '' : '%'}</span>
                                <span className="text-gray-500 text-sm">{component.weight}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{width: `${(component.contribution / engine.getBiometricBreakdown(selectedBiometric).score) * 100}%`}}
                              ></div>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              Contributes {component.contribution}{selectedBiometric === 'strain' ? '' : '%'} to total score
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Analysis & Factors */}
                  <div className="space-y-6">
                    <section className="bg-gray-800 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Analysis</h3>
                      <p className="text-gray-300 leading-relaxed mb-6">
                        {engine.getBiometricBreakdown(selectedBiometric).explanation}
                      </p>
                      
                      {engine.getBiometricBreakdown(selectedBiometric).factors.positive.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-green-400 font-semibold mb-2">Positive Factors</h4>
                          <ul className="space-y-1">
                            {engine.getBiometricBreakdown(selectedBiometric).factors.positive.map((factor, index) => (
                              <li key={index} className="text-green-300 text-sm">{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {engine.getBiometricBreakdown(selectedBiometric).factors.negative.length > 0 && (
                        <div>
                          <h4 className="text-yellow-400 font-semibold mb-2">Areas for Improvement</h4>
                          <ul className="space-y-1">
                            {engine.getBiometricBreakdown(selectedBiometric).factors.negative.map((factor, index) => (
                              <li key={index} className="text-yellow-300 text-sm">{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Main Dashboard View - Mobile First */
            <div className="space-y-6 sm:space-y-8 md:space-y-12 pt-4 md:pt-0">
              
              {/* 1. MOBILE-OPTIMIZED PROFESSIONAL READINESS RING */}
              <section className="px-2 sm:px-0">
                <div className="flex justify-center">
                  <div 
                    className="text-center cursor-pointer group w-full max-w-xs sm:max-w-none"
                    onClick={() => setSelectedBiometric('readiness')}
                  >
                    {/* Mobile Ring - 80% viewport width on mobile */}
                    <div className="relative w-[80vw] h-[80vw] max-w-[280px] max-h-[280px] sm:w-48 sm:h-48 mx-auto mb-4 group-hover:scale-105 transition-transform">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
                        <circle cx="90" cy="90" r="80" fill="none" stroke="#1a1a1a" strokeWidth="8"/>
                        <circle cx="90" cy="90" r="80" fill="none" stroke={getCircleColor('readiness')} strokeWidth="8"
                                strokeDasharray="502.65" strokeDashoffset={(502.65 - (currentBiometrics.readiness / 100) * 502.65)} strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-5xl sm:text-4xl font-bold text-white mb-1">{currentBiometrics.readiness}%</div>
                          <div className="text-base sm:text-sm text-gray-400 uppercase">Professional</div>
                          <div className="text-base sm:text-sm text-gray-400 uppercase">Readiness</div>
                        </div>
                      </div>
                    </div>
                    {/* Mobile tap hint */}
                    <p className="text-xs text-gray-500 sm:hidden">Tap for details</p>
                  </div>
                </div>
              </section>

              {/* 2. MOBILE-OPTIMIZED WORK IMPACT FOCUS */}
              <section className="px-2 sm:px-0">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Today's Work Impact Focus</h2>
                
                <div className="space-y-3 sm:space-y-4">
                  {todaysRecommendations.map((rec) => (
                    <div key={rec.id} className="bg-gray-950 rounded-lg p-4 sm:p-6 border border-gray-800">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-green-400"></div>
                        <div className="flex-1">
                          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                            {rec.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. MOBILE-OPTIMIZED TODAY'S MEETINGS */}
              <section className="px-2 sm:px-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-2">
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Today's Meetings</h2>
                  <span className="text-xs sm:text-sm text-yellow-400 bg-yellow-900/20 px-3 py-1 rounded-full inline-block w-fit">
                    High workload (7 meetings)
                  </span>
                </div>
                
                {/* Mobile-optimized meeting cards */}
                <div className="space-y-3">
                  {todaysMeetings.map((meeting) => {
                    const performanceScore = meeting.historical.averagePerformance;
                    const getScoreColor = (score) => {
                      if (score >= 90) return 'text-green-400 bg-green-900/20';
                      if (score >= 80) return 'text-blue-400 bg-blue-900/20';
                      if (score >= 70) return 'text-yellow-400 bg-yellow-900/20';
                      return 'text-orange-400 bg-orange-900/20';
                    };
                    
                    return (
                      <div 
                        key={meeting.id}
                        onClick={() => setSelectedMeeting(meeting)}
                        className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 active:bg-gray-800 cursor-pointer transition-all min-h-[60px] touch-manipulation"
                      >
                        {/* Mobile Layout */}
                        <div className="flex justify-between items-start sm:items-center gap-3">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                              <div className="text-gray-400 text-sm font-mono mb-1 sm:mb-0 sm:w-20">
                                {meeting.time.split(' - ')[0]}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-white font-medium text-sm sm:text-base leading-tight">{meeting.title}</h3>
                              </div>
                            </div>
                          </div>
                          {/* Mobile-friendly score badge */}
                          <div className={`px-3 py-1 rounded-full text-lg sm:text-2xl font-bold ${getScoreColor(performanceScore).split(' ')[0]} ${getScoreColor(performanceScore).split(' ')[1]} min-w-[60px] text-center`}>
                            {performanceScore}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 4. MOBILE-OPTIMIZED LEARNING CORRELATIONS */}
              <section className="px-2 sm:px-0">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Learning Correlations</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Meeting Density Impact */}
                  <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
                    <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">Meeting Density → Recovery</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm sm:text-base text-gray-400">5+ meetings/day</span>
                        <span className="text-sm sm:text-base text-red-400 font-medium">-18% recovery</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm sm:text-base text-gray-400">3-4 meetings/day</span>
                        <span className="text-sm sm:text-base text-yellow-400 font-medium">-7% recovery</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm sm:text-base text-gray-400">1-2 meetings/day</span>
                        <span className="text-sm sm:text-base text-green-400 font-medium">+3% recovery</span>
                      </div>
                    </div>
                  </div>

                  {/* Meeting Type Performance */}
                  <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
                    <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">Meeting Type → Performance</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm sm:text-base text-gray-400">Strategic</span>
                        <span className="text-sm sm:text-base text-green-400 font-medium">87% effective</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm sm:text-base text-gray-400">One-on-Ones</span>
                        <span className="text-sm sm:text-base text-blue-400 font-medium">82% effective</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm sm:text-base text-gray-400">Team Meetings</span>
                        <span className="text-sm sm:text-base text-yellow-400 font-medium">74% effective</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          )
        ) : (
          /* Calendar View */
          <div className="space-y-8">
            
            {/* Mobile-Optimized Calendar Navigation */}
            {!selectedMeeting && !selectedDate && (
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4 px-2 sm:px-0">
                <div className="flex w-full sm:w-auto space-x-1 bg-gray-900 p-1 rounded-lg">
                  <button 
                    onClick={() => setCalendarView('today')}
                    className={`flex-1 px-3 sm:px-4 py-3 rounded-md text-sm font-medium transition-all touch-manipulation min-h-[48px] ${
                      calendarView === 'today' ? 'bg-white text-black' : 'text-gray-400 hover:text-gray-200 active:bg-gray-800'
                    }`}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setCalendarView('week')}
                    className={`flex-1 px-3 sm:px-4 py-3 rounded-md text-sm font-medium transition-all touch-manipulation min-h-[48px] ${
                      calendarView === 'week' ? 'bg-white text-black' : 'text-gray-400 hover:text-gray-200 active:bg-gray-800'
                    }`}
                  >
                    Week
                  </button>
                  <button 
                    onClick={() => setCalendarView('month')}
                    className={`flex-1 px-3 sm:px-4 py-3 rounded-md text-sm font-medium transition-all touch-manipulation min-h-[48px] ${
                      calendarView === 'month' ? 'bg-white text-black' : 'text-gray-400 hover:text-gray-200 active:bg-gray-800'
                    }`}
                  >
                    Month
                  </button>
                </div>
                
                <button
                  onClick={resetAllRatings}
                  className="px-3 py-1 bg-red-900/30 hover:bg-red-800/50 border border-red-700/50 rounded text-xs text-red-200 hover:text-red-100 transition-colors"
                  title="Reset all meeting ratings for testing"
                >
                  Reset Ratings
                </button>
              </div>
            )}

            {selectedMeeting ? (
              /* Mobile-Optimized Meeting Detail View */
              <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="text-gray-400 hover:text-white active:text-gray-300 transition-colors mb-4 p-2 -ml-2 min-h-[44px] flex items-center touch-manipulation"
                >
                  ← Back to {selectedDate ? `${engine.getDayName(selectedDate)}` : calendarView === 'today' ? 'Today' : calendarView === 'week' ? 'Week' : 'Calendar'}
                </button>
                
                <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
                  {/* Mobile-first header */}
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">{selectedMeeting.title}</h2>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-400">
                          <span className="text-sm sm:text-base">{selectedMeeting.time}</span>
                          <MeetingTypeBadge meeting={selectedMeeting} className="px-3 py-1 rounded-full text-xs font-medium w-fit" />
                        </div>
                      </div>
                    </div>
                    {/* Mobile Performance Comparison Section */}
                    <div className="mt-6 space-y-4">
                      {(() => {
                        const actualRating = getMeetingRating(selectedMeeting.id);
                        const isRated = ratedMeetings.has(selectedMeeting.id);
                        
                        return (
                          <>
                            {/* Mobile-Optimized Performance Boxes */}
                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                              {/* Predicted Performance */}
                              <div className={`p-3 sm:p-4 rounded-lg border-2 ${getPerformanceColor(selectedMeeting.prediction.outcome)} border-opacity-50`}>
                                <div className="text-xs sm:text-sm text-gray-300">Predicted Performance</div>
                                <div className="text-xl sm:text-2xl font-bold capitalize">{selectedMeeting.prediction.outcome}</div>
                                <div className="text-xs sm:text-sm">{selectedMeeting.prediction.confidence}% confidence</div>
                              </div>

                              {/* Actual Performance or Rating Interface */}
                              {isRated && actualRating ? (
                                <div className="p-3 sm:p-4 rounded-lg border-2 border-green-500 border-opacity-50 bg-green-900/10">
                                  <div className="text-xs sm:text-sm text-gray-300">Actual Performance</div>
                                  <div className="text-xl sm:text-2xl font-bold">{getRatingLabel(actualRating)}</div>
                                  <div className="text-xs sm:text-sm text-green-400">User Rating</div>
                                </div>
                              ) : selectedMeeting.hasEnded ? (
                                <div className="p-3 sm:p-4 rounded-lg border-2 border-blue-500 border-opacity-50 bg-blue-900/10">
                                  <div className="text-xs sm:text-sm text-gray-300 mb-3">Rate This Meeting</div>
                                  
                                  {/* Mobile-Optimized Star Rating */}
                                  <div className="flex justify-center space-x-2 sm:space-x-1 mb-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => {
                                          // Rate meeting directly in detail view
                                          const rating = star;
                                          storeMeetingRating(selectedMeeting.id, rating);
                                          setRatedMeetings(prev => new Set([...prev, selectedMeeting.id]));
                                          
                                          // Log the rating
                                          console.log('Meeting rated in detail view:', {
                                            meetingId: selectedMeeting.id,
                                            rating: rating,
                                            meetingTitle: selectedMeeting.title
                                          });
                                        }}
                                        className="text-2xl sm:text-xl text-gray-600 hover:text-yellow-400 active:text-yellow-300 transition-colors p-1 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                                      >
                                        ★
                                      </button>
                                    ))}
                                  </div>
                                  
                                  <div className="text-xs text-center text-gray-400">
                                    Tap to rate
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 sm:p-4 rounded-lg border-2 border-gray-600 border-opacity-50 bg-gray-800/30">
                                  <div className="text-xs sm:text-sm text-gray-300 mb-3">Future Meeting</div>
                                  <div className="text-center">
                                    <div className="text-2xl text-gray-500 mb-2">⏳</div>
                                    <div className="text-xs text-gray-400">
                                      Rating available after meeting ends
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Comparison Summary (shown below both boxes when rated) */}
                            {isRated && actualRating && (() => {
                              const accuracy = getPredictionAccuracy(selectedMeeting.prediction.outcome, actualRating);
                              return (
                                <div className="p-4 bg-gray-800 rounded-lg text-center">
                                  <div className="text-sm text-gray-400 mb-1">Prediction vs Reality</div>
                                  <div className="text-lg font-medium mb-2">
                                    {selectedMeeting.prediction.outcome.charAt(0).toUpperCase() + selectedMeeting.prediction.outcome.slice(1)} → {getRatingLabel(actualRating)}
                                  </div>
                                  <div className={`text-sm font-medium ${
                                    accuracy.status === 'accurate' ? 'text-green-400' : 
                                    accuracy.status === 'optimistic' ? 'text-yellow-400' : 'text-blue-400'
                                  }`}>
                                    {accuracy.message}
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Mobile-Optimized Analysis & Recommendations */}
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
                    <div className="space-y-4 sm:space-y-6">
                      <section className="bg-gray-800 rounded-lg p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Performance Analysis</h3>
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm sm:text-base text-gray-300">Historical Average:</span>
                            <span className="text-sm sm:text-base text-white font-medium">{selectedMeeting.historical.averagePerformance}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm sm:text-base text-gray-300">Previous Meetings:</span>
                            <span className="text-sm sm:text-base text-white font-medium">{selectedMeeting.historical.totalMeetings}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm sm:text-base text-gray-300">Predicted Performance:</span>
                            <span className="text-sm sm:text-base text-white font-medium capitalize">{selectedMeeting.prediction.outcome}</span>
                          </div>
                        </div>
                      </section>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                      <section className="bg-gray-800 rounded-lg p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Recommendations</h3>
                        <div className="space-y-3 sm:space-y-4">
                          {selectedMeeting.prediction.outcome === 'adequate' && (
                            <div className="p-3 sm:p-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-900/20">
                              <div className="font-semibold text-white mb-1 text-sm sm:text-base">Consider Optimization</div>
                              <div className="text-gray-300 text-xs sm:text-sm leading-relaxed">Your biometric data suggests this may not be optimal timing for peak performance.</div>
                            </div>
                          )}
                          {selectedMeeting.rescheduleSuggestion && (
                            <div className="p-3 sm:p-4 rounded-lg border-l-4 border-blue-500 bg-blue-900/20">
                              <div className="font-semibold text-white mb-1 text-sm sm:text-base">Reschedule Suggestion</div>
                              <div className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                                Move to {selectedMeeting.rescheduleSuggestion.day} at {selectedMeeting.rescheduleSuggestion.time} for {selectedMeeting.rescheduleSuggestion.improvement} improvement
                              </div>
                            </div>
                          )}
                          <div className="p-3 sm:p-4 rounded-lg border-l-4 border-green-500 bg-green-900/20">
                            <div className="font-semibold text-white mb-1 text-sm sm:text-base">Excellent readiness - ideal conditions</div>
                            <div className="text-gray-300 text-xs sm:text-sm leading-relaxed">Your biometrics show optimal performance capacity - perfect timing for critical decisions and strategic discussions</div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedDate ? (
              /* Day Detail View */
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-white transition-colors mb-4"
                >
                  ← Back to Month View
                </button>
                
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-light text-white">{engine.getDayName(selectedDate)}'s Schedule</h2>
                    <div className="text-gray-400 text-sm">
                      {engine.getMeetingsForDate(selectedDate).length} meetings
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {engine.getMeetingsForDate(selectedDate).map((meeting) => (
                      <div 
                        key={meeting.id}
                        onClick={() => setSelectedMeeting(meeting)}
                        className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer transition-all flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 min-h-[44px] touch-manipulation"
                      >
                        <div className="flex-1 w-full sm:w-auto">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="text-gray-400 text-sm font-mono">
                              {meeting.time.split(' - ')[0]}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-medium text-base leading-tight">{meeting.title}</h3>
                              <div className="mt-1">
                                <MeetingTypeBadge meeting={meeting} className="inline-block px-2 py-1 rounded text-xs font-medium" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                          {!ratedMeetings.has(meeting.id) && meeting.hasEnded && (
                            <button
                              onClick={(e) => handleRateMeeting(meeting, e)}
                              className="px-4 py-2 bg-blue-900/50 hover:bg-blue-800/50 active:bg-blue-800/70 border border-blue-700 rounded text-sm text-blue-200 hover:text-blue-100 transition-colors min-h-[44px] touch-manipulation w-full sm:w-auto"
                            >
                              Rate Meeting
                            </button>
                          )}
                          {meeting.hasEnded === false && (
                            <div className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded text-sm text-gray-400 text-center">
                              Scheduled
                            </div>
                          )}
                          <div className={`px-3 py-2 rounded-full text-xs font-bold ${getPerformanceColor(meeting.prediction.outcome)} ${!meeting.hasEnded ? 'opacity-60' : ''} text-center`}>
                            {meeting.prediction.outcome.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              /* Calendar Views */
              <div>
                {calendarView === 'today' && (
                  <section className="px-2 sm:px-0">
                    <h2 className="text-lg sm:text-2xl font-light text-white mb-4 sm:mb-6">Today's Schedule</h2>
                    <div className="space-y-3">
                      {engine.getMeetingsForDate(0).map((meeting) => {
                        const performanceScore = meeting.historical.averagePerformance;
                        const getScoreColor = (score) => {
                          if (score >= 90) return 'text-green-400 bg-green-900/20';
                          if (score >= 80) return 'text-blue-400 bg-blue-900/20';
                          if (score >= 70) return 'text-yellow-400 bg-yellow-900/20';
                          return 'text-orange-400 bg-orange-900/20';
                        };
                        
                        return (
                          <div 
                            key={meeting.id}
                            onClick={() => setSelectedMeeting(meeting)}
                            className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 active:bg-gray-800 cursor-pointer transition-all min-h-[60px] touch-manipulation"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                                  <div className="text-gray-400 text-sm font-mono mb-1 sm:mb-0 sm:w-20">
                                    {meeting.time.split(' - ')[0]}
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-white font-medium text-sm sm:text-base leading-tight mb-1">{meeting.title}</h3>
                                    <MeetingTypeBadge meeting={meeting} className="px-2 py-1 rounded text-xs font-medium" />
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(performanceScore).split(' ')[0]} ${getScoreColor(performanceScore).split(' ')[1]} min-w-[50px] text-center`}>
                                  {performanceScore}%
                                </div>
                                <div className="flex items-center space-x-2">
                                  {!ratedMeetings.has(meeting.id) && meeting.hasEnded && (
                                    <button
                                      onClick={(e) => handleRateMeeting(meeting, e)}
                                      className="px-2 py-1 bg-blue-900/50 hover:bg-blue-800/50 active:bg-blue-800/70 border border-blue-700 rounded text-xs text-blue-200 hover:text-blue-100 transition-colors min-h-[28px] touch-manipulation"
                                    >
                                      Rate
                                    </button>
                                  )}
                                  {meeting.hasEnded === false && (
                                    <div className="px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-xs text-gray-400">
                                      Scheduled
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {calendarView === 'week' && (
                  <section className="px-2 sm:px-0">
                    <h2 className="text-lg sm:text-2xl font-light text-white mb-4 sm:mb-6">Work Week</h2>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      {engine.getWeekMeetings().map(({ day, meetings, isToday }) => (
                        <div key={day} className={`rounded-lg p-4 border transition-all ${
                          isToday 
                            ? 'bg-blue-900/30 border-blue-700/50' 
                            : 'bg-gray-900 border-gray-700'
                        }`}>
                          <div className="flex justify-between items-center mb-3">
                            <h3 className={`font-medium text-sm sm:text-base ${
                              isToday ? 'text-blue-200' : 'text-white'
                            }`}>{day}</h3>
                            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                              {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {meetings.map((meeting) => {
                              const performanceScore = meeting.historical.averagePerformance;
                              const getScoreColor = (score) => {
                                if (score >= 90) return 'text-green-400 bg-green-900/20';
                                if (score >= 80) return 'text-blue-400 bg-blue-900/20';
                                if (score >= 70) return 'text-yellow-400 bg-yellow-900/20';
                                return 'text-orange-400 bg-orange-900/20';
                              };
                              
                              return (
                                <div 
                                  key={meeting.id}
                                  onClick={() => setSelectedMeeting(meeting)}
                                  className="cursor-pointer hover:bg-gray-800 active:bg-gray-700 p-3 rounded transition-all touch-manipulation min-h-[48px]"
                                >
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1">
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                                        <div className="text-gray-400 font-mono text-xs mb-1 sm:mb-0">
                                          {meeting.time.split(' - ')[0]}
                                        </div>
                                        <div className="flex-1">
                                          <span className="text-gray-300 text-sm font-medium leading-tight">{meeting.title}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(performanceScore).split(' ')[0]} ${getScoreColor(performanceScore).split(' ')[1]} min-w-[45px] text-center`}>
                                      {performanceScore}%
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {calendarView === 'month' && (
                  <section className="px-2 sm:px-0">
                    <h2 className="text-lg sm:text-2xl font-light text-white mb-4 sm:mb-6">August 2025</h2>
                    <p className="text-gray-400 text-xs sm:text-sm mb-4">Tap on any day with meetings to see detailed schedule</p>
                    
                    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                      {/* Mobile Calendar Header */}
                      <div className="grid grid-cols-7 border-b border-gray-700">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <div key={day} className="p-2 sm:p-3 text-center text-gray-400 text-xs sm:text-sm font-medium border-r border-gray-700 last:border-r-0">
                            <span className="hidden sm:inline">{day}</span>
                            <span className="sm:hidden">{day.substring(0, 1)}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7">
                        {Array.from({length: 42}, (_, i) => {
                          const dateInfo = engine.getCurrentDateInfo();
                          const today = dateInfo.today;
                          const currentMonth = today.getMonth();
                          const currentYear = today.getFullYear();
                          
                          // Calculate first day of month and its day of week
                          const firstDay = new Date(currentYear, currentMonth, 1);
                          let firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
                          // Convert to Monday-first (0 = Monday, 6 = Sunday)
                          firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
                          
                          // Calculate the date for this cell
                          const cellDate = new Date(firstDay);
                          cellDate.setDate(cellDate.getDate() + (i - firstDayOfWeek));
                          
                          const dayNum = cellDate.getDate();
                          const isCurrentMonth = cellDate.getMonth() === currentMonth;
                          const isToday = cellDate.getTime() === today.getTime();
                          
                          // Calculate date offset for meeting lookup
                          const dateOffset = Math.floor((cellDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          const meetingsForDay = engine.getMeetingsForDate(dateOffset);
                          const hasMeetings = meetingsForDay.length > 0;
                          const meetingCount = meetingsForDay.length;
                          
                          // August 2025 dates with meetings (Monday = 25, Tuesday = 26, Wednesday = 27, Thursday = 28, Friday = 29)
                          const augMeetingDays = [25, 26, 27, 28, 29];
                          const hasAugustMeetings = isCurrentMonth && augMeetingDays.includes(dayNum);
                          
                          return (
                            <div 
                              key={i} 
                              className={`
                                min-h-14 sm:min-h-20 md:min-h-24 p-2 sm:p-3 border-r border-b border-gray-700 last:border-r-0 transition-all touch-manipulation
                                ${isCurrentMonth ? 'bg-gray-900' : 'bg-gray-950'}
                                ${isToday ? 'bg-white text-black' : 'text-gray-300'}
                                ${hasAugustMeetings ? 'cursor-pointer hover:bg-gray-800 active:bg-gray-700' : ''}
                                ${!isCurrentMonth ? 'opacity-30' : ''}
                                relative
                              `}
                              onClick={hasAugustMeetings && isCurrentMonth ? () => {
                                setSelectedDate(dateOffset);
                                console.log(`Navigating to ${engine.getDayName(dateOffset)} with meetings`);
                              } : undefined}
                            >
                              {isCurrentMonth && (
                                <div className="space-y-1 h-full flex flex-col">
                                  <div className={`text-sm sm:text-base font-medium ${isToday ? 'text-black' : 'text-white'}`}>
                                    {dayNum}
                                  </div>
                                  {hasAugustMeetings && (
                                    <div className="flex-1 flex flex-col justify-between">
                                      <div className={`text-xs ${isToday ? 'text-gray-600' : 'text-gray-400'} leading-tight`}>
                                        {dayNum === 25 ? '7 meetings' :
                                         dayNum === 26 ? '3 meetings' :
                                         dayNum === 27 ? '2 meetings' :
                                         dayNum === 28 ? '3 meetings' :
                                         dayNum === 29 ? '2 meetings' : ''}
                                      </div>
                                      {/* Mobile-optimized performance indicators */}
                                      <div className="flex items-center justify-center mt-1">
                                        {dayNum === 25 && ( // Monday - Today - mix of excellent/good/adequate
                                          <div className="flex items-center space-x-0.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-green-600' : 'bg-green-400'}`}></div>
                                            <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
                                            <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-yellow-600' : 'bg-yellow-400'}`}></div>
                                            <span className={`text-xs ${isToday ? 'text-gray-600' : 'text-gray-400'} ml-1`}>+4</span>
                                          </div>
                                        )}
                                        {dayNum === 26 && ( // Tuesday - mostly excellent
                                          <div className="flex items-center space-x-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                          </div>
                                        )}
                                        {dayNum === 27 && ( // Wednesday - mixed with optimization opportunity
                                          <div className="flex items-center space-x-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                          </div>
                                        )}
                                        {dayNum === 28 && ( // Thursday - good performance
                                          <div className="flex items-center space-x-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                          </div>
                                        )}
                                        {dayNum === 29 && ( // Friday - excellent performance
                                          <div className="flex items-center space-x-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                          </div>
                                        )}
                                      </div>
                                      {/* Mobile tap indicator */}
                                      <div className={`text-xs ${isToday ? 'text-gray-700' : 'text-gray-500'} opacity-75 text-center hidden sm:block`}>
                                        Tap for details
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-4 flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="text-gray-400">Excellent Performance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <span className="text-gray-400">Good Performance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span className="text-gray-400">Needs Optimization</span>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 w-full max-w-md mx-4">
            {feedbackSubmitted ? (
              // Success State
              <div className="text-center">
                <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">✓</span>
                  </div>
                </div>
                <h3 className="text-white text-lg font-semibold mb-2">Feedback Received!</h3>
                <p className="text-gray-400 text-sm">
                  Learning from your feedback to improve future meeting predictions...
                </p>
              </div>
            ) : (
              // Rating Form
              <>
                <h3 className="text-white text-lg font-semibold mb-4">Rate Your Meeting</h3>
                
                <div className="mb-4">
                  <h4 className="text-gray-300 font-medium mb-1">{feedbackModal.title}</h4>
                  <p className="text-gray-400 text-sm mb-2">{feedbackModal.time}</p>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500">Predicted:</span>
                    <span className={`px-2 py-1 rounded font-medium ${getPerformanceColor(feedbackModal.prediction.outcome)}`}>
                      {feedbackModal.prediction.outcome.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-300 text-sm mb-3">How did this meeting actually go?</p>
                  
                  {/* Meeting Type Correction */}
                  <div className="mb-4">
                    <label className="text-gray-400 text-xs block mb-2">Meeting Type (click to correct if wrong)</label>
                    <select
                      value={correctedMeetingType}
                      onChange={(e) => setCorrectedMeetingType(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="team_meeting">Team Meeting</option>
                      <option value="one_on_one">One-on-One</option>
                      <option value="strategic">Strategic</option>
                      <option value="presentation">Presentation</option>
                      <option value="client_meeting">Client Meeting</option>
                      <option value="general">General</option>
                    </select>
                    {correctedMeetingType !== feedbackModal.type && (
                      <p className="text-blue-400 text-xs mt-1">✓ Type updated - we'll learn from this</p>
                    )}
                  </div>
                  
                  {/* Star Rating */}
                  <div className="flex items-center justify-center space-x-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className={`text-2xl transition-colors ${
                          star <= feedbackRating 
                            ? 'text-yellow-400 hover:text-yellow-300' 
                            : 'text-gray-600 hover:text-gray-500'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  
                  {/* Rating Label */}
                  {feedbackRating > 0 && (
                    <p className="text-center text-sm text-gray-400">
                      {getRatingLabel(feedbackRating)}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setFeedbackModal(null)}
                    className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={feedbackRating === 0}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      feedbackRating > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Submit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
        <div className="grid grid-cols-2 h-16">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              viewMode === 'dashboard' ? 'text-white bg-gray-900' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs">Dashboard</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              viewMode === 'calendar' ? 'text-white bg-gray-900' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Calendar</span>
          </button>
        </div>
      </nav>

    </div>
  )
}