---
description: Factory step 4 (S). Break the agreed design into vertical slices.
argument-hint: <design path>
---

# Structure outline

Design: $ARGUMENTS

Produce the shape of the work, not the detail: the order of phases and how
each one is proved, short enough to review in two minutes.

1. Read the design fully.
2. Write `thoughts/shared/outlines/YYYY-MM-DD-<slug>.md` with 2 to 6 phases.
   Each phase is a **vertical slice**: it leaves the app working and can be
   checked on its own. Do not slice by layer (all types, then all logic, then
   all UI). For each phase give:
   - what changes, as file paths and the new or changed signatures and types;
   - the automated check that proves it (a named Vitest test, `npm run verify`);
   - the manual check, if a person must look at the app.
3. Show the outline and wait for approval or reordering.

Next step: `/create_plan <outline path>`.
