---
id: '0080'
title: "The board talks to T3 directly"
status: In Progress
labels: []
dependencies: []
related: ['0074', '0077', '0072', '0060']
delivery: epic
autonomy: free
---

## Goal

Programme pm/autonomous-dev-machine, row P27 (idea 2026-11-25-c92g, the T3 v0.1.10-0.1.12 review; idea 2026-11-25-t4oj). Today the board knows T3 only through the `t3` CLI: `thread list`, `thread show`, `thread start` and `thread send`, which queues a message behind a busy turn and can't stop anything. So a hold or a limit pause reaches a working thread only when its turn ends, and never its delegated children (idea 2026-11-25-b1yb: about 10 threads went on working after every coordinator said "held"); and the board learns that a turn ended only at its next 30 s poll. This braid signs the board in to T3's MCP (at Full access, the user's decision after 0080/A) so it can stop threads, children included, and hear T3's events; it shows why a thread failed; and PM and coordinator threads are launched with auto-settle off.

What a user can try at the end: sign the board in once; Hold stops every thread of a programme at once, children included; Resume after a T3 restart gets through; the board reacts to a finished turn within seconds; a failed thread's card says why it failed.

## Strands

| Strand | What | Tier | After |
| --- | --- | --- | --- |
| 0080/A | Spike: how the board signs in to T3 (OAuth at Supervised, the token in the OS secret store). A report; the user decides before anything is built | L | |
| 0080/B | A T3 MCP client and events reader, tested on the mock; nothing wired into the board | M | |
| 0080/C | Stalled cards say why a thread failed (`ui`), from `t3 thread show --json`'s `error`; no sign-in needed | M | |
| 0080/D | The board signs in to T3 (`ui`), as A's approved design says | L | A, B |
| 0080/E | Hold and Resume reach every thread: interrupt with `stop: true`, children included; the limit clash | L | C, D, and 0074 in `main` |
| 0080/F | The board hears T3 events instead of the 30 s poll, with a full read as backstop | M | B, D, and 0077 in `main` |
| ~~0080/G~~ | Dropped (the user, q-htgo): T3 offers agents no auto-settle switch; 0080/H notes it as a manual T3 setting | | |
| 0080/H | Docs: The board talks to T3 directly | S | all |

Run order: A; then B and C while the user reads A's report; D after the user approves A; E once 0074 is in `main` and merged into this braid; F once 0077 is in `main` and merged in; H. (G dropped.)

## First-pass test results (strand 1 of the row, done)

A PM helper ran the row's first strand on 2026-11-25 on scratch threads only; it isn't repeated here.

- **Stop cascade.** A parent's stop reaches its `delegate_task` children only with `t3_thread_interrupt` `stop: true` (the child stopped in about 1 to 4 s; the parent is told and invited to restart its tasks). A plain interrupt or a queued "hold" message doesn't reach children. Their shell processes (pwsh sleeps) outlived the stop on Windows, so the board keeps tracking children; killing process trees is P26's, not this braid's. `task_status` works only from the parent.
- **MCP Events** work only for an OAuth client (no CLI path): `events/poll`, `events/stream`, `events/subscribe`; cursor `<epoch>.<seq>`; the 1,000 newest milestones in memory; `truncated` on an old cursor or after a T3 restart. Types: `thread.run_settled`, `thread.needs_input`, `thread.input_resolved`, `thread.guest_request`, `thread.guest_request_resolved`, `pr.watch_wake`. There is no run-started and no usage-limit event, so a `t3 thread list` read stays, at start and after `truncated`.
- **Limit clash.** T3's own usage-limit auto-resume (v0.1.10) is off by default here. With it on, T3's "Continue where you left off." can double or pre-empt braid's resume. A Hold through `stop: true` disarms T3's recovery. The board should not message a thread whose last run failed on `usage_limit`: it counts as paused.

## Sources

- The mock: `~/.braid/artifacts/braid/p27-t3-tests/events-mock/` (`server.mjs`: `events/list` and `events/poll` as T3 v0.1.12 answers them, a 5-milestone window, a restart; `client.mjs`: the poll consumer; `demo.mjs`: start from now, paging, falling behind, restart). 0080/B ports it into the repository's tests.
- The T3 v0.1.12 sources the tester read, kept outside this public repository (they are T3's code): `~/.braid/artifacts/braid/p27-t3-tests/t3-src-v0.1.12/`. Most useful: `docs_user_outside-agents.md` (sign-in, levels, the 30-day sign-in, Events); `McpOAuth.ts` (the authorization server); `apps_server_src_mcp_McpHttpServer.ts` (headers, protocol 2026-07-28); `apps_server_src_milestones_*.ts` and `packages_contracts_src_milestones.ts` (events); `apps_server_src_mcp_toolkits_orchestrator_tools.ts` (`t3_thread_interrupt`, `t3_thread_list`); `cli_thread.ts` (`thread show --json` prints `{ thread, messages, error }`, `error` being the latest run's error once it ended without completing; the CLI has no interrupt); `apps_server_src_orchestration-v2_UsageLimitRecoveryWorker.ts` (`lastErrorClass: "usage_limit"`, T3's own resume); `Orchestrator.ts` (`thread.auto-settle.set`).

## Already decided

- The user, 2026-11-25: "A. Go for it" (the board connects to T3). "If it's unclear, don't absorb anything, I withdraw": nothing else is absorbed into the sign-in.
- The board signs in to T3's MCP (the user's "B: a and explain how board would do it", 2026-11-25), first planned at "Supervised". After 0080/A showed that T3 refuses an OAuth client acting on a thread that runs above its level, and braid's threads run at the project default (some at Full access), the user chose Full access (q-b146: "Full Access if it's not worse than what we have now", and "ok" to `@napi-rs/keyring`); the PM's conditions are in 0080/D. The token goes through the host's secret store only, never files, logs or chat. A security case: the user is asked before the sign-in is built, so 0080/A ends with a report and the user's decision, and 0080/D builds only what was approved.
- Events: "C. Would be great to first test on some mock, and if it holds, implement". 0080/B tests on the mock; 0080/F goes live only after the sign-in works; if events don't hold, the board keeps polling.
- "D. Ok, add": PM and coordinator threads launched with auto-settle off, a skill line the user agreed to (0080/G). It merges with the final PR, the user's merge.
- "E. Needs checking" (the limit clash: checked in the first pass, fixed in 0080/E) and "G add" (show why a thread failed: 0080/C).
- Signed out, or on a host without a secret store, the board works as today (CLI list, show and send, the 30 s poll). The sign-in adds; it never becomes required.
- The programme: "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests". Plain calls with retries, no new state machine, no LLM in the path; skills grow by 0080/G's line at most.
- Board UI: buttons icon-only with the words in the tooltip; how threads are opened doesn't change.
- P5 (Board lanes collapse, Held lane, Hold all) runs after this braid and builds the Hold button, the Held lane and Hold all on 0080/E's mechanism; this braid doesn't build them.
- Live checks never touch port 7800, the real `~/.braid` state, the real `braid-requests` or `braid-inbox` branches, or real T3 threads: scratch threads (`t3_thread_launch` `scratch: true`), archived afterwards, a temporary `BRAID_HOME` and another port. One worker at a time; finished worktrees are removed.
- Related to 0074 (The board pauses and resumes reliably, on `braid/0074-the-board-pauses-and-resumes-reliably-no`): it rewrites the pause and resume (src/board/steer.ts, steerer.ts, resume.ts, acting.ts, src/braids/pauses.ts) and already retries a failed resume send until it is delivered (idea qcf4, 0074/D). 0074 merges into `main` first; 0080/E starts only after that and after `main` is merged into this braid, and builds on its one resume path instead of adding another.
- Related to 0077 (The board stays fast under load, on `braid/0077-the-board-stays-fast-under-load`): it owns the board's git, gh and T3 call path (no synchronous calls; src/board/t3.ts, feed.ts, src/commands/board.ts). 0077 merges first. 0080/C's one change to the T3 read (`showThread` reading `error`) is agreed with 0077's coordinator before C starts; 0080/F starts only after 0077 is in `main`.
- Related to 0072 (Questions say what they unblock, on `braid/0072-questions-say-what-they-unblock`) and 0060 (Workers as T3 subagents, on `braid/0060-workers-as-t3-subagents`): both change skills and the board model, and merge first; 0080/G's skill line goes in after them.
- Merge order of the programme: 0074, 0072, 0060, 0077, 0078, then 0080.

## Out of scope

- The Hold button, the Held lane, Hold all and finishing programmes (P5).
- Killing process trees that outlive a stop (P26).
- Absorbing the board's existing sign-in into this one (the user withdrew it).
- T3 Workflows (P28, 0079), and anything that changes how threads are opened.

## Working at the end

The user signs the board in to T3 once, at Full access; the token lives in the OS secret store and the board warns before the 30-day sign-in ends. A hold or a limit pause stops every working thread of its braids at once, delegated children included, and a resume gets through after a T3 restart. Signed in, the board refreshes within seconds of a finished turn, a question or a PR wake, and reads everything again after a gap. A failed thread's card says why. PM and coordinator threads don't auto-settle.

## Completion

- [x] The user approved the sign-in design (0080/A) before it was built
- [x] The board signs in at Full access (the user's q-b146), keeps the token only in the OS secret store and warns before expiry; signed out it works as before (0080/D)
- [x] Hold and a limit pause stop running threads and their delegated children; a thread whose last run failed on `usage_limit` counts as paused (0080/E)
- [x] Signed in, the board refreshes on T3 events, reads everything after `truncated`, and keeps a slow full read (0080/F)
- [x] Stalled cards say why a thread failed (0080/C)
- [x] Auto-settle: dropped by the user (q-htgo, "M. B"), since T3 v0.1.12 lets no agent turn it off; the docs say it is a manual T3 setting (0080/H)
- [x] Docs are true as a whole (0080/H)

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
