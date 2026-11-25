---
date: 2026-11-25
git_commit: 72115ef
ticket: thoughts/shared/tickets/2026-11-25-7-try-it-experience.md
research: thoughts/shared/research/2026-11-25-try-it-experience.md
status: awaiting decisions
---

# Design: "Get your verdict" — the no-signup experience

## Current state

- `/sandbox` (`app/sandbox/page.tsx`) renders the 2,268-line
  `SandboxDashboard`: type titled meetings → POST to the unauthenticated
  `/api/sandbox-score` (fabricated Google events) → verdict client-side →
  swipe cards, `WhyMood`, demo-training `ReadinessExplain`, synthetic trends,
  three metric tabs. Most of it duplicates the dashboard.
- The landing page links to it twice ("See the demo",
  `LandingPage.tsx:110, 152`); everything else on the landing page sends
  people to Google sign-in, which Outlook-at-work visitors can't use.
- The engine (`scoreDay`, `parseDayInput`) is pure and browser-safe;
  `comicReliefGenerator` (card quotes) is browser-safe too.

## Desired end state

One page, working name **Get your verdict** at **`/verdict`**, built in
three beats. Everything runs in the browser; nothing is sent anywhere
except anonymous analytics events.

**Beat 1 — "Bring your day." Three doors, big and tappable:**
1. **Ask your assistant** (the headline door). Tabs for Copilot, ChatGPT and
   Claude, each with a one-tap "Copy prompt". The prompt asks the assistant
   to read today's calendar (and, if it can, sent-mail counts) and reply
   with `DayInput` v1 JSON: times with offsets, categories instead of
   titles, no names, no content. Paste box below; it accepts raw JSON or a
   fenced code block. `parseDayInput` errors are shown as plain fixes
   ("meeting 3 has no time zone — ask your assistant to include it").
2. **Sketch it.** A one-day timeline from 6am to 9pm: drag or tap to lay
   busy blocks, optional "heavy / light" per block, no titles. Phone-first.
3. **Try an example.** Four real-looking days, one per story:
   "Eight back-to-backs", "Busy blocks only (Outlook)", "Open day, long run
   planned", "Short sleep, light calendar".

   Under all three, an optional **"Your body today"** row of chips:
   trained (none / easy / hard / long), slept (rough / ok / great). They map
   onto `training` and `sleep` in `DayInput`. Skipping is fine and lowers
   confidence.

**Beat 2 — The reveal (the splash).** A full-bleed dark moment, about 2.5s,
skippable on tap, instant under reduced motion:
- Three lines type in, in sequence, each driven by the real result:
  "7 meetings, 6.5 hours · 4 back-to-back" → "Focus 34 · Strain 71 ·
  Rhythm 40" → "Load 1.24× your baseline".
- Then the real card lands: tier gradient, `useCountUp` scores, verdict and
  label (e.g. **Grinding · Easy only**). The good tier gets a single lime
  glow pulse; the bad tier a hard cut. Motion uses the existing
  `.reveal-card` easing and framer-motion, which is already installed.

**Beat 3 — "Why, and what we used."**
- The real `ReadinessExplain` (equation, training, workday, confidence line).
- A **receipt**: what went in ("7 meeting times · categories · sleep chip"),
  what didn't ("no titles, no names, no email content"), and "Scored in
  your browser. Nothing was uploaded."
- Next steps: **Share my card** (the existing `html-to-image` export), **Get
  this every morning** (Google sign-in), and for Outlook visitors **"Your
  assistant can do this daily"**, which re-shows the prompt. Plus "Score
  another day".

Old `/sandbox` links redirect to `/verdict`. The landing page's "See the
demo →" becomes "Get your verdict →".

How to see it: open `/verdict` signed out on a phone; paste a JSON day from
any assistant, sketch a day, and pick an example. Each gives a reveal, a
real card, a why panel and a receipt.

## Patterns to follow

- Card: `SwipeableQuoteCards` → `CardContent`, exactly as the dashboard uses
  them (`WorkHealthDashboard.tsx:721-746`), with the `verdict` label prop.
