---
id: '0069/B'
title: "One rule: push only what a request asks of the user, opening the asking thread"
status: In Progress
labels: ["kind:story", "tier:M"]
dependencies: ['0069/A']
order: 20
---
## Goal

The board pushes only what an open request asks of the user, and every push opens the thread that needs them. One rule in code, from the request record (`to`, `by`, `forwarded`, and its state through `routeOf`), decides both. Today it pushes every item in Needs You or To Review, one per strand need, alarms included, and some pushes carry no thread link: under a PM the user gets "To Review" pushes nobody asked for.

Expected size: about 280 lines in 7 files, half of them tests.

## Start here

- `docs/board.md` "Notifications": today's triggers.
- `src/notify/message.ts` `pushesOf`, `needPush`, `pmAskPush`, `stallPush`; `src/notify/notifier.ts` (keys and clears; leave its sending as it is).
- `src/board/pm.ts` `routeOf` (whom a request is for now) and `src/braids/requests.ts` `Request`.
- `src/board/model.ts` `Need` (`via`, `by`, `link`) and where cards set `thread` and `coordinator`.
- `src/board/programme.ts` (the programmes panel: `needs` and the programme's request) and the board page's card and panel lines in `web/src`.

## Change

- One function (for example `forUser`, in `src/notify/` or next to `routeOf`) is the only place that says whether a need pushes and which thread it opens. A push for:
  - a request addressed to the user (no `to`, or `to: user`), any kind: opens its asking thread (the request's `thread`, else the braid's coordinator);
  - a request to the PM that reached the user: forwarded (opens the PM's thread, the request's `pm`), or escalated by timeout or a gone PM thread (opens the asking thread);
  - the PM's own request (`by: pm`, a programme request): opens the PM's thread, as today.
  - a programme's stall (`pm/<slug>`, Waiting, stalled: its PM thread gone or silent), the one derived need that pushes: opens the PM's thread, as today. A dead PM thread has no one else to ask.
- No push for anything else: a request the PM is handling, a broke alarm (`checks failed`, a braid's `stalled`), an agent's pending question in T3, a Done-stamped story waiting for its handover with no request, a strand PR in To Review with no request (the PM pushes "nothing can run until you act" itself, 0069/D).
- A braid Done pushes only when no programme runs it.
- Under a PM, a forwarded request is the PM asking the user, not the braid (the user: "Pm (you) needed me yes, but not 67 (it talked to you, the PM)"). It shows in the programmes panel's needs-you as `The PM asks you: <text>` (the PM's note after it, as the card shows it today), opening the PM's thread, and pushes as the PM's request does (🧭, the PM's thread); a forwarded merge handover joins 0069/C's merge push instead. The braid's card stays in the lane of its work, with a quiet line `Waiting on the user, through the PM: <text>`. A forward of a braid no programme lists stays on the braid's card, as today. An escalation by timeout or a gone PM thread is the exception: the PM didn't act, so the braid's card goes to Needs You (a handover: To Review), as now. The same rule decides it: the request record (`to`, `by`, `forwarded`, `via`), no new state.
- Every push has a click link. When T3 doesn't list the thread, build the link from the thread id as `t3codeUrl` does, if it can; otherwise the body ends with "Open the board" and the push still goes.
- Tests: each push and no-push case above, and the thread each push opens.
- From the review of 0069/A (https://github.com/exones/braid/pull/255#issuecomment-7089458573), in `test/pm-requests.test.ts` when you move its forwarded-story test: assert `pushesOf` on the missed-PR derive too, and lock that a stored Done with a missed PR and a review still with the PM reads To Do with the PM line.

## Already decided

- The decisions in the braid's brief: no mode setting, no new lane, derived needs never push (the programme stall aside), the thread a push opens.
- No new state file or field: everything comes from the request record and the board snapshot. Keys, sequence IDs and clears keep working as `notified.json` stores them, so a restart sends nothing twice.
- The rule's input is a request's addressee and state, so P3 ("Questions on record") can extend it.

## Out of scope

- Grouping merges (0069/C); `braid notify send` (0069/D); T3's notifications.

## Plan

1. `forUser` in `src/notify/message.ts`: the one rule; `pushesOf` calls it for every need and nothing else decides.
2. A request's `Need` carries `link` (the thread a push opens: asking thread, or the PM's for a forward); `linkOfThread` builds a link from the id when T3 doesn't list the thread.
3. `throughPm` (`src/board/pm.ts`): a forwarded non-handover request of a braid a live programme lists is the PM asking; `derive`/`toCard` keep the card's lane with the line `Waiting on the user, through the PM: <text>`, `toProgrammes` lists it in `forwards` (panel: `The PM asks you: …`), and the push comes from the programme.
4. A Done braid a programme runs pushes nothing; every body without a click ends with "Open the board".
5. Tests (`test/notify-rule.test.ts`, updated notify, pm-requests and programmes tests), the web panel and card line, docs (board.md, cli.md, D92).

## Completion

- [x] One function decides whether a need pushes and which thread it opens; `pushesOf` relies on it alone
- [x] Under a PM, a forwarded request shows in the programmes panel as `The PM asks you: …` opening the PM's thread, and the braid's card stays in its lane with `Waiting on the user, through the PM: …`; an escalation by timeout or a gone PM thread still puts the card in Needs You (tests)
- [x] Tests: a push for each push case in Change (the programme stall included) and none for each no-push case, with the thread each push opens
- [x] Every push in the tests has a click link or ends with "Open the board"
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
