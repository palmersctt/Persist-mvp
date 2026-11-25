# Questions: how the readiness engine gets its inputs today

1. What are the inputs and outputs of `runModel` in `src/lib/model.ts`
   (`DayInputs`, `Prior`, `ModelResult`), and how is each input used in the
   computation of Readiness, Load, Balance and the verdict?
2. How does `dashboardVerdict` in `src/lib/dashboardModel.ts` build
   `DayInputs` and `Prior` from `WorkHealthMetrics` and `WearableActuals`:
   which fields does it read, which defaults does it apply when a field is
   absent, and what happens to the result after `runModel` (e.g.
   `sessionCall` in `weekPlan.ts`)?
3. Where are Focus, Strain and Rhythm (`adaptivePerformanceIndex`,
   `cognitiveResilience`, `workRhythmRecovery`) computed from calendar
   events today? Which event fields (start, end, attendees, title, organizer,
   others) feed each score, and through which functions
   (`googleCalendar.ts`, `cognitive-classification.ts`, others)?
4. What is the full shape of `WorkHealthMetrics` (`src/hooks/useWorkHealth.ts`)
   and `schedule` within it, where is it produced, and which consumers read
   which fields?
5. How do `src/lib/estimateScores.ts` and the sandbox/demo paths
   (`sandbox-personas.ts`, `pages/api/sandbox-score.ts`) produce work scores
   without a real calendar, and how do they feed the model?
6. Which API routes (`pages/api/work-health.ts` and others) compute or return
   scores and verdicts, what do they accept and return, and how do they
   authenticate the caller?
7. What does `WearableActuals` (`src/lib/wearables/types.ts`) contain, and how
   do the Strava, demo and WHOOP providers fill it, including fields they
   leave absent?
8. Is there any notion today of data completeness, confidence, or missing
   inputs anywhere in the model, the dashboard, or `ReadinessExplain.tsx`?
   How does the UI behave when calendar or wearable data is missing?
9. How are `model.ts` and `dashboardModel.ts` tested (`model.test.ts`,
   `dashboardModel.test.ts`): which scenarios, fixtures and assertions exist?
10. Is email or mail data read, stored or referenced anywhere in the code,
    the database schema, or the docs?
