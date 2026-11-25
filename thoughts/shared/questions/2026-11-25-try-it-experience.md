# Questions: the public demo, the card, and the landing page today

1. What does `app/sandbox/page.tsx` + `src/components/SandboxDashboard.tsx`
   render and do today: sections, inputs, state, which APIs it calls, which
   shared components it uses, and what it shows that the dashboard does not?
2. How is `/sandbox` reached and protected: links in `LandingPage.tsx`,
   `middleware.ts` rules, any other references (sitemap, analytics, docs)?
3. What props does `CardContent.tsx` take, where does each prop's data come
   from on the dashboard (`WorkHealthDashboard.tsx`) and in the sandbox, and
   which parts depend on AI-generated text (quotes, hero messages) vs. the
   model verdict?
4. How do `SwipeableQuoteCards.tsx`, `heroDeck.ts` and the mood/tier data in
   `mood.ts` (`VERDICT_MOOD`, MOODS, gradients) shape what the card shows,
   and what inputs do they need?
5. What does `pages/api/sandbox-score.ts` return beyond work metrics (the
   `ai` insights, comic-relief fallback), and which of it can be produced
   without a server (local generators, `getDefaultInsights`)?
6. What does the landing page's own demo card (`app/page.tsx` /
   `LandingPage.tsx`) show, and how is it built?
7. What animation, transition or reveal patterns exist in the codebase today
   (CSS keyframes, Tailwind classes, libraries in `package.json`)?
8. How is analytics tracked (`trackEvent.ts`, `/api/analytics/*`, any
   client-side tracker), and does it work for signed-out visitors?
9. Which files import `estimateScores.ts`, `sandbox-personas.ts`,
   `generateTrends.ts`, `/api/sandbox-score`, or anything only the sandbox
   uses?
10. What do `BRAND.md` and `app/globals.css` define for tokens, type scale,
    gradients per tier, and motion?
