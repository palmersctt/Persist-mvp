---
date: 2026-11-25
git_commit: 0ca0c27
ticket: thoughts/shared/tickets/2026-11-11-clear-lint-warnings.md
research: thoughts/shared/research/2026-11-11-clear-lint-warnings.md
status: agreed
---

# Design: zero lint warnings, no behaviour change

## Current state
19 warnings (see research): 9 unused identifiers, 4 `<img>`, 3
`exhaustive-deps` in `useWorkHealth.ts` plus their 3 misplaced disables.

## Desired end state
`npm run lint` prints no problems; the app behaves identically; every
remaining suppression says why.

## Decisions

**D1. Unused identifiers.** Delete them, including the dead
`refreshGoogleToken` / `isGoogleAuthError` in `work-health.ts` (never
called; `cognitive-positioning.ts` keeps its own copy). **Recommend.**

**D2. `exhaustive-deps` in `useWorkHealth.ts`.**
- a) Move each disable to the deps line it was meant for, with a one-line
  reason ("session is the only input that changes the key / the fetch;
  adding the helpers would rebuild the poll interval every render").
- b) Add the missing deps (and `useCallback`-wrap the helpers). That
  changes when the 5-minute poll interval is re-created and risks refetch
  loops.
- **Recommend a.** The ticket says no behaviour change; b is a hook refactor
  that needs its own ticket and tests.

**D3. `<img>` for Google avatars.**
- a) Keep `<img>` with a targeted disable: tiny remote avatars, and
  `next/image` would need `images.remotePatterns` for
  `lh3.googleusercontent.com` and routes them through Vercel image
  optimisation.
- b) Switch to `next/image` and add the remote pattern.
- **Recommend a.**

**D4. The diagnostic script.** Keep it; only its unused imports go.

## Open questions for you
1. D2 a (suppress with reasons, no behaviour change)? Or do you want the
   hook refactor (b) as its own ticket?

## Out of scope
- Tightening rules from warn to error; `next/image`; refactoring the hook.

## Answers (2026-11-25)

Accepted: D1 delete unused identifiers; D2 a (move each disable to the deps line, with a reason; no behaviour change); D3 a (keep `<img>` with a reasoned disable); D4 keep the diagnostic.
