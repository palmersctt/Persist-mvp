# "Tell me when Outlook works" waitlist

**As** an Outlook-at-work visitor on /verdict, **I want** to leave my email
to hear when Outlook is supported, **so that** I'm not lost after the demo.

## Acceptance criteria
- An email field on /verdict's next-steps; stored in a `waitlist` table
  (email, source, created_at; no public read). Rate-limited; no double entries.

## Context
Deferred from the Get-your-verdict design (open question 2). Database: full
pipeline.
