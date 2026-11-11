# thoughts/

The factory's working memory: one file per step, per piece of work. See
`FACTORY.md` for the steps.

```
thoughts/shared/
  tickets/     the request, as given
  questions/   neutral questions about the current code
  research/    answers, with file:line references
  designs/     the agreed approach and its decisions
  outlines/    the phases, as vertical slices
  plans/       the executable plan, with checkboxes
```

Files are named `YYYY-MM-DD-<slug>.md`, with the same slug through every step.

Research, designs and plans record the `git_commit` they were written
against. A document describes the code at that commit: re-check it before
relying on it later. No secrets or personal data in here; it is committed.
