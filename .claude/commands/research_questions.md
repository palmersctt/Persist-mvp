---
description: Factory step 1 (Q). Turn a ticket into neutral research questions.
argument-hint: <ticket path under thoughts/shared/tickets/, or the request in words>
---

# Research questions

Ticket: $ARGUMENTS

Turn the ticket into the questions a newcomer would need answered about the
**current** codebase before touching it. The next step answers them without
seeing the ticket, so the research stays a description of facts, not an
argument for a solution.

1. If the ticket is words, save it first as
   `thoughts/shared/tickets/YYYY-MM-DD-<slug>.md`.
2. Read the ticket and `CLAUDE.md`. Do not read source code yet.
3. Write 5 to 10 questions to `thoughts/shared/questions/YYYY-MM-DD-<slug>.md`.
   Each asks how something works or where it lives today. None mentions the
   desired change, a solution, or the word "should".
4. Show the questions and stop. Tell the user to run
   `/research_codebase <questions path>` in a fresh session.
