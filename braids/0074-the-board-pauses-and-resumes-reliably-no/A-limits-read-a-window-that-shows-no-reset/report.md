# 0074/A report

## What changed
- `src/braids/limits.ts`: a window without a valid `resetsAt` is kept with `resetsAt: null` (never `reset`, can be `over` by `usedPercent`). `windows` may also be an object keyed "0", "1", …; unknown keys (`resetCredits`) are ignored. A window that isn't an object or lacks `id`/`usedPercent` still rejects the list.
- A pause on a window with no reset resumes at `checkedAt` + `windowDurationMins` + buffer; with no duration that window is skipped, and if it is the only one over, the verdict is `unknown` with its reason. Among over windows, the latest resume time picks the pause window.
- `braid limits` prints "no reset shown"; the board's `resetText` does the same; `braid pause --window` on such a window falls back to the reading's `resumeAt`.

## Why
T3 leaves `resetsAt` off a window at 0%, which made the whole list invalid, so Claude read `unknown` and nothing paused.

## Validation
`npm run verify` passed (707 tests, 0 fail). New tests with fixtures `claude_no_reset` (real cache shape, `resetCredits` present), `claude_keyed` (object-keyed windows), `claude_no_reset_over` (98% without reset pauses).

## Docs
None affected: no doc describes the window parsing or the printed reset.

For later items: none.
Needs the user: none.
