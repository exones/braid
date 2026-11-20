---
id: '0048'
title: "The worker owns CI; the coordinator waits only where a wake is reliable"
status: Done
labels: ["kind:story", "tier:M", "ask:process"]
dependencies: []
related: ['0040']
delivery: epic
---

## Goal

The coordinator stops waiting on CI in ways where its wake can be lost. The worker that opened an item PR owns that PR's CI: it fixes red checks until they are green and reports only then. The coordinator waits for the worker's report, reads the checks once before the handover, and keeps no watch of its own on item PRs. Where no worker owns CI (the braid branch after a merge the coordinator made), the coordinator waits in the foreground, in calls under 10 minutes, and never on a background command. This is for the user, who found coordinators saying "waiting" and then never resuming.

Expected size: about 350 lines in 12 files, over three strands.

## Start here

- Inbox idea `2026-11-20-80k2` (`braid inbox show 2026-11-20-80k2`): the research from braid 0040, with the evidence. In T3 a background-command wake ends the coordinator's session about 20 ms after the wake turn starts (5 of 6 wakes lost). `t3_thread_wait` ends within milliseconds of any message reaching the thread and cancels tool calls running beside it, which then read as "STOP". Reliable wakes: a worker's `t3_thread_send`, `watch_pull_request`, a `delegate_task` result.
- Coordinator thread of braid 0044, 2026-11-20 10:08: the coordinator's own watch on item PR #177 woke it 4 s before the worker's report arrived, and the report broke the `t3_thread_wait` it had just started.

## Already decided

- Related to 0040 (Autonomy presets, merged into `main` on 2026-11-20 with PR #176): 0040 added `braid wait` (D71), `references/autonomy.md` and the "Say waiting" line this braid changes. D71's background wait is replaced by a new decision here (the next free D number, D75 at planning time), with a dated note on D71.
- The worker skill's CI loop stays as it is: watch, check once, fix on red, report on green.
- The coordinator keeps a PR watch on the PRs no worker owns: the planning PR and the final PR.
- Filing the T3 bug (the session closes while a background-task wake is starting) is the user's, outside this braid.

## Out of scope

- T3 itself, and any workaround that patches T3.
- How reviewers are launched or waited for (`delegate_task` results are reliable).

## Completion

- [x] The coordinator skill sets no watch on an item PR and waits for the worker's report; it reads the item PR's checks once before the handover.
- [x] After a merge the coordinator made, it waits for the braid branch's CI in the foreground with a bounded `braid wait`, repeated while CI still runs; no skill tells an agent to wait on a background command.
- [x] The "Say waiting" rule lists only wakes that are reliable in T3.
- [x] `braid start` run again on a started item says so and exits 0.
- [x] The decision that replaces D71 is in `docs/decisions.md` with its reason.
