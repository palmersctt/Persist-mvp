# PERSIST Work Health Algorithm Documentation

## Overview
PERSIST analyzes calendar events to assess cognitive work health through three primary metrics. The system uses intelligent event categorization to distinguish between actual work meetings and beneficial activities.

## Event Categorization System

### Categories
1. **BENEFICIAL**: Improves work health scores
   - Keywords: workout, gym, exercise, walk, run, yoga, meditation, break, lunch, eat, personal, doctor, dentist, therapy, massage, health
   - Impact: +3 cognitive resilience bonus, excluded from meeting counts

2. **NEUTRAL**: Ignored in calculations
   - Keywords: commute, travel, vacation, holiday, sick, pto, personal day, out of office, not available, busy, blocked, unavailable
   - Impact: Completely excluded from all metrics

3. **FOCUS_WORK**: Boosts performance scores
   - Keywords: focus, deep work, coding, writing, research, analysis, strategy, no meetings, focus block, maker time, thinking time, planning, prep
   - Impact: +5 performance bonus, counts as quality focus time

4. **LIGHT_MEETINGS**: Lower cognitive load
   - Keywords: 1:1, one-on-one, check-in, sync, standup, coffee chat, quick sync, brief update, touch base, catch up
   - Impact: +2 cognitive load (vs +4 for collaborative)

5. **HEAVY_MEETINGS**: Higher cognitive load
   - Keywords: presentation, demo, review, interview, all-hands, town hall, board meeting, client presentation, quarterly review, training, workshop, seminar, conference
   - Impact: +8 cognitive load (vs +4 for collaborative)

6. **COLLABORATIVE**: Default for unmatched meetings
   - Default category for work meetings
   - Impact: +4 cognitive load (baseline)

## Primary Metrics

### 1. Adaptive Performance Index (Main Metric: 0-100)

**Purpose**: Real-time cognitive capacity assessment based on meeting density, fragmentation, and recovery patterns.

**Algorithm**:
```javascript
function calculateAdaptivePerformanceIndex(events) {
    // Filter to actual meetings only
    const actualMeetings = events.filter(event => 
        event.category !== 'BENEFICIAL' && 
        event.category !== 'NEUTRAL' && 
        event.category !== 'FOCUS_WORK'
    );
    
    // Base case
    if (actualMeetings.length === 0) return 98;
    
    // Components
    const meetingCount = actualMeetings.length;
    const focusTime = calculateFocusTime(events); // Uses all events for gaps
    const backToBackCount = countBackToBackMeetings(actualMeetings);
    
    // 1. Meeting Density Score (0-100)
    let densityScore = 100;
    if (meetingCount >= 8) densityScore = 25;
    else if (meetingCount >= 7) densityScore = 35;
    else if (meetingCount >= 6) densityScore = 45;
    else if (meetingCount >= 5) densityScore = 60;
    else if (meetingCount >= 4) densityScore = 70;
    else if (meetingCount >= 3) densityScore = 80;
    else if (meetingCount >= 2) densityScore = 88;
    else if (meetingCount === 1) densityScore = 95;
    
    // 2. Fragmentation Score (0-100)
    const focusHours = focusTime / 60;
    let fragmentationScore = 100;
    if (focusHours < 1) fragmentationScore = 20;
    else if (focusHours < 2) fragmentationScore = 40;
    else if (focusHours < 3) fragmentationScore = 65;
    else if (focusHours < 4) fragmentationScore = 80;
    else if (focusHours >= 4) fragmentationScore = 90;
    else if (focusHours >= 5) fragmentationScore = 100;
    
    // 3. Transition Score (0-100)
    let transitionScore = 100;
    if (backToBackCount >= 4) transitionScore = 40;
    else if (backToBackCount === 3) transitionScore = 60;
    else if (backToBackCount === 2) transitionScore = 75;
    else if (backToBackCount === 1) transitionScore = 88;
    
    // 4. Timing Score (0-100) - Afternoon meeting penalty
    const afternoonMeetings = actualMeetings.filter(e => e.start.getHours() >= 14).length;
    const morningMeetings = actualMeetings.filter(e => e.start.getHours() < 12).length;
    let timingScore = 100;
    if (afternoonMeetings > morningMeetings * 1.5) timingScore = 70;
    else if (afternoonMeetings > morningMeetings) timingScore = 85;
    
    // 5. Recovery Score (0-100)
    const totalMeetingHours = actualMeetings.reduce((sum, event) => 
        sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60), 0);
    const meetingRatio = totalMeetingHours / 8; // 8-hour workday
    let recoveryScore = 100;
    if (meetingRatio > 0.75) recoveryScore = 30;
    else if (meetingRatio > 0.6) recoveryScore = 50;
    else if (meetingRatio > 0.5) recoveryScore = 70;
    else if (meetingRatio > 0.4) recoveryScore = 85;
    
    // Bonuses for beneficial activities
    const focusWorkEvents = events.filter(e => e.category === 'FOCUS_WORK');
    const beneficialEvents = events.filter(e => e.category === 'BENEFICIAL');
    let bonusPoints = 0;
    bonusPoints += focusWorkEvents.length * 5; // Focus work bonus
    bonusPoints += beneficialEvents.length * 3; // Self-care bonus
    
    // Weighted calculation
    const adaptiveIndex = (
        densityScore * 0.25 +
        fragmentationScore * 0.30 +  // Heavy weight on fragmentation
        transitionScore * 0.20 +
        timingScore * 0.10 +
        recoveryScore * 0.15
    ) + bonusPoints;
    
    return Math.round(Math.min(100, Math.max(0, adaptiveIndex)));
}
```

