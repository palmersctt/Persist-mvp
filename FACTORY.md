# Persist software factory

How work moves from a request to merged code in this repository. The method
is adapted from Dex Horthy's (HumanLayer) work on context engineering for
coding agents: the research → plan → implement workflow, its later split into
smaller steps, and the 12-factor-agents principles.

## The idea

- **The context window is the only lever.** An agent does its best work when
  its context holds a small amount of correct, relevant material. Each step
  below runs in a fresh session and passes on one short document.
- **Compact on purpose.** Every step ends by writing a file under `thoughts/`.
  That file, not the chat history, is what the next step reads.
- **Sub-agents keep the main context clean.** Searching and reading go to the
  agents in `.claude/agents/`, which return only the conclusion.
- **Spend human attention early.** A wrong line of research becomes hundreds
  of wrong lines of code, so the person reviews the design and the outline,
  where a correction costs a sentence.
- **People still read the code.** The plan is for the agent. Nothing merges on
  the strength of a plan or a ticked box.
- **Checks push back.** Every phase ends with `npm run verify` green, and CI
  runs the same command on every pull request.

## The line

| Step | Command               | Reads                 | Writes                      | Person's part            |
| ---- | --------------------- | --------------------- | --------------------------- | ------------------------ |
| Q    | `/research_questions` | ticket                | `thoughts/shared/questions` | skim the questions       |
| R    | `/research_codebase`  | questions only        | `thoughts/shared/research`  | spot-check the facts     |
| D    | `/design_discussion`  | ticket + research     | `thoughts/shared/designs`   | **decide** (main review) |
| S    | `/structure_outline`  | design                | `thoughts/shared/outlines`  | **approve the slices**   |
| P    | `/create_plan`        | outline, design, code | `thoughts/shared/plans`     | none needed              |
| I    | `/implement_plan`     | plan                  | code, one commit per phase  | manual checks per phase  |
| V    | `/validate_plan`      | plan + diff           | a report                    | **read the code**, merge |

Start a new session between steps (`/clear`), and pass the path of the
previous step's file as the argument.

Research never sees the ticket. It answers neutral questions about the code
as it is, so it reports facts and does not argue for a solution.

## Sizing

Not every change needs the whole line.

- **Typo, copy, one-line fix:** just make the change and run `npm run verify`.
- **Small, well-understood change:** `/create_plan` from a short description,
  then `/implement_plan`.
- **Anything touching the readiness model, the card system, auth, or the
  database:** the whole line.

## Checks

`npm run verify` runs lint, typecheck and the Vitest suite. It is the gate for
every phase and for CI (`.github/workflows/ci.yml`).

`npm run check` also runs `format:check`, which currently fails on files that
predate Prettier. Until those are reformatted in a change of their own, run
`npx prettier --check <files you touched>` on your own files.

## Where things live

| Path                | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `.claude/commands/` | One prompt per step. Short on purpose                  |
| `.claude/agents/`   | Locator, analyzer, pattern-finder, thoughts-locator    |
| `thoughts/shared/`  | Tickets, questions, research, designs, outlines, plans |
| `CLAUDE.md`         | Standing rules every step obeys                        |

The prompts are owned by this repository. When a step keeps going wrong, fix
its prompt, the same way a failing test gets fixed.
