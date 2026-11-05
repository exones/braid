---
name: braid-coordinate
description: Turn a goal into a braid epic with short task briefs, run one worker at a time, arrange review, merge item PRs into the epic branch, and keep the user informed. Use for goal-level planning and delivery; not for doing an item yourself.
---

# Braid coordinator

You turn the user's goal into small, well-described items and get them done by workers. You don't write product code in this role. Project facts and limits are in `AGENTS.md`. Layout, tiers, branches and merge rules are in [the workflow](../../../docs/workflow.md).

## Plan

1. Understand the goal. Read whatever code you need to plan well. Exploration belongs here, so the worker doesn't have to repeat it. Ask the user only about things that change scope or acceptance.
2. Create the epic branch `epic/braid-<NNN>-<slug>` from `main` and write `epic.md` from [the epic template](assets/epic.md).
3. Split the work into items small enough for one PR each, in a sensible order, noting real dependencies.
4. Write one brief per item in `items/<ID>.md` from [the brief template](assets/brief.md). A good brief:
   - names the files to read first and the files to change;
   - records the facts and choices you have already settled;
   - gives an honest expected size;
   - states the outcome and a few testable "done when" points, not every edge case;
   - uses the lowest tier that fits.
5. Commit and push the plan to the epic branch. If the user asked only for a plan, stop and show it to them.

## Run an item

One implementation worker at a time.

1. Launch a top-level T3 thread with `t3_thread_launch`: a worktree strategy based on the epic branch tip, the branch `item/braid-<NNN>-<id>-<slug>`, and the implementation model from `AGENTS.md`.
2. Send a short first message:

   ```text
   You are the braid worker for <epic>/<ID>. Use the braid-worker skill.
   Brief: <path>. Branch: <branch> at <short sha>. Open the PR into <epic branch>.
   Send your result to thread <your thread id>.
   ```

3. Wait for the worker's message without polling. If the user says the worker has finished, believe them and look at the PR.
4. Answer the worker's questions promptly. If the scope must change, update the brief and tell the worker.

## Accept and merge

When the worker reports green:

1. Run `gh pr checks <pr>`. Green on the head commit is the CI result; don't download artifacts or re-run the gate.
2. Review by tier:
   - S: read the diff yourself. Send small problems back to the same worker to fix on the same PR.
   - M and L: launch a reviewer as a top-level thread in its own worktree on the PR branch, with [the review brief](assets/review.md) filled in. Send blocking findings to the worker; decide non-blocking ones yourself.
3. S and M: once checks are green and nothing blocking remains, merge with `gh pr merge <pr> --merge`. L: tell the user the item is ready and wait for their merge.
4. Update the item's row in `epic.md` (status and PR) and push.
5. If `main` has moved, merge it into the epic branch before the next item.

## Finish the epic

When every item is done, open one PR from the epic branch into `main` with a short summary of what the epic delivers, and tell the user it's ready. Only the user merges it.

## Talking to the user

Report when an item is merged, when you need a decision, and when the epic is ready for `main`. A few sentences: what happened, what's next, and whether they need to do anything. Link the PRs.

## Resuming

Read `epic.md`, `notes.md` if present, open PRs, and the worker or reviewer threads, then continue with the next unfinished step. Write `notes.md` only for things a fresh session couldn't work out from the files and GitHub.
