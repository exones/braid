The board stops reading "Stalled after a nudge" on braids that work in the background or wait on purpose. Three real false stalls drove it: everix4 0010/B, everix4 0012/B and dctl-studio 0011/E.

**Background work counts as running.** There is now one rule for "running": `working` in `src/board/t3.ts`. A thread runs when T3 says `running` or `waiting`, when it has background work pending (`pendingBackgroundTasks` is non-empty), or when it is blocked on a thread wait (`blockedOnThreadWait`). Two places apply it:
- `readFresh` uses it for the listed threads, that is workers, coordinators and idea threads.
- `statusOf` uses it for the `states` map (the PM's thread) and for `thread show` (recorded reviewers, PM checkers and `braid clean`).

So a working thread reads `running` everywhere the board asks, and nothing that waits on it is nudged or reads stalled. Both fields are in `t3 thread list --json` and in `thread show --json`. I checked this live: the 0075 coordinator thread read `status: waiting` with one pending subagent task.

**A timed wait.** `braid ask <id> "<why>" --to self --done-when time:<iso>` opens one. The coordinator approved this shape before I built it.
- It is the same request record with `to: self`. `isWait` includes it, and `isTimedWait` names it.
- It goes in the board's waits, so there is no lane change, no Needs You and no push. It isn't reminded, because no one is addressed. It never breaks as a wait on a braid does.
- The card shows "Waiting until 04:15: q-xxxx <why>", with the date too when it isn't today. The Requests tab lists it under "Waiting" (was "Waiting on others") with a "waiting until" badge. `braid requests` lists it as `wait … waiting until <time>`, and its history says "a timed wait, nobody asked".
- Until its time it holds off the item's and the braid's stall. `waits` in `src/board/model.ts` keeps it only while its time is ahead.
- At its time, the existing time wake closes it as `met` and wakes the asking thread once. After that the stall clock runs as before: the nudge after ten minutes, the stall ten minutes later.
- `--to self` without a `time:` done-when is refused, and nothing opens. A request with no `--to` is still the user's question.

**Validation.** `test/board-no-false-stalls.test.ts` has six tests:
- The running rule.
- dctl-studio 0011/E: a worker T3 shows `waiting` with an awaited gate task, a coordinator and a recorded reviewer T3 shows `waiting`. All are running, and the item is never nudged or stalled.
- 0010/B: a worker `completed` with a background command, a coordinator `waiting` and blocked on a thread wait, a reviewer and the PM with background work. All are read through `readT3` from T3-shaped JSON, then run through the card, the programme and the nudger for 30 minutes each. Nobody is nudged.
- 0012/B: a timed wait on a lone braid with an idle coordinator. No lane, no need, no push, no nudge and no reminder until its time. The wake then closes it and sends the usual `Wake:`, and the nudge and the stall come back as before (nudge at +10 minutes, stall at +20).
- A timed wait whose time has passed holds nothing off, even before the wake records it.
- The CLI: the refusals, the output, `braid requests`, and replacement (a timed wait replaces a timed wait, never the user's question).

The gate (`npm run verify`) passes, run in split steps because one run goes past the tool's 10-minute limit. The steps were the docs gate, the OIDC guard, typecheck, build, then `node --test` over the 63 test files in two halves: 304 + 387 = 691 tests, all pass, about 19 s + 224 s + 346 s. One earlier full `npm run verify` run had one failure, `requests.test.ts:338`. That test has six processes write the request record at once and checks that all six exit cleanly; one exited 1 under load. It passed alone (20/20) and in the split run, and this change doesn't touch the lock code, so I read it as a flake.

**Skill.** `.agents/skills/braid/SKILL.md`, under "Talking to the user": one new line, "Idle on purpose until a time", right after the line on how a waiting turn ends with an open request. One line removed: "The user's approvals are never boxes…" was folded into the end of the "Decision" option-set line, so its content is kept. Counts:
- `SKILL.md`: 233 lines before and after.
- `.agents/skills/`: 1086 lines before and after; bytes 116911 before, 117377 after (+466, the new line's text).

**Docs updated.** `docs/board.md` has a new "What runs" paragraph, a new "Timed waits" paragraph under Reminders, and updates to the item `stalled` condition and the Requests tab groups. `docs/cli.md` covers `braid ask --to self`, `docs/braids-format.md` the request `to` field, and the `braid ask` help line in `src/cli.ts` and its usage line cover the timed wait.

**Merging into 0075/C.** The change stays local, as the brief asked. "Running" is the `working` predicate, applied where T3 is read, and "deliberately waiting" is the `waits` filter in `model.ts`. When the braid branch merges `main`, 0075/C's restructured stall derivation only needs to keep calling `waits(...)` and to read T3's `threads`/`coordinators`/`states` as before.

Decisions: the coordinator approved the timed-wait shape ("go, as proposed"): `--to self` with a required `time:`, stored as `to: self`, counted with the waits, and the card line "Waiting until <time>". My own:
- A working thread's status reads `running` in `states` and in `thread show`. I did this instead of adding a separate field, so every consumer (the PM, `pmGone`, nudge targets, `braid clean`) gets it at once.
- The Requests tab heading is now "Waiting".
- I folded the approvals line into the Decision bullet rather than deleting its content.

For later items: a PM's own timed wait (`pm/<slug>` with `--to self`) isn't supported; `--by pm` with `--to` is refused as before. 0075/C, when it merges `main`, should keep `working` as the one running rule and `waits` (with the timed-wait time filter) as the one deliberately-waiting rule.

Needs the user: none
