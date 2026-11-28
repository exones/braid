---
id: '0084/C'
title: "Several open questions on the board"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0084/A', '0084/B']
order: 30
---

## Goal

The board shows every open question of an item, on the card, in the details panel, in the Questions panel and in the programmes panel, as 0084/B's approved mockups show them, and each is answered on its own. Pushes and wakes treat each question on its own.

Expected size: about 400 lines in 10 files, tests included.

## Start here

- `braids/0084-several-open-questions-per-item/B-mockups-several-open-questions-on-the/`: the approved mockups, the report and the user's verdicts in its log.
- `src/board/signals.ts`: `requests` and `asks` map one request per item id (the later one wins); `src/board/programme.ts` reads one `pm/<slug>` request.
- `src/board/model.ts` (`routing`, `derive`, `Need`, the braid card, `waitsOf`), `src/board/questions.ts` (the panel's list), `src/board/record.ts`, `src/board/demo.ts` (demo data), `src/commands/board.ts`.
- `src/notify/message.ts` and `src/notify/notifier.ts`: the push sequence is per item (`sequenceOf(repo, id)`), so a second question would replace the first on the phone and a clear would remove both.
- `web/src/App.tsx`: the card, the details' Requests tab, the panel.
- `docs/board.md`; decisions D46 and D118 in `docs/decisions.md`.

## Change

- Signals hold every open request per item and asker, and per programme, not one.
- The card and the details panel show every open question, as the approved mockups do. The lane rule doesn't change: any open question puts the item in Needs You, a `review` in To Review, as today.
- The Questions panel lists each open question as its own row, answered on its own; ranking as today.
- The programmes panel shows every open `pm/<slug>` question.
- Each question is pushed on its own, and clearing one leaves the others' pushes.
- The demo (`braid board --demo`) has an item with three open questions and a programme with two.

## Already decided

- Read the braid brief `braids/0084-several-open-questions-per-item/brief.md` "Already decided": it is binding.
- 0084/A changed the record and the CLI; the record format is unchanged.
- The look is the user's approval of 0084/B; anything the mockups leave open goes to the coordinator before it is built.

## Out of scope

- Lanes, the Held lane and Hold all (P5).
- The record and the CLI (0084/A).

## Completion

- [ ] With three open questions on one item the board's API and page show all three on the card, in the details and in the Questions panel, and answering one from the board leaves the other two (tests)
- [ ] A programme with two open `pm/<slug>` questions shows both in the programmes panel and the Questions panel (test)
- [ ] Each question gets its own push, and closing one clears only its own (test)
- [ ] `braid board --demo` shows an item with three open questions; screens in the item folder match the approved mockups
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
