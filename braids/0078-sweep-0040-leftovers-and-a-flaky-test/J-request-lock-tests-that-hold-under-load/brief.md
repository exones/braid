---
id: '0078/J'
title: "Request lock tests that hold under load"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 5
---

## Goal

The request record's lock tests pass in a loaded local gate as they do in CI, so every braid's local gate is evidence again. Leftover 2026-11-25-2hkx (0072/A, PR #313), taken into 0078 at the PM's request (2026-11-25): the two multi-process lock tests in test/requests.test.ts, "overlapping writers in separate processes lose no update" and "a stale lock is taken over and the lock is released", fail every local gate on this machine under load (0072/A, /G and /B, twice in a row each time; the stale-lock one also alone), while CI passes them. Coordinators fall back to CI's verify as gate evidence.

Expected size: about 60 to 150 lines in 2 to 4 files.

## Start here

- `test/requests.test.ts:261-283`: the two tests (four writer processes, 4 writes each; a 60-second-old lock file then one write).
- `src/braids/state.ts`: `locked` (waits up to `waitMs`, polls every 20 ms), `takeOverStale` and `LOCK_STALE_MS` (30 s).
- `src/braids/gitbranch.ts:335`: `lockedBranch` with `BRANCH_LOCK_WAIT_MS` (60 s); each write under the lock runs git commit and push.
- `src/braids/requests.ts`: `openRequest` and the carry-over that runs under the same lock.

## Change

- Find out why they fail under load first (reproduce: run the gate or the two tests next to a CPU load, and record what fails: a wait timeout, a lost update, an exit code, a stale takeover of a live lock). Write the cause in the plan before changing code.
- Make the tests load-proof without weakening what they prove: no timing races, wait on the lock's state rather than on sleeps or wall-clock margins, generous but bounded timeouts; still 4 processes, still no lost update, still a stale lock taken over and released.
- If the cause is in the product (for example a holder slower than 30 s under load whose live lock is taken over as stale, which would lose an update for real), fix the product: say so in the report, with a regression test.

## Already decided

- What the tests prove stays: overlapping writers in separate processes lose no update; a stale lock is taken over by one waiter and released.
- 0072 (Questions say what they unblock) changes other tests in test/requests.test.ts and src/braids/requests.ts, not these two tests or src/braids/state.ts / gitbranch.ts; keep to the lock code and these tests so the merge stays clean. Its coordinator is told.
- Runs first in 0078 (order 5), at the PM's request.

## Out of scope

- P24's cap on parallel gate runs per machine. Other flaky tests.

## Completion

- [ ] The cause of the local failures is written in report.md, with how it was reproduced
- [ ] The two tests pass 10 runs in a row under a CPU load on this machine (report the command and the load), and still fail when an update is lost or a stale lock is not taken over (a negative check shows it)
- [ ] A product fix, if the cause is in the product, has a regression test
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
