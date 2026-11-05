---
name: braid-coordinate
description: Turn a goal into a braid epic with short task briefs, run one worker at a time, arrange review, merge item PRs into the epic branch, and keep the user informed. Use for goal-level planning and delivery in a repository that has a BRAID.md; not for doing an item yourself.
---

# Braid coordinator

You turn the user's goal into small, well-described items and get them done by workers. You don't write product code in this role.

## Project facts

Read `BRAID.md` at the repository root first. It gives the `gate` command, the `main` branch, the `epics` folder, the `ci` checks, how to `run` the app, and `models`: who runs each role.

To pick a model for an item, use `models.<role>.<kind>` if it exists (for example `worker.spike`), otherwise `models.<role>`. If the entry names a `skill:`, tell that agent to use the skill. Use the exact provider, model and options; if the host doesn't offer them, tell the user instead of substituting. If it is missing, stop and ask the user for it; you may propose one from [the template](assets/braid-md.md), but the user decides its content. Also follow the project's own agent instructions (`AGENTS.md` or `CLAUDE.md`).

Layout, tiers, branches and merge rules are in [the workflow](references/workflow.md).

## Plan

1. Understand the goal. Read whatever code you need to plan well. Exploration belongs here, so the worker doesn't have to repeat it. Ask the user only about things that change scope or acceptance.
2. Create the epic branch from `main` and write `epic.md` from [the epic template](assets/epic.md).
3. Split the work into stories, tasks and spikes (see the workflow), each small enough for one PR. Put the table rows in run order and fill "Depends on" with the IDs each item really needs first. Use a spike when something must be learned before it can be planned or estimated, and plan the items that depend on its answer only roughly until it returns.
4. Write one brief per item in `items/<ID>.md` from [the brief template](assets/brief.md). A good brief:
   - names the files to read first and the files to change;
   - records the facts and choices you have already settled;
   - gives an honest expected size;
   - states the outcome and a few testable "done when" points, not every edge case;
   - states its kind and uses the lowest tier that fits;
   - for a spike, states the question, the time box and the decision the answer feeds.
5. Commit and push the plan to the epic branch. If the user asked only for a plan, stop and show them the item table and any open questions.

## Run an item

One implementation worker at a time, on the first `ready` row of the item table. Keep each item's status in `epic.md` current as the [workflow](references/workflow.md) describes; a status change is a small commit pushed on the epic branch.

1. Set the item to `in-progress` and launch a top-level T3 thread with `t3_thread_launch`: a worktree strategy based on the epic branch tip, the item branch, and the worker model for the item's kind.
2. Send a short first message:

   ```text
   You are the braid worker for <epic>/<ID>. Use the braid-worker skill.
   Brief: <path>. Branch: <branch> at <short sha>. Open the PR into <epic branch>.
   Send your result to thread <your thread id>.
   ```

   If the worker might not find the skill by name, add the absolute path of its `SKILL.md`; this skill folder's sibling `braid-worker` holds it.
3. Wait for the worker's message without polling. If the user says the worker has finished, believe them and look at the PR.
4. Answer the worker's questions promptly. If the scope must change, update the brief and tell the worker.

## Accept and merge

When the worker reports green:

1. Set the item to `in-review` with the PR link.
2. Review by tier:
   - S: read the diff yourself. Send small problems back to the same worker to fix on the same PR.
   - M and L: launch a reviewer as a top-level thread in its own worktree on the PR branch, using the reviewer model (and skill, if named) for the item's kind, with [the review brief](assets/review.md) filled in. Send blocking findings to the worker; decide non-blocking ones yourself.
3. S and M: when nothing blocking remains, read the PR's current check results once with `gh pr checks <pr>`. It only reads what CI already reported; it runs nothing. Epic branches aren't protected, so this read is what keeps a red or changed PR from being merged. If every required check is green on the latest commit, merge with `gh pr merge <pr> --merge`. Don't download artifacts or re-run the gate. L: tell the user the item is ready and wait for their merge.
4. Once merged, set the item to `done`, and any items whose dependencies are now met to `ready`, then push. If an item gets stuck or dropped, set `blocked` or `cancelled` with the reason. After a spike, turn its proposed follow-ups into briefs or adjust existing ones, and tell the user what the answer changed.
5. If `main` has moved, merge it into the epic branch before the next item.

## Finish the epic

When every item is done, open one PR from the epic branch into `main` with a short summary of what the epic delivers, and tell the user it's ready. Only the user merges it.

## Talking to the user

The user mostly follows you, not the workers. When an item is merged, waiting for the user's merge, or blocked, give them a recap in this format, based on the worker's final report and checked against the diff:

```markdown
**<ID>: <title>** — merged | ready for your merge | blocked. PR: <link>

**Done:** 1–5 bullets on what changed and what it means for the project.
**Decisions:** choices made that the brief didn't settle, each with a one-line reason. "None" if none.
**Deviations:** only if the work departed from the brief: what and why.
**You:** only if the user must act: the exact steps.
**Screenshots:** only for UI work: the worker's key screens.
**Next:** the next item, or what you are waiting for.
```

Also tell the user, in a few sentences, when you need a decision and when the epic is ready for `main`.

## Limits

- Never edit braid skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` unless the user asks. Work that changes them is tier L.
- Don't publish, release, deploy or change repository settings unless the user asks.

## Resuming

Read `BRAID.md`, `epic.md`, `notes.md` if present, open PRs, and the worker or reviewer threads, then continue with the next unfinished step. Write `notes.md` only for things a fresh session couldn't work out from the files and GitHub.
