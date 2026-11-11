---
date: 2026-11-11
git_commit: aa2e3bb
ticket: thoughts/shared/tickets/2026-11-11-hero-card-swipe.md
research: thoughts/shared/research/2026-11-11-hero-card-swipe.md
status: agreed
---

# Design: a swipeable hero deck

## Desired end state

The hero is a deck of five cards, one per verdict. A visitor swipes or drags
the front card away and the next comes forward; the deck wraps. It also works
by tap, by arrow keys and with the dots under it. Each card's quote fits its
verdict and reads as a joke a working athlete would send to a friend.

## Decisions

### D1. Five cards, one per verdict

The active verdict set is five, and the hero shows three. A deck worth
swiping shows all five, in order of the day getting better: Survival,
Grinding, Coasting, Locked In, Flow. Flow stays in front on load, matching
the demo below it.

### D2. Build the deck in the landing page

- Do not reuse `SwipeableQuoteCards`: it shows one mood and mounts one card,
  so the fanned stack would be lost.
- The deck lives in `LandingPage.tsx` and renders `CardContent` directly, as
  now. No wrapper component around the card.
- Card data moves from JSX literals to one array in the file, with verdict
  labels read from `VERDICT_LABEL`. That fixes the coasting mismatch.
- Drag uses framer-motion, with the thresholds the dashboard already uses.

### D3. Ways to move the deck

Swipe or drag either way; tap the front card; left and right arrow keys when
the deck has focus; five dots that can be clicked. No auto-advance: the
visitor controls it, and nothing moves under reduced motion beyond the swap.

### D4. The quotes

The first set (Mad Men, Office Space, The Big Lebowski, Top Gun, Friday Night
Lights) was rejected as too old. The user asked for recent comedy at the
level of Ted Lasso and The Office, from a variety of shows, and approved:

| Verdict   | Quote                                                                         | Attribution                       |
| --------- | ----------------------------------------------------------------------------- | --------------------------------- |
| Survival  | "I'm trying very hard not to connect with people right now."                  | David Rose · Schitt's Creek       |
| Grinding  | "The work is mysterious and important."                                       | Mark S. · Severance               |
| Coasting  | "I am running away from my responsibilities. And it feels good."              | Michael Scott · The Office        |
| Locked In | "Don't you dare settle for fine."                                             | Roy Kent · Ted Lasso              |
| Flow      | "I have no idea what I'm doing, but I know I'm doing it really, really well." | Andy Dwyer · Parks and Recreation |

Wording was checked against published quote collections. The Andy Dwyer
line appears in three variants; the most common is used.

Scores per card are illustrative and sit inside each verdict's tier.

## Answers

Five cards, with the quotes above. Design and outline approved together.

## Out of scope

- The dashboard and sandbox swipe component.
- The quote pools in `comicReliefGenerator.ts`.
- The italic quote style on the card (existing card design).
