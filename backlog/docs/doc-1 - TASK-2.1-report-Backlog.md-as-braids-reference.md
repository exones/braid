---
id: doc-1
title: 'TASK-2.1 report: Backlog.md as braid''s reference'
type: other
created_date: '2026-11-13T15:19:00Z'
---

# Backlog.md as braid's reference

> Research report for TASK-2.1, 2026-11-13. Findings and recommendations, not decisions: nothing here is decided until the user says so. The user's decisions: [TASK-2 report](doc-4%20-%20TASK-2-report-research-results-and-the-users-decisions.md).

A map of how [Backlog.md](https://github.com/MrLesk/Backlog.md) 1.55.3 is built, what braid uses from
it, and a recommendation on how braid gets its own tracker: fork it, wrap it, or reimplement a
compatible tracker with its code as the reference. Written for TASK-2.1 (2026-11-13); it feeds the
user's choice, TASK-2.3 (the CLI estimate) and TASK-2.2 (the board path).

Source paths below (`src/...`) are relative to a checkout of the tag:
`git clone --branch v1.55.3 --depth 1 https://github.com/MrLesk/Backlog.md inspiration/backlog.md`
(`inspiration/` is gitignored). Line counts are `wc -l` over `*.ts`/`*.tsx` files, tests excluded
unless stated.

## Size by part

66,604 lines of product TypeScript in 1.55.3, plus 88,487 lines of tests (283 `*.test.ts` files,
almost all under `src/test/`) and 2,480 lines of build and launcher scripts. The earlier "about 68k,
16k web UI" holds once the web UI's CSS and HTML (375 lines) and the Markdown guides are counted.

| Part | Where | Lines | What it does |
| --- | --- | ---: | --- |
| Task file format and parsing | `src/markdown/` | 2,246 | Front matter (gray-matter), the `<!-- SECTION:…:BEGIN/END -->` blocks, numbered AC and DoD checklists, comments (`structured-sections.ts` alone is 1,522) |
| Core model | `src/core/` | 11,139 | `backlog.ts` (5,268: create, edit, archive, statuses, IDs, drafts, docs, decisions), `content-store.ts` (2,144: the in-memory index and watchers), task loading, duplicate-ID repair, milestones, search |
| IDs and subtasks | `src/utils/prefix-config.ts`, `id-generators.ts`, `task-id.ts`, part of `core/backlog.ts` | ~760 + part | Prefixes, `task-5` → `task-5.3`, zero padding, scanning branches and worktrees for taken IDs |
| Cross-branch reads | `src/core/task-loader.ts`, `cross-branch-tasks.ts`, `task-identity-index.ts` | 1,172 | Reads task files from other local and remote branches with `git ls-tree`/`git show` and picks a winner per ID |
| Git | `src/git/operations.ts` | 1,362 | `git` subprocesses: fetch, branch lists, trees, blobs, worktrees, commits |
| File system and config | `src/file-system/operations.ts` | 2,647 | Folder layout, `config.yml` read and write (a hand-written YAML key extractor), file locks (proper-lockfile) |
| Utilities | `src/utils/` | 5,635 | Sorting, search (fuse.js), dependency graph, readiness, watchers, task builders, dates |
| Types and constants | `src/types/`, `src/constants/` | 716 | The `Task` type (`types/index.ts`, 425) and defaults |
| CLI | `src/cli.ts`, `src/commands/`, `src/completions/`, `src/formatters/`, guides | 10,628 | Commander; `cli.ts` alone is 6,184 lines; `--plain` and versioned `--json` output; interactive wizards; shell completions |
| MCP server | `src/mcp/` | 4,463 | 24 tools (`task_*`, `milestone_*`, `document_*`, DoD defaults, instructions) over the MCP SDK |
| Terminal board and viewer | `src/ui/`, `src/board.ts` | 9,844 | `backlog board` and the interactive views (neo-neo-bblessed) |
| Web server | `src/server/index.ts` | 2,124 | `backlog browser`: `Bun.serve` with 31 `/api/...` routes, a WebSocket that pushes changes, and the HTML bundle |
| Web UI | `src/web/` | 15,800 | React 19, React Router, Tailwind 4, an MD editor and Mermaid: board, task modal, milestones, docs, decisions, settings, statistics |
| Tests | `src/test/` and `*.test.ts` | 88,487 | `bun test`; unit, CLI end-to-end against temp Git repos, MCP, web components (jsdom), TUI |

So the part braid would need to match the file format (parsing, IDs, cross-branch reads, Git, the
relevant config and the CLI commands braid calls) is a minority of the code; the TUI, web UI and MCP
server together are about 30,000 lines, and docs, decisions, drafts, wizards and statistics are more.

## What braid uses today, and how Backlog.md does it

braid calls the CLI only ([BRAID.md](../../BRAID.md), [the task guide](../../.agents/skills/braid/assets/task.md)):
`task create` (`--parent`, `--labels`, `--ordinal`, `--dep`, `--milestone`, `--description`, `--ac`),
`task edit` (`-s`, `--plan`, `--append-notes`, `--check-ac`, `--check-dod`, `--final-summary`,
`--dep`), `task view --plain`, `task list --plain --ready -s -p`, `task archive`, `milestone add` and
`archive`, `doctor`; and `backlog browser` for the user to look. Config: three statuses, the label
list, project DoD defaults, `check_active_branches` with 30 days, `remote_operations` on,
`auto_commit` off ([`backlog/config.yml`](../../backlog/config.yml)).

- **Task file.** One Markdown file per task in `backlog/tasks/`, named `<id> - <title-slug>.md`.
  YAML front matter holds `id`, `title`, `status`, `labels`, `milestone`, `dependencies`,
  `parent_task_id`, `ordinal`, dates. The body is fixed sections with HTML-comment markers
  (`SECTION:DESCRIPTION`, `AC`, `DOD`, `SECTION:PLAN`, `SECTION:NOTES`, `SECTION:FINAL_SUMMARY`), and
  AC/DoD lines are `- [ ] #1 text`. `src/markdown/section-titles.ts` also accepts older title
  variants; `structured-sections.ts` rejects input that contains marker lines. Writes go through
  `serializeTask` (`src/markdown/serializer.ts`), which preserves unknown content of the original file.
- **IDs and subtasks.** `Core.generateNextId` (`src/core/backlog.ts` line 1943) collects every task
  ID it can see, then `generateNextPrefixedId` or, with a parent, `generateNextSubtaskId`
  (`src/utils/prefix-config.ts`). "Every ID it can see" is local files, file names in every Git
  worktree of the repository (`loadTaskFileNameEntries`), and, with `remote_operations`, files on all
  branches after a `git fetch`. A subtask is a normal task whose ID is `<parent>.<n>` and whose front
  matter has `parent_task_id`; there is no deeper nesting and no "goal" type.
- **Cross-branch reads.** `BranchTaskLoader` (`src/core/task-loader.ts`) lists branches touched in
  the last `active_branch_days`, reads their `backlog/` trees with `git ls-tree`, and hydrates only
  other-branch copies that may be newer than the local one (`chooseWinners`, by `updated_date`).
  That only decides what to read. The copy shown is chosen by `selectTaskRecord`
  (`src/core/task-identity-index.ts`, around line 135): the working copy always wins; among other
  copies, `most_progressed` prefers the later status, then the newest change. Trees and blobs are
  cached per commit for one process.
- **Statuses.** Stored in the file and checked against `config.statuses`
  (`src/core/backlog.ts` line 1139, "Invalid status"). Board columns are those statuses.
- **Readiness.** `--ready` means "every dependency is Done" (`src/utils/readiness.ts`), nothing more,
  which is why braid always adds `-s 'To Do'` and `-p`.
- **Board.** Two boards on the same core: the TUI (`src/ui/board.ts`) and the web board
  (`src/web/components/Board.tsx` and friends) served by `src/server/index.ts`, which watches the
  folder and pushes updates over a WebSocket. Both group by stored status and filter by milestone,
  label and text.
- **Machine output.** `--plain` text and a versioned `--json` (`src/formatters/json-output.ts`) for
  list, view and search; the MCP server exposes the same operations as tools.

## What braid adds, against this code

From the [roadmap](../../docs/roadmap.md#braids-own-board):

- **Goals with subtasks nested.** The data is there (`parent_task_id`, `TASK-2.1` IDs), but both
  boards show a flat column per status. Grouping by parent is a view change; in Backlog.md that means
  the TUI and the React board both.
- **Derived states** (Running, In Review, Waiting for you with the stop case, Done) from GitHub, T3
  and labels, not stored. This goes against Backlog.md's model, where status is a stored field
  checked against config, columns are config statuses, and the working copy's stored status wins
  over other branches. A derived state needs a second source joined at read time (PRs by head branch,
  T3 threads by task ID); nothing in the core has a hook for that.
- **Actions** (Start, Merge on request, Open thread). Backlog.md's actions are edits to task files;
  there is no notion of an outside process. In the web UI they would be new API routes and buttons;
  in braid's own board they are calls to `gh` and T3.

## Hard parts and known bugs

What a reimplementation must get right, and what braid has already hit:

- **ID allocation across branches and worktrees.** Backlog.md scans worktrees and fetched branches;
  it still can't see unpushed branches in other clones, so two planners can take the same ID.
  `duplicate-task-repair.ts` (715 lines) and `backlog doctor` exist for that. Milestone IDs count only
  the current branch, which is why [the task guide](../../.agents/skills/braid/assets/task.md) has a
  `git grep` check after `milestone add`.
- **The section format.** Markers, title variants, numbered checklists and preserved unknown content
  make `structured-sections.ts` the largest single parsing file; a compatible writer must round-trip
  files Backlog.md wrote, byte for byte where it doesn't change them.
- **Cross-branch "which copy wins".** The working copy first, whatever its date; other branches
  (active within 30 days) count only for tasks the working copy lacks. So a board run from `main`
  shows `main`'s status, not the newest (epic 008 report A). A compatible reader should copy that
  rule from `selectTaskRecord`; braid's derived states are meant to replace it on the board.
- **Merge conflicts in task files.** Two branches editing one task conflict like any file; braid's
  rule is to resolve by hand, then run `backlog doctor`.
- **Windows launch.** The npm `.cmd` and `.ps1` shims cut a multi-line `--description` at the first
  newline and drop later options (epic 008 report A); braid calls the native `backlog.exe`.
- **Smaller ones braid works around:** `--dep` on edit replaces the list and accepts only IDs on the
  current branch; an archived milestone drops its tasks into "No milestone"; statuses outside config
  fail (`-s "In Review"`); the browser left running in a worker's worktree saved an edit there and
  locked the folder (epic 008 trial, finding 5).

## Runtime and build

Backlog.md is a Bun program. Product code calls Bun APIs 119 times in 23 files: `Bun.file` (67),
`Bun.Glob` (18), `Bun.write` (16), `Bun.spawn` (10), `Bun.serve` with an HTML bundle and WebSockets
in the web server, and a few others (`Bun.YAML`, `Bun.which`, `Bun.stringWidth`). The tests lean on
it much more: 324 test files import `bun:test` and make 922 more `Bun.*` calls (counted with
`grep -hoE 'Bun\.[a-zA-Z]+'` over product and test files separately). `scripts/build.ts` runs
`Bun.build` with `compile` into one binary per platform; the npm package `backlog.md` contains only
a Node launcher (`scripts/cli.cjs`) that spawns the binary from `backlog.md-<os>-<arch>`. Tests run
under `bun test`; lint and format are Biome; TypeScript 7.0.2 (the same as braid) for types only.

braid is Node.js 26, ESM, `tsc`-built to `dist/`, tested with `node --test` and Pester. Running
Backlog.md's product code under Node is a modest port (119 calls, mostly file reads and writes),
but the web server's HTML bundle, the single-binary build and 88k lines of tests on `bun:test` all
have to move too. Its dependencies (commander,
gray-matter, fuse.js, proper-lockfile, the MCP SDK, React) all run on Node.

## Upstream health

From `gh api repos/MrLesk/Backlog.md` and its releases and contributors, on 2026-11-13:

- MIT licence, created 2025-06-04, 7,369 stars, 489 forks.
- 206 releases in 17 months; 21 in the last six months (v1.45.0 to v1.55.3, four of them in the week
  of 2026-10-20). v1.55.3 (2026-10-23) is still the latest.
- One maintainer in practice: 62 contributors, MrLesk with 1,407 commits, the next with 5; of the
  last 100 commits (back to 2026-10-11) 92 are his.
- 77 open issues and 21 open PRs.

Fast and steady, but a fork would trail a moving target, and the project's direction is one
person's.

## Fork, wrap or reimplement

**Fork:** copy Backlog.md into braid and change it. **Wrap:** braid's tracker and board call the
`backlog` CLI (`--json`) or its MCP server and keep it as the only writer. **Reimplement:** a Node
tracker that reads and writes the same files, with Backlog.md's code and tests as the reference.

| | Fork | Wrap | Reimplement with reference |
| --- | --- | --- | --- |
| Size to own | 66.6k product + 88.5k test lines, in Bun; dropping the TUI and MCP server still leaves ~52k with the web UI kept, ~36k without it | Small: a client over `--json` plus the board and the derived-state join; Backlog.md stays a dependency | The subset braid uses: format, IDs, subtasks, cross-branch reads, config, a handful of commands, roughly 5k–8k lines plus tests (TASK-2.3 owns the estimate) |
| Upkeep against upstream | High: every upstream release is a merge into code braid has changed, from a single-maintainer repo shipping several releases a month | Pin and bump; each bump re-runs braid's tests. Upstream format or CLI changes still break braid | None by default; braid follows the file format only while it wants compatibility |
| Runtime fit | Poor: Bun-only, compiled binaries; either braid adopts Bun or ports 119 product Bun calls, the web server and build, and 88k test lines off `bun:test` | Separate process per call; on Windows the native binary path lookup stays; startup and cross-branch scans per call | Native: Node 26, ESM, `tsc`, `node --test` |
| Licence | MIT: keep the copyright notice in the fork | MIT; nothing copied | MIT allows copying pieces with the notice; reading as a reference needs nothing |
| What braid drops or rewrites | The React UI, TUI, MCP, docs, decisions, drafts, wizards; status-as-stored-field logic for derived states | Nothing in Backlog.md; braid can't change its board, so the derived-state board is braid's own anyway | Builds only what it needs; no web editor, docs or decisions unless wanted |
| Path to the derived-state board | Rework the stored-status columns in both boards, against upstream | braid's board reads tasks through the CLI and joins GitHub and T3; writes still go through `backlog` | braid's board reads the files directly (or through its own core) and joins GitHub and T3 |

**Recommendation: reimplement a compatible tracker with Backlog.md as the reference, and wrap it
during the transition.**

- First, braid's board reads tasks (directly from the files, using Backlog.md's format, or through
  `backlog task list --json` if that is quicker to prove) and joins GitHub and T3 for derived states.
  Writes keep going through `backlog`, so nothing changes for agents.
- Then braid's own CLI takes over the commands braid calls, checked by round-trip tests against files
  Backlog.md wrote (its fixtures and tests are the specification), until `backlog` is no longer
  needed. Backlog.md stays the store until then, as already decided.
- Reasons: braid needs about a tenth of Backlog.md; the rest is UI and features braid would delete.
  Bun (above all the test suite) and upstream's pace make a fork expensive to keep. Derived states
  contradict Backlog.md's stored-status model, so they would be a deep change in a fork and are
  outside Backlog.md in a wrap.

What would change it:

- **Fork** if the user wants most of Backlog.md's web UI (editing, docs, decisions, statistics) in
  braid, or braid moves to Bun.
- **Wrap only** if the board is all braid needs and the CLI stays the user's and agents' interface
  long term; or if upstream adds an extension point for custom columns or external status.
- **Revisit** if TASK-2.3 finds the compatible subset much larger than 8k lines, or if upstream
  changes the file format in a way that breaks round-trips.

## Not checked in the time box

- Performance of cross-branch reads on large repositories, and whether braid's own reader needs the
  same caching.
- Whether the `--json` schema is stable across 1.5x releases (it is versioned; no history checked).
- The content of the 77 open issues; only the count was taken.
