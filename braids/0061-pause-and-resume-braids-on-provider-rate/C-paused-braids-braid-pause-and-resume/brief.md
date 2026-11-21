---
id: '0061/C'
title: "Paused braids: braid pause and resume, board and status"
status: In Progress
labels: ["kind:story", "tier:L", "ask:architecture", "ui"]
dependencies: ['0061/A', '0061/B']
order: 30
---

## Goal

A braid paused for a rate limit is a recorded state the user can see: `braid pause <number>` records the provider, window, usage and resume time; `braid resume <number>` clears it. The board and `braid status` show the paused braid with that line instead of calling it stalled. The coordinator (or PM) runs the commands; this strand builds no messaging. Spike 0061/A confirmed that the board only shows the pause.

Expected size: about 500 lines in 8 files, half of them tests.

## Start here

- `braids/0061-…/A-…/report.md`: the spike's answers and its proposed changes for this strand; read first.
- `src/braids/requests.ts`: the `.braid/` store pattern to copy (main checkout, lock, load, open, close).
- `src/board/model.ts` around the `stalled` alarm (line ~259) and `src/board/marks.ts`: where a paused braid must hold back `stalled` and get its own mark.
- `docs/board.md`, "Broke" and "Requests": the rules the new state sits beside.
- `src/braids/limits.ts` from 0061/B: the verdict a pause records.

## Change

- `src/braids/pauses.ts` (new): `.braid/pauses.json` in the main checkout, one record per paused braid: number, provider instance, window id and label, used percent, the window's `resetsAt`, `resumeAt`, the scheduled resume task's id and the thread it wakes (0061/A: an `interval` task in the coordinator's or PM's own thread), who paused (`coordinator` or `pm`, with the thread id), when.
- `braid pause <number> --provider <id> [--window <id>] [--until <iso>] [--task <id>] --thread <id>`: without `--window`/`--until` it takes them from `braid limits` for that provider; refuses when the verdict isn't `pause` unless `--until` is given. `braid resume <number>` clears the record and prints what it cleared. Both are idempotent.
- Board: a paused braid (and each of its strands not Done) shows a `paused` mark with "Paused: <provider> <window label> <n>%, resumes <local time>"; it is not `stalled`, and its pause doesn't open Needs You. Past `resumeAt` by more than 15 min with the record still there: the mark says "resume was due at <local time>" (T3 was down, the task was deleted, or the coordinator thread was archived), and after 10 min more the braid reads `stalled` as today.
- `braid status`: the same line.
- Tests: the store (open, clear, idempotence, a damaged file), the board mark, `stalled` held back while paused and back once overdue.
- `docs/cli.md`, `docs/board.md`, `docs/braids-format.md` (the new file).

## Already decided

- The board never writes `pauses.json`; only `braid pause` and `braid resume` do.
- A pause is per braid, not per strand: under a PM, the PM pauses each braid on that provider.
- The board sends no messages and schedules nothing: 0061/A confirmed the coordinator or PM pauses (the `t3` CLI the board uses can't steer a running thread or schedule).

## Out of scope

- The skills' protocol (0061/D); scheduling the resume.

## Failure modes and regression tests

- A damaged or missing `pauses.json` reads as no pause, and the board says so in its header once; never a crash.
- A resume that never came: "resume was due at <time>", then `stalled`, so a dead schedule can't hide a braid for good.
- Two writers (coordinator and PM): the file lock as in `requests.ts`.

## Completion

- [ ] `braid pause` and `braid resume` record and clear a braid's pause in `.braid/pauses.json`, idempotent, with values from `braid limits` by default
- [ ] The board and `braid status` show a paused braid with provider, window, usage and resume time, and don't call it stalled
- [ ] An overdue pause shows "resume was due at <time>", then `stalled`; tests cover it
- [ ] A damaged pauses file reads as no pause; tests cover it
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
