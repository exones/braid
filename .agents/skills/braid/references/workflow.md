# Braid workflow on Backlog.md

How work is organized in a project that uses braid with Backlog.md. Project values (gate, main branch,
models, `backlog` folder) come from `BRAID.md`; this file never overrides them. Task fields and
commands are in [the task template](../assets/task.md).

## Items are tasks

- An item is one Backlog.md task of any size. A story is one task and one PR. When it grows it gets
  subtasks (`TASK-12.1`, `TASK-12.2`): its phases. At most two levels. The parent carries the goal,
  scope and dated decisions (in its notes); subtasks carry the work. The parent's log, in its notes, has
  one entry per merged subtask, written before the next item starts; workers and a resuming coordinator read it.
- Kinds: **story** (a usable outcome, one PR), **task** (technical support work), **spike** (time-boxed
  question; the answer, evidence and proposed follow-ups are the final summary).
- Statuses are `To Do`, `In Progress`, `Done` only. There is no `In Review`: an open PR is in review.
  Blocked means a dependency isn't Done, or the notes say what it waits for. Cancelled means archived
  (`backlog task archive`) with the reason in its notes first.
- Run order is the ordinal, then dependencies.

## One writer per branch

Each branch has one writer, and its copy of a task is the truth on that branch.

- The **coordinator** holds `plan/<slug>` and `epic/<id>-<slug>`, and a new story's branch only until
  the worker is launched. It creates and restructures tasks there. Its own worktree is on `plan/<slug>`,
  then on the epic branch; for a lone story it holds no branch after launch.
- The **worker** holds its `item/<id>-<slug>` branch and owns that item's task on it: `In Progress` in
  its first commit, the plan before coding, notes, the acceptance criteria and Definition of Done boxes
  it proved, the final summary (the item's report), and `Done` in its last commit before reporting
  green. The coordinator never commits to a branch a worker holds. A change to a running item's task
  goes to the worker as a message; the worker applies it, and merges the epic branch first if the
  change needs something the coordinator added there.
- So a task changes on `main` or an epic branch only by merging a PR, and shows `Done` exactly when the
  work is merged. Nobody edits a task file by hand, except to resolve a Git merge conflict in one.

## Branches per case

`<id>` is the task ID in lowercase (`task-12`).

| Case | Branches | PRs | Tasks |
| --- | --- | --- | --- |
| Story | `item/<id>-<slug>` from `main` | one into `main` | created on the new branch before launch; the worker's PR sets Done |
| Planned goal | `plan/<slug>`, then `epic/<id>-<slug>` from `main`; each subtask `item/<subid>-<slug>` from the epic tip | planning PR into `main` (the approval); each subtask into the epic; one final PR epic → `main` | parent and subtasks created on `plan/` in one milestone; the parent In Progress in the epic's first commit; each subtask's PR sets it Done; the coordinator's last commit on the epic sets the parent Done |
| Grown story | `epic/<id>-<slug>` cut at the story branch tip | the story PR is closed; subtask PRs into the epic; one final PR into `main` | milestone and subtasks added on the epic branch; the parent stays In Progress until the final PR |

Merge `main` into an epic branch before the next item and before the final PR. Never rebase or
force-push shared branches. Every commit uses Conventional Commits.

What the board shows: `backlog board` and the browser show the current branch's copy of every task it
has, and for tasks it lacks the most progressed copy on other branches (the 1.55.3 default; the
config file has no key for it). A newer status on another branch never replaces the current branch's
copy. For what is running, read the item branch and `gh pr list`, not the board. A task that exists
only on an item branch shows that branch's status, so a finished item reads `Done` while its PR waits
for the user's merge; `main`'s own copy reads `Done` only after the merge.

The user looks at the board with `backlog browser` from their own checkout of `main`. An edit made in
the browser is saved to the checkout it runs from: in a worker's worktree that is a second writer on
the item branch. Tasks change through the coordinator and workers, as above.

## Starting the next item

Goal: on the epic branch, `task list --plain --ready -s 'To Do' -p <parent>`; take the first row that has
no open PR and no pushed `item/` branch without a PR, since a running task still reads `To Do` on the epic branch.
A row whose PR was closed unmerged follows "Resuming" in [the skill](../SKILL.md).
Story: there is no next item.

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
| A task is edited on two branches | Only the owning branch edits a task. Merge the other branch in, keep both sets of notes and the newest status, run `backlog doctor`. |
| A draft was promoted after something depends on it | Promotion gives a new ID, so don't plan with drafts. If one exists, re-point each dependent with `--dep` (repeating its other dependencies). |
| A worker ends without a report | If the PR is merged, the item is done. Else read the task's final summary and the PR; retry once with the same model and settings; then ask the user, naming the error. |
| The board shows `main`'s status, not the newest | Don't "fix" it. Read the item branch's task and the PR; statuses reach `main` by merge. |
| A merge conflict in a task file | Resolve it by hand (the one allowed hand edit): keep both sides' notes and plan, the more advanced status, the union of dependencies. Run `backlog doctor` and `backlog task view` before committing. |
| `--dep` says a task doesn't exist | Lookups read only the current branch. Create the prerequisite on the branch where the dependency must resolve, or merge the branch that has it. |
