# A splashy, meaningful "try it" experience (replaces the sandbox)

**As** a visitor who hasn't signed up — especially someone at a company whose
Outlook calendar can't be connected —
**I want** to see my own readiness verdict in under a minute, from my real
day,
**so that** I understand what Persist does for me before I hand over any
account.

**As** the Persist team,
**I want** that experience to show the engine as the product (any data
source in, one trustworthy verdict out),
**so that** it doubles as the demo of the scoring-engine pitch and as the
no-IT test with Outlook users.

## Acceptance criteria

- Replaces `/sandbox` and `SandboxDashboard`. Not called "sandbox" anywhere a
  visitor can see it (route, nav, copy). The landing page's "See the demo"
  links point to it; the old URL redirects.
- Ways in, all scored client-side through the engine (`scoreDay`), with no
  unauthenticated scoring endpoint:
  - **Paste from your assistant:** a ready-to-copy prompt for Copilot /
    ChatGPT / Claude that returns `DayInput` JSON (metadata only), and a box
    to paste it into; validation errors are shown helpfully.
  - **Build your day by hand:** quick meeting blocks, no titles required.
  - **Example days** for people who just want to look.
- The result is the real card (`CardContent`) and the real "why" panel
  (`ReadinessExplain`), including confidence — no copied dashboard layout.
- Splashy: a memorable reveal of the verdict, on brand (dark + lime + Geist,
  `BRAND.md` tokens only), works well on a phone.
- Meaningful: it says plainly what was used, what wasn't, and that nothing
  left the browser; a clear next step (sign in / connect / get updates).
- `/api/sandbox-score`, `SandboxDashboard.tsx`, and the unused
  `estimateScores.ts` / `sandbox-personas.ts` are removed.

## Context

The sandbox is the landing page's only no-signup demo (2,268 lines, mostly a
copy of the dashboard) and scores through an unauthenticated route that
fabricates Google events. The engine input contract (ticket 1) makes a
client-side, any-source version possible. Touches the card system and the
landing page: full pipeline.
