---
id: '0049/F'
title: "Flaky timing check in test/notify.test.ts"
status: In Progress
labels: ["kind:task", "tier:S", "sweep"]
dependencies: []
order: 14
---

## Goal

During 0049/A, `npm run verify` failed once on a timing assertion in `test/notify.test.ts`; the test passed alone and the full gate passed on the rerun (leftover 2026-11-20-hj3y). Make the notification tests independent of how fast the machine is, so CI doesn't go red at random.

Expected size: about 40 lines in 1 or 2 files.

## Start here

- `test/notify.test.ts`: the tests with short timeouts (`timeoutMs: 150` around lines 368 and 372, and `2_000` elsewhere) and any assertion on elapsed time or on a send having happened by a fixed moment.
- `src/notify/notifier.ts` and `src/notify/sender.ts`: how the timeout and the in-flight keys work, and what a test could wait on instead of a clock.

## Change

- Find the assertion that can fail under load (run the file repeatedly, and under load, for example several copies in parallel, to catch it) and make it wait on an event or an injected clock instead of wall-clock time.
- Say in `report.md` which assertion it was and how it was reproduced, or, if it couldn't be reproduced, which assertions were timing-dependent and how each was changed.

## Already decided

- A sweep strand of 0049, asked by the user on 2026-11-20.
- Fix the test, not the product, unless the product has a real race; then say so in `report.md` and stop for the coordinator before changing product code.

## Out of scope

- Other test files.

## Completion

- [x] No assertion in `test/notify.test.ts` depends on wall-clock timing
- [x] `test/notify.test.ts` passes 20 runs in a row with several copies running in parallel, and `report.md` gives the command used
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

Replace the one elapsed-time assertion (`performance.now() - began < 50`) with `calls === 0` right after the synchronous `notify` calls: the send starts in a later microtask, so this proves "returns without waiting" with no clock. The other timeouts only fire on a send that never settles, and no assertion compares time.
