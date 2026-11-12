---
name: braid
description: Plan a goal or a single task in Backlog.md, then deliver it - run one worker at a time, arrange review, hand each PR to the user to merge (unless they ask braid to, or auto mode merges a subtask into the epic; never a story or the final PR into main), and report. A story that grows becomes phases. Use for goal-level or single-task delivery in a repository that has a BRAID.md and Backlog.md; not for doing an item yourself.
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
  2. The coordinator never sets a running item's status. Its worker sets `In Progress` in its first commit and `Done` in its last commit before reporting green. Only a goal's parent is the coordinator's: `In Progress` in the epic branch's first commit, `Done` at the end.
  3. "Ask the user" for plans and follow-ups means the coordinator; routine plans don't wait. Growth follows the mandate below.
  4. The task's "Already decided" and "Start here" are context, not a plan; the worker writes the plan.
  5. Task files are never edited by hand (kept), except for a merge conflict.
  6. Done is set in the PR that completes the item, not after verification alone.
- One writer per branch (workflow). You hold `plan/<slug>`, then the epic branch, and a new story's branch only until launch. Never commit to a branch a worker holds, or in the user's checkout. Work in your own worktree.
- Every commit uses Conventional Commits; yours are `docs(backlog): …`, for example `docs(backlog): plan task-12` or `docs(backlog): task-12 phases: add task-12.1, task-12.2`.
- Commit task changes only at these points: the plan and its review rounds; the parent In Progress in the epic's first commit after the planning merge; auto mode on or off; a growth or plan-change decision; a log entry; the parent Done at the end. PRs and threads show progress in between.
- Ask the user with the host's question tool if it has one, otherwise as numbered questions with lettered options and your recommendation. If an answer is a value such as a path, say where it will be stored. Keep working on whatever the answer doesn't block.
- Name threads `<repo> <task-id> <role>: <title>`, for example `chinese-trainer task-12.1 review: data model`.
- Never edit braid skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` unless the user asks; work that changes them is tier L. Don't publish, release, deploy or change repository settings unless the user asks.

## Plan

1. Understand the goal. Explore enough to plan without making workers repeat it. Ask the user only about things that change scope or acceptance.
2. Decide the shape. Work for one PR is a **story**: one task. Anything bigger, or with phases, is a **goal**: a parent task with subtasks, each small enough for one PR. Plan items that depend on a spike only roughly until it returns.
3. Draft the tasks from [the task template](assets/task.md): the lowest tier that fits, a few testable acceptance criteria, real dependencies only, ordinals in run order, an `ask:<key>` label for each [stop case](references/stop-cases.md) the plan already shows. Tasks, never drafts.
4. Create them as real tasks and commit locally; push nothing yet. **Goal:** in your worktree on `plan/<slug>` from `main`, with the goal's milestone (task template) on the parent and every subtask. **Story:** `git fetch`, then in a temporary worktree on a new branch from `origin/main`, `task create`, then `git branch -m item/<id>-<slug>`. Show the user the plan (titles, kinds, tiers, order, dependencies, acceptance, `ask:` labels) with links to the task files.
   - Each round of the user's comments is one local commit, `docs(backlog): <id> amend: <what>`. Check `git diff` first so that only the intended lines changed, then tell the user briefly what changed (no pasted diff).
5. On approval, squash the commits into one `docs(backlog): plan <id>` (`git reset --soft <commit the branch was cut from>`, then commit) and push once.
   - **Goal:** first create and push `epic/<id>-<slug>` from `main`, then open the planning PR from `plan/<slug>` into it and tell the user; merging it records the approval, and `main` gets the tasks with the final PR. Then pull the epic branch in your worktree and set the parent `In Progress` in its next commit.
   - **Story:** remove the temporary worktree; the worker starts on that branch.
6. Once approved, start the first ready task without waiting, unless the user asked only for a plan: then stop, show the table and open questions, and resume from Backlog.md and GitHub when the user says go.

## Run an item

One implementation worker at a time. The next item is under "Starting the next item" in the workflow; a story has only itself.

1. Create the worker's worktree yourself with `git worktree add <folder> <item branch>` (for a subtask, first create `item/<id>-<slug>` from the epic tip and push it). The branch must not be checked out anywhere else. Then launch a top-level T3 thread with `t3_thread_launch` on that existing worktree (`existing_worktree`), with the worker model for the item's tier and kind. A launch option that creates the branch fails with `branch_already_exists`, because the pushed branch is already in the local repository.
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
   - First call `t3_thread_wait` on the worker's thread. If the worker reported since you last sent it work, use its report and ignore the wake.
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
- **Phases:** the worker commits and pushes its notes and work, then stops. Create `epic/<id>-<slug>` at the story branch tip and push it. On it create the goal's milestone and add the subtasks (`--parent`, `--milestone`, ordinals, dependencies; the first says what is already done), put the parent in the milestone, and note why in the parent's notes, which stays `In Progress`. Close the story's PR with a comment naming the epic branch. Run the subtasks one at a time with the epic as base.
- **Adjusting the plan.** When really needed, change tasks that haven't started (wording, order, dependencies, split, merge, drop) on the branch you hold, as one commit, recording why in the parent's notes and the next recap. The same limits as the mandate apply: goal, acceptance or new tier L work go to the user first. A running item's task changes only through its worker. A dropped task gets a note and is archived, and its dependents' dependencies are fixed in the same commit.

## Accept and hand over

When the worker reports green:

1. Review by tier:
   - S: read the diff yourself (in auto mode, review it as for M). Send problems back, including small factual errors in docs, to the same worker to fix on the same PR.
   - M and L: launch an independent reviewer as a top-level thread in its own worktree, detached at the PR's head commit (`git worktree add --detach <folder> <sha>`, since the worker's worktree holds the branch), with its model and this first message (add the `SKILL.md` path if needed, as for workers); wait for it as in "Run an item" step 3. Send blocking findings to the worker; decide non-blocking ones yourself. For L, if blocking fixes substantially changed failure or recovery behavior, have the reviewer check the fix again, adding `Re-check: review the commits since <sha>.` to its first message. Use a fresh review task when the host requires it, never resume a delegated reviewer with `t3_thread_send`.

     ```text
     You are the braid reviewer for <task-id>. Use the braid-reviewer skill (sibling folder of the braid skill).
     PR: <url>, head commit <sha>. Focus: <what matters most here>.
     Send your result to thread <your thread id>.
     ```
2. When nothing blocking remains, run the diff facts in [stop cases](references/stop-cases.md) and judge them against the cases. Read the PR's checks once with `gh pr checks <pr>`, limited to the `ci` names in `BRAID.md`. If one failed, send the PR back to its worker; if some are still running, wait. When green on the latest commit, give the user the recap and wait for their merge, or, when auto mode is on, merge it yourself under "Auto mode". Otherwise you merge only under "Merge on request"; you don't re-run the gate or download artifacts.
3. Once `gh pr list --state all` shows the PR merged, interrupt the worker's thread if still running (`t3_thread_interrupt`; for a delegated run `task_cancel`, never its child thread ID), and remove the worktrees you created for the item; if Windows refuses to delete a folder, a program such as `backlog browser` is probably still running in it, so ask the user to stop it. For a goal, pull the epic branch in your worktree, append the parent's log entry (task template) and commit it, then fix any task that hasn't started and that the entry makes wrong, as in "Adjusting the plan". Then start the next item; after the last subtask, finish. After a spike, turn its proposed follow-ups into tasks (or adjust existing ones) and tell the user what the answer changed.

## Merge on request

When the user asks you to merge a named PR, or says "merge it" right after a recap that handed one over, merge it in any mode: `gh pr merge <pr> --merge --match-head-commit <head commit of your last recap of it>`. If you haven't recapped it, or its head has moved since, show what changed and ask. Then continue with step 3 of "Accept and hand over".

## Auto mode

When the user asks, for one goal, you merge its subtask PRs into the epic branch yourself. Refuse, with the reason, if `BRAID.md` lacks `auto: allowed`, if `ci` is `none`, or for a story (its PR goes into `main`). Switch on with `--add-label auto` and a dated note on the parent, as one commit on the epic branch; "stop auto" or "pause" removes them the same way (`--remove-label auto`, a note).

- Merge only when all hold: (1) the worker reported green; (2) on the PR branch the task is Done with every acceptance criterion and Definition of Done box checked; (3) an independent `braid-reviewer` review found nothing blocking, and for tier L any re-check is finished; (4) `gh pr checks` is green on the head commit for the `ci` names; (5) the PR is mergeable and its base is the epic branch; (6) `Needs the user: none` from all four sources: plan labels, worker, reviewer, diff facts; (7) the head is the reviewed commit, and you merge it with `gh pr merge <pr> --merge --match-head-commit <sha>`.
- Before merging, post a PR comment with the commit, the review link, the checks, the four Needs the user sources and "merged by braid auto mode". After the merge, tell the user in one line, do step 3 of "Accept and hand over", and before the next item wait until the epic branch's CI is green on the merge commit (`gh run list --commit <sha>`). Red: a fix subtask as in "Fixes"; a second red is a stop (`quality`).
- Stop on any stop case, on more than 2 blocking review rounds, and when branch protection refuses the merge (never `--admin` or another bypass). On a stop: don't merge, unwatch the PR, give the recap naming the case and its source, and wait. Record the user's answer in the parent's notes; their "merge" is a merge on request.
- The final PR epic → `main` is always the user's to merge.

## Fixes

- The worker that opened a PR fixes it: failed checks, review findings, anything else on that PR. Send the request to its existing thread with `t3_thread_send`, even if it has finished. Start a new worker on the same branch and task only if that thread can't continue.
- CI failing on an epic branch itself, or on its final PR, and review findings on the final PR, belong to no worker. Add a tier S fix subtask at the end of the epic, with no dependencies, and run it like any other item.
- You don't fix product code yourself.

## Finish

A story is finished when the user merges its PR (the worker set Done in it). A phased item: when every subtask is Done on the epic branch, in a last commit set the parent Done and add a closing note, merge `main` in, open one PR epic → `main` and watch it, review it by the parent's tier, unwatch it, give the recap and wait for the user. Their merge marks it done: don't commit or open a PR after it.

## Talking to the user

When an item is merged, waiting for the user's merge, or blocked, give a recap based on the worker's final summary and checked against the diff; record the user's answers on stop cases in a goal's parent log:

```markdown
**<task-id>: <title>** — merged | ready for your merge | blocked. PR: <link> at <head commit>

