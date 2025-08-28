# Persist MVP - Dashboard-Only Architecture

## Overview
Persist MVP has been refactored to focus on a clean dashboard interface with mock meeting data while preserving the Google Calendar API infrastructure for future activation.

## Current Architecture

### Dashboard Features
- **Today's Meetings**: List of meetings with real-time status (upcoming/active/completed)
- **Performance Metrics**: Mock performance scores and engagement levels
- **Learning Correlations**: AI-generated insights about meeting patterns
- **Weekly Trends**: Visual representation of weekly performance
- **Meeting Details**: Click any meeting for expanded view with key points and action items
- **Feedback System**: Post-meeting feedback collection interface

### Data Architecture
```
lib/
├── mockData.js         # Mock meeting data generator
├── dataService.js      # Data service with feature flag
├── googleCalendar.js   # Google Calendar API (preserved)
└── supabase.js        # Database connection (preserved)
```

## Switching to Real Calendar Data

To enable real Google Calendar data, simply change the feature flag in `lib/dataService.js`:

```javascript
// Change this line
const USE_MOCK_DATA = true  // Current setting

// To this
const USE_MOCK_DATA = false // Enable real calendar data
```

## Mock Data Structure

The mock data service provides realistic meeting patterns including:
- 6 daily meetings with varying types (Standup, 1:1, Review, Strategic, etc.)
- Dynamic status based on current time
- Performance scores (75-92%)
- Engagement levels (High/Medium/Low)
- Key discussion points and action items
- Learning correlations with confidence scores

## Key Benefits of This Architecture

1. **Clean MVP Focus**: Single dashboard view without navigation complexity
2. **Realistic Data**: Mock data follows real meeting patterns
3. **Easy Migration**: One-line change to switch to real calendar data
4. **Preserved Infrastructure**: OAuth, API routes, and calendar integration ready
5. **Performance**: Fast loading with mock data, no API delays during development

## Running the Application

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server
```

## Environment Variables Required (for future calendar integration)

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
```

## Future Enhancements

When ready to activate real calendar data:
1. Set up Google OAuth credentials
2. Configure environment variables
3. Change `USE_MOCK_DATA` to `false`
4. Add user authentication flow
5. Implement data persistence with Supabase

The architecture is designed to make this transition seamless without requiring code restructuring.