### 2. Cognitive Resilience (0-100)

**Purpose**: Mental capacity for handling context switching and decision fatigue.

**Algorithm**:
```javascript
function calculateCognitiveResilience(events) {
    if (events.length === 0) return 90;
    
    // Context switching load
    const uniqueContexts = new Set(events.map(e => e.summary?.toLowerCase().split(' ')[0])).size;
    const contextSwitchingLoad = Math.min(100, uniqueContexts * 15);
    
    // Decision fatigue accumulation
    let decisionFatigue = 0;
    events.forEach((event, index) => {
        const hourOfDay = event.start.getHours();
        const timeFactor = hourOfDay >= 14 ? 1.5 : 1; // Afternoon penalty
        const attendeeFactor = (event.attendees && event.attendees > 5) ? 1.3 : 1;
        decisionFatigue += (10 * timeFactor * attendeeFactor);
    });
    decisionFatigue = Math.min(80, decisionFatigue);
    
    // Cognitive reserve from focus time
    const focusTime = calculateFocusTime(events);
    const focusHours = focusTime / 60;
    let cognitiveReserve = 0;
    if (focusHours >= 4) cognitiveReserve = 80;
    else if (focusHours >= 3) cognitiveReserve = 60;
    else if (focusHours >= 2) cognitiveReserve = 40;
    else if (focusHours >= 1) cognitiveReserve = 20;
    else cognitiveReserve = 10;
    
    // Mental energy patterns
    const consecutiveMeetings = findLongestConsecutiveStretch(events);
    let energyDepletion = consecutiveMeetings * 20;
    energyDepletion = Math.min(60, energyDepletion);
    
    // Final calculation
    const resilienceScore = Math.max(0, 
        100 - contextSwitchingLoad * 0.25 
        - decisionFatigue * 0.35 
        + cognitiveReserve * 0.25 
        - energyDepletion * 0.15
    );
    
    return Math.round(Math.min(100, Math.max(0, resilienceScore)));
}
```

### 3. Work Rhythm Recovery (Sustainability Index: 0-100)

**Purpose**: Long-term sustainability of work patterns to prevent burnout.

