---
id: '0072/D'
title: "The PM records its own answers and the board wakes the asker"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: []
order: 40
---

## Goal

The PM records its own answer to a coordinator's request on the record (`braid answer <code> --from pm --reason …`), and the running board wakes the asking thread with the answer, once, as it does for a met condition. A PM's thread message lost in transit then costs nothing, and the escalation never reaches the user for a request the PM already answered.

Expected size: about 200 lines in 4 files, tests included.

## Start here

- Inbox idea 2026-11-24-vpml, taken in: "A PM's answer was lost in transit (dctl-studio, 2026-11-24): the PM approved Q-vvb7 at 20:25:03 with t3_thread_send to the 0011 coordinator just as that thread settled after its turn. T3 cancelled the new run (run 35, no message item), so the coordinator never recorded the answer. At 20:46 the board escalated the request to the user and sent a push, although the PM had decided. Fix, following 'lean on reliable calls like requests': the PM records its own answer, 'braid answer <code> --from pm --reason', on the record branch, and the board's wake (0071) tells the coordinator its request was answered, so a lost message costs nothing. Escalation then checks the record, not the coordinator's bookkeeping. The coordinator stops recording PM answers."
- `src/board/wake.ts`: `waker` (send first, then record the ending: the `met` event is the memory of a delivered wake), `wakeMessage`, `safeText`.
- `src/braids/requests.ts`: `EVENTS`, `parseRecord` (an unknown event kind makes the whole file a problem for older braid versions), `addEvent`.
- `src/commands/requests.ts`: `answerCommand` (`--from pm --reason`).
- `src/board/pm.ts` `routeOf`: escalation reads only open requests, so an answered request never escalates.

## Change

- The board's wake also covers a request answered by someone other than its asker (the PM, or the user through the PM or the board): the asking thread gets one `t3 thread send`, e.g. `Wake: q-7f3k answered by the PM: <answer> (reason: <reason>). Recap it in one line, then act.` The answer goes through `safeText`.
- Exactly once, as the met wake: something on the record says the wake was delivered, written only after a successful send. Prefer a form older braid versions still read (for example an existing event kind with a clear `text`); a new event kind is a stored-format change and a `data` case: ask the coordinator first.
- Answers recorded before this version runs are not woken (a cut-off by time, or only answers without a delivery mark after a start time), so old answers don't flood threads.
- Tests: an answer by the PM wakes once across refreshes and across two boards, a failed send retries, an archived thread is skipped, a held braid waits, an answer by the asker itself wakes no one, old answers wake no one.

## Already decided

- The PM records its own answers; the coordinator stops recording them (the braid's "Already decided"). The skill changes are 0072/E.
- Related to 0074: 0074/B (One acting board per provider account and repository) changes which board runs the acting steps, `src/board/wake.ts` among them. If 0074 has merged into `main`, merge `main` into the braid branch before starting; otherwise keep the change inside the wake step, so the merge stays small.

## Out of scope

- The skills (0072/E). The pause, limits and steering code (0074).

## Failure modes and required regression tests

- A wake sent twice (two boards, a crash between send and record): no more than the met wake allows, tested as it is.
- A wake marked delivered whose send failed: the mark is written only after a successful send, tested.
- Old answers flooding threads on the first run: tested with a record holding older answers.

## Plan

1. `src/braids/requests.ts`: `markAnswerWoken(root, code, event)`: appends a `reminded` event (by `board`, text `answer sent to the asking thread`) to an *answered* request inside the write, once (a second mark is refused inside the write). No new event kind, no new field: `reminded` is a kind every braid version since 0071 reads, and on a closed request nothing reads it but the history (`braid requests <code>`).
2. `src/board/wake.ts`, inside the wake step: after the met loop, each request answered (state `answered`) by someone outside the asker's own thread, at or after the cut-off and within a day, with an asking thread that isn't archived and a braid not held or paused, and with no wake mark yet, gets one `t3 thread send`: `Wake: <handle> answered by the PM: <answer> (reason: <reason>). Recap it in one line, then act.`; only after a successful send the mark is written. The same memory as the met wake: the record is read again right before the send (a second board), a failed send writes nothing, a mark write that throws is retried without sending (the codes sent are kept for the board's life).
3. Who is "outside the asker's thread": the asker's role never wakes itself (`by` = asker); the user's answer wakes a coordinator only when the request went through the PM (`to: pm` or forwarded), where the PM records it; a request straight to the user is answered in the asker's own thread. Anything else (the PM, the board) wakes.
4. Cut-off: answers before `ANSWER_WAKES_FROM` (this version's date) or older than a day are never woken.
5. Tests in `test/board-wake.test.ts`; docs: `docs/board.md` (Wakes), `docs/braids-format.md`, `docs/cli.md` (`braid answer`), `docs/decisions.md` (D110).

## Completion

- [x] An answer by the PM (or by anyone but the asker) wakes the asking thread once with the answer and the recap line, with the tests above
- [x] Older braid versions still read the record, or the coordinator approved the format change (log entry)
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
