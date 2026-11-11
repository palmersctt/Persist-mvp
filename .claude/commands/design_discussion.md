---
description: Factory step 3 (D). Agree the approach with the human before any plan exists.
argument-hint: <ticket path> <research path>
---

# Design discussion

Inputs: $ARGUMENTS

This is the cheapest place to correct course. Aim for a document of about
200 lines that a person will actually read.

1. Read the ticket and the research fully. Read `CLAUDE.md`, and `BRAND.md` if
   anything visual is involved.
2. Write `thoughts/shared/designs/YYYY-MM-DD-<slug>.md`:
   - **Current state**: what exists, from the research, with `path:line`.
   - **Desired end state**: what is true when this is done, and how to see it.
   - **Patterns to follow**: the existing code this change should look like.
   - **Decisions**: each with the options, your recommendation, and why.
   - **Open questions for the human**: only what the code cannot answer.
   - **Out of scope**: what this change will not do.
3. Check the design against the hard rules in `CLAUDE.md` (one card renderer,
   one MOODS record, three tiers, fixed score and verdict names, brand tokens
   only). A design that needs to break one says so under Decisions.
4. Present the decisions and open questions, and wait. Update the document
   with the answers. Do not write a plan in this step.

Next step once the design is agreed: `/structure_outline <design path>`.