- Scoring: `parseDayInput` → `scoreDay` (`src/lib/engine`).
- Quotes: `comicReliefGenerator.generateMultipleQuotes`, the same local
  source `/api/sandbox-score` falls back to.
- Motion: `.reveal-up` / `.reveal-card`, `--d` staggers, `useCountUp`, the
  global reduced-motion rule (`globals.css:338-404`).
- Landing deck interaction (`LandingPage.tsx:20-77`) for swipe and tap
  feel.

## Decisions

**D1. Name and route.**
- a) **Get your verdict, `/verdict`**: uses the brand's own word ("Train
  on the verdict") and names the outcome, not the mechanism.
- b) "Score your day", `/score`.
- c) "Try Persist", `/try`.
- **Recommend a.** The redirect from `/sandbox` keeps old links working.

**D2. Which doors ship.** All three (assistant, sketch, examples). The
assistant door is the strategic one; examples are the fallback for people
who won't do anything; sketch is the phone-native middle.
**Recommend all three**, with the assistant door first and largest.

**D3. Card quote source.** `CardContent` requires a quote.
- a) `comicReliefGenerator` (browser-safe, what the dashboard falls back to)
  fed with metrics derived from the engine result; swipeable, five quotes.
- b) Five static lines per verdict.
- **Recommend a.** It is consistent with the dashboard and no new copy is
  needed.

**D4. What we drop.** The synthetic trends, the three metric tabs,
`WhyMood`, the Fresh/Steady/Fatigued toggle (replaced by the body chips),
the titled meeting builder, `/api/sandbox-score`, `SandboxDashboard`,
`SandboxMeetingBuilder`, `WhyMood`, `estimateScores.ts`,
`sandbox-personas.ts`, `generateTrendsFromScore`. **Recommend dropping all
of it.** Fake trends contradict the "trustworthy engine" pitch.

**D5. Analytics for signed-out visitors.** The events route only accepts
signed-out events with a `sandbox-` id.
- a) Rename the id prefix to `visitor-`, replace the `sandbox_*` events with
  a short funnel (`verdict_door_chosen`, `verdict_prompt_copied`,
  `verdict_paste_failed`, `verdict_scored`, `verdict_shared`,
  `verdict_signin_clicked`), and update the server allow-list to match.
- b) Keep the `sandbox-` prefix internally.
- **Recommend a.** It's the funnel we need for the Outlook test. Fixing the
  five pre-existing allow-list misses is out of scope.

**D6. Storage.** Nothing is stored: no localStorage, no server. This keeps
the receipt's promise literally true. **Recommend none.**

**D7. Time zone.** From the browser (`Intl`), for sketch and examples. A
pasted day uses its own `timezone`, as validated.

**D8. Hard rules (CLAUDE.md).** One card renderer (`CardContent` via
`SwipeableQuoteCards`); `MOODS` and `VERDICT_MOOD` imported; three tiers;
fixed score and verdict names; brand tokens only, with lime as the only
accent. Two notes: the "Busy blocks only" example will read as low
confidence, by design. `CardContent` already renders the quote in italic,
which conflicts with the no-italics rule; that is pre-existing and left
alone (see open question 4).

## Open questions for you

1. **Name/route**: "Get your verdict" at `/verdict` (D1)?
2. **After the reveal, the main ask**: Google sign-in ("Get this every
   morning"), or should Outlook visitors get a waitlist ("Tell me when
   Outlook works")? A waitlist needs one small table, so it is a database
   change. Recommend sign-in plus the "your assistant can do this daily"
   prompt now, and the waitlist as its own ticket.
3. **The four example days** (D2): those four stories, or do you want them
   tied to `PERSONAS.md`?
4. **Card quote italics**: leave as is (pre-existing), or fix in this
   change? Recommend a separate one-line ticket.

## Out of scope

- Any server scoring, storage, or account for visitors.
- Changing `CardContent`, `MOODS`, the model or the engine.
- Real trends or history for visitors.
- The landing page beyond its two demo links and their label.
- The pre-existing analytics allow-list gaps for dashboard events.
