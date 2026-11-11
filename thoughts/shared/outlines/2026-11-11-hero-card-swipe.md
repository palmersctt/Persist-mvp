---
date: 2026-11-11
design: thoughts/shared/designs/2026-11-11-hero-card-swipe.md
status: awaiting approval
---

# Outline: a swipeable hero deck

## Phase 1: the deck data and its order

- New `src/lib/heroDeck.ts`: the five cards as data (`HERO_DECK`), with
  verdict labels from `VERDICT_LABEL`, and a pure `deckOrder(front, n)` that
  says which card sits front, left, right or hidden.
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
