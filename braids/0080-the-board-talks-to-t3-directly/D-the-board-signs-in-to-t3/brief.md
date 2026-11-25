---
id: '0080/D'
title: "The board signs in to T3"
status: To Do
labels: ["kind:story", "tier:L", "ui", "ask:security", "ask:dependency"]
dependencies: ['0080/A', '0080/B']
order: 40
---

## Goal

The user signs the board in to T3's MCP once with `braid t3 login`, at **Full access**, as 0080/A's report proposes and the user approved (q-b146); the token lives only in the OS secret store through `@napi-rs/keyring`; the board shows whether it is signed in and warns before the fixed 30-day sign-in ends; signed out, refused, or on a host without a secret store, it works as today.

Expected size: about 1,100 lines in 12 files (0080/A's estimate: oauth ~250, secret store ~60, the command ~120, board and page ~180, tests ~450, docs ~40).

## Start here

- `braids/0080-…/A-…/report.md` (0080/A, including "Correction after review") and its `sources.md`: the flow step by step, the token entry, expiry and 401 handling, the threat model, the tests. Build what it describes, with the changes under "Already decided" here.
- `src/t3mcp/` (0080/B): the MCP client the token feeds; its `unauthorized` failure is the signed-out signal.
- `src/commands/board.ts`, `src/board/limits-view.ts` and the board page: where the chips and pushes live (the T3 chip sits with the provider chips).
- `~/.braid/artifacts/braid/p27-t3-tests/t3-src-v0.1.12/McpOAuth.ts`: T3's authorization server.

## Change

- `src/commands/t3.ts` (new): `braid t3 login [--url <origin>] [--allow-remote]`, `braid t3 logout`, `braid t3 status`; usage lines in `src/cli.ts`.
- `src/t3/oauth.ts` (new): discovery, registration as "braid board", PKCE S256, `state` and `iss` checks, the one-off `127.0.0.1` callback (at most 5 minutes), the token exchange, revoke. The authorize URL opened without a shell (not `openWithOs`).
- `src/t3/secret.ts` (new): one entry (service `braid`, account `t3:<origin>`, value `{ token, expiresAt, issuer, mcpUrl, clientId }`) through `@napi-rs/keyring`, loaded with a dynamic `import()` so a missing or broken binary reads as "no secret store"; Linux pinned to Secret Service. A small interface with a fake for tests.
- The board: reads the entry at start, at most once a minute and right after a 401; keeps the token in memory only; hands it to 0080/B's client. A T3 chip, icon-only with the words in the tooltip: `signed in · Full access · until <date>`; amber from 5 days before the end (`T3 sign-in ends on <date>; run braid t3 login`); signed out with the reason (not signed in, refused, ended, no secret store). One push 5 days before the end and one on a 401, each once per sign-in.
- `package.json`: `@napi-rs/keyring` (pinned version), braid's first runtime dependency.
- Tests: a fake T3 authorization server on `127.0.0.1` (metadata, register, authorize, token, revoke): the happy path, a wrong `state`, a wrong or missing `iss`, an expired code, a sign-in below Full access refused, a non-localhost address refused without `--allow-remote` and refused over plain `http` even with it, logout revoking; a fake store (none, locked, present); the board's state from a fake store, a 401 from the mock MCP server (no retry, one push); the token absent from every log, error, API and page output. The real HOME, APPDATA and the real store untouched.
- Mockups first (`ui`): the T3 chip in its four states on demo data; stop for the user's verdict, then build.
- Live check once the build is done: the user runs `braid t3 login` against the real T3 at Full access; then `braid t3 status`; from a test board on another port and a temporary `BRAID_HOME`, `t3_thread_list`, `events/poll`, and `t3_thread_interrupt` `stop: true` on a scratch thread only (`scratch: true`, archived after); revoke "braid board" in T3's Settings and see the board turn signed out with one push; `braid t3 logout`. On Windows also from the board's Task Scheduler task, to confirm it reads the terminal's entry.

## Already decided

- The user, 2026-11-25 (q-b146, through the PM): "Full Access if it's not worse than what we have now" (F1) and "ok" to `@napi-rs/keyring` (F2). The level is Full access, because T3 refuses an OAuth client acting on a thread whose runtime mode ranks above its level (0080/A, S16) and braid's threads run at the project default, some at Full access. No `T3-Mode-Limit` cap.
- The PM, for the user: keep the new exposure small. Only T3's local address (`localhost`, `127.0.0.1`); a non-local address only over `https` and only with the explicit `--allow-remote` flag. The chip's tooltip says `signed in · Full access · until <date>`. `braid t3 logout` revokes the token in T3, not only deletes it locally; if T3 can't be reached it deletes the entry and says to revoke "braid board" in T3's Settings → Sharing & access.
- A CLI sign-in only; no board button (0080/A: no unauthenticated callback route on the board).
- The token never goes on argv, in an environment variable, a file, a log line, the board's page or API, a push or chat. No file, env or prompt fallback when there is no secret store.
- A 401 means signed out until the entry holds a different token; no retry of a refused token. A connection error is T3 down, not signed out.
- The board's own sign-in (its session token, `x-braid-token`) stays as it is; words: "board address" for that, "T3 sign-in" for this.
- Related to 0077 (owns the board's T3 call path): the board-side reads here are asynchronous and stay off the request path (the request path reads snapshots).

## Out of scope

- Using the sign-in to stop threads (0080/E) or read events (0080/F).
- A board sign-in button.

## Completion

- [ ] The user approved the chip mockups before building
- [ ] `braid t3 login|logout|status` work as above against the fake server, refusing a sign-in below Full access and a remote address without `--allow-remote` over https
- [ ] The token is kept only in the OS store through `@napi-rs/keyring` (lazily loaded); no store means signed out and the board as today
- [ ] The board's T3 chip shows the four states with the tooltip words above, and the two pushes go once
- [ ] A 401 turns the board signed out with no retry; `braid t3 logout` revokes in T3
- [ ] Tests prove the token appears in no log, error, API or page output
- [ ] Live check done with the user's sign-in on scratch threads only, or report.md says what is left
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
