---
description: Factory step 2 (R). Answer the questions with facts about the code as it is.
argument-hint: <questions path under thoughts/shared/questions/>
---

# Research codebase

Questions: $ARGUMENTS

Document the codebase as it exists. No recommendations, no critique, no
proposed changes. Do not open the ticket.

1. Read the questions file fully.
2. Fan out sub-agents in parallel so the main context stays small:
   `codebase-locator` to find files, then `codebase-analyzer` on what it
   found, `codebase-pattern-finder` for precedent, `thoughts-locator` for
   earlier work.
3. Wait for all of them, then read the few files that matter most yourself to
   confirm the key claims.
4. Write `thoughts/shared/research/YYYY-MM-DD-<slug>.md`:

   ```markdown
   ---
   date: <ISO date>
   git_commit: <git rev-parse HEAD>
   branch: <branch>
   questions: <questions path>
   status: complete
   ---

   # Research: <topic>

   ## Summary

   ## Findings (one section per question, every claim with path:line)

   ## Code references

   ## Open questions (what the code could not answer)
   ```

5. Give the user a short summary and stop. Next step, fresh session:
   `/design_discussion <ticket path> <research path>`.
