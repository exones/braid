---
id: '0060'
title: "Workers as T3 subagents"
status: Outline
labels: ["kind:story", "tier:L"]
dependencies: []
related: ['0011']
delivery: epic
---

## Goal

The coordinator launches each worker as a T3 subagent (`delegate_task`) instead of a top-level thread, as it already does for reviewers (D69) and researchers (D75). T3 then wakes the coordinator whenever a worker run ends, so a forgotten report, a dead worker session or a coordinator wait broken by the user's message no longer leaves the braid stalled. The sidebar keeps only coordinators. Workers keep their own thread: review findings and mockup verdicts go to the same worker with its context, and the user can still talk to it directly. Research and tests on 2026-11-21 (`sources.md`) found this works; it reverses D69's "workers stay top-level".

## Working at the end

A braid runs its strands with workers launched by `delegate_task`. Each worker works in the checkout T3 makes for it, on its item branch, and shows on the board with a link. Every worker run that ends wakes the coordinator, including runs the user started by typing in the worker's thread. Follow-ups (review fixes, verdicts, growth decisions) go to the same worker with `t3_thread_send`. `braid clean` removes the worker's T3 checkout after the merge.

## Already known

- A finished child continues with its full context when sent a follow-up: a new run in the same thread, with a new task id (measured [S7]).
- Each finished run wakes the parent, also a follow-up's and a run the user started in the child's thread (measured [S7]).
- The user can type into a child thread from the T3 UI (measured [S7]).
- A finished child persists: `t3 thread show` gives its status, worktree and link. The full id with its `thread:` prefix is needed; without it T3 says "no longer available" (measured [S7]).
- `t3 thread list` doesn't list children (measured [S7]); the board finds reviewers through `.braid/reviews.json` and `t3 thread show` [S2].
- `delegate_task` isolation is `shared` or `worktree` (a new checkout from the parent's commit on a `t3/<hex>` branch); a child can't be given an existing worktree [S4].
- CI here takes a median of about 8 minutes, max about 9.5 (40 runs, measured [S7]); a worker's foreground wait or PR watch covers it. A background command waited on with `t3_background_wait` killed sessions (D77, [S5]) and stays out.
- Related to 0011 (Reports and several agents, Outline on `main`): parallel workers there would be subagents too; whichever is planned first settles how workers are launched and recorded.

## Strands (titles only)

- Spike: a worker child over a long run (several CI rounds, a PR watch, a question to the user) and how the coordinator tells a real result from a chat wake
- Commands: `braid start` for a T3-made checkout, recording worker threads (as `braid review` does), board and `braid status` lanes and links, `braid clean` of worker checkouts
- Skills and workflow: the coordinator launches, waits on and follows up workers as subagents; the worker reports by its final message; D69 amended
- Docs

## Open questions

- `braid start`: does it still create the item branch and the worker switches to it in T3's checkout, or does the worker create it? The `t3/<hex>` branch T3 made is left over either way.
- Does a worker child's PR watch (`watch_pull_request`) work, or does it wait for CI in the foreground? T3's guidance says delegated children never watch.
- A wake from the user chatting with a worker changes nothing: is "check `braid status`, act only on a change" enough, or should the coordinator ignore runs it didn't start?
- Does the worker still `t3_thread_send` its report, or is the task result enough (no double wake)?
- All tiers at once, or `task`-tier workers first?
- Spikes are top-level workers (D75): do they move too?

Plan it fully when its turn comes, asking the user if needed.
