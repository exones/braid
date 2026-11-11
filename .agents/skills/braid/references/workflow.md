# Braid workflow on Backlog.md

How work is organized in a project that uses braid with Backlog.md. Project values (gate, main branch,
models, `backlog` folder) come from `BRAID.md`; this file never overrides them. The task fields and
commands are in [the task template](../assets/task.md).

## Items are tasks

- An item is one Backlog.md task of any size. A story is one task and one PR. When it grows it gets
  subtasks (`TASK-12.1`, `TASK-12.2`): its phases. At most two levels. The parent carries the goal,
  scope and dated decisions (in its notes); subtasks carry the work.
- Kinds: **story** (a usable outcome, one PR), **task** (technical support work), **spike** (time-boxed
  question; the answer, evidence and proposed follow-ups are the final summary).
- Statuses are `To Do`, `In Progress`, `Done` only. There is no `In Review`: an open PR is in review.
  Blocked means a dependency isn't Done, or the task's notes say why it waits. Cancelled means archived
  (`backlog task archive`) with the reason in its notes first.
- Run order is the ordinal, then dependencies. The next item is the first of
  `backlog task list --plain --ready` on the branch you coordinate from.
- Who writes what: the coordinator creates and restructures tasks and sets statuses on the branch it
  prepares for the item. The worker writes its plan before coding, appends notes, checks acceptance
  criteria it proved and writes the final summary: that is the item's report. Nobody edits a task file
  by hand, except to resolve a Git merge conflict in one.

## Where the files live

Each branch's copy of a task is the truth on that branch. A task changes on `main` only through a
merge, so `main` shows `Done` exactly when the work is merged. `backlog board` and `browser` show
`main`'s copy of every task `main` has and ignore newer statuses on other branches: for what is running,
read the item branch, `gh pr list` and the epic branch, not the board.

| Case | Branches | PRs | Task changes |
| --- | --- | --- | --- |
| Story | `item/<id>-<slug>` from `main` | one into `main` | created on the item branch with the work; the item's PR sets Done |
| Planned goal | `plan/<slug>`, then `epic/<id>-<slug>` from `main`; each subtask `item/<subid>-<slug>` from the epic tip | planning PR into `main` (the approval); each subtask into the epic; one final PR epic into `main` | parent and subtasks created on `plan/`; a subtask's PR sets it Done; the final PR sets the parent Done |
| Grown story | `epic/<id>-<slug>` cut at the story branch tip | the story PR is closed; subtask PRs into the epic; one final PR into `main` | subtasks added on the epic branch; the parent stays In Progress until the final PR |

`<id>` is the task ID in lowercase (`task-12`). A planned goal's parent task is the epic; it needs no
other file. Merge `main` into an epic branch before starting the next item and before the final PR.
Never rebase or force-push shared branches. Every commit uses Conventional Commits.

## Tiers

Every task has one `tier:` label; pick the lowest that fits.

| Tier | Typical work | Review |
| --- | --- | --- |
| S | Small script, doc, config, or contained fix | Coordinator reads the diff |
| M | Normal feature | Independent reviewer comments on the PR |
| L | Persistent data formats, crash or recovery behavior, release or publishing, security, any change to agent instructions (skills, `AGENTS.md`, `CLAUDE.md`, `BRAID.md`) | Independent reviewer, again after fixes that substantially change failure or recovery behavior; the task lists failure modes and required regression tests |

The user merges every item PR for now, whatever the tier. The tier decides the review before the
recap. A `ui` item's recap embeds final screenshots.

## Checks and reports

- The `gate` from `BRAID.md` passes before every PR. CI evidence is `gh pr checks` green on the PR's
  latest commit, limited to the `ci` names if listed; a required check that never reports isn't green.
  With `ci: none` the gate run is the evidence.
- The PR description says what changed, why, how it was checked and what is open. The worker's final
  summary in the task, its final chat report and the coordinator's recap say the same.

## Failure modes

| What happened | What to do |
| --- | --- |
| A worker proposes growth beyond the mandate (goal or acceptance change, new tier L work, more than two subtasks or one prerequisite) | Tell the worker to stop at a clean point and note where it is. Ask the user. Record the answer in the parent's notes. |
| A task is edited on two branches (for example a status set on `main` while its item branch is open) | Only the owning branch edits a task. Merge the other branch's change in, keep both sets of notes and the newest status, run `backlog doctor`. |
| A draft was promoted after something depends on it | Promotion gives a new ID. Don't plan with drafts. If one exists, re-point each dependent with `backlog task edit <id> --dep <new-id>`. |
| A worker ends without a report | If the PR is merged, the item is done. Else check the task's final summary and the PR; retry once with the same model and settings; then ask the user, naming the error. |
| The board shows `main`'s status, not the newest | Don't "fix" it. Read the branch's task and the PR; statuses reach `main` by merge. |
| A merge conflict in a task file | Resolve it by hand (the one allowed hand edit): keep both sides' notes and plan, the more advanced status, the union of dependencies. Run `backlog doctor` and `backlog task view` before committing. |
