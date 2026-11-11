---
name: braid-coordinate
description: Turn a goal into a braid epic with short task briefs, run one worker at a time, arrange review, merge item PRs into the epic branch, and keep the user informed. Use for goal-level planning and delivery in a repository that has a BRAID.md; not for doing an item yourself.
---

# Braid coordinator

Turn the user's goal into small items delivered by workers; don't write product code.

## Project facts

Read `BRAID.md` at the repository root first for its facts (`gate`, `main`, `epics`, `ci`, `run`, `models` and the optional ones). Before launching, require it committed at the epic tip workers inherit; if missing, ask the user to commit it to `main` or authorize your epic-only commit.

Use `models.<role>.<tier>` (tier key `S`, `M` or `L`) if present, then `models.<role>.<kind>`, then `models.<role>`; if none exists, ask the user. Use any named skill. Use the exact provider, model and options; if unavailable, tell the user instead of substituting. When launching, state the model and its settings in one line. Follow the project's agent instructions (`AGENTS.md` or `CLAUDE.md`).

Layout, tiers, branches and merges are in [the workflow](references/workflow.md).

## Ground rules

- Work in your own worktree on the epic branch. Never switch, reset or commit in the user's checkout.
- Every commit uses Conventional Commits; yours are `docs(epic): …`, for example `docs(epic): A done, start B`.
- Commit `epic.md` only at milestones: the plan; an item done, together with the items it unblocks, the next launch and its thread links; a block or cancellation; a settled decision or brief change, before a worker needs it. Anything else waits for the next milestone; PRs and threads show progress in between.
- Ask the user with the host's question tool if it has one, otherwise as numbered questions with lettered options and your recommendation. If an answer is a value such as a path, say where it will be stored. Keep working on whatever the answer doesn't block.
- Name threads `<repo> <epic>/<ID> <role>: <title>`, for example `chinese-trainer 001/B review: data model`.
- Never edit braid skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` unless the user asks; work that changes them is tier L. Don't publish, release, deploy or change repository settings unless the user asks.

## Plan

1. Understand the goal. Explore enough to plan without making workers repeat it. Ask the user only about things that change scope or acceptance.
2. Create the epic branch from `main` in your own worktree and write `epic.md` from [the epic template](assets/epic.md).
3. Split the work into stories, tasks and spikes (see the workflow), each small enough for one PR. Put the table rows in run order and fill "Depends on" with the IDs each item really needs first. Plan items that depend on a spike only roughly until it returns. Later items go at the end; ask before moving any row.
4. Write one brief per item in `items/<ID>.md` from [the brief template](assets/brief.md). Fill every section of the template, keep 'Done when' to a few testable points, mark `UI: yes` for new or noticeably changed user-facing UI, and use the lowest tier that fits.
5. Commit and push the plan to the epic branch. If the user asked only for a plan, stop and show them the item table and any open questions.

## Run an item

One implementation worker at a time, on the first `ready` row of the item table.

1. Set the item to `in-progress` and launch a top-level T3 thread with `t3_thread_launch`: a worktree strategy based on the epic branch tip, the item branch, and the worker model for the item's tier and kind.
2. Send a short first message:

   ```text
   You are the braid worker for <epic>/<ID>. Use the braid-worker skill.
   Brief: <path>. Branch: <branch> at <short sha>. Open the PR into <epic branch>.
   Send your result to thread <your thread id>.
   ```

   If the worker might not find the skill by name, add the absolute path of its `SKILL.md`; this skill folder's sibling `braid-worker` holds it.
3. After sending the first message, or fixes, call `t3_thread_wait` on the worker's thread; it returns when the run ends, and at once on an idle thread. When it returns and the PR exists, call `watch_pull_request` on it (one item PR at a time) and end your turn; otherwise wait for the worker's message without polling. If a worker or reviewer run fails or ends without a report, read its error and retry once with the same model and settings; if it fails again, ask the user, naming the error. If the user says the worker has finished, believe them and look at the PR.

   On a wake:
   - First call `t3_thread_wait` on the worker's thread. If the worker reported since you last sent it work, use its report and ignore the wake.
   - Failed checks, conflicts or comments while the worker is active or watching are the worker's: do nothing and end your turn. Nudge it only if it stopped without a watch.
   - Green and no report: take the result from the thread.
   - A wake is never a merge decision; continue with "Accept and merge".

   Unwatch a PR when you hand it to the user, because T3 keeps a watched thread out of their inbox: an L or `UI: yes` item PR when the recap asks for their merge, and the epic's PR into `main` once its checks are green. After that, the user's "merged" or `gh pr list --state all` decides. An S or M item PR you merge yourself is unwatched in "Accept and merge" step 3.
4. Answer the worker's questions. If the scope must change, update the brief and tell the worker.

## Accept and merge

When the worker reports green:

1. Review by tier:
   - S: read the diff yourself. Send problems back, including small factual errors in docs, to the same worker to fix on the same PR.
   - M and L: launch an independent reviewer as a top-level thread in its own worktree on the PR branch with its model, any named skill, and [review brief](assets/review.md). Send blocking findings to the worker; decide non-blocking ones yourself. For L, if blocking fixes substantially changed failure or recovery behavior, have the reviewer check the fix again. Use a fresh review task when the host requires it, never resume a delegated reviewer with `t3_thread_send`.
2. S and M without `UI: yes`: when nothing blocking remains, read the PR's checks once with `gh pr checks <pr>`; it only reads what CI reported, and it is what stops a red PR from being merged. Merge with `gh pr merge <pr> --merge` if every required check is green on the latest commit, or if `ci` is `none` and the worker's gate passed. If a check failed, send the PR back to its worker; if checks are still running, wait. Don't download artifacts or re-run the gate. L and `UI: yes`: give the user the recap, with screenshots of the final state for UI items, and wait for their merge.
3. Once merged, unwatch the item PR if still watched, interrupt the worker's top-level thread if still running (`t3_thread_interrupt`); for a delegated run use `task_cancel`, never its child thread ID. Set the item to `done` with its PR link, set newly unblocked items to `ready`, merge moved `main` into the epic branch before launching the next item, and commit all of that as one milestone. If an item gets stuck or dropped, set `blocked` or `cancelled` with the reason. After a spike, turn its proposed follow-ups into briefs or adjust existing ones, and tell the user what the answer changed.

## Fixes

- The worker that opened a PR fixes it: failed checks, review findings, anything else on that PR. Send the request to its existing thread with `t3_thread_send`, even if it has finished, so it keeps its context. Start a new worker on the same branch and brief only if that thread can't continue.
- CI failing on the epic branch itself, or on the epic's PR into `main`, belongs to no worker. Add a tier S fix item with the next unused letter at the end of the table, with no dependencies; ask the user before moving it first, and run it like any other item.
- You don't fix product code yourself.

## Finish the epic

When every item is done, set the epic's status to `ready for main` in a last commit, open one PR into `main`, watch it until its checks are green, then unwatch it and tell the user. Only the user merges it. The merge marks the epic done: don't commit or open a PR after it.

## Talking to the user

When an item is merged, waiting for the user's merge, or blocked, give them a recap in this format, based on the worker's final report and checked against the diff:

```markdown
**<ID>: <title>** — merged | ready for your merge | blocked. PR: <link>

**Done:** 1–5 bullets on what changed and what it means for the project.
**Decisions:** choices made that the brief didn't settle, each with a one-line reason. "None" if none.
**Deviations:** only if the work departed from the brief: what and why.
**You:** only if the user must act: the exact steps.
**Screenshots:** for `UI: yes` items: the final screens, embedded as images from the worker's artifacts folder.
**Next:** the next item, or what you are waiting for.
```

## Resuming

Read `BRAID.md`, `epic.md`, `notes.md` if present, open PRs, and the worker or reviewer threads, then continue with the next unfinished step. Write `notes.md` only for things a fresh session couldn't work out from the files and GitHub.

An item whose PR is merged (`gh pr list --state all`) is done.
