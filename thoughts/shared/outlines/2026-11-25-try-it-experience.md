---
date: 2026-11-25
design: thoughts/shared/designs/2026-11-25-try-it-experience.md
status: awaiting approval
---

# Outline: Get your verdict at /verdict (ticket 7)

## Phase 1: examples → reveal → card → why
- `app/verdict/page.tsx` + `src/components/verdict/` (`VerdictExperience`,
  `Reveal`, `Receipt`): example-days door (four `DayInput`s in
  `src/lib/verdict/examples.ts`), the reveal sequence, `SwipeableQuoteCards`
  with the label, `ReadinessExplain`, the receipt, next steps (share,
  sign in, "your assistant can do this daily").
- `src/lib/verdict/quotes.ts`: engine result → quotes via
  `comicReliefGenerator`. `src/lib/verdict/revealLines.ts`: the three lines
  from the result.
- `next.config.js` redirect `/sandbox` → `/verdict`; `middleware.ts` treats
  `/verdict` as public; landing links → "Get your verdict →".
- **Automated:** examples parse and score to their intended tiers;
  revealLines/quotes tests; component test (pick example → card + why +
  receipt); `npm run verify`.
- **Manual:** phone: open `/verdict` signed out, pick each example, watch
  the reveal; `/sandbox` redirects.

## Phase 2: ask your assistant
- `src/lib/verdict/assistantPrompt.ts` (Copilot / ChatGPT / Claude
  variants); `extractJson(text)` (raw or fenced); `explainErrors(errors)`
  → plain-language fixes. Paste door UI with copy buttons.
- **Automated:** extractJson / explainErrors tests; the prompt's example
  output parses; component test (paste valid → card; invalid → fixes).
- **Manual:** run the prompt in a real assistant and paste the reply.

## Phase 3: sketch it + body chips
- Timeline builder (tap/drag blocks 6am–9pm, heavy/light toggle) and body
  chips; pure `sketchToDayInput(blocks, chips, date, tz)`.
- **Automated:** `sketchToDayInput` tests (blocks → meetings, chips →
  training/sleep); component test; `npm run verify`.
- **Manual:** build a day by thumb on a phone.

## Phase 4: funnel and clean-up
- `trackEvent`: `visitor-` id + `verdict_*` events; server allow-list
  updated, `sandbox_*` and `sandbox-` removed.
- Delete `SandboxDashboard.tsx`, `SandboxMeetingBuilder.tsx`, `WhyMood.tsx`,
  `app/sandbox/`, `pages/api/sandbox-score.ts`, `estimateScores.ts`,
  `sandbox-personas.ts`, `generateTrendsFromScore`; update docs and
  `CLAUDE.md` key files.
- **Automated:** events route accepts `verdict_*` with a `visitor-` id and
  rejects `sandbox-`; `npm run verify` (nothing imports deleted files).
- **Manual:** none beyond phase 1–3 checks.
