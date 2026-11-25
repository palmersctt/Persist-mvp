---
date: 2026-11-25
git_commit: 0ca0c27
branch: claude/adoring-mccarthy-43vsnt
questions: thoughts/shared/questions/2026-11-11-clear-lint-warnings.md
status: complete
---

# Research: lint configuration and current output

## Summary
`npm run lint` reports 19 warnings, 0 errors (flat config over
`next/core-web-vitals` + `next/typescript`, four rules downgraded to warn,
`eslint.config.mjs:13-35`). They are 9 unused identifiers, 4 `<img>` tags,
3 `exhaustive-deps` warnings in `useWorkHealth.ts`, and the 3 disable
comments meant for them, which sit one line too early and so are "unused".

## Findings
- **Unused identifiers (9):** `CalendarEvent` import, `refreshGoogleToken`,
  `isGoogleAuthError` (`pages/api/work-health.ts:4, 12, 32`; the latter two
  are never called, a copy of the refresher is used in
  `cognitive-positioning.ts:10, 137`); `CognitiveSignals` type import
  (`CognitivePositioning.tsx:8`); `session` (`useCognitivePositioning.ts:8`);
  `ALL_CATEGORIES` (`cognitive-signals.ts:87-90`); `classifyEvent`,
  `WorkOrientation`, `OutcomeLedger` imports
  (`pulse-classifier.diagnostic.ts:16-17`). None is referenced in tests.
- **`<img>` (4):** Google avatar images, `CognitivePositioning.tsx:359, 374`,
  `WorkHealthDashboard.tsx:570, 596`.
- **`exhaustive-deps` (3), all `useWorkHealth.ts`:** `trackEngagement`
  deps `[session]` reads `getEngagementKey` (259-276); `updateHistory` deps
  `[session]` reads `getHistoryKey` (284-349); `fetchWorkHealth` deps
  `[session, status]` reads `workHealth`, `buildFetchHeaders`,
  `getCacheKey`, `handleFetchSuccess` and more (445-584). Its identity
  feeds the 5-minute poll effect (674-687), which re-creates the interval
  when it changes.
- **Disable comments:** the three at `useWorkHealth.ts:273, 346, 581` sit
  on the line before the deps array (275, 348, 583). Two correctly placed
  ones exist (`useWorkHealth.ts:646`, `WorkHealthDashboard.tsx:271`).
- **`pulse-classifier.diagnostic.ts`:** a manual console script (header
  says `npx tsx …`), imported by nothing, not a Vitest suite, covered by
  typecheck and lint.
- **Tests:** none of the seven files has a test beside it.

## Open questions
- Whether the omitted hook dependencies are intentional (the misplaced
  disables suggest they were meant to be suppressed).
