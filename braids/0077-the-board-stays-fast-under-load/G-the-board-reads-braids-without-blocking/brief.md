---
id: '0077/G'
title: "The board reads braids/ without blocking"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: ['0077/B']
order: 25
---

## Goal

The board's event loop no longer stalls while it reads `braids/`. After 0077/B (no synchronous git or gh in the board process), the board still stalls up to 4.6 s per read under a running gate. 0077/B's profile puts about 35 s per 80 s in synchronous file-system reads of `braids/` (`loadTree`, `checkBraids`) and about 7.6 s in `spawn` itself. This strand reads `braids/` asynchronously, and only when something changed, with fewer git spawns per read.

Expected size: about 250 lines in 6 files.

## Start here

- 0077/B's report.md: the profile, the numbers and the two smaller notes (`repoSources` runs 2 blocking git calls once per project at setup; a legacy `requests.json` is migrated by blocking code once).
- `loadTree` and `checkBraids` and their callers from `repoSources` (src/commands/board.ts): `braids`, `readiness`, `tree`.
- test/board-async.test.ts (0077/B): how a test proves the read doesn't block.

## Change

- The board reads `braids/` (working tree and branches) with async file-system calls, and skips a re-read when nothing changed: the folder's watcher already marks changes (`watch` in `repoSources`), and branch tips can be compared before reading.
- Fewer git spawns per read where the tips haven't moved.
- The two once-per-project blocking spots from B's notes become async, if cheap.
- Measure as B did: `/api/session` timings while a gate runs (median, p95, max), before and after, in report.md.

## Already decided

- Decided by the coordinator under the free preset (2026-11-25), from 0077/B's growth proposal option (b): a strand of its own, not absorbed in B, which was already twice its expected size.
- CLI commands keep their synchronous reads.
- No worker threads or child processes for the read unless measuring shows async isn't enough; then stop and propose.

## Out of scope

- The probe (C), the gate (D).

## Completion

- [ ] A board read of `braids/` runs no synchronous file-system read on the event loop, with a test that fails if one is added on that path
- [ ] A read with no change to `braids/` and no moved branch tip skips the tree read
- [ ] report.md has `/api/session` timings while a gate runs, before and after (target: max under 1 s)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
