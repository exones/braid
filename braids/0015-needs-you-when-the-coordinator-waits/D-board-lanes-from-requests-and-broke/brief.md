---
id: '0015/D'
title: "Board: lanes from requests and broke alarms"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0015/B', '0015/C']
order: 40
---

## Goal

The board and `braid status` show the five states of `../states.md`: an item is on the user's side only through an open request or a "broke" alarm, and the coordinator's own thread never counts as an agent.

Expected size: about 350 to 500 lines in 10 files, with tests.

## Start here

- `../states.md`, and the approved mockups of 0015/B.
- `docs/board.md`; `src/board/model.ts` (`derive`, `toCard`), `src/board/t3.ts` (how threads join items), `src/board/github.ts`, `src/board/demo.ts`, `src/board/marks.ts`.
- `src/commands/coordinate.ts` (`braid status`), `src/commands/start.ts`, `src/commands/done.ts` (the caller skip from 0014/F), the requests store from 0015/C.

## Change

- Lane rules, first match wins: merged PR or stored Done, Done; an open `review` request, To Review; another open request, Needs You with its text; broke (below), Needs You with the reason; started (stored In Progress, a running agent, or an open PR), Working; else To Do. An open PR without a review request is Working: the agents still have it.
- Broke, shown only after the condition has held for 10 minutes (the time it was first seen is kept under `.braid/`): `checks failed` (a PR's checks are red and no agent of the item runs) and `stalled` (stored In Progress, no open request, no running agent, no checks pending).
- Agents of an item: only threads whose worktree braid created for it. `braid start <id> --review` adds the reviewer's detached checkout of the PR head in `<repo>/<number>-<letter>-review`; `braid clean` removes it. A thread on a braid branch that has strands is the coordinator and is never counted: not for the lane, not for a strand's wrench, and `braid done` no longer needs the caller skip to pass.
- T3 is read only for "is an agent of this item running" and a running agent's pending question (which is Needs You, `question`, as today).
- A braid shows the most urgent of its strands and its own requests.
- Cards and `braid status` show the request's one-line text and age, as in the mockups. `braid board --demo` covers every state and reason.
- `docs/board.md` rewritten for the new rules; a decision in `docs/decisions.md` replacing the lane rules of D32 where they differ; screenshots in `docs/design/board-screenshots/`.

## Already decided

- Lanes: To Do, Working, To Review, Needs You, Done; the 10-minute delay (user, 2026-11-15).
- `ask:<key>` labels stay a flag only.

## Out of scope

- The skills (0015/E). Requests across machines.

## Acceptance

- [ ] Each lane rule and both broke alarms are covered by tests with fake GitHub, T3 and requests, including: review running on a reviewer checkout (Working), a coordinator on the braid branch alone (not Working), a condition shorter than 10 minutes (no alarm)
- [ ] `braid start <id> --review` creates the reviewer's checkout and `braid clean` removes it
- [ ] The board matches the approved mockups; the demo shows every state and reason
- [ ] `braid status` prints the same state, reason and request text as the board

## Definition of done

- [ ] The gate command from BRAID.md passes
- [ ] report.md written, with screenshots of the built board embedded
