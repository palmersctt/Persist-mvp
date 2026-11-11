# Questions: lint configuration and current output

1. How is ESLint configured in `eslint.config.mjs`: which presets, which rule
   overrides, and which paths are ignored?
2. What does `npm run lint` report today, grouped by rule and by file?
3. For each `react-hooks/exhaustive-deps` report, what does the hook do, which
   values does its dependency array list, and which values does the body read?
4. Where do `eslint-disable` comments appear in the repository, and which
   rule does each one name?
5. For each identifier reported as unused, where is it declared, and is it
   exported or referenced anywhere else (including tests and `pages/api/`)?
6. What is `src/lib/pulse-classifier.diagnostic.ts`, and what imports or runs
   it?
7. Which of the files in the lint output have a Vitest test beside them, and
   what do those tests cover?
8. How do `useWorkHealth` and `useCognitivePositioning` decide when to
   refetch, and which components consume them?
