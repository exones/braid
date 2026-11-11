---
name: braid
description: Plan a goal or a single task in Backlog.md, run one worker at a time, arrange review, hand each PR to the user to merge, and report. A story that grows becomes phases. Use for goal-level or single-task delivery in a repository that has a BRAID.md and Backlog.md; not for doing an item yourself.
---

# Braid coordinator

Turn the user's goal or task into Backlog.md tasks delivered by workers; don't write product code.

## Project facts

Read `BRAID.md` at the repository root first (`gate`, `main`, `backlog`, `ci`, `run`, `models`, and the Backlog.md invocation rule). Use `models.<role>.<kind>` if present, otherwise `models.<role>`; if neither exists, ask the user. Use any named skill. Use the exact provider, model and options; if unavailable, tell the user instead of substituting. When launching, state the model and its settings in one line. Follow the project's agent instructions (`AGENTS.md` or `CLAUDE.md`).

Layout, statuses, branches per case, tiers and failure modes are in [the workflow](references/workflow.md). Task fields and exact commands are in [the task template](assets/task.md).

If `backlog/config.yml` is missing, copy [backlog-config.yml](assets/backlog-config.yml) to it and set `project_name` (no `backlog init`; if `init` runs anyway, use `--agent-instructions none` with `EDITOR` and `VISUAL` unset). If `BRAID.md` is missing or lacks the Backlog.md facts, offer [the template](assets/braid-md.md) to the user; it is committed before workers launch. Check `backlog --version` prints `1.55.3`; if not, tell the user the install command from `BRAID.md`.

## Ground rules

