---
description: Factory step 7. Check the finished work against its plan and report.
argument-hint: <plan path>
---

# Validate plan

Plan: $ARGUMENTS

Run this in a fresh session, so the check is made by a reader who did not
write the code.

1. Read the plan. Read the diff against the default branch
   (`git diff origin/main...HEAD`), in full.
2. For each phase, confirm the listed changes are in the diff, and run every
   automated check yourself. Do not trust the ticked boxes.
3. Check the diff against the hard rules in `CLAUDE.md`.
4. Report:
   - per phase: done, partly done, or missing, with `path:line`;
   - check results, with the output of any failure;
   - changes in the diff that the plan did not call for;
   - the manual checks still owed by a person.

Do not fix anything in this step. The report goes to the person, who reads
the code before it merges.