**Done:** 1–5 bullets on what changed and what it means for the project.
**Decisions:** choices the task didn't settle, each with a one-line reason; growth and plan changes under the mandate. "None" if none.
**Deviations:** only if the work departed from the task: what and why.
**Needs the user:** `none`, or per case `<key> (<source>): <one sentence>`; the source is plan, worker, reviewer or facts.
**You:** only if the user must act: the exact steps, for example "merge PR <link>".
**Screenshots:** for `ui` items: the final screens, embedded as images from the worker's artifacts folder.
**Next:** the next item, or what you are waiting for.
```

## Resuming

Read `BRAID.md`, then rebuild the state from the repository and GitHub, not from chat: `git branch -r`, local `plan/` and `item/` branches not yet pushed, and `gh pr list --state all` for plan, epic and item branches and their PRs; the parent's log; on the epic branch `backlog task list --plain` for the plan; the worker and reviewer threads for liveness. An item whose PR is merged is done. An item with an open PR, or a pushed `item/` branch with no PR yet, is running even though the epic's copy reads `To Do`: read that branch's copy of its task (find the file with `git ls-tree --name-only origin/item/<branch> backlog/tasks/`, then `git show` its quoted path) and its thread before relaunching anything. A closed, unmerged PR: grown if it is the branch's only PR and `epic/<same id>` exists (continue there as phases; the old branch is history); dropped if the task is archived; otherwise read the task's notes on that branch, then relaunch or ask the user. An `auto` label on the parent means continue in auto mode. Continue with the next unfinished step. Beyond the log, put notes in the parent task only for what a fresh session couldn't work out from these.
