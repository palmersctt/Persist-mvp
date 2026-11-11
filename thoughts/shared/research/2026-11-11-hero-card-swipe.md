---
date: 2026-11-11
git_commit: aa2e3bb
branch: claude/jolly-pascal-67e0me
questions: thoughts/shared/questions/2026-11-11-hero-card-swipe.md
status: complete
---

# Research: the landing hero cards and quote sources

## Summary

The hero shows three hard-coded `CardContent` cards as a static fan. Nothing
on it responds to touch, click or keys. A swipe component exists but is built
for one mood with several quotes, and is not used on the landing page.

## Findings

- **Stack.** Three `CardContent` instances in `div.lp-hero-visual`
  (`role="img"`, one `aria-label`): survival and coasting as absolutely
  positioned back cards, flow in front
  (`src/components/LandingPage.tsx:135-176`). The fan is CSS: `--fan`
  transforms and the `lpFan` keyframes
  (`src/components/LandingPage.css:76-114`), narrower under 860px
  (`:701-722`).
- **Data.** Quotes, attributions, subtitles, scores and verdict strings are
  literals in the JSX. The front card's scores count up with `useCountUp`
  (`LandingPage.tsx:17-19`).
- **A label mismatch.** The coasting card says "Keep it moderate"
  (`LandingPage.tsx:161`). `VERDICT_LABEL.Coasting` is `'Optional'`;
  "Keep it moderate" is the Grinding label (`src/lib/mood.ts:55-61`).
- **Quotes on the page.** "Not great, Bob!" (Pete Campbell, Mad Men);
  "It's a living." (Every Hanna-Barbera character ever); "Clear eyes, full
  hearts, can't lose." (Coach Taylor, Friday Night Lights). No others.
- **`SwipeableQuoteCards`.** framer-motion horizontal drag, 60px or 300px/s
  to commit, wraps, dots, one card mounted at a time, one mood for all
  quotes, no buttons or keyboard
  (`src/components/SwipeableQuoteCards.tsx:11-32,58-92,159-201`). Used by the
  dashboard and sandbox only.
- **Quote pools.** `src/utils/comicReliefGenerator.ts` holds about 235
  film and TV quotes keyed by metric conditions, not by mood. `mood.ts` has
  none.
- **Motion.** A global `prefers-reduced-motion` rule shortens all
  animations and transitions (`app/globals.css:394-404`).
- **Tests.** None for the landing page, the card or the swipe component. No
  `*.test.tsx` exists in the repository.
