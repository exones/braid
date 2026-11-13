---
id: doc-5
title: 'New braid: implementation plan (draft)'
type: other
created_date: '2026-11-13T16:42:00Z'
---

# New braid: implementation plan (draft)

> Draft for iterative planning with the user, section by section. Nothing here is a task yet; stories become Backlog.md tasks only after the user approves them. Built on [TASK-2's decisions](doc-4%20-%20TASK-2-report-research-results-and-the-users-decisions.md).

Status: round 4: stories 1 and 2 merged; story 3 (board) in strands, with open questions; story 4 an outline. Next rounds: one story at a time, broken into phases.

## Ground rules (the user's, 2026-11-13)

- Rewrite: a new Node.js braid, sized to braid's own needs; not a fork or a wrap of Backlog.md.
- Agile: every story ends with something working that the next one extends.
- One folder per task, holding its brief, phases, report, checkpoints and the rest; no Backlog.md-style subtask files.
- The braid skills mostly survive: their `backlog` calls are replaced by direct edits of the braid files or by `braid` commands where those have logic (see "Agents may edit braid files directly"). No new skill instructions unless needed.
- UI: simple but functional, no drag and drop. Lanes To Do · In Progress · In Review · Waiting · Done; a goal is one card that expands; the first board reads T3.
- Not needed: an MCP server, JSON output.
- MIT licence.

## Decided so far (round 2, 2026-11-13)

- **Root folder:** `braids/`, one folder per item: `0001-<slug>`.
- **Subtasks:** a folder per subtask inside its item: `A-<slug>`, `B-<slug>`. Letters never change; run order is in the front matter.
- **Files in every item and subtask folder:** `brief.md` (front matter, the brief, decisions, implementation details), `report.md` (the report), one log file per thread, and `temp/` (ignored by git).
- **Logs:** `log-<creation date>-<short thread id>.md`, written with `braid log`; a log shows which threads worked on a folder and serves as the checkpoint for resuming.
- **Short thread IDs:** the first 8 letters or digits of the T3 thread id after its last `:` (`mcp:launch:5d80964a…` gives `5d80964a`; `user` when there is no thread).
- **Names:** a top-level item is a **braid**; the CLI stays `braid` (commands like `braid new`, `braid list`, so no `braid braid …`). A subtask is a **strand** (a braid is woven from strands).
- **A subtask is one PR on its own branch** (decision 2). A braid has a delivery mode in its front matter, set per braid:
  - `epic` (default): an epic branch; each subtask's PR merges into it, and the braid goes into `main` with one final PR.
  - `main`: no epic branch; each subtask's PR goes straight into `main`. Every merge is then the user's (auto mode only merges into epic branches).
  - A braid without subtasks is a single PR into `main`.
- **No Backlog.md compatibility** (decision 3): a one-time import (in story 4) moves TASK-1 to TASK-3 into `braids/` as `0001` to `0003` (subtasks become strands); after that braid never reads Backlog.md's files, and the old `backlog/` stays as read-only history.
- **Logs are committed with the work** (decision 4): `braid log` writes the entry and stages the file (`git add`) but never commits; the next work commit carries it, and the strand's last commit carries the final entries. An entry usually goes with a commit: briefly what the commit did, plus what the commit message doesn't say: anything unusual met, changed decisions, lessons learned.
- **braid uses an installed braid** (decision 5): braid is installed outside the checkout from `main` after each merged story, like the skills today; the coordinator and workers always run that installed build, never the branch they are changing.
- **UI stack** (decision 6): React, Vite, Tailwind and Radix, as the TASK-2.3 report proposed; served locally by braid. No drag and drop.
- **TASK-3, the skills diet** (decision 7): runs after the MVP, not folded into story 4.
- **Outline status:** a braid or strand can be `Outline`: goal, "working at the end", strand titles, and what may affect its decisions (open questions, possible forks). It means: plan it fully when you come to it, asking the user if needed. The board shows it in To Do with an "outline" badge; `braid next` never picks it. Built in story 2; the skills learn it in story 4 ("when a braid merges, reread the next outline, detail it, set it To Do").
- **One project on the board** (decision 8) for now; several later.
- **Publishing to npm** (decision 9): after the MVP, once braid has proven itself here; the npm setup mostly exists already.
- **MVP:** stories 1 to 4; braid then tracks its own braids, shows them on the board, and the skills run on it.

- **Agents may edit braid files directly** (user, 2026-11-13): briefs and reports are plain Markdown, and braid checks them on every read, so agents edit them like any file when that is quicker (planning especially). The CLI stays for what has logic: new numbers and letters (`braid new`, `strand new`), logs (`braid log` stages them), and quick status changes. A `braid check` command (in story 3, strand A) validates every brief, so an agent runs it after editing by hand.

All nine are decided; "Decision details" below keeps the background.

## Stories, in order

Each story is a braid; its strands are one PR each. MVP: stories 1 to 4. Tiers are rough.

| # | Story | Working at the end | Tier |
| --- | --- | --- | --- |
| 1 | **Fresh start.** Remove the old CLI; a new skeleton (Node 26, TypeScript, ESM) with the gate and CI kept; MIT licence. | `braid --version` and `braid help`; CI green. | M |
| 2 | **Braids folder.** The `braids/` format (braids, strands, briefs, reports, per-thread logs, Outline) and the commands to read, create and edit them, `braid log`, `braid report`. | braid can track braids and strands from the command line. | L |
| 3 | **Read-only board.** `braid board`: the five lanes, braid cards that expand to their strands, states derived from status, branches, GitHub PRs and T3 threads. | Open the board and see the real state of running work. | L |
| 4 | **Skills on braid.** Import `backlog/` into `braids/` once (`backlog/` stays as read-only history) and, at the same moment, the skills call `braid` instead of `backlog`, with the fewest wording changes; the Outline step joins the flow. | This repo's work lives in `braids/` and a braid runs end to end on braid; Backlog.md is no longer needed. **End of the MVP.** | L |
| – | **TASK-3, skills diet** (decision 7). | Shorter skills, one place per rule. | L |
| 5 | **Coordinator commands.** `braid next`, `status`, `facts`, `recap`, `merge` take over steps the skills do by hand. | The coordinator calls one command where it ran several. | L |
| 6 | **Board actions.** Start (a T3 thread on a new worktree), Open thread, Merge on request; local only, with a per-session token. | Start a strand from the board. | L |
| 7 | **Runs, checkpoints, resuming.** Each run recorded with its strand, thread and worktree; checkpoints from the logs; resume a stopped run. | Kill a session mid-strand and resume it. | L |
| 8 | **Reports and several agents.** Reports on the board; independent strands in parallel within a limit; a strand started from the board runs through review and CI to In Review without a coordinator chat. | Two strands run at once and both reach In Review. | L |

Why this order: the format (2) comes before the board (3), because a board that read Backlog.md's files would be thrown away. The import and the skills switch (4) come last and together, so the flow that already works keeps working until braid can do the same, and there is never a moment without a working store.

## How the stories are delivered

- Stories 1 to 4 are run by today's braid skills (coordinator, worker, reviewer) with Backlog.md as the store: each story is a Backlog.md goal with its strands as subtasks, an epic branch, reviews and the user's merges, as for TASK-1 and TASK-2.
- Story 4 switches over in one go (the user's choice, 2026-11-13): it imports `backlog/` into `braids/` and moves the skills to braid at the same moment, so there is never a store the skills can't use.
- From story 5 on, the work runs on the new braid: tracked in `braids/`, with the installed braid (decision 5).

## Round 3: the MVP in strands (draft)

Stories 1 and 2 in detail, stories 3 and 4 as outlines. Tiers follow the workflow: anything that fixes a persistent format is L.

### Story 1: Fresh start (one PR, no strands, tier M) — merged: TASK-4, PR #59

- Remove the old CLI: `src/` (ledger, state, events, status), its tests (`test/cli.test.ts`, `test/ledger*.test.ts`, `test/helpers.ts`), and the docs only it needs (`docs/seed-contract.md`, `docs/cli-name.md`; the roadmap's stages and bootstrap rules). Keep the tooling: the gate (`scripts/Verify.ps1`), CI, the npm release setup, the skills installer and the Pester suites.
- A new skeleton: `src/cli.ts` with a small command router, `braid --version` and `braid help`; a test that runs the built CLI; `README.md` cut to what exists.
- MIT: `LICENSE` and `"license": "MIT"` in `package.json`.
- Working at the end: `npm run verify` green on Windows and Ubuntu; `braid help` lists nothing but help.

### Story 2: Braids folder (epic, tier L) — merged: TASK-5, PR #63

- **A. Read braids** (L): the `braids/` format (decision 1): `brief.md` front matter (id, title, status `Outline | To Do | In Progress | Done`, labels, dependencies, order, delivery mode `epic | main`) and sections; `braid list` and `braid view <0002>` / `<0002/A>`. Working: test fixtures listed and viewed.
- **B. Create and edit** (L): `braid new <title>` (next free number, checking remote branches), `braid strand new <braid> <title>` (next free letter), `braid edit` for status and fields, `braid brief` to set a section; multi-line text from a file or standard input. Working: a braid with two strands made entirely from the CLI.
- **C. Logs and reports** (M): `braid log <folder> --thread <id> <text>` (per-thread file, staged with `git add`), `braid report <folder>` to write or append `report.md`. Working: one strand's whole life recorded through braid.
- Open in this story: the log entry format and how a checkpoint is marked (decision 1); whether reading strands from their item branches belongs here or in story 4 (see story 3).

### Story 3: Read-only board (epic, tier L) — round 4, draft

Working at the end: `braid board` opens a local page with the five lanes; braid cards expand to their strands; a running strand shows In Progress from its branch, an open PR shows In Review, a strand with a question for the user shows Waiting.

- **A. Board skeleton** (M, `ui`): `braid check` (validate every brief and report the errors; exit 2 on any) for agents that edit files directly; `docs/braids-format.md` and the README say briefs and reports may be edited directly, then `braid check` (today they say "not by hand"); `braid board` serves a React, Vite, Tailwind and Radix page on 127.0.0.1 and opens the browser; lanes To Do · In Progress · In Review · Waiting · Done from the stored status only (In Review and Waiting stay empty); braid cards with a progress count that expand to their strands; an Outline badge; a card opens the brief and report. Working: the playground's braids on a board.
- **B. Live copies from branches** (L): a strand being worked on lives on its own branch; the board reads its brief from there (`git ls-tree` / `git show`), so its status shows without a merge. Fixes the branch names for braids and strands (see open questions). Working: a strand set In Progress on its branch shows In Progress on the board run from `main`.
- **C. GitHub states** (M): open PR from a strand's branch → In Review; merged → Done; failing checks with no agent working → Waiting ("checks failed"); one `gh` call per refresh, merged PRs cached. Working: opening and merging a PR in the playground moves the card.
- **D. T3 threads** (M): `t3 thread list` / `show` joined to strands (by linked PR, then worktree path); Running vs stopped; a pending question → Waiting ("question"); an interrupted thread with no PR → Waiting ("agent stopped"); a clear note when T3 isn't running. Live refresh to the page. Working: a running worker and a waiting question show on the board.

Decided by the user (2026-11-13):
1. **Branch names:** `braid/0006-<slug>` for a braid (its epic branch when it has strands, its only branch when it has none) and `braid/0006/A-<slug>` for a strand.
2. **Waiting reasons in the first board:** a question pending in T3, an agent stopped with no PR, checks failing with no agent working, and an `ask:<key>` label on the strand. "Fixes still failing after two review rounds" comes with story 5.
3. **Refresh:** every 30 seconds while the page is open, at once when a file under `braids/` changes, and a Refresh button.
4. **Trying it before story 4:** the playground repository and test fixtures.

### Story 4: Skills on braid, with the import (outline, tier L)

- Strands, roughly: import TASK-1 to TASK-3 with their subtasks and reports into `0001` to `0003`, leaving `backlog/` as read-only history; the task template and the skills' `backlog` calls become direct edits of `brief.md` and `report.md` (followed by `braid check`) or `braid` commands where they have logic (new, strand new, log), with the fewest wording changes; the skills drop "never edit task files by hand" and the Windows `backlog.exe` lookup, which makes them shorter; `BRAID.md` and its template drop the Backlog.md invocation rules; the installer also installs braid (decision 5); the Outline step joins the coordinator's flow. The worker skill learns the report rule (user, 2026-11-13): after a fix round the worker rewrites `report.md` to describe the final state (`braid report`, replace), and the history of the round goes into its log; `--append` is for short notes after the fact.
- What may affect decisions: how Backlog.md's notes map (one `log-<date>-import.md`, or into the report); where the TASK-2 reports land; whether `backlog/` stays where it is or moves under an archive folder; whether other projects that use the braid skills keep Backlog.md support for a while, or move to braid at the same time; how a project without braid installed is told what to do.

## Decision details

The background of each decision above, as first proposed; where they differ, "Decided so far" wins.

1. **Task folder layout** — decided by the user (2026-11-13):

   ```
   braids/
   ├── 0001-fresh-start/              # an item with no subtasks
   │   ├── brief.md                   # front matter (id, title, status, labels, dependencies, order), the brief, decisions, implementation details
   │   ├── report.md                  # the report: what was done, validation, what is open
   │   ├── log-2026-11-13-2831f09b.md # one log per thread: creation date + short T3 thread id; also the checkpoints
   │   └── temp/                      # ignored by git
   └── 0002-task-folders/             # an item with subtasks
       ├── brief.md                   # the item: goal, decisions
       ├── report.md                  # the item's final report
       ├── log-<date>-<thread>.md     # the coordinator's entries after each subtask merges
       ├── A-format/
       │   ├── brief.md
       │   ├── report.md
       │   └── log-<date>-<thread>.md # each worker or fixer thread's progress and checkpoints
       ├── B-commands/
       └── temp/
   ```

   - Root folder `braids/`; items numbered `0001-<slug>`; subtasks `A-<slug>`, `B-<slug>` inside their item.
   - Letters are names, not order: they never change once given, and the run order is in the brief's front matter. A new subtask gets the next free letter.
   - Status lives in each brief's front matter; a worker sets its own subtask's status on its branch, as today.
   - Only the coordinator creates items and checks remote branches for taken numbers first.
   - One log file per thread: `log-<creation date>-<short thread id>.md` (the first 8 letters or digits after the thread id's last `:`; `user` when no thread). `braid log <folder> --thread <id> <text>` appends a dated entry to that thread's file, creating it on first use. On resume, the files show which threads worked on the folder before, and whether the current thread already has a log. One writer per file, so branches don't collide. Still to settle in story 2: the entry format, and how a checkpoint entry is marked.
   - TASK-1 to TASK-3 become `0001` to `0003` at the import (story 4); new work starts at `0004`.
2. **What a phase is.** Recommendation: a phase is one PR on its own branch, like today's subtask, but lives inside its task's folder; a task with phases has an epic branch as today. A story is a task with no phases.
3. **Backlog.md compatibility.** Recommendation: none. A one-time import (story 4) and `backlog/` kept read-only. The alternative, reading both formats for a while, costs code for little gain.
4. **Checkpoints and run records: committed or not.** Committed in the task folder, they travel with the branch and survive a lost machine but add commits; untracked (`runs/`), they stay local and quiet. Recommendation: the checkpoint summary committed, raw run records untracked.
5. **How braid uses braid while being built.** The coordinator must not run the checkout it is changing. Recommendation: install a released build (npm or a local pack) outside the checkout, upgraded only after a story merges.
6. **UI stack.** The research proposed React, Vite, Tailwind, Radix. Lighter options exist (Preact, plain HTML with htmx). Recommendation: decide at story 4.
7. **TASK-3 (skills diet).** Story 4 rewrites the skills' commands anyway. Recommendation: fold TASK-3 into story 4, or run it first if the skills' length bothers you now.
8. **One project or several on the board.** Recommendation: one repository first; several later.
9. **Publishing to npm.** Not needed for using braid here; recommendation: decide after story 4.

## Next round

The user reviews round 3. Once approved, stories 1 and 2 become Backlog.md tasks (still the store until story 4), and stories 3 and 4 stay outlines here.
