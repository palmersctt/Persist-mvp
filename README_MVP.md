# Persist MVP

## Overview
Persist MVP is a work-health dashboard that analyzes meeting patterns and provides daily insights through a card-based interface.

## Architecture

### Surfaces
- **Landing page** (`app/page.tsx`) — marketing site with demo card
- **Dashboard** (`app/dashboard/page.tsx`) — authenticated work-health dashboard

### Key Directories
```
app/                  # Next.js App Router pages
src/
├── components/       # React components
├── hooks/            # Custom React hooks
├── lib/              # Core logic (mood system, tracking)
├── services/         # External service integrations
└── utils/            # Utility functions
lib/                  # Data services (calendar, Supabase)
```

### Card System
- `src/components/CardContent.tsx` — single card renderer used everywhere
- `src/lib/mood.ts` — mood types, tier classification, gradient definitions
- Three tiers: bad (dark), ok (warm gray), good (white/cream)
- See `BRAND.md` for color tokens and card design tokens

## Running the Application

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server
```

## Testing

```bash
npx vitest run  # Run unit tests
```
