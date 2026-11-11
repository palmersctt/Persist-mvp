---
description: Factory step 6 (I). Carry out an approved plan one phase at a time.
argument-hint: <plan path> [phase number]
---

# Implement plan

Plan: $ARGUMENTS

1. Read the plan fully, and the files it names. Ticked boxes are done: start
   at the first unticked phase, or the phase given.
2. Do one phase. Follow the plan's intent; where the code no longer matches
   what the plan expected, stop and report:

   ```
   Mismatch in phase N
   Plan expected: ...
   Found: ...
   Why it matters: ...
   ```

3. Run the phase's automated checks. Fix until they pass. Never skip, weaken
   or delete a test to get there.
4. Tick the automated boxes in the plan file, commit the phase with a message
   that says what changed and why, then stop and list the manual checks for
   the person. Do not tick manual boxes yourself.
5. Continue to the next phase only when told to. If the context is getting
   long, stop at the phase boundary: the plan file is the hand-off, and a
   fresh session resumes from it.

When all phases are done: `/validate_plan <plan path>`.
