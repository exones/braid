# BRAID-003/F checkpoint

Date: 2026-11-04. Task: integrate epic delivery, workspace ownership, and assignment locations. Role: worker. No controller.

## Checkout

Root `C:\worktrees\agento\item-braid-003-f-epic-workspaces`. Branch `item/braid-003-f-epic-workspaces`. Origin `https://github.com/exones/braid.git`. Startup HEAD `3b9e92b4c8686fef50ba177bfa9821dd8d9182cf` matched the packet. The commit that contains this file is the candidate head. This file does not name that SHA. Index at authoring: the policy files plus this checkpoint and `reports/F.md`.

## Read index

Assignment `assignments/F.md`, backlog F, execution policy, G operator reference including "What F can take", epic, current checkpoint, E acceptance, G report, report format, worker skill, T3 continuation, AGENTS, README, decisions, Agile, delivery, delegation, coordinator skill, assignment packet, directory map, handoff, epic/backlog/review templates.

## Completed

Policy is in the maintained authorities. Local validators, link/anchor check, and `git diff --check` passed on the dirty tree before commit. Details and the authored scenario trace are in [reports/F.md](../reports/F.md).

## Next action

If no pull request exists yet: commit the owned paths, push `HEAD` to `refs/heads/item/braid-003-f-epic-workspaces`, open one pull request into `epic/braid-003-worker-skill`, call `link_pull_request`, call `watch_pull_request`, and end the turn. If the push or pull request already exists, reuse it. Do not open a second pull request.

On a watch wake: pending checks end the turn; an in-scope failure is fixed and pushed; a green current head is confirmed with `gh run list --commit <head>` for both `push` and `pull_request`, then `unwatch_pull_request`, then one `t3_thread_send` to coordinator thread `8a3c206a-9192-498f-b90a-19b5bf807c8c`. Do not send twice for the same head.

Frozen set: push and pull_request, Ubuntu and Windows `verify`, Install dependencies, Verify, and Upload packed tarball successful. A post-green note of run IDs stays in the coordinator message. Do not commit a self-SHA supplement.

## Blockers

None at authoring. Review `F-epic-workspaces-and-assignments-review-001` and the human merge into the epic are coordinator actions after green. D stays stopped.
