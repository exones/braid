# 0071/C report

## What changed

- **One nudge for a real stall** (`src/board/nudge.ts`, run after the wake and the reminders in the steerer's tick):
  - When a coordinator stall (an item's or a braid's own) or a programme stall has held ten minutes, the board sends that thread one message. The coordinator's: `Nudge from the board: 0071 looks idle: no running agent, no open request or wait, no hold. Go on with the next step, or open a request or wait and end your turn.` The PM's names the programme and "no braid running".
  - Per the user's verdict (q-ocph) the card shows nothing for the nudge and stays where it is.
  - If the stall still holds ten minutes after the nudge, the card shows it: "Stalled after a nudge: the coordinator stopped and nothing was asked" (the PM's: "…the PM stopped and none of its braids is running"). A PM-run braid's PM then gets one message. A programme stall has nobody above it, so only the card shows it and pushes as before (0069's rule).
  - Anything that ends the stall (an agent runs, a request or wait opens, a hold) clears it, and a later stall is nudged again.
  - Only an idle coordinator thread, or a PM thread T3 lists and that isn't archived, can be nudged. With none, the stall shows after ten minutes as today.
  - A held or paused braid or programme is never nudged (the stall conditions already exclude it; a test covers it for a pause and for a held plan).
- **The memory** is the alarm clock, `.braid/broke.json`: `<key> stalled nudged` and `<key> stalled escalated` sit beside the first-seen time (`brokeClock` in `src/board/signals.ts`) and are dropped with it. No new file.
- **2h98, the PM check seen by the board: by a record.** T3 offers no way: `thread list` carries `parentThreadId` and `relationshipToParent` but lists no subagent (none of 389 threads here), and `thread show` of the PM thread has no children. So `braid review pm/<slug> --thread <id>` (the same call as for reviewers, no checkout recorded) records the PM's checker, and the board counts it for that programme while T3 says its thread runs. **0071/D** puts this call into the braid-pm skill, right after `delegate_task` of the checker.
- **Leftovers:**
  - The `EVENTS` comment in `src/braids/requests.ts` no longer mentions a send for a gone addressee.
  - 1oq8: the wake skips a request on a held or paused programme (`pm/<slug>`; plan held, or every open braid of it held or paused) until it resumes.
  - dy2k: the wake and the reminders read the record again right before each send, and the nudge reads `.braid/broke.json` again, so a second board of the project skips what the first recorded. No new file and no single-board rule.

## Why

The nudge is the safety net for a coordinator whose wake never came (kq5k): a real stall first gets a message, and the user is told only if that didn't help. A record for the PM's checker is the only way to see a subagent, since T3 lists none (2h98).

## Validation

- `test/board-nudge.test.ts` (new, 12 tests):
  - A braid with and without strands: nothing before ten minutes, one nudge at ten, nothing on the card, the stall at twenty with the after-nudge text, still one send.
  - A stall that ends and comes back is nudged again; no idle coordinator thread shows the stall at ten minutes as before.
  - A PM-run braid: the PM is told once.
  - A paused braid and a braid of a held plan, and a held programme, are never nudged.
  - A programme stall nudges the PM once, then shows the stall; a gone PM thread shows it at ten minutes.
  - A failed nudge is sent again once; two boards of one project send it once.
  - Two boards on one record: a wake and a reminder the other board recorded meanwhile are skipped; a held or paused programme's request is not woken until it resumes.
- `test/reviews.test.ts`: `braid review pm/<slug>`, and the board's `pmChecks` from a recorded checker that runs, and not once it ended.
- `test/programmes.test.ts`, `test/notify-rule.test.ts`: the stall tests now start from a nudged stall.
- Gate `npm run verify`: 650 tests pass.

## Docs

- `docs/board.md`: a "Nudges" paragraph under Broke, the wake skipping a held programme's request, the programme stall and its checker.
- `docs/cli.md`: `braid review pm/<slug>`.
- `docs/decisions.md`: untouched; the dated decision about the board's acts is 0071/E's.

## Open

- A send in the same instant as another board's can still go twice; the window is one send long.
- Records of a PM's checker are never dropped (`braid clean` works per braid); a finished one costs one `thread show` per refresh. Dropping them with the programme is for a later item.
- The after-nudge stall of an item that has an idle coordinator thread is shown on the item; a running coordinator is not nudged (it is busy), and such a stall shows after ten minutes as before.

For later items: 0071/D: the braid-pm skill records the checker right after launching it: `braid review pm/<slug> --thread <child id>`; a coordinator, on a nudge, should go on or open a request or wait (the skills say what a nudge is). 0071/E: the dated decision can cite the nudge memory in `broke.json` and the checker record.
Needs the user: none
