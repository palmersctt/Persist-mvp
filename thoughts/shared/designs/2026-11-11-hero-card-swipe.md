---
date: 2026-11-11
git_commit: aa2e3bb
ticket: thoughts/shared/tickets/2026-11-11-hero-card-swipe.md
research: thoughts/shared/research/2026-11-11-hero-card-swipe.md
status: awaiting decisions
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

| Verdict   | Quote                                               | Attribution                        | Line under it                                                          |
| --------- | --------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| Survival  | "Not great, Bob!"                                   | Pete Campbell · Mad Men            | Back-to-backs all day on a heavy week. Today the couch is the workout. |
| Grinding  | "Sounds like somebody's got a case of the Mondays." | Office Space                       | Six meetings that could have been emails. Keep the run easy.           |
| Coasting  | "The Dude abides."                                  | The Dude · The Big Lebowski        | Quiet calendar, nothing to prove. Train if you feel like it.           |
| Locked In | "I feel the need... the need for speed."            | Maverick · Top Gun                 | Clear afternoon, rested legs. This is the day you were saving it for.  |
| Flow      | "Clear eyes, full hearts, can't lose."              | Coach Taylor · Friday Night Lights | Eight meetings and intervals at six, still inside your band.           |

Scores per card are illustrative and sit inside each verdict's tier.

## Open questions for the human

1. Are these five quotes right, or do you want any swapped?
2. Five cards, or keep three?

## Out of scope

- The dashboard and sandbox swipe component.
- The quote pools in `comicReliefGenerator.ts`.
- The italic quote style on the card (existing card design).
