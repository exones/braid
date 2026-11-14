What changed: new docs/braid-cli.md answers the five questions. (1) What the CLI must do: the Backlog.md subset braid calls, plus the steps the skills do by hand (next item, resume status, start, checks by ci names, auto-mode merge checks, stop-case facts, recaps); order: read-only board with nested goals and derived states, then compatible write commands, coordinator commands, board actions, T3 automation and growth. (2) Architecture: format, config, ids, git, store, model, cli, sources, derive, actions, server, web on Node 26/ESM with two or three dependencies; Backlog.md code and 18 test files (5,578 lines) as the specification; a round-trip suite against backlog.exe-written files; runtime state in an untracked runs module for checkpoints and several agents; multi-line fields also from a file or stdin because npm shims on Windows cut them. (3) Estimate: compatible tracker 5.1k-7.1k product lines, with board 7.5k-11.1k, tests one to two times that; six goals (five tier L, one M), each with phases; riskiest: byte-exact round-trip, IDs across branches, outside sources, concurrent writers; fork ~36k-52k plus the Bun port, wrap 3k-5.5k but never drops backlog. (4) UI: React 19.3, Vite 8, Tailwind 4.3, Radix primitives, node:http with SSE on 127.0.0.1 and a session token for actions; drag and drop (pragmatic-drag-and-drop when wanted), router, query cache and editor can wait. (5) Licence: reading needs nothing; ported pieces keep the MIT notice (THIRD_PARTY_NOTICES.md and file headers); wrap nothing unless bundled; fork keeps LICENSE. braid has no licence: others have no right to use it, so pick one (MIT simplest) before publishing.
Why: the user leans to reimplementing and needs the estimate, stack and follow-up goals to plan.
Validation: claims from the v1.55.3 source (wc, grep), npm view on 2026-11-13, gh api repos/exones/braid, the braid skills; review (PR #55) not blocking, five suggestions applied; npm run verify passes.
Open: cross-branch read time on large repos, T3 programmatic interface (TASK-2.2), exact per-command sizes in cli.ts.
For later items: TASK-2.2 supplies the lanes and derived-state rules that goal 1 (read-only board) needs; the doc proposes derived lanes with actions as buttons, not drag.
Needs the user: decision: confirm the reimplement way and the follow-up goal order; decision: pick a licence for braid before publishing.

## TASK-2.3 report: how the braid CLI could be built

# The new braid CLI: design sketch and estimate

> Research report for TASK-2.3, 2026-11-13. Findings and recommendations, not decisions: nothing here is decided until the user says so. The user's decisions: [TASK-2 report](doc-4%20-%20TASK-2-report-research-results-and-the-users-decisions.md).

How a new braid CLI could be built as braid's task tracker, board and, later, the automation of T3
(starting and following agents), with an estimate per way, a UI stack for the board and what the
licences mean. Written for TASK-2.3 (2026-11-13). It builds on [Backlog.md as braid's
reference](doc-1%20-%20TASK-2.1-report-Backlog.md-as-braids-reference.md) (TASK-2.1) and the user's lean of 2026-11-13: reimplement a compatible
Node tracker with Backlog.md as the reference, wrapping its CLI during the transition. Fork and wrap
are estimated only roughly. The board's lanes, derived-state sources and agent starts are TASK-2.2's.

Evidence: the braid skills (`.agents/skills/braid/SKILL.md`, `references/workflow.md`,
`assets/task.md`, `braid-worker`, `braid-reviewer`), [BRAID.md](../../BRAID.md), the
[roadmap](../../docs/roadmap.md#braids-own-board), [decisions](../../docs/decisions.md) D01 and D30, and Backlog.md v1.55.3
cloned into `inspiration/backlog.md` (gitignored) as in [backlog-md.md](doc-1%20-%20TASK-2.1-report-Backlog.md-as-braids-reference.md). Line counts
are `wc -l`; library versions are `npm view <package> version time.modified` on 2026-11-13; braid's
licence state is from `package.json` and `gh api repos/exones/braid`.

## 1. What the CLI must do, and in what order

**Backlog.md features braid uses** (the compatible subset). These are the calls in
`assets/task.md` and `BRAID.md`: `task create` with `--parent --labels --ordinal --dep --milestone
--description --ac`; `task edit` with `-s --plan --append-notes --check-ac --check-dod
--final-summary --dep --add-label --remove-label`; `task view --plain`; `task list --plain --ready -s
-p`; `task archive`; `milestone add` and `archive`; `doctor`. Behind them: the task file format,
IDs and subtask IDs, cross-branch reads (30 days, remote operations on), the three statuses and the
project DoD defaults from `archive/backlog/config.yml`. braid uses no drafts, docs, decisions, wizards, MCP
server, TUI or shell completions.

**What the skills do by hand today that a CLI could do.** Each line below is prose in a skill that
an agent carries out step by step:

| Skill step today | CLI candidate |
| --- | --- |
| Pick the next item: the first ready `To Do` subtask on the epic branch that has no open PR and no pushed `item/` branch (workflow "Starting the next item") | `braid next <goal>` |
| Rebuild state when resuming: remote branches, `gh pr list --state all`, the parent's log, branch copies of running tasks (`git ls-tree` then `git show`), thread liveness (`SKILL.md` "Resuming") | `braid status <goal>` |
| Create the item branch from the epic tip, push it, `git worktree add` it | `braid start <id>` (later also the T3 launch) |
| Read `gh pr checks` limited to the `ci` names in `BRAID.md` | part of `braid status` |
| Auto mode's seven merge conditions, then `gh pr merge --match-head-commit` | `braid merge <id>` (refuses unless they hold) |
| The diff facts for stop cases (`references/stop-cases.md`) | `braid facts <pr>` |
| Recaps and parent log entries assembled from the task and PR | `braid recap <id>` (text the coordinator edits) |
| The Backlog.md path lookup on Windows (BRAID.md) and the warning about shims cutting multi-line options | gone once braid writes the files itself |

**The product on top** (roadmap): goals shown with their subtasks nested; derived states (Running,
In Review, Waiting for you with the stop case, Done) joined from GitHub, T3 and labels instead of
stored; actions (Start, Merge on request, Open thread); then T3 automation, checkpoints, reports,
better resuming, several agents and running a task from the board.

**Order.** The board comes first because it is what the user can't get from Backlog.md, and it can
be built read-only while `backlog` stays the writer, so nothing changes for agents:

1. Read the task files and show the board with goals nested and derived states (read-only).
2. Take over the write commands braid calls, file-compatible, and switch the skills to `braid`.
3. Coordinator commands: `next`, `status`, `facts`, `recap`, `merge`.
4. Board actions: Start, Merge on request, Open thread.
5. T3 automation and the later features.

Steps 3 and 4 share their logic (an action button and a command call the same function), so they
can swap order if the user wants actions on the board before the commands.

## 2. Reimplement: the architecture

One package, `@exones/braid`, Node.js 26, ESM, strict TypeScript built with `tsc`, tests on
`node --test`, as the repository already is. The current `src/` and `.braid/` ledger are dismissed
(already decided); the new code starts beside or in place of them as the first goal decides.

| Module | Does | Reference in Backlog.md (lines) |
| --- | --- | --- |
| `format/` | Parse and serialize a task file: front matter, the `SECTION:…:BEGIN/END` blocks, numbered AC and DoD, title variants; keep unknown content and byte order on round-trip | `src/markdown/` (2,246, of which `structured-sections.ts` 1,522) |
| `config/` | `archive/backlog/config.yml` (statuses, labels, DoD defaults, branch settings) and `BRAID.md` front matter (`gate`, `ci`, `models`, `auto`) | part of `src/file-system/operations.ts` (2,647) |
| `ids/` | Prefixes, padding, `task-2` → `task-2.3`, milestone IDs; taken IDs from local files, every worktree and fetched branches | `prefix-config.ts`, `id-generators.ts`, `task-id.ts` (762) |
| `git/` | `git` through `execFile` with argument arrays: branches, `ls-tree`, `show`, worktrees, fetch | `src/git/operations.ts` (1,362; braid needs a small part) |
| `store/` | Load tasks from the working copy and other branches; the winner rule (`selectTaskRecord`: working copy first, then most progressed); write with a lock | `task-loader.ts`, `cross-branch-tasks.ts`, `task-identity-index.ts` (1,172) |
| `model/` | Task, goal tree (parent and subtasks), dependencies, readiness, next item | `src/types/index.ts` (425), `utils/readiness.ts` (121) |
| `cli/` | Commands with `--plain` output matching Backlog.md's, and `--json` | `cli.ts` (6,184, mostly commands braid doesn't use), `formatters/task-plain-text.ts` (239), `json-output.ts` (305) |
| `sources/` | GitHub (PRs by head branch, checks, reviews via `gh … --json`), later T3 threads; cached per refresh | none |
| `derive/` | Pure function: task + sources → derived state and stop case; one table of rules, unit-tested | none |
| `actions/` | Start, Merge on request, Open thread; each checks its preconditions and is called by the CLI and the server alike | none |
| `server/` | `node:http` on 127.0.0.1: static board files, a small JSON API, Server-Sent Events on file and source changes (`fs.watch` recursive) | `src/server/index.ts` (2,124, `Bun.serve` and a WebSocket) |
| `web/` | The board (section 4) | `src/web/` (15,800) |

**What Backlog.md's code teaches.** Keep its file format exactly, including the marker lines and the
preserved unknown content (`serializer.ts`); copy its winner rule rather than "newest wins"
(TASK-2.1's correction); scan worktrees and fetched branches for taken IDs and still expect
duplicates, so `doctor` must find and repair them (`duplicate-task-repair.ts`, 715 lines); write
under a file lock (it uses `proper-lockfile`) because the board and agents may write together.

**What its tests teach.** The test file names are a ready list of cases: `acceptance-criteria*`,
`checklist`, `definition-of-done*`, `cli-final-summary`, `append-implementation-notes`,
`cli-dependency*`, `cli-incrementing-ids`, `cli-zero-padded-ids`, `branch-task-loader-resilience`,
`cli-plain-output`, `cli-json-output`, `markdown`, `structured-sections-code-fences` and
`core-task-corpus-regressions`. Those 18 files are 5,578 lines of `bun:test`; they are read as a
specification, not ported. braid adds a round-trip suite over every task file in its own `backlog/`
and over files written by `backlog.exe` 1.55.3 in a temporary repository: read, write unchanged,
compare bytes.

**What is new.** `sources/`, `derive/` and `actions/` have no counterpart: Backlog.md's status is a
stored field checked against config. In braid the stored status stays for compatibility (To Do,
In Progress, Done), and the board's lanes come from `derive/`.

**Node 26 instead of Bun.** Built-ins cover what Backlog.md takes from Bun or packages:
`node:fs/promises` and `fs.glob` for `Bun.file`/`Bun.Glob`, `execFile` for `Bun.spawn`, `node:http`
plus Server-Sent Events for `Bun.serve` and its WebSocket, `util.parseArgs` or `commander` 15 for the
command line, `yaml` 2.9 for front matter (gray-matter's last release is 2023). Product dependencies
stay at two or three.

**Room for later features.** Keep the file format and `store/` free of braid-only fields, so the
files stay readable by Backlog.md while both are used. Runtime state that is not task content
(running agents, checkpoints, event history) goes in an untracked folder per repository, never in
task files, through one `runs/` module, so checkpoints, better resuming and several agents add
records there instead of changing the format. Reports are Markdown files linked from a task's notes.
Agents are reached through a `sources/t3` adapter, so another host can be added beside it.

**One Windows trap carries over.** braid installed from npm also runs through `.cmd` and `.ps1`
shims, the same ones that cut Backlog.md's multi-line `--description` (backlog-md.md, "Windows
launch"). Every multi-line field therefore also accepts a file or standard input
(`--description-file`, `-`), and the Windows CI job tests a multi-line call through the shim.

## 3. Estimates

**Reimplement**, in product lines. Tests come on top, one to two times as many lines; this
repository today has about 2,100 product lines (`src/`) and 4,300 test lines (`test/`), about two to one.

| Part | Lines | Reason for the size |
| --- | ---: | --- |
| `format/` with round-trip | 1,200–1,600 | Most of `src/markdown/` minus comments and fields braid doesn't write |
| `config/`, `ids/`, `git/` | 1,100–1,500 | `ids/` 600–760 (upstream's 762 lines are mostly rules braid needs: prefixes, padding, subtasks, taken IDs across worktrees and branches), `config/` 250–350, a narrow slice of git operations 250–400 |
| `store/` with cross-branch reads and lock | 900–1,200 | The 1,172 reference lines plus a lock |
| `model/` and readiness, `next` | 400–600 | Types, goal tree, ordering |
| `cli/` for the commands braid calls, `--plain`, `--json`, `doctor` | 1,500–2,200 | About 15 commands with options and output parity |
| **Compatible tracker subtotal** | **5,100–7,100** | Confirms TASK-2.1's 5k–8k bound, in its lower half |
| `sources/` GitHub, `derive/` | 600–1,000 | `gh` calls, cache, the state table |
| `server/` | 300–500 | Built-in HTTP, SSE, static files |
| `web/` minimal board | 1,500–2,500 | Lanes, nested goals, card, task panel, filters |
| **First full product (tracker and board)** | **7,500–11,100** | |
| Coordinator commands, actions | 1,000–1,800 | Later goals 3 and 4 |
| T3 automation, `runs/` records, checkpoints, resuming | 1,000–2,000 | Goal 5; depends on T3's API, the most uncertain |
| Reports, several agents, running a task from the board | 1,000–2,000 | Goal 6; rough, planned after goal 5 |

In goals (tiers as in [the workflow](../../.agents/skills/braid/references/workflow.md)): six
goals, five of them tier L and one tier M, listed under "Follow-up goals" below.

**Riskiest parts**, in order:

1. **Byte-exact round-trip** with files Backlog.md wrote, while both tools write the same repository.
   Any drift shows up as noisy diffs and merge conflicts in task files.
2. **ID allocation across branches and clones**; duplicates will still happen and `doctor` must
   repair them, as in Backlog.md.
3. **Derived states from outside sources**: `gh` rate limits and latency, and T3's interface, which
   braid doesn't control. Mitigated by a cache and by `derive/` being a pure, tested function.
4. **Concurrent writers**: the board, agents and `backlog` itself during the transition; a lock and
   re-reading before each write.
5. **Cross-branch read performance** on larger repositories (not measured in TASK-2.1).
6. **Windows argument passing** through npm shims (above).

**Fork, roughly.** About 36k product lines to own without the TUI, MCP server and web UI, 52k with
the web UI, plus porting 119 product Bun calls, the web server and the build, and either adopting
Bun or moving 88k test lines off `bun:test` (backlog-md.md). Then the derived-state rework in a
stored-status model and merges from an upstream that ships several releases a month. Three to five
tier L goals before the first derived-state board, and lasting upkeep.

**Wrap, roughly.** A client over `backlog … --json` (500–1,000 lines), plus the same `sources/`,
`derive/`, `server/` and `web/` as above: 3,000–5,500 lines and one or two goals for a board. It
never removes the dependency on `backlog`, its Bun binary and its Windows path lookup, and every
board refresh spawns a process that scans branches. That is why it is the transition, not the end.

## 4. UI stack for a minimal board with several lanes

**Choose now:**

- **React 19.3 with Vite 8 and TypeScript.** React has the largest component ecosystem, the
  reference board is React (`src/web/components/Board.tsx`, `TaskColumn.tsx`) and is readable as a
  model, and agents write React well. Vite builds the board into static files at `npm run build`; the
  CLI ships them in `dist/web/`, so users need no build step. Preact 11, Svelte 5 and Solid 1.9 are
  smaller but gain little for a local tool.
- **Tailwind CSS 4.3** for styling (no config file in v4; Backlog.md uses it too).
- **Radix primitives (`radix-ui` 1.8)** for the few interactive parts: dialog for the task panel,
  dropdown for actions, tooltip. Unstyled and accessible; the components are styled with Tailwind
  in braid's own files. Base UI 1.9 is an equal alternative; pick one and don't mix.
- **Serving:** `braid board` starts `node:http` on 127.0.0.1 with a free port, serves `dist/web/`,
  a JSON API (`/api/board`, `/api/tasks/:id`, later `POST /api/actions/...`) and an SSE stream that
  says "changed" when task files or sources change; the page refetches. Actions require a
  per-session token in the URL the CLI prints, so another local page can't trigger them. No server
  framework; Hono 4 is the step up if routes grow past a dozen.
- **Data loading:** plain `fetch` and `EventSource` in a small hook.

**Can wait:**

- **Drag and drop.** The lanes are derived states, so dragging a card from To Do to Running would
  mean "start an agent", not an edit; buttons are clearer at first. When it is wanted, use
  Atlassian's `@atlaskit/pragmatic-drag-and-drop` 4.0 (maintained, framework-agnostic). `@dnd-kit`
  is split between `@dnd-kit/core` 6.3.1 (no release since 2024-12) and `@dnd-kit/react` 0.5.3
  (pre-1.0). Backlog.md uses native HTML5 drag events, which also suffice for column moves.
- A router (one page with a panel needs none), TanStack Query 5 (when there are many sources), a
  Markdown editor (tasks are edited through the CLI), dark mode and theming, keyboard navigation
  beyond what Radix gives.

## 5. Licence

Backlog.md is MIT: "Copyright (c) 2025 Backlog.md" (`LICENSE` at v1.55.3). MIT allows any use,
copying, changing, sublicensing and selling, on one condition: the copyright notice and permission
notice are included in all copies or substantial portions of the software. It gives no warranty.
This is a reading of the licence text, not legal advice.

| Way | What MIT requires of braid |
| --- | --- |
| **Read as a reference** (the recommended way) | Nothing. Learning how it works and writing braid's own code is not copying. The Backlog.md checkout stays in gitignored `inspiration/` and is never committed. |
| **Port or copy pieces** (for example the section parser) | A translated or copied substantial part keeps the notice: add `THIRD_PARTY_NOTICES.md` with Backlog.md's licence text and the list of ported files, and a header comment in each ported file naming its source. Shipping the notice in the npm package is enough; braid's own licence can still be any licence. |
| **Wrap** | Nothing while `backlog.md` is installed separately or as an npm dependency (its package carries its licence). If braid bundles its binary, ship the notice with it. |
| **Fork** | Keep Backlog.md's `LICENSE` and copyright in the fork; braid's changes may add their own notice and licence. |

**braid has no licence.** `package.json` has no `license` field, the repository has no `LICENSE`
file, and `gh api repos/exones/braid` reports `license: null` on a public repository. So:

- Using MIT code in braid is allowed regardless; MIT is compatible with any licence, including none.
- Nobody else has the right to use, copy, change or distribute braid's code; GitHub's terms only
  allow viewing and forking on GitHub. Publishing `@exones/braid` to npm (`private: false`) without
  a licence offers a package others can install but have no licence to use.
- Before publishing, or before accepting outside contributions, the user should pick a licence. MIT
  is the simplest and matches the reference. This is the user's decision; it doesn't block building.

## Follow-up goals, in order

Each is a goal with phases (one subtask per phase), sized for long unattended runs.

1. **braid board, read-only (tier L).** Depends on TASK-2.2's lanes and derived states. Phases:
   (a) `format/`, `config/`, `store/` reading the working copy and other branches, with the
   round-trip suite over this repository's `backlog/`; (b) the GitHub source and `derive/` with the
   state table; (c) `server/` and the minimal React board with goals nested; (d) `braid board`
   packaged in `dist/`, tested on Windows and Ubuntu. `backlog` stays the writer.
2. **Compatible task commands (tier L).** Phases: (a) `task view`, `list` with `--plain` and `--json`
   parity; (b) `task create`, `edit`, `archive` with IDs across branches and the lock; (c)
   milestones and `doctor`; (d) switch the braid skills from `backlog` to `braid` (skill change, the
   user merges) and retire the Backlog.md path lookup.
3. **Coordinator commands (tier M).** Phases: (a) `braid next` and `braid status`; (b) `braid facts`
   and `braid recap`; (c) `braid merge` with auto mode's conditions; then shorten the skills to call
   them (user merges).
4. **Board actions (tier L).** Phases: (a) Open thread and Merge on request; (b) Start: branch,
   worktree and T3 launch, with the session token; (c) states from T3 (Running, Waiting for you).
5. **Following agents and resuming (tier L).** Phases: (a) the `runs/` records (which agent works
   on which task, in which thread and worktree) and following T3 threads into derived states;
   (b) checkpoints: an agent's progress recorded in `runs/` at clean points; (c) better resuming:
   `braid status` and the coordinator rebuild state from `runs/`, Git and GitHub, and relaunch a
   stopped agent from its last checkpoint.
6. **Reports and several agents (tier L, planned in detail when 5 is done).** Phases: (a) reports:
   a task's report as a Markdown file linked from its notes, shown in the board's task panel;
   (b) several agents at once: independent items in parallel within a limit, with `next` returning
   every ready item and the board showing each run; (c) running a task from the board: Start
   followed through review and CI to a recap waiting for the user's merge, without a coordinator
   chat.

Goals 1 and 2 can swap if the user wants agents off `backlog` before the board.

## What would change the way

- **Toward fork:** the user wants most of Backlog.md's web UI (editing, docs, decisions, statistics)
  or braid moves to Bun.
- **Toward staying a wrapper:** after goal 1 the board turns out to be all braid needs and `backlog`
  stays the writing interface; or upstream adds a hook for external status or custom columns.
- **Re-estimate:** the round-trip suite of goal 1 phase (a) finds format cases that push `format/`
  well past 2,000 lines, or Backlog.md changes the file format in a later release.
- **Stack:** if the board must work without a local server (for example as a T3 panel), revisit how
  it is served; React and the component choices hold.

## Not checked in the time box

- Cross-branch read time on a large repository; the estimate assumes Backlog.md's per-process cache
  is enough.
- T3's interface for launching and following threads from a program (TASK-2.2).
- Exact line counts of the commands inside `cli.ts`; the CLI estimate is from the command list and
  the formatter sizes.
