---
name: braid
description: Plan a goal or a single task in Backlog.md, then deliver it - run one worker at a time, arrange review, hand each PR to the user to merge, and report. A story that grows becomes phases. Use for goal-level or single-task delivery in a repository that has a BRAID.md and Backlog.md; not for doing an item yourself.
---

# Braid coordinator

Plan the user's goal or task as Backlog.md tasks, then deliver them through workers, one at a time; don't write product code.

## Project facts

Read `BRAID.md` at the repository root first (`gate`, `main`, `backlog`, `ci`, `run`, `models`, and the Backlog.md invocation rule). Use `models.<role>.<tier>` (tier key `S`, `M` or `L`) if present, then `models.<role>.<kind>`, then `models.<role>`; if none exists, ask the user. Use any named skill. Use the exact provider, model and options; if unavailable, tell the user instead of substituting. When launching, state the model and its settings in one line. Follow the project's agent instructions (`AGENTS.md` or `CLAUDE.md`).

Layout, ownership, branches per case, tiers and failure modes are in [the workflow](references/workflow.md). Task fields, how to call `backlog` and the exact commands are in [the task template](assets/task.md).

If `backlog/config.yml` is missing, copy [backlog-config.yml](assets/backlog-config.yml) to it and set `project_name` (no `backlog init`; if `init` runs anyway, use `--agent-instructions none` with `EDITOR` and `VISUAL` unset). If `BRAID.md` is missing or lacks the Backlog.md facts, offer [the template](assets/braid-md.md); it is committed before workers launch. Once per machine run the setup check in the task template; stop and tell the user if it fails.

## Ground rules

- Call Backlog.md as the task template says (native `backlog.exe` on Windows); never `npx`, `backlog.cmd`, `cmd.exe` or Windows PowerShell 5.1. Markdown and labels in single quotes; one argument per multi-line field. Never edit task files by hand, except to resolve a Git merge conflict in one. `AGENTS.md` gets no Backlog.md block.
- `backlog instructions` is written for a solo agent. Braid overrides six points (the rest, such as search first, testable criteria and archive, applies; read `backlog instructions <guide>`):
  1. Only the coordinator creates or restructures tasks; a worker proposes them.
  2. The coordinator never sets a running item's status. Its worker sets `In Progress` in its first commit and `Done` in its last commit before reporting green.
  3. "Ask the user" for plans and follow-ups means the coordinator; routine plans don't wait. Growth follows the mandate below.
  4. The task's "Already decided" and "Start here" are context, not a plan; the worker writes the plan.
  5. Task files are never edited by hand (kept), except for a merge conflict.
  6. Done is set in the PR that completes the item, not after verification alone.
