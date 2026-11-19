# 0032 report (proposal stage, not final)

This is the proposal for the user's verdict. `README.md` is not changed yet.

## Outline

1. Logo, tagline, badges (as now).
2. Pitch (3 sentences) and the hero: the board screenshot.
3. **What it can do** (9 one-liners).
4. **Why braid** (4 problems, each with how braid answers it).
5. **A walk-through**: one goal, "braid: add dark mode", in 6 steps with the thread mock-up, the flow diagram and board shots.
6. Quick start, the CLI taste, docs table, contributing, licence (as now). The old "What is braid" and "How it works" fold into the sections above. About 190 lines.

## Draft text

> **Orchestrates agents. Keeps the ledger. Braids the work.**
>
> Tell braid a goal. It splits the goal into small work items, has a coding agent build each one on its own branch, has a different agent review it, and hands you pull requests that are ready to merge. Everything is written down as plain files in your repository, so nothing depends on one chat staying alive.
>
> ![hero: board] *The braid board on sample data: what needs you comes first, the rest stays out of your way.*
>
> ## What it can do
> - **Plan a goal into reviewed pull requests.** Say "braid: add dark mode"; you get a plan to approve, then one PR per part.
> - **Review by a different model.** Every PR is read against its brief by an independent reviewer before it reaches you.
> - **Resume from the files.** Briefs, logs and reports live in `braids/`; after a crash or in a new session any agent continues from them.
> - **See what needs you.** `braid board` shows what waits on you and can Start a braid, ask the coordinator to merge, and open an agent's thread.
> - **Use it from your phone.** The board has a phone layout and can be served on your Tailscale network (`--host`).
> - **Stops and asks when a decision is yours.** Security, new dependencies, data changes, outside effects, scope changes: it waits and asks.
> - **Auto mode for a goal.** Strand PRs merge into the goal's branch when seven conditions hold; the final PR into `main` is always yours.
> - **Capture ideas without breaking flow.** `$braid-idea` and `braid note` park an idea or leftover in an inbox the board shows.
> - **Works with Claude, Codex and Cursor** as agent skills, plus a CLI that does the bookkeeping.
>
> ## Why braid
> | The problem | What braid does |
> | --- | --- |
> | Agents lose context between sessions. | Plan, decisions and progress are files in Git (briefs, per-thread logs, reports); a fresh agent reads them instead of guessing. |
> | Agent code goes in unreviewed. | One writer per branch, then an independent reviewer on a different model; the user merges. |
> | You don't know what needs you. | The board puts what waits on you in its own lane, with the reason on each card. |
> | The work is stuck in one chat. | Items, not conversations, are the unit; any thread can pick one up from its files. |
>
> ## A walk-through
> 1. **You state a goal.** *(thread mock-up, illustrative)*
> 2. **braid plans** a braid with strands A, B, C and asks about anything risky; you say go.
> 3. **A worker builds strand A** on its own branch, runs the gate and opens a PR with CI green.
> 4. **A reviewer checks** it against the brief.
> 5. **You get a recap** and merge, or ask for changes; the board shows the PR (*item page screenshot*).
> 6. **Repeat for B and C**; the last PR into `main` is yours. *(flow diagram, illustrative)*

## Images (in `docs/images/`)

| File | What | Real or mock |
| --- | --- | --- |
| `board.png` | hero: desktop board, `braid board --demo`, 1440 px at 2x | real |
| `item-page.png` | strand page with its Needs You request | real |
| `board-phone.png` | phone layout, Needs You tab | real |
| `inbox.png` | the inbox page | real |
| `coordinator-thread.png` | a thread with a plan and a recap | illustrative mock-up |
| `flow.png` | goal to merge diagram | illustrative mock-up |

Mock-up sources: `docs/design/readme/flow.html` and `coordinator-thread.html`. `shot.mjs` there is the small screenshot helper I used; I'd keep it as a note only (the brief rules out a regenerating script).

## Open points for the user

- The board has no dark theme, so its screenshots are light only; in dark mode the README switches only the logo. Fine, or add dark mock-ups?
- Hero: the board screenshot, or the flow diagram first and the board second?
- Claims come from `docs/board.md` (phone: D59, Tailscale: D60), `docs/decisions.md` and the skills; the final report will list each.

For later items: none yet.
Needs the user: scope: the README shape (outline, text, images) is the user's choice; verdict needed.