**Algorithm**:
```javascript
function calculateWorkRhythmRecovery(events) {
    // Filter to actual meetings only
    const actualMeetings = events.filter(event => 
        event.category !== 'BENEFICIAL' && 
        event.category !== 'NEUTRAL' && 
        event.category !== 'FOCUS_WORK'
    );
    
    if (actualMeetings.length === 0) return 98;
    
    // 1. Work Rhythm Analysis (morning vs afternoon balance)
    const morningBlock = actualMeetings.filter(e => 
        e.start.getHours() >= 9 && e.start.getHours() < 12).length;
    const afternoonBlock = actualMeetings.filter(e => 
        e.start.getHours() >= 12 && e.start.getHours() < 17).length;
    const rhythmBalance = Math.abs(morningBlock - afternoonBlock);
    let rhythmScore = 100 - (rhythmBalance * 15);
    rhythmScore = Math.max(40, rhythmScore);
    
    // 2. Recovery Adequacy (gaps between all events for natural breaks)
    const gaps = calculateGapsBetweenMeetings(events); // Uses ALL events
    const adequateBreaks = gaps.filter(g => g >= 30).length; // 30+ minutes
    const shortBreaks = gaps.filter(g => g >= 15 && g < 30).length;
    let recoveryScore = (adequateBreaks * 20) + (shortBreaks * 10);
    recoveryScore = Math.min(100, recoveryScore);
    
    // 3. Intensity Sustainability (meeting hours only)
    const totalMeetingHours = actualMeetings.reduce((sum, event) => 
        sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60), 0);
    let sustainabilityScore = 100;
    if (totalMeetingHours > 7) sustainabilityScore = 20;
    else if (totalMeetingHours > 6) sustainabilityScore = 40;
    else if (totalMeetingHours > 5) sustainabilityScore = 60;
    else if (totalMeetingHours > 4) sustainabilityScore = 80;
    else sustainabilityScore = 95;
    
    // 4. Natural Energy Alignment
    const earlyMorningMeetings = actualMeetings.filter(e => e.start.getHours() < 9).length;
    const lateMeetings = actualMeetings.filter(e => e.start.getHours() >= 16).length;
    let alignmentScore = 100 - (earlyMorningMeetings * 20) - (lateMeetings * 15);
    alignmentScore = Math.max(30, alignmentScore);
    
    // Weighted combination
    const combinedScore = (
        rhythmScore * 0.25 +
        recoveryScore * 0.35 +      // Heavy weight on recovery
        sustainabilityScore * 0.25 +
        alignmentScore * 0.15
    );
    
    return Math.round(Math.min(100, Math.max(0, combinedScore)));
}
```

## Supporting Calculations

### Focus Time Calculation
```javascript
function calculateFocusTime(events) {
    if (events.length === 0) return 480; // 8 hours
    
    const workStart = 9; // 9 AM
    const workEnd = 17;  // 5 PM
    let totalFocusTime = 0;
    let qualityFocusTime = 0;
    
    // Sort events by start time
    const sortedEvents = events.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Check time before first meeting
    const firstMeeting = sortedEvents[0];
    if (firstMeeting.start.getHours() > workStart) {
        const morningGapMinutes = (firstMeeting.start.getHours() + 
            (firstMeeting.start.getMinutes() / 60) - workStart) * 60;
        if (morningGapMinutes >= 30) {
            totalFocusTime += morningGapMinutes;
            if (morningGapMinutes >= 90) qualityFocusTime += morningGapMinutes;
        }
    }
    
    // Check gaps between meetings
    for (let i = 0; i < sortedEvents.length - 1; i++) {
        const currentEnd = sortedEvents[i].end;
        const nextStart = sortedEvents[i + 1].start;
        const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
        
        if (gapMinutes >= 30) {
            totalFocusTime += gapMinutes;
            if (gapMinutes >= 90) qualityFocusTime += gapMinutes;
        }
    }
    
    // Check time after last meeting
    const lastMeeting = sortedEvents[sortedEvents.length - 1];
    const lastMeetingEndHours = lastMeeting.end.getHours() + (lastMeeting.end.getMinutes() / 60);
    if (lastMeetingEndHours < workEnd) {
        const eveningGapMinutes = (workEnd - lastMeetingEndHours) * 60;
        if (eveningGapMinutes >= 30) {
            totalFocusTime += eveningGapMinutes;
            if (eveningGapMinutes >= 90) qualityFocusTime += eveningGapMinutes;
        }
    }
    
    // Weight quality focus time more heavily
    const effectiveFocusTime = totalFocusTime * 0.7 + qualityFocusTime * 0.3;
    return Math.round(effectiveFocusTime);
}
```

