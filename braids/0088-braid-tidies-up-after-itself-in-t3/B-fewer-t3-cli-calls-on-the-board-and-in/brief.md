---
id: '0088/B'
title: "Fewer t3 CLI calls on the board and in clean"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: []
order: 20
---

## Goal

Until 0080's signed-in reader lands, and after it on signed-out hosts, the board and `braid clean` start fewer `t3` processes. Each costs 7–24 s on a loaded machine; one board read here was 17 processes, and two board services doubled that (0083, part 3, "Recommendation for braid" 5).

Expected size: about 250 lines in 6 files.

## Start here

- `braids/0083-how-braid-can-read-t3-lightly/report.md`, part 3 (the table of braid's calls and the cheapest call per need) and recommendation 5.
- `src/board/t3.ts`: `readFresh`, the per-thread `thread show` reads (running threads, `.braid/reviews.json` records, `pm/` checker records), `parentsCheckout`, `showThread`, the pool and `SHARE_MS`.
- `src/commands/clean.ts`: its `showThread` and `parentsCheckout` per candidate (after 0085 is merged in).
- `src/commands/board.ts` and `src/commands/service.ts`: how a board service starts, and what stops a second one serving the same project.

## Change

- Cache worktree and branch per thread id in the board process: a thread is shown once, and again only when what the board needs from it can change (its pending count while running, its status).
- `braid clean`: show each parent at most once per run.
- Only one board service reads a project: a second one for the same project refuses or defers to the first (check first whether two can serve the same project today; 0083 saw two services and didn't check).
- Tests that count `t3` calls through the `T3Runner` seam, before and after.

## Already decided

- Agreed with 0080's coordinator (2026-11-28): only the CLI read functions in `src/board/t3.ts` change; no change to the T3 snapshot's shape, `Where`/`showThread`, or the `failures` source in `src/board/inputs.ts` and `src/board/failure.ts`. This strand merges into `main` before 0080, which then merges `main` in.
- Starts after 0085 is in `main` and `main` is merged into this braid branch (0085 changes `clean.ts`).
- `--messages 1` doesn't help (0083); no change to the 30 s cadence.

## Out of scope

- MCP calls and the signed-in path (0080/F).

## Completion

- [ ] A board read of N running threads and recorded subagents shows each thread at most once while its worktree, branch and status stay the same; a test counts the calls
- [ ] `braid clean` shows each parent at most once per run; a test counts the calls
- [ ] A second board service for a project already served doesn't read it; a test shows it
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated (`docs/board.md`: what a read asks T3), or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation (call counts before and after), anything open
