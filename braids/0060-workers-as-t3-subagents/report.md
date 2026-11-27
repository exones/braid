Workers now run as T3 subagents of their coordinator (`delegate_task`), as reviewers and researchers already did.

- **0060/A, `braid launch` (#311):** one call prepares each launch. For a worker, reviewer or researcher it checks the limits (exit 3 starts nothing), starts a worker's branch without a worktree (`braid start --no-worktree`), resolves the model and title from BRAID.md and writes the first message. It prints the `delegate_task` input. `--child <thread>` records the child in `.braid/reviews.json` with a `role`; no new state file.
- **0060/B, the board and status (#315):** the board, `braid status`, the stall and limit counts, the snapshot 0074/C builds pause targets from, and `braid accept` see a recorded worker child while T3 says it runs. Every recorded child opens by T3's own link. `braid clean` removes a worker child's checkout and `t3/` branch.
- **0060/C, the skills (#317):** one "Launch a subagent" recipe covers every role. The worker ends its run at an open PR; the coordinator watches the item PR while CI runs and sends red results and review findings back to the same child. The task result is the report. Cancelled and failed runs, `ci: none`, a merge during the watch and a worker's research question each have a defined path. D117 amends D69, D75 and D77. The counted skill files went from 716 lines to 700.
- **0060/D, docs (#322):** README, getting started, cli, board, braids-format, decisions and roadmap are true for subagent workers.
- **0060/E, fix from the PM's live check (#355):** a `shared` research child shares its parent's checkout, so it is now recorded with no folder or branch (older research records' folder and branch are ignored), and `braid clean` keeps the main checkout, the caller's checkout and a running thread's folder or branch on every removal path; before, `braid clean` could delete the coordinator's own checkout. Research children show as research in status, the limits list and clean.

Why: T3 v0.1.11 keeps a child's context across follow-ups and wakes the parent naming the child. A child can't watch a PR, and a long foreground wait is blocked in it (`sources.md` S8-S10). So the coordinator, which T3 wakes on every run's end and every CI result, holds the waits.

Validation:
- Each strand passed CI on Ubuntu and Windows and an independent review; the strand PRs were merged under the `free` preset.
- **Live trial, 2026-11-25.** 0060/D's worker was launched with the braid branch's own `braid launch`, as a `delegate_task` child recorded with `--child`.
  - A board built from the braid branch showed it as running, role `worker`, with T3's link `https://app.t3.codes/threads/<env>/thread%3Adelegated-task…`, and counted it under Claude_Everix's running agents.
  - It ended its run at PR #322 with checks pending. The coordinator watched the PR and sent it three follow-ups (unticked boxes, two review rounds); each ran in the same child with its context.
  - Its reviewers were launched with `braid launch --role review` too.
  - `braid clean` from the braid branch removed the child's checkout and `t3/` branch.

Open:
- The final PR's CI (`verify` on Ubuntu and Windows) passed on ef1d411b; the gate box is ticked.
- Leftovers:
  - ny2x: tests for `braid start --no-worktree` and research `--child`.
  - v4r2: the pause text's CI-result clause, 0074's.
  - ewz4: top-level workers re-reading the new skill.
  - 8rjy: two wording gaps in the skills.
  - 7uiu: `braid clean` keeps a worker child's item branch until the strand is named.
- PM live check (2026-11-26) leftovers: k3fv (`braid launch --help`, `--child` with an unknown thread, "?." punctuation, stale comments in `src/board/demo.ts`, limits.md's Resume line); 1b0r (0060/E review suggestions); dxqo (0072's request suffix that is all digits reads as a braid number, a flaky test).
- Idea s4n9: a gate run in the background cancelled a worker. Idea cae2: a pause checkpoint commit withdrew the open handover.

Decisions: the PM approved the plan (q-trnn) with two notes, both followed: keep the live trial box, and record the amendment as one decision (D117; numbered D107 on the braid branch, renumbered when `main` brought 0074's D107-D109 and 0072's D110-D116). Mine, logged: 0060/C's process case merged under the preset, because the skills reach `main` only through this PR, the user's merge. Workers decided: `--no-worktree` as a `braid start` flag; launch messages name no result thread.
For later items: the leftovers above; launching coordinators through `braid launch` stays out of scope.
Needs the user: process: this PR changes the braid skills (`.agents/skills/`); AGENTS.md keeps their merge into `main` the user's. Merge order: after 0074 and 0072.
