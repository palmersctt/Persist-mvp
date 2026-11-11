---
date: 2026-11-11
design: thoughts/shared/designs/2026-11-11-hero-card-swipe.md
status: approved, implemented
---

# Outline: a swipeable hero deck

## Phase 1: the deck data and its order

- New `src/lib/heroDeck.ts`: the five cards as data (`HERO_DECK`), with
  verdict labels from `VERDICT_LABEL`, and pure helpers `deckSlot` and `stepDeck` that
  say which card sits front, next, previous or hidden.
- `LandingPage.tsx` renders the fan from `HERO_DECK`; Flow in front. No
  interaction yet, same look as today with the new quotes.
- **Automated:** `heroDeck.test.ts`: five cards, one per active verdict,
  each mood in the right tier, labels equal `VERDICT_LABEL`, `deckOrder`
  wraps. `npm run verify`.
- **Manual:** the hero looks as before, with the new copy.

## Phase 2: swipe, tap, keys, dots

- `LandingPage.tsx`: front-card drag with framer-motion, tap to advance,
  arrow keys, clickable dots, a live `aria-label` naming the card in front.
- `LandingPage.css`: positions for front, left, right and hidden cards, with
  transitions; a "Swipe" hint under the deck.
- **Automated:** `npm run verify`; a browser check that a drag, a tap and an
  arrow key each change the front card, on desktop and phone widths.
- **Manual:** swipe it on a real phone.

## Outcome

Both phases were built together and checked in a browser at desktop and
phone widths: drag left and right, tap, arrow keys, dots, and a touch swipe
each change the front card as intended, with no horizontal overflow. The
browser check caught one bug (a drag's pointer-up also fired the tap, so a
right swipe went forward), fixed before commit. A quick flick of under 60px
counts as a swipe, as on the dashboard.
