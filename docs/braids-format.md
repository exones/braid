# The braids/ format

braid keeps its work items in a `braids/` folder at the repository root. A **braid** is a top-level item; a **strand** is one part of a braid, delivered as one PR. This page describes the files and the commands that read and write them; braid makes and changes briefs, and you may also edit briefs and reports directly: run `braid check` afterwards. The decisions behind it are in [doc-5](../archive/backlog/docs/doc-5%20-%20New-braid-implementation-plan-draft.md) ("Decided so far").

## Folders and files

```text
braids/
├── 0001-fresh-start/               # a braid without strands
│   ├── brief.md                    # front matter and the brief
│   ├── report.md                   # the report (optional)
│   ├── log-2026-11-13-2831f09b.md  # one log per thread (optional)
│   └── temp/                       # scratch space, ignored by Git
└── 0002-braids-folder/             # a braid with strands
    ├── brief.md
    ├── A-read/                     # strand 0002/A
    │   ├── brief.md
    │   └── report.md
    └── B-create/                   # strand 0002/B
        └── brief.md
```

- A braid folder is `<number>-<slug>`: four digits, then a slug of lowercase letters, digits and single hyphens. Each number is used once.
- A strand folder sits inside its braid and is `<letter>-<slug>`: one capital letter, then a slug. A letter never changes once given; the run order is the `order` field.
- Every braid and strand folder needs a `brief.md`. `report.md` is optional.
- Log files are named `log-<YYYY-MM-DD>-<thread>.md`: the date the log was started and the first 8 letters or digits of the thread id (after its last `:`), `user` when there is no thread, or `import` for the notes `braid import-backlog` carried over.
- `temp/` folders are ignored by Git (`braids/**/temp/` in `.gitignore`) and by braid. Other files, and folders that don't match these names, are ignored inside a braid. Directly under `braids/`, every folder must be a braid folder; files there are ignored.

## brief.md

A brief starts with front matter between two `---` lines, followed by the brief in Markdown:

```markdown
---
id: '0002'
title: 'Braids folder: the format'
status: In Progress
labels: [kind:story, tier:L]
dependencies: ['0001']
order: 1
delivery: epic
---

## Goal

braid tracks braids from the command line.
```