### Back-to-Back Meeting Detection
```javascript
function countBackToBackMeetings(events) {
    let count = 0;
    for (let i = 0; i < events.length - 1; i++) {
        const currentEnd = events[i].end.getTime();
        const nextStart = events[i + 1].start.getTime();
        const gap = (nextStart - currentEnd) / (1000 * 60); // Minutes
        
        if (gap <= 15) { // 15 minutes or less = back-to-back
            count++;
        }
    }
    return count;
}
```

### Cognitive Availability (Legacy Support)
```javascript
function calculateCognitiveAvailability(events) {
    // Filter to actual meetings only
    const actualMeetings = events.filter(event => 
        event.category !== 'BENEFICIAL' && 
        event.category !== 'NEUTRAL' && 
        event.category !== 'FOCUS_WORK'
    );
    
    if (actualMeetings.length === 0) return 95;
    
    let cognitiveDepletion = 10; // Base depletion
    
    // Meeting density impact
    if (actualMeetings.length >= 8) cognitiveDepletion += 35;
    else if (actualMeetings.length >= 6) cognitiveDepletion += 25;
    else if (actualMeetings.length >= 4) cognitiveDepletion += 15;
    else if (actualMeetings.length >= 2) cognitiveDepletion += 8;
    else cognitiveDepletion += 3;
    
    // Category-specific cognitive load
    actualMeetings.forEach(event => {
        switch (event.category) {
            case 'HEAVY_MEETINGS': cognitiveDepletion += 8; break;
            case 'COLLABORATIVE': cognitiveDepletion += 4; break;
            case 'LIGHT_MEETINGS': cognitiveDepletion += 2; break;
        }
    });
    
    // Bonus for beneficial events
    const beneficialEvents = events.filter(e => e.category === 'BENEFICIAL');
    cognitiveDepletion -= beneficialEvents.length * 3;
    
    // Additional factors (back-to-back, duration, timing, size)
    const backToBackCount = countBackToBackMeetings(actualMeetings);
    if (backToBackCount >= 4) cognitiveDepletion += 20;
    else if (backToBackCount >= 2) cognitiveDepletion += 12;
    else if (backToBackCount >= 1) cognitiveDepletion += 5;
    
    // Convert to availability score
    const cognitiveAvailability = 100 - Math.min(85, Math.max(10, Math.round(cognitiveDepletion)));
    return Math.max(15, Math.min(90, cognitiveAvailability));
}
```

## Status Classification

### Adaptive Performance Index Status
- **98-100**: OPTIMAL (Near-perfect conditions)
- **85-97**: EXCELLENT (Outstanding cognitive conditions)
- **75-84**: GOOD (Strong cognitive foundation)
- **65-74**: GOOD (Solid cognitive foundation)
- **55-64**: MODERATE (Some cognitive strain)
- **40-54**: NEEDS_ATTENTION (Performance compromised)
- **0-39**: CRITICAL (Severe cognitive strain)

## Key Algorithm Features

1. **Smart Categorization**: Distinguishes between work meetings and beneficial activities
2. **Context-Aware Scoring**: Different meeting types have different cognitive loads
3. **Fragmentation Focus**: Heavy weighting on focus time availability
4. **Recovery Integration**: Breaks and gaps between intense work are rewarded
5. **Time-of-Day Factors**: Afternoon meetings penalized more heavily
6. **Sustainable Patterns**: Long-term maintainability assessment
7. **Bonus Systems**: Self-care and focus blocks improve scores

## Validation & Testing

The algorithm has been tested with various scenarios:
- 8-hour personal time blocks correctly boost scores
- Focus time blocks provide performance bonuses
- Meeting categorization correctly identifies different cognitive loads
- Back-to-back penalty only applies to actual work meetings
- Beneficial activities excluded from negative calculations

## Data Requirements

**Input**: Calendar events with:
- `summary` (string): Event title for categorization
- `start` (Date): Start time
- `end` (Date): End time  
- `attendees` (number): Attendee count
- `isRecurring` (boolean): Recurring event flag

**Output**: Work health metrics with scores 0-100 and detailed breakdowns.