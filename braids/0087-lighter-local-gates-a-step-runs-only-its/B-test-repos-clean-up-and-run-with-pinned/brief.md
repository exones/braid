---
id: '0087/B'
title: "Test repos clean up and run with pinned git settings"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 20
---

## Goal

Tests leave nothing behind and don't pull in the machine's global git settings. Today %TEMP% holds 1,773 leftover `braid-*` folders (1,515 `braid-title-*`, 79 `braid-done-test-*`, 35 `braid-start-*`, …) and 96 `git fsmonitor--daemon` processes have been alive since 11-26 (PM's investigation, 2026-11-28): fsmonitor comes from global settings, not from braid or T3, and each daemon stays after its temp repo is gone.

Expected size: about 200 lines across test/support and the test files that make temp dirs.

## Start here

- `rg -l mkdtemp test` (about 127 calls): each test that makes a temp dir; some never remove it (test/title.test.ts, test/board-wake.test.ts, test/board-no-false-stalls.test.ts), others only on success.
- `rg -n "GIT_CONFIG" test`: several tests already set `GIT_CONFIG_NOSYSTEM`/`GIT_CONFIG_GLOBAL` each their own way.
- `test/support/`: the shared helpers.
- `braids/0057-faster-windows-ci/A-spike-where-windows-ci-time-goes-and/report.md`, row 4: the `GIT_CONFIG_COUNT` settings tried on CI (no effect on CI time there; here the aim is the local daemons and load).
- `package.json` `test` script (on 0077's branch: `scripts/Test-Node.ps1`).

## Change

- One place that pins git settings for every test and the git and CLI processes it spawns, for example GIT_CONFIG_COUNT/KEY/VALUE variables set before node runs the tests or in a helper every test loads: `core.fsmonitor=false`, `gc.auto=0`, `maintenance.auto=false`, `core.fscache=true`, `core.preloadindex=true`. It must also hold when one test file is run directly (`node --test test/<file>.test.ts`, the `test` line in BRAID.md).
- Every test that makes a temp repo or dir removes it, even when it fails (`after`/`t.after` or `try/finally`), with retries where Windows holds a file briefly.
- A check that keeps it so: for example a test run that compares the `braid-*` folders in the temp dir before and after, or a lint over `mkdtemp` without cleanup; your choice, kept cheap.

## Already decided

- The settings come from the PM's investigation and 0057/A: no fsmonitor, no auto-gc or auto-maintenance, `core.fscache`, `core.preloadindex`.
- Don't kill or clean up the existing leftover folders or daemons on the machine; this strand stops new ones.
- The PM removed the machine's old leftovers on 2026-11-28 at about 09:55 (96 fsmonitor daemons, 1,754 `braid-*` folders; 10 newer ones kept), so the counts start near zero: measure what one full gate run adds (new folders, new daemons) before and after this change, not the totals.
- Related to 0077 (edits test/support and the `test` script) and 0078/E (test/cli.test.ts, test/done-merge.test.ts): see the braid brief; merge main first if 0077 has landed, keep edits in shared files small.

## Out of scope

- Fewer git calls or fewer repos: 0087/C.
- The test picker: 0087/A.

## Completion

- [ ] After `npm run verify:full` on this machine, the temp dir has no new `braid-*` folders, also after a test that failed (shown with a deliberately failing test, not committed)
- [ ] After a gate run there are no new `git fsmonitor--daemon` processes, with a machine whose global git config turns fsmonitor on
- [ ] The pinned settings apply when one test file is run directly
- [ ] report.md lists what one full gate run adds (folders, daemons) before and after this change, and how the check keeps it so
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
