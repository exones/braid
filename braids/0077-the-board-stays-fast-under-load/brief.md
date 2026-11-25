---
id: '0077'
title: "The board stays fast under load"
status: In Progress
labels: ["kind:story", "tier:M"]
dependencies: []
related: ['0074', '0072', '0060']
delivery: epic
autonomy: free
---

## Goal

Programme pm/autonomous-dev-machine, row P24. The board answers within a second while two braids run their gates on the same machine, and `braid board --url` always finds a running board. Evidence: idea 2026-11-24-z45n (`/api/session` took 26 ms to 5.1 s, so `--url` said no board was running), idea 2026-11-24-5p1e (every project's read failed after 60 s while two gates ran, CPU at 100%), 0010/B's timing flake in a gate run beside another gate, and 2026-11-25, when the board timed out reading projects (over 60 s) while about 10 agents ran. Also in this braid: the programme card's running count (idea 2026-11-25-1r0o).

What a user can try at the end: start two gates at once (two worktrees, `braid gate`; a third waits), keep the board open, and see the page and `/api/session` answer within a second and `braid board --url` print the board's address.

## Strands

- A: one git runner, with the main checkout and repo name cached per root (part of idea 2026-11-24-l7dw).
- B: no synchronous git or gh calls left in the board process, on the request path or in the refresh (z45n, leftover 2026-11-23-5bor).
- G: the board reads `braids/` without blocking (added from 0077/B's profile).
- C: the probe (`braid board --url`, `braid board service status`) tolerates a busy machine.
- D: at most two gates at once per machine (5p1e), `braid gate`.
- E: the programme card's running count (1r0o).
- F: docs (no skill changes: the user, "not yet, put in ideas").

## Already decided

- The user, for the whole programme: "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests". So: plain async calls and small caches, no new state machines; one lock file for the gate, nothing more.
- The board's request path reads only snapshots (docs/board.md, "Refresh"); this braid keeps it so and makes the refresh itself yield: every git and gh call in the board process is asynchronous. T3 calls are already asynchronous (`runT3` in src/board/t3.ts) and stay off the request path: later (P5) the board signs in to T3's MCP at "Supervised" to steer threads, and T3's MCP events could replace polling; neither is built here.
- Board UI: buttons are icon-only with the words in the tooltip; how threads are opened doesn't change (the user, 2026-11-25).
- The running count (the user, 2026-11-25): a braid counts as running while it is started, not Done, and its coordinator is alive, working or waiting (on a PR, a live check, a reviewer, the PM), or the PM is handling it. Dead means failed or archived, or no coordinator thread at all.
- Live checks never touch port 7800, the real `~/.braid`, the real `braid-requests` or `braid-inbox` branches, or real T3 threads: use a temporary `BRAID_HOME`, another port, a scratch repository and fake T3/gh runners.
- Related to 0074 (The board pauses and resumes reliably, on `braid/0074-the-board-pauses-and-resumes-reliably-no`): it changes src/commands/board.ts, src/board/programme.ts, steer/steerer/pause and src/commands/service.ts. 0074 merges into `main` first; this braid merges `main` in before C, E and the final PR, and B and C keep their changes in board.ts to the read and probe paths.
- Related to 0072 (Questions say what they unblock, on `braid/0072-questions-say-what-they-unblock`): its strands change src/braids/requests.ts, src/board/wake.ts, src/board/model.ts and the programme cards (0072/C). It merges into `main` before this braid; B's async record write (5bor) changes only how wake.ts calls the record write, not what is written.
- Related to 0060 (Workers as T3 subagents, on `braid/0060-workers-as-t3-subagents`): it changes src/board/t3.ts and src/board/model.ts a little (subagent workers). It merges into `main` before this braid; A and B touch t3.ts only for `mainCheckout`.
- Merge order of the programme: 0074, 0072, 0060, then 0077.

## Out of scope

- The rest of idea l7dw (one BRAID.md reader, one CLI table, the shim sweep, the gate scripts): P14 and P15.
- Signing the board in to T3, steering threads, T3 MCP events (P5).
- A memory or process watchdog (P26, observe first).
- The Questions panel (P25).

## Completion

- [ ] With two gates running at once on one machine, the board's `/api/session` and page answer within a second, measured and written in the final report
- [ ] `braid board --url` finds a running board on a busy machine, and says "busy" rather than "no board" when one listens but answers late
- [ ] No synchronous git or gh call runs in the board process, and a test fails if one is added
- [ ] At most two `braid gate` runs on one machine run at once; a third waits
- [ ] The programme card's running count follows the user's rule (started, not Done, coordinator alive or the PM handling it)
- [ ] Docs updated by the docs strand

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
