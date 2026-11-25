# Questions: per-day history and the baseline today

1. How does `runModel` (`src/lib/model.ts`) use `history` and `prior`: EWMA
   seeding, the first-day rule, what `days` affects, and how gaps between
   days would be treated?
2. What is stored per user per day today (`daily_scores`, `wearable_daily`,
   any other table): columns, keys, constraints, RLS, migrations, and which
   routes write and read each?
3. When and how often is `daily_scores` written (`pages/api/work-health.ts`),
   for which date, and with what timezone handling? Can a day be written
   more than once?
4. What does `/api/score-history` return and who consumes it
   (`TrendsSection`, `trends.ts`)?
5. Where is `dashboardVerdict` called, and what data is available at that
   point (client hooks `useWorkHealth`, `useWearable`, localStorage caches)?
6. What does `WearableActuals` / `wearable_daily` hold about past days
   (training load, sleep), and can past training load be reconstructed from
   providers (Strava/WHOOP history fetch windows)?
7. How do `src/lib/engine/scoreDay.ts` and `confidence.ts` represent history
   today (`historyDays`, the prior constants)?
8. How are Supabase migrations written, applied and tested in this repo, and
   how does the service-role client get used in API routes?
9. Which tests cover multi-day behaviour of the model today?
