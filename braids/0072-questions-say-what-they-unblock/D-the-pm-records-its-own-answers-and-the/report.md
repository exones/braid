# 0072/D report: the PM records its own answers and the board wakes the asker

## What changed

- `src/board/wake.ts`: the wake step also wakes the asking thread of a request **answered outside that thread**, once: `Wake: yellow-bear-5asx answered by the PM: <answer> (reason: <reason>). Recap it in one line, then act.` Answer and reason go through `safeText`. `answerFromElsewhere` decides who counts as outside the asker's thread: the asker's own role never wakes itself; the user's answer wakes a coordinator only on a request that went to the PM or was forwarded (the PM records it then); a request asked of the user straight is answered in the asker's own thread. Anything else (the PM, the board) wakes.
- Exactly once, the same way as the met wake: send first, then the mark. The record is read again right before the send (a second board), a failed send writes nothing and is retried, a mark that fails to write is retried without sending again (the codes sent are kept for the board's life). Archived asking threads are skipped; a held or paused braid's (or programme's) answers wait until it resumes.
- The mark is `src/braids/requests.ts` `markAnswerWoken`: a `reminded` event by `board` with the text `answer sent to the asking thread` (`ANSWER_WOKEN`, read by `answerWoken`), appended to an answered request inside the write and refused when it is already there. **No stored-format change**: `reminded` is an event kind every braid version since 0071 reads; on a closed request only the history (`braid requests <name>`) shows it. No data case for the PM.
- Old answers: answers recorded before `ANSWER_WAKES_FROM` (2026-11-25 23:00 UTC) or more than a day before the refresh are never woken.
- Escalation: unchanged code. `routeOf` and the board read only open requests, so a request the PM answered on the record never escalates; the lost-message case from idea 2026-11-24-vpml now ends with the wake instead.

## Why

A PM's thread message was lost in transit (dctl-studio, 2026-11-24) and the board escalated a request the PM had decided. With the answer on the record and the board delivering it, a lost message costs nothing (D110).

## Validation

- `test/board-wake.test.ts`, 8 new tests: a PM's answer via `braid answer --from pm` wakes once across refreshes and a restarted board, with the mark in `braid requests <code>`'s history; a second board sends nothing and a second mark is refused; a failed send writes no mark and is sent once later; a failed mark write is retried without a second send; an archived asker is skipped and a held braid waits until it resumes; answers in the asker's own thread (coordinator asked the user; the PM asked the user) wake no one while the user's answer to a forwarded request wakes the coordinator; answers before the cut-off or older than a day wake no one; the message drops shell characters and missing parts. All 22 tests in the file pass (the existing 14 unchanged).
- Gate: see "Gate" below.

## Docs

- `docs/board.md` (Wakes: "Answers recorded elsewhere"), `docs/braids-format.md` (the `reminded` event's answer mark), `docs/cli.md` (`braid answer`), `docs/decisions.md` (D110).

## Gate

Local `npm run verify` (21 min 42 s under load): typecheck and build pass; tests 735 of 737 pass. The only failures are the two multi-process lock tests in `test/requests.test.ts` ("overlapping writers in separate processes lose no update", and "... when they start on a stale lock"), leftover 2026-11-25-2hkx being fixed in 0078/J, code this strand does not touch. Verify stops at the test step, so lint and the Pester suites ran only in CI; CI's green verify on ubuntu and windows is the gate's evidence, as the coordinator allowed.

## Open

- Until 0072/E changes the skills, a coordinator that records the PM's answer itself (`--from pm`) gets one redundant wake for it; harmless.
- D110 may clash with a D-number on 0074's branch; renumber at that merge.

For later items: 0072/E: the PM records its own answers with `braid answer <name> --from pm --reason …` and the coordinator stops recording them; the skill can say the board's wake delivers the answer ("Wake: … answered by the PM …"), so the coordinator recaps it from the wake. 0072/F: docs as a whole.

Needs the user: none
