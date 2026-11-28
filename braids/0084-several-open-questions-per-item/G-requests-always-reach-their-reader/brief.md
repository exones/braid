---
id: '0084/G'
title: "Requests always reach their reader"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: ['0084/C']
order: 35
---

## Goal

Two request bugs, reported by another programme's PM on 2026-11-28, so that a request always reaches whoever has to read it: `braid accept` must not close a request the user still has to answer, and every recorded answer must reach the asking thread, or say on the board that it didn't.

Expected size: about 250 lines in 6 files, tests included.

## Start here

- Idea 2026-11-28-ik3c (`braid inbox`, taken into 0084): `acceptCommand` in `src/commands/done.ts` calls `closeRequest(root, id, undefined, …)` (`src/braids/requests.ts`), which closes every open request of the item: a `review` as `met`, anything else `withdrawn` "the item is accepted". On another project (everix 0018/G), request gentle-garden-v0ml (a decision, key outward) was forwarded by the PM to the user at 16:16Z and withdrawn by `braid accept --merge` at 16:19Z; the user never saw it. `braid start` (`src/commands/start.ts`) calls the same `closeRequest` and has the same hole.
- Idea 2026-11-28-9ho1: on everix 0018/F, request gentle-carrot-b61k was answered on 2026-11-26 14:19Z through the CLI, and its history has no `reminded` event "answer sent to the asking thread" (`ANSWER_WOKEN`, `markAnswerWoken` in `src/braids/requests.ts`); its coordinator found the answer two days later. The wake is sent only by a running board (`src/board/wake.ts`, docs/board.md "Wakes"); on 2026-11-28 the board service was stopped for hours, and an answer recorded while no board runs, or one the wake's checks skip (`answerWoken`, `archived`, `live`, the `since` window at line ~225), may never be sent.
- `src/commands/requests.ts` (`braid answer`, the board's answer action), `docs/board.md` "Wakes", `docs/cli.md` `braid answer` and `braid accept`.

## Change

- `braid accept <item>` (with or without `--merge`) refuses while a request on the item that isn't the coordinator's own is open (one the PM forwarded to the user, or one the PM asked, `by: pm`): it names each one (name, kind, who holds it) and changes nothing. It still closes the coordinator's own unforwarded requests as stale, as today. `braid start` (same `closeRequest`): keep such requests open and name them rather than refuse, since a start blocks no merge; say which you chose in report.md.
- The answer wake: find each answer path that can end without a wake (the CLI with no board running, the `since` window after a board restart, an archived or unknown thread, anything else you find) and name them in report.md. Make every answered request either get its wake once a board runs, at any later time, or a recorded reason why it couldn't (a `reminded` event with the reason), never silence.
- The board shows an answered request whose wake wasn't delivered as "answer not delivered" (in the Questions panel's Decided and the details' Requests tab) with a Retry action that sends the wake again and records it.
- Tests for both: the forwarded and PM-owned requests survive `braid accept --merge`; an answer recorded while no board runs is woken by the next board start; a wake that fails shows "answer not delivered" and Retry sends it.

## Already decided

- Read the braid brief `braids/0084-several-open-questions-per-item/brief.md` "Already decided": it is binding (no new state or record field where an event or an existing state serves; "lean more to reliable calls like with requests").
- Decided by the PM (2026-11-28): this strand, after 0084/C, tier S–M; the fixes as above.
- Decided by the user (yellow-lantern-xejq, 2026-11-28: "A. Refuse and name the pending requests"): accept refuses while a request with the user or the PM is open; the coordinator waits for the answer or asks the PM; the user's Dismiss and the PM's withdraw close an obsolete one.
- 0084/C changed the board's request views (several per item, Acknowledge, Dismiss): build on them. A Dismiss wakes the asker too, so it follows the same delivery rule.

## Out of scope

- Changing who can answer or forward, or the escalation timers.

## Completion

- [ ] `braid accept` (with or without `--merge`) refuses while a forwarded or PM-owned request is open, names each (name, kind, who holds it) and changes nothing; the coordinator's own unforwarded ones close as today; `braid start` doesn't close such a request (tests)
- [ ] report.md names every answer path that could skip the wake and how each now ends
- [ ] An answer recorded while no board runs is woken by the next board run (test)
- [ ] An undelivered answer shows "answer not delivered" on the board with a Retry that sends the wake and records it (tests)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
