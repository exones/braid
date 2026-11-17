---
id: '0009/B'
title: "Write path and session token"
status: Done
labels: ["kind:task", "tier:M"]
dependencies: []
order: 20
---

## Goal

The board server accepts actions safely: POST endpoints that only the board page opened by this `braid board` run can call.

Expected size: about 250 lines in 5 files, with tests.

## Start here

- `src/commands/board.ts` (`startBoardWith`, the GET-only check, `api()`, `runBoard`), `web/src/api.ts`.
- `test/board.test.ts` ("the server binds to 127.0.0.1 only").
- `docs/board.md` (it says the board is read-only), `docs/decisions.md` D40.

## Change

- A random token per `braid board` run, in the URL the command opens and prints (`#token=…`, so it never reaches a server log or `Referer`). The page keeps it in `sessionStorage` and sends it in a header with every action.
- `POST /api/action/<name>`: refused with 403 without the right token, or with an `Origin` or `Host` that isn't this board's `127.0.0.1:<port>`; 405 for other methods as today. Actions are registered by name; this strand adds none that changes anything, only a test action.
- `--demo` boards accept actions and fake their results (for the mockups' states).
- `docs/board.md`: what the board writes now and how the token works; a decision in `docs/decisions.md`.

## Out of scope

- The actions themselves (C, D). Network access (0012).

## Plan

Token and action endpoint in `startBoardWith` (Host, Origin and token checks, registry via `Sources.action`); `postAction` and fragment handling in `web/src/api.ts`; tests in `test/board-actions.test.ts`; docs and D50.

## Completion

- [x] A POST without the token, with a wrong token, or with a foreign `Origin` or `Host` is refused (tested); with the token it reaches the action (tested)
- [x] The token appears only in the opened URL's fragment and the page's session storage
- [x] `docs/board.md` and a decision describe it
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
