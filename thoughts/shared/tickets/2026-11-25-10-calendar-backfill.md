# A personal baseline from day one (calendar backfill)

**As** a new user, **I want** my first verdict measured against my last few
weeks, **so that** it's personal immediately.

## Acceptance criteria
- At first connect, read up to 21 days of past calendar and log each day's
  work inputs into `day_inputs` (training from the provider's history).
- Fails soft: a failed backfill never blocks the dashboard.

## Context
Deferred from the real-baseline design (D4). Readiness model + database:
full pipeline.
