# Questions: the landing hero cards and quote sources

1. How is the hero card stack on the landing page built
   (`src/components/LandingPage.tsx`, `LandingPage.css`): which cards, in
   what order, with what data, and how are they positioned and layered?
2. What props does `src/components/CardContent.tsx` take, and what does each
   hero card pass?
3. Where do the hero cards' quotes, attributions, verdict lines and scores
   come from? List every quote shown on the landing page with its mood/tier.
4. What does `src/components/SwipeableQuoteCards.tsx` do: gestures, buttons,
   keyboard, indicators, animation library, props, and where is it used?
5. What quote pools exist (`src/utils/comicReliefGenerator.ts`, `mood.ts`,
   anywhere else): their shape, how many per mood, and how one is chosen?
6. How does the landing page handle reduced motion, mobile layout of the
   hero, and server rendering / first paint of the hero cards?
7. Which tests cover the landing page, the card, or the quote pools?
