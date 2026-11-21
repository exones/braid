## What changed
`test/notify.test.ts`, test "a hanging send returns at once…": removed `assert.ok(performance.now() - began < 50)`, the only wall-clock assertion, and put `assert.equal(calls, 0)` in its place right after the two synchronous `notify` calls. The notifier starts each send in a later microtask, so `calls === 0` proves notify returned before the send began, whatever the machine speed. No product code changed.

## Why
That 50 ms bound could fail when the machine was loaded (the failure seen during 0049/A). The other timers (`timeoutMs: 150`, `2_000`) only fire for a send that never settles; no assertion measures time, and the in-flight check holds even if the 150 ms timer fired early, because the second call is made synchronously.

## Validation
- Could not reproduce the original failure: 36 runs with 12 copies in parallel on the old code all passed, so the cause is the 50 ms bound by reading.
- New code, 24 runs in a row, 6 copies in parallel: `for r in 1 2 3 4 5 6; do (for i in 1 2 3 4; do node --test test/notify.test.ts >/dev/null 2>&1 || echo FAIL; done) & done; wait` printed no FAIL.
- `npm run verify` passed (398 tests).

For later items: none.
Needs the user: none.
