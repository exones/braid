---
id: '0084/C'
title: "Several open questions on the board"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0084/A', '0084/B', '0084/E']
order: 30
---

## Goal

The board shows every open question of an item, on the card, in the details panel, in the Questions panel and in the programmes panel, as 0084/B's approved mockups show them, and each is answered on its own. Pushes and wakes treat each question on its own.

Expected size: about 800 lines in 14 files, tests included.

## Start here

- `braids/0084-several-open-questions-per-item/B-mockups-several-open-questions-on-the/`: the approved mockups, the report and the user's verdicts in its log.
- `src/board/signals.ts`: `requests` and `asks` map one request per item id (the later one wins); `src/board/programme.ts` reads one `pm/<slug>` request.
- `src/board/model.ts` (`routing`, `derive`, `Need`, the braid card, `waitsOf`), `src/board/questions.ts` (the panel's list), `src/board/record.ts`, `src/board/demo.ts` (demo data), `src/commands/board.ts`.
- `src/notify/message.ts` and `src/notify/notifier.ts`: the push sequence is per item (`sequenceOf(repo, id)`), so a second question would replace the first on the phone and a clear would remove both.
- `web/src/App.tsx`: the card, the details' Requests tab, the panel.
- `docs/board.md`; decisions D46 and D118 in `docs/decisions.md`.

## Change

- Signals hold every open request per item and asker, and per programme, not one.
- The card and the details panel show the open questions as the approved mockups do: a card shows the oldest open question plus "+N more"; a folded braid card the most urgent strand's plus "+N more in strands"; with Details off the ? icon shows a count.
- The lane rule changes in one point (amends D46): an item with an open `review` request and an open question is in Needs You, the merge line and Merge button kept above the questions. Otherwise lanes are as today.
- The Questions panel lists each open question as its own row, answered on its own; ranking as today.
- The programmes panel shows every open `pm/<slug>` question.
- Each question is pushed on its own, and clearing one leaves the others' pushes.
- The demo (`braid board --demo`) has an item with three open questions and a programme with two.
- **Acknowledge** (the user, 2026-11-28, idea 2026-11-28-iy7b): an Acknowledge button next to Answer on FYI requests (kind `look`), in the Questions panel, on the card and on the phone. One click closes the request as seen by the user, recorded in braid with no agent turn (no wake, no thread message); it then shows under Decided. Matching CLI: `braid answer <name> --ack`.
- **Dismiss** (the user, 2026-11-28: "I also want the button dismiss on all requests … dismissed by user. Meaning that I close this request without an answer. And if the coordinator still thinks I have to answer, it should raise again. … Sometimes some requests become obsolete after other requests are answered, so I just want to dismiss them."): a Dismiss button on every request, every kind, in the Questions panel, on the card and on the phone, next to Answer (and Acknowledge on FYIs). One click closes the request with no answer, recorded as dismissed by the user; it shows under Decided marked dismissed. Unlike Acknowledge it wakes the asking thread once: "<handle> dismissed by the user without an answer; if you still need it, ask again with what changed." Anything it blocked stays blocked until the asker re-asks or decides otherwise. Matching CLI: `braid answer <name> --dismiss`.
- **Phone: Board | Requests** (the user, 2026-11-28: "I don't like too much how questions are executed on the phone. They are in the very end of the board. I would like rather switch under the project selector because I want to see the board or the questions. And more and more I think I will be on the questions tab. It's like requests."): at phone width, a two-way switch right under the project selector, Board | Requests. Requests shows the Questions panel (0082's) full-screen, with several questions per item, Acknowledge and Dismiss; Board shows the lanes as today, without the panel at the bottom. The last tab is kept per device in localStorage (wrapped in try/catch); whether Requests is the default when something waits on the user is the worker's call, shown in the mockup. The Requests tab shows the count of what waits on the user. Desktop unchanged unless the mockup shows a reason.
- First step, before building: add to 0084/B's `mockups.html` the Acknowledge and Dismiss buttons (the panel row, the card, Decided showing an acknowledged and a dismissed request) and the phone's Board | Requests switch with both tabs, on demo data; push, take screenshots, and stop for the user's look through the coordinator (a `look` request, like 0084/B). Build only after the approval.

## Already decided

- Read the braid brief `braids/0084-several-open-questions-per-item/brief.md` "Already decided": it is binding.
- 0084/A changed the record and the CLI; the record format is unchanged.
- The look is the user's approval of 0084/B; anything the mockups leave open goes to the coordinator before it is built.
- Acknowledge is recorded with no new state or event kind (programme rule): the request ends `answered`, by the user, with the text `Acknowledged`, and its `reminded` event "answer sent to the asking thread" (`markAnswerWoken`, `ANSWER_WOKEN` in `src/braids/requests.ts`) is written in the same write, so the board's wake (`src/board/wake.ts`) never wakes the asker. Only `look` requests take `--ack`; other kinds are refused.
- Dismiss adds no new state either: the request ends `withdrawn`, by the user (`who: user`), with the text `dismissed by the user without an answer`; the board's wake sends the asker that line once, as it does for an answer recorded outside the asking thread. `--dismiss` and `--ack` are flags of `braid answer`, no new command ("don't overblow").
- The user's verdict on 0084/B (lazy-cloud-560n, 2026-11-28): "1. A card with several questions shows the oldest open question plus \"+N more\". Not every question in full. 2. As proposed: the folded braid card shows the most urgent strand plus \"+N more in strands\". 3. As proposed: a PR handover with open questions goes to Needs You, with the Merge button kept above the questions. This amends D46. 4. As proposed: with details off, the ? icon shows a count."
- `requestLines` in `src/commands/coordinate.ts` picks the PM line's handle with `own.findLast`; once signals hold several requests, match the PM's own request instead (0084/A review suggestion 2).

## Out of scope

- Lanes, the Held lane and Hold all (P5).
- The record and the CLI (0084/A).

## Completion

- [ ] With three open questions on one item the board's API holds all three, the card shows the oldest plus "+2 more", the details and the Questions panel show all three, and answering one from the board leaves the other two (tests)
- [ ] A programme with two open `pm/<slug>` questions shows both in the programmes panel and the Questions panel (test)
- [ ] Each question gets its own push, and closing one clears only its own (test)
- [ ] An item with an open review request and an open question is in Needs You with its Merge button (test)
- [ ] Acknowledge on a `look` request (board button, phone, and `braid answer <name> --ack`) closes it as answered by the user with no wake of the asker, and it shows under Decided (tests)
- [ ] Dismiss on any request (board button, phone, and `braid answer <name> --dismiss`) closes it as withdrawn by the user, wakes the asker once with the dismissed line, and it shows under Decided marked dismissed (tests)
- [ ] At phone width the Board | Requests switch sits under the project selector; Requests shows the Questions panel full-screen with a count badge, Board the lanes without the panel; the last tab is kept per device (tests or screens)
- [ ] The user approved the look of the two buttons and the phone switch in the mockups before they were built
- [ ] `braid board --demo` shows an item with three open questions; screens in the item folder match the approved mockups
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
