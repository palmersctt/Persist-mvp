---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-11-clear-lint-warnings.md
outline: thoughts/shared/outlines/2026-11-11-clear-lint-warnings.md
status: implemented
---

# Plan: zero lint warnings

## What we are not doing
Hook refactor, `next/image`, rule tightening.

## Phase 1
### Changes
- Removed: `CalendarEvent` import, `refreshGoogleToken`, `isGoogleAuthError`
  (`pages/api/work-health.ts`); `CognitiveSignals` import
  (`CognitivePositioning.tsx`); `session` (`useCognitivePositioning.ts`);
  `ALL_CATEGORIES` (`cognitive-signals.ts`); `classifyEvent`,
  `WorkOrientation`, `OutcomeLedger` imports (`pulse-classifier.diagnostic.ts`).
- `useWorkHealth.ts`: the three disables moved onto the deps lines with
  reasons; dependency arrays unchanged.
- Four avatar `<img>`: targeted disable with a reason.
### Automated checks
- [x] `npx eslint .` prints nothing
- [x] `npm run verify`
### Manual checks
- none (no behaviour change)
