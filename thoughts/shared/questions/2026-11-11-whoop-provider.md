# Questions: wearable providers as they work today

1. What is the provider contract in `src/lib/wearables/types.ts`: which
   types and functions does a provider supply, and how are providers
   registered and looked up by name?
2. How does the Strava provider work end to end: authorisation URL, callback
   and token exchange, token storage and refresh, data fetch, and mapping to
   `WearableActuals`?
3. What does `src/lib/wearables/whoop.ts` contain today, what does it export,
   and what imports or calls it?
4. What do the routes under `pages/api/wearables/` (`connect`, `callback`,
   `disconnect`, `actuals`) do, and how do they choose a provider and
   identify the signed-in user?
5. What is stored in the database for wearables
   (`supabase/migrations/20260611_wearables.sql`): tables, columns,
   constraints and row-level security?
6. Which environment variables do wearable providers read, where are they
   read and typed, and what happens when one is missing?
7. Which fields of `WearableActuals` does `src/lib/dashboardModel.ts` use,
   how do they enter `src/lib/model.ts`, and what happens when a field is
   absent?
8. How do `useWearable` and `WearableSection` present providers: which are
   offered, how is connection state shown, and what does the demo provider do?
9. How are wearable providers tested today (`strava.test.ts` and any others),
   and what do those tests stub?
10. What does `WEARABLES.md` say about provider setup, the schema, and WHOOP?
