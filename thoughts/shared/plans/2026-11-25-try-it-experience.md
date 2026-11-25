---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-try-it-experience.md
outline: thoughts/shared/outlines/2026-11-25-try-it-experience.md
status: in progress
---

# Plan: Get your verdict

## What we are not doing
Server scoring or storage for visitors; changes to CardContent, MOODS, the
model or the engine; the waitlist (ticket 12); card italics (ticket 11).

## Phase 1: examples → reveal → card → why
### Changes
- `src/lib/verdict/`: `localTime.ts` (`localIso`, `browserDay`,
  `nextDates`), `examples.ts` (four days), `quotes.ts` (engine work →
  comicReliefGenerator quotes), `story.ts` (`revealLines`, `receipt`),
  `share.ts` (PNG share/download).
- `src/components/verdict/`: `VerdictExperience` (choose → reveal → result;
  takes extra `doors`), `Reveal` (three lines, tap to skip, instant under
  reduced motion), `Receipt`.
- `app/verdict/` page + metadata layout; `.verdict-glow` in globals.css
  (good-tier lime pulse, tokens only).
- `next.config.js`: `/sandbox` → `/verdict` (308). Landing links renamed
  "Get your verdict →".
### Automated checks
- [x] `src/lib/verdict/verdict.test.ts` (offsets incl. DST and +05:30,
      examples valid and land in their tiers, reveal lines, receipt, quotes)
- [x] `VerdictExperience.test.tsx` (example → reveal → card + why + receipt;
      back to choose)
- [x] `npm run verify`
### Manual checks
- [ ] Phone: open `/verdict` signed out, pick each example, watch the
      reveal; `/sandbox` redirects.

## Phase 2: ask your assistant
### Changes
- `src/lib/verdict/assistantPrompt.ts`: Copilot / ChatGPT / Claude prompt
  (today, the visitor's zone, metadata-only JSON, category guide),
  `extractJson` (raw or fenced), `explainErrors` (validation → fixes).
- `src/components/verdict/AssistantDoor.tsx`: tabs, copy prompt, see
  prompt, paste, "Get my verdict", fixes list. Wired on `/verdict` as the
  first door; the result adds "Your assistant can do this daily".
### Automated checks
- [x] `assistantPrompt.test.ts` (prompt contents; its example parses;
      extraction; fixes); `AssistantDoor.test.tsx`
- [x] `npm run verify`
### Manual checks
- [ ] Run the prompt in a real Copilot / ChatGPT / Claude and paste the reply.

## Phase 3: sketch it + body chips
- [ ] timeline + chips, `sketchToDayInput`; tests; verify

## Phase 4: funnel and clean-up
- [ ] `visitor-` analytics funnel; delete the sandbox; docs; verify
