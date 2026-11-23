---
id: '0070/C'
title: "Codes and answers on the board and in pushes"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0070/B']
order: 30
---
## Goal

The user sees each open question on the board with its code and a link to the asking thread, and after it is answered sees it listed with who answered (the user or the PM) and the answer. Pushes carry the code. A request that is withdrawn or met takes its push off the phone, as an answered one does.

Expected size: about 300 lines in 6 files, with tests.

## Start here

- The braid's brief (`braid view 0070`) and 0070/B's report: the record's fields and states.
- `docs/board.md`: the lanes, Needs You, the PM panel and notifications as they are today.
- `src/board/model.ts` (`derive`, the braid card), `src/board/pm.ts` (`routeOf`), `src/board/signals.ts`, the board page's rendering under `src/board/`.
- `src/notify/message.ts` (`pushesOf`) and `src/notify/notifier.ts` (sends and clears by sequence id).

## Change

- Mockups first, on realistic test data from the board's demo data (`src/board/demo.ts`): a card with an open question (code, text, who it is for, a link to the asking thread), and where answered and withdrawn questions are listed (who answered, the answer, the PM's reason, the time). Stop and report them; build only after the verdict.
- Then build: the code on every open request the board shows; the asking thread as the link; the closed requests, recent first, with state and who answered; the push text with the code; a withdrawn or met request clears its push.
- Tests: the model and the push rule with codes, an answered request listed with who answered, a withdrawn and a met request clearing their push.

## Already decided

- No Answer button yet; the card links to the asking thread (the user: "will be enough that I can see the question, navigate to the thread, refer to it by some code").
- The push rule from 0069 (one rule from the request's addressee and state) is extended, not replaced.
- The mockups go to the PM first as a decision request (`--to pm`); the PM forwards them to the user, who wants a say on UI.

## Out of scope

- Answering from the board.
- Showing waits' estimates or reminders (P6).
- What a question unblocks (P4).

## Completion

- [ ] Mockups approved; the verdicts are in the log
- [ ] The board shows each open request's code with a link to the asking thread
- [ ] The board lists closed requests with their state, who answered, and the answer or reason
- [ ] Pushes carry the code, and a withdrawn or met request's push is cleared
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
