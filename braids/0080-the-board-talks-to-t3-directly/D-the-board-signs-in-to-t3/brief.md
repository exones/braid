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

- `src/commands/t3.ts` (new): `braid t3 login [--url <origin>]`, `braid t3 logout`, `braid t3 status` (also prints the two settings), `braid t3 set --access auto|cli --local-only on|off`; usage lines in `src/cli.ts`.
- `~/.braid/t3.json` (new, machine-level, like `notify.json`; no secret in it): the user's two settings, nothing more. `access`: `auto` (the default: the signed-in MCP access when signed in, otherwise the `t3` command line) or `cli` (always the command line as today, even when signed in). `localOnly`: `true` by default (only `localhost` or `127.0.0.1`); `false` allows a non-local T3 address, still `https` only. A missing or unreadable file means the defaults.
- `src/t3/oauth.ts` (new): discovery, registration as "braid board", PKCE S256, `state` and `iss` checks, the one-off `127.0.0.1` callback (at most 5 minutes), the token exchange, revoke. The authorize URL opened without a shell (not `openWithOs`).
- `src/t3/secret.ts` (new): one entry (service `braid`, account `t3:<origin>`, value `{ token, expiresAt, issuer, mcpUrl, clientId }`) through `@napi-rs/keyring`, loaded with a dynamic `import()` so a missing or broken binary reads as "no secret store"; Linux pinned to Secret Service. A small interface with a fake for tests.
- The board: reads the entry at start, at most once a minute and right after a 401; keeps the token in memory only; hands it to 0080/B's client. A T3 chip, icon-only with the words in the tooltip: `signed in · Full access · until <date>`; amber from 5 days before the end (`T3 sign-in ends on <date>; run braid t3 login`); signed out with the reason (not signed in, refused, ended, no secret store). One push 5 days before the end and one on a 401, each once per sign-in.
- The T3 button (the same chip, top right next to the provider chips, icon-only): signed out, its tooltip says "Sign in to T3"; signed in, it shows the state ("Full access · until <date>") and offers sign-out (revoking in T3, as `braid t3 logout`). On the host, a click (token-checked like every board action) starts the same OAuth flow as `braid t3 login` in the board process and opens T3's approval page in that browser; T3 redirects back to the board's own loopback callback. From the phone (Tailscale or any non-loopback origin) the click starts nothing; the tooltip or panel says "Sign in from the board on the PC, or run `braid t3 login`".
- The board's callback route (`/t3/callback` or similar): reachable on loopback only; accepts only an answer carrying the `state` the board generated for that click, then exchanges the code with that click's PKCE verifier; single use; expires after 5 minutes; anything else answers 404. It needs no board token, so this is the only board route without one, and it does nothing without a live pending sign-in. No token or code in logs or the page.
- `package.json`: `@napi-rs/keyring` (pinned version), braid's first runtime dependency.
- Tests: a fake T3 authorization server on `127.0.0.1` (metadata, register, authorize, token, revoke): the happy path, a wrong `state`, a wrong or missing `iss`, an expired code, a sign-in below Full access refused, a non-local address refused while `localOnly` is on and refused over plain `http` when it is off, logout revoking; `access: cli` keeping the board on the command line while signed in; a fake store (none, locked, present); the board's state from a fake store, a 401 from the mock MCP server (no retry, one push); the token absent from every log, error, API and page output. The real HOME, APPDATA and the real store untouched.
- Mockups first (`ui`): the T3 button in its four states on demo data, its tooltips and the phone's "sign in from the PC" text; stop for the user's verdict, then build.
- Live check once the build is done: the user runs `braid t3 login` against the real T3 at Full access; then `braid t3 status`; from a test board on another port and a temporary `BRAID_HOME`, `t3_thread_list`, `events/poll`, and `t3_thread_interrupt` `stop: true` on a scratch thread only (`scratch: true`, archived after); revoke "braid board" in T3's Settings and see the board turn signed out with one push; `braid t3 logout`. On Windows also from the board's Task Scheduler task, to confirm it reads the terminal's entry.

## Already decided

