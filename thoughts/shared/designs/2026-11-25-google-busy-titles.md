---
date: 2026-11-25
git_commit: 9f758ba
ticket: thoughts/shared/tickets/2026-11-25-6-google-busy-titles.md
research: thoughts/shared/research/2026-11-25-google-busy-titles.md
status: agreed
---

# Design: Google calendar "Busy" blocks count as meetings

## Current state

- Google titles go through `categorizeMeeting` by substring
  (`googleCalendar.ts:151`, `:189-191`). "Busy", "Blocked", "Unavailable",
  "Not available", "Tentative" match NEUTRAL (`workScores.ts:93-115`), so a day
  of them reads as open: no meetings, Focus 90, Strain 12, work load 0.
- The engine's raw path already treats those exact titles as untitled
  meetings (`meaningfulTitle`, `workScores.ts:1022-1037`).
- The golden test pre-categorises events, so it never sees this.

## Desired end state

- On the Google path, an event whose whole title is a placeholder (the same
  `PLACEHOLDER_TITLES` set) is categorised COLLABORATIVE, exactly like an
  untitled raw meeting. Titles that merely contain the word keep today's
  category.
- Today's scores and the week-ahead hours both use the same rule.
- One shared helper decides the category from a title, so the two paths can't
  drift: `categorizeTitle(title?: string): MeetingCategory` in
  `workScores.ts` = `meaningfulTitle(title) ? categorizeMeeting(…) :
  'COLLABORATIVE'`. `toWorkEvent` and the Google service both call it.
- How to see it: a new golden day "busy placeholders" (titles Busy/Blocked/
  Tentative, categorised through `categorizeTitle`) is recorded; existing
  golden snapshots are unchanged.

## Patterns to follow

- `meaningfulTitle` / `toWorkEvent` in `workScores.ts`; golden-day fixture
  pattern in `goldenDays.fixture.ts`.

## Decisions

**D1. Which titles.** Use exactly the engine's `PLACEHOLDER_TITLES` (busy,
tentative, blocked, unavailable, not available, private, private event,
private appointment). "Hold", "Maybe", "Optional", "Out of office",
"Appointment" stay NEUTRAL: they often mean "not a meeting".
**Recommend this list**, shared, so both paths agree.

**D2. Context switching for untitled Google events.** Today all
'No title' (and, after this change, all "Busy") events share one context;
the raw path counts each as its own.
- a) Leave Google's context counting as is. Only the category changes.
- b) Align it: each untitled/placeholder Google event is its own context.
  Changes Strain for users with untitled meetings, and changes the existing
  'untitled meetings' golden snapshot (uniqueContexts 1 → 3).
- **Recommend a** now. It is the narrow fix the ticket asks for; b is a
  scoring change for a different group of users and deserves its own look.

**D3. Free/declined events** (`transparency`, `responseStatus`). Not read
today; a "Busy" block marked free or a declined meeting would now count.
**Recommend out of scope**, and a follow-up ticket to read those fields.

## Open questions for you

1. D2: keep Google's shared context for untitled events (narrow fix), or
   align it with the engine now?
2. OK to file the free/declined follow-up ticket (D3)?

## Out of scope

- `cognitive-classification.ts` / `/api/cognitive-positioning` (own rules).
- What titles the AI prompt sees (it still sees "Busy").
- Any other keyword change.

## Answers (2026-11-25)

Accepted: D1 shared placeholder list; D2 a (category only, Google context counting unchanged); D3 file a follow-up ticket for free/declined events.
