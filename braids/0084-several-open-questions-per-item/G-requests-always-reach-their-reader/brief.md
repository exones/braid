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

Expected size: about 320 lines in 7 files, tests included.

## Start here

- Idea 2026-11-28-ik3c (`braid inbox`, taken into 0084): `acceptCommand` in `src/commands/done.ts` calls `closeRequest(root, id, undefined, …)` (`src/braids/requests.ts`), which closes every open request of the item: a `review` as `met`, anything else `withdrawn` "the item is accepted". On another project (everix 0018/G), request gentle-garden-v0ml (a decision, key outward) was forwarded by the PM to the user at 16:16Z and withdrawn by `braid accept --merge` at 16:19Z; the user never saw it. `braid start` (`src/commands/start.ts`) calls the same `closeRequest` and has the same hole.
- Idea 2026-11-28-9ho1: on everix 0018/F, request gentle-carrot-b61k was answered on 2026-11-26 14:19Z through the CLI, and its history has no `reminded` event "answer sent to the asking thread" (`ANSWER_WOKEN`, `markAnswerWoken` in `src/braids/requests.ts`); its coordinator found the answer two days later. The wake is sent only by a running board (`src/board/wake.ts`, docs/board.md "Wakes"); on 2026-11-28 the board service was stopped for hours, and an answer recorded while no board runs, or one the wake's checks skip (`answerWoken`, `archived`, `live`, the `since` window at line ~225), may never be sent.
- `src/commands/requests.ts` (`braid answer`, the board's answer action), `docs/board.md` "Wakes", `docs/cli.md` `braid answer` and `braid accept`.

## Change

- `braid accept <item>` (with or without `--merge`) refuses while a request on the item that isn't the coordinator's own is open (one the PM forwarded to the user, or one the PM asked, `by: pm`): it names each one (name, kind, who holds it) and changes nothing. It still closes the coordinator's own unforwarded requests as stale, as today. `braid start` (same `closeRequest`): keep such requests open and name them rather than refuse, since a start blocks no merge; say which you chose in report.md.
- The answer wake: find each answer path that can end without a wake (the CLI with no board running, the `since` window after a board restart, an archived or unknown thread, anything else you find) and name them in report.md. Make every answered request either get its wake once a board runs, at any later time, or a recorded reason why it couldn't (a `reminded` event with the reason), never silence.
- The board shows an answered request whose wake wasn't delivered as "answer not delivered" (in the Questions panel's Decided and the details' Requests tab) with a Retry action that sends the wake again and records it.
- The forwarder sees the answer (the user, 2026-11-28; seen on another project, request windy-blanket-7l00, forwarded by its PM): an answer, Acknowledge or Dismiss on a request the PM forwarded also wakes the forwarding thread (the PM's) once, with one line: "<name> answered by the user: <answer> (the asker <thread> has it too)". The same for a PM's own request asked for a braid (`--by pm`) that a coordinator's thread also follows, if any. The asker's wake stays as it is. Delivery follows the rule above (woken, or a recorded reason).
- A request's context always shows on the board (the user, 2026-11-28: windy-violin-af9e, a security question, reached the user with only its title after `braid forward`, and they couldn't understand it): the card, the Questions panel and the forwarded view show the stored context, the forward's note beside it, never in place of it. `braid ask --kind decision` or `--key <case>` without `--context`/`--context-file` prints a warning (the request still opens).
- Tests for all four: the forwarded and PM-owned requests survive `braid accept --merge`; an answer recorded while no board runs is woken by the next board start; a wake that fails shows "answer not delivered" and Retry sends it.

## Already decided

- Read the braid brief `braids/0084-several-open-questions-per-item/brief.md` "Already decided": it is binding (no new state or record field where an event or an existing state serves; "lean more to reliable calls like with requests").
- Decided by the PM (2026-11-28): this strand, after 0084/C, tier S–M; the fixes as above.
- Decided by the user (yellow-lantern-xejq, 2026-11-28: "A. Refuse and name the pending requests"): accept refuses while a request with the user or the PM is open; the coordinator waits for the answer or asks the PM; the user's Dismiss and the PM's withdraw close an obsolete one.
- 0084/C changed the board's request views (several per item, Acknowledge, Dismiss): build on them. A Dismiss wakes the asker too, so it follows the same delivery rule.

## Out of scope

- Changing who can answer or forward, or the escalation timers.

## Plan

- Accept and start: `closeRequest` takes a `keep` test; a request forwarded by the PM or asked by the PM is kept. Accept refuses on one before it reads GitHub or changes anything; start keeps and names them.
- Delivery on the record, events only (`reminded` by `board`): an answer recorded by `braid answer` or the board's page writes, in the same write, "answer to send to …" per thread that must hear it (the asker; the forwarder), or the "sent" mark when it was recorded in that thread (`--thread`, else `T3CODE_THREAD_ID`). A wake that can't go writes "answer not delivered to …" with the reason. The board sends owed wakes whatever their age; answers without the "to send" event (an older braid) keep the old rule.
- Board: Decided and the Requests tab say "answer not delivered" with the reason and Retry (action `retry`); the card, the forwarded view and the Requests tab show the context.
- `braid ask` warns on a decision or a stop case without context.

## Completion

- [ ] `braid accept` (with or without `--merge`) refuses while a forwarded or PM-owned request is open, names each (name, kind, who holds it) and changes nothing; the coordinator's own unforwarded ones close as today; `braid start` doesn't close such a request (tests)
- [ ] report.md names every answer path that could skip the wake and how each now ends
- [ ] An answer recorded while no board runs is woken by the next board run (test)
- [ ] An undelivered answer shows "answer not delivered" on the board with a Retry that sends the wake and records it (tests)
- [ ] An answer, Acknowledge or Dismiss on a forwarded request wakes the forwarding thread once with the answer line, and the asker as before (test)
- [ ] A forwarded request shows its stored context on the board; `braid ask` of a decision or a stop case without context warns (tests)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
