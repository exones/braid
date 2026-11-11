# 008: one `braid` skill on Backlog.md, sequential MVP

Status: planning.
The user's merge into `main` marks it done.
Branch: `epic/008-braid-backlog` from `main` at `d4ab2f4`.

## Goal

One skill, `braid`, that handles every size of work the same way: plan a goal, run a single story,
and let a story grow into phases when a prerequisite or more work turns up, the way a developer
extends a story branch. Items live in [Backlog.md](https://github.com/MrLesk/Backlog.md) task files
instead of braid's own `epic.md` table and `items/<ID>.md` briefs, so the user gets a board, a CLI
and agent instructions without braid building them. The MVP runs one worker at a time; parallel
execution is the next epic.
The user then tries `braid` on a real project in an isolated environment.

The skill is built from `braid-coordinate`, which keeps its proven parts: `BRAID.md` facts,
briefs that are enough to start, tiers, review, recaps, milestone commits, and one writer per
checkout.

## Scope

In: a new `.agents/skills/braid/` skill (coordinator role for plan, story, grow and finish) with
its workflow reference and templates; the `braid-worker` changes needed to take a Backlog.md task
as its brief; installation and routing (`Install-Skills.ps1`, README, `AGENTS.md`, `BRAID.md`
template); a decision record; a scripted check of the Backlog.md flow in throwaway repositories and
a trial guide for the user.

Out: parallel workers and resource locks; braid CLI or ledger changes; MCP integration (unless A
shows the CLI can't work); agents running or judging coordinators and workers (the user's trial
does that after this epic); Snoboard, Everix or other project adoption; migrating braid's own
`epics/` to Backlog.md; removing `braid-coordinate` (kept until the user's trial proves `braid`); Groma.md;
releases.

## Design

- **One item type.** A Backlog.md task is an item of any size. A story is one task and one PR.
  When it grows, it gets subtasks (`TASK-12.1`, `TASK-12.2`): its phases. The parent task carries
  the goal, scope and dated decisions that `epic.md` carries today. At most two levels.
- **Task = brief.** Description: goal, start here, already decided, out of scope, expected size.
  Acceptance criteria: done when. Definition of Done: the project defaults (gate, green checks).
  Labels: `kind:story|task|spike`, `tier:S|M|L`, `ui`. Dependencies: real prerequisites only.
  Ordinal: run order.
- **Who writes what.** The coordinator creates and restructures tasks and sets statuses on the
  branch it owns. The worker writes its plan into the task before coding, appends notes, checks
  acceptance criteria and writes the final summary: that summary is the item's report.
- **Files travel with the work.** Each branch's copy of a task is the truth on that branch (probed,
  see below). A plan reaches `main` through a planning PR that the user merges: merging it is the
  approval. A story's PR into `main` sets its task to Done, so `main` shows Done exactly when the
  work is merged. A grown story runs like an epic: branch `epic/<task-id>-<slug>`, subtask PRs into
  it, one final PR into `main`.
- **Growth.** A worker that finds more work stops and proposes one of: absorb it (same PR, within
  about twice the expected size), split off a prerequisite task, or turn the story into phases. The
  coordinator decides within its mandate and records why in the parent's notes; anything that
  changes the goal or acceptance, or adds tier L work, goes to the user.

## Backlog.md facts

Probed on 2026-11-11 with `backlog.md` 1.55.3 on Windows, in a throwaway repository.

- `backlog init --defaults --agent-instructions agents --integration-mode cli` writes
  `backlog/config.yml` and appends a 24-line block to `AGENTS.md` that says to run
  `backlog instructions overview` first and never to edit task files directly. Its config captures
  the local `default_editor` path (`C:\WINDOWS\notepad.exe`), which must not be committed as-is.
- Files: `backlog/tasks/task-1 - Title.md`; subtasks `task-1.1 - ….md` with `parent_task_id`;
  drafts in `backlog/drafts/` as `DRAFT-n`. Promoting a draft gives it a new `TASK-n` ID, so
  dependencies on a draft ID break.
- Front matter: `id, title, status, assignee, labels, dependencies, priority, type, ordinal,
  parent_task_id, created_date, updated_date`. Types include `spike`. Body sections are fenced by
  markers (`SECTION:DESCRIPTION`, `AC`, `DOD`, `SECTION:PLAN`, `SECTION:NOTES`, final summary).
- `task edit` covers status, plan, `--append-notes`, `--check-ac`, `--final-summary`, dependencies.
  No stdin or file input.
- Cross-branch: on `main`, `task list` and `board export` show `main`'s copy of every task it has;
  a newer status on another branch does not show. Tasks that exist only on another branch appear on
  the board, and new IDs skip IDs taken on other branches.
- Windows: through `npx` (a `.cmd` shim) a multi-line `--description` is cut at the first newline
  and later options such as `--ac` are silently dropped. The native `backlog.exe` called from
  PowerShell keeps them.

## Items

Rows are in run order: run the first `ready` row. New items go at the end; ask the user before
moving a row. IDs never change. B, C and D change agent instructions, so they are tier L:
independent review, then the user's merge.

| ID | Title | Kind | Tier | UI | Depends on | Status | PR | Threads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | [Backlog.md setup for agents on Windows and in worktrees](items/A.md) | spike | S | no | – | backlog | | |
| B | [The `braid` skill: plan, story, grow, finish](items/B.md) | story | L | no | A | backlog | | |
| C | [Worker takes a Backlog.md task as its brief](items/C.md) | story | L | no | B | backlog | | |
| D | [Install, route and record the decision](items/D.md) | task | L | no | B, C | backlog | | |
| E | [Isolated flow check and the user's trial guide](items/E.md) | task | M | no | B, C | backlog | | |

## Open questions

1. Who merges S and M items into an epic branch: the coordinator (current `main`) or the user (your
   uncommitted draft of `braid-coordinate`)? Recommendation: the user for the MVP, then relax after
   the user's trial.
2. Is an `In Review` status worth a commit? The epic branch can show it; `main` can't before the
   merge. Recommendation: no status; an open PR is "in review".
3. Coordinator mandate on growth: may it add up to two subtasks or one prerequisite task of tier S
   or M without asking? Recommendation: yes, recorded in the parent's notes and in the next recap.
4. Epic 007 (standalone worker) also changes `braid-worker` and is in progress. Finish it first, or
   cancel it because `braid` story mode covers a single task without an epic? C waits on this.
5. Models for workers and reviewers: `BRAID.md` defaults, or the Astra/Sol medium override used for 006 and 007?
6. The braid CLI's own ledger (roadmap stages 1–5) also tracks items. D records Backlog.md as the
   item store for the skills and leaves the CLI as is; revisit the roadmap after the user's trial.
   Agree?

## Decisions

- 2026-11-11: Plan only. No workers until the user approves.
- 2026-11-11: Sequential MVP: one worker at a time, as D07 already requires.
- 2026-11-11: Keep `braid-coordinate` and `braid-worker` working; `braid` sits beside them until
  the user's trial shows it can replace the coordinator.
- 2026-11-11: User: do all technical and skill work once, check what can be checked in isolation,
  then the user tests on a real project in an isolated environment. E is a scripted flow check and
  a trial guide instead of an agent-run pilot.
- 2026-11-11: The plan was written in an `everix3` thread and handed over to a coordinator thread in
  the agento project (same model, Claude Opus 5.5), working in this worktree.
