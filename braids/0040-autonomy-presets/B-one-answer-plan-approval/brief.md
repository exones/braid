---
id: '0040/B'
title: "One answer approves the plan"
status: In Progress
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: []
order: 20
---

## Goal

Approving a goal's plan takes three answers today: approve the plan, merge the planning PR, say "go". In braid 0028 the planning PR waited 221 minutes for "merge it" after the plan was approved. After this strand one approval does all three: the coordinator merges the planning PR itself once its checks are green and starts the first strand. The plan also names its braid in the first line, so a wrong number is caught at once (in 0012 the user's "start 0010" ran 36 minutes before they corrected it to 0012).

Expected size: about 40 lines in 5 files.

## Start here

- `.agents/skills/braid/SKILL.md`, "Plan", steps 6 to 8, and "Run an item", step 4 (when the planning PR is unwatched).
- `.agents/skills/braid/references/workflow.md`, "Who merges" and the "Planned goal" row of "Branches per case".
- `docs/getting-started.md`, "Merging and auto mode".
- `docs/decisions.md`, D31: why the planning PR goes into the braid branch.

## Change

- `SKILL.md`, "Plan", step 6: the message that shows the plan starts with the braid's number and title, and so does the first message after a request to start or resume an existing braid.
- `SKILL.md`, "Plan", step 7, Goal: the user's approval of the plan is also the approval to merge the planning PR. After the squash and push, open the planning PR, watch it, and when its `ci` checks are green merge it yourself, pinned to the squashed commit (`gh pr merge <pr> --merge --match-head-commit <sha>`). If the PR holds anything but that commit, don't merge: show what changed and `braid ask`. Close the plan request with `braid answer` when the user approves, not at the merge.
- `SKILL.md`, "Plan", step 8: unchanged in meaning; "asked only for a plan" still stops before the start.
- `workflow.md`, "Who merges": a third case, the planning PR of a plan the user approved.
- `docs/getting-started.md` and `docs/decisions.md`: the same, with the reason.

## Already decided

- The planning PR changes only `braids/`, goes into the braid branch and never into `main`, so merging it under the plan's approval gives the coordinator nothing the user did not approve.
- The merge still waits for green checks; they pass in seconds on a `braids/`-only PR (D58).
- A story has no planning PR; nothing changes for it.

## Out of scope

- Which preset the plan runs on (0040/E adds that to the plan).
- Starting the next strand after a merge without a go (the preset's `continue`, 0040/E).

## Completion

- [x] "Plan" says the approval covers the planning PR's merge, pinned to the approved commit, and what to do when the PR holds more
- [x] The plan and the first message of a start or resume name the braid's number and title first
- [x] The workflow's "Who merges" and the two docs say the same
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

- SKILL.md "Plan" step 6: the plan message, and the first message after a request to start or resume an existing braid, opens with `<number> <title>`.
- SKILL.md "Plan" step 7, Goal: on approval `braid answer` the plan request (with the approval in the log), squash, push, open the planning PR, watch it; once its `ci` checks are green merge it pinned to the squashed commit; a head other than that commit stops the merge (show what changed, `braid ask`). Then unwatch, pull the braid branch, set In Progress.
- SKILL.md "Plan" step 8: wording kept, "start" now follows the merge; "Run an item" step 4: the planning PR is unwatched after the coordinator merged it, not handed to the user.
- workflow.md: "Who merges" gets the planning PR as a third case; the "Planned goal" row says the coordinator merges the planning PR under the plan's approval.
- docs/getting-started.md "Merging and auto mode" and docs/decisions.md: a new decision (D67; 0037 holds D66 on its branch), D31's "Its merge records the approval" reworded via a pointer, a decision-log line.
