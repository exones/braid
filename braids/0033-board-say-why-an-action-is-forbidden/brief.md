---
id: '0033'
title: "Board: say why an action is forbidden"
status: In Progress
labels: ["kind:story", "tier:S"]
dependencies: []
delivery: epic
---

## Goal

When the board refuses an action (Start, Merge, Open thread), the user sees why and what to do, not a bare `forbidden`. The user hit it on Start coordinator for 0029: the dialog showed only `forbidden`. On the local listener this almost always means the page has no token, or one from an earlier `braid board` run (a second tab, a tab kept across a board restart on the same `--port`), which D50 refuses by design.

Expected size: about 80 lines in 4 files, tests included.

## Start here

- `src/commands/board.ts`: `postAction` (two 403s with the same `forbidden` body: Host/Origin, then token or `x-braid-request`) and the Tailscale gate's plain-text 403 in `startBoardWith`.
- `web/src/api.ts`: `sessionToken` and `postAction`, which shows the server's `error` text.
- `docs/board.md`, "Actions and the session token" and "On Tailscale"; D50 and D60 in `docs/decisions.md`.
- `test/board-actions.test.ts` and `test/board-tailnet.test.ts`: the 403 cases.

## Change

- `src/commands/board.ts`: each 403 of `postAction` says which check failed and what to do, for example: no token: "This page has no token for this board run; open the URL `braid board` printed"; wrong token: "This page's token is from another `braid board` run; open the URL it printed now"; Host or Origin: that the request didn't come from this board's page. On the Tailscale listener a missing `x-braid-request` header says so. Status stays 403; no secret (token or its parts) is echoed.
- `web/src/api.ts` (optional, if it stays small): when the page has no token on the local listener, the action's error says so without a round trip; the server text stays the source of truth.
- Tests for each reason; `docs/board.md` names the reasons.

## Already decided

- D50 and D60 stay as they are: same checks, same order, still 403. Only the reply text changes.
- The token stays only in the opened URL's fragment and `sessionStorage`; the board never hands it to a page that lacks it.
- The Tailscale gate's whois/Host refusal (plain-text `forbidden` before any action) may stay terse: it answers a peer that isn't the user.

## Out of scope

- Recovering the token automatically, a new action, or button states on the board.
- 0011 (Reports and several agents), which also touches Start: no overlap in these lines.

## Plan

Split the two 403s in `postAction` into four reasons (Host/Origin, missing `x-braid-request` on Tailscale, no token, wrong token), each with a fix in the text; tests per reason, including that the token isn't echoed; list them in `docs/board.md`. `web/src/api.ts` stays unchanged: the page already shows the server's `error`, and it sends an empty token header when it has none, which the server treats as missing.

## Completion

- [x] Each 403 of `POST /api/action/<name>` names the failed check and the fix (missing token, wrong token, Host/Origin, missing `x-braid-request`), and none contains the token (tests)
- [x] The Start dialog shows that text instead of `forbidden` when the token is missing (test of the reply the page shows, or a demo screenshot in the report)
- [x] `docs/board.md` lists the reasons
- [x] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
