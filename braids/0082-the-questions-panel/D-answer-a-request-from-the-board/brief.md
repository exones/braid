---
id: '0082/D'
title: "Answer a request from the board"
status: To Do
labels: ["kind:story", "tier:L", "ask:security"]
dependencies: ['0082/C']
order: 40
---

## Goal

The user answers an open request from the board: one of its options or one line of free text, recorded on the request record as the user's answer exactly as `braid answer` records it, and the asking coordinator or PM is woken with it at once. This is the board side of the Questions panel (0082/E builds the panel's buttons on it).

Expected size: about 300 lines in 6 files, tests included.

## Start here

- `src/commands/board.ts`: `postAction` (about line 675: the local listener needs this run's token, the Tailscale listener a board page's header and serves only the tailnet owner; `open` is refused there) and the actions map (about line 544: `merge`, `start`, `promote`, `open`, `resume`). A new `answer` action goes beside them, through the same guard.
- `src/commands/requests.ts` `answerCommand` and `src/braids/requests.ts` `answer`: the lock, the record write and push, the refusal of a closed request, the letter-to-option rule 0082/C added.
- `src/board/wake.ts` (`answerWakeMessage`, `waker`) and D113 in `docs/decisions.md`: today the board wakes the asker only for an answer recorded outside its thread by someone other than the user (the user's answer only on a request that went to the PM or was forwarded).
- `docs/board.md` ("Actions", "Wakes", the Tailscale section) and `src/board/tailnet.ts` (who may use the Tailscale listener).
- D118 (the approved design): one click on an option sends at once, with no undo.

## Change

- A board action `answer`: body `{ project, handle, text }`, where `text` is a letter of a stored option or one line of free text (at most 500 characters, no newlines). It records through the same code as `braid answer`, as `by: user`, and refuses a request that is no longer open (answered, withdrawn or met in the meantime) with a message the page shows. The page's answer is the user's own, so it counts as the user's reply wherever an answer by the user counts (D113 wins over a PM's later answer as today).
- The wake: an answer recorded by the board wakes the asking thread once, with the same text and the same `reminded` memory D113 uses, whoever the request was for. No new event kind or record field.
- The page side is only an `api.ts` call and its error handling; the panel's buttons are 0082/E.
- Tests: answer by letter and by text; a closed request refused; a request of another project refused; the token and the Tailscale header required (as the other actions' tests do); the asking thread woken once and not again on the next refresh.

## Already decided

- The board's write actions already exist (`merge`, `start`, `promote`, `resume`) behind `postAction`'s guard; `answer` uses that guard and adds no new way in.
- One click sends at once, with no undo (the user's 1A, D118).
- The user, 2026-11-27 (smooth-window-jjid, ask:security): "A. Both listeners, no confirmation": `answer` runs on the local and the Tailscale listener alike, behind the same guard, with no confirmation step.
- The Tailscale listener answers only its owner (`tailscale whois`, 0067, 0077/I).

## Out of scope

- The panel and its buttons (0082/E); answering from pushes or the phone strip.
- Changing who the board's listeners serve.

## Completion

- [ ] The board's `answer` action records an option or a free-text line as the user's answer, through `braid answer`'s code, with tests
- [ ] A request no longer open, or of another project, is refused with a clear message, with tests
- [ ] The action has the same guard as the other actions on both listeners, with tests
- [ ] An answer recorded from the board wakes the asking thread once, with a test
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
