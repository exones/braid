# 008: one `braid` skill on Backlog.md, sequential MVP

Status: in-progress.
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
releases; unattended epic mode (see "Later ideas").

## Later ideas

Recorded for later epics; nothing here changes 008. The go rule and the merge rules change only
after the user's trial of `braid`.

**Unattended epic mode** (a later epic, after the trial). Goal: a whole epic runs without the user
up to the epic branch. Today the stops are rules, not tooling: the explicit go before each launch,
the user merging tier L items, and questions only the user can answer. The coordinator is already
event-driven (delegate results and PR watches wake it).

- Opt-in: a `BRAID.md` fact such as `autonomy: epic`, so projects like Everix (develop vs
  staging) don't get it by default.
- Next item: starts automatically after the previous one merges.
- Item merge into the epic branch: the coordinator merges only when CI is green and the
  independent reviewer (Opus 5.5 high, `code-review`) approves with no blocking findings.
- Epic branch into `main`: still the user, the single human checkpoint.
- Questions or blocks: park the item under "Blocked on human", carry on with items that don't
  depend on it, and stop when nothing can run.
- Stop when: 2 failed review rounds on one item; no wake event for about 2 hours (a fallback timer
  covers a worker thread that dies silently); or a budget is exceeded.
- Report: a push notification at the end or on a stop, plus the run report.
- Check: GitHub branch protection on epic branches must not require approvals the coordinator
  can't give.
- Claude Code `/goal` doesn't fit the coordinator: T3 delegates aren't harness background tasks,
  so it would force empty turns or polling. It may fit workers, with the done-condition "gate
  passes, PR into the epic branch, CI green, report sent". Try it during the trial; it needs auto
  mode or allowlisted commands, and a check that a `/goal` sent as a T3 thread's first message
  works.

## Design

- **One item type.** A Backlog.md task is an item of any size. A story is one task and one PR.
  When it grows, it gets subtasks (`TASK-12.1`, `TASK-12.2`): its phases. The parent task carries
  the goal, scope and dated decisions that `epic.md` carries today. At most two levels.
- **Task = brief.** Description: goal, start here, already decided, out of scope, expected size.
  Acceptance criteria: done when. Definition of Done: the project defaults (gate, green checks).
  Labels: `kind:story|task|spike`, `tier:S|M|L`, `ui`. Dependencies: real prerequisites only.
  Ordinal: run order.
