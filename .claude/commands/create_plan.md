---
description: Factory step 5 (P). Expand the approved outline into an executable plan.
argument-hint: <outline path>
---

# Create plan

Outline: $ARGUMENTS

The plan is written for the implementing agent. The person has already
agreed the design and outline, and will review the code, not this file.

1. Read the outline, its design and its research fully. Re-read the source
   files the plan will touch, since the code may have moved.
2. Write `thoughts/shared/plans/YYYY-MM-DD-<slug>.md`:

   ```markdown
   ---
   date: <ISO date>
   git_commit: <git rev-parse HEAD>
   design: <path>
   outline: <path>
   status: ready
   ---

   # Plan: <title>

   ## What we are not doing

   ## Phase N: <name>

   ### Changes (file by file: path, what changes, code where it helps)

   ### Automated checks (- [ ] exact commands, e.g. `npm run verify`)

   ### Manual checks (- [ ] what a person looks at, and where)
   ```

3. Every phase ends with `npm run verify` green. New logic in `src/lib/` gets
   a Vitest test beside it, in the same phase.
4. No open questions may remain in the plan. If one turns up, stop and ask.

Next step, fresh session: `/implement_plan <plan path>`.