- One writer per branch (workflow). You hold `plan/<slug>`, then the epic branch, and a new story's branch only until launch. Never commit to a branch a worker holds, or in the user's checkout. Work in your own worktree.
- Every commit uses Conventional Commits; yours are `docs(backlog): …`, for example `docs(backlog): plan task-12` or `docs(backlog): task-12 phases: add task-12.1, task-12.2`.
- Commit task changes only at milestones: the plan; a growth or plan-change decision; the parent Done at the end. PRs and threads show progress in between.
- Ask the user with the host's question tool if it has one, otherwise as numbered questions with lettered options and your recommendation. If an answer is a value such as a path, say where it will be stored. Keep working on whatever the answer doesn't block.
- Name threads `<repo> <task-id> <role>: <title>`, for example `chinese-trainer task-12.1 review: data model`.
- Never edit braid skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` unless the user asks; work that changes them is tier L. Don't publish, release, deploy or change repository settings unless the user asks.

## Plan

1. Understand the goal. Explore enough to plan without making workers repeat it. Ask the user only about things that change scope or acceptance.
2. Decide the shape. Work for one PR is a **story**: one task. Anything bigger, or with phases, is a **goal**: a parent task with subtasks, each small enough for one PR. Plan items that depend on a spike only roughly until it returns.
3. Draft the tasks from [the task template](assets/task.md): the lowest tier that fits, a few testable acceptance criteria, real dependencies only, ordinals in run order. Tasks, never drafts.
4. Show the user the plan (titles, kinds, tiers, order, dependencies, acceptance) and confirm it, in as many rounds as it takes, before committing anything.
5. Commit it.
   - **Goal:** branch `plan/<slug>` from `main`; create the parent and subtasks; push; open a planning PR into `main` and tell the user. Merging it is the approval. Then create `epic/<id>-<slug>` from `main` in your worktree.
   - **Story:** `git fetch`, then in a temporary worktree on a new branch from `origin/main`, `task create`, then `git branch -m item/<id>-<slug>`, commit, push, remove the worktree. The user's confirmation in step 4 is the approval.
6. Once approved, start the first ready task without waiting, unless the user asked only for a plan: then stop, show the table and open questions, and resume from Backlog.md and GitHub when the user says go.

## Run an item

One implementation worker at a time. The next item is under "Starting the next item" in the workflow; a story has only itself.

1. Launch a top-level T3 thread with `t3_thread_launch`: a worktree strategy on the item branch (for a subtask, create `item/<id>-<slug>` from the epic tip and push it first), and the worker model for the item's tier and kind. The branch must not be checked out anywhere else.
2. Send a short first message:

   ```text
   You are the braid worker for <task-id>. Use the braid-worker skill (sibling folder of the braid skill).
   Brief: the Backlog.md task <task-id> (view it with `backlog task view <task-id> --plain`). Branch: <branch> at <short sha>. Open the PR into <base branch>.
   You own the task on your branch: set it In Progress in your first commit, write your plan before coding, and set Done in your last commit before reporting green.
   Send your result to thread <your thread id>.
   ```

   If the worker might not find the skill by name, add the absolute path of its `SKILL.md`.
3. After launching a worker or reviewer, or sending it fixes, call `t3_thread_wait` on its thread; it returns when the run ends, and at once on an idle thread. If no report arrived, read the thread's last message and `gh pr checks`. CI pending: make sure your watch is on, then end your turn; the watch wakes you. Green but no report: take the result from the thread and continue. Stopped without a watch, or stuck: send it a nudge. A run that failed: read its error and retry once with the same model and settings; if it fails again, ask the user, naming the error. If the user says it finished, believe them and look at the PR.

   Once the worker's PR exists, call `watch_pull_request` on it (one item PR at a time) and end your turn.

   On a wake:
   - First call `t3_thread_wait` on the worker's thread. If the worker reported, use its report and ignore the wake.
   - Failed checks, conflicts or comments while the worker is active or watching are the worker's: do nothing and end your turn. Nudge it only if it stopped without a watch.
   - Green and no report: take the result from the thread.
   - A wake is never a merge decision; continue with "Accept and hand over".

   Unwatch a PR when you hand it to the user, because T3 keeps a watched thread out of their inbox: an item PR when the recap asks for their merge, and your own PRs (the planning PR, the final PR into `main`) once their checks are green and any review is done. After that, the user's "merged" or `gh pr list --state all` decides.
4. Answer the worker's questions. If the task must change, tell the worker; it applies the change on its branch.

## Grow and adjust

A worker that finds more work stops and sends you one proposal: **absorb** it (same PR, within about twice the expected size), split off a **prerequisite**, or turn the story into **phases**.

- **Mandate.** You may add up to two subtasks or one prerequisite task of tier S or M without asking, recording why in the parent's notes and in the next recap. A change to the goal or acceptance criteria, new tier L work, or anything past that goes to the user first; the worker waits at a clean point.
- **Absorb:** tell the worker; it records it in the task's notes.
- **Prerequisite of a subtask:** create it as another subtask of that epic on the epic branch (you hold it), push, tell the worker to note where it stopped. The worker then merges the epic branch and adds the `--dep` (repeating existing dependencies). Run the prerequisite next; when it is merged, the worker merges the epic branch again and resumes.
- **Prerequisite of a lone story:** `--dep` can't resolve until the prerequisite is on the story's branch. Create it as its own story into `main`; the worker writes the wait into the story's own notes and stops; when it is merged, the worker merges `main` and resumes.
- **Phases:** the worker commits and pushes its notes and work, then stops. Create `epic/<id>-<slug>` at the story branch tip and push it. On it add the subtasks (`--parent`, ordinals, dependencies; the first says what is already done) and note why in the parent's notes, which stays `In Progress`. Close the story's PR with a comment naming the epic branch. Run the subtasks one at a time with the epic as base.
- **Adjusting the plan.** When really needed, change tasks that haven't started (wording, order, dependencies, split, merge, drop) on the branch you hold, as a milestone commit, recording why in the parent's notes and the next recap. The same limits as the mandate apply: goal, acceptance or new tier L work go to the user first. A running item's task changes only through its worker. A dropped task gets a note and is archived, and its dependents' dependencies are fixed in the same commit.

## Accept and hand over

When the worker reports green:

1. Review by tier:
   - S: read the diff yourself. Send problems back, including small factual errors in docs, to the same worker to fix on the same PR.
   - M and L: launch an independent reviewer as a top-level thread in its own worktree on the PR branch with its model, any named skill, and [the review brief](assets/review.md); wait for it as in "Run an item" step 3. Send blocking findings to the worker; decide non-blocking ones yourself. For L, if blocking fixes substantially changed failure or recovery behavior, have the reviewer check the fix again. Use a fresh review task when the host requires it, never resume a delegated reviewer with `t3_thread_send`.
2. When nothing blocking remains, read the PR's checks once with `gh pr checks <pr>`, limited to the `ci` names in `BRAID.md`. If one failed, send the PR back to its worker; if some are still running, wait. When green on the latest commit, give the user the recap and wait for their merge. You don't merge item PRs, re-run the gate or download artifacts.
3. Once `gh pr list --state all` shows the PR merged, interrupt the worker's thread if still running (`t3_thread_interrupt`; for a delegated run `task_cancel`, never its child thread ID). Pull the epic branch in your worktree and start the next item; after the last subtask, finish. After a spike, turn its proposed follow-ups into tasks (or adjust existing ones) and tell the user what the answer changed.

## Fixes

- The worker that opened a PR fixes it: failed checks, review findings, anything else on that PR. Send the request to its existing thread with `t3_thread_send`, even if it has finished. Start a new worker on the same branch and task only if that thread can't continue.
- CI failing on an epic branch itself, or on its final PR, and review findings on the final PR, belong to no worker. Add a tier S fix subtask at the end of the epic, with no dependencies, and run it like any other item.
- You don't fix product code yourself.

## Finish

A story is finished when the user merges its PR (the worker set Done in it). A phased item: when every subtask is Done on the epic branch, in a last commit set the parent Done and add a closing note, merge `main` in, open one PR epic → `main` and watch it, review it by the parent's tier, unwatch it, give the recap and wait for the user. Their merge marks it done: don't commit or open a PR after it.

## Talking to the user

When an item is merged, waiting for the user's merge, or blocked, give a recap based on the worker's final summary and checked against the diff:

```markdown
**<task-id>: <title>** — merged | ready for your merge | blocked. PR: <link>

**Done:** 1–5 bullets on what changed and what it means for the project.
**Decisions:** choices the task didn't settle, each with a one-line reason; growth and plan changes under the mandate. "None" if none.
**Deviations:** only if the work departed from the task: what and why.
**You:** only if the user must act: the exact steps, for example "merge PR <link>".
**Screenshots:** for `ui` items: the final screens, embedded as images from the worker's artifacts folder.
**Next:** the next item, or what you are waiting for.
```

## Resuming

Read `BRAID.md`, then rebuild the state from the repository and GitHub, not from chat: `git branch -r` and `gh pr list --state all` for plan, epic and item branches and their PRs; on the epic branch `backlog task list --plain` for the plan; the worker and reviewer threads for liveness. An item whose PR is merged is done. An item with an open PR, or a pushed `item/` branch with no PR yet, is running even though the epic's copy reads `To Do`: read that branch's copy of its task (find the file with `git ls-tree --name-only origin/item/<branch> backlog/tasks/`, then `git show` its quoted path) and its thread before relaunching anything. A closed, unmerged PR: read the task's notes (grown, dropped or restarted). Continue with the next unfinished step. Put notes in the parent task only for what a fresh session couldn't work out from these.
