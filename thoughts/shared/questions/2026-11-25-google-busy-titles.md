# Questions: how event titles become categories on the Google path

1. Where does the Google path turn an event title into a category and a
   context key (`googleCalendar.ts` `getTodaysEvents`, `getWeekAhead`,
   `analyzeWorkHealth`), and what happens to empty or missing titles?
2. Which keyword lists contain "busy", "blocked", "unavailable",
   "tentative", "private" or similar, and what do matching events do in each
   score (Focus, Strain, Rhythm, schedule stats, week-ahead hours)?
3. What does `meaningfulTitle` in `src/lib/engine/workScores.ts` do, and
   where is it used?
4. What does the golden snapshot (`src/services/__snapshots__/`) cover, and
   do any golden days contain placeholder-style titles?
5. Which other consumers read event titles or categories on the Google path
   (`claudeAI.ts`, `cognitive-classification.ts`, `/api/cognitive-positioning`,
   `comicReliefGenerator`)?
6. What do Google Calendar API events look like for shared/free-busy-only
   calendars as handled in code (any `visibility`, `transparency`,
   `eventType` fields read)?
