---
id: '0074/A'
title: "Limits read a window that shows no reset"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 10
---

## Goal

T3 leaves `resetsAt` off a window at 0% (Claude_Everix's `five_hour` Session window after a reset). `parseWindows` in `src/braids/limits.ts` then rejects the whole list ("usageLimits.windows is not a list of windows"), Claude's verdict reads `unknown` and nothing pauses. Read such a window as a window with no reset shown, so the provider's verdict comes from its other windows again. Urgent: it ships early into `main`, ahead of the rest of 0074.

Expected size: about 60 lines in 3 files.

## Start here

- `src/braids/limits.ts`: `parseWindows` (about line 225) and `readProvider`, which turns raw windows into `WindowReading`s (`resetsAt`, `reset`, `over`) and picks the pause window by the latest reset.
- `src/board/limits.ts`, `src/board/limits-view.ts`: what the chip and `braid limits` show per window (`resetsAt`), so a window with no reset doesn't print "Invalid Date" or crash.
- The tests of `src/braids/limits.ts` under `test/` (find them with `rg -l readProvider test`).
- Inbox leftover 2026-11-23-oa4d: after a reset T3 once wrote `windows` as an object keyed "0", "1", "2"; today's cache (`~/.t3/caches/Claude_Everix.json`) is an array again, with `resetCredits` beside it.

## Change

- `src/braids/limits.ts`: a window without a valid `resetsAt` is kept, with no reset (`resetsAt: null`); it is never `reset`, can still be `over` by its `usedPercent`, and a pause on it takes its resume time from the buffer after `checkedAt` plus the window's `windowDurationMins` when T3 gives one, else it reads `unknown` for that window only. Accept `windows` as an array-like object keyed "0", "1", … too. Ignore unknown keys (`resetCredits`). A window that is not an object or has no `id` or `usedPercent` is still rejected.
- `WindowReading.resetsAt` becomes `string | null`; fix every reader (CLI output, chip, steerer) so a null reset prints as "no reset shown".
- Tests: the real cache shape (three windows, `five_hour` at 0% without `resetsAt`, `resetCredits` present) reads `ok` with the other two windows; the object-keyed shape reads the same; a window at 98% without `resetsAt` still pauses.

## Already decided

- Ships as an early PR of the braid branch into `main` (the user, through the PM, answer a), as 0075/A did with #296; `main` stays the user's merge.
- No other limits behaviour changes here; stale and unreadable readings are 0074/E.

## Out of scope

- The warning for stale or unreadable readings (0074/E), anything in the steerer beyond reading the null reset.

## Completion

- [x] A cache whose `five_hour` window has no `resetsAt` reads `ok` (or `pause` from another window) instead of `unknown`, with a test on the real cache shape
- [x] `windows` as an object keyed "0", "1", "2" reads the same as the array, with a test
- [x] `braid limits` and the board's chip show a window with no reset without errors
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