- **Who writes what.** One writer per branch. The coordinator creates and restructures tasks on
  the branches it holds (`plan/`, `epic/`, a new story's branch before launch). The worker owns its
  item's task on its item branch: In Progress in its first commit, the plan before coding, notes,
  checked acceptance criteria, the final summary (the item's report) and Done in its last commit.
  A change to a running item's task goes to the worker as a message.
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
| A | [Backlog.md setup for agents on Windows and in worktrees](items/A.md) | spike | S | no | – | done | [#37](https://github.com/exones/braid/pull/37) | [worker](<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/mcp:launch:d5733cf25bdf8a6bc1858bce977e84c409fc583907988ce92602853b3a54c7f0>) |
| B | [The `braid` skill: plan, story, grow, finish](items/B.md) | story | L | no | A | done | [#38](https://github.com/exones/braid/pull/38) | [worker](<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/mcp:launch:21ec4c3068da4b6b55139b6a5253d31b7cf0bbddbdadf9fea28f4d36d0f6de54>), [review](<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/mcp:launch:e1be9dd17845bc71791f0e56847cc8a69fe6cf0c64c282ba6e15d7918c4ab5d1>) |
| C | [Worker takes a Backlog.md task as its brief](items/C.md) | story | L | no | B | done | [#39](https://github.com/exones/braid/pull/39) | [worker](<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/mcp:launch:3814533af59fc06ef0a046878fb22147602d3b445be62388c1664d83e9950ba4>), [review](<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/mcp:launch:15b14cb84fefd8168cab17b58a42abc0f77cccca7e999208919fbe331a2f8ae4>) |
| D | [Install, route and record the decision](items/D.md) | task | L | no | B, C | in-progress | | |
| E | [Isolated flow check and the user's trial guide](items/E.md) | task | M | no | B, C | done | [#41](https://github.com/exones/braid/pull/41) | [worker](<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/mcp:launch:e843f7cdb573e7af30b790bcf629ee5e8346bd60c23ca883e59e1eb0a6e483c0>), [review](<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/mcp:launch:7652043fef3544b50b825e1e5bb8a47c75d43a8a654548865f91ed7e28362e82>) |
| F | [Model per tier and a PR watch for the coordinator](items/F.md) | task | L | no | B | done | [#40](https://github.com/exones/braid/pull/40) | [worker](<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/mcp:launch:461a4ae9be4cd25f68f4a6730f92f6f7af49a77a25ddfce8a5302c7600198e31>), [review](<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/mcp:launch:71e897dfc065f42837266dca9554176407f1af0d5726936e8027c60219027596>) |

## Decisions

- 2026-11-11: Plan only. No workers until the user approves.
- 2026-11-11: User answers to the planning questions:
  - Item merges under `braid`: the user merges every item PR into an epic branch, S and M too, for
    the MVP; relax after the trial. (This epic itself still runs on `braid-coordinate`'s rules.)
  - No `In Review` status: an open PR is "in review".
  - Growth mandate: the coordinator may add up to two subtasks or one prerequisite task of tier S
    or M without asking, recorded in the parent's notes and the next recap. A change to the goal or
    acceptance criteria, or new tier L work, goes to the user.
  - Epic 007 is parked: its branch and PR #35 stay untouched, C builds on `main`'s `braid-worker`,
    and 007 is revisited after the trial.
  - The braid CLI ledger stays as it is; D30 records Backlog.md as the item store for the skills,
    and the roadmap is revisited after the trial.
  - Models: not PR #36. `BRAID.md` on this branch sets `Claude_Everix` models: coordinator
    `claude-opus-5-5` effort high; worker `claude-sonnet-5-5` effort medium; spikes (researcher)
    `claude-opus-5-5` effort medium; reviewer `claude-opus-5-5` effort high with the `code-review`
    skill. They reach `main` with this epic. `AGENTS.md` "Providers and roles" says the same.
- 2026-11-11: User approved the plan. Launch A; the coordinator merges A (tier S) after reading
  the diff, the user merges B, C and D, and E (tier M) follows `braid-coordinate`'s rules.
- 2026-11-11: A merged (#37). Its invocation rule, committed config, the six overrides of
  `backlog instructions` and two more failure modes went into B's brief; the setup rule into D's.
- 2026-11-11: B's review (8 blocking findings) showed plain `backlog` through the `.ps1` shim cuts
  multi-line text under a Node shim such as Volta; the native `backlog.exe` keeps it. A's
  invocation rule is superseded by the one B's skill states. One writer per branch: the worker,
  not the coordinator, sets its own task In Progress and Done on its item branch (Design, "Who
  writes what"). The skill also gets an explicit step from plan to run and a rule for adjusting the
  plan mid-run (the user's questions).
- 2026-11-11: B merged by the user (#38) after two review rounds. The coordinator now waits on
  worker and reviewer runs with `t3_thread_wait`: a worker in B's first fix round ended without
  re-watching its PR and never reported. C's brief adds the re-watch rule and the worker's part of
  growth, invocation and Done from the merged skill.
- 2026-11-11: User: workers and reviewers stay top-level threads. Tier L workers use Opus 5.5
  medium (`models.worker.L` in `BRAID.md`, applied from D on); others Sonnet 5.5 medium. F adds
  the tier key and a coordinator PR watch (an idle worker waiting for CI can't be waited on with
  `t3_thread_wait`) to both coordinator skills, at the user's request.
- 2026-11-11: C merged by the user (#39). D's brief records the routing the user agreed: the user
  talks only to `braid`; `braid-worker` belongs to launched worker threads.
- 2026-11-11: D's launch was stopped at once: the user had asked what D is, not approved it. The
  coordinator launches the next item only after the user says go.
- 2026-11-11: User: start F next, before D and E. F's brief adds watching per subitem and on the
  coordinator's own PRs.
- 2026-11-11: F merged by the user (#40). D's brief now also updates D29 for the tier key.
- 2026-11-11: User: run E next, then D. E's trial guide assumes D's installer change.
- 2026-11-11: Sequential MVP: one worker at a time, as D07 already requires.
- 2026-11-11: Keep `braid-coordinate` and `braid-worker` working; `braid` sits beside them until
  the user's trial shows it can replace the coordinator.
- 2026-11-11: User: do all technical and skill work once, check what can be checked in isolation,
  then the user tests on a real project in an isolated environment. E is a scripted flow check and
  a trial guide instead of an agent-run pilot.
- 2026-11-11: The plan was written in an `everix3` thread and handed over to a coordinator thread in
  the agento project (same model, Claude Opus 5.5), working in this worktree.