- Call Backlog.md as `BRAID.md` says: plain `backlog` from pwsh 7 or bash, never `npx`, `backlog.cmd`, `cmd.exe` or Windows PowerShell 5.1. Markdown in single quotes; one argument per multi-line field. Never edit task files by hand, except to resolve a Git merge conflict in one. `AGENTS.md` gets no Backlog.md block.
- `backlog instructions` is written for a solo agent. Braid overrides six points (the rest, such as search first, testable criteria and archive, applies; read `backlog instructions <guide>`):
  1. Only the coordinator creates or restructures tasks; a worker proposes them.
  2. The coordinator sets `In Progress` on the item's branch; the worker doesn't self-assign.
  3. "Ask the user" for plans and follow-ups means the coordinator; routine plans don't wait. Growth follows the mandate below.
  4. The task's "Already decided" and "Start here" are context, not a plan; the worker writes the plan.
  5. Task files are never edited by hand (kept), except for a merge conflict.
  6. Done is set in the PR that completes the item (a story's PR into `main`, a subtask's PR into the epic, the epic's final PR for the parent), not after verification alone.
- Work in your own worktree. Never switch, reset or commit in the user's checkout. One writer per checkout.
- Every commit uses Conventional Commits; yours are `docs(backlog): …`, for example `docs(backlog): task-12.1 done, start task-12.2`.
- Commit task changes only at milestones: the plan; an item started (with its launch); an item done and the next started; a block, cancellation or growth decision; a task change a worker needs. PRs and threads show progress in between.
- Ask the user with the host's question tool if it has one, otherwise as numbered questions with lettered options and your recommendation. If an answer is a value such as a path, say where it will be stored. Keep working on whatever the answer doesn't block.
- Name threads `<repo> <task-id> <role>: <title>`, for example `chinese-trainer task-12.1 review: data model`.
- Never edit braid skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` unless the user asks; work that changes them is tier L. Don't publish, release, deploy or change repository settings unless the user asks.

## Plan

1. Understand the goal. Explore enough to plan without making workers repeat it. Ask the user only about things that change scope or acceptance.
2. Decide the shape. Work for one PR is a **story**: one task. Anything bigger, or with phases, is a **goal**: a parent task with subtasks, each small enough for one PR. Plan items that depend on a spike only roughly until it returns.
3. Draft the tasks from [the task template](assets/task.md): the lowest tier that fits, a few testable acceptance criteria, real dependencies only, ordinals in run order. Tasks, never drafts.
4. Show the user the plan (titles, kinds, tiers, order, dependencies, acceptance) and confirm it, in as many rounds as it takes, before committing anything.
5. Commit it. A story: create branch `item/<id>-<slug>` from `main` and the task on it (the task reaches `main` with the story's PR). A goal: branch `plan/<slug>` from `main`, create the parent and subtasks, push, open a planning PR into `main` and tell the user; merging it is the approval. After the merge, create `epic/<id>-<slug>` from `main`. If the user asked only for a plan, stop there.

## Run an item

One implementation worker at a time: the first of `backlog task list --plain --ready` on the base branch (the epic branch; for a story, its own task).

1. Start it. Create `item/<id>-<slug>` from the base tip (a story's already exists). In a temporary worktree set `backlog task edit <id> --status 'In Progress'`, commit, push, remove the worktree. Then launch a top-level T3 thread with `t3_thread_launch`: a worktree strategy on that branch at that commit, and the worker model for the item's kind.
2. Send a short first message:

   ```text
   You are the braid worker for <task-id>. Use the braid-worker skill.
   Brief: the Backlog.md task <task-id> (backlog task view <task-id> --plain). Branch: <branch> at <short sha>. Open the PR into <base branch>.
   Send your result to thread <your thread id>.
   ```

   If the worker might not find the skill by name, add the absolute path of its `SKILL.md`.
3. Wait for the worker's message without polling. If a worker or reviewer run fails or ends without a report, read its error and retry once with the same model and settings; if it fails again, ask the user, naming the error. If the user says the worker has finished, believe them and look at the PR.
4. Answer the worker's questions. If the scope must change, change the task on the item's branch and tell the worker.

## Grow

A worker that finds more work stops and sends you one proposal: **absorb** it (same PR, within about twice the expected size), split off a **prerequisite** task, or turn the story into **phases**. Decide:

- **Mandate.** You may add up to two subtasks or one prerequisite task of tier S or M without asking. Record why in the parent's notes (`--append-notes`) and in the next recap. A change to the goal or acceptance criteria, new tier L work, or anything past that goes to the user first; the worker waits at a clean point.
- **Absorb:** tell the worker; record it in the task's notes.
- **Prerequisite:** create the task (tier S or M) and make the story depend on it; tell the worker to note where it stopped. Run the prerequisite as a story into `main`; once it is merged, merge `main` into the story branch and resume the worker.
- **Phases:** have the worker note its state and stop. Create `epic/<id>-<slug>` at the story branch tip and push it. On it add the subtasks (`--parent`, ordinals, dependencies; the first says what is already done), keep the parent `In Progress`, and note why in its notes. Close the story's PR with a comment naming the epic branch. Start the subtasks one at a time as under "Run an item", with the epic branch as base.

## Accept and hand over

When the worker reports green:

1. Review by tier:
   - S: read the diff yourself. Send problems back, including small factual errors in docs, to the same worker to fix on the same PR.
   - M and L: launch an independent reviewer as a top-level thread in its own worktree on the PR branch with its model, any named skill, and [the review brief](assets/review.md). Send blocking findings to the worker; decide non-blocking ones yourself. For L, if blocking fixes substantially changed failure or recovery behavior, have the reviewer check the fix again. Use a fresh review task when the host requires it, never resume a delegated reviewer with `t3_thread_send`.
2. When nothing blocking remains, read the PR's checks once with `gh pr checks <pr>`, limited to the `ci` names in `BRAID.md`. If one failed, send the PR back to its worker; if some are still running, wait. When green on the latest commit, give the user the recap and wait for their merge. You don't merge item PRs, re-run the gate or download artifacts.
3. Once `gh pr list --state all` shows the PR merged, interrupt the worker's thread if still running (`t3_thread_interrupt`; for a delegated run `task_cancel`, never its child thread ID). Merge the base branch into your worktree and start the next item as one milestone commit; after the last subtask, finish. A stuck item: note why in the task. A dropped one: note why, then archive it. After a spike, turn its proposed follow-ups into tasks (or adjust existing ones) and tell the user what the answer changed.

## Fixes

- The worker that opened a PR fixes it: failed checks, review findings, anything else on that PR. Send the request to its existing thread with `t3_thread_send`, even if it has finished. Start a new worker on the same branch and task only if that thread can't continue.
- CI failing on an epic branch itself, or on its final PR, belongs to no worker. Add a tier S fix subtask at the end of the epic, with no dependencies, and run it like any other item.
- You don't fix product code yourself.

## Finish

A story is finished when the user merges its PR (it set Done). A phased item: when every subtask is Done on the epic branch, in a last commit set the parent Done and add a closing note, merge `main` in, open one PR epic → `main`, review it by the parent's tier, give the recap and wait for the user. Their merge marks it done: don't commit or open a PR after it.

## Talking to the user

When an item is merged, waiting for the user's merge, or blocked, give a recap based on the worker's final summary and checked against the diff:

```markdown
**<task-id>: <title>** — merged | ready for your merge | blocked. PR: <link>

**Done:** 1–5 bullets on what changed and what it means for the project.
**Decisions:** choices the task didn't settle, each with a one-line reason; growth decisions under the mandate. "None" if none.
**Deviations:** only if the work departed from the task: what and why.
**You:** only if the user must act: the exact steps, for example "merge PR <link>".
**Screenshots:** for `ui` items: the final screens, embedded as images from the worker's artifacts folder.
**Next:** the next item, or what you are waiting for.
```

## Resuming

Read `BRAID.md`, then rebuild the state from the repository and GitHub, not from chat: `git branch -r` and `gh pr list --state all` for plan, epic and item branches and their PRs; on the epic or story branch `backlog task list --plain` and `backlog task view <id> --plain` for statuses, notes and final summaries; the worker and reviewer threads for liveness. An item whose PR is merged is done. Continue with the next unfinished step. Put notes in the parent task only for what a fresh session couldn't work out from these.
