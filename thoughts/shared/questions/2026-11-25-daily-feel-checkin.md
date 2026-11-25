# Questions: user input surfaces and per-day storage today

1. What does the dashboard (`WorkHealthDashboard.tsx`) render below and
   around the card, and where are interactive controls today (share, swipe,
   tabs, wearable connect)?
2. How do existing client components post user actions to the server
   (`trackEvent`, wearable connect/disconnect, any form), and how do those
   routes authenticate and validate input?
3. What per-user per-day tables exist (`daily_scores`, `wearable_daily`),
   with what keys, columns and RLS, and how are rows upserted?
4. Is there any existing notion of user-reported feel, mood, energy or
   rating anywhere in code, schema, `trainingFeel`, or docs/designs
   (e.g. the deferred "one-tap feel input" in earlier designs)?
5. What does `trainingFeel` do in `src/lib/model.ts`, and where is it set?
6. How is the user's local date determined on client and server
   (timezone headers, `toLocaleDateString('sv-SE')`)?
7. What export or admin/query paths exist for stored data
   (`/api/analytics/users`, `/api/score-history`, Supabase access)?
8. How are API routes tested in this repo, if at all?
