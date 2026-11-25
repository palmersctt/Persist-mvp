---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-11-clear-lint-warnings.md
status: approved
---

# Outline: zero lint warnings (lint ticket)

## Phase 1 (single phase)
- Delete unused: `CalendarEvent` import, `refreshGoogleToken`,
  `isGoogleAuthError` (`pages/api/work-health.ts`); `CognitiveSignals`
  import (`CognitivePositioning.tsx`); `session` (`useCognitivePositioning.ts`);
  `ALL_CATEGORIES` (`cognitive-signals.ts`); three imports in
  `pulse-classifier.diagnostic.ts`.
- `useWorkHealth.ts`: move the three `exhaustive-deps` disables onto the
  deps lines, each with a reason. No dependency changes.
- Four avatar `<img>`: `// eslint-disable-next-line @next/next/no-img-element`
  with a reason.
- **Automated:** `npm run lint` prints no problems; `npm run verify`.
- **Manual:** none (no behaviour change).
