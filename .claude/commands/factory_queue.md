---
description: Orchestrator. Take the next waiting ticket up to the design gate, unattended.
argument-hint: [ticket path, to pick one instead of the oldest]
---

# Factory queue

Ticket: $ARGUMENTS

For runs with nobody watching (a scheduled run, or a child session). It does
the steps that need no decision and leaves the design waiting for the person.

1. A ticket is **waiting** when `thoughts/shared/tickets/<name>.md` exists
   and `thoughts/shared/designs/<name>.md` does not, on `origin/main` or on
   any `origin/factory/*` branch. Take the one given, or the oldest waiting.
   If none is waiting, say so and stop.
2. Work on branch `factory/<slug>`, created from the latest `origin/main`.
3. Run the questions step, then research (sub-agents get the questions only),
   then write the design, following the prompts in `.claude/commands/`. Skip
   a step whose file already exists.
4. Commit the new files and push the branch. Change no product code, open no
   pull request, and do not go past the design.
5. Report: the ticket, the branch, the design path, and the decisions and
   open questions the person needs to answer.

One ticket per run.
