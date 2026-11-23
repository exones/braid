---
id: '0071/A'
title: "Waits wake their asker: braid and time conditions, one wake, waits apart from questions"
status: In Progress
labels: ["kind:story", "tier:L"]
dependencies: []
order: 10
---

## Goal

When an open request's "done when" holds, the running board closes it as met on the record and sends the asking thread exactly one wake message. Today only `pr:` is checked, and the board applies `met` only in memory (`braid requests` is the only writer); `braid:<n>` and `time:<iso>` are stored but never checked, and nobody is woken. Also: a wait no longer withdraws its asker's open question (inbox 2026-11-23-rf9z).

Expected size: about 400 lines in 8 files.

## Plan

1. `src/braids/requests.ts`: one check, `conditionEnding(request, check)`, for `pr:` (and a review's PR, as `voidEnding`), `braid:<n>` (Done on `origin/<main>`) and `time:<iso>`; `filterLive` and `liveRequests` take it (a bare `prOf` still works). `openRequest` replaces by sort: a question a question, a wait the wait to the same braid; `forwardRequest` never forwards a wait.
2. `src/board/signals.ts`: `ended` uses the same check (pr and time; `braid:` shows once recorded).
3. `src/board/wake.ts`: the wake step, run by the steerer's tick for each project after a good read: skip held or paused asking braids; fetch main when a `braid:` wait is open; for each request whose condition holds: send the wake (met, with a thread, not archived), then record the ending with `endRequest`. Withdrawn endings and thread-less requests are recorded without a send.
4. Order: send first, record after. The `met` event is the memory; no new event kind, no new field. A failed send records nothing (retried next refresh); a failed push keeps the local commit (read back, never resent); a record write that throws after a send is retried without resending (codes kept in memory). The gap: a board killed between the send and the local commit may wake twice.
5. `braid requests` (CLI) checks through the same function, fetching main for `braid:` waits.
6. Tests: each condition, once across refreshes and a restart, failed send, failed push, failed record write, held/paused, board write racing a CLI write, rf9z replacement.
7. Docs: docs/board.md (the wake), docs/cli.md (`braid requests`, `ask` replacement), docs/braids-format.md if it states replacement.

## Start here

- The braid's brief (`braid view 0071`): "Already decided" binds this strand.
- `src/braids/requests.ts`: `RecordFile`, `withEvent`, `endRequest`, `openRequest` and `same` (replacement), `conditionPr`, `voided`, `voidEnding`, `filterLive`, `liveRequests`.
- `src/board/signals.ts`: `readSignals` and `ended` (the in-memory `met`), the split of waits from requests.
- `src/board/feed.ts` (where `act` runs after a good read), `src/commands/board.ts` (`acting()`, `mergeAction`: how the board sends with `t3 thread send`), `src/board/steerer.ts` (what an automatic send looks like, and how a failed send is handled).
- `src/braids/branches.ts` (`braidAt(root, "origin/main", n)`), used by `braidOf` in `src/commands/requests.ts`: whether a braid is Done on `main`.
- `src/board/pauses.ts`, `src/board/programme.ts` (`heldPauses`), `src/board/model.ts` (`pausedBraid`): held and paused braids.
- Tests: `test/board-requests.test.ts`, `test/requests-record.test.ts`, `test/board-steer.test.ts`.

## Change

- One condition check, shared by the board and `braid requests`: `pr:<n>` (as today), `braid:<n>` (that braid is `Done` on `origin/main`), `time:<iso>` (now is at or after it). Extend the existing helpers; no second checker.
- The board, in its `act` step after a good read: for each open request whose condition holds, append `met` (`by: board`, the condition's text) on `braid-requests`, then send the asking thread one message, e.g. `Wake: q-7f3k is met (braid 0064 merged into main): <the request's text>. Go on where you left off.` Withdrawn endings (`pr:` closed, a review's head moved) are recorded the same way, with no wake.
- Exactly once: the `met` event is the memory. Decide and log the order of record and send so a crash or a failed push never sends twice and never loses the wake for good (for example: record first, then send, and a `met` with no recorded send is retried at the next refresh; or another way that keeps to the record). A request with no `thread` is closed without a wake.
- Skip a braid that is held or paused (as asker): its requests stay open until it resumes.
- Replacement (rf9z): in `openRequest`, a request to the user or the PM replaces only the same asker's open request to the user or the PM on the item; a wait (`to` a braid) replaces only the same asker's open wait to that braid on the item.
- `braid requests` keeps recording endings when the board isn't running, through the same check.

## Already decided

- Everything in the braid's "Already decided".
- Conditions are stored normalised as `braid:0042` and `time:<UTC ISO>` (0070).
- The PM, with the plan: the running board now writes `met` to `braid-requests` while CLI commands write too; reuse 0070/A's refused-push retry, and test a board write racing a CLI write.
- No new state file, and no new event kind for the wake unless the order above needs one; say in the report which you used and why.

## Out of scope

- Reminders, `braid eta`, card text (0071/B). Nudges (0071/C). Skills and docs (0071/D, 0071/E).

## Completion

- [ ] The running board records `met` for open requests whose `pr:`, `braid:` or `time:` condition holds, and sends the asking thread one wake message; a test covers each condition.
- [ ] A test shows the wake is sent once across two refreshes and across a board restart, and that a failed send or failed push neither repeats a delivered wake nor loses an undelivered one.
- [ ] A held or paused braid's requests are not closed or woken; a test covers it.
- [ ] A wait does not withdraw its asker's open question on the same item and the reverse; a question still replaces a question and a wait to the same braid a wait (tests in `test/requests-record.test.ts`).
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