| Key | Required | Value |
| --- | --- | --- |
| `id` | yes | `0002` for a braid, `0002/A` for a strand. It must match the folder. |
| `title` | yes | Text. |
| `status` | yes | `Outline`, `To Do`, `In Progress` or `Done`. |
| `labels` | no | A list of text. |
| `dependencies` | no | A list of braid or strand ids (`0001`, `0002/A`). |
| `related` | no, braids only | A list of braid ids (`0025`): open braids this one overlaps, takes a decision from, or splits work with (the brief's "Already decided" says which). Stored only in the brief that makes the link; `braid view` and `braid list --open` show it, and `braid view --links` shows the other side as `Linked from:`. It never orders work: `braid next` and `braid start` read only `dependencies`. A strand can't set it, and a braid can't name itself. |
| `order` | no | A whole number: the run order among a braid's strands. Strands without one run last, by letter. |
| `delivery` | no, braids only | `epic` (the default): strands merge into an epic branch, then one PR into `main`. `main`: each strand's PR goes into `main`. A strand can't set it. |
| `autonomy` | no, braids only | The name of the [autonomy preset](autonomy.md) the braid runs on, like `steady`. Without it the braid runs on the project default (`autonomy` in `BRAID.md`, else `careful`). Written only when set; `braid edit <id> --autonomy none` removes it. A strand can't set it. |

Front matter is a small subset of YAML, and braid rejects anything outside it:

- One `key: value` per line. Values are text: `0001` stays `0001`. Quote a value with `'…'` (a doubled `''` is a quote) or `"…"` (JSON escapes); a plain value may not start with `[ ] { } & * ! | > % @ #` or a backtick.
- A list is inline, `[a, 'b c']`, or a key with nothing after the colon followed by indented `- item` lines. `[]` is an empty list. List items are quoted the same way as values, so a quoted item may hold commas and escaped or doubled quotes.
- Blank lines and lines starting with `#` are skipped. Unknown or repeated keys are errors. A braid CLI older than `related` therefore fails `braid check` and every read of a brief that has it (`unknown key: related`), and one older than `autonomy` fails the same way on a brief that has `autonomy` (`unknown key: autonomy`); the fix is updating the installed CLI.

The body after the front matter is free Markdown. Its `## ` headings divide it into sections (headings inside code fences don't count); `braid view` prints the body as it is. A braid's `## Autonomy` section, when it has one, holds the braid's exceptions to its preset in a line or two of free text; `braid autonomy <number>` prints it under `This braid:` and doesn't parse it.

## Log entries and checkpoints

A log file holds one thread's entries, oldest first. The first `braid log` of a thread creates `log-<date>-<thread>.md` with the date (UTC) of that call; later entries go to the same file even on a later day. Each entry is a heading with the UTC time, a blank line and the text; entries are separated by a blank line:

```markdown
## 2026-11-13 14:05Z

Read the reader code; the writer must re-parse.

## 2026-11-13 15:30Z checkpoint

Done: parser. Next: the `braid log` command. Open: none.
```

A **checkpoint** is an entry whose heading ends in ` checkpoint`: a place a thread can be resumed from, written with `--checkpoint`. Its text says what is done, what comes next and what is open. The last checkpoint in a log is the current one.

## Branches

Work on a braid or strand happens on its own branch, named after its folder:

- `braid/<number>-<slug>` for a braid, like `braid/0006-read-only-board`: its epic branch when it has strands (their PRs merge into it), its only branch when it has none.
- `braid/<number>/<letter>-<slug>` for a strand, like `braid/0006/A-board-skeleton`.

The status on such a branch is newer than the one in the checked-out files, so `braid board` reads it from there, from local branches and remote-tracking ones (`origin/braid/…`) alike, without checking them out:

- A strand's brief, report and logs come from its strand branch, else from its braid's branch, else from the working tree. A braid's own brief comes from its braid branch, else the working tree.
- When a branch exists both locally and on a remote, or under two slugs, the newest commit wins; a local branch wins a tie.
- A branch whose commit is already in the checked-out commit is skipped: the working tree has its copy or a newer one. So is the checked-out branch itself, whose uncommitted edits show. Of the copies of one item, only the newest is checked; when it is merged, the item shows the working tree's copy.
- A strand branch whose commit is already in its braid branch's tip is skipped as well: a merged strand's branch stays on the remote, and its copy is older than the braid branch's, so the braid branch's copy wins (from `main` too, until the braid's own merge).
- "Merged" here means merged with a merge commit or fast-forwarded, as this repository merges. After a squash or rebase merge the branch's commit is not in the checked-out one, so a leftover branch still overlays the working tree until it is deleted.
- A branch whose brief is missing or malformed is skipped; run `braid check` on that branch.
- A braid or strand that exists only on a branch shows too.
- braid runs no `git fetch` for the board; remote branches are as fresh as the last fetch.

## The inbox

Small leftovers and the user's ideas live outside `braids/`, on one branch of their own, `braid-inbox` (D54). It starts as an orphan commit, shares no history with `main` and is never merged into it, like `gh-pages`. Its name matches neither braid branch shape, so the board, `braid clean` and the cross-branch reads ignore it, and pushes to it run no CI.

- `leftovers/<id>.md`: a gap found during an item that isn't fixed in its PR: a non-blocking review finding, an unfinished bit a report names, a worker's `For later items:`. The text says what is wrong or missing, where (files, functions) and why it matters, so an agent who never saw the item understands it.
- `ideas/<id>.md`: the user's idea, written by the `braid-idea` skill.
- `<id>` is `<YYYY-MM-DD>-<short random>` (the UTC day and four or more lowercase letters or digits), like `2026-11-18-k3f9`. The folder is the kind, so an entry never moves; its status is front matter. braid never deletes an entry: taken and dropped ones stay as records.

An entry is front matter, then a short Markdown text whose first line is its title:

```markdown
---
from: "review 0012/A"
ref: ["https://github.com/o/r/pull/40#discussion_r1"]
status: open
passed: 0
---

Retry the fetch in braid start

startCommand (src/commands/start.ts) gives up on the first network error, so a flaky
connection fails the whole start. One retry would cover it.
```

| Field | Meaning |
| --- | --- |
| `from` | Where it came from: an item id (`0012/A`), `review <item id>`, `PR #<n>` or `user`. Required for a leftover; an idea has `user` unless given. |
| `ref` | Optional links to the context: the review comment, the PR, a commit. |
| `status` | `open`, `taken` or `dropped`. |
| `passed` | Leftovers only: how many sweeps passed it over, from 0. |
| `into` | The braid ids it went to, when taken. |
| `why` | The reason, when dropped. |

Writers. Only braid commands write `braid-inbox` (`braid note`, and the sweep commands), each change as one commit with the message `docs(inbox): <id> <what>`, pushed at once. This is the one exception to "one writer per branch": distinct file names keep writers from conflicting. A write never touches a checkout, an index or the current branch: it builds the commit with Git's low-level commands (`hash-object`, a temporary index, `commit-tree`, `update-ref`), so it works from any worktree, with uncommitted changes, on any branch.

- It fetches `braid-inbox` from `origin` first and builds on the remote tip, with any local commits the remote lacks replayed on top (their files, messages and authors). The first write anywhere creates the branch.
- It pushes as a fast-forward and never forces. When the push is refused because someone pushed first, it fetches and redoes the commit on top, up to five times.
- When `origin` can't be reached (offline, no remote) or the push fails for another reason, the commit stays on the local `braid-inbox` branch with a warning, and the next write pushes it.
- A write refuses, and changes nothing, while any worktree of the repository has `braid-inbox` checked out: moving the branch under it would leave that worktree showing every newer entry as a staged deletion, and a commit there would delete them. The message names the worktree; leave it with `git switch --detach` there, or remove the worktree.
- A lock in the main checkout's `.braid/` (`inbox.lock`; `requests.lock` for the request record) makes writers on one machine take turns.

Readers. `braid inbox` fetches first; the reading functions read the refs without fetching unless asked. They read the local `braid-inbox` and `origin/braid-inbox`: the descendant when one contains the other; when they have diverged (a local commit not pushed yet, and newer remote commits), the remote's entries with the files the local-only commits add or change on top, as the next write replays them, so a listing never hides an entry. An entry's age is the author time of the commit that added its file. A malformed entry (bad file name, front matter, `status`, a leftover without `from`, a `passed` that isn't a whole number, no text) is reported with its file and field, and the rest are still read.

Recovery. Every clone that wrote or fetched the inbox keeps a copy (`braid-inbox` or `origin/braid-inbox`). If the remote branch is deleted, the next `braid note` pushes it again from that copy. If it is force-pushed to a different history, a write from a clone that still has the lost commits on its local `braid-inbox` replays them on top of the new remote tip, so the entries come back. By hand, from a clone that has the good commit (`git reflog show braid-inbox` finds it): `git push origin <good commit>:refs/heads/braid-inbox` when the remote branch is gone, or `git branch -f braid-inbox <good commit>` and then any `braid note` when it was rewritten.

## The request record

Requests (D45, D89, D96) live on the branch `braid-requests`, kept like [the inbox](#the-inbox) by the same code (`src/braids/gitbranch.ts`): an orphan branch never merged into `main`, written only by braid commands without a checkout, pushed at once as a fast-forward, a refused push fetched and redone on top, offline kept on the local branch until the next write, the lock `requests.lock` in the main checkout's `.braid/`, and a write refused while a worktree has the branch checked out. Commit messages read `docs(requests): <item> <kind> <code>`.

Files. One JSON file per request, `requests/<code>.json`. The code is `q-` and four lowercase letters or digits, random and unique on the branch. The fields are set when the request opens and never change:

```json
{
  "code": "q-7f3k",
  "item": "0070/A",
  "kind": "question",
  "text": "Which name should it have?",
  "key": "scope",
  "by": "coordinator",
  "thread": "mcp:launch:…",
  "to": "pm",
  "pm": "<the PM's thread>",
  "doneWhen": "answered",
  "eta": null,
  "events": [
    { "event": "opened", "at": "2026-11-23T10:00:00.000Z", "by": "coordinator" },
    { "event": "forwarded", "at": "2026-11-23T10:05:00.000Z", "by": "pm", "text": "your call" },
    { "event": "answered", "at": "2026-11-23T10:10:00.000Z", "by": "coordinator" }
  ]
}
```

- `key`, `pm`, `pr` and `head` (a review's PR and the head handed over) appear only when set. `to` is `user`, `pm` or another braid's number (`0042`, its coordinator: a wait, which the running board reminds). `doneWhen` is `answered`, `pr:<n>` (a review's, or `braid ask --done-when`), `braid:<number>` or `time:<iso>`; `eta` is null until `braid eta` sets it (ISO); the newest `eta` event decides it.
- Everything after the opening is an event appended to `events`, which only grows: `opened`, `forwarded`, `answered`, `withdrawn`, `met`, `eta` (the addressee's estimate: the time in `text`, the why in `reason`) and `reminded` (the running board sent a reminder: to whom in `text`; with a `reason`, an escalation to the PM, such as `missed its estimate 13:00`). Each has `at`, `by` (`user`, `pm`, `coordinator` or `board`) and, where it has one, `text` (the answer, the forward's note, the reason) and `reason` (the PM's, when it answers for the user). A braid CLI older than `reminded` skips a record that has one as unreadable.
- The state is read from the events, never stored: `open` until the last of `answered`, `withdrawn` or `met`. A request is never deleted.
- A `pr:<n>` condition is checked where a review's PR is: when the PR merged the request is recorded `met` (`PR #<n> merged`, by `board`), when it closed `withdrawn`; only a review is also withdrawn when its head moved. A `braid:<number>` condition is recorded `met` (`braid <number> merged into main`, by `board`) once that braid is `Done` on `origin/<main>`, a `time:<iso>` one (`time <iso> reached`) once that time has come. `braid requests` and the running board's [wake](board.md#wakes) check all three; the board also wakes the asking thread once.
- When a write replays a local commit over a file the remote also changed (one side offline), the two event lists are merged, each event once, in time order, so no event is lost. A read while the two branches differ merges them the same way, so it shows both sides' events before the next write.

Readers (the board, `braid requests`, `braid status`) read the local `braid-requests` and `origin/braid-requests` as the inbox's do, without fetching; a file that doesn't parse is reported and skipped. `braid requests` fetches first; the board fetches only on a fresh read (the Refresh button), alongside its GitHub and T3 reads.

Migration. The first read or write that finds an old `.braid/requests.json` with records opens each one on the branch with a new code and its original times (and a `forwarded` event when it was forwarded), in one commit, then renames the file `requests.migrated.json`. A record already there (same item, asker and opening time, as a run that died before the rename leaves it) isn't added again. The board's read commits it locally; the next write pushes it.

## The project list

`~/.braid/projects.json` lists the projects of this machine that one board will serve (strand C of 0049 reads it). It is per machine and per user: nothing about it goes into any repository. `braid projects add|remove|list` keep it ([the CLI](cli.md)); edit it by hand only to repair it.

```json
{
  "version": 1,
  "projects": [
    { "name": "agento", "path": "C:\\code\\agento", "port": 4100 },
    { "name": "site", "path": "/home/me/src/site" }
  ]
}
```

- `version`: 1. A file with another version is refused (update braid, or fix the file).
- `projects`: in the order they were added. Each has a `name` (unique; 1 to 64 letters, digits, `.`, `_` and `-`; by default the main checkout's folder name), a `path` (the absolute path of the repository's main checkout, also when `add` ran in a worktree; unique, compared without case on Windows) and an optional `port` (1 to 65535, a fixed port for the board).
- A missing file is an empty list; the first `add` creates it (and `~/.braid/`).
- A file braid can't read (not JSON, another version, an entry without a valid name, absolute path or port, a name or a path listed twice, paths compared as `add` compares them) is reported by every `braid projects` command with exit code 2, and nothing rewrites it.
- Writes take turns under a lock file next to it (`projects.json.lock`, the same lock as [requests](#commands): exclusive create, a lock older than 30 s taken over by one waiter, giving up after 10 s), re-read the file, then write a temporary file and rename it over the list, so two `add` runs at once both keep their entry.
- Item worktrees go to `~/braid-worktrees/<name>/` ([`braid start`](#commands)), `<name>` being the project's name here, so two projects whose main checkouts have the same folder name keep apart; `add` says so when it happens. A repository that is not listed uses its main checkout's folder name. Worktrees made before this (in `~/braid-worktrees/<folder name>/`) stay where they are and are still found by `start`, `clean` and the board.

## Plan files

A programme manager (the `braid-pm` agent) keeps its programme in `pm/<slug>.md` on the branch `pm/<slug>`. Its front matter is what [the board](board.md#programmes) reads; the body (the goal in full, decisions, change log) is for people and is never read. The front matter uses the brief's YAML subset (`key: value`, quoted or plain strings, lists), read by `parsePlan` in `src/braids/plan.ts`:

```markdown
---
programme: working-product
title: Working product
goal: A working product per the specs
thread: 11111111-aaaa-4bbb-8ccc-222222222222
limit: 3
state: running
hold:
next: P3 Packaging, after 0006 merges
digest: 20:03 · 3 done · 3 running · 7 PM decisions
rows:
  - P1 | 0001 | Login | running
  - P2 | 0002 | Search | done
  - P3 | - | Packaging | planned
---
```

- `programme` (required): the slug, lower-case words joined by `-`; it must match the branch `pm/<slug>`.
- `title`, `goal` (required): one line each; `goal` is the user's goal in short.
- `thread`: the PM's T3 thread id (the PM thread button and the stall read it).
- `limit`: how many braids run at once, a whole number.
- `state` (required): `running`, `held`, `done` or `stopped`. `done` and `stopped` take the programme off the board's panel.
- `hold`: empty, or `<ISO time> <the user's words>` while the user holds the work.
- `next`: what starts next. `digest`: the PM's latest one-line summary.
- `rows`: one per plan row, `P<n> | <braid number or -> | <title> | <state>`, the state one of `planned`, `running`, `waiting on user`, `ready to merge`, `done`, `stopped`, `dropped`. A braid number may appear in one row only. The rows are what ties a braid to its programme (its 🧭 tag, Only these).
- Any other key, a missing required key or a bad value is an error naming its line. `-` or an empty value means none. `braid check --plan <file>` checks a plan file.

## Commands

- `braid check`: validates every brief and folder name under `braids/` against this page and lists every problem as `<file>: <message>` (with the line where there is one), then the error count; exit code 2 if there is any, 0 and `braids OK: <n> braids, <m> strands` if there is none. Unlike the other commands it does not stop at the first error. It also checks the [autonomy presets](autonomy.md#checks): the project's files under `autonomy/`, and that `BRAID.md` and every brief name a preset that exists, and the `docs` key of `BRAID.md`: `docs.update` is one of `strand`, `braid`, `both`, `on-demand`, and `docs.public` and `docs.internal` are lists (errors; a `BRAID.md` without `docs` is valid). A `related` id found in no source of `braid list --open` is a warning on stderr (`warning: <file>: related braid <id> is not ...`), not an error: the braid may live on a branch this checkout hasn't fetched.
- `braid check --plan <file>`: validates one [plan file](#plan-files) instead and prints `plan OK: pm/<slug>, <state>, <n> rows`, or `<file>: line <n>: <message>` with exit code 2.
- `braid projects add [<path>] [--name <name>] [--port <n>]`: adds the repository that holds `<path>` (default: the current folder) to [the project list](#the-project-list): its main checkout, found from a worktree too. It refuses, changing nothing, a folder outside a Git repository, a name or a main checkout already listed, a bad name or port. It prints the entry and its readiness ([Not ready](board.md#not-ready), GitHub not checked), and a warning on standard error for each listed project with the same folder name. `braid projects remove <name>` takes one off. `braid projects list` prints each project (name, path, port) with its readiness lines under it: `ready (GitHub not checked here)`, a `not ready: …` line per problem, or `problem: the folder no longer exists` for a path that is gone; the other projects still list. GitHub is not asked, so `list` runs no `gh`.
- `braid board`: serves the local attention board: lanes To Do, Working, To Review, Needs You and Done, from the stored status (read from the item's own branch when it has one, see [Branches](#branches)), GitHub PRs and T3 threads. How lanes, icons, refresh and `--demo` work: [the attention board](board.md).
- `braid import-backlog`: turns the Backlog.md tasks in `backlog/tasks/` and the docs in `backlog/docs/` into braids; `--dry-run` prints the files it would write and writes nothing. TASK-N becomes braid `000N-<slug>`; its subtasks become strands in subtask-number order (TASK-6.1 → `0006/A`, TASK-6.2 → `0006/B`). Status, labels, dependencies (as braid and strand ids) and ordinal (→ `order`) carry over; a task with subtasks gets `delivery: epic`, a task without `delivery: main`. The brief body is the description as it is, then `## Acceptance` and `## Definition of done` as checkbox lists with their ticks, then `## Plan`. The implementation notes become `log-<created date>-import.md`, the final summary `report.md`, and a linked doc's text is appended to that report under the doc's title (a doc linked from a braid and from one of its strands goes to the strand only). Milestones are dropped. Archived tasks, drafts and docs no task links are not imported; the output lists them. It refuses, changing nothing, when a braid number already exists in `braids/` (exit 1), when an input file doesn't parse or a dependency or doc link points nowhere (exit 2, every problem listed), and it ends with the checks of `braid check`. It never deletes or moves `backlog/`.
- `braid list`: every braid by number, with its strands indented in run order: id, status, order (`-` if none) and title. It ends with `Inbox: <open> leftovers, <ideas> ideas`: the open counts of the whole project's inbox, read from the local refs without fetching (`braid inbox` reads fresh).
- `braid list --open` (`--no-fetch` skips the fetch; without it, a failed fetch warns on stderr and the command goes on with what is local): every braid whose status is not Done, in number order, wherever it lives, for the coordinator to judge overlap before it plans a new braid. Each block holds the id, status and title, `read from: <source>` (`main` for the working tree, a braid or strand branch, or a `plan/<slug>` branch, local or `origin/`), `related: <ids>` when the braid has links, the first paragraph of `## Goal` (cut at about 300 characters) and the strands as `braid list` shows them. The sources are what the board reads (working tree, braid and strand branches not merged into HEAD) plus local and remote `plan/*` branches not merged into HEAD; from a `plan/` branch only braids no other source has are taken, so its copy never overrides a braid branch's or the working tree's. It finds no overlap itself.
- `braid view <id>`: a braid (`0002`, or `2`) or a strand (`0002/A`) with its fields, folder, report, log files, its strands (each with `(needs ...)` when it has dependencies) or its braid, and then the brief's body. It shows the copy `braid list --open` shows: the working tree's, unless a braid, strand or `plan/` branch not merged into HEAD holds a newer one (by the rules of `braid list --open`, a `plan/` copy never overriding another); then `Read from: <branch>` follows the fields. It reads only that braid number's branches (and the `plan/` branches only when no other source has the braid), so it stays well under a second. A braid also shows `Related: <ids>` (`none` when empty) from that copy. `braid view <braid> --links` adds `Linked from:`: the open braids whose `related` names it, with titles (`none` when there are none), read from the sources of `braid list --open`, so a link made on another braid's branch or `plan/` branch shows here and a malformed copy on a branch is skipped. That read takes about a second in a repository with many branches (one `git for-each-ref --merged` for the merge checks and one `git cat-file --batch` for the briefs), so plain `braid view` doesn't do it. A strand has no `--links`.
- `braid status <number>`: one line for the braid and one per strand, from the same sources as the board and read-only (no `git fetch`): id, stored status, live lane as the board labels it (To Do, Working, To Review, Needs You, Done; the reason follows in brackets, and an item on the user's side gets a second line with its request or alarm text, the strand and the age), then `ask:<key>` when the item has an `ask:` label (a flag only), branch (`local`, `+pushed`, or `-`), PR number and state, each `ci` check of BRAID.md as passing, failing or pending (a check GitHub hasn't reported yet is pending), and the T3 thread (`running` for a worker agent, `review running` for a reviewer's, `-`, or `?` when T3 can't be read). A line whose PR is merged and whose stored status isn't `Done` ends with `run braid accept <id>`. A `note:` line says when GitHub or T3 couldn't be read, and the last line says when remote branches were last fetched.
- `braid next <number>`: the first strand in run order that is stored `To Do`, has every dependency Done, has no running agent, no open PR and no pushed branch, printed as its id and title. `Outline` strands are never picked. When none is ready it says so and lists each unfinished strand with its reason (running, PR open, blocked by …, branch already pushed, Outline), or that all are done.
- `braid start <id> [--force]`: the coordinator's first step for an item, in one command. For a strand (`0008/B`) it refuses unless the strand is ready, as `braid next` decides (stored `To Do`, dependencies Done, no running agent, no open PR, no pushed branch; `Outline` is never ready), or `--force`; then it pushes `braid/<number>/<letter>-<slug>` (the slug is the strand folder's) from the tip of the braid's branch (the newest of the local and the pushed copy; it has to exist) to `origin` and adds a worktree on it in `$BRAID_WORKTREES_DIR/<repo>/<number>-<letter>`, or `~/braid-worktrees/<repo>/<number>-<letter>` when the variable is unset (`<repo>` is the project's name when the main checkout is in [the project list](#the-project-list), else the main checkout's folder name; a worktree made earlier under `<folder name>/` is still found, checked for a retry and cleaned there, and never moved). A braid without strands (a story, `braid start 0009`) gets `braid/<number>-<slug>` from `main` (BRAID.md `main:`) into `<repo>/<number>`. It prints `branch`, `commit` and `folder`. A story the coordinator planned already has its branch (the plan pushed it): when that branch exists locally or on `origin/` and the story is `To Do` with no PR and no worktree on it, `braid start` pushes nothing and adds the worktree on the existing branch (tracking `origin/<branch>` when only the remote has it), printing `branch <name> (existing)`. Otherwise it refuses, creating nothing, when a strand already has a branch (local or pushed), when a story's branch is checked out in a worktree, when the folder exists or when the push fails; `--force` skips only the readiness check. A second `braid start` of an item already started as asked (its branch checked out in that worktree folder; for a strand, containing the braid branch's tip) is checked before the ready check, creates and pushes nothing, prints the same three lines with `branch <name> (already started)` and exits 0; a branch checked out in another folder, or a strand branch that lacks its base, fails and names what it found, so a coordinator that lost the result can retry. It does not launch the worker's thread. `--review` was removed in 0039 (D69): it fails, creating nothing, with a line saying reviewers are recorded with `braid review`. Agents of an item, for the board and `braid accept`, are the running T3 threads whose worktree is one of these folders (the worker) and the running threads recorded with `braid review` (the reviewer); a coordinator's thread, on a braid branch with strands or anywhere else, is no agent of any item.
- `braid wait <number> [--timeout <minutes>]`: reads the braid branch's CI after a strand's merge (D71). The coordinator calls it in short reads, `--timeout 0.25`, at two points: at the checks of the next strand's PR, and before opening the final PR; it never waits on it in the foreground, and exit 3 there means "read again at the next point" (D91). The braid branch is `braid/<number>-<slug>` of the braid in this checkout, else the only braid branch with that number (two braids sharing a number are refused, naming both). It fetches only that branch from `origin` and walks its first-parent history (up to 50 commits) to the newest commit whose diff against its first parent touches a file outside `braids/` and `epics/` (the CI commit; the output names the skipped tip). Every commit above it changes only those folders and tests the same code, whether or not the project's CI runs on them, so every 15 seconds it reads the check runs (`gh api .../commits/<sha>/check-runs`) from the tip down to the CI commit for the `ci` names of BRAID.md: a check is answered by the newest commit in that range that has a run for it (an empty answer falls through to the next older commit; a commit GitHub could not be read for keeps the answer pending), and the output names the answering commit. It ends when all of them have finished: exit 0 and `green at <sha>` when all passed (success, neutral or skipped); exit 1 and the failed names when any other conclusion (failure, timed out, ...) is among them; a cancelled run with a newer commit above it (a newer push cancelled it) stays pending for the 5-minute start limit while that commit may still start its run, then, or with nothing newer, counts as failed; exit 3 (`still running`) at the limit (`--timeout <minutes>`, default 30, fractions allowed; the output names the commit, what failed, what is still running and what has not started; a run that has not appeared yet within the 5-minute start limit counts as still running; once a run was seen, a failed or empty read is retried until the limit); exit 2 when none of the names has shown a run within 5 minutes (`no run appeared`, or `GitHub could not be read`) or on any error (usage, fetch), so exit 1 always means a failed check and exit 3 means still running (a later call continues). With no `ci` names in BRAID.md it ends at once with exit 0. It commits, merges and pushes nothing.
- `braid review <id> --thread <thread id>`: records a T3 thread that reviews the item's PR: the coordinator runs it right after launching the reviewer as a subagent, with the child thread id (D69). It asks T3 (`t3 thread show <id>`) for the thread's checkout and stores its `worktreePath` and `branch` with the record; when T3 has no folder for it yet, doesn't know it or can't be read, the thread is recorded without one and the output says so (`braid clean` then asks T3). The record is `.braid/reviews.json` of the main checkout (found from any worktree; item id, thread id as given, time, folder and branch), written under a lock like the requests and never committed; an item can have several (a re-check is a new thread), and the same thread twice is kept once. The item must exist and the id needs at least 8 letters or digits. While T3 says a recorded thread runs, it is the item's reviewer (review activity, its pending questions, no `checks failed` or `stalled`); `braid clean` drops the record after the merge.
- `braid accept <id> [--head <sha>] [--merge [--preset]] [--review <url>] [--log <file>|-] [--thread <id>]`: the coordinator's acceptance, once, after review, fixes and green CI; it marks the item `Done` where it holds the base (D43, D48). `braid done` is the old name and still works, printing a line that names `braid accept`. The worker only completes: it ticks the `## Completion` boxes of the brief (older briefs with `## Acceptance` and `## Definition of done` are read the same way). For an open PR it first checks, and refuses naming the first that fails, changing nothing: the base is the braid branch (a strand) or `main` (a braid); the head is `--head` (the reviewed commit, 7 to 40 hex digits); each `ci` check of BRAID.md passes on it (with `ci: none`, none fails or is pending; a head whose `ci` checks are missing or pending also passes when every commit since the newest commit with all `ci` checks green, looked up with `gh api` over the last 30 commits, changes only files under `braids/`, the CI workflow's `paths-ignore`, and the output names that commit; a failed check on the head, a code change or a merge commit in between still refuses; `accept --merge`, `handover` and `braid facts` apply the same rule); GitHub says mergeable; at that head (fetched from `origin`) no box under Completion (or Acceptance, or Definition of done) is unticked (a box naming CI is left out, since this checks CI), `report.md` exists and, for a braid's final PR, every strand is `Done`; T3 can be read and shows no running worker agent for the item (a refusal names the thread's id and title; the coordinator's own thread is never one, so `--thread` is only for `--log`). `--merge --preset` (D73) is a merge the coordinator makes under the braid's [autonomy preset](autonomy.md), checked first and changing nothing when refused: `merge: strands` allows a strand's PR, `all` also a story's and a braid's final PR, `none` nothing; it also refuses when `ci` in `BRAID.md` is `none`. The refusal names the preset and its `merge` value. Every other check stays; `--preset` needs `--merge`, and `--merge` alone is a merge the user asked for. With `--log`, the braid log entry ends with an `Accepted:` line (the head, `--review`'s link or "reviewed by the coordinator", the coordinator's thread); every successful acceptance also posts that line as a PR comment (a failed comment only warns).
  - A strand whose PR is merged (any way): this checkout must be on the braid branch with no tracked changes. It pulls (`--ff-only`), sets the strand `Done`, appends the `--log` text (a file, or `-` for standard input) to the braid's log under `--thread` (default `user`), commits `docs(braids): <id> done` and pushes. A strand already `Done` there changes nothing.
  - A strand whose PR is open needs `--head` and `--merge`: after the checks it runs `gh pr merge --merge --match-head-commit <head>`, then stamps as above. Without them it refuses: a strand is marked Done after its merge.
  - A braid (a story or a goal's final PR) with an open PR needs `--head`: after the checks it sets `Done` in a temporary worktree at that head, commits `docs(braids): <id> done` (with the `--log` entry), pushes it to the PR's branch and prints `head <new commit>`. With `--merge` it then polls the PR (every 15 s, up to 30 minutes) until the `ci` checks pass on the new head and merges exactly that head; a failing check or a moved head stops it, Done but not merged. When the head is already `Done` it says so; with `--merge` it only waits and merges.
  - It refuses an item with no PR, a PR closed without merging, and a braid whose PR is merged without `Done` (braid never commits to `main`).
- `braid facts <pr>`: the stop-case diff facts of a PR, read-only. It fetches the PR's base and head from `origin` and prints `PR #n: <base> <- <head> at <sha>`, then one line per fact as `<case>: <what>: <files>`: `dependency` (a manifest or lockfile changed), `process` (a workflow, `BRAID.md`, `AGENTS.md`, `CLAUDE.md` or skill file changed; a deleted test; a skip or `only` marker added or removed) and `quality or scope` (lines changed, not counting `braids/**` (the item's own brief, report and logs), over twice the number of lines (the upper bound of a range) on the item's `Expected size:` line, the item being found from the branch name; without it no size check). With no fact it says so. It judges nothing.
- `braid decisions <number> [--since <date or sha>]`: a `Decided:` line is an ordinary log entry (`braid log`) whose text starts with `Decided:`. The command lists those of the braid and its strands in this checkout, and the requests of the braid and its strands that the user or the PM answered, from [the request record](#the-request-record) (`q-… answered by the PM: <request> -> <answer> (reason: …)`), oldest first, one per line: date, item id and the text (one line). `--since <YYYY-MM-DD>` keeps that day and later; `--since <sha>` keeps entries after that commit's time. `braid recap` and `braid handover` print the item's own `Decided:` entries at the head and its answered requests (a braid's final PR: its strands' too), under `Decisions:`.
- `braid limits [<instanceId>] [--role <role> [--tier <T>] [--kind <kind>]] [--json]`: read-only; reads T3's provider caches and says per provider in `models` whether an agent may be launched: `ok`, `pause` (a window at or over its threshold, with the resume time) or `unknown` (stale, missing or `unsupported`; never pauses). Thresholds and times come from the optional `limits:` key of `BRAID.md` (`session` 97, `weekly` 95, `buffer` 5, `stale` 10). Exit 3 on pause. See [the CLI reference](cli.md#provider-limits).
- `braid recap <id>`: a draft recap for the coordinator to edit, read-only: the skill's recap format with the item's title, the PR's link and head, `Done:` and `Decisions:` taken from `report.md` at the head, with the `Decided:` entries and answered requests under `Decisions:` (as `braid decisions` lists them), `Needs the user:` from the report's line and `braid facts`, then the checks of the `ci` names on that head, the report's `For later items`, the facts, and the braid log line. Lines it can't fill read `<edit: ...>`. When 3 or more leftovers are open in the inbox (whole project, local refs, no fetch) it ends with `Sweep due: <n> open leftovers`; below that it says nothing about the inbox, and it never lists entries or ideas. `braid handover` prints the same draft.
- Pauses: braids held back for a provider's usage limit (D86), in `.braid/pauses.json` of the main checkout, written atomically (a temporary file renamed over it, under the lock `pauses.json.lock`) and never committed. It is a JSON list with one record per braid: `braid` (`0061`), `reason` (`limit` or `hold`; a record without it is a limit), `words` (a hold's words), `provider` (the instance id; null for a hold), `window` and `label` (the window over its threshold, or null), `usedPercent`, `resetsAt` (ISO or null), `resumeAt` (ISO; null for a hold), `task` (the scheduled resume task's id, or null), `thread` (the pausing thread; for the board, its steering thread), `by` (`coordinator`, `pm` or `board`) and `at` (ISO). A board's record also has `targets` (each paused thread: `thread`, `kind` `coordinator`, `worker`, `reviewer`, `pm` or `child`, `item`, `project`), `steering` (`thread`, `link`, `provider`, `model`, `started`, `outcome` `pausing`, `paused`, `partial` or `failed`, `answered`, `total`, `children`, `noAnswer`, `reason`, `self`) and `resumed` (the threads already sent their resume). `braid pause` and `braid resume` write it ([the CLI](cli.md#pauses)), and the running board for its own limits pause ([the board](board.md#the-board-pauses-and-resumes)). A file that isn't JSON or isn't a list reads as no pauses, and a record with a missing or wrong field is left out; both with a note on the board and in `braid status`.
- Requests: what the coordinator, or the programme manager, needs from the user or from the PM (D45, D89). They live on [the request record](#the-request-record), the branch `braid-requests`, one file per request with a code (`q-7f3k`) and its history; only the commands below write it, and none deletes a request. An item has at most one open question per asker (`by`: `coordinator` or `pm`, the programme manager asking you itself; a programme request has the id `pm/<slug>`), and a new one withdraws its asker's open one of the same sort ("replaced by q-…"): a question (to the user or the PM) replaces a question, a wait (to a braid) the wait to that braid; a wait and a question of one asker stay open side by side. A request has the item id, a kind (`review`, `question`, `decision`, `plan`, and `action` for the PM: something only the user can do), one line of text, the time, the asking thread, an optional `--key` (the stop case), `to` (`pm`: the PM answers first, with `pm` its thread id from the brief's `PM-run (thread <id>)` line; a braid number: that braid's coordinator (a wait, which the running board reminds hourly); otherwise `user`; `braid forward` records a `forwarded` event with its note), "done when" and, for a review, the PR number and head commit. The commands that take an item find it on any branch, on `origin/<main>` (a merged story whose branch is gone) or, for an id the record already has, in the record.
  - `braid handover <id> --head <sha> [--thread <id>] [--to pm]`: refuses, changing nothing, unless the item's PR is open, at `--head` and every `ci` check of BRAID.md is green on it (or only `braids/` files changed since the newest green commit, as for `braid accept`; the output names it). Then it opens a `review` request and prints the `braid recap` draft. `--to pm` addresses it to the braid's PM, as for `braid ask`.
  - `braid ask <id> "<what is needed>" [--kind question|decision|plan|action] [--key <stop case>] [--thread <id>] [--to user|pm|<braid number>] [--done-when answered|pr:<n>|braid:<number>|time:<iso>] [--by coordinator|pm]`: opens a request (default kind `question`) and prints its code first; the text can come from `--file -`. Whitespace in it is folded to single spaces. `--done-when` is the condition that ends it (default `answered`); `pr:<n>`, `braid:<number>` (that braid `Done` on `origin/<main>`) and `time:<iso>` are checked (below).
    - `--to pm` (a coordinator under a PM): the request is the PM's to answer first; its thread comes from the braid brief's `PM-run (thread <id>)` line, and without that line nothing opens. The board escalates it to the user after 20 minutes (60 for a handover) or when the PM thread is gone ([Requests](board.md#requests)).
    - `--by pm`: the PM asks the user itself about one braid; `--thread` is the PM's thread, else the brief's `PM-run` line. `braid ask pm/<slug> "<text>"` asks about the whole programme; `<slug>` must name a `pm/*` branch, local or on `origin`, else nothing opens. Both are always the user's, so `--to pm` with `--by pm` is refused.
    - `--kind action`: something only the user can do; allowed only with `--by pm` or `pm/<slug>`.
  - `braid forward <id> [--note <text>]`: the PM hands the coordinator's request addressed to it on to the user: it sets `to: user`, `forwarded` (the time) and `note`. It reaches the user at once: on the braid's card (Needs You; a handover: To Review) for a braid no programme runs, as the PM asking in the programme's Needs you (the card keeps its lane) for one a programme runs; or after `braid resume` while the braid is paused or held. A request already the user's is left as it is. With a question and a wait open on the item it forwards the question; a wait (to a braid) is never forwarded: with only a wait open it says the request is for that braid's coordinator and changes nothing.
  - `braid answer <code>|<id>|pm/<slug> [--from user|pm] [--reason <text>] [--file <file>|-] [--by coordinator|pm] [--thread <id>]`: records an `answered` event with the answer's text (`--file`, or `--log`, its old name), who answered (`by`: `user` by default, `pm` with `--from pm`, which needs `--reason`, kept as the event's `reason`). It writes only to `braid-requests`: nothing is committed on a braid branch, so recording the user's "merge" doesn't move a PR head. With an id it answers the item's one open request; `--by` picks the asker's (`pm/<slug>`: the PM's). With more than one open (both askers' and no `--by`, or one asker's question and wait, `--by` or not) it names the codes, a wait as `waiting on braid <number>`, and changes nothing: the code picks one then. With none it says so. A request already closed is refused, naming its state and who closed it.
  - `braid withdraw <code>|<id>|pm/<slug> --why <reason> [--by coordinator|pm]`: records a `withdrawn` event by the request's asker with the reason; the request stays on the record. An id is found as for `braid answer`: with a question and a wait open it names the codes and changes nothing.
  - `braid requests [<code>] [--closed [--since <YYYY-MM-DD>]]`: fetches `braid-requests` (a failed fetch warns and lists the local copy), then lists the open requests, oldest first: code, item, kind, age (`5m`, `3h`, `2d`), `from the PM`, `to the PM`, `forwarded by the PM` or `to braid <number>` where it applies, `done when <condition>` for a condition other than answered, and text. A request file that can't be read is named in a warning and skipped. With a code it prints that request: its fields and every event with its time, who and text. `--closed` lists the closed requests, newest first, with their state, when and who closed them, and the answer or reason; `--since <date>` keeps those closed that day or later.
  - `braid eta <code> <duration|time> ["<why>"] [--by coordinator|pm]`: the addressee's estimate on an open request: sets `eta` and records an `eta` event (the time in `text`, the why in `reason`); a later call moves it; refused on a closed request. The running board's [reminders](board.md#reminders) wait for it.
  - `braid decisions <number>` and the `braid recap` draft list the requests the user or the PM answered next to the `Decided:` log entries.
  - Self-closing, checked by `braid requests` and by the running board's [wake](board.md#wakes), which also sends the asking thread one wake: a `review` request, or one with `--done-when pr:<n>`, whose PR merged is recorded `met`; one whose PR closed (a review's: or moved to another head) is recorded `withdrawn` with that reason (a PR GitHub can't be read for keeps it open). `--done-when braid:<number>` is recorded `met` ("braid 0042 merged into main") once that braid is `Done` on `origin/<main>` (fetched first), `time:<iso>` ("time … reached") once that time has come. `braid start` records the item's open requests `answered` ("started"); `braid accept` records a review `met` ("accepted") and anything else `withdrawn` ("the item is Done").
- `braid note "<text>" --from <source> [--ref <url>]... [--file -]`: writes an open leftover to [the inbox](#the-inbox) and pushes it; without `--from` it refuses. `<source>` is an item id (`0012/A`), `review <item id>`, `PR #<n>` or `user`. `braid note --idea "<text>" [--from <source>] [--file -]` writes an open idea, `from: user` unless `--from` is given. The text is the argument, `--file <path>` or `--file -` (standard input). Both print the entry id, whether it was pushed and the commit; a commit kept locally adds a warning on standard error.
- `braid inbox [--leftovers|--ideas] [--all] [--no-fetch]`: fetches `braid-inbox` (a failed fetch warns and lists the local copy), then lists the open entries, leftovers first: kind, id, age, source, `passed <n>` for a leftover, and the title. `--all` adds the taken and dropped ones, with a status column. Each malformed entry follows as `malformed: <file>: <field>: <message>`. `braid inbox show <id>` prints one entry in full: its fields, when it was created, the item folder that `from` names when it exists (in the working tree or on a braid branch), and its text.
- The sweep commands change entries on `braid-inbox`, one verb each; a sweep is a few commands in a row. Each validates every entry it names first (it exists, is well-formed and is in the right state), so a typo or a refused entry changes nothing, then writes all its changes as one commit through the shared write function (re-run on the fetched tip after a refused push) and pushes it, with a message such as `docs(inbox): sweep: take 2, pass 1, drop 1`.
  - `braid inbox take <entry>... --into <braid id>[,<braid id>...]`: open entries become `taken`, with `into` set to the braid ids (four digits).
  - `braid inbox pass <leftover>...`: open leftovers get `passed` + 1. At 2 the leftover becomes `dropped` with `why: passed over in 2 sweeps` (`passed` stays 2). An idea is refused: ideas are never passed over.
  - `braid inbox drop <entry>... --why "<reason>"`: open entries become `dropped`, with `why` set.
  - `braid inbox reopen <entry>`: a dropped or taken entry goes back to `open`, with `why` and `into` removed and `passed` reset to 0.
  - take, pass and drop refuse an entry that isn't open (reopen it first); reopen refuses one that is already open. An entry never moves between kinds: drop it and note it again.
- `braid clean [<number>|<id>] [--yes]`: for every item whose PR is merged (all braids, or one braid's `<number>`, or the one strand `<id>` named), lists the worktree and the local branch it would remove, and removes them only with `--yes`. It also lists each review thread recorded for the item (`braid review`). The stored folder and its branch (only a `t3/…` branch) are removed when the folder is a registered worktree of this repository (never the main checkout or the current one) and T3 doesn't say the thread is running (a thread T3 doesn't know counts as not running); then the record goes. A running thread's folder and a folder that isn't this repository's worktree are kept and named. A record without a folder (T3 gave none when it was made, or an older record) falls back to T3: `t3 thread show` gives the checkout (`worktreePath`) and branch, removed only for a subagent's thread (`relationshipToParent`) that isn't running; such a record T3 doesn't know is dropped. When T3 can't be read every recorded checkout is kept, and the output says so. A leftover reviewer checkout from before 0039 (`<number>-<letter>-review` or `<number>-review`, made by the removed `braid start --review`, holding no branch) is still removed with the merged item. It only removes an item's branch whose tip is in the history of this checkout's `HEAD` (`git merge-base --is-ancestor`), and never forces one, with a single exception: a recorded reviewer's `t3/…` branch is force-deleted (`git branch -D`) when its tip is the merged PR's head or is on a remote-tracking ref of `origin` (`git branch -r --contains`), since no commit is lost; one with commits found nowhere else is kept; a branch merged on GitHub but not in `HEAD` (not pulled yet, or squash-merged) is kept with the reason, because `git branch -d` alone would also accept a branch merged into its upstream: a worktree with changes or one still in use (on Windows a worker's process keeps the folder as its working directory for a while after it reports; the output says `still in use, retry later`) is kept, and the branch is deleted with `git branch -d` only, so a branch with commits that are not merged here stays (`kept branch`). It never touches remote branches or the branch checked out in this checkout, and a worktree outside `$BRAID_WORKTREES_DIR/<repo>` is left alone unless its strand is named. GitHub must be readable.
- `braid new <title>`: a new braid with the next free number, its folder (the slug comes from the title, or `--slug`) and a `brief.md` with status `To Do`. It ends with `Open braids: <n> (braid list --open)`: the count `braid list --open` shows, the new braid excluded.
- `braid strand new <braid> <title>`: a new strand in that braid with the next free letter.
- `braid edit <id>`: changes the front matter. `--status`, `--title`, `--labels a,b` (replaces the list; `none` empties it), `--dep 0001,0002/A` (replaces the list; each id must exist), `--related 0025,0026` (braids only; replaces the list; an id in no source of `braid list --open` is kept with a warning on stderr), `--order <n>` or `--order none`, `--delivery epic|main` (braids only), `--autonomy <preset>` or `--autonomy none` (braids only; the preset must exist here). `--labels`, `--dep` and `--related` may be repeated. `none` is used instead of `''` because the Windows `braid.cmd` shim drops an empty argument. Changing the title keeps the folder name.
- `braid brief <id> <section>`: sets the `## <section>` part of the body, replacing that section or adding it at the end. The text comes from `--file <path>`, `--file -` (standard input) or `--text <text>`; CRLF becomes LF. It may not hold `## ` headings or an unclosed code fence.
- `braid log <id> <text>`: appends an entry to this thread's log in the braid or strand folder and stages the file with `git add`; it never commits. `--thread <id>` names the thread (the file uses the first 8 letters or digits of the part after the last `:`, so `mcp:launch:5d80964a…` and `mcp:2831f09b-f69a-…` give `5d80964a` and `2831f09b`; a shorter id is an error); without it the entry goes to the `user` log. `--checkpoint` marks the entry as a checkpoint. The text is the argument, `--text <text>`, `--file <path>` or `--file -` (standard input); CRLF becomes LF. Agents on Windows pass text that holds quotes with `--file -`: the `braid.cmd` shim splits an argument with a quoted phrase.
- `braid report <id>`: writes `report.md` from `--file <path>`, `--file -` or `--text <text>`, replacing an existing report; with `--append` the text is added after a blank line (a new file if there is none).

`braid new` and `braid strand new` also take the `braid edit` options, except `--title`. braid writes front matter in one form: ids in single quotes, other text in double quotes with JSON escapes, `labels` and `dependencies` always present, `related` only when it is non-empty (so a brief without links keeps its exact text), `delivery` on every braid, and `autonomy` only when it is set.

A number or letter is never given twice. Before choosing one, `braid new` and `braid strand new` run `git fetch --all` (when the repository has a remote; `--no-fetch` skips it, and a failed fetch stops the command). Taken are the folders in the working tree and every braid or strand folder that ever existed under `braids/` in the history of any local or remote-tracking branch, including deleted ones (other refs, such as T3's checkpoints under `refs/t3`, don't count). The next number or letter is one above the highest taken; gaps are not filled.

braid finds the repository from the current folder: the nearest folder upwards that holds `braids/` or `.git`. A repository without `braids/` has no braids.

A malformed brief or folder stops the command with exit code 2 and an error naming the file, with the line where there is one:

```text
error: braids/0002-braids-folder/brief.md: line 4: status must be one of Outline, To Do, In Progress, Done; got: Doing
```

Usage errors, such as an unknown id, exit with code 1.
