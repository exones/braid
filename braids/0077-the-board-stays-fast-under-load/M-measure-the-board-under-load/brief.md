---
id: '0077/M'
title: "Measure the board under load"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0077/L']
order: 95
---

## Goal

Measured evidence for the braid's final PR and the PM's live check: with 0077 built, does the board stay fast under real load? The PM asked for it (2026-11-26): the user's board said "The latest read of agento failed: the read took longer than 60 s", with 3 projects and about 13 braids working. The braid's first Completion box asks the same: with two gates running, `/api/session` and the page answer within a second. This strand changes no product code. Its output is report.md with the numbers.

Expected size: report.md only, plus any measuring script kept in the item folder.

## Start here

- The braid's log and the reports of A to L: what each changed, and the timings already taken (B, G, J, L).
- `BRAID_BOARD_TIMINGS=1` (src/board/feed.ts): per-source timings of each read.
- `braid board` options: a port other than 7800, and several projects.
- `braid gate` (0077/D): two at once per machine.

## Change

- Build this branch (`npm ci`, `npm run build`).
- Start a scratch board from this build with a temporary `BRAID_HOME`, a port other than 7800 (7800 is off and stays off), and three real projects read-only: agento (this repository's main checkout), dctl-studio and everix4 (as `braid projects` lists them; use the paths from the real project list without writing to it).
- While it runs, start two gates at once in two separate worktrees (`node dist/cli.js gate`), alongside whatever agents are already working on the machine.
- Record, for at least 10 minutes:
  - each project's full read time, with per-source timings, against the 60 s read limit;
  - `/api/session` every second (median, p95, max) against the 1 s target;
  - whether any read failed, and why.
- Also report a fresh start: the first read and the next one per project (0077/L's question, measured live).
- Stop everything you started: boards, gates and temporary homes. Touch nothing real: no writes to the real ~/.braid, the braid-requests or braid-inbox branches, or T3 threads.

## Already decided

- Asked by the PM; the coordinator's call to run it as a strand (2026-11-28).
- If a read passes 60 s or `/api/session` passes 1 s, report it with its cause from the timings (for example jni7, git spawn on the main thread). Build nothing: the PM decides what follows.

## Out of scope

- Any code change.

## Completion

- [ ] report.md has per-project read times (per source) and `/api/session` median, p95 and max under two gates and three projects, over at least 10 minutes
- [ ] report.md says plainly whether each target held (read under 60 s, `/api/session` under 1 s), and the cause of any miss
- [ ] report.md has a fresh start's first and second read per project
- [ ] Nothing real was touched, and everything started was stopped
- [ ] report.md written: what was run, how, results, anything open