- The user, 2026-11-25 (q-b146, through the PM): "Full Access if it's not worse than what we have now" (F1) and "ok" to `@napi-rs/keyring` (F2). The level is Full access, because T3 refuses an OAuth client acting on a thread whose runtime mode ranks above its level (0080/A, S16) and braid's threads run at the project default, some at Full access. No `T3-Mode-Limit` cap.
- The PM, for the user: keep the new exposure small. Only T3's local address (`localhost`, `127.0.0.1`) by default; a non-local address only over `https`.
- The user's addition to q-b146 (2026-11-25, through the PM): "it should be a setting in the braid whether to use command line or access and I like your gating only for local address again should be in settings". So two machine-level settings in `~/.braid/t3.json` (the board serves several projects, so not per-project `BRAID.md`): `access` (`auto` by default, `cli` forces the command line) and `localOnly` (on by default). These two only, no more. The chip's tooltip says `signed in · Full access · until <date>`. `braid t3 logout` revokes the token in T3, not only deletes it locally; if T3 can't be reached it deletes the entry and says to revoke "braid board" in T3's Settings → Sharing & access.
- The user, 2026-11-25, through the PM: "so then there should be a button to sign in to T3 top-right-corner I guess...", then "G. a" to the design above (button on the host, loopback-only callback bound to the click's state and PKCE, nothing from the phone). This replaces 0080/A's "no board button" recommendation; `braid t3 login` stays.
- The token never goes on argv, in an environment variable, a file, a log line, the board's page or API, a push or chat. No file, env or prompt fallback when there is no secret store.
- A 401 means signed out until the entry holds a different token; no retry of a refused token. A connection error is T3 down, not signed out.
- The board's own sign-in (its session token, `x-braid-token`) stays as it is; words: "board address" for that, "T3 sign-in" for this.
- Related to 0077 (owns the board's T3 call path): the board-side reads here are asynchronous and stay off the request path (the request path reads snapshots).

## Out of scope

- Using the sign-in to stop threads (0080/E) or read events (0080/F).

## Plan

1. Mockups (`mockups/t3-button.html`, `t3-button-full.png`) on demo data: the button's place, the four states and tooltips, the click panels on the host, the phone sheet, the two pushes, `braid t3 status`. Stop for the user's verdict.
2. After approval: `src/t3/settings.ts` (`~/.braid/t3.json`, defaults on any read failure), `src/t3/secret.ts` (lazy `@napi-rs/keyring`, a fake for tests), `src/t3/oauth.ts` (discovery, registration, PKCE, state/iss, loopback callback, exchange, revoke; the URL opened without a shell).
3. `src/commands/t3.ts`: `login|logout|status|set`, usage lines in `src/cli.ts`.
4. The board: a sign-in reader (start, at most once a minute, after a 401; token in memory only) feeding 0080/B's client; the state in `/api/all` without the token; the two pushes once per sign-in; the button's POST routes (token-checked, loopback-only for sign-in) and the loopback-only `/t3/callback`.
5. The page: the button, tooltip and panel (desktop) and sheet (phone), from the approved mockups.
6. Tests (fake authorization server, fake store, mock MCP 401, token-leak checks) plus leftover 2026-11-26-7wrg in `src/t3mcp` (a refused redirect, a bare 5xx, `token()` read once).
7. Docs (`docs/cli.md`, `docs/board.md`, `docs/decisions.md`), the gate, the PR; the live check with the user.

## Completion

- [x] The user approved the button mockups before building
- [x] `braid t3 login|logout|status|set` work as above against the fake server, refusing a sign-in below Full access, and a non-local address while `localOnly` is on or over plain `http`
- [x] The two settings in `~/.braid/t3.json` (`access` auto or cli, `localOnly` on or off) decide how the board talks to T3; defaults auto and on
- [x] The token is kept only in the OS store through `@napi-rs/keyring` (lazily loaded); no store means signed out and the board as today
- [x] The board's T3 button shows the four states with the tooltip words above, and the two pushes go once
- [x] The button signs in from the host through the board's callback, which tests show answers 404 to anything but the pending click's own `state` (wrong state, reused, expired, non-loopback); from a non-loopback origin it starts nothing
- [x] A 401 turns the board signed out with no retry; `braid t3 logout` revokes in T3
- [x] Tests prove the token appears in no log, error, API or page output
- [x] Live check done with the user's sign-in on scratch threads only, or report.md says what is left
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
