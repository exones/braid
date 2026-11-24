# 0071/E report

**What changed.** ozjp: `braid review pm/<slug>` replaces the programme's older record (`src/braids/reviews.ts`), and the board drops a `pm/` record once `thread show` says the thread isn't running (`src/board/t3.ts`, `dropEndedChecks`); a thread T3 can't be read for stays recorded. One test covers both (`test/reviews.test.ts`). Docs: D100 (the board wakes, reminds and nudges without a click, with the send-then-record rule, the nudge memory in `.braid/broke.json` and the checker record) and D101 (a wait replaces only a wait, the rf9z change to D89's "one open request per asker"), D45 and D89 notes, a dated log entry; the `braid help` requests line gains "expected by".

**Why.** A finished checker cost one `t3 thread show` per refresh for ever; the docs described A to D piecewise.

**Docs checked:**
- README.md: updated (a "Waits never go quiet" bullet).
- docs/getting-started.md: updated (wait with a condition, estimate, nudge; short line on the board, full question in chat).
- docs/cli.md: updated (`braid review pm/<slug>` replacement and drop); `braid ask`, `braid eta`, `braid requests` already current from A to C.
- docs/board.md: updated (the exceptions to "the board acts only on your click" now name wake, reminders and nudge); Wakes, Reminders, Nudges already current.
- docs/autonomy.md: unchanged. docs/development.md, docs/npm-distribution.md: unchanged.
- docs/braids-format.md: updated (checker record); events, `reminded` and the older-CLI warning already stated.
- docs/decisions.md: updated (D100, D101, D45/D89, log entry).
- docs/roadmap.md: updated (0071 built).
- CLI help text: updated (`requests` line: expected by).

**Validation.** `node --test test/reviews.test.ts` passes (12); the gate `npm run verify` result is in the PR.

**Open.** Nothing. The older-CLI note (a `reminded` event is unreadable to a CLI older than 0071/B) is in braids-format; the final recap should tell the user to update.

For later items: none.
Needs the user: none.
