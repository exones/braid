---
id: '0070/A'
title: "The request record on its own branch"
status: To Do
labels: ["kind:task", "tier:L"]
dependencies: []
order: 10
---
## Goal

Requests move from the local, never-committed `.braid/requests.json` to the branch `braid-requests`, one file per request with a short code and a history that only grows, in the form the braid's "Already decided" fixes. Every command and reader that uses requests today works on the new record with the same behaviour, except that nothing is deleted any more: a closed request keeps its file with a final state. Open requests in an existing `.braid/requests.json` are carried over once.

Expected size: about 600 lines in 8 files, half of them tests.

## Start here

- The braid's brief (`braid view 0070`), "Already decided": the record's form, its fields, codes and states.
- `src/inbox/branch.ts`: fetch, read without a checkout, write with hash-object, a temporary index, commit-tree and update-ref, push as a fast-forward, fetch and redo on refusal, offline writes kept local.
- `src/braids/requests.ts`: the `Request` type, `openRequest`, `closeRequest`, `forwardRequest`, `liveRequests` and `filterLive` (review requests voided by their PR), the lock.
- The callers: `src/commands/requests.ts`, `src/commands/start.ts` and `src/commands/done.ts` (`closeRequest`), `src/board/signals.ts` (`loadRequests`, `filterLive`).

## Change

- A shared branch module (moved out of `src/inbox/branch.ts`, parametrised by branch and folder) used by both the inbox and the record; the inbox keeps its behaviour and tests.
- `src/braids/requests.ts`: the record on `braid-requests` (`requests/<code>.json`, `events`), codes, states `open`, `answered`, `withdrawn`, `met`; reads from the local branch ref, fetched as the inbox is; opening a request from the same asker on the same item withdraws the open one ("replaced by q-…").
- Review requests: a merged PR records `met`, a closed PR or a moved head records `withdrawn` with the reason, at the same points where they are dropped today; the board's read stays pure and the write happens where `liveRequests` writes today.
- `braid start`, `braid done` and `braid answer` close through the record (an event, not a delete), with the closer named (`coordinator`, `board` and so on; who answered is 0070/B's).
- Migration: on the first read or write that finds `.braid/requests.json` with records, each one is opened on the branch with a code and its original times, and the file is renamed (kept, not deleted). Once.
- `braid requests` prints each open request's code first; the rest of its line as today.
- Tests: `test/` for the store and the commands (the record round trip, codes unique, replace withdraws, review met and withdrawn, migration once, concurrent writes from two worktrees, a refused push redone, offline write kept local, inbox tests unchanged).

## Already decided

- The record's form is the braid's "Already decided"; this strand builds it. The fields 0070/B fills (who answered, the PM's reason, "done when", `eta`) exist in the type from here, empty.
- Readers that only list (the board, `braid requests`) never push or fetch inside a lock, as the inbox's readers don't.
- The board reads the record from the local branch ref, with fetches throttled as the inbox's are, so a slow `git fetch` never stalls a page load (the PM). Measure the board's page-load time before and after and put both in `report.md`.
- Push failures never fail a command that opened or closed a request: offline, the commit stays on the local branch, as for the inbox.

## Out of scope

- New verbs and flags (`braid answer` by code, `--from`, withdraw, show, `--done-when`): 0070/B.
- Board and push display of codes and answers: 0070/C.
- Skills: 0070/D.

## Failure modes and required regression tests

- Two commands write the record at once (two worktrees, or the board and a coordinator): both events land; neither is lost or overwritten. Test it.
- The push is refused because `origin/braid-requests` moved: fetched and redone on top, as the inbox does. Test it.
- No remote, or offline: the request opens locally and the next write pushes it. Test it.
- A half-written migration (the process dies after some records are written): running again doesn't duplicate them. Test it.
- A request file that doesn't parse: it is reported and skipped, the others still read. Test it.

## Completion

- [ ] Requests are stored on `braid-requests` as `requests/<code>.json` with an `events` history, and no request is ever deleted
- [ ] `braid ask`, `handover`, `answer`, `forward`, `requests`, `start`, `done` and the board work on the record with today's behaviour, and `braid requests` shows each code
- [ ] Review requests record `met` or `withdrawn` with a reason instead of vanishing
- [ ] Open requests in an old `.braid/requests.json` are carried over once, and the old file is kept renamed
- [ ] The inbox and the record share one branch module, and the inbox tests pass unchanged
- [ ] The regression tests listed under "Failure modes" exist and pass
- [ ] report.md gives the board's page-load time before and after
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
