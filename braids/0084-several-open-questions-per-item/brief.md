---
id: '0084'
title: "Several open questions per item"
status: In Progress
labels: ["kind:story", "tier:L", "ui", "ask:process"]
dependencies: []
related: ['0077', '0082']
delivery: epic
autonomy: free
---

## Goal

The user, 2026-11-27: "We found a hole with questions ... they can stack one on top of another." Today `braid ask` silently withdraws the same asker's open question on the same item ("replaced by <handle>", `replaces` in `src/braids/requests.ts`): a PM asking about P18 on `pm/<slug>` withdrew its open P17 question (giant-spoon) there. After this braid a new question never withdraws an open one; any number stay open per item and asker, each answered by its handle; an id alone is refused when several are open (it lists them); `braid status`, the board card and the Questions panel show every one. Waits keep today's rule (one per target braid). A coordinator that wants to replace its own question withdraws it explicitly.

What a user can try: ask three questions on one item, see three on the board, answer each.

Expected size: about 900 lines in 20 files over four strands, tests included.

## Start here

- `src/braids/requests.ts`: `replaces`, `openRequest` (the withdrawal), `closeRequest`, `endRequest`.
- `src/commands/requests.ts`: `braid ask` ("…opened, replacing <name>"), `target` (the id-alone refusal), `braid handover` (opens a `review` request).
- `src/board/signals.ts`: `requests` and `asks` are maps of one request per item id; `src/board/model.ts` (`routing`, `derive`, the braid card), `src/board/questions.ts` (the Questions panel), `src/board/programme.ts` (a programme's `pm/<slug>` request), `src/notify/` (one push sequence per item), `src/board/wake.ts`.
- `docs/braids-format.md` "Requests", `docs/cli.md` (`braid ask`, `braid answer`, `braid withdraw`), `docs/board.md`, `docs/decisions.md` D96, D118.
- `braids/0082-the-questions-panel/` (the panel's brief, report and approved mockups).

## Change

- 0084/A: the record and the CLI.
- 0084/B: mockups of the board with several open questions on one item, on test data; the worker stops for the user's look.
- 0084/C: the board, as the approved mockups show it.
- 0084/D: the docs and the skills' text as a whole.

## Already decided

- The goal above, quoted from the user through the PM; "Golden pickle A" (runs now).
- Programme rules, binding: "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to reliable calls like with requests". So: no new state or record fields; the record already holds any number of requests per item, and only the withdrawal in `openRequest` and the one-per-item maps on the board go.
- A new question (to the user or the PM, any kind but `review`) never withdraws an open request. A wait (`--to <braid>`) still replaces its asker's open wait to that braid on the item, and a timed wait (`--to self`) its asker's timed wait, as today.
- A `review` request (`braid handover`) replaces only its asker's open `review` request on the item (a new head), never a question. Questions stay open beside it.
- The same for both askers and for programme requests (`pm/<slug>`), which were the case that showed the hole.
- An id alone (`braid answer <id>`, `braid withdraw <id>`) acts only when exactly one request is open for it (and `--by`); with several it lists their handles and changes nothing, as `target` already does for a question beside a wait.
- Withdrawing one's own question to replace it is explicit: `braid withdraw <handle> --why "<reason>"`, then `braid ask`. No `--replace` flag.
- Subagents get no parent context: each strand's brief says what the worker needs.
- Board UI changes get mockups on test data first, and the worker stops for the user's look (0084/B).
- A clear user answer to an open request is recorded first (`braid answer`) before anything else.
- Related to 0077 (The board stays fast under load, on `braid/0077-the-board-stays-fast-under-load`): it changes the board's server code and merges into `main` first; this braid merges `main` into its branch before its final PR.
- Related to 0082 (The Questions panel), in `main`: build on its panel, ranking and answer action.
- P5 (Board lanes, Held lane, Hold all; planned by the PM) changes the board's cards and the Questions panel too: this braid merges into `main` before P5's final PR, and the coordinator tells P5's coordinator what 0084/C changes in the cards and the panel.
- P30 (braid clean with submodules) runs at the same time; no overlap expected.

## Out of scope

- A cap on open questions, merging or grouping questions into one, or a "replace" flag.
- Changing waits, reminders, escalation or the ranking rules of the Questions panel.
- Changing the request record's file format.

## Completion

- [ ] `braid ask` three times on one item leaves three open questions; `braid status`, `braid requests`, the board card and the Questions panel show all three; each is answered by its handle
- [ ] `braid answer <id>` and `braid withdraw <id>` with several open list their handles and change nothing
- [ ] Waits and timed waits keep their rule; a new `review` request replaces only an older `review`
- [ ] A programme (`pm/<slug>`) and the PM's `--by pm` requests behave the same, on the programmes panel too
- [ ] Docs from BRAID.md `docs` that this braid makes untrue are updated, the skills' text included (0084/D)
- [ ] The gate command from BRAID.md passes

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.

## Goal

The user, 2026-11-27: "We found a hole with questions ... they can stack one on top of another." Today `braid ask` silently withdraws the same asker's open question on the same item ("replaced by <handle>", `replaces` in `src/braids/requests.ts`): a PM asking about P18 on `pm/<slug>` withdrew its open P17 question (giant-spoon) there. After this braid a new question never withdraws an open one; any number stay open per item and asker, each answered by its handle; an id alone is refused when several are open (it lists them); `braid status`, the board card and the Questions panel show every one. Waits keep today's rule (one per target braid). A coordinator that wants to replace its own question withdraws it explicitly.

What a user can try: ask three questions on one item, see three on the board, answer each.

Expected size: about 1200 lines in 25 files over four strands, tests and mockups included.

## Start here

- `src/braids/requests.ts`: `replaces`, `openRequest` (the withdrawal), `closeRequest`, `endRequest`.
- `src/commands/requests.ts`: `braid ask` ("…opened, replacing <name>"), `target` (the id-alone refusal), `braid handover` (opens a `review` request).
- `src/board/signals.ts`: `requests` and `asks` are maps of one request per item id; `src/board/model.ts` (`routing`, `derive`, the braid card), `src/board/questions.ts` (the Questions panel), `src/board/programme.ts` (a programme's `pm/<slug>` request), `src/notify/` (one push sequence per item).
- `docs/braids-format.md` "Requests", `docs/cli.md` (`braid ask`, `braid answer`, `braid withdraw`), `docs/board.md`, `docs/decisions.md` D96 and D118.
- `braids/0082-the-questions-panel/`: the panel's brief, report and approved mockups.

## Change

- 0084/A: the record and the CLI.
- 0084/B: mockups of the board with several open questions on one item, on test data; the worker stops for the user's look.
- 0084/C: the board, as the approved mockups show it.
- 0084/D: the docs as a whole, and the skills' lines that state the old rule.

## Already decided

- The goal above, quoted from the user through the PM; "Golden pickle A" (runs now).
- Programme rules, binding: "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to reliable calls like with requests". So no new state or record field: the record already holds any number of requests per item; only the withdrawal in `openRequest` and the board's one-per-item maps go.
- A new question (to the user or the PM, any kind but `review`) never withdraws an open request. A wait (`--to <braid>`) still replaces its asker's open wait to that braid on the item, and a timed wait (`--to self`) its asker's timed wait, as today.
- A `review` request (`braid handover`) replaces only its asker's open `review` request on the item (a new head), never a question; questions stay open beside it.
- The same for both askers and for programme requests (`pm/<slug>`), the case that showed the hole.
- An id alone (`braid answer <id>`, `braid withdraw <id>`) acts only when exactly one request is open for it (with `--by`, of that asker); with several it lists their handles and changes nothing, as `target` already does for a question beside a wait.
- Replacing one's own question is explicit: `braid withdraw <handle> --why "<reason>"`, then `braid ask`. No `--replace` flag.
- Subagents get no parent context: each strand's brief says what its worker needs.
- Board UI changes get mockups on test data first, and the worker stops for the user's look (0084/B).
- A clear user answer to an open request is recorded first (`braid answer`) before anything else.
- Related to 0077 (The board stays fast under load, on `braid/0077-the-board-stays-fast-under-load`): it changes the board's server code and merges into `main` first; this braid merges `main` into its branch before its final PR.
- Related to 0082 (The Questions panel), in `main`: build on its panel, ranking and answer action.
- P5 (Board lanes, Held lane, Hold all; the PM's programme) changes the board's cards and the Questions panel too: this braid merges into `main` before P5's final PR, and the coordinator tells P5's coordinator what 0084/C changes in the cards and the panel.
- P30 (braid clean with submodules) runs at the same time; no overlap expected.

## Out of scope

- A cap on open questions, grouping questions into one, or a replace flag.
- Changing waits, reminders, escalation or the Questions panel's ranking.
- Changing the request record's file format.

## Completion

- [ ] `braid ask` three times on one item leaves three open questions; `braid status`, `braid requests`, the board card and the Questions panel show all three; each is answered by its handle
- [ ] `braid answer <id>` and `braid withdraw <id>` with several open list their handles and change nothing
- [ ] Waits and timed waits keep their rule; a new `review` request replaces only an older `review`
- [ ] A programme's (`pm/<slug>`) and the PM's `--by pm` requests behave the same, in the programmes panel too
- [ ] Docs from BRAID.md `docs` that this braid makes untrue are updated, the skills' lines included (0084/D)
- [ ] The gate command from BRAID.md passes

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